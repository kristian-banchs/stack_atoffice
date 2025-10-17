
So the way that we are currently handeling out data is as follows 


The motivation here was to have the UI be snappy and not have the user sit and wait. This was acheived by semi-speculative prefetching by the nodes  in our 'recursive' tree and heavy optimistic updates. The loading phaes are given more support with skeletons 

**Constraints**
The key constraints where defined by the API. We were extended the capability to 
    - fetch resources form a google drive a for a given directory 
    - fetch data (specifically about indexing) for a specific directory in a knowledge base 
    - create a knowledge base 
    - delete a file by doodle drive resource ID form a knowledge base 
    - ***WE WERE NOT ABLE TO ADD*** by gd id

Given the constraints the most optimal approach would be to take  semi recursive tree approach. the nodes were the folders, the leafs were the files. Prefetching would be used in parrallel at each level (slightly speculative) but significantly increases the user experience and makes the application snappy. Deleting resources from the kb is a simple update, adding new ones requires new KB creation which is covered by optimistic updates.

**Data Structures**
~File Picker Modal~
- const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']))
    Tracks the folders that are expanded accross the tree (set to avoid potential duplicates)

- const [pathToResourceId] = useState<Map<string, string>>(new Map())
    Important -> this is build as the folder structure unfolds and it provides a map of the path as key to resoureId so that we can have quick O(1) lookuptime for ids and not have to refeth that data around the applications 

- const [pendingPaths, setPendingPaths] = useState<Set<string>>(new Set())
    - Pending paths is what is used for optimistic updates. While we are creating a new KB we are keeping track of the pending file seperatley 

- const [isRebuilding, setIsRebuilding] = useState(false)
    - Boolean meant to keep track of the state of the new kb so that we can begin polling and feed the real data

- const editMode = useEditMode()
    - useEditMode() keeps track of a few thigs. the selected items in the directory as well as the handling logic to select or deselect the folder/file





recursive folder structure (tree node) general login (for data) 

1) the tree nodes prefetch their data 

    usePrefetchChildFolders(auth.token, connectionId, childFolders.length > 0 ? childFolders : null)
    usePrefetchKBResources(auth.token, kbId, childFolders.length > 0 ? childFolders : null)


2) the fetch connections to knowledge base (kb) and google drive (gd)

    useConnectionResources()
    useKBResources()


3) Merge the kb and gd structures and make a pathToResources <Map < string , string> >. this is a map of the path and the resource id so we dont need to look it up independently ever. we build this as we go. this is leveraged in several places

4) 









