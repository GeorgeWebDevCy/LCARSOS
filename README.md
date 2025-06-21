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
Includes a sample "beep" sound triggered by UI interactions (easily expandable).

✅ **Componentized Structure**  
Easy-to-extend with new buttons, pages, animations, or data integrations.

✅ **Asset Support**  
Modular `assets/` folder for sounds, fonts, and other media files.

✅ **Fullscreen-Ready**  
Can be run in fullscreen or kiosk mode — perfect for touch panels or retro setups.

---

## 📁 Project Structure

```
.
├── assets/
│   ├── fonts/              # Custom LCARS-style fonts (e.g., Eurostile)
│   └── sounds/             # UI sound effects (e.g., beep.mp3)
├── index.html              # Main HTML structure
├── styles.css              # LCARS UI styling
├── renderer.js             # Frontend interactivity
├── preload.js              # (Optional) preload logic
├── main.js                 # Electron app launcher
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

- **Fonts**: Replace `assets/fonts/Eurostile.ttf` with any LCARS-style font you prefer.
- **Colors**: Modify `styles.css` to change button or panel colors to match different LCARS eras.
- **Sounds**: Replace `beep.mp3` or add more sound files and trigger them via JavaScript.
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
