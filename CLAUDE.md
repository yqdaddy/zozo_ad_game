# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev                # Launch HBuilderX dev tools
npm run dev:h5           # Run H5 version (http://localhost:3000)
npm run dev:mp-weixin     # Run WeChat Mini Program

# Production Build
npm run build:h5           # Build for H5 (dist/build/h5)
npm run build:mp-weixin     # Build for WeChat (dist/build/mp-weixin)
```

## Project Architecture

This is a **uni-app** project targeting two platforms:
- **H5** (web browsers)
- **WeChat Mini Program** (MP-WEIXIN)

The codebase uses **Vue 2 Options API** with conditional compilation (`#ifdef`) for platform-specific differences.

### High-Level Structure

```
src/
├── pages/                 # Vue pages (router-based)
│   └── tower-defense/   # Main game page (Game UI + modals)
├── game/                  # Game engine (platform-independent)
│   └── tower-defense/
│       ├── core/         # Game loop, EventBus, Game controller
│       ├── entities/      # Tower, Enemy, Projectile, Particle
│       ├── systems/       # Path, Combo, Difficulty, Achievement, Save, Daily, Challenge
│       ├── config/        # Towers, enemies, levels configuration
│       └── index.js      # Module exports (barrel pattern)
├── utils/                 # Shared utilities
│   ├── canvas-adapter    # H5 vs WeChat Canvas abstraction
│   ├── sound-manager      # Web Audio synthesis (no audio files)
│   ├── storage-manager    # Multi-user local storage with user prefixes
│   └── poster-generator # Canvas poster drawing for sharing
└── main.js               # App entry point
```

### Key Architectural Patterns

1. **Event-Driven Game Loop**: `Game` uses `EventBus` (pub/sub) for all internal communication. UI subscribes to events (`stateChange`, `comboChange`, `gameover`, etc.)

2. **Delta-Time Rendering**: `GameLoop` uses `requestAnimationFrame` with clamped dt (max 100ms) for consistent speed across frame rates.

3. **Multi-User Storage**: `storageManager` prefixes all keys with `user_{userId}_` to support multiple local profiles. Game systems call `storageManager.saveData/loadData` without user knowledge.

4. **Cross-Platform Canvas**: `CanvasAdapter` abstracts H5 (Canvas 2D API) vs WeChat (old canvas API) differences. Use `canvasAdapter.getContext()` and `canvasAdapter.touchToLogic()`.

5. **Conditional Compilation**: Use `#ifdef MP-WEIXIN` / `#ifdef H5` for platform-specific code (WeChat sharing, subscription messages, canvas API differences).

6. **8-Digit Hex Color Workaround**: WeChat doesn't support `#RRGGBBAA` (alpha). Use `#AARRGGBB` format with `#ifdef MP-WEIXIN` blocks.

### Data Flow

- User touches screen → `canvasAdapter.touchToLogic()` → `game.handleTouch()` → triggers events
- Math question needed → `emit('needMathQuestion')` → Vue shows modal → callback with result
- Game ends → `emit('gameover', result)` → Vue shows result modal, saves progress

### Coordinate System

- Logic coordinates: Game world units (path coordinates, entity positions)
- Canvas coordinates: Scaled for screen size
- `canvasAdapter.logicToCanvas()` and `canvasAdapter.touchToLogic()` handle conversion

### State Management

- Game state lives in `Game` class (`lives`, `gold`, `wave`, etc.)
- Vue syncs to game state via event listeners
- UI is reactive (Vue data), game engine is imperative (class-based)

### Key Modules

- **PathSystem**: Generates snake-like paths for enemy movement
- **ComboSystem**: Milestones (3x/5x/8x/12x) with 5s timeout
- **DifficultySystem**: Adaptive difficulty 1.0-3.0, targets 70% accuracy
- **AchievementSystem**: 11 achievements, calculates 1-3 stars based on wave/accuracy/combo
- **SaveSystem**: 4 save slots (0=auto, 1-3=manual)
- **DailySystem**: 7-day sign-in cycle + daily math challenge (seeded random by date)
- **ChallengeSystem**: PK challenge using Base64 encoding in share URL query params

### Adding New Content

- **New Tower**: Add to `towers.js` config, register in `TOWER_CONFIGS`, export in `index.js`
- **New Enemy**: Add to `enemies.js` config, include in wave generation logic
- **New Level**: Add to `levels.js` with unlock conditions

### Math Question System

- 8 question types covering Grade 5 (decimals, equations, areas) + Grade 7 (rational numbers, algebra, linear equations)
- Three difficulty levels (1=EASY, 2=MEDIUM, 3=HARD)
- `generateRandomQuestion(difficulty)` returns `{ type, question, answer }`
- `generateOptions(answer)` creates 4-choice options for multiple choice

### Growth Features (Recent)

- **Sign-in System**: Daily rewards (20-100 gold), 7-day cycle
- **Daily Challenge**: 5 questions per day, same questions for all users (seeded by date)
- **Poster Generator**: 3 templates (game over, daily challenge, achievement), saves to WeChat album
- **PK Challenge**: Share challenge via Base64-encoded URL, opponent receives via query param, VS comparison modal
- **Subscription Messages**: WeChat subscription request after victory (template IDs need platform configuration)

### Audio System

- No audio files; uses **Web Audio API** synthesis (`sound-manager.js`)
- 15 effects (click, correct, wrong, build, upgrade, sell, waveStart, etc.)
- `soundManager.init()` must be called before game starts
