# 🎲 Multiplayer Ludo Game

A real-time multiplayer Ludo game that allows friends to play together online across phone, iPad, and computer. Features live gameplay synchronization, chat, and emoji support.

## ✨ Features

- 🔐 **Google OAuth Authentication**: Secure login with your Google account
- 👤 **User Profiles**: Track your stats and game history
- 🎮 **Real-time Multiplayer**: Play with 2-4 friends simultaneously
- 💬 **Live Chat**: Communicate with other players during the game
- 😊 **Emoji Support**: Express yourself with emojis
- 📱 **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- 🎨 **Modern UI**: Beautiful, vibrant design with smooth animations
- 🔄 **Auto-reconnect**: Handles disconnections gracefully
- 📊 **Game Statistics**: View your wins, games played, and win rate

## 🎯 Game Rules

- Roll a 6 to bring a token out of the starting area
- Move tokens clockwise around the board
- Capture opponent tokens by landing on them (sends them back to start)
- **Get an extra turn when you capture an opponent's token!** 🎯
- **Get an extra turn when you roll a 6!** 🎲
- Safe zones protect tokens from capture
- Multiple tokens can occupy safe zones
- First player to get all 4 tokens home wins!

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd c:\Users\vamsi\repos\ludo
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up Google OAuth 2.0**
   - Follow the detailed guide in [OAUTH_SETUP.md](OAUTH_SETUP.md)
   - Create a `.env` file in the backend directory
   - Add your Google OAuth credentials

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open the game**
   - Open your browser and navigate to `http://localhost:3000`
   - Sign in with your Google account
   - Share the room code with friends to play together!

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web server framework
- **Socket.IO** - Real-time WebSocket communication

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Grid and Flexbox
- **Vanilla JavaScript** - No framework overhead for optimal performance
- **Socket.IO Client** - Real-time updates

## 📁 Project Structure

```
ludo/
├── backend/
│   ├── server.js           # Express & Socket.IO server
│   ├── gameLogic.js        # Ludo game rules and logic
│   ├── gameState.js        # Game state management
│   ├── socketHandlers.js   # WebSocket event handlers
│   └── package.json        # Backend dependencies
├── frontend/
│   ├── index.html          # Main HTML file
│   ├── styles.css          # Styling and animations
│   ├── game.js             # Game board rendering
│   ├── socket-client.js    # WebSocket client
│   └── ui.js               # UI components
└── README.md
```

## 🎮 How to Play

1. **Create or Join a Room**
   - Enter your name
   - Create a new room or join with a room code
   - Share the room code with friends

2. **Wait for Players**
   - Game starts when 2-4 players join
   - Each player gets a color (Red, Blue, Green, Yellow)

3. **Play the Game**
   - Click "Roll Dice" when it's your turn
   - Click on a token to move it
   - Use chat to communicate with other players

## 🔧 Development

### Running in Development Mode

```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Environment Variables

Create a `.env` file in the backend directory (optional):
```
PORT=3000
NODE_ENV=development
```

## 🚢 Deployment

The application can be deployed to:
- **Heroku**
- **Railway**
- **Render**
- **DigitalOcean**
- **AWS/GCP/Azure**

Simply deploy the backend folder and ensure the PORT environment variable is set correctly.

## 🤝 Future Enhancements

- [ ] AI opponent for single-player mode
- [x] User accounts and authentication (Google OAuth implemented!)
- [x] Game history and statistics (Basic stats implemented!)
- [ ] Advanced statistics dashboard
- [ ] Friend system and friend invites
- [ ] Tournaments and leaderboards
- [ ] Custom game rules
- [ ] Voice chat
- [ ] Multiple authentication providers (Facebook, Twitter, etc.)
- [ ] Achievements and badges

## 📄 License

MIT License - Feel free to use this project for learning or personal use!

## 🐛 Issues & Support

If you encounter any issues, please check:
1. Node.js version is v14+
2. All dependencies are installed
3. Port 3000 is not in use
4. Firewall allows WebSocket connections

---

**Enjoy playing Ludo with your friends! 🎉**
