# Hooks Design & Testing Guide

## Overview

All hooks are in `lib/hooks.ts` - one file for maintainability. Each hook has a specific purpose and dependency chain.

---

## Hook Dependency Chain

```
┌─────────────┐
│   useAuth   │ ← Start here (login)
└──────┬──────┘
       │ provides: token, orgId
       ↓
┌──────────────┐
│ useConnection│ ← Get Google Drive connection
└──────┬───────┘
       │ provides: connectionId
       ↓
┌───────────────────┬────────────────────┐
│ useConnectionRes  │  useKnowledgeBase  │
│ (Drive files)     │  (KB setup)        │
└──────┬────────────┴────────┬───────────┘
       │ provides:            │ provides:
       │ - files/folders      │ - kbId
       │                      │
       ↓                      ↓
┌──────────────────────────────────────┐
│        useMergedResources            │
│  (Combines Drive + KB status)        │
└──────────────┬───────────────────────┘
               │ provides:
               │ - resources with indexStatus
               ↓
         [Display in Tree]
               ↓
┌──────────────────────────┐
│     useUpdateKB          │
│  (Submit selections)     │
└──────────────────────────┘
```

---

## Hook Specifications

### 1. `useAuth()`

**Purpose**: Handle authentication and provide token/orgId

**Returns**:
```typescript
{
  token: string | null
  orgId: string | null
  login: (credentials) => void
  isLoading: boolean
  isAuthenticated: boolean
  error: Error | null
}
```

**Usage**:
```tsx
const auth = useAuth()

// Login
auth.login({
  email: 'stackaitest@gmail.com',
  password: '!z4ZnxkyLYs#vR'
})

// Check status
if (auth.isAuthenticated) {
  // Proceed to next step
}
```

**Expected Data**:
- `token`: JWT string (long)
- `orgId`: UUID string
- `isLoading`: true during login
- `error`: null if successful

---

### 2. `useConnection(token)`

**Purpose**: Fetch Google Drive connection

**Params**:
- `token`: Auth token from useAuth

**Returns**:
```typescript
{
  data: Connection | undefined
  isLoading: boolean
  error: Error | null
}
```

**Expected Data**:
```json
{
  "connection_id": "96891794-4313-42f1-9d98-237e526165b8",
  "name": "Google Drive",
  "created_at": "2025-06-19T02:28:05.881189+00:00",
  "connection_provider": "gdrive"
}
```

**Usage**:
```tsx
const connection = useConnection(auth.token)
const connectionId = connection.data?.connection_id
```

---

### 3. `useConnectionResources(token, connectionId, folderId)`

**Purpose**: Fetch files/folders from Google Drive

**Params**:
- `token`: Auth token
- `connectionId`: From useConnection
- `folderId`: Folder to list (null = root)
- `options.enabled`: Control when to fetch

**Returns**:
```typescript
{
  data: ConnectionResourcesResponse | undefined
  isLoading: boolean
  error: Error | null
}
```

**Expected Data** (root):
```json
{
  "data": [
    {
      "resource_id": "1UdRAmc-fBWRfYY4Z7XHhi_-tVDJsmGkf",
      "inode_path": { "path": "acme" },
      "inode_type": "directory"
    },
    {
      "resource_id": "14fYmcLp_T4jV5bSL2CZiezOY6a6vGW0d",
      "inode_path": { "path": "books" },
      "inode_type": "directory"
    },
    {
      "resource_id": "19Bvjgw4w6LdltkjZ7yL685xtmjPXWX7d",
      "inode_path": { "path": "rootfile1.txt" },
      "inode_type": "file"
    }
  ],
  "next_cursor": null,
  "current_cursor": null
}
```

**Usage**:
```tsx
// Root level
const root = useConnectionResources(token, connectionId, null)

// Specific folder
const folder = useConnectionResources(token, connectionId, folderId, {
  enabled: isExpanded // Only fetch when expanded
})
```

---

### 4. `useKnowledgeBase(token, connectionId)`

**Purpose**: Get or create Knowledge Base for the connection

**Returns**:
```typescript
{
  data: KBDetails | undefined
  isLoading: boolean
  error: Error | null
}
```

**Expected Data**:
```json
{
  "knowledge_base_id": "b85fed6b-54b0-493a-b7f5-0c39198a7713",
  "connection_id": "96891794-4313-42f1-9d98-237e526165b8",
  "name": "Google Drive Knowledge Base",
  "connection_source_ids": [],
  "is_empty": true
}
```

**Usage**:
```tsx
const kb = useKnowledgeBase(auth.token, connectionId)
const kbId = kb.data?.knowledge_base_id
```

**Note**: Creates KB if none exists!

---

### 5. `useKBResources(token, kbId, path)`

**Purpose**: Fetch indexed resources from KB

**Params**:
- `token`: Auth token
- `kbId`: From useKnowledgeBase
- `path`: Path to query ("/" or "/clients")

**Returns**:
```typescript
{
  data: KBResourcesResponse | undefined
  isLoading: boolean
  error: Error | null
}
```

**Expected Data**:
```json
{
  "data": [
    {
      "resource_id": "19Bvjgw4w6LdltkjZ7yL685xtmjPXWX7d",
      "inode_path": { "path": "rootfile1.txt" },
      "inode_type": "file",
      "status": "indexed"
    }
  ],
  "next_cursor": null
}
```

**Special Features**:
- Auto-polls every 3s if any resource is `pending` or `being_indexed`
- Returns empty array if no resources indexed yet (not an error)

---

### 6. `useMergedResources(token, connectionId, kbId, folderId, folderPath)`

**Purpose**: **PRIMARY HOOK** - Merges Drive files with KB status

**Params**:
- `token`: Auth token
- `connectionId`: Connection ID
- `kbId`: Knowledge Base ID
- `folderId`: Folder ID to list (null = root)
- `folderPath`: Full path string ("" or "clients/project-alpha")

**Returns**:
```typescript
{
  resources: MergedResource[]
  isLoading: boolean
  error: Error | null
}
```

**Expected Data**:
```typescript
[
  {
    resource_id: "1UdRAmc-fBWRfYY4Z7XHhi_-tVDJsmGkf",
    inode_path: { path: "acme" },
    inode_type: "directory",
    indexStatus: "not_indexed" // ← Added by merge!
  },
  {
    resource_id: "19Bvjgw4w6LdltkjZ7yL685xtmjPXWX7d",
    inode_path: { path: "rootfile1.txt" },
    inode_type: "file",
    indexStatus: "indexed" // ← From KB!
  }
]
```

**Usage** (most common):
```tsx
// Root level
const { resources, isLoading } = useMergedResources(
  token,
  connectionId,
  kbId,
  null, // root
  ''    // empty path
)

// Nested folder
const { resources, isLoading } = useMergedResources(
  token,
  connectionId,
  kbId,
  folderId,
  'clients/project-alpha',
  { enabled: isExpanded }
)
```

**How It Works**:
1. Fetches Drive files via `useConnectionResources`
2. Fetches KB status via `useKBResources`
3. Creates Map of resource_id → status (O(1) lookup)
4. Merges: adds `indexStatus` to each Drive file
5. Returns merged array

**IndexStatus Values**:
- `"not_indexed"` - Not in KB
- `"pending"` - Submitted, waiting to index
- `"being_indexed"` - Currently indexing
- `"indexed"` - Fully indexed ✓

---

### 7. `useUpdateKB(token, kbId, orgId)`

**Purpose**: Submit selections to update KB

**Returns**:
```typescript
{
  mutate: (resourceIds: string[]) => void
  isPending: boolean
  error: Error | null
}
```

**Usage**:
```tsx
const updateKB = useUpdateKB(token, kbId, orgId)

// On Save button click
const handleSave = () => {
  const resourceIds = Array.from(selections.keys())
  updateKB.mutate(resourceIds)
}
```

**What It Does**:
1. PATCH `/knowledge_bases/{kbId}` with `connection_source_ids`
2. Trigger `/knowledge_bases/sync/trigger/{kbId}/{orgId}`
3. Invalidate KB queries (triggers refetch)
4. Show toast notification

**Side Effects**:
- All `kb-resources` queries invalidated
- Status changes: `not_indexed` → `pending` → `being_indexed` → `indexed`
- Auto-polling kicks in (from useKBResources)

---

### 8. `useDebugData(token, connectionId, kbId)`

**Purpose**: Debug hook - shows all data in one place

**Returns**:
```typescript
{
  auth: { hasToken, token }
  connection: { data, isLoading, error }
  rootResources: { count, data, isLoading, error }
  kbResources: { count, data, isLoading, error }
  merged: { count, sample, isLoading, error }
}
```

**Usage**:
```tsx
const debug = useDebugData(token, connectionId, kbId)
console.log('Debug:', debug)
```

---

## Testing Instructions

### 1. Setup

```bash
# Install dependencies
npm install @tanstack/react-query

# Make sure Tanstack Query provider is in layout.tsx
```

### 2. Run Test Page

```bash
npm run dev
```

Navigate to: `http://localhost:3000/test`

### 3. Test Flow

1. **Login**
   - Enter email: `stackaitest@gmail.com`
   - Enter password: `!z4ZnxkyLYs#vR`
   - Click "Login"
   - ✓ Should see token and org ID

2. **Connection**
   - Should auto-load after login
   - ✓ Should see connection ID and name

3. **Knowledge Base**
   - Should auto-load/create
   - ✓ Should see KB ID

4. **Root Resources**
   - Should auto-load merged resources
   - ✓ Should see list of folders/files
   - ✓ Each should have an indexStatus badge

5. **Debug Data**
   - Click "Show Debug"
   - ✓ Should see JSON with all data

### 4. Expected Console Output

```
Submitting resource IDs: [] (when testing updateKB)
```

### 5. Check These Things

- [ ] Token is present and starts with "eyJ..."
- [ ] Connection ID is a UUID
- [ ] KB ID is a UUID
- [ ] Root resources array has items
- [ ] Each resource has `resource_id`, `inode_path.path`, `inode_type`, `indexStatus`
- [ ] IndexStatus is one of: not_indexed, pending, being_indexed, indexed
- [ ] No console errors (except expected 404 for empty KB)

---

## Common Issues & Solutions

### Issue: "No Google Drive connection found"
**Solution**: Login to Stack AI dashboard and create connection first

### Issue: KB resources returns 404
**Solution**: This is normal if nothing indexed yet. Hook returns empty array.

### Issue: Token expired
**Solution**: Re-login. Tokens expire after a certain time.

### Issue: Resources not loading
**Solution**: Check console for network errors. Verify auth token is valid.

---

## Hook Performance

### Caching Strategy

- `useAuth`: No caching (in React state)
- `useConnection`: Infinite staleTime (connection rarely changes)
- `useConnectionResources`: 5 min staleTime (Drive files don't change often)
- `useKnowledgeBase`: Infinite staleTime (KB rarely changes)
- `useKBResources`: 3s staleTime + auto-polling
- `useMergedResources`: Computed from above (no separate cache)

### When Hooks Refetch

- **On mount**: Always (if enabled)
- **On window focus**: Default behavior (can disable)
- **On reconnect**: Default behavior
- **Manual**: Via `queryClient.invalidateQueries()`
- **Auto-poll**: KB resources only (when pending/indexing)

### Optimization Tips

1. Use `enabled: false` to prevent fetching until needed
2. Use `staleTime` to cache data longer
3. Prefetch on hover for instant UX
4. Use `queryClient.setQueryData()` for optimistic updates

---

## Next Steps

1. Test all hooks in isolation
2. Verify data shape matches expected
3. Test error cases (wrong credentials, network errors)
4. Test with real folders (expand/collapse)
5. Test update KB mutation
6. Check auto-polling works (submit something, watch it index)

---

## Summary

**Total Hooks**: 8
**Total Lines**: ~350 in hooks.ts
**Dependencies**: Tanstack Query, Sonner (toast)
**Test Page**: `/test` route

All hooks are **typed**, **documented**, and **testable**. The data flow is **clear** and **predictable**.
