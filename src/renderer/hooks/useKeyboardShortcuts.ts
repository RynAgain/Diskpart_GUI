import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: () => void;
  description: string;
}

/**
 * Hook to register keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey;
        const shiftMatch = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey;
        const altMatch = shortcut.altKey === undefined || event.altKey === shortcut.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
}

/**
 * Get formatted shortcut string for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.altKey) parts.push('Alt');
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join('+');
}

/**
 * Default shortcuts for the application
 */
export const createDefaultShortcuts = (callbacks: {
  onRefresh: () => void;
  onRescan: () => void;
  onDelete: () => void;
  onEscape: () => void;
}): KeyboardShortcut[] => [
  {
    key: 'F5',
    callback: callbacks.onRefresh,
    description: 'Refresh all data',
  },
  {
    key: 'r',
    ctrlKey: true,
    callback: callbacks.onRescan,
    description: 'Rescan disks',
  },
  {
    key: 'Delete',
    callback: callbacks.onDelete,
    description: 'Delete selected partition',
  },
  {
    key: 'Escape',
    callback: callbacks.onEscape,
    description: 'Close dialogs',
  },
];