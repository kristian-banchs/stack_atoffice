
So the way that we are currently handling our data is as follows


The motivation here was to have the UI be snappy and not have the user sit and wait. This was achieved by semi-speculative prefetching by the nodes in our 'recursive' tree and heavy optimistic updates. The loading phases are given more support with skeletons 

**Constraints**
The key constraints were defined by the API. We were extended the capability to
    - fetch resources from a google drive a for a given directory
    - fetch data (specifically about indexing) for a specific directory in a knowledge base
    - create a knowledge base
    - delete a file by google drive resource ID from a knowledge base
    - ***WE WERE NOT ABLE TO ADD*** by gd id

Given the constraints the most optimal approach would be to take  semi recursive tree approach. the nodes were the folders, the leafs were the files. Prefetching would be used in parallel at each level (slightly speculative) but significantly increases the user experience and makes the application snappy. Deleting resources from the kb is a simple update, adding new ones requires new KB creation which is covered by optimistic updates.


## Performance Features

1. **Prefetching** - Load child data before user expands folder
2. **Smart Polling** - Only poll KB resources when files actively indexing
3. **Optimistic UI** - Instant feedback on all mutations
4. **Skeleton States** - No loading spinners, show placeholders
5. **Memoization** - Prevent unnecessary re-renders
6. **Auto-selection** - Pre-check indexed files when entering edit mode (one-time)



**Data Structures**
~File Picker Modal~
- const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']))
    Tracks the folders that are expanded across the tree (set to avoid potential duplicates)

- const [pathToResourceId] = useState<Map<string, string>>(new Map())
    Important -> this is built as the folder structure unfolds and it provides a map of the path as key to resourceId so that we can have quick O(1) lookup time for ids and not have to refetch that data around the applications

- const [pendingPaths, setPendingPaths] = useState<Set<string>>(new Set())
    - Pending paths is what is used for optimistic updates. While we are creating a new KB we are keeping track of the pending file separately

- const [isRebuilding, setIsRebuilding] = useState(false)
    - Boolean meant to keep track of the state of the new kb so that we can begin polling and feed the real data

- const editMode = useEditMode()
    - useEditMode() keeps track of a few things. The selected items in the directory as well as the handling logic to select or deselect the folder/file





recursive folder structure (tree node) general logic (for data) 

1) the tree nodes prefetch their data 

    usePrefetchChildFolders(auth.token, connectionId, childFolders.length > 0 ? childFolders : null)
    usePrefetchKBResources(auth.token, kbId, childFolders.length > 0 ? childFolders : null)


2) the fetch connections to knowledge base (kb) and google drive (gd)

    useConnectionResources()
    useKBResources()


3) Merge the kb and gd structures and make a pathToResources <Map < string , string> >. this is a map of the path and the resource id so we dont need to look it up independently ever. we build this as we go. this is leveraged in several places


---------- thats it for data fetching ---------

the tree node has 2 main useEffect hooks 

1) the first handles auto selecting the files when in edit mode that were previously indexed 

2) deals with cleaning the file and ancestors in the pending paths so that we can allow for the natural polled state of the files to come through 



---

## Core Project Structure

```
app/
├── page.tsx                    # Login page
├── dashboard/page.tsx          # Main file picker
└── layout.tsx                  # QueryClientProvider

components/
├── file-picker/
│   ├── file-picker-modal.tsx   # Main container
│   ├── tree-node.tsx           # Recursive folder/file
│   ├── file-item.tsx           # Individual file
│   └── status-badge.tsx        # Index status indicator

lib/
├── api/                        # API layer
│   ├── auth.ts
│   ├── google-drive.ts
│   └── knowledge-base.ts
├── hooks/                      # Custom hooks
│   ├── auth-hooks.ts
│   ├── connection-hooks.ts
│   ├── knowledge-base-hooks.ts
│   ├── edit-mode-hooks.ts
│   └── resource-mutation-hooks.ts
└── types.ts                    # TypeScript types
```

---

## Development Philosophy

**Keep it simple and fast** - 2-day task prioritizing UX over perfect architecture

- No over-engineering
- Lean codebase (~1,100 lines custom code)
- Optimistic updates for instant feedback
- Prefetch intelligently
- No loading spinners
