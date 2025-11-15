# Diskpart GUI - Technical Architecture Document

## Executive Summary

This document outlines the comprehensive architecture for a Windows Diskpart GUI application built with Electron and React. The application provides a modern, user-friendly interface for common disk management operations while maintaining safety through confirmation dialogs and visual feedback.

**Technology Stack:** Electron + React + TypeScript + Node.js  
**Target Platform:** Windows 10/11  
**Scope:** Core disk management operations (list, select, clean, format, partition)

---

## 1. Technology Stack

### 1.1 Selected Technologies

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| **Desktop Framework** | Electron | 28.x+ | Cross-platform desktop apps with web technologies, excellent for rapid development |
| **Frontend Framework** | React | 18.x+ | Component-based architecture, large ecosystem, excellent developer experience |
| **Language** | TypeScript | 5.x+ | Type safety, better IDE support, reduced runtime errors |
| **UI Library** | Ant Design / Material-UI | Latest | Professional components, consistent design system |
| **State Management** | Zustand / Redux Toolkit | Latest | Predictable state management for complex UI interactions |
| **IPC Communication** | Electron IPC | Built-in | Secure communication between renderer and main process |
| **CLI Execution** | Node.js child_process | Built-in | Execute Diskpart commands with proper privilege handling |
| **Build Tool** | Vite | 5.x+ | Fast development server, optimized production builds |
| **Package Manager** | npm / pnpm | Latest | Dependency management |

### 1.2 Technology Justification

**Why Electron + React?**
- **Rapid Development:** Leverage web technologies for fast iteration
- **Modern UI:** Rich component libraries and styling options
- **Cross-platform Foundation:** While targeting Windows, architecture allows future expansion
- **Developer Experience:** Hot reload, debugging tools, large community
- **Native Integration:** Electron provides Node.js APIs for system-level operations

**Why TypeScript?**
- Type safety prevents common errors in CLI command construction
- Better IDE autocomplete for complex data structures
- Self-documenting code through type definitions
- Easier refactoring and maintenance

---

## 2. Application Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ELECTRON APPLICATION                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────┐      │
│  │         RENDERER PROCESS (React Frontend)         │      │
│  ├───────────────────────────────────────────────────┤      │
│  │                                                     │      │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────┐ │      │
│  │  │ UI Components│  │ State Manager│  │ Services│ │      │
│  │  │   (React)   │  │  (Zustand)   │  │  Layer  │ │      │
│  │  └──────┬──────┘  └──────┬───────┘  └────┬────┘ │      │
│  │         │                 │                │       │      │
│  │         └─────────────────┴────────────────┘       │      │
│  │                           │                         │      │
│  │                    IPC Messages                     │      │
│  └───────────────────────────┼─────────────────────────┘      │
│                               │                                │
│  ════════════════════════════╪════════════════════════════    │
│                               │                                │
│  ┌───────────────────────────┼─────────────────────────┐      │
│  │         MAIN PROCESS (Node.js Backend)      │       │      │
│  ├───────────────────────────┼─────────────────────────┤      │
│  │                           │                         │      │
│  │  ┌────────────────────────▼──────────────────────┐ │      │
│  │  │         IPC Handler & Router                  │ │      │
│  │  └────────────────────┬──────────────────────────┘ │      │
│  │                       │                             │      │
│  │  ┌────────────────────▼──────────────────────────┐ │      │
│  │  │      Diskpart Command Manager                 │ │      │
│  │  │  - Command Builder                            │ │      │
│  │  │  - Validation Layer                           │ │      │
│  │  │  - Safety Checks                              │ │      │
│  │  └────────────────────┬──────────────────────────┘ │      │
│  │                       │                             │      │
│  │  ┌────────────────────▼──────────────────────────┐ │      │
│  │  │      CLI Executor & Parser                    │ │      │
│  │  │  - Process Spawner                            │ │      │
│  │  │  - Output Parser                              │ │      │
│  │  │  - Error Handler                              │ │      │
│  │  └────────────────────┬──────────────────────────┘ │      │
│  │                       │                             │      │
│  └───────────────────────┼─────────────────────────────┘      │
│                          │                                     │
│                          ▼                                     │
│              ┌───────────────────────┐                        │
│              │   Windows Diskpart    │                        │
│              │   (Elevated Process)  │                        │
│              └───────────────────────┘                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component Breakdown

#### 2.2.1 Renderer Process (Frontend)

**UI Components Layer:**
- **DiskListView:** Display all available disks with visual indicators
- **DiskDetailView:** Show detailed information about selected disk
- **PartitionManager:** Create, delete, and modify partitions
- **OperationPanel:** Action buttons for disk operations
- **ConfirmationDialog:** Safety confirmations for destructive operations
- **StatusBar:** Real-time operation status and progress
- **LogViewer:** Display command output and history

**State Management:**
- **DiskStore:** Current disk list, selected disk, disk properties
- **OperationStore:** Pending operations, operation history, current status
- **UIStore:** Modal states, loading states, error messages
- **SettingsStore:** User preferences, safety settings

**Services Layer:**
- **DiskpartService:** IPC communication wrapper for diskpart operations
- **ValidationService:** Client-side validation before sending commands
- **NotificationService:** User notifications and alerts

#### 2.2.2 Main Process (Backend)

**IPC Handler:**
- Route messages between renderer and backend services
- Implement security checks on incoming requests
- Handle async operations and callbacks

**Diskpart Command Manager:**
- **CommandBuilder:** Construct valid diskpart command sequences
- **ValidationLayer:** Server-side validation of commands
- **SafetyChecker:** Verify operations won't cause data loss without confirmation

**CLI Executor:**
- **ProcessSpawner:** Execute diskpart with elevated privileges
- **OutputParser:** Parse diskpart output into structured data
- **ErrorHandler:** Catch and format errors for user display

---

## 3. Core Features & Diskpart Commands

### 3.1 Supported Operations

| Feature | Diskpart Commands | Risk Level | Confirmation Required |
|---------|------------------|------------|----------------------|
| **List Disks** | `list disk` | Safe | No |
| **List Volumes** | `list volume` | Safe | No |
| **List Partitions** | `list partition` | Safe | No |
| **Select Disk** | `select disk N` | Safe | No |
| **Disk Details** | `detail disk` | Safe | No |
| **Clean Disk** | `clean` | HIGH | Yes + Type confirmation |
| **Clean All** | `clean all` | CRITICAL | Yes + Type confirmation + Warning |
| **Create Partition** | `create partition primary size=X` | Medium | Yes |
| **Delete Partition** | `delete partition` | HIGH | Yes + Type confirmation |
| **Format Volume** | `format fs=ntfs quick label="X"` | HIGH | Yes + Type confirmation |
| **Assign Drive Letter** | `assign letter=X` | Low | Yes |
| **Remove Drive Letter** | `remove letter=X` | Medium | Yes |
| **Set Partition Active** | `active` | Medium | Yes |
| **Extend Partition** | `extend size=X` | Medium | Yes |
| **Shrink Partition** | `shrink desired=X` | Medium | Yes |

### 3.2 Command Execution Pipeline

```
User Action → Validation → Confirmation → Command Build → Execute → Parse → Update UI
     │            │             │              │            │         │         │
     │            │             │              │            │         │         │
     ▼            ▼             ▼              ▼            ▼         ▼         ▼
  Button      Check Input   Show Dialog   Build Script   Run CLI   Extract   Refresh
  Click       Parameters    (if needed)   with Safety    Diskpart  Results   Display
```

### 3.3 Data Flow

```
┌──────────────┐
│ User clicks  │
│ "Clean Disk" │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Validation Service   │
│ - Check disk selected│
│ - Verify not OS disk │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Confirmation Dialog  │
│ - Show disk info     │
│ - Require typing     │
│   "CLEAN" to confirm │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ IPC to Main Process  │
│ { action: 'clean',   │
│   diskId: 1 }        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Command Builder      │
│ select disk 1        │
│ clean                │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ CLI Executor         │
│ - Spawn diskpart     │
│ - Send commands      │
│ - Capture output     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Output Parser        │
│ - Parse success/fail │
│ - Extract messages   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ IPC Response         │
│ { success: true,     │
│   message: "..." }   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ UI Update            │
│ - Show notification  │
│ - Refresh disk list  │
│ - Update status      │
└──────────────────────┘
```

---

## 4. Security & Privilege Management

### 4.1 Elevation Strategy

**Challenge:** Diskpart requires administrator privileges to execute.

**Solution: Hybrid Approach**

1. **Application Launch:**
   - App starts with normal user privileges
   - Detect if running as administrator on startup

2. **Privilege Escalation Options:**

   **Option A: Request elevation on demand (Recommended)**
   ```
   User Action → Check Privileges → Request UAC → Execute Command
   ```
   - Use `sudo-prompt` npm package or native Windows elevation
   - Only elevate for specific operations
   - Better security posture

   **Option B: Require admin launch**
   ```
   App Manifest → requestedExecutionLevel: requireAdministrator
   ```
   - Simpler implementation
   - Always runs elevated
   - Less secure but easier to manage

**Recommendation:** Start with Option B for MVP, migrate to Option A for production.

### 4.2 Security Measures

1. **Input Validation:**
   - Whitelist allowed commands
   - Sanitize all user inputs
   - Validate disk/partition IDs against current system state

2. **Command Whitelisting:**
   ```typescript
   const ALLOWED_COMMANDS = [
     'list disk',
     'list volume',
     'list partition',
     'select disk',
     'detail disk',
     'clean',
     'create partition',
     // ... etc
   ];
   ```

3. **OS Disk Protection:**
   - Detect system/boot disk
   - Prevent operations on OS disk
   - Visual indicators for protected disks

4. **Confirmation Requirements:**
   - Type-to-confirm for destructive operations
   - Clear warnings about data loss
   - Show affected disk/partition details

5. **Audit Logging:**
   - Log all executed commands
   - Store in local file with timestamps
   - Include user confirmations

---

## 5. User Interface Design

### 5.1 Layout Structure

```
┌────────────────────────────────────────────────────────────┐
│  Diskpart GUI                                    [_][□][X] │
├────────────────────────────────────────────────────────────┤
│  File  Edit  View  Tools  Help                             │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐  ┌──────────────────────────────┐│
│  │   DISK LIST         │  │   DISK DETAILS               ││
│  │                     │  │                              ││
│  │  ● Disk 0 (C:)     │  │  Disk 0                      ││
│  │    465 GB          │  │  Status: Online              ││
│  │    System Disk     │  │  Size: 465 GB                ││
│  │                     │  │  Free: 120 GB                ││
│  │  ○ Disk 1          │  │                              ││
│  │    1000 GB         │  │  Partitions:                 ││
│  │    External        │  │  ┌────────────────────────┐  ││
│  │                     │  │  │ C: (NTFS) 345 GB      │  ││
│  │  ○ Disk 2          │  │  │ System, Boot, Active  │  ││
│  │    32 GB           │  │  └────────────────────────┘  ││
│  │    USB Drive       │  │  ┌────────────────────────┐  ││
│  │                     │  │  │ Unallocated 120 GB    │  ││
│  │                     │  │  └────────────────────────┘  ││
│  └─────────────────────┘  └──────────────────────────────┘│
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │   OPERATIONS                                         │ │
│  │                                                      │ │
│  │  [Refresh]  [Clean Disk]  [Create Partition]       │ │
│  │  [Format]   [Assign Letter]  [Delete Partition]    │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │   COMMAND LOG                                        │ │
│  │                                                      │ │
│  │  > list disk                                        │ │
│  │  Disk 0  Online    465 GB                          │ │
│  │  Disk 1  Online   1000 GB                          │ │
│  │  > select disk 1                                    │ │
│  │  Disk 1 is now the selected disk.                  │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
├────────────────────────────────────────────────────────────┤
│  Status: Ready  |  Selected: Disk 1  |  Admin: Yes        │
└────────────────────────────────────────────────────────────┘
```

### 5.2 Key UI Components

**Disk List Panel:**
- Visual indicators for disk status (online/offline)
- Color coding for system disks (red border/icon)
- Size and type information
- Selection state

**Disk Details Panel:**
- Comprehensive disk information
- Visual partition layout (bar chart)
- Partition properties
- File system information

**Operations Panel:**
- Context-aware button states (enabled/disabled)
- Tooltips explaining each operation
- Visual grouping by operation type

**Command Log:**
- Scrollable command history
- Syntax highlighting
- Timestamps
- Success/error indicators

### 5.3 Visual Design Principles

1. **Safety Through Color:**
   - Green: Safe operations
   - Yellow: Caution required
   - Red: Destructive operations
   - Gray: Disabled/unavailable

2. **Progressive Disclosure:**
   - Show basic info by default
   - Expand for advanced details
   - Hide complexity until needed

3. **Immediate Feedback:**
   - Loading spinners for operations
   - Progress bars for long operations
   - Toast notifications for completion

4. **Accessibility:**
   - Keyboard shortcuts for common operations
   - High contrast mode support
   - Screen reader compatible

---

## 6. Safety Features & Confirmations

### 6.1 Confirmation Dialog System

**Three-Tier Confirmation System:**

**Tier 1: Simple Confirmation (Low Risk)**
- Operations: Assign letter, list operations
- Dialog: Simple "Are you sure?" with OK/Cancel

**Tier 2: Detailed Confirmation (Medium Risk)**
- Operations: Create partition, extend, shrink
- Dialog: Show operation details, affected disk/partition, OK/Cancel

**Tier 3: Type-to-Confirm (High Risk)**
- Operations: Clean, clean all, format, delete partition
- Dialog: 
  - Show detailed warning
  - Display affected disk/partition info
  - Require typing specific text (e.g., "DELETE" or disk name)
  - Checkbox: "I understand this will erase all data"

### 6.2 Confirmation Dialog Example

```
┌─────────────────────────────────────────────────┐
│  ⚠️  WARNING: Destructive Operation             │
├─────────────────────────────────────────────────┤
│                                                  │
│  You are about to CLEAN Disk 1                  │
│                                                  │
│  This will:                                      │
│  • Erase ALL data on the disk                   │
│  • Remove ALL partitions                        │
│  • Make the disk unreadable until formatted     │
│                                                  │
│  Disk Information:                               │
│  • Size: 1000 GB                                │
│  • Type: External USB                           │
│  • Current Partitions: 2                        │
│                                                  │
│  ⚠️  THIS CANNOT BE UNDONE                      │
│                                                  │
│  To confirm, type: CLEAN DISK 1                 │
│  ┌──────────────────────────────────────────┐  │
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ☐ I understand this will erase all data       │
│                                                  │
│  [Cancel]                    [Confirm Clean]    │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 6.3 Safety Checks

**Pre-Operation Validation:**
1. Verify disk/partition exists
2. Check if disk is system disk
3. Verify disk is not in use by critical processes
4. Check available space for operations
5. Validate operation parameters

**System Disk Protection:**
```typescript
interface DiskInfo {
  id: number;
  isSystemDisk: boolean;
  isBootDisk: boolean;
  hasWindowsPartition: boolean;
}

function canPerformOperation(disk: DiskInfo, operation: string): boolean {
  if (disk.isSystemDisk && DESTRUCTIVE_OPS.includes(operation)) {
    return false; // Block destructive ops on system disk
  }
  return true;
}
```

**Operation Logging:**
- Log all operations to file
- Include timestamp, user, operation, target
- Store confirmations and warnings shown
- Useful for troubleshooting and audit

---

## 7. Error Handling & User Feedback

### 7.1 Error Categories

**System Errors:**
- Diskpart not found
- Insufficient privileges
- Windows version incompatibility

**Operation Errors:**
- Disk not found
- Partition in use
- Insufficient space
- Invalid parameters

**User Errors:**
- No disk selected
- Invalid input
- Operation not allowed

### 7.2 Error Handling Strategy

```typescript
interface OperationResult {
  success: boolean;
  message: string;
  errorCode?: string;
  details?: string;
  suggestion?: string;
}

// Example error response
{
  success: false,
  message: "Failed to clean disk",
  errorCode: "DISK_IN_USE",
  details: "The disk contains partitions that are currently in use",
  suggestion: "Close any programs accessing the disk and try again"
}
```

### 7.3 User Feedback Mechanisms

**Toast Notifications:**
- Success: Green toast, auto-dismiss
- Warning: Yellow toast, manual dismiss
- Error: Red toast, manual dismiss with details

**Status Bar:**
- Current operation status
- Last operation result
- Admin privilege indicator

**Progress Indicators:**
- Indeterminate spinner for quick operations
- Progress bar for long operations (format, clean all)
- Estimated time remaining

**Command Log:**
- Real-time command output
- Color-coded success/error
- Expandable error details

---

## 8. Project Structure

### 8.1 Directory Structure

```
diskpart-gui/
├── src/
│   ├── main/                      # Electron main process
│   │   ├── index.ts              # Main entry point
│   │   ├── ipc/                  # IPC handlers
│   │   │   ├── diskpart.handler.ts
│   │   │   └── system.handler.ts
│   │   ├── services/             # Backend services
│   │   │   ├── diskpart/
│   │   │   │   ├── command-builder.ts
│   │   │   │   ├── cli-executor.ts
│   │   │   │   ├── output-parser.ts
│   │   │   │   └── validator.ts
│   │   │   ├── privilege-manager.ts
│   │   │   └── logger.ts
│   │   └── utils/
│   │       ├── elevation.ts
│   │       └── system-info.ts
│   │
│   ├── renderer/                  # React frontend
│   │   ├── src/
│   │   │   ├── App.tsx           # Root component
│   │   │   ├── main.tsx          # Entry point
│   │   │   ├── components/       # React components
│   │   │   │   ├── DiskList/
│   │   │   │   │   ├── DiskList.tsx
│   │   │   │   │   ├── DiskItem.tsx
│   │   │   │   │   └── DiskList.module.css
│   │   │   │   ├── DiskDetails/
│   │   │   │   │   ├── DiskDetails.tsx
│   │   │   │   │   ├── PartitionView.tsx
│   │   │   │   │   └── DiskDetails.module.css
│   │   │   │   ├── Operations/
│   │   │   │   │   ├── OperationPanel.tsx
│   │   │   │   │   └── OperationButton.tsx
│   │   │   │   ├── Dialogs/
│   │   │   │   │   ├── ConfirmationDialog.tsx
│   │   │   │   │   ├── TypeToConfirmDialog.tsx
│   │   │   │   │   └── ErrorDialog.tsx
│   │   │   │   ├── CommandLog/
│   │   │   │   │   └── CommandLog.tsx
│   │   │   │   └── Layout/
│   │   │   │       ├── MainLayout.tsx
│   │   │   │       └── StatusBar.tsx
│   │   │   ├── stores/           # State management
│   │   │   │   ├── diskStore.ts
│   │   │   │   ├── operationStore.ts
│   │   │   │   └── uiStore.ts
│   │   │   ├── services/         # Frontend services
│   │   │   │   ├── diskpart.service.ts
│   │   │   │   ├── validation.service.ts
│   │   │   │   └── notification.service.ts
│   │   │   ├── types/            # TypeScript types
│   │   │   │   ├── disk.types.ts
│   │   │   │   ├── operation.types.ts
│   │   │   │   └── ipc.types.ts
│   │   │   ├── utils/
│   │   │   │   ├── formatters.ts
│   │   │   │   └── validators.ts
│   │   │   └── styles/
│   │   │       ├── global.css
│   │   │       └── theme.ts
│   │   ├── index.html
│   │   └── vite.config.ts
│   │
│   └── preload/                   # Preload scripts
│       └── index.ts              # Expose IPC to renderer
│
├── resources/                     # App resources
│   ├── icons/
│   │   ├── icon.ico
│   │   └── icon.png
│   └── manifest.xml              # Windows manifest
│
├── scripts/                       # Build scripts
│   ├── build.js
│   └── dev.js
│
├── docs/                          # Documentation
│   ├── ARCHITECTURE.md           # This file
│   ├── API.md                    # API documentation
│   └── USER_GUIDE.md             # User documentation
│
├── tests/                         # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .gitignore
├── package.json
├── tsconfig.json
├── electron-builder.json         # Build configuration
└── README.md
```

### 8.2 Key Files Description

**Main Process:**
- [`index.ts`](src/main/index.ts): Electron app initialization, window creation
- [`diskpart.handler.ts`](src/main/ipc/diskpart.handler.ts): IPC handlers for diskpart operations
- [`command-builder.ts`](src/main/services/diskpart/command-builder.ts): Constructs diskpart command scripts
- [`cli-executor.ts`](src/main/services/diskpart/cli-executor.ts): Executes diskpart with child_process
- [`output-parser.ts`](src/main/services/diskpart/output-parser.ts): Parses diskpart output into structured data

**Renderer Process:**
- [`App.tsx`](src/renderer/src/App.tsx): Root React component
- [`diskStore.ts`](src/renderer/src/stores/diskStore.ts): Zustand store for disk state
- [`diskpart.service.ts`](src/renderer/src/services/diskpart.service.ts): IPC communication wrapper
- [`DiskList.tsx`](src/renderer/src/components/DiskList/DiskList.tsx): Disk list component
- [`ConfirmationDialog.tsx`](src/renderer/src/components/Dialogs/ConfirmationDialog.tsx): Confirmation dialogs

**Preload:**
- [`index.ts`](src/preload/index.ts): Exposes safe IPC methods to renderer

### 8.3 Configuration Files

**package.json:**
```json
{
  "name": "diskpart-gui",
  "version": "1.0.0",
  "main": "dist/main/index.js",
  "scripts": {
    "dev": "node scripts/dev.js",
    "build": "node scripts/build.js",
    "build:win": "electron-builder --win"
  },
  "dependencies": {
    "electron": "^28.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "antd": "^5.11.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "electron-builder": "^24.0.0"
  }
}
```

**electron-builder.json:**
```json
{
  "appId": "com.diskpartgui.app",
  "productName": "Diskpart GUI",
  "directories": {
    "output": "release"
  },
  "win": {
    "target": ["nsis"],
    "icon": "resources/icons/icon.ico",
    "requestedExecutionLevel": "requireAdministrator"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

---

## 9. Data Models & Types

### 9.1 Core Type Definitions

```typescript
// Disk Types
interface Disk {
  id: number;
  status: 'Online' | 'Offline' | 'No Media';
  size: number; // in bytes
  free: number; // in bytes
  isSystemDisk: boolean;
  isBootDisk: boolean;
  diskType: 'Basic' | 'Dynamic';
  partitionStyle: 'MBR' | 'GPT';
  partitions: Partition[];
}

interface Partition {
  id: number;
  type: 'Primary' | 'Extended' | 'Logical';
  size: number;
  offset: number;
  status: 'Healthy' | 'Active' | 'System' | 'Boot';
  fileSystem?: 'NTFS' | 'FAT32' | 'exFAT' | 'RAW';
  label?: string;
  driveLetter?: string;
}

interface Volume {
  letter?: string;
  label?: string;
  fileSystem: string;
  type: 'Partition' | 'Removable' | 'CD-ROM';
  size: number;
  status: 'Healthy' | 'Failed';
  info: string;
}

// Operation Types
interface Operation {
  id: string;
  type: OperationType;
  targetDisk?: number;
  targetPartition?: number;
  parameters: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  timestamp: Date;
  result?: OperationResult;
}

type OperationType = 
  | 'list_disks'
  | 'list_volumes'
  | 'list_partitions'
  | 'select_disk'
  | 'clean_disk'
  | 'clean_all'
  | 'create_partition'
  | 'delete_partition'
  | 'format_volume'
  | 'assign_letter'
  | 'remove_letter'
  | 'extend_partition'
  | 'shrink_partition';

interface OperationResult {
  success: boolean;
  message: string;
  errorCode?: string;
  details?: string;
  data?: any;
}

// IPC Message Types
interface IPCRequest {
  channel: string;
  operation: OperationType;
  payload: any;
}

interface IPCResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}
```

### 9.2 State Management Schema

```typescript
// Disk Store
interface DiskState {
  disks: Disk[];
  selectedDiskId: number | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setDisks: (disks: Disk[]) => void;
  selectDisk: (diskId: number) => void;
  refreshDisks: () => Promise<void>;
}

// Operation Store
interface OperationState {
  currentOperation: Operation | null;
  operationHistory: Operation[];
  
  // Actions
  startOperation: (operation: Operation) => void;
  completeOperation: (result: OperationResult) => void;
  clearHistory: () => void;
}

// UI Store
interface UIState {
  confirmationDialog: {
    open: boolean;
    type: 'simple' | 'detailed' | 'type-to-confirm';
    operation: Operation | null;
  };
  notifications: Notification[];
  
  // Actions
  showConfirmation: (operation: Operation) => void;
  hideConfirmation: () => void;
  addNotification: (notification: Notification) => void;
}
```

---

## 10. Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** Set up project structure and basic Electron + React application

**Tasks:**
1. Initialize Electron + React + TypeScript project
2. Set up build configuration (Vite, electron-builder)
3. Implement basic window management
4. Create project directory structure
5. Set up IPC communication skeleton
6. Implement basic UI layout (empty panels)

**Deliverables:**
- Running Electron app with React frontend
- Basic window with layout structure
- IPC communication working

### Phase 2: Core Diskpart Integration (Week 3-4)
**Goal:** Implement diskpart command execution and parsing

**Tasks:**
1. Implement CLI executor with child_process
2. Create command builder for diskpart scripts
3. Implement output parser for diskpart responses
4. Add privilege detection and elevation
5. Implement list operations (disks, volumes, partitions)
6. Create data models and type definitions

**Deliverables:**
- Working diskpart command execution
- Parsed disk/partition data
- List operations functional

### Phase 3: UI Components (Week 5-6)
**Goal:** Build all UI components and state management

**Tasks:**
1. Implement Disk List component
2. Implement Disk Details component
3. Implement Partition visualization
4. Create Operation Panel with buttons
5. Implement Command Log viewer
6. Set up Zustand stores
7. Connect UI to IPC services

**Deliverables:**
- Complete UI with all components
- State management working
- Visual disk/partition display

### Phase 4: Operations & Safety (Week 7-8)
**Goal:** Implement all disk operations with safety features

**Tasks:**
1. Implement confirmation dialog system
2. Add type-to-confirm for destructive operations
3. Implement system disk protection
4. Add all disk operations (clean, format, partition)
5. Implement validation layer
6. Add operation logging

**Deliverables:**
- All core operations working
- Safety confirmations in place
- System disk protection active

### Phase 5: Polish & Testing (Week 9-10)
**Goal:** Refine UX, add error handling, and test thoroughly

**Tasks:**
1. Implement comprehensive error handling
2. Add toast notifications
3. Improve visual feedback (loading states, progress)
4. Add keyboard shortcuts
5. Write unit tests
6. Perform integration testing
7. User acceptance testing

**Deliverables:**
- Polished, production-ready application
- Comprehensive error handling
- Test coverage

### Phase 6: Documentation & Release (Week 11-12)
**Goal:** Prepare for release

**Tasks:**
1. Write user documentation
2. Create API documentation
3. Build installer with electron-builder
4. Create release notes
5. Prepare distribution package

**Deliverables:**
- Complete documentation
- Windows installer
- Release package

---

## 11. Technical Considerations

### 11.1 Performance Optimization

**Diskpart Execution:**
- Cache disk list to avoid repeated queries
- Debounce refresh operations
- Use worker threads for long operations (if needed)

**UI Rendering:**
- Virtualize long lists (if many disks/partitions)
- Memoize expensive components
- Optimize re-renders with React.memo

**Memory Management:**
- Limit command log history
- Clean up event listeners
- Dispose of unused resources

### 11.2 Cross-Platform Considerations

While targeting Windows initially, the architecture supports future expansion:

**Platform-Specific Code:**
```typescript
// Abstract disk manager interface
interface IDiskManager {
  listDisks(): Promise<Disk[]>;
  executeOperation(op: Operation): Promise<OperationResult>;
}

// Windows implementation
class WindowsDiskManager implements IDiskManager {
  // Uses diskpart
}

// Future: Linux implementation
class LinuxDiskManager implements IDiskManager {
  // Uses fdisk/parted
}
```

### 11.3 Testing Strategy

**Unit Tests:**
- Command builder logic
- Output parser
- Validation functions
- State management

**Integration Tests:**
- IPC communication
- Full operation workflows
- Error handling paths

**E2E Tests:**
- User workflows (list → select → operation)
- Confirmation dialogs
- Error scenarios

**Manual Testing:**
- Test on different Windows versions
- Test with various disk configurations
- Test privilege escalation
- Test destructive operations (on test disks!)

### 11.4 Security Considerations

**Input Sanitization:**
- Never pass user input directly to CLI
- Validate all parameters
- Use parameterized command building

**Privilege Management:**
- Minimize elevated code surface
- Validate operations before elevation
- Log all elevated operations

**Data Protection:**
- Never log sensitive data
- Secure IPC channels
- Validate all IPC messages

---

## 12. Future Enhancements

### 12.1 Potential Features

**Advanced Operations:**
- Disk cloning
- Partition alignment optimization
- RAID configuration
- BitLocker management

**Automation:**
- Script recording/playback
- Batch operations
- Scheduled tasks

**Monitoring:**
- Disk health monitoring (SMART data)
- Space usage alerts
- Performance metrics

**Integration:**
- PowerShell script export
- Command-line interface
- REST API for remote management

### 12.2 Extensibility

**Plugin System:**
- Allow third-party extensions
- Custom operation types
- UI theme plugins

**Configuration:**
- User preferences
- Custom confirmation levels
- Keyboard shortcut customization

---

## 13. Risk Assessment & Mitigation

### 13.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data loss from bugs | CRITICAL | Medium | Extensive testing, confirmation dialogs, system disk protection |
| Privilege escalation issues | HIGH | Low | Use established libraries, thorough security review |
| Diskpart output parsing errors | MEDIUM | Medium | Robust parser with error handling, extensive test cases |
| Performance issues | LOW | Low | Optimize critical paths, use caching |

### 13.2 User Experience Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Accidental destructive operations | CRITICAL | Medium | Type-to-confirm, clear warnings, undo where possible |
| Confusion about disk selection | MEDIUM | High | Clear visual indicators, confirmation dialogs show disk info |
| Unclear error messages | MEDIUM | Medium | User-friendly error messages with suggestions |

---

## 14. Success Metrics

### 14.1 Technical Metrics

- **Reliability:** 99.9% operation success rate (excluding user errors)
- **Performance:** < 2s for list operations, < 5s for format operations
- **Test Coverage:** > 80% code coverage
- **Error Rate:** < 1% unhandled errors

### 14.2 User Experience Metrics

- **Usability:** Users can complete common tasks without documentation
- **Safety:** Zero data loss incidents from application bugs
- **Satisfaction:** Positive user feedback on UI/UX
- **Adoption:** Preferred over command-line diskpart for common tasks

---

## 15. Conclusion

This architecture provides a solid foundation for building a comprehensive Diskpart GUI application. The design prioritizes:

1. **Safety:** Multiple confirmation layers and system disk protection
2. **Usability:** Modern, intuitive interface with clear visual feedback
3. **Maintainability:** Clean separation of concerns, TypeScript for type safety
4. **Extensibility:** Modular architecture supports future enhancements

**Key Architectural Decisions:**
- **Electron + React:** Rapid development with modern web technologies
- **TypeScript:** Type safety throughout the application
- **Zustand:** Lightweight state management
- **Three-tier confirmations:** Appropriate safety for operation risk level
- **IPC-based architecture:** Clean separation between UI and system operations

**Next Steps:**
1. Review and approve this architecture
2. Set up development environment
3. Begin Phase 1 implementation
4. Iterate based on feedback and testing

The architecture is designed to be implemented incrementally, with each phase building on the previous one. This allows for early testing and feedback while maintaining a clear path to the final product.