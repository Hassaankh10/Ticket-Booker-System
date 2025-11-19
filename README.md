# TicketBooker - Online Event Booking System

A modern ticket booking system built with Next.js, React, and SQLite.

## Prerequisites

Before running the project, ensure you have the following installed:

- **Node.js** (version 16.x or higher)
- **npm** (comes with Node.js) or **yarn**

### Checking Your Installation

Open your terminal/command prompt and run:

```bash
node --version
npm --version
```

If these commands don't work, you need to install Node.js first.

## Installation & Running Instructions

### For macOS

1. **Open Terminal**
   - Press `Cmd + Space` to open Spotlight
   - Type "Terminal" and press Enter

2. **Navigate to the project directory**
   ```bash
   cd /path/to/Ticket-Booker-System
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open your browser and go to: `http://localhost:3000`

6. **Stop the server**
   - Press `Ctrl + C` in the terminal

### For Linux

1. **Open Terminal**
   - Press `Ctrl + Alt + T` (most distributions)
   - Or search for "Terminal" in your applications menu

2. **Navigate to the project directory**
   ```bash
   cd /path/to/Ticket-Booker-System
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open your browser and go to: `http://localhost:3000`

6. **Stop the server**
   - Press `Ctrl + C` in the terminal

### For Windows

1. **Open Command Prompt or PowerShell**
   - Press `Win + R`, type `cmd` or `powershell`, and press Enter
   - Or search for "Command Prompt" or "PowerShell" in the Start menu

2. **Navigate to the project directory**
   ```cmd
   cd C:\path\to\Ticket-Booker-System
   ```
   Note: Use backslashes (`\`) in Windows paths, or use forward slashes (`/`) in PowerShell

3. **Install dependencies**
   ```cmd
   npm install
   ```

4. **Run the development server**
   ```cmd
   npm run dev
   ```

5. **Access the application**
   - Open your browser and go to: `http://localhost:3000`

6. **Stop the server**
   - Press `Ctrl + C` in the command prompt

## Available Scripts

- `npm run dev` - Start the development server (runs on port 3000)
- `npm run build` - Build the application for production
- `npm start` - Start the production server (requires build first)
- `npm install` - Install all project dependencies

## Troubleshooting

### Port 3000 Already in Use

If you see an error that port 3000 is already in use:

**macOS/Linux:**
```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

**Windows:**
```cmd
# Find the process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with the actual process ID)
taskkill /PID <PID> /F
```

### Node.js Not Found

If you get a "node: command not found" error:

1. **macOS**: Install Node.js from [nodejs.org](https://nodejs.org/) or use Homebrew:
   ```bash
   brew install node
   ```

2. **Linux**: Install Node.js using your package manager:
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install nodejs npm

   # Fedora
   sudo dnf install nodejs npm
   ```

3. **Windows**: Download and install Node.js from [nodejs.org](https://nodejs.org/)

### Dependencies Installation Fails

If `npm install` fails:

1. Clear npm cache:
   ```bash
   npm cache clean --force
   ```

2. Delete `node_modules` folder and `package-lock.json`:
   ```bash
   # macOS/Linux
   rm -rf node_modules package-lock.json

   # Windows
   rmdir /s node_modules
   del package-lock.json
   ```

3. Try installing again:
   ```bash
   npm install
   ```

## First Time Setup

On first run, the application will automatically:
- Create the SQLite database
- Run database migrations
- Seed initial data (admin user, sample events)

The database file (`ticket_booking_system.db`) will be created in the project root directory.

## Default Admin Credentials

After first run, you can log in with:
- **Email**: `admin@ticketbooker.com`
- **Password**: `admin123`

**Note**: Change the default password after first login for security.

## Support

If you encounter any issues:
1. Check that Node.js and npm are properly installed
2. Ensure all dependencies are installed (`npm install`)
3. Check the terminal/console for error messages
4. Verify that port 3000 is not being used by another application
