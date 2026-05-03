# 🏠 SmartHome AI

An intelligent home automation system powered by AI, featuring voice control, natural language processing, and a modern teal-themed interface.

![SmartHome AI](https://img.shields.io/badge/Version-1.0-teal)
![Python](https://img.shields.io/badge/Python-3.8+-blue)
![Flask](https://img.shields.io/badge/Flask-3.0+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🌟 Features

### 🎤 Voice Control
- **Natural Language Processing**: Speak naturally to control your devices
- **Voice Recognition**: Browser-based speech recognition (Web Speech API)
- **Smart Commands**: Understands context like "It's too hot" or "I'm feeling sleepy"

### 🎨 Modern UI/UX
- **Teal Color Scheme**: Beautiful gradient design with #1A2E33, #2E5961, #55A9A8, #C4CED0
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Mode**: Toggle between themes
- **Smooth Animations**: Enhanced user experience with transitions and effects

### 🏡 Smart Home Control
- **Device Management**: Control lights, fans, AC, and TV
- **Temperature Control**: Adjust AC temperature with slider or voice
- **Smart Scenes**: Pre-configured modes (Movie, Sleep, Party, Work, Morning)
- **Real-time Updates**: Instant device state synchronization

### 🌤️ Weather Integration
- **Live Weather Data**: Current temperature and conditions
- **Location-based**: Automatic weather updates for your area
- **Visual Display**: Beautiful weather card with icons

### 📊 Insights & History
- **Command History**: Track all your voice and manual commands
- **Usage Analytics**: See which commands you use most
- **Timestamps**: Detailed logs with time tracking

## 🚀 Tech Stack

### Backend
- **Flask 3.0+**: Python web framework
- **Python 3.8+**: Core programming language
- **JSON Storage**: Lightweight data persistence

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS variables and animations
- **JavaScript (ES6+)**: Interactive functionality
- **Lucide Icons**: Beautiful icon library

### APIs
- **OpenWeatherMap API**: Weather data integration
- **Web Speech API**: Browser-based voice recognition

## 📁 Project Structure

```
Smart-Home-AI/
├── app.py                 # Flask backend server
├── wsgi.py               # WSGI configuration
├── requirements.txt      # Python dependencies
├── .env.example         # Environment variables template
├── index.html           # Landing page
├── dashboard.html       # Main dashboard
├── landing.css          # Landing page styles
├── style.css            # Dashboard styles
├── landing.js           # Landing page scripts
├── script.js            # Dashboard scripts
├── devices.json         # Device state storage
├── history.json         # Command history storage
└── README.md           # Project documentation
```

## 🛠️ Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Step 1: Clone the Repository
```bash
git clone https://github.com/koushikreddyreddykankanala/Smart---Home-AI.git
cd Smart---Home-AI
```

### Step 2: Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env  # Windows
   cp .env.example .env    # macOS/Linux
   ```

2. Edit `.env` and add your API keys:
   ```env
   OPENWEATHER_API_KEY=your_api_key_here
   FLASK_SECRET_KEY=your_secret_key_here
   ```

3. Get your OpenWeatherMap API key:
   - Visit: https://openweathermap.org/api
   - Sign up for a free account
   - Generate an API key

### Step 5: Run the Application
```bash
# Development mode
python app.py

# Production mode (using Gunicorn)
gunicorn --bind 0.0.0.0:5000 wsgi:app
```

### Step 6: Access the Application
- Open your browser and navigate to: `http://localhost:5000`
- You'll see the landing page
- Click "Open Dashboard" to access the main interface

## 🎮 Usage

### Voice Commands
Click the microphone button and try these commands:

**Device Control:**
- "Turn on the lights"
- "Switch off the fan"
- "Turn on the AC"
- "Turn off the TV"

**Temperature Control:**
- "Set temperature to 22 degrees"
- "Make it cooler"
- "It's too hot"
- "Increase temperature"

**Smart Scenes:**
- "Movie mode" - Dims lights, turns on TV
- "Sleep mode" - Turns off all devices
- "Party mode" - Turns on lights and TV
- "Work mode" - Optimal lighting and temperature
- "Morning mode" - Gentle wake-up settings

### Manual Control
- Click device cards to toggle on/off
- Use temperature slider or +/- buttons
- Click scene buttons for quick presets

## 🎨 Color Scheme

The project uses a modern teal color palette:

| Color | Hex Code | Usage |
|-------|----------|-------|
| Dark Teal | `#1A2E33` | Primary background, navbar |
| Medium Teal | `#2E5961` | Secondary background, cards |
| Bright Teal | `#55A9A8` | Accent color, buttons, highlights |
| Light Gray | `#C4CED0` | Secondary text, borders |
| White | `#FFFFFF` | Primary text, icons |

## 🔧 Configuration

### Customizing Devices
Edit `devices.json` to add or modify devices:
```json
{
  "light": false,
  "fan": false,
  "ac": false,
  "tv": false,
  "temperature": 24
}
```

### Adding New Scenes
Modify `script.js` to add custom scenes:
```javascript
function activateScene(scene) {
  const scenes = {
    'custom': { light: true, fan: false, ac: true, tv: false, temp: 22 }
  };
  // ... rest of the code
}
```

## 📱 Browser Compatibility

| Browser | Voice Control | UI/UX | Status |
|---------|---------------|-------|--------|
| Chrome | ✅ | ✅ | Fully Supported |
| Edge | ✅ | ✅ | Fully Supported |
| Firefox | ⚠️ | ✅ | Limited Voice Support |
| Safari | ⚠️ | ✅ | Limited Voice Support |

**Note:** Voice recognition works best in Chrome and Edge browsers.

## 🚀 Deployment

### Deploy to Render
1. Create account at https://render.com
2. Connect your GitHub repository
3. Create new Web Service
4. Set environment variables
5. Deploy!

### Deploy to Heroku
```bash
# Install Heroku CLI
heroku login
heroku create smarthome-ai
git push heroku main
heroku config:set OPENWEATHER_API_KEY=your_key
```

### Deploy to PythonAnywhere
1. Upload files to PythonAnywhere
2. Create virtual environment
3. Install dependencies
4. Configure WSGI file
5. Reload web app

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Koushik Reddy Kankanala**
- GitHub: [@koushikreddyreddykankanala](https://github.com/koushikreddyreddykankanala)
- Repository: [Smart---Home-AI](https://github.com/koushikreddyreddykankanala/Smart---Home-AI)

## 🙏 Acknowledgments

- **OpenWeatherMap** for weather API
- **Lucide Icons** for beautiful icons
- **Flask** community for excellent documentation
- **AI Essentials Course** for project inspiration

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/koushikreddyreddykankanala/Smart---Home-AI/issues) page
2. Create a new issue with detailed description
3. Include error messages and screenshots if applicable

## 🔮 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Integration with real IoT devices (ESP32, Arduino)
- [ ] Machine learning for usage patterns
- [ ] Multi-user support with authentication
- [ ] Scheduling and automation rules
- [ ] Energy consumption tracking
- [ ] Integration with Google Home/Alexa
- [ ] Room-based device grouping
- [ ] Custom voice commands training

## 📊 Project Stats

- **Lines of Code**: ~3000+
- **Files**: 13 core files
- **Languages**: Python, JavaScript, HTML, CSS
- **Development Time**: AI Essentials Course Project
- **Version**: 1.0.0

---

⭐ **Star this repository if you find it helpful!**

Made with ❤️ by Koushik Reddy Kankanala
