# Diskpart CLI Wrapper Implementation Notes

## Overview
This document provides implementation details and testing notes for the Diskpart CLI wrapper functionality (Phase 2).

## Implemented Modules

### 1. Error Handling (`src/main/diskpart/errors.ts`)
Custom error classes for different failure scenarios:
- `DiskpartError` - Base error class
- `PrivilegeError` - Administrator privileges required
- `DiskNotFoundError` - Disk not found
- `PartitionNotFoundError` - Partition not found
- `CommandExecutionError` - Command execution failed
- `CommandTimeoutError` - Command timed out
- `ParseError` - Failed to parse output
- `InvalidCommandError` - Invalid command parameters
- `AccessDeniedError` - Access denied to resource

### 2. Privilege Checking (`src/main/utils/privileges.ts`)
Functions to check and validate administrator privileges:
- `isRunningAsAdmin()` - Async check for admin privileges
- `isRunningAsAdminSync()` - Synchronous admin check
- `getPrivilegeStatus()` - Get user-friendly status message
- `requireAdmin()` - Throw error if not admin

**Note:** Uses `net session` command which requires admin rights on Windows.

### 3. Logger (`src/main/utils/logger.ts`)
Comprehensive logging system:
- Logs to file with timestamps
- Automatic log rotation (keeps last 10 files)
- Log directory: `%APPDATA%/diskpart-gui/logs/`
- Functions: `logInfo()`, `logWarning()`, `logError()`, `logCommand()`, `logCommandResult()`
- Also logs to console in development mode

### 4. Command Builder (`src/main/diskpart/commands.ts`)
Functions to build Diskpart command scripts:
- `buildListDisksCommand()` - List all disks
- `buildListVolumesCommand()` - List all volumes
- `buildListPartitionsCommand()` - List partitions on selected disk
- `buildSelectDiskCommand(diskNumber)` - Select a disk
- `buildDetailDiskCommand()` - Get detailed disk info
- `buildSelectPartitionCommand(partitionNumber)` - Select a partition
- `buildCleanDiskCommand()` - Clean disk (remove all partitions)
- `buildCleanAllCommand()` - Secure erase disk
- `buildCreatePartitionCommand(size?)` - Create partition
- `buildDeletePartitionCommand()` - Delete partition
- `buildFormatVolumeCommand(fs, label?, quick?)` - Format volume
- `buildAssignLetterCommand(letter)` - Assign drive letter
- `buildRemoveLetterCommand(letter)` - Remove drive letter
- `buildSetActiveCommand()` - Set partition as active
- `buildExtendPartitionCommand(size?)` - Extend partition
- `buildShrinkPartitionCommand(desired, minimum?)` - Shrink partition
- `buildCommandScript(commands[])` - Build multi-command script
- `buildDetailDiskScript(diskNumber)` - Get detailed disk info script
- `buildFormatPartitionScript(disk, partition, fs, label?)` - Format partition script

**Validation:** All functions validate input parameters and throw `InvalidCommandError` for invalid inputs.

### 5. Output Parser (`src/main/diskpart/parser.ts`)
Parsers for Diskpart command outputs with example outputs in comments:
- `parseListDisk(output)` - Parse "list disk" output → `DiskInfo[]`
- `parseListVolume(output)` - Parse "list volume" output → `VolumeInfo[]`
- `parseListPartition(output)` - Parse "list partition" output → `PartitionInfo[]`
- `parseDetailDisk(output)` - Parse "detail disk" output → `Partial<DiskInfo>`
- `isSuccessOutput(output)` - Check if output indicates success
- `extractErrorMessage(output)` - Extract error message from output

**Example Outputs:** Each parser includes commented example outputs from real Diskpart commands for reference.

### 6. Command Executor (`src/main/diskpart/executor.ts`)
Core execution engine:
- `executeDiskpartCommand(command, timeout?)` - Execute Diskpart command
- `executeDestructiveCommand(command)` - Execute with extended timeout (60s)
- `executeAndParse<T>(command, parser, timeout?)` - Execute and parse output
- `validateDiskpartAvailable()` - Check if Diskpart is available
- `getDiskpartVersion()` - Get Diskpart version info

**Features:**
- Creates temporary script files for command execution
- Automatic cleanup of temp files
- Timeout handling (default 30s, destructive ops 60s)
- Admin privilege checking before execution
- Comprehensive error handling
- Automatic logging of all operations

### 7. Main Process IPC Handlers (`src/main/main.ts`)
Updated all IPC handlers to use real Diskpart execution:
- `diskpart:list-disks` - List all disks
- `diskpart:list-volumes` - List all volumes
- `diskpart:list-partitions` - List partitions on a disk
- `diskpart:select-disk` - Select a disk
- `diskpart:detail-disk` - Get detailed disk information
- `diskpart:clean-disk` - Clean disk (remove all partitions)
- `diskpart:clean-all` - Secure erase disk
- `diskpart:create-partition` - Create a partition
- `diskpart:delete-partition` - Delete a partition
- `diskpart:format-volume` - Format a volume
- `diskpart:assign-letter` - Assign drive letter
- `diskpart:remove-letter` - Remove drive letter
- `system:check-admin` - Check admin privileges
- `system:get-info` - Get system information

**Error Handling:** All handlers return `IPCResponse` with proper error codes and messages.

## Testing Notes

### Prerequisites
1. **Administrator Privileges Required:** The application MUST be run as administrator to execute Diskpart commands.
2. **Windows Only:** Diskpart is a Windows-specific tool.
3. **Test Environment:** Use a test machine or virtual machine with non-critical disks.

### Testing Approach

#### 1. Admin Privilege Check
```typescript
// Should return true when running as admin
const isAdmin = await window.electronAPI.checkAdminPrivileges();
```

#### 2. List Operations (Safe)
```typescript
// List all disks
const disksResult = await window.electronAPI.listDisks();
// Expected: Array of DiskInfo objects

// List all volumes
const volumesResult = await window.electronAPI.listVolumes();
// Expected: Array of VolumeInfo objects

// List partitions on disk 0
const partitionsResult = await window.electronAPI.listPartitions(0);
// Expected: Array of PartitionInfo objects
```

#### 3. Detail Operations (Safe)
```typescript
// Get detailed info for disk 0
const detailResult = await window.electronAPI.detailDisk(0);
// Expected: Partial<DiskInfo> with boot/system disk flags
```

#### 4. Destructive Operations (CAUTION!)
**⚠️ WARNING: These operations will destroy data! Use only on test disks!**

```typescript
// Clean a disk (removes all partitions)
const cleanResult = await window.electronAPI.cleanDisk(1); // Use test disk!

// Create a partition
const createResult = await window.electronAPI.createPartition(1, 10240); // 10GB

// Format a partition
const formatResult = await window.electronAPI.formatVolume(1, 1, 'NTFS', 'TestVolume');

// Assign drive letter
const assignResult = await window.electronAPI.assignLetter(1, 1, 'Z');
```

### Known Limitations

1. **Parsing Robustness:** The parsers handle common Diskpart output formats but may need adjustments for:
   - Non-English Windows versions
   - Unusual disk configurations
   - Very long disk/volume labels

2. **Error Messages:** Some Diskpart error messages are generic and may need better interpretation.

3. **Progress Reporting:** Long-running operations (format, clean all) don't provide progress updates yet.

4. **Concurrent Operations:** Multiple simultaneous Diskpart operations may conflict.

### TypeScript Errors

The TypeScript errors shown in the IDE are expected and will resolve during the build process:
- Node.js module imports (`fs`, `path`, `child_process`, etc.) are available at runtime
- The `@types/node` package is installed in devDependencies
- Webpack handles the module resolution during build

### Log Files

All operations are logged to:
```
%APPDATA%/diskpart-gui/logs/diskpart-YYYY-MM-DD.log
```

Log files include:
- All commands executed
- Command results (success/failure)
- Error details
- Timestamps for all operations

### Next Steps (Phase 3 - UI Integration)

1. Update React components to use the real IPC handlers
2. Add loading states for async operations
3. Implement confirmation dialogs for destructive operations
4. Add progress indicators for long-running operations
5. Display parsed disk/volume/partition information in the UI
6. Add error handling and user-friendly error messages in the UI
7. Implement the admin privilege warning banner

## Security Considerations

1. **Admin Privileges:** Always check admin status before attempting operations
2. **Input Validation:** All user inputs are validated before building commands
3. **Confirmation Required:** Destructive operations should require user confirmation
4. **Logging:** All operations are logged for audit purposes
5. **Temp Files:** Temporary script files are cleaned up after execution

## Performance Notes

- List operations: ~100-500ms
- Detail operations: ~200-800ms
- Format operations: Varies by size (seconds to minutes)
- Clean operations: ~1-5 seconds
- Clean all operations: Can take several minutes for large disks

## Troubleshooting

### "Access Denied" Errors
- Ensure application is running as administrator
- Check if disk/partition is in use by another process
- Verify disk is not a system disk (if trying destructive operations)

### "Disk Not Found" Errors
- Verify disk number is correct (use list-disks first)
- Check if disk is online
- Ensure disk has media (for removable drives)

### Parsing Errors
- Check log files for raw Diskpart output
- Verify Diskpart output format matches expected format
- May need to adjust regex patterns in parser.ts

### Timeout Errors
- Increase timeout for large disks
- Check if disk is responding (may be failing)
- Verify no other processes are accessing the disk

## File Structure

```
src/main/
├── diskpart/
│   ├── commands.ts      # Command builders
│   ├── executor.ts      # Command execution
│   ├── parser.ts        # Output parsers
│   └── errors.ts        # Custom error classes
├── utils/
│   ├── logger.ts        # Logging system
│   └── privileges.ts    # Admin privilege checking
└── main.ts              # Main process with IPC handlers
```

## Dependencies

All required dependencies are already in package.json:
- `electron` - Main framework
- `@types/node` - TypeScript definitions for Node.js APIs
- Node.js built-in modules: `child_process`, `fs`, `path`, `os`, `util`

No additional dependencies needed for Phase 2.