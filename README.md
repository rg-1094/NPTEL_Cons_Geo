# Conservation Geography - NPTEL Practice Portal

An interactive, responsive practice web application for the NPTEL **Conservation Geography** course.

![Conservation Geography Portal Preview](https://img.shields.io/badge/Course-Conservation%20Geography-10b981?style=for-the-badge)
![Questions Count](https://img.shields.io/badge/Questions-120%20Verified-blue?style=for-the-badge)
![GitHub Pages Ready](https://img.shields.io/badge/Deploy-GitHub%20Pages%20Ready-success?style=for-the-badge)

---

## 🌟 Key Features

- **Full Question Bank**: Contains all 120 verified questions covering the full course curriculum.
- **Pure Focus Interface**: Zero hints, no question numbering ("Question 5 of 120"), no week indicators, and no back button.
- **Double Scrambling**:
  - The sequence of 120 questions is shuffled with the Fisher-Yates algorithm on every practice run.
  - The 4 options for every question are randomly shuffled so the correct answer never stays on the same letter or position.
- **Instant Real-Time Feedback (1-Second Auto Advance)**:
  - **If Correct**: Option highlights in vibrant **green** with a checkmark and auto-advances in **1.0 second**.
  - **If Wrong**: Option highlights in **red** with a cross mark while the correct answer **simultaneously highlights in green**, and auto-advances in **1.0 second**.
- **Live Performance Tracker**: Real-time HUD showing:
  - 📝 **Questions Done** (`X / 120`)
  - 🟢 **Correct Answers** count
  - 🔴 **Incorrect Answers** count
- **Start Over / Reset**: Dedicated refresh button in the header resets progress, reshuffles all questions fresh, and returns to the start screen.
- **Final Analysis Dashboard**:
  - Displayed only after completing all 120 questions.
  - Comprehensive metrics: Score, Accuracy %, Time Spent, and Incorrect Count.
  - Interactive Question Review with filters for *All*, *Incorrect Only*, and *Correct Only*.
- **Mobile & Tablet Optimized**: Designed with touch-first controls, fluid typography, and viewport adaptation for iPhones, iPads, and Android devices.
- **Keyboard Shortcuts**: Use <kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> to select options; <kbd>Enter</kbd> / <kbd>Space</kbd> to start or restart.
- **Synthesized Audio & Dark/Light Themes**: Pure Web Audio API chimes (no audio files needed, works 100% offline).

---

## 🚀 Running Locally

Because the project is completely self-contained with no build steps or external dependencies:

1. **Direct Double-Click**:
   Simply double-click `index.html` in your file explorer. It opens directly in your browser.
2. **Local Server (Optional)**:
   Double-click `start.bat` (or run `python launch_app.py`) to launch at `http://localhost:8080`.

---

## 🌐 Deploying to GitHub Pages (Step-by-Step)

The repository is already configured with `.gitignore` to keep the original `.docx` file safe and private on your local machine.

### Method A: Using Git CLI (Recommended)

1. Open your terminal in this project folder (`e:\My Work\Consgeo`).
2. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Conservation Geography Practice Portal"
   ```
   *(Note: The `.gitignore` automatically prevents `NPTEL ConsGeo Ans.docx` from being staged or committed).*

3. Create a new repository on GitHub (e.g. `conservation-geography-portal`).
4. Link and push to GitHub:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```

5. Turn on **GitHub Pages**:
   - Go to your repository on GitHub.
   - Click on **Settings** (gear icon) -> **Pages** (in the left sidebar).
   - Under **Build and deployment** -> **Source**: Select **Deploy from a branch**.
   - Under **Branch**: Select `main` and `/ (root)`.
   - Click **Save**.
   - In 1–2 minutes, your live web app will be available at:
     ```text
     https://<YOUR_USERNAME>.github.io/<YOUR_REPO_NAME>/
     ```

---

### Method B: Manual File Upload via GitHub Website

If you prefer uploading manually without the command line:

1. Go to [GitHub.com](https://github.com) and click **New Repository**.
2. Name it (e.g., `conservation-geography-portal`), set it to **Public**, and click **Create repository**.
3. On the repository page, click **"uploading an existing file"**.
4. Drag and drop ONLY these files:
   - `index.html`
   - `style.css`
   - `app.js`
   - `questions.js`
   - `questions.json`
   - `README.md`
   - `.gitignore`
   *(⚠️ Do **NOT** upload `NPTEL ConsGeo Ans.docx`)*.
5. Click **Commit changes**.
6. Go to **Settings** -> **Pages** -> choose branch `main` and folder `/ (root)` -> Click **Save**.

---

## 📁 Repository Structure

```text
├── index.html         # Main web application structure
├── style.css          # Responsive design, themes, and animations
├── app.js             # Quiz controller, live stats tracker, audio synthesizer
├── questions.js       # All 120 verified questions with shuffled options
├── questions.json     # JSON formatted question bank
├── launch_app.py      # Lightweight local HTTP server runner
├── start.bat          # 1-click Windows launcher
├── .gitignore         # Ignores .docx and temporary cache files
└── README.md          # Project documentation & GitHub Pages guide
```

