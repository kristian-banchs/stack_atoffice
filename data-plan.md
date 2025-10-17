# Data & Architecture Plan

This document outlines the LEAN data fetching strategy, UI/UX structure, and implementation plan for the File Picker with **bulk selection**.

---

## Directory Structure (LEAN!)

```
app/
  page.tsx                          # Login screen
  dashboard/
    page.tsx                        # File picker dashboard
  layout.tsx                        # Root layout + Tanstack Query provider
  globals.css                       # Global styles

lib/
  api.ts                            # ALL API calls in one file (~250 lines)
  hooks.ts                          # ALL hooks in one file (~400 lines)
  types.ts                          # ALL types in one file (~100 lines)
  utils.ts                          # Helper functions (~100 lines)

components/
  auth/
    login-form.tsx                  # Login form component

  file-picker/
    file-picker-modal.tsx           # Main modal container with edit mode
    sidebar.tsx                     # Left nav (stub for now)
    file-browser.tsx                # Tree container with selection state
    tree-node.tsx                   # Recursive tree node with checkbox

  ui/                               # Shadcn components
    button.tsx
    card.tsx
    input.tsx
    label.tsx
    badge.tsx
    skeleton.tsx
    separator.tsx
    checkbox.tsx
    sonner.tsx (toast)
```

**Total custom components: 5**
**Total lib files: 4**
**Estimated total lines: ~950**

---

## Bulk Selection Strategy

### Core Principle: Clean on Select, Compute on Render

**State**: Only store top-level selections (never redundant children)
```typescript
selections: Map<string, Selection> = {
  'folder-id' => { path: 'clients', type: 'directory' }
  // Children NOT stored - computed as checked/disabled
}
```

**Benefits**:
- State always clean (no post-processing needed)
- Submission is trivial: `Array.from(selections.keys())`
- Scales to large trees (1000 files = 1 folder in state)
- O(1) submission instead of O(n²) cleaning

---

## UI/UX Flow

### Normal Mode
- Browse tree
- See status indicators (green checkmarks)
- No checkboxes visible

### Edit Mode (Click "Edit Files")
1. Checkboxes appear on all files/folders
2. Pre-check indexed items (visible ones)
3. User selects/deselects items
4. Click "Save" → Submit cleaned selections
5. Exit edit mode → Show pending/indexing status

---

## Selection Logic Implementation

### Core Functions

```typescript
// Check if resource is selected (explicit or inherited)
function isResourceChecked(
  resource: MergedResource,
  selections: Map<string, Selection>
): boolean {
  // 1. Explicitly selected?
  if (selections.has(resource.resource_id)) return true

  // 2. Any ancestor folder selected?
  return Array.from(selections.values()).some(selection => {
    if (selection.type !== 'directory') return false
    return resource.inode_path.path.startsWith(selection.fullPath + '/')
  })
}

// Check if resource checkbox should be disabled (inherited from parent)
function isResourceDisabled(
  resource: MergedResource,
  selections: Map<string, Selection>
): boolean {
  // Only disabled if checked via parent (not explicit selection)
  if (selections.has(resource.resource_id)) return false

  // Check if inherited from parent
  return Array.from(selections.values()).some(selection => {
    if (selection.type !== 'directory') return false
    return resource.inode_path.path.startsWith(selection.fullPath + '/')
  })
}

// Toggle selection (clean on select)
function handleToggleSelection(
  resource: MergedResource,
  selections: Map<string, Selection>
): Map<string, Selection> {
  const next = new Map(selections)

  // Case 1: Resource is explicitly selected - UNCHECK IT
  if (selections.has(resource.resource_id)) {
    next.delete(resource.resource_id)
    // Children automatically become unchecked (computed)
    return next
  }

  // Case 2: Resource is inherited (disabled) - DO NOTHING
  if (isResourceDisabled(resource, selections)) {
    return next // Checkbox is disabled, can't click
  }

  // Case 3: Resource is not selected - CHECK IT

  // Step 1: Remove any descendants (they'll be covered by this)
  if (resource.inode_type === 'directory') {
    Array.from(selections.entries()).forEach(([id, sel]) => {
      if (sel.fullPath.startsWith(resource.inode_path.path + '/')) {
        next.delete(id)
      }
    })
  }

  // Step 2: Remove any ancestors (this is more specific)
  Array.from(selections.entries()).forEach(([id, sel]) => {
    if (sel.type === 'directory' &&
        resource.inode_path.path.startsWith(sel.fullPath + '/')) {
      next.delete(id)
    }
  })

  // Step 3: Add this resource
  next.set(resource.resource_id, {
    resource_id: resource.resource_id,
    fullPath: resource.inode_path.path,
    type: resource.inode_type
  })

  return next
}
```

---

## Selection Behavior Examples

### Example 1: Select Folder
```
User clicks folder checkbox:

Before:
  selections = {}

After:
  selections = { 'clients-id': { path: 'clients', type: 'directory' } }

Visual:
  ☑ clients (checked, enabled)
    ☑ project-alpha (checked, DISABLED - inherited)
    ☑ file.txt (checked, DISABLED - inherited)

Submission:
  ['clients-id'] ← Only folder ID, children excluded automatically
```

### Example 2: Select Child, Then Parent
```
User checks child, then checks parent:

Step 1:
  selections = { 'file-id': { path: 'clients/file.txt', type: 'file' } }

Step 2 (check parent):
  - Remove 'file-id' (descendant of parent)
  - Add 'clients-id'
  selections = { 'clients-id': { path: 'clients', type: 'directory' } }

Visual:
  ☑ clients (checked, enabled)
    ☑ file.txt (checked, DISABLED - inherited now)

Submission:
  ['clients-id'] ← Clean!
```

### Example 3: Select Parent, Then Uncheck It
```
User checks folder, then unchecks it:

Step 1:
  selections = { 'clients-id': { path: 'clients', type: 'directory' } }

  ☑ clients
    ☑ project-alpha (disabled)
    ☑ file.txt (disabled)

Step 2 (uncheck clients):
  selections = {}

  ☐ clients
    ☐ project-alpha (now enabled)
    ☐ file.txt (now enabled)

Submission:
  [] ← Nothing selected
```

### Example 4: Try to Uncheck Inherited Child
```
Initial:
  selections = { 'clients-id': { path: 'clients', type: 'directory' } }

  ☑ clients (enabled)
    ☑ file.txt (DISABLED - can't click)

User clicks file.txt checkbox:
  → Nothing happens (disabled)

To uncheck file.txt:
  1. Uncheck parent "clients" folder
  2. Manually check individual items you want
```

---

## Pre-check Strategy (Initial Edit Mode)

When entering edit mode, pre-check visible indexed items:

```typescript
function initializeSelections(resources: MergedResource[]): Map<string, Selection> {
  const initial = new Map<string, Selection>()

  resources.forEach(resource => {
    // Only pre-check if indexed
    if (resource.indexStatus === 'indexed' ||
        resource.indexStatus === 'being_indexed') {

      // Only add if no parent is already added
      const hasParent = Array.from(initial.values()).some(sel => {
        return sel.type === 'directory' &&
               resource.inode_path.path.startsWith(sel.fullPath + '/')
      })

      if (!hasParent) {
        initial.set(resource.resource_id, {
          resource_id: resource.resource_id,
          fullPath: resource.inode_path.path,
          type: resource.inode_type
        })
      }
    }
  })

  return initial
}

// Usage
useEffect(() => {
  if (isEditMode) {
    setSelections(initializeSelections(resources))
  }
}, [isEditMode, resources])
```

**Note**: Only visible/expanded items are pre-checked. As user expands folders, indexed children will show checkmarks naturally.

---

## Component Implementation

### 1. File Picker Modal (with Edit Mode)

```tsx
const FilePickerModal = () => {
  const [isEditMode, setIsEditMode] = useState(false)
  const [selections, setSelections] = useState<Map<string, Selection>>(new Map())

  const { mutate: updateKB, isPending } = useUpdateKB(token, kbId, orgId)

  const handleSave = () => {
    const resourceIds = Array.from(selections.keys())

    updateKB(resourceIds, {
      onSuccess: () => {
        setIsEditMode(false)
        toast.success('Knowledge Base updated. Indexing started.')
      },
      onError: () => {
        toast.error('Failed to update Knowledge Base')
      }
    })
  }

  const handleCancel = () => {
    setIsEditMode(false)
    setSelections(new Map()) // Reset selections
  }

  return (
    <div className="bg-white rounded-lg shadow-lg h-[calc(100vh-3rem)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/google-drive-icon.svg" className="w-5 h-5" />
          <span className="font-semibold">Google Drive</span>
          <Badge variant="secondary">Beta</Badge>
        </div>

        {/* Edit/Save buttons */}
        <div className="flex gap-2">
          {!isEditMode ? (
            <Button onClick={() => setIsEditMode(true)} variant="outline" size="sm">
              Edit Files
            </Button>
          ) : (
            <>
              <Button
                onClick={handleSave}
                disabled={isPending}
                size="sm"
              >
                {isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* File browser */}
      <div className="flex-1 overflow-auto">
        <FileBrowser
          isEditMode={isEditMode}
          selections={selections}
          setSelections={setSelections}
        />
      </div>
    </div>
  )
}
```

---

### 2. File Browser (with Selection State)

```tsx
interface FileBrowserProps {
  isEditMode: boolean
  selections: Map<string, Selection>
  setSelections: (selections: Map<string, Selection>) => void
}

const FileBrowser = ({ isEditMode, selections, setSelections }: FileBrowserProps) => {
  const { token, connectionId, kbId } = useAppContext()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const { resources, isLoading } = useMergedResources(
    token,
    connectionId,
    kbId,
    null, // root
    '', // empty path
  )

  // Pre-check indexed items when entering edit mode
  useEffect(() => {
    if (isEditMode && resources) {
      setSelections(initializeSelections(resources))
    }
  }, [isEditMode, resources])

  if (isLoading) {
    return (
      <div className="px-6 py-4 space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  return (
    <div className="px-6 py-4">
      {resources.map(resource => (
        <TreeNode
          key={resource.resource_id}
          resource={resource}
          depth={0}
          expandedFolders={expandedFolders}
          setExpandedFolders={setExpandedFolders}
          isEditMode={isEditMode}
          selections={selections}
          onToggleSelection={(res) => {
            setSelections(handleToggleSelection(res, selections))
          }}
        />
      ))}
    </div>
  )
}
```

---

### 3. Tree Node (with Checkbox)

```tsx
interface TreeNodeProps {
  resource: MergedResource
  depth: number
  expandedFolders: Set<string>
  setExpandedFolders: (folders: Set<string>) => void
  isEditMode: boolean
  selections: Map<string, Selection>
  onToggleSelection: (resource: MergedResource) => void
}

const TreeNode = ({
  resource,
  depth,
  expandedFolders,
  setExpandedFolders,
  isEditMode,
  selections,
  onToggleSelection
}: TreeNodeProps) => {
  const { token, connectionId, kbId } = useAppContext()
  const isExpanded = expandedFolders.has(resource.resource_id)
  const fileName = resource.inode_path.path.split('/').pop() || resource.inode_path.path

  // Compute checkbox state
  const isChecked = isResourceChecked(resource, selections)
  const isDisabled = isResourceDisabled(resource, selections)

  // Fetch children only if expanded
  const { resources: children, isLoading } = useMergedResources(
    token,
    connectionId,
    kbId,
    resource.inode_type === 'directory' ? resource.resource_id : null,
    resource.inode_path.path,
    { enabled: isExpanded && resource.inode_type === 'directory' }
  )

  const toggleExpand = () => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(resource.resource_id)) {
        next.delete(resource.resource_id)
      } else {
        next.add(resource.resource_id)
      }
      return next
    })
  }

  return (
    <div>
      {/* Node row */}
      <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-50 rounded group">
        {/* Checkbox (edit mode only) */}
        {isEditMode && (
          <Checkbox
            checked={isChecked}
            disabled={isDisabled}
            onCheckedChange={() => {
              if (!isDisabled) {
                onToggleSelection(resource)
              }
            }}
          />
        )}

        {/* Expand arrow (folders only) */}
        {resource.inode_type === 'directory' && (
          <button
            onClick={toggleExpand}
            className="w-4 text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? '▾' : '▸'}
          </button>
        )}

        {/* Icon */}
        <span className="text-lg">
          {resource.inode_type === 'directory' ? '📁' : '📄'}
        </span>

        {/* Name */}
        <span className="flex-1 text-sm">{fileName}</span>

        {/* Status indicator (not in edit mode) */}
        {!isEditMode && resource.indexStatus === 'indexed' && (
          <span className="text-green-500 text-sm">✓</span>
        )}

        {!isEditMode && resource.indexStatus === 'pending' && (
          <Badge variant="secondary" className="text-xs">Pending</Badge>
        )}

        {!isEditMode && resource.indexStatus === 'being_indexed' && (
          <Badge variant="secondary" className="text-xs">Indexing...</Badge>
        )}

        {/* Inherited indicator (in edit mode) */}
        {isEditMode && isDisabled && (
          <span className="text-xs text-muted-foreground">(from parent)</span>
        )}
      </div>

      {/* Recursive children */}
      {isExpanded && resource.inode_type === 'directory' && (
        <div style={{ paddingLeft: '1.5rem' }}>
          {isLoading ? (
            <>
              <Skeleton className="h-6 w-full mb-1" />
              <Skeleton className="h-6 w-full" />
            </>
          ) : (
            children?.map(child => (
              <TreeNode
                key={child.resource_id}
                resource={child}
                depth={depth + 1}
                expandedFolders={expandedFolders}
                setExpandedFolders={setExpandedFolders}
                isEditMode={isEditMode}
                selections={selections}
                onToggleSelection={onToggleSelection}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
```

---

## Utility Functions (`lib/utils.ts`)

```typescript
import type { MergedResource, Selection } from './types'

export function isResourceChecked(
  resource: MergedResource,
  selections: Map<string, Selection>
): boolean {
  if (selections.has(resource.resource_id)) return true

  return Array.from(selections.values()).some(selection => {
    if (selection.type !== 'directory') return false
    return resource.inode_path.path.startsWith(selection.fullPath + '/')
  })
}

export function isResourceDisabled(
  resource: MergedResource,
  selections: Map<string, Selection>
): boolean {
  if (selections.has(resource.resource_id)) return false

  return Array.from(selections.values()).some(selection => {
    if (selection.type !== 'directory') return false
    return resource.inode_path.path.startsWith(selection.fullPath + '/')
  })
}

export function handleToggleSelection(
  resource: MergedResource,
  selections: Map<string, Selection>
): Map<string, Selection> {
  const next = new Map(selections)

  // Case 1: Explicitly selected - uncheck it
  if (selections.has(resource.resource_id)) {
    next.delete(resource.resource_id)
    return next
  }

  // Case 2: Inherited (disabled) - do nothing
  if (isResourceDisabled(resource, selections)) {
    return next
  }

  // Case 3: Not selected - check it

  // Remove descendants
  if (resource.inode_type === 'directory') {
    Array.from(selections.entries()).forEach(([id, sel]) => {
      if (sel.fullPath.startsWith(resource.inode_path.path + '/')) {
        next.delete(id)
      }
    })
  }

  // Remove ancestors
  Array.from(selections.entries()).forEach(([id, sel]) => {
    if (sel.type === 'directory' &&
        resource.inode_path.path.startsWith(sel.fullPath + '/')) {
      next.delete(id)
    }
  })

  // Add this resource
  next.set(resource.resource_id, {
    resource_id: resource.resource_id,
    fullPath: resource.inode_path.path,
    type: resource.inode_type
  })

  return next
}

export function initializeSelections(
  resources: MergedResource[]
): Map<string, Selection> {
  const initial = new Map<string, Selection>()

  resources.forEach(resource => {
    if (resource.indexStatus === 'indexed' ||
        resource.indexStatus === 'being_indexed') {

      const hasParent = Array.from(initial.values()).some(sel => {
        return sel.type === 'directory' &&
               resource.inode_path.path.startsWith(sel.fullPath + '/')
      })

      if (!hasParent) {
        initial.set(resource.resource_id, {
          resource_id: resource.resource_id,
          fullPath: resource.inode_path.path,
          type: resource.inode_type
        })
      }
    }
  })

  return initial
}
```

---

## Types (`lib/types.ts`)

```typescript
// API Response Types
export interface ConnectionResource {
  resource_id: string
  inode_path: {
    path: string // Full path: "clients/project-alpha/file.txt"
  }
  inode_type: 'file' | 'directory'
}

export interface KBResource extends ConnectionResource {
  status: 'pending' | 'being_indexed' | 'indexed'
}

export interface ConnectionResourcesResponse {
  data: ConnectionResource[]
  next_cursor: string | null
  current_cursor: string | null
}

export interface KBResourcesResponse {
  data: KBResource[]
  next_cursor: string | null
  current_cursor: string | null
}

// Internal Types
export type IndexStatus = 'not_indexed' | 'pending' | 'being_indexed' | 'indexed'

export interface MergedResource extends ConnectionResource {
  indexStatus: IndexStatus
}

export interface Selection {
  resource_id: string
  fullPath: string  // "clients/project-alpha"
  type: 'file' | 'directory'
}

export interface AuthResponse {
  access_token: string
}
```

---

## API Update Function (`lib/api.ts`)

```typescript
// Knowledge Base Update
export async function updateKB(
  token: string,
  kbId: string,
  resourceIds: string[]
) {
  // Try PATCH first (if supported)
  const response = await fetch(`${BASE_URL}/knowledge_bases/${kbId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      connection_source_ids: resourceIds // Replaces entire array
    })
  })

  if (!response.ok) {
    // If PATCH not supported, try PUT or handle error
    throw new Error('Failed to update KB')
  }

  return response.json()
}

export async function syncKB(token: string, kbId: string, orgId: string) {
  return fetch(`${BASE_URL}/knowledge_bases/sync/trigger/${kbId}/${orgId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}
```

---

## Hook for Update (`lib/hooks.ts`)

```typescript
export function useUpdateKB(token: string | null, kbId: string, orgId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (resourceIds: string[]) => {
      await updateKB(token!, kbId, resourceIds)
      await syncKB(token!, kbId, orgId)
    },
    onMutate: async (resourceIds) => {
      // Optimistic update: mark all as "pending"
      // TODO: Implement optimistic update for better UX
    },
    onSuccess: () => {
      // Refetch KB resources to get real status
      queryClient.invalidateQueries({ queryKey: ['kb-resources'] })
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-resources'] })
    }
  })
}
```

---

## Shadcn Components to Install

```bash
# Login
npx shadcn@latest add card input label button

# File picker
npx shadcn@latest add badge separator skeleton checkbox sonner
```

---

## Implementation Plan

### Phase 1: Setup (30 min)
1. Install Tanstack Query: `npm install @tanstack/react-query`
2. Install Shadcn components (listed above)
3. Set up QueryClientProvider in layout.tsx
4. Set up Toaster from Sonner

### Phase 2: Authentication (2 hours)
1. Create `lib/api.ts` with login functions
2. Create `lib/hooks.ts` with useAuth
3. Create `lib/types.ts`
4. Build LoginForm component
5. Build login page with Card
6. Test login flow

### Phase 3: File Browser Core (4 hours)
1. Create dashboard page layout
2. Create FilePickerModal component (without edit mode)
3. Create FileBrowser component
4. Create TreeNode component (recursive)
5. Test folder expansion
6. Add loading skeletons

### Phase 4: KB Integration (2 hours)
1. Add KB resource fetching
2. Implement useMergedResources hook
3. Show status indicators (green checkmarks, badges)

### Phase 5: Bulk Selection (4 hours)
1. Add edit mode state to FilePickerModal
2. Implement selection utility functions in `lib/utils.ts`
3. Add checkbox to TreeNode
4. Implement selection toggle logic
5. Add pre-check logic
6. Test selection behaviors

### Phase 6: Save & Update (2 hours)
1. Implement updateKB API function
2. Create useUpdateKB hook
3. Wire up Save button
4. Test submission
5. Add optimistic updates
6. Add toast notifications

### Phase 7: Polish (1 hour)
1. Styling tweaks
2. Error handling
3. Loading states
4. Edge case testing

**Total: ~15-16 hours over 2 days**

---

## Key Implementation Details

### Selection State is Always Clean
- Never stores both parent and child
- Submission is simple: `Array.from(selections.keys())`
- No O(n²) cleaning logic needed

### Children Are Computed, Not Stored
- When parent is selected, children show as checked+disabled
- Computed via `isResourceChecked()` function
- No redundant data in state

### Inherited Checkboxes Are Disabled
- Can't uncheck individual child if parent is selected
- Must uncheck parent first
- Simpler UX, clearer mental model

### Pre-check Based on Visible Items
- Only pre-check root-level indexed items on edit mode entry
- As folders expand, indexed children naturally show checks
- Avoids fetching entire tree upfront

### Update Replaces Entire Array
- PATCH with new `connection_source_ids` replaces old array
- Simple and clear - no merging logic needed
- If PATCH not supported, will need fallback strategy

---

## Estimated Lines of Code

- `lib/api.ts`: ~250 lines
- `lib/hooks.ts`: ~400 lines
- `lib/types.ts`: ~100 lines
- `lib/utils.ts`: ~100 lines (selection logic)
- `components/file-picker-modal.tsx`: ~100 lines
- `components/file-browser.tsx`: ~80 lines
- `components/tree-node.tsx`: ~120 lines
- `components/login-form.tsx`: ~50 lines
- `components/sidebar.tsx`: ~30 lines (stub)

**Total: ~1,230 lines** (including bulk selection)

Still lean and focused!
