# 📊 MiniPoller

Fast polling application with global text capture, real-time voting, and chart visualization.

## 🚀 Quick Start (from GitHub)

### Prerequisites
- Windows 10/11
- Node.js 14.0+ ([Download](https://nodejs.org/))

### Method 1: One-Click Installation (Recommended)

```bash
# 1. Clone or download the project
git clone https://github.com/your-username/MiniPoller.git
cd MiniPoller

# 2. Run the one-click installation script
# Windows: Double-click install.bat
# Or in command line:
install.bat
```

### Method 2: Manual Installation

```bash
# 1. Clone the project
git clone https://github.com/your-username/MiniPoller.git
cd MiniPoller

# 2. Navigate to backend directory
cd backend

# 3. Install dependencies
npm install

# 4. Start the application
npm start
```

## 🎯 Features

### 🖱️ Global Text Capture
- **Ctrl+C Capture**: Automatically shows poll creation option when copying text
- **Mouse Drag Selection**: Automatically detects text selection and shows options
- **Smart Positioning**: Popup appears near cursor position

### 📊 Polling Features
- **Quick Poll Creation**: Support for creating polls with multiple options
- **Real-time Results**: Beautiful chart display of voting results
- **One-Click Sharing**: Generate poll links for easy sharing

### 💻 Interface Features
- **Modern UI**: Clean and beautiful user interface
- **Responsive Design**: Adapts to different screen sizes
- **No Menu Bar**: Desktop version with minimalist design
- **Chart Export**: Save poll results as images

## 🔧 Troubleshooting

### Common Issues

**Dependency installation failed?**
```bash
# Clean and reinstall
cd backend
npm run clean
npm install

# Or use Chinese mirror
npm config set registry https://registry.npmmirror.com/
npm install
```

**Cannot start Electron?**
```bash
# Reinstall Electron
npm uninstall electron
npm install electron
```

**Port already in use?**
```bash
# Find the process using the port
netstat -ano | findstr :3000
# Kill the process (replace PID)
taskkill /PID <PID> /F
```

## 📁 Available Scripts

In project root directory:
- `install.bat` - One-click install all dependencies
- `run.bat` - Quick start the application
- `check.bat` - Check environment and dependency status

In backend directory:
- `npm start` - Start the application
- `npm run dev` - Start in development mode
- `npm run clean` - Clean installation files
- `npm run reinstall` - Clean and reinstall

## 📖 Usage Guide

### Creating a Poll
1. Open the application in your web browser at `http://localhost:3000`
2. Fill in the poll question and options
3. Click "Create Poll" to generate a poll link
4. Share the link with participants

### Voting
1. Open the poll link in any web browser
2. Select your preferred option
3. Click "Vote" to submit your choice
4. View real-time results with beautiful charts

### Text Capture (Windows Only)
1. **Start the application**: The text capture feature runs automatically when you start the app
2. **Select text anywhere**: Use mouse drag selection or Ctrl+C to copy text on your screen  
3. **Automatic detection**: A small "Create Poll" overlay appears near your cursor when text is selected
4. **Quick poll creation**: Click the overlay to open the poll creation dialog with pre-filled text

## ⚙️ Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```bash
# Copy the example file
cp backend/.env.example backend/.env
```

Default configuration:
```plaintext
PORT=3000
HOST=0.0.0.0
HTTPS_ENABLED=false
SSL_KEY_PATH=path/to/your/server.key
SSL_CERT_PATH=path/to/your/server.cert
```

### Network Access
To access the app from other devices on your network:
1. Set `HOST=0.0.0.0` in your `.env` file
2. Find your local IP address: `ipconfig` (Windows)
3. Access via `http://YOUR_IP:3000`

### HTTPS Setup (Optional)
For secure connections:
1. Obtain SSL certificates
2. Set `HTTPS_ENABLED=true` in `.env`
3. Specify certificate paths
4. Restart the server

## 🔧 Advanced Usage

### Development Mode
```bash
cd backend
npm run dev
```

### Clean Installation
```bash
cd backend
npm run clean
npm run reinstall
```

### Environment Check
```bash
# Run from project root
check.bat
```

## 🐛 Common Issues

**Application won't start?**
- Check if port 3000 is available
- Verify Node.js version (14.0+)
- Run `check.bat` to diagnose issues

**Dependencies not installing?**
- Clear npm cache: `npm cache clean --force`
- Try different registry: `npm config set registry https://registry.npmjs.org/`
- Run `install.bat` again

**Electron not working?**
- Reinstall: `npm uninstall electron && npm install electron`
- Check Windows compatibility

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Need help?** Check the troubleshooting section or open an issue on GitHub.
