# 🖥️ LCARS Electron Template

A customizable Electron-based desktop interface inspired by the **LCARS** (Library Computer Access/Retrieval System) from *Star Trek*. This template provides a retro-futuristic UI using modern web technologies and is ideal for kiosks, dashboards, smart home interfaces, or just geeking out.

---

## ✨ Features

✅ **Electron App Shell**  
Runs as a standalone cross-platform desktop application.

✅ **Authentic LCARS UI Design**  
Rounded elements, bold colors, and Eurostile-style fonts emulating the Star Trek LCARS aesthetic.

✅ **Interactive Buttons**  
Clickable LCARS buttons with responsive hover effects and sound feedback.

✅ **Audio Feedback**
Generates a short "beep" using the Web Audio API when buttons are clicked.

✅ **Built-in Star Trek Data**
Includes JSON files with information about the TV series and famous quotes to demonstrate data integration.

✅ **Componentized Structure**
Easy-to-extend with new buttons, pages, animations, or data integrations.

✅ **No Local Assets Required**
Fonts are loaded from Google Fonts and sounds are generated dynamically.

✅ **Fullscreen-Ready**
Can be run in fullscreen or kiosk mode — perfect for touch panels or retro setups.

✅ **Real-Time Clock**
Displays the current system time in the interface.

✅ **Exit Button**
Quickly close the application from the UI.

✅ **Random Quote Generator**
Displays a random Star Trek quote when you press the new button.

✅ **System Info Panel**
Shows basic information about your computer such as platform, CPU cores and memory.

✅ **Clear Button**
Quickly hide the content panel and return to the idle screen.

✅ **Enhanced LCARS Styling**
Rounded panels and colored bars provide a closer LCARS look and feel.

✅ **Randomized Beeps**
Each interaction plays a slightly different tone for more authentic feedback.

✅ **Theme Switcher**
Toggle between predefined color themes at runtime.

✅ **Dynamic Font Loading**
Fonts are loaded programmatically for better control and caching.

✅ **Plugin System**
External JavaScript modules can register new buttons and panels.

✅ **System Status Plugin**
Ships with an example plugin that shows live system information.

✅ **Weather Plugin**
Displays current weather using the Open‑Meteo API.

✅ **Ambient Hum Toggle**
Simulates a bridge background sound that can be enabled or disabled.

✅ **Theme Hotkey**
Press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>T</kbd> to switch themes instantly.

---

## 📁 Project Structure

```
.
├── index.html              # Main HTML structure
├── styles.css              # LCARS UI styling
├── renderer.js             # Frontend interactivity
├── preload.js              # (Optional) preload logic
├── main.js                 # Electron app launcher
├── star_trek_series.json   # Sample data file with series info
├── star_trek_quotes.json   # Famous quotes used by the app
├── package.json            # App metadata and dependencies
└── README.md               # You're here!
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/lcars-electron-template.git
cd lcars-electron-template
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the App

```bash
npm start
```

---

## 🎨 Customization Tips

 - **Fonts**: Update the Google Fonts link in `index.html` to use any LCARS-style font you prefer.
- **Colors**: Modify `styles.css` to change button or panel colors to match different LCARS eras.
 - **Sounds**: Tweak the oscillator settings in `renderer.js` to change the beep tone or duration.
- **Kiosk Mode**: Change `fullscreen: false` to `true` in `main.js` for a full-screen interface.

---

## 🔧 Future Ideas

- Add animated transitions between panels using `GSAP` or `Anime.js`
- Integrate a real-time clock/status panel
- Show weather, media controls, system info, or smart home data
- Add tabbed navigation or swipeable touch zones

---

## 📜 License

MIT License — free to use, modify, and share.

---

## 🧑‍💻 Author

Developed by **George Nicolaou**  
Website: [https://www.georgenicolaou.me](https://www.georgenicolaou.me)
