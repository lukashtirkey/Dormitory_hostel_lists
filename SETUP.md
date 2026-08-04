# Quick Setup Guide

## Prerequisites Installation

### Install Node.js and npm

1. **Download Node.js:**
   - Go to: https://nodejs.org/
   - Download the LTS (Long Term Support) version
   - Run the installer
   - Follow the installation wizard (accept default settings)

2. **Verify Installation:**
   Open PowerShell and run:
   ```powershell
   node --version
   npm --version
   ```
   
   You should see version numbers for both commands.

## Application Setup

Once Node.js is installed:

1. **Open PowerShell in this directory:**
   ```powershell
   cd c:\hostel_dormentry_list
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Start the server:**
   ```powershell
   npm start
   ```

4. **Open your browser:**
   - Navigate to: http://localhost:3000

## First Time Setup

1. **Add Dormitories:**
   - Go to "Dormitories" tab
   - Enter dormitory name (e.g., "Dorm A", "Dorm B")
   - Enter capacity (number of residents)
   - Click "Add Dormitory"

2. **Add Residents:**
   - Go to "Residents" tab
   - Enter resident names
   - Click "Add Resident"

3. **Initialize Assignment:**
   - Go to "Current Assignment" tab
   - Click "Initialize First Assignment"
   - Residents will be distributed across dormitories

4. **View Status:**
   - Check the top status card for:
     - Last rotation date
     - Next rotation date
     - Days until next rotation

## Automatic Rotation

The system will automatically:
- Check for rotation needs daily at midnight
- Check every hour as a safety measure
- Rotate residents to new dormitories every 15 days (customizable in Settings)
- Save rotation history

## Tips

- Keep the server running for automatic rotation to work
- You can manually trigger rotation anytime from "Current Assignment" tab
- Change rotation interval in the "Settings" tab
- View past rotations in the "History" tab

## Troubleshooting

**Port 3000 already in use:**
- Edit `server.js` and change `const PORT = 3000;` to another port (e.g., 3001)

**Cannot connect:**
- Make sure the server is running (check PowerShell window)
- Try: http://127.0.0.1:3000 instead

**Need to run as background service:**
- Consider using PM2: `npm install -g pm2`
- Then: `pm2 start server.js`
