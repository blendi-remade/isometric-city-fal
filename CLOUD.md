# VM Environment Setup - Isometric City

## Overview
This repository contains an isometric city-building game built with Next.js, React 19, TypeScript, and TailwindCSS. The project uses Radix UI components for the interface and includes sprite-based rendering for buildings, vehicles, and other game elements.

## Pre-installed Tools
The VM came with the following tools already installed:
- **Node.js**: v22.21.1
- **npm**: 10.9.4
- **Git**: (repository already cloned)

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

**Result**: Successfully installed 450 packages in 9 seconds, including:
- Next.js 16.0.7 (React framework)
- React 19.2.1 and React DOM 19.2.1
- TypeScript 5.x
- ESLint 9.39.1 with Next.js config
- TailwindCSS 3.4.14 with autoprefixer
- Radix UI components (@radix-ui/react-*)
- Various utility libraries (lucide-react, lz-string, etc.)

### 2. Build Verification
```bash
npm run build
```

**Result**: ✅ Production build completed successfully
- Used Next.js 16.0.7 with Turbopack
- Compiled in 4.3 seconds
- Generated 5 static pages
- All TypeScript checks passed
- Routes generated:
  - `/` (main page)
  - `/_not-found` 
  - `/icon.png`
  - `/opengraph-image`

### 3. Lint Check
```bash
npm run lint
```

**Result**: ⚠️ Linter runs but reports 8 errors and 2 warnings
- Issues are related to React Hooks rules (immutability, exhaustive-deps)
- Existing code issues, not from setup

### 4. Development Server
```bash
npm run dev
```

**Result**: ✅ Dev server starts successfully
- Runs on http://localhost:3000
- Uses Next.js Turbopack for fast compilation
- Ready in ~730ms

## Available Scripts

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint code quality checks
- `npm run crop-screenshots` - Helper script for processing screenshots

## Project Structure

- **Frontend**: Next.js with React 19
- **Styling**: TailwindCSS with custom animations
- **Language**: TypeScript with strict mode enabled
- **Assets**: Game sprites and building images in `/public/assets/`
- **Source**: All application code in `/src/` directory

## Notes

- The project includes telemetry collection by Next.js (can be opted out)
- One high severity npm vulnerability detected (would require `npm audit fix`)
- Linting shows some React Hooks immutability warnings in game systems
- No backend/database setup required - frontend-only application
- Game assets include isometric sprites for water, buildings, vehicles, and effects

## Summary

The VM environment is fully configured and ready to run the isometric city game. All core functionality (build, dev server) works correctly. The project can be developed, built, and deployed without any additional setup.
