# Social Orbit 🪐

<p align="center">
  <img src="social-orbit/public/social-orbit-logo.png" alt="Social Orbit Logo" width="120" />
</p>

<p align="center">
  <strong>A Relativistic Relationship Visualizer</strong><br/>
  Map your social universe with AI-powered analysis
</p>

<p align="center">
  <a href="https://coder-jkb.github.io/Social-Orbit/">🌐 Live Demo</a> •
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-security">Security</a>
</p>

---

## 🎯 What is Social Orbit?

Social Orbit plots your friends on a 2D coordinate system where **you stand at the center (0,0)**. Using AI (LLM), it analyzes your text descriptions of relationships and calculates:

| Axis | Metric | Scale |
|------|--------|-------|
| **X-Axis** | Emotional Distance | 0 (Soulmate) → 100 (Stranger) |
| **Y-Axis** | Interaction Gap | 0 (Daily) → 100 (No Contact) |

The result is a beautiful, ethereal **gradient map of your social life**.

---

## ✨ Features

### Core Features
- 🤖 **AI-Powered Analysis** – Uses OpenRouter (Claude/Gemini) to convert natural descriptions into coordinates
- 📊 **Interactive Graph** – Pan, zoom, and drag friends on a 2D coordinate plane
- 👤 **Persona Calibration** – Define your personality to help the AI understand your perspective
- 🎨 **Customizable** – Change icons and colors for each friend
- 📦 **Bulk Import** – Add multiple friends at once

### Security Features
- 🔐 **Encrypted Vault** – All data encrypted with AES-256-GCM using your passphrase
- 🔑 **Secure API Key Storage** – API key encrypted with 24-hour auto-expiry
- 🚫 **No Backend Required** – Everything runs locally in your browser
- 🔒 **No Account Needed** – Your data never leaves your device

### New Features
- ♻️ **Recalculate Positions** – Re-analyze selected friends with improved AI
- 🎯 **Bias-Reduced Prompts** – Gender-neutral, objective scoring criteria
- 🧪 **Mock Mode** – Test without an API key

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Yarn (v1.22+)

### Installation

```bash
# Clone the repository
git clone https://github.com/coder-jkb/Social-Orbit.git
cd Social-Orbit

# Install dependencies
cd social-orbit
yarn install

# Start development server
yarn dev
```

Open **http://localhost:5173** in your browser.

### First Time Setup

1. **Create a Passphrase** – This encrypts all your data locally
2. **Define Your Persona** – Help the AI understand your perspective
3. **Add API Key** (optional) – Get one from [openrouter.ai](https://openrouter.ai)
4. **Start Adding Friends!**

---

## 🔐 Security

### How Your Data is Protected

| Data | Storage | Encryption | Expiry |
|------|---------|------------|--------|
| Friends & Profile | IndexedDB | AES-256-GCM | Never (until you delete) |
| API Key | IndexedDB | AES-256-GCM | 24 hours |
| Passphrase | Never stored | N/A | N/A |

### Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your Browser                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────────────────────────┐ │
│  │ Passphrase  │───▶│  PBKDF2 Key Derivation          │ │
│  │ (you enter) │    │  (100,000 iterations + salt)    │ │
│  └─────────────┘    └───────────────┬─────────────────┘ │
│                                     │                    │
│                                     ▼                    │
│                     ┌───────────────────────────────┐   │
│                     │     AES-256-GCM Encryption    │   │
│                     └───────────────┬───────────────┘   │
│                                     │                    │
│                                     ▼                    │
│  ┌─────────────────────────────────────────────────────┐│
│  │              IndexedDB (Encrypted Blobs)            ││
│  │  • Friends data    • Persona    • API Key (24h)     ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### What if I forget my passphrase?

⚠️ **No recovery is possible** – your data is truly encrypted. You can reset and start fresh via "Advanced Options" → "Reset & Create New Vault".

---

## 🔑 API Key Setup

1. Go to **[openrouter.ai](https://openrouter.ai)**
2. Sign up and create a free API key
3. In Social Orbit, click **Settings (⚙️)**
4. Paste your key and click Save

**Models Used:**
- Single analysis: `anthropic/claude-3.5-haiku`
- Bulk analysis: `google/gemini-2.0-flash-exp:free`

Your API key is:
- ✅ Encrypted with your passphrase
- ✅ Auto-expires after 24 hours
- ✅ Can be cleared anytime in Settings

---

## 📁 Project Structure

```
social-orbit/
├── src/
│   ├── components/
│   │   ├── Graph/           # Graph viewport components
│   │   │   ├── GraphCanvas.jsx
│   │   │   ├── FriendNode.jsx
│   │   │   ├── ClusterMenu.jsx
│   │   │   ├── GraphControls.jsx
│   │   │   └── GraphBackground.jsx
│   │   ├── Panel/           # Control panel components
│   │   │   ├── PanelHeader.jsx
│   │   │   ├── FriendDetail.jsx
│   │   │   ├── AddFriendForm.jsx
│   │   │   └── BulkImportForm.jsx
│   │   ├── Modals/          # Modal dialogs
│   │   │   ├── SettingsModal.jsx
│   │   │   ├── OnboardingModal.jsx
│   │   │   └── RecalculateModal.jsx
│   │   └── VaultGate.jsx    # Secure unlock screen
│   ├── services/
│   │   └── llmService.js    # AI/LLM integration
│   ├── hooks/
│   │   └── useGraphInteraction.js
│   ├── utils/
│   │   ├── secureStorage.js # Encrypted storage
│   │   └── jsonParser.js    # Robust JSON extraction
│   ├── constants/
│   │   ├── icons.js
│   │   ├── colors.js
│   │   └── prompts.js       # AI system prompts
│   └── App.jsx              # Main application
└── public/
    ├── social-orbit-logo.png
    └── social-orbit-logo-with-text.png
```

---

## 🧠 AI Prompt Engineering

The AI uses carefully crafted prompts to minimize bias:

### Anti-Bias Rules
- ✅ **Gender-neutral scoring** – Same description = same scores regardless of gender
- ✅ **Ignore writing style** – Slang, emojis, casual language don't affect scores
- ✅ **Objective criteria** – Scoring based on concrete factors only:
  - Communication frequency
  - Trust level
  - Emotional depth
  - Practical support

### Scoring Criteria

**Emotional Distance (X-Axis):**
| Score | Meaning |
|-------|---------|
| 0-15 | Share deepest secrets, complete trust, like family |
| 16-30 | High trust, emotional support, discuss personal issues |
| 31-50 | Good friends, some personal sharing |
| 51-70 | Casual/situational friends (work, school) |
| 71-85 | Acquaintances |
| 86-100 | Barely know each other |

**Interaction Gap (Y-Axis):**
| Score | Meaning |
|-------|---------|
| 0-10 | Daily contact |
| 11-25 | Multiple times per week |
| 26-40 | Weekly |
| 41-55 | Few times per month |
| 56-70 | Monthly or less |
| 71-85 | Few times per year |
| 86-100 | Rarely/lost contact |

---

## 🚢 Deployment

### Deploy to GitHub Pages

**Windows:**
```batch
deploy.bat "Your commit message"
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh "Your commit message"
```

**Manual deployment:**
```bash
cd social-orbit
yarn build
npx gh-pages -d dist -r git@github.com:YOUR_USERNAME/Social-Orbit.git
```

---

## 🛠️ Development

### Available Scripts

```bash
yarn dev      # Start development server
yarn build    # Build for production
yarn preview  # Preview production build
yarn lint     # Run ESLint
```

### Tech Stack

- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Storage:** IndexedDB + Web Crypto API
- **AI:** OpenRouter API

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open source. Modify it. Remix it. Use it to understand your universe of people.

**Your orbit is yours** 🌌

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/coder-jkb">coder-jkb</a>
</p>
