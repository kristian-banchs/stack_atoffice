import * as driveApi from '../api/google-drive'
import * as kbApi from '../api/knowledge-base'

// ============================================================================
// PATH EXPANSION UTILITIES
// ============================================================================

export interface FileInfo {
  path: string
  resource_id: string
}


//--------- fetch all drive files recursively -----------
async function fetchAllDriveFilesRecursively(
  token: string,
  connectionId: string,
  folderId: string | null,
  parentPath: string = '/'
): Promise<FileInfo[]> {
  const allFiles: FileInfo[] = []

  // Queue of folders to process: { id, path }
  let currentLevel: Array<{ id: string | null; path: string }> = [{ id: folderId, path: parentPath }]

  while (currentLevel.length > 0) {
    // Fetch all folders at current level in parallel
    const levelResults = await Promise.all(
      currentLevel.map(({ id, path }) =>
        driveApi.getConnectionResources(token, connectionId, id).then(res => ({ res, path }))
      )
    )

    const nextLevel: Array<{ id: string; path: string }> = []

    // Process results from current level
    for (const { res, path } of levelResults) {
      for (const item of res.data) {
        const itemPath = path === '/'
          ? `/${item.inode_path.path}`
          : `${path}/${item.inode_path.path}`

        if (item.inode_type === 'file') {
          allFiles.push({ path: itemPath, resource_id: item.resource_id })
        } else if (item.inode_type === 'directory') {
          // Add to next level queue
          nextLevel.push({ id: item.resource_id, path: itemPath })
        }
      }
    }

    currentLevel = nextLevel
  }

  return allFiles
}

//--------- fetch all kb files recursively -----------
async function fetchAllKBFilesRecursively(
  token: string,
  kbId: string,
  rootPath: string
): Promise<FileInfo[]> {
  const allFiles: FileInfo[] = []

  // Queue of folder paths to process
  let currentLevel: string[] = [rootPath]

  while (currentLevel.length > 0) {
    // Fetch all folders at current level in parallel
    const levelResults = await Promise.all(
      currentLevel.map(path =>
        kbApi.getKBResources(token, kbId, path).then(res => ({ res, path }))
      )
    )

    const nextLevel: string[] = []

    // Process results from current level
    for (const { res, path } of levelResults) {
      for (const item of res.data) {
        const itemPath = path === '/'
          ? `/${item.inode_path.path}`
          : `${path}/${item.inode_path.path}`

        if (item.inode_type === 'file') {
          allFiles.push({ path: itemPath, resource_id: item.resource_id })
        } else if (item.inode_type === 'directory') {
          // Add to next level queue
          nextLevel.push(itemPath)
        }
      }
    }

    currentLevel = nextLevel
  }

  return allFiles
}

/**
 * Get Drive item by path - returns item with resource_id
 * Walks down path sequentially to find the target item
 */
export async function getDriveItemByPath(
  token: string,
  connectionId: string,
  path: string
) {
  const parts = path.split('/').filter(Boolean)

  let currentFolderId: string | null = null
  let currentItem = null

  // This must be sequential (walking down path)
  for (let i = 0; i < parts.length; i++) {
    const response = await driveApi.getConnectionResources(token, connectionId, currentFolderId)
    const item = response.data.find(item => item.inode_path.path === parts[i])

    if (!item) {
      throw new Error(`Path not found: ${path}`)
    }

    currentItem = item
    if (i < parts.length - 1 && item.inode_type === 'directory') {
      currentFolderId = item.resource_id
    }
  }

  return currentItem
}

//--------- expand paths to files -----------
export async function expandPathsToFiles(
  token: string,
  connectionId: string,
  paths: string[]
): Promise<FileInfo[]> {
  // Process all paths in parallel
  const results = await Promise.all(
    paths.map(async (path) => {
      const item = await getDriveItemByPath(token, connectionId, path)

      if (item && item.inode_type === 'file') {
        return [{ path, resource_id: item.resource_id }]
      } else if (item && item.inode_type === 'directory') {
        return fetchAllDriveFilesRecursively(token, connectionId, item.resource_id, path)
      }
      return []
    })
  )

  // Flatten results
  return results.flat()
}

//--------- fetch all kb files -----------
export async function fetchAllKBFiles(
  token: string,
  kbId: string
): Promise<FileInfo[]> {
  return fetchAllKBFilesRecursively(token, kbId, '/')
}
