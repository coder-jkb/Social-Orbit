# Social Orbit 🪐

Social Orbit is a ***"Relativistic Relationship Visualizer"*** that *gamifies* your social circle. It plots your friends on a 2D coordinate system where you stand at the center (0,0).

Using an LLM (Large Language Model), it analyzes your text descriptions of relationships and calculates two metrics:

Emotional Distance (X-Axis): How close you feel to them.

Interaction Gap (Y-Axis): How often you actually interact.

The result is a beautiful, ethereal gradient map of your social life.

## ✨ Features

**AI-Powered Analysis**: Uses OpenRouter (Google Gemini/Llama) to convert natural language into coordinates.

**Visual Graph**: A 2D quadrant plot with a radial gradient representing intimacy.

**Persona Calibration**: Define your own personality (introvert/extrovert) to help the AI understand your perspective.

**Mock Mode**: Works without an API key for testing and demonstration.

**Local Privacy**: All data (API keys, friends list) is stored in your browser's localStorage.

## 🛠️ Prerequisites

Node.js (v16 or higher)

yarn

## 🚀 Local Setup Guide

This project was built as a single-file React component, but here is how to set it up in a proper local development environment using Vite.

1. Create the Project
Run these commands in your terminal to create a fresh Vite project:

Bash

yarn create vite social-orbit --template react
cd social-orbit
yarn
2. Install App Dependencies
Get the libraries we used for the graph and animations:

Bash

yarn add framer-motion lucide-react
3. Install Tailwind CSS (Standard v3)
We will explicitly install version 3 to avoid the complexity you saw earlier. Run this exact command:

Bash

yarn add -D tailwindcss@3 postcss autoprefixer
Now, initialize it. The -p flag is important—it creates a basic postcss.config.js for you automatically so you don't have to think about it.

Bash

npx tailwindcss init -p
4. Configure Tailwind
Open the tailwind.config.js file that was just created and ensure it matches the Canvas document on the right. It should look like this:

JavaScript

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
5. Add Styles
Open src/index.css and replace everything with these standard Tailwind directives:

CSS

@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #020617; /* slate-950 */
  color: white;
}
6. Copy the App Code
Open src/App.jsx.

Delete everything inside it.

Paste the SocialOrbit.jsx code provided in the earlier messages.

7. Run it
Bash

yarn dev