import { useState } from 'react'

// ============================================================================
// EDIT MODE HOOKS
// ============================================================================

/**
 * Manages edit mode state with cascading checkbox logic
 * Auto-consolidates children to parent when all selected
 */
export function useEditMode() {
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())

  /**
   * Check if a path is selected
   * Returns true if path or any ancestor is selected
   */
  const isSelected = (path: string): boolean => {
    if (selectedPaths.has(path)) return true

    const parts = path.split('/').filter(Boolean)
    for (let i = parts.length - 1; i > 0; i--) {
      const ancestorPath = '/' + parts.slice(0, i).join('/')
      if (selectedPaths.has(ancestorPath)) return true
    }
    return false
  }

  /**
   * Toggle folder - checks/unchecks all descendants
   */
  const toggleFolder = (folderPath: string) => {
    setSelectedPaths(prev => {
      const next = new Set(prev)

      if (next.has(folderPath)) {
        // Uncheck folder and all descendants
        next.delete(folderPath)
        for (const path of next) {
          if (path.startsWith(folderPath + '/')) {
            next.delete(path)
          }
        }
      } else {
        // Check folder, remove redundant children
        next.add(folderPath)
        for (const path of next) {
          if (path.startsWith(folderPath + '/')) {
            next.delete(path)
          }
        }
      }
      return next
    })
  }

  /**
   * Toggle file - handles parent explosion and auto-consolidation
   */
  const toggleFile = (filePath: string, parentPath: string, allSiblingPaths: string[]) => {
    setSelectedPaths(prev => {
      const next = new Set(prev)

      if (isSelected(filePath)) {
        // Unchecking file
        if (next.has(parentPath)) {
          // Parent is selected - explode to siblings
          next.delete(parentPath)
          allSiblingPaths.forEach(siblingPath => {
            if (siblingPath !== filePath) {
              next.add(siblingPath)
            }
          })
        } else {
          // File was individually selected
          next.delete(filePath)
        }
      } else {
        // Checking file
        next.add(filePath)

        // Check if all siblings now selected - consolidate to parent
        const allSiblingsSelected = allSiblingPaths.every(siblingPath =>
          next.has(siblingPath) || siblingPath === filePath
        )

        if (allSiblingsSelected) {
          next.add(parentPath)
          allSiblingPaths.forEach(path => next.delete(path))
        }
      }
      return next
    })
  }

  const enterEditMode = (initialPaths?: string[]) => {
    setIsEditMode(true)
    if (initialPaths && initialPaths.length > 0) {
      setSelectedPaths(new Set(initialPaths))
    }
  }

  const exitEditMode = () => {
    setIsEditMode(false)
    setSelectedPaths(new Set())
  }

  return {
    isEditMode,
    selectedPaths,
    isSelected,
    toggleFolder,
    toggleFile,
    enterEditMode,
    exitEditMode
  }
}
