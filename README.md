# 🏆 The Money Olympics

> A gamified financial literacy app for Gen-Z — learn, battle, and level up your money skills.

**The Money Olympics** is a mobile-first web app that turns personal finance education into a competitive, arcade-style experience. Players learn through structured lessons, swipe-based financial scenarios, and real-time PvP battles — all backed by Firebase and powered by a Gemini AI integration.

---

## ✨ Features

### 🎓 Academy Mode
A structured, Duolingo-style learning path with 50+ lessons across multiple units. Progress is tracked per-user in Firestore. Lessons lock behind exams, and streak mechanics encourage daily engagement.

### ⚡ Speed Round
A rapid-fire swipe card game where players make real-world financial decisions (invest, spend, save) under time pressure. Cards are powered by a hybrid AI + hardcoded fallback system for resilience.

### ⚔️ Fight Mode (PvP)
Real-time asymmetric battles: one player acts as the **Saboteur** (launching financial attacks) and the other as the **Fixer** (defending their wealth and reputation). Matchmaking is handled live via Firestore transactions, with a clock-based "Blitz Chess" format.

### 🔥 Gamification System
- XP tracking and leaderboards
- Daily login bonuses (+50 XP)
- Daily streak enforcement with streak-break warnings
- Achievement badges (First Lesson, Streak Master, Wealth Builder, etc.)

### 🤖 AI-Powered Content
Integrates with the **Google Gemini API** to generate dynamic financial scenarios for Speed Round. Falls back gracefully to a large hardcoded dataset when the AI is unavailable.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 6 |
| Routing | React Router DOM v7 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Database & Auth | Firebase (Firestore + Firebase Auth) |
| AI | Google Gemini API (`@google/genai`) |
| Hosting | Vercel |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- A Firebase project with **Firestore** and **Email/Password Authentication** enabled
- A Google Gemini API key

### 1. Clone & Install

```bash
git clone https://github.com/your-username/the-money-olympics.git
cd the-money-olympics
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note:** Firebase config is currently hardcoded in `src/services/firebase.ts`. If you fork this project, replace the values there with your own Firebase project credentials.

### 3. Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🌐 Deploying to Vercel

### Option A — Vercel CLI (Recommended)

```bash
npm i -g vercel
vercel
```

Follow the prompts. Vercel will auto-detect the Vite framework.

### Option B — GitHub Integration

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo.
3. Vercel auto-detects Vite. No build config changes needed.
4. Add your environment variable in **Project Settings → Environment Variables**:
   - `VITE_GEMINI_API_KEY` → your Gemini API key

### Build Settings (auto-detected, but for reference)

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

> ⚠️ **Important:** Vercel does **not** automatically expose `.env` files. You **must** add `VITE_GEMINI_API_KEY` in the Vercel dashboard under **Environment Variables**, otherwise the AI tip feature will silently use the fallback message.

---

## 🔥 Firebase Setup

### Firestore Collections

The app uses two top-level Firestore collections:

#### `users/{uid}`
Created on registration. Contains:
```json
{
  "uid": "string",
  "email": "string",
  "username": "string",
  "xp": 0,
  "currentStreak": 0,
  "lastLessonDate": "string | null",
  "completedLessons": [],
  "examFailureCount": 0,
  "examUnlockTime": 0,
  "badges": [],
  "lastLoginBonus": 0
}
```

#### `matches/{matchId}`
Created dynamically during PvP matchmaking. Contains match state, player roles, turn phase, clocks, and scenario data for the active battle.

### Firestore Security Rules (Recommended)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /matches/{matchId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Firebase Auth
Enable **Email/Password** sign-in in Firebase Console → Authentication → Sign-in method.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── AuthScreen.tsx          # Login / Sign-up screen
│   ├── AcademyLobby.tsx        # Academy mode entry + streak tracking
│   ├── AcademyMap.tsx          # Lesson map with unit/level nodes
│   ├── LessonScreen.tsx        # Active lesson & quiz UI
│   ├── SpeedLobby.tsx          # Speed Round entry
│   ├── SpeedRound.tsx          # Swipe card game engine
│   ├── FightLobby.tsx          # Fight mode entry
│   ├── FightMatchmaker.tsx     # Real-time PvP matchmaking
│   ├── BattleInterface.tsx     # Active PvP battle UI
│   ├── ProfileEditor.tsx       # User profile management
│   ├── SplashScreen.tsx        # Animated app intro
│   └── ...
├── contexts/
│   ├── AuthContext.tsx          # Firebase Auth + Firestore user state
│   ├── GameContext.tsx          # Speed Round scenario preloading
│   └── ThemeContext.tsx         # App-wide theme provider
├── services/
│   ├── firebase.ts              # Firebase app init (singleton)
│   ├── geminiService.ts         # Gemini AI daily tip integration
│   ├── gamificationService.ts   # Leaderboard + badge logic
│   └── scenarioManager.ts       # AI scenario fetch + fallback logic
├── data/
│   ├── AcademyData.ts           # Hardcoded lesson/quiz content
│   └── SpeedRoundData.ts        # Hardcoded swipe card scenarios
├── utils/                       # Streak utilities, helpers
├── types.ts                     # Shared TypeScript interfaces
└── App.tsx                      # Root component + routing
```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server with HMR |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | TypeScript type-check (`tsc --noEmit`) |

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## 📄 License

Private project. All rights reserved.
