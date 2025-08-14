# Beach Tournament Manager

A simple, modern web application for managing beach volleyball tournaments with Google Sheets integration.

## Features

- **Live Tournament Display**: View current games, upcoming games, and finished games
- **Real-time Score Updates**: Update scores for ongoing games
- **Google Sheets Integration**: Sync tournament data with Google Sheets
- **Responsive Design**: Works on desktop and mobile devices
- **Auto-refresh**: Automatically updates every 30 seconds

## Quick Start

1. **Open the application**:
   - Simply open `index.html` in your web browser
   - The app will load with demo data to show the interface

2. **Test the interface**:
   - Click "Load Demo Data" to see sample tournament games
   - Try updating scores for current games
   - See how games move between sections as they progress

## Google Sheets Setup (Optional)

To connect with your actual Google Sheets:

### 1. Create Your Tournament Sheet

Create a Google Sheet with the following columns:
- **Team A** - First team name
- **Team B** - Second team name  
- **Court** - Court number/name
- **Time** - Game time
- **Status** - `scheduled`, `current`, or `finished`
- **Set1_ScoreA** - Team A's score in Set 1
- **Set1_ScoreB** - Team B's score in Set 1
- **Set2_ScoreA** - Team A's score in Set 2
- **Set2_ScoreB** - Team B's score in Set 2
- **Set3_ScoreA** - Team A's score in Set 3 (if needed)
- **Set3_ScoreB** - Team B's score in Set 3 (if needed)
- **Date** - Tournament date

Example:
```
Team A        | Team B        | Court  | Time     | Status    | Set1_A | Set1_B | Set2_A | Set2_B | Set3_A | Set3_B | Date
Beach Bombers | Sand Sharks   | Court 1| 10:00 AM | current   | 21     | 19     | 18     | 21     |        |        | 2024-01-15
Wave Warriors | Tide Titans   | Court 2| 11:00 AM | scheduled |        |        |        |        |        |        | 2024-01-15
```

### 2. Get Your Sheet ID

From your Google Sheet URL, copy the ID:
```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
```

### 3. Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API
4. Create credentials (API Key)
5. Copy your API key

### 4. Update Configuration

In `script.js`, update these lines:
```javascript
this.googleSheetsId = 'YOUR_ACTUAL_SHEET_ID_HERE';
this.apiKey = 'YOUR_ACTUAL_API_KEY_HERE';
```

## How It Works

### Game Statuses

- **Scheduled**: Upcoming games (shown in "Next Games")
- **Current**: Games in progress (shown in "Current Games")
- **Finished**: Completed games with final scores (shown in "Finished Games")

### Score Management

- **Best of 3 Sets**: Each match consists of up to 3 sets
- **Set 1 & 2**: First to 21 points with 2-point advantage
- **Set 3**: First to 15 points with 2-point advantage (only if sets are tied 1-1)
- **Set Validation**: System prevents invalid scores (e.g., 25-25 without 2-point advantage)
- **Automatic Progression**: Games automatically move to "Finished" when a team wins 2 sets
- **Clear Display**: Set scores are clearly shown beneath team names
- **In a full implementation**, scores would sync back to Google Sheets

### Data Flow

1. App loads tournament data from Google Sheets (or demo data)
2. Games are categorized by status
3. Interface displays games in appropriate sections
4. Users can update scores for current games
5. Data refreshes automatically every 30 seconds

## File Structure

```
beach_tournament/
├── index.html          # Main HTML interface
├── script.js           # JavaScript logic and Google Sheets integration
└── README.md           # This file
```

## Customization

### Styling
- Colors and styling are in the `<style>` section of `index.html`
- Easy to modify colors, fonts, and layout
- Responsive design with mobile-friendly breakpoints

### Tournament Rules
- Modify the scoring logic in `submitScore()` function
- Change win conditions (currently set to first to 21 points)
- Add additional game information fields

### Google Sheets Structure
- Modify `parseGoogleSheetsData()` to match your sheet structure
- Add/remove columns as needed
- Change status values to match your workflow

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Works on mobile devices

## Security Notes

- API keys should be kept secure
- In production, consider using environment variables
- Google Sheets API has rate limits
- Consider implementing user authentication for score updates

## Troubleshooting

### Common Issues

1. **"Setup Required" message**: 
   - You need to configure Google Sheets integration
   - Or click "Load Demo Data" to test the interface

2. **Google Sheets not loading**:
   - Check your API key and sheet ID
   - Ensure Google Sheets API is enabled
   - Verify sheet permissions (must be publicly readable)

3. **Scores not updating**:
   - Check browser console for errors
   - Verify game status is "current"
   - Ensure both scores are entered

### Debug Mode

Open browser console (F12) to see:
- API calls and responses
- Data loading status
- Error messages

## Future Enhancements

- User authentication and permissions
- Real-time updates using WebSockets
- Tournament brackets and progression
- Statistics and leaderboards
- Mobile app version
- Offline support

## Support

This is a simple, self-contained application. For issues:
1. Check the browser console for error messages
2. Verify your Google Sheets setup
3. Ensure all files are in the same directory

## License

This project is open source and available under the MIT License.
