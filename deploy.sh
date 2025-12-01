#!/bin/bash

# =============================================================================
# SOCIAL ORBIT - GitHub Pages Deploy Script
# =============================================================================
# This script builds and deploys the React app to GitHub Pages
# 
# Usage: ./deploy.sh [commit-message]
# 
# Prerequisites:
#   - Git configured with SSH key (github.com-personal)
#   - Node.js and yarn installed
#   - gh-pages npm package installed in social-orbit
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_ROOT=$(pwd)
APP_DIR="social-orbit"
GIT_REMOTE="git@github.com-personal:coder-jkb/Social-Orbit.git"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Social Orbit - Deploy Script       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if we're in the right directory
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Error: $APP_DIR directory not found!${NC}"
    echo "Please run this script from the repository root."
    exit 1
fi

# Step 1: Commit changes to main (if any)
echo -e "${YELLOW}Step 1: Checking for uncommitted changes...${NC}"

cd "$REPO_ROOT"

if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}Uncommitted changes found. Staging all changes...${NC}"
    git add .
    
    # Get commit message from argument or use default
    COMMIT_MSG="${1:-Auto-deploy: $(date +'%Y-%m-%d %H:%M:%S')}"
    
    echo -e "${YELLOW}Committing with message: ${COMMIT_MSG}${NC}"
    git commit -m "$COMMIT_MSG"
    
    echo -e "${YELLOW}Pushing to main branch...${NC}"
    git push origin main
    
    echo -e "${GREEN}✓ Changes pushed to main${NC}"
else
    echo -e "${GREEN}✓ No uncommitted changes${NC}"
fi

# Step 2: Build the React app
echo ""
echo -e "${YELLOW}Step 2: Building production bundle...${NC}"

cd "$REPO_ROOT/$APP_DIR"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    yarn install
fi

# Build
yarn build

echo -e "${GREEN}✓ Build complete${NC}"

# Step 3: Deploy to GitHub Pages
echo ""
echo -e "${YELLOW}Step 3: Deploying to GitHub Pages...${NC}"

# Use gh-pages to deploy
npx gh-pages -d dist -r "$GIT_REMOTE" -m "Deploy: $(date +'%Y-%m-%d %H:%M:%S')"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✓ Deployment Complete!             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "🌐 Your app is live at:"
echo -e "${BLUE}   https://coder-jkb.github.io/Social-Orbit/${NC}"
echo ""

