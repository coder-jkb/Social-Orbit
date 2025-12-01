# Social Orbit 🪐

Social Orbit is a **"Relativistic Relationship Visualizer"** that gamifies your social circle. It plots your friends on a 2D coordinate system where you stand at the center `(0,0)`.

Using an LLM (Large Language Model), it analyzes your text descriptions of relationships and calculates two metrics:

1. **Emotional Distance (X-Axis)** — How close you feel to them
2. **Interaction Gap (Y-Axis)** — How often you actually interact

The result is a beautiful, ethereal **gradient map of your social life**.

---

## ✨ Features

* **AI-Powered Analysis** – Uses OpenRouter (Google Gemini / Llama) to convert natural language into coordinates
* **Visual Graph** – A 2D quadrant plot with a radial gradient representing intimacy
* **Persona Calibration** – Define your own personality (introvert/extrovert) to help the AI understand your perspective
* **Mock Mode** – Works without an API key for testing and demonstration
* **Local Privacy** – All data (API keys, friends list) is stored in your browser's localStorage

---

## 🛠️ Prerequisites

* Node.js (v16 or higher)
* Yarn (v1 or newer)

---

## 🚀 Local Setup Guide

This project was built as a single-file React component, but here is how to set it up in a proper local development environment using **Vite + Tailwind CSS v4**.

---

### 1. Create a new Vite project

In your terminal:

```cmd
yarn create vite social-orbit --template react
cd social-orbit
```

---

### 2. Install dependencies

Install the required libraries for animations, icons, and logic:

```cmd
yarn add framer-motion lucide-react clsx tailwind-merge
```

---

### 3. Setup Tailwind CSS (v4 ✅)

Install Tailwind and its dependencies:

```cmd
yarn add -D tailwindcss postcss autoprefixer
```

> ⚠️ Tailwind v4 no longer ships the CLI inside the main package, so we must use the new CLI package.

Initialize Tailwind using the new CLI:

```cmd
yarn dlx @tailwindcss/cli init -p
```

If that doesn’t work on your system, use:

```cmd
npx @tailwindcss/cli init -p
```

This will generate:

* `tailwind.config.js`
* `postcss.config.js`

Now update your **tailwind.config.js** to scan your files:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

---

### 4. Add Tailwind to your CSS

In `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #020617; /* slate-950 */
  color: white;
}
```

---

### 5. Add the Application Code

1. Delete the default contents in:

   * `src/App.jsx`
   * `src/App.css`

2. Copy the code from the **SocialOrbit.jsx** file (provided in the previous chat)

3. Paste it into:

```
src/App.jsx
```

---

### 6. Run the Project

```cmd
yarn dev
```

Then open the URL shown in your terminal (usually:
**[http://localhost:5173](http://localhost:5173)**)

---

## 🔑 API Key Setup (Optional)

To use the real AI analysis features, you need an API key from **OpenRouter**.

1. Go to **openrouter.ai**
2. Sign up and create a free API key
3. In the Social Orbit app, click the **Settings (⚙️)** icon
4. Paste your key

**Recommended model:**

```
google/gemini-2.0-flash-exp:free
```

---

## 🧠 System Prompt Logic

The “brain” of the app uses a custom system prompt to instruct the AI.

If you want to tweak the scoring logic, look for this constant in the code:

```js
const SYSTEM_PROMPT = `
You are a Relationship Cartographer...
...
`
```

This is where you can modify:

* Emotional weightings
* Social bias
* Personality influence
* Distance intensity

---

## 📄 License

This project is open source. Modify it. Remix it. Use it to understand your universe of people.

Your orbit is yours 🌌