# Beach Tournament Manager

A web-based tournament management system for beach volleyball tournaments with real-time score tracking and Google Sheets integration.

## Features

- **Live Tournament Updates**: View current, next, and finished games
- **Set-Based Scoring**: Best of 3 sets with proper beach volleyball rules
- **Double Confirmation System**: User submits scores, event manager confirms
- **Google Sheets Integration**: Automatic data synchronization
- **Responsive Design**: Works on desktop and mobile devices
- **Tournament Bracket View**: Visual representation of the tournament structure

## Quick Start

1. **Download the files** to your web server or local development environment
2. **Open `index.html`** in your web browser
3. **Configure Google Sheets** (optional - see setup instructions below)
4. **Start managing your tournament!**

## How It Works

### Game Workflow

1. **Scheduled Games**: Games appear without scores initially
2. **Current Games**: First unconfirmed game becomes "In Progress"
3. **Score Entry**: Users fill in set scores and click "Finish Game"
4. **Pending Confirmation**: Game waits for event manager confirmation
5. **Confirmed**: Event manager confirms, game moves to "Finished"
6. **Next Game**: Next unconfirmed game automatically becomes "In Progress"

### Double Confirmation System

- **User Confirmation**: Tournament staff enters scores and marks game as finished
- **Event Manager Confirmation**: Event manager reviews and confirms the game closure
- **Automatic Progression**: Only after double confirmation does the next game begin

### Set Scoring Rules

- **Sets 1 & 2**: Play to 21 points with 2-point advantage
- **Set 3**: Play to 15 points with 2-point advantage (if match is tied 1-1)
- **Validation**: System prevents invalid scores (e.g., 25-25)

## Google Sheets Setup

### Create Your Tournament Sheet

Your Google Sheet should have the following columns:

| Column | Header | Description |
|--------|--------|-------------|
| A | Match_Number | Sequential match number (1, 2, 3...) |
| B | Tournament | Tournament type (Men/Women) |
| C | Gruppe | Group designation (A/B) |
| D | Court | Court number (Court 1, Court 2, etc.) |
| E | Startzeit | Scheduled start time (9:45, 10:30, etc.) |
| F | Team_1 | First team name |
| G | Team_2 | Second team name |
| H | Resultat | Match result (initially "<->") |
| I | Dauer | Match duration (initially "0:00") |
| J | Set1_ScoreA | Set 1 Team A score |
| K | Set1_ScoreB | Set 1 Team B score |
| L | Set2_ScoreA | Set 2 Team A score |
| M | Set2_ScoreB | Set 2 Team B score |
| N | Set3_ScoreA | Set 3 Team A score (if needed) |
| O | Set3_ScoreB | Set 3 Team B score (if needed) |

### Example Data Structure

```
Match_Number,Tournament,Gruppe,Court,Startzeit,Team_1,Team_2,Resultat,Dauer,Set1_ScoreA,Set1_ScoreB,Set2_ScoreA,Set2_ScoreB,Set3_ScoreA,Set3_ScoreB
1,Men,A,Court 1,9:45,Team 1 Gruppe A,Team 16 Gruppe A,<->,0:00,,,,
2,Men,A,Court 2,9:45,Team 8 Gruppe A,Team 9 Gruppe A,<->,0:00,,,,
3,Men,B,Court 3,9:45,Team 5 Gruppe B,Team 12 Gruppe B,<->,0:00,,,,
4,Women,A,Court 4,9:45,Team 4 Gruppe A,Team 13 Gruppe A,<->,0:00,,,,
```

### Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create credentials (API Key)
5. Update `script.js` with your Sheet ID and API Key

## File Structure

- **`index.html`** - Main tournament manager interface
- **`script.js`** - Core tournament logic and Google Sheets integration
- **`tableau.html`** - Tournament bracket visualization
- **`tournament_template.csv`** - Sample data structure
- **`README.md`** - This documentation

## Customization

### Tournament Schedule

- **6 Courts**: Early games (matches 1-14)
- **4 Courts**: Later games (match 15+)
- **Time Slots**: 45-minute intervals starting at 9:45 AM
- **Simultaneous Play**: Men (Courts 1-3) and Women (Courts 4-6) run simultaneously

### Styling

Modify the CSS in `index.html` to match your tournament's branding and color scheme.

## Troubleshooting

### Common Issues

1. **"No games currently in progress"**
   - Check if games are properly loaded from Google Sheets
   - Verify the data structure matches the expected format

2. **Google Sheets not updating**
   - Verify your API key and Sheet ID are correct
   - Check browser console for error messages
   - Ensure Google Sheets API is enabled

3. **Scores not saving**
   - Check if the game is in "In Progress" status
   - Verify all required set scores are entered
   - Check browser console for validation errors

### Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (responsive design)

## Future Enhancements

- Real-time score updates via WebSocket
- Advanced tournament bracket generation
- Player statistics and rankings
- Match timing and court management
- Export functionality for results

## Support

For issues or questions, check the browser console for error messages and verify your Google Sheets setup matches the expected format.
