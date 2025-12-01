# Social Orbit 🪐

A **Relativistic Relationship Visualizer** that maps your social circle on a 2D coordinate system with you at the center.

Using AI-powered analysis, it converts natural language descriptions of relationships into precise coordinates:

- **X-Axis (Emotional Bond Strength)**: 0 = Unbreakable Bond → 100 = No Bond
- **Y-Axis (Communication Frequency)**: 0 = Constant Contact → 100 = No Contact

## ✨ Features

### AI-Powered Analysis
- **Two-Step Structured Analysis**: First extracts 12 key relationship facts, then calculates coordinates using a consistent scoring system
- **Context-Aware**: Uses similar past relationships as reference for consistent scoring
- **Bias-Resistant**: Ignores casual language/slang, focuses only on factual relationship data

### Security
- **Encrypted Vault**: All data stored in IndexedDB with AES-256-GCM encryption
- **Passphrase Protection**: Your data is locked behind a PIN/passphrase you create
- **API Key Persistence**: Encrypted storage with automatic 24-hour expiry
- **Zero Server Storage**: Everything stays in your browser

### Visualization
- **Interactive Graph**: Drag-and-drop friend nodes with ethereal gradient backgrounds
- **Custom Icons**: 20+ relationship icons (family, work, romantic, hobby, etc.)
- **Color Coding**: Personalize each friend's node color

### Data Management
- **Single Add**: Add friends one at a time with detailed descriptions
- **Bulk Import**: Add multiple friends in one go
- **Recalculate**: Re-analyze existing friends with updated AI
- **Manual Override**: Drag nodes to adjust positions manually

## 🏗️ Architecture

```
social-orbit/
├── src/
│   ├── App.jsx                 # Main app component
│   ├── components/
│   │   ├── Graph/              # Visualization components
│   │   ├── Panel/              # Control panel components
│   │   ├── Modals/             # All modal dialogs
│   │   └── VaultGate.jsx       # Security unlock screen
│   ├── services/
│   │   ├── llmService.js       # AI analysis logic
│   │   └── relationshipContext.js  # Context/similarity service
│   ├── utils/
│   │   ├── secureStorage.js    # Encrypted IndexedDB
│   │   └── jsonParser.js       # JSON extraction utilities
│   ├── constants/
│   │   ├── prompts.js          # AI system prompts
│   │   └── icons.js            # Icon mappings
│   └── hooks/                  # React hooks
```

## 🤖 AI Analysis System

### Two-Step Process

1. **Extraction Step**: Converts free-form text into 12 structured facts
   - Communication frequency & channels
   - Emotional depth & trust level
   - Relationship origin & duration
   - Current status & barriers

2. **Calculation Step**: Applies consistent scoring rules
   - Base score: 50 for both axes
   - Adjustments based on extracted facts
   - Clamped to [0, 100] range

### Context-Aware Analysis

When adding new friends, the system finds similar existing relationships and uses them as reference:

```javascript
// Finds relationships with matching keywords (family, work, childhood, etc.)
const similar = findSimilarRelationships(newDescription, existingFriends);

// Provides as few-shot examples to LLM for consistency
```

### Axis Definitions

| Score | X-Axis (Emotional Bond) | Y-Axis (Communication) |
|-------|-------------------------|------------------------|
| 0 | Unbreakable (family, soulmate) | Daily contact |
| 25 | Deep connection (close friend) | Multiple times/week |
| 50 | Moderate bond (good friend) | Weekly to monthly |
| 75 | Surface connection (acquaintance) | Few times/year |
| 100 | No bond (stranger) | No contact |

## 🚀 Setup

### Prerequisites
- Node.js v16+
- yarn

### Installation

```bash
cd social-orbit
yarn install
yarn dev
```

### Build for Production

```bash
yarn build
```

### Deploy to GitHub Pages

```bash
# Using deploy script (requires SSH key configured)
./deploy.sh "Your commit message"

# Or manually
yarn build
npx gh-pages -d dist
```

## 🔐 Security Details

### Data Encryption
- **Algorithm**: AES-256-GCM via Web Crypto API
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Storage**: IndexedDB (not localStorage)

### What's Encrypted
- Friends list with all metadata
- User persona configuration
- API key (with 24h auto-expiry)

### What's NOT Encrypted
- Vault existence check (boolean)
- Salt for key derivation (safe to expose)

## 📝 Environment Variables

No environment variables needed. API key is entered at runtime.

## 🔧 API Configuration

Uses [OpenRouter](https://openrouter.ai/) for LLM access. Configure in `src/constants/prompts.js`:

```javascript
export const API_CONFIG = {
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  extractionModel: 'anthropic/claude-3.5-haiku',
  calculationModel: 'anthropic/claude-3.5-haiku',
  bulkModel: 'anthropic/claude-3.5-haiku',
};
```

## 📜 License

MIT
