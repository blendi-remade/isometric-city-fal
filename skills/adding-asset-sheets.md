# Adding New Asset Sheets

This guide explains how to add a new sprite sheet (asset sheet) to the isometric city game, with or without construction variants.

## Overview

Adding a new asset sheet involves these steps:

1. **Prepare the sprite sheet image(s)** - Place PNG files in `/public/assets/`
2. **Define building types** - Add to `src/types/game.ts`
3. **Configure the sprite pack** - Add to `src/lib/renderConfig.ts`
4. **Update rendering logic** - Modify `src/components/Game.tsx`
5. **Add to UI** - Update sidebar in `Game.tsx` and `MobileToolbar.tsx`
6. **Enable placement** - Add to `src/context/GameContext.tsx`
7. **Configure simulation** - Add building sizes to `src/lib/simulation.ts`

---

## Step 1: Prepare the Sprite Sheet

Place your sprite sheet PNG in `/public/assets/`. The sprite sheet should be a grid of sprites.

**Example naming convention:**
- Main sheet: `sprites_red_water_new_parks.png`
- Construction variant: `sprites_red_water_new_parks_construction.png`
- Abandoned variant: `sprites_red_water_new_parks_abandoned.png`

**Important:** All variant sheets (construction, abandoned) must have the **same grid layout** as the main sheet.

---

## Step 2: Define Building Types

In `src/types/game.ts`, add your new building types:

### 2.1 Add to BuildingType union

```typescript
export type BuildingType =
  | 'empty'
  | 'road'
  // ... existing types ...
  // New parks buildings
  | 'basketball_courts'
  | 'playground_small'
  | 'baseball_field_small'
  // ... etc
```

### 2.2 Add to Tool type

```typescript
export type Tool =
  | 'select'
  | 'bulldoze'
  // ... existing tools ...
  // New parks tools
  | 'basketball_courts'
  | 'playground_small'
  | 'baseball_field_small'
  // ... etc
```

### 2.3 Add to TOOL_INFO

Define the tool metadata (name, cost, description, size):

```typescript
export const TOOL_INFO: Record<Tool, ToolInfo> = {
  // ... existing entries ...
  basketball_courts: {
    name: 'Basketball Courts',
    cost: 500,
    description: 'Multi-court basketball facility',
    size: { width: 1, height: 1 }
  },
  baseball_field_small: {
    name: 'Baseball Field',
    cost: 1500,
    description: 'Small baseball diamond',
    size: { width: 2, height: 2 }  // Multi-tile building
  },
  // ... etc
};
```

### 2.4 Add to BUILDING_STATS

Define game statistics for each building:

```typescript
export const BUILDING_STATS: Record<BuildingType, BuildingStats> = {
  // ... existing entries ...
  basketball_courts: { maxPop: 0, maxJobs: 2, pollution: 0, landValue: 10 },
  baseball_field_small: { maxPop: 0, maxJobs: 5, pollution: 0, landValue: 15 },
  // ... etc
};
```

---

## Step 3: Configure the Sprite Pack

In `src/lib/renderConfig.ts`, add your sprite sheet configuration.

### 3.1 SpritePack Interface (for reference)

The `SpritePack` interface includes these relevant properties for a new sheet:

```typescript
interface SpritePack {
  // ... main sprite config ...
  
  // For a separate sprite sheet (like parks):
  parksSrc?: string;                    // Path to the sprite sheet
  parksConstructionSrc?: string;        // Path to construction variant
  parksCols?: number;                   // Number of columns in the grid
  parksRows?: number;                   // Number of rows in the grid
  parksBuildings?: Record<string, { row: number; col: number }>;  // Building positions
  parksVerticalOffsets?: Record<string, number>;    // Y offset adjustments
  parksHorizontalOffsets?: Record<string, number>;  // X offset adjustments
  parksScales?: Record<string, number>;             // Scale adjustments
}
```

### 3.2 Add Configuration to SPRITE_PACK_SPRITES4

```typescript
const SPRITE_PACK_SPRITES4: SpritePack = {
  // ... existing config ...
  
  // Parks sprite sheet configuration
  parksSrc: '/assets/sprites_red_water_new_parks.png',
  parksConstructionSrc: '/assets/sprites_red_water_new_parks_construction.png',  // Optional
  parksCols: 5,   // 5 columns in the sprite sheet
  parksRows: 6,   // 6 rows in the sprite sheet
  
  // Map each building type to its position in the grid (0-indexed)
  parksBuildings: {
    // Row 0
    basketball_courts: { row: 0, col: 1 },
    playground_small: { row: 0, col: 2 },
    playground_large: { row: 0, col: 3 },
    baseball_field_small: { row: 0, col: 4 },
    // Row 1
    soccer_field_small: { row: 1, col: 0 },
    football_field: { row: 1, col: 1 },
    // ... etc
  },
  
  // Fine-tune vertical positioning (positive = down, negative = up)
  parksVerticalOffsets: {
    basketball_courts: -0.15,
    baseball_field_small: -0.85,
    baseball_stadium: -1.5,  // Larger buildings often need more offset
    // ... etc
  },
  
  // Horizontal offsets (usually empty unless needed)
  parksHorizontalOffsets: {},
  
  // Scale adjustments (1.0 = normal, 0.95 = 95% size)
  parksScales: {},
};
```

---

## Step 4: Update Rendering Logic

In `src/components/Game.tsx`, make these changes:

### 4.1 Load the sprite sheet(s)

Find the `useEffect` that loads sprite images and add:

```typescript
// Also load parks sprite sheet if available
if (currentSpritePack.parksSrc) {
  imagesToLoad.push(loadSpriteImage(currentSpritePack.parksSrc, true));
}

// Also load parks construction sprite sheet if available
if (currentSpritePack.parksConstructionSrc) {
  imagesToLoad.push(loadSpriteImage(currentSpritePack.parksConstructionSrc, true));
}
```

### 4.2 Update hasTileSprite check

The rendering code checks if a building should render as a sprite. Update this to include your new sheet:

```typescript
// Check if this building type has a sprite in the tile renderer or parks sheet
const activePack = getActiveSpritePack();
const hasTileSprite = BUILDING_TO_SPRITE[buildingType] || 
  (activePack.parksBuildings && activePack.parksBuildings[buildingType]);
```

### 4.3 Update sprite source selection

Update the priority chain for selecting which sprite sheet to use:

```typescript
// Check if this is a parks building first
const isParksBuilding = activePack.parksBuildings && activePack.parksBuildings[buildingType];

if (isUnderConstruction && isParksBuilding && activePack.parksConstructionSrc) {
  // Parks building under construction - use parks construction sheet
  useParksBuilding = activePack.parksBuildings![buildingType];
  spriteSource = activePack.parksConstructionSrc;
} else if (isUnderConstruction && activePack.constructionSrc) {
  spriteSource = activePack.constructionSrc;
} else if (isAbandoned && activePack.abandonedSrc) {
  spriteSource = activePack.abandonedSrc;
} else if (isParksBuilding && activePack.parksSrc) {
  useParksBuilding = activePack.parksBuildings![buildingType];
  spriteSource = activePack.parksSrc;
} else if (activePack.denseSrc && activePack.denseVariants && activePack.denseVariants[buildingType]) {
  // ... dense variant logic
}
```

### 4.4 Add building sizes

Add multi-tile building sizes to the `BUILDING_SIZES` constant in Game.tsx:

```typescript
const BUILDING_SIZES: Record<string, { width: number; height: number }> = {
  // ... existing sizes ...
  baseball_field_small: { width: 2, height: 2 },
  baseball_stadium: { width: 3, height: 3 },
  football_field: { width: 2, height: 2 },
  // ... etc
};
```

### 4.5 Update minimap colors (optional)

In the minimap rendering section, add colors for your new building types:

```typescript
// Parks buildings - lime green
if (['basketball_courts', 'playground_small', 'baseball_field_small', /* ... */].includes(buildingType)) {
  minimapCtx.fillStyle = '#84cc16';
}
```

### 4.6 Update park-related arrays

If your buildings are parks/recreation, add them to:
- `parkTypes` array (for pedestrian destinations)
- `parkBuildings` array in `isPartOfParkBuilding` (for grass base rendering)

---

## Step 5: Add to UI

### 5.1 Desktop Sidebar (Game.tsx)

Find the `toolCategories` object in the Sidebar component and add your tools:

```typescript
const toolCategories = {
  // ... existing categories ...
  'PARKS': [
    'basketball_courts',
    'playground_small',
    'playground_large',
    // ... etc
  ],
  'SPORTS': [
    'baseball_field_small',
    'soccer_field_small',
    'football_field',
    // ... etc
  ],
};
```

### 5.2 Mobile Toolbar (MobileToolbar.tsx)

Update `toolCategories` in `MobileToolbar.tsx` similarly.

Add category icons to `CategoryIcons`:

```typescript
const CategoryIcons: Record<string, React.ReactNode> = {
  // ... existing icons ...
  'SPORTS': (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      {/* SVG path */}
    </svg>
  ),
};
```

**Note:** `QuickToolIcons` is typed as `Partial<Record<Tool, React.ReactNode>>`, so you don't need to add icons for every new tool.

---

## Step 6: Enable Placement

In `src/context/GameContext.tsx`, add your tools to `toolBuildingMap`:

```typescript
const toolBuildingMap: Partial<Record<Tool, BuildingType>> = {
  // ... existing mappings ...
  basketball_courts: 'basketball_courts',
  playground_small: 'playground_small',
  baseball_field_small: 'baseball_field_small',
  // ... etc
};
```

This maps the selected tool to the building type that gets placed.

---

## Step 7: Configure Simulation

In `src/lib/simulation.ts`, add building sizes:

```typescript
const BUILDING_SIZES: Record<string, { width: number; height: number }> = {
  // ... existing sizes ...
  baseball_field_small: { width: 2, height: 2 },
  baseball_stadium: { width: 3, height: 3 },
  // ... etc
};
```

---

## Quick Checklist

### Without Construction Variant

- [ ] Add sprite sheet PNG to `/public/assets/`
- [ ] Add building types to `BuildingType` union in `game.ts`
- [ ] Add tools to `Tool` type in `game.ts`
- [ ] Add entries to `TOOL_INFO` in `game.ts`
- [ ] Add entries to `BUILDING_STATS` in `game.ts`
- [ ] Add sprite sheet config to `renderConfig.ts` (src, cols, rows, buildings, offsets)
- [ ] Load sprite sheet in `Game.tsx` useEffect
- [ ] Update `hasTileSprite` check in `Game.tsx`
- [ ] Update sprite source selection in `Game.tsx`
- [ ] Add building sizes to `BUILDING_SIZES` in `Game.tsx`
- [ ] Add building sizes to `BUILDING_SIZES` in `simulation.ts`
- [ ] Add to `toolCategories` in `Game.tsx` (desktop sidebar)
- [ ] Add to `toolCategories` in `MobileToolbar.tsx` (mobile)
- [ ] Add to `toolBuildingMap` in `GameContext.tsx`
- [ ] Run `npx tsc --noEmit` to check for TypeScript errors

### With Construction Variant

All of the above, plus:

- [ ] Add construction sprite sheet PNG to `/public/assets/`
- [ ] Add `parksConstructionSrc` (or equivalent) to sprite pack config
- [ ] Load construction sprite sheet in `Game.tsx` useEffect
- [ ] Update sprite source selection to prioritize construction sheet for your building types

---

## File Reference

| File | Purpose |
|------|---------|
| `src/types/game.ts` | BuildingType, Tool, TOOL_INFO, BUILDING_STATS |
| `src/lib/renderConfig.ts` | SpritePack interface, sprite sheet configurations |
| `src/components/Game.tsx` | Image loading, rendering logic, desktop sidebar, minimap |
| `src/components/mobile/MobileToolbar.tsx` | Mobile toolbar categories and icons |
| `src/context/GameContext.tsx` | toolBuildingMap for placing buildings |
| `src/lib/simulation.ts` | BUILDING_SIZES for multi-tile buildings |

---

## Troubleshooting

### Buildings don't appear in sidebar
- Check `toolCategories` in both `Game.tsx` and `MobileToolbar.tsx`

### Can't place buildings
- Check `toolBuildingMap` in `GameContext.tsx`

### Buildings placed but not visible
- Check `hasTileSprite` condition includes your sheet's buildings mapping
- Verify sprite sheet is being loaded (check browser Network tab)
- Check coordinates in `parksBuildings` are correct (0-indexed)

### Construction sprites not showing
- Verify construction sheet has same grid layout as main sheet
- Check the priority order in sprite source selection
- Ensure `parksConstructionSrc` is set and loaded

### TypeScript errors
- Run `npx tsc --noEmit` to see all errors
- `QuickToolIcons` should be `Partial<Record<Tool, React.ReactNode>>`
- All new Tools need entries in `TOOL_INFO`
- All new BuildingTypes need entries in `BUILDING_STATS`
