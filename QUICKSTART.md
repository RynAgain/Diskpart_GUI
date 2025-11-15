# Quick Start Guide - Diskpart GUI

This guide will help you get the Diskpart GUI application up and running in minutes.

## Prerequisites Check

Before starting, ensure you have:

- ✅ Windows 10 or Windows 11
- ✅ Node.js 18.x or higher ([Download](https://nodejs.org/))
- ✅ Administrator privileges on your computer

### Verify Node.js Installation

Open Command Prompt or PowerShell and run:

```bash
node --version
npm --version
```

You should see version numbers (e.g., `v18.17.0` and `9.6.7`).

## Installation Steps

### Step 1: Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This will take a few minutes to download and install all required packages.

### Step 2: Start Development Mode

Once installation is complete, start the application:

```bash
npm run dev
```

This command will:
1. Start the webpack development server
2. Build the Electron main process
3. Launch the application window

### Step 3: Verify the Application

You should see:
- A window titled "Diskpart GUI" opens
- The main interface with a welcome message
- System information displayed
- Admin status indicator in the header

## What You Should See

The initial application displays:

- **Header**: Application title and admin status indicator
- **Welcome Card**: Introduction and feature list
- **System Information**: Your platform, architecture, and Node version
- **Quick Actions**: Buttons for common operations (initially disabled until Phase 2)
- **Footer**: Copyright and technology stack information

## Common Issues

### Issue: "npm install" fails

**Solution**: 
- Delete `node_modules` folder and `package-lock.json`
- Run `npm cache clean --force`
- Run `npm install` again

### Issue: Application won't start

**Solution**:
- Ensure you're running as Administrator
- Check that port 8080 is not in use
- Try `npm run build` first, then `npm start`

### Issue: TypeScript errors in IDE

**Solution**:
- These are expected before running `npm install`
- After installation, restart your IDE/editor
- Run `npm run type-check` to verify

### Issue: "Cannot find module 'electron'"

**Solution**:
- Run `npm install` to install all dependencies
- Verify `node_modules` folder exists
- Check that `package.json` includes electron in dependencies

## Next Steps

Now that you have the basic application running:

1. **Explore the Code**: 
   - Check [`src/main/main.ts`](src/main/main.ts) for the Electron main process
   - Look at [`src/renderer/App.tsx`](src/renderer/App.tsx) for the React UI
   - Review [`src/shared/types.ts`](src/shared/types.ts) for TypeScript definitions

2. **Read the Architecture**:
   - See [`ARCHITECTURE.md`](ARCHITECTURE.md) for detailed technical documentation
   - Understand the IPC communication flow
   - Learn about the security model

3. **Development Workflow**:
   - Make changes to the code
   - The application will automatically reload
   - Check the console for any errors

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development mode with hot reload |
| `npm run build` | Build for production |
| `npm run package` | Create installer |
| `npm run type-check` | Check TypeScript types |
| `npm run lint` | Run ESLint |
| `npm start` | Run the built application |

## Project Structure Overview

```
Diskpart_GUI/
├── src/
│   ├── main/          # Electron backend (Node.js)
│   ├── preload/       # IPC bridge (security layer)
│   ├── renderer/      # React frontend (UI)
│   └── shared/        # Shared types and utilities
├── public/            # Static assets
├── resources/         # App icons and resources
└── dist/              # Build output (generated)
```

## Current Phase: Foundation ✅

You've successfully completed Phase 1 of the implementation:

- ✅ Project structure created
- ✅ Electron + React + TypeScript configured
- ✅ Basic UI with Ant Design
- ✅ IPC communication framework
- ✅ Development environment ready

## What's Next?

**Phase 2: Core Diskpart Integration** (Coming Soon)

The next phase will implement:
- Actual Diskpart command execution
- Output parsing and data extraction
- List operations (disks, volumes, partitions)
- Real-time command logging

Stay tuned for updates!

## Getting Help

- **Documentation**: See [`README.md`](README.md) for full documentation
- **Architecture**: See [`ARCHITECTURE.md`](ARCHITECTURE.md) for technical details
- **Issues**: Check the troubleshooting section in README.md

## Important Notes

⚠️ **Current Limitations**:
- This is Phase 1 - the foundation only
- Diskpart operations are not yet implemented (placeholder functions)
- The UI is functional but operations will be added in Phase 2

🔒 **Security**:
- Always run as Administrator for disk operations
- The application uses secure IPC communication
- Context isolation is enabled for security

📝 **Development**:
- TypeScript errors before `npm install` are normal
- Hot reload is enabled in development mode
- Check the console for debugging information

---

**Ready to contribute?** Check out the development roadmap in [`README.md`](README.md)!