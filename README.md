# Diskpart GUI

A modern, user-friendly graphical interface for Windows Diskpart disk management operations, built with Electron, React, and TypeScript.

## Overview

Diskpart GUI provides a safe and intuitive way to manage disks, partitions, and volumes on Windows systems. It wraps the powerful Windows Diskpart command-line utility with a modern UI that includes safety confirmations, visual feedback, and protection against accidental data loss.

## Features

- 🖥️ **Modern UI**: Built with React and Ant Design for a clean, professional interface
- 🔒 **Safety First**: Multiple confirmation layers for destructive operations
- 🛡️ **System Protection**: Automatic detection and protection of system disks
- 📊 **Visual Feedback**: Real-time command output and operation status
- ⚡ **Fast & Responsive**: Electron-based desktop application
- 🎯 **Type-Safe**: Full TypeScript implementation for reliability

## Supported Operations

- List disks, volumes, and partitions
- Select and view disk details
- Create and delete partitions
- Format volumes with various file systems
- Assign and remove drive letters
- Clean disks (with safety confirmations)
- Extend and shrink partitions

## Prerequisites

- **Operating System**: Windows 10 or Windows 11
- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (comes with Node.js)
- **Administrator Privileges**: Required for disk operations

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Diskpart_GUI
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- Electron 28.x
- React 18.x
- TypeScript 5.x
- Ant Design 5.x
- Zustand (state management)
- Webpack and build tools

### 3. Verify Installation

Check that all dependencies are installed correctly:

```bash
npm list --depth=0
```

## Development

### Running in Development Mode

To start the application in development mode with hot reload:

```bash
npm run dev
```

This command will:
1. Start the webpack dev server for the renderer process (React UI)
2. Build and watch the main process (Electron)
3. Launch the Electron application

The application will automatically reload when you make changes to the code.

### Development Scripts

- `npm run dev` - Start development mode with hot reload
- `npm run dev:renderer` - Start only the renderer dev server
- `npm run dev:main` - Build and watch the main process
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint code linting

## Building

### Build for Development

```bash
npm run build
```

This creates a development build in the `dist/` directory.

### Build for Production

```bash
npm run package
```

This will:
1. Create an optimized production build
2. Package the application using electron-builder
3. Generate an installer in the `release/` directory

### Build Options

- `npm run package` - Create installer (NSIS)
- `npm run package:dir` - Create unpacked directory (for testing)

## Project Structure

```
Diskpart_GUI/
├── src/
│   ├── main/              # Electron main process
│   │   └── main.ts        # Main process entry point
│   ├── preload/           # Preload scripts
│   │   └── preload.ts     # IPC bridge (secure)
│   ├── renderer/          # React application
│   │   ├── App.tsx        # Main React component
│   │   ├── index.tsx      # React entry point
│   │   └── styles/        # CSS styles
│   └── shared/            # Shared types and utilities
│       └── types.ts       # TypeScript type definitions
├── public/                # Static assets
│   └── index.html         # HTML template
├── dist/                  # Build output (generated)
├── release/               # Packaged app (generated)
├── package.json           # Project configuration
├── tsconfig.json          # TypeScript config (renderer)
├── tsconfig.main.json     # TypeScript config (main)
├── webpack.renderer.config.js  # Webpack config (renderer)
└── webpack.main.config.js      # Webpack config (main)
```

## Architecture

The application follows a standard Electron architecture:

- **Main Process**: Node.js backend that handles system operations and Diskpart execution
- **Renderer Process**: React frontend that provides the user interface
- **Preload Script**: Secure bridge between main and renderer processes using IPC
- **Shared Types**: TypeScript definitions used across all processes

For detailed architecture information, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Security

### Administrator Privileges

The application requires administrator privileges to execute Diskpart commands. The application is configured to request elevation on launch.

### IPC Security

- Context isolation is enabled
- Node integration is disabled in the renderer
- All IPC communication goes through the secure preload script
- Input validation on all commands

### Safety Features

- Type-to-confirm dialogs for destructive operations
- System disk detection and protection
- Clear warnings about data loss
- Operation logging for audit trails

## Troubleshooting

### Application Won't Start

1. Ensure you have Node.js 18.x or higher installed
2. Delete `node_modules` and run `npm install` again
3. Check that you're running as Administrator

### Build Errors

1. Clear the build cache: `rm -rf dist/ release/`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check TypeScript errors: `npm run type-check`

### Diskpart Operations Fail

1. Verify the application is running with Administrator privileges
2. Check Windows Event Viewer for system errors
3. Ensure Diskpart is available on your system: `diskpart /?`

## Development Roadmap

### Phase 1: Foundation ✅ (Current)
- Project setup and structure
- Basic Electron + React application
- IPC communication framework

### Phase 2: Core Integration (Next)
- Diskpart command execution
- Output parsing
- List operations

### Phase 3: UI Components
- Disk list and details views
- Partition visualization
- Operation panel

### Phase 4: Operations & Safety
- All disk operations
- Confirmation dialogs
- System disk protection

### Phase 5: Polish & Testing
- Error handling
- User feedback
- Testing

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- UI components from [Ant Design](https://ant.design/)
- State management with [Zustand](https://github.com/pmndrs/zustand)

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

**⚠️ Warning**: This application performs disk operations that can result in data loss. Always backup important data before performing any disk operations. The developers are not responsible for any data loss resulting from the use of this application.
