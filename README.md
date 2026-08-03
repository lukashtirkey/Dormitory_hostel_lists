# 🏠 Hostel Dormitory Manager

A comprehensive hostel dormitory management system with **automatic rotation every 15 days** (customizable).

## Features

- ✅ Add and manage dormitories with capacity limits
- ✅ Add and manage residents
- ✅ **Automatic rotation system** - residents are automatically moved to different dormitories every 15 days
- ✅ Manual rotation option for immediate changes
- ✅ Rotation history tracking
- ✅ Customizable rotation interval
- ✅ Beautiful, responsive web interface
- ✅ Real-time status updates showing next rotation date
- ✅ Scheduled checks run daily at midnight and hourly

## Installation

1. **Install Node.js** (if not already installed)
   - Download from: https://nodejs.org/

2. **Install dependencies:**
   ```powershell
   npm install
   ```

## Usage

1. **Start the server:**
   ```powershell
   npm start
   ```

2. **Open your browser:**
   - Go to: http://localhost:3000

3. **Set up your hostel:**
   - Add dormitories (e.g., "Dorm A", "Dorm B", etc.) with capacity
   - Add residents
   - Click "Initialize First Assignment" to distribute residents
   - The system will automatically rotate every 15 days!

## How Automatic Rotation Works

1. **Scheduled Checks:** The system automatically checks for rotation needs:
   - Daily at midnight
   - Every hour (safety check)
   - On server startup

2. **Rotation Logic:** When it's time to rotate:
   - Current assignments are saved to history
   - Residents are shifted to the next dormitory
   - Next rotation date is calculated
   - All data is automatically saved

3. **Customization:** You can change the rotation interval in the Settings tab

## Manual Controls

- **Initialize Assignment:** Distributes residents evenly across dormitories for the first time
- **Rotate Now:** Manually trigger a rotation before the scheduled date
- **Settings:** Change rotation interval (default: 15 days)

## File Structure

```
hostel_dormentry_list/
├── server.js              # Backend server with rotation logic
├── package.json           # Dependencies
├── public/
│   ├── index.html        # Main interface
│   ├── app.js            # Frontend logic
│   └── styles.css        # Styling
├── data/
│   ├── dormitory_data.json     # Main data (auto-created)
│   └── rotation_history.json   # History log (auto-created)
└── README.md             # This file
```

## API Endpoints

- `GET /api/data` - Get all current data
- `GET /api/history` - Get rotation history
- `POST /api/dormitories` - Add dormitory
- `DELETE /api/dormitories/:name` - Delete dormitory
- `POST /api/residents` - Add resident
- `DELETE /api/residents/:name` - Delete resident
- `POST /api/initialize-rotation` - Initialize first assignment
- `POST /api/rotate` - Manually trigger rotation
- `POST /api/settings` - Update rotation interval

## Data Persistence

All data is stored in JSON files in the `data` directory:
- `dormitory_data.json` - Current state and assignments
- `rotation_history.json` - Historical rotation records

## Troubleshooting

**Server won't start:**
- Make sure port 3000 is available
- Check that Node.js is installed: `node --version`

**Rotation not happening:**
- Check the "Next Rotation" date in the Status section
- Server must be running continuously for automatic rotation
- Check server console for rotation logs

**Data lost:**
- Backup the `data` folder regularly
- All data is in JSON format and can be manually edited if needed

## Customization

You can modify:
- Rotation interval (via Settings tab or directly in code)
- Rotation algorithm (in `server.js`, `performRotation` function)
- UI colors and layout (in `public/styles.css`)
- Port number (change PORT variable in `server.js`)

## Future Enhancements

- Email notifications before rotation
- SMS alerts
- Export reports to PDF
- Multi-language support
- User authentication
- Mobile app version

## License

MIT License - Feel free to modify and use for your hostel!
