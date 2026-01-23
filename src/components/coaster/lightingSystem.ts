/**
 * IsoCoaster Lighting System
 * Provides day/night cycle lighting effects similar to IsoCity
 */

import { useEffect } from 'react';
import { Tile } from '@/games/coaster/types';

// =============================================================================
// CONSTANTS
// =============================================================================

const TILE_WIDTH = 64;
const HEIGHT_RATIO = 0.60;
const TILE_HEIGHT = TILE_WIDTH * HEIGHT_RATIO;

// =============================================================================
// LIGHTING UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate darkness level based on hour of day (0-23)
 * Dawn: 5-7, Day: 7-18, Dusk: 18-20, Night: 20-5
 * @returns Value from 0 (full daylight) to 1 (full night)
 */
export function getDarkness(hour: number): number {
  if (hour >= 7 && hour < 18) return 0; // Full daylight
  if (hour >= 5 && hour < 7) return 1 - (hour - 5) / 2; // Dawn transition
  if (hour >= 18 && hour < 20) return (hour - 18) / 2; // Dusk transition
  return 1; // Night
}

/**
 * Get ambient color based on time of day
 * Returns RGB values for the ambient lighting overlay
 * Using darker, more saturated colors to avoid the "hazy" look
 */
export function getAmbientColor(hour: number): { r: number; g: number; b: number } {
  if (hour >= 7 && hour < 18) return { r: 255, g: 255, b: 255 };
  if (hour >= 5 && hour < 7) {
    // Dawn - warm orange/pink
    const t = (hour - 5) / 2;
    return { 
      r: Math.round(40 + 30 * t), 
      g: Math.round(25 + 20 * t), 
      b: Math.round(50 + 15 * t) 
    };
  }
  if (hour >= 18 && hour < 20) {
    // Dusk - purple/orange sunset
    const t = (hour - 18) / 2;
    return { 
      r: Math.round(60 - 45 * t), 
      g: Math.round(40 - 30 * t), 
      b: Math.round(70 - 30 * t) 
    };
  }
  // Night - deep blue, not gray
  return { r: 10, g: 15, b: 40 };
}

/**
 * Deterministic pseudo-random function for consistent lighting patterns
 */
function pseudoRandom(seed: number, n: number): number {
  const s = Math.sin(seed + n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Convert grid coordinates to screen position
 */
function gridToScreen(gridX: number, gridY: number): { screenX: number; screenY: number } {
  const screenX = (gridX - gridY) * (TILE_WIDTH / 2);
  const screenY = (gridX + gridY) * (TILE_HEIGHT / 2);
  return { screenX, screenY };
}

// =============================================================================
// TYPES
// =============================================================================

interface LightSource {
  x: number;
  y: number;
  type: 'path' | 'building' | 'ride' | 'track' | 'lamp' | 'shop';
  buildingType?: string;
  seed?: number;
  trackHeight?: number;
}

export interface CoasterLightingConfig {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  grid: Tile[][];
  gridSize: number;
  hour: number;
  offset: { x: number; y: number };
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
}

// =============================================================================
// LIGHT COLLECTION
// =============================================================================

/**
 * Building types that emit light at night
 */
const LIT_BUILDING_TYPES = new Set([
  // Stations
  'station_wooden_1', 'station_wooden_2', 'station_wooden_3', 'station_wooden_4', 'station_wooden_5',
  'station_steel_1', 'station_steel_2', 'station_steel_3', 'station_steel_4', 'station_steel_5',
  'station_inverted_1', 'station_inverted_2', 'station_inverted_3', 'station_inverted_4', 'station_inverted_5',
  'station_water_1', 'station_water_2', 'station_water_3', 'station_water_4', 'station_water_5',
  'station_mine_1', 'station_mine_2', 'station_mine_3', 'station_mine_4', 'station_mine_5',
  'station_futuristic_1', 'station_futuristic_2', 'station_futuristic_3', 'station_futuristic_4', 'station_futuristic_5',
  // Lamps - emit bright light at night
  'lamp_victorian', 'lamp_modern', 'lamp_themed', 'lamp_double', 'lamp_pathway',
  // Food & shops - illuminate brightly at night
  'food_hotdog', 'food_burger', 'food_icecream', 'food_cotton_candy', 'snack_popcorn',
  'shop_souvenir_1', 'shop_souvenir_2', 'shop_toys', 'shop_photo', 'restroom', 'first_aid',
  // Rides
  'ride_carousel', 'ride_teacups', 'ride_ferris_classic', 'ride_ferris_modern', 'ride_ferris_led',
  'ride_drop_tower', 'ride_swing_ride', 'ride_bumper_cars', 'ride_go_karts', 'ride_haunted_house', 'ride_log_flume',
  // Fountains
  'fountain_classic', 'fountain_modern', 'fountain_tiered', 'dancing_fountain',
  // Infrastructure
  'infra_main_entrance', 'infra_office',
]);

/**
 * Collect light sources from visible tiles
 */
function collectLightSources(
  grid: Tile[][],
  gridSize: number,
  visibleMinSum: number,
  visibleMaxSum: number,
  viewLeft: number,
  viewRight: number,
  viewTop: number,
  viewBottom: number
): LightSource[] {
  const lights: LightSource[] = [];
  
  for (let sum = visibleMinSum; sum <= visibleMaxSum; sum++) {
    for (let x = Math.max(0, sum - gridSize + 1); x <= Math.min(sum, gridSize - 1); x++) {
      const y = sum - x;
      if (y < 0 || y >= gridSize) continue;
      
      const { screenX, screenY } = gridToScreen(x, y);
      
      // Viewport culling
      if (screenX + TILE_WIDTH < viewLeft || screenX > viewRight ||
          screenY + TILE_HEIGHT * 3 < viewTop || screenY > viewBottom) {
        continue;
      }
      
      const tile = grid[y][x];
      const buildingType = tile.building?.type;
      
      // Paths emit light
      if (tile.path) {
        lights.push({ x, y, type: 'path' });
      }
      
      // Track tiles ALL emit light along the rails
      if (tile.hasCoasterTrack && tile.trackPiece) {
        lights.push({ 
          x, y, 
          type: 'track', 
          seed: x * 1000 + y,
          trackHeight: tile.trackPiece.startHeight || 0
        });
      }
      
      // Lamps emit bright focused light
      if (buildingType?.startsWith('lamp_')) {
        lights.push({ x, y, type: 'lamp', buildingType, seed: x * 1000 + y });
      }
      // Shops emit bright warm light
      else if (buildingType?.startsWith('shop_') || buildingType?.startsWith('food_') || buildingType?.startsWith('snack_')) {
        lights.push({ x, y, type: 'shop', buildingType, seed: x * 1000 + y });
      }
      // Other buildings emit light
      else if (buildingType && LIT_BUILDING_TYPES.has(buildingType)) {
        lights.push({ x, y, type: 'building', buildingType, seed: x * 1000 + y });
      }
      
      // Rides emit colored lights
      if (buildingType?.startsWith('ride_')) {
        lights.push({ x, y, type: 'ride', buildingType, seed: x * 1000 + y });
      }
    }
  }
  
  return lights;
}

// =============================================================================
// RENDERING FUNCTIONS
// =============================================================================

const HEIGHT_UNIT = 20;

/**
 * Draw light cutouts to remove darkness around light sources
 */
function drawLightCutouts(
  ctx: CanvasRenderingContext2D,
  lights: LightSource[],
  lightIntensity: number
): void {
  for (const light of lights) {
    const { screenX, screenY } = gridToScreen(light.x, light.y);
    const tileCenterX = screenX + TILE_WIDTH / 2;
    const tileCenterY = screenY + TILE_HEIGHT / 2;
    
    if (light.type === 'path') {
      // Path lights - warm street lamps - strong cutout
      const lightRadius = 32;
      const gradient = ctx.createRadialGradient(tileCenterX, tileCenterY - 5, 0, tileCenterX, tileCenterY - 5, lightRadius);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${1.0 * lightIntensity})`);
      gradient.addColorStop(0.4, `rgba(255, 255, 255, ${0.7 * lightIntensity})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(tileCenterX, tileCenterY - 5, lightRadius, 0, Math.PI * 2);
      ctx.fill();
    } else if (light.type === 'track') {
      // Track lights - lights along the top of EVERY track piece - strong cutout
      const trackHeight = light.trackHeight || 0;
      const elevationOffset = trackHeight * HEIGHT_UNIT;
      const lightY = tileCenterY - elevationOffset - 10;
      
      // Main track light - bright
      const lightRadius = 30;
      const gradient = ctx.createRadialGradient(tileCenterX, lightY, 0, tileCenterX, lightY, lightRadius);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${1.0 * lightIntensity})`);
      gradient.addColorStop(0.35, `rgba(255, 255, 255, ${0.6 * lightIntensity})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(tileCenterX, lightY, lightRadius, 0, Math.PI * 2);
      ctx.fill();
    } else if (light.type === 'lamp') {
      // Lamp lights - bright focused light from street lamps - very strong cutout
      const lightRadius = 55;
      const gradient = ctx.createRadialGradient(tileCenterX, tileCenterY - 20, 0, tileCenterX, tileCenterY - 20, lightRadius);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${1.0 * lightIntensity})`);
      gradient.addColorStop(0.3, `rgba(255, 255, 255, ${0.85 * lightIntensity})`);
      gradient.addColorStop(0.6, `rgba(255, 255, 255, ${0.5 * lightIntensity})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(tileCenterX, tileCenterY - 20, lightRadius, 0, Math.PI * 2);
      ctx.fill();
    } else if (light.type === 'shop') {
      // Shop lights - bright warm storefront lighting - strong cutout
      const lightRadius = 60;
      const gradient = ctx.createRadialGradient(tileCenterX, tileCenterY - 18, 0, tileCenterX, tileCenterY - 18, lightRadius);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${1.0 * lightIntensity})`);
      gradient.addColorStop(0.35, `rgba(255, 255, 255, ${0.8 * lightIntensity})`);
      gradient.addColorStop(0.65, `rgba(255, 255, 255, ${0.45 * lightIntensity})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(tileCenterX, tileCenterY - 18, lightRadius, 0, Math.PI * 2);
      ctx.fill();
    } else if (light.type === 'building') {
      // Building lights - windows and ambient glow - strong cutout
      const lightRadius = 48;
      const gradient = ctx.createRadialGradient(tileCenterX, tileCenterY - 15, 0, tileCenterX, tileCenterY - 15, lightRadius);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${1.0 * lightIntensity})`);
      gradient.addColorStop(0.4, `rgba(255, 255, 255, ${0.6 * lightIntensity})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(tileCenterX, tileCenterY - 15, lightRadius, 0, Math.PI * 2);
      ctx.fill();
    } else if (light.type === 'ride') {
      // Ride lights - bright and colorful - strong cutout
      const lightRadius = 55;
      const gradient = ctx.createRadialGradient(tileCenterX, tileCenterY - 20, 0, tileCenterX, tileCenterY - 20, lightRadius);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${1.0 * lightIntensity})`);
      gradient.addColorStop(0.35, `rgba(255, 255, 255, ${0.65 * lightIntensity})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(tileCenterX, tileCenterY - 20, lightRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Draw colored glows for atmosphere (after cutouts)
 * Keep these subtle to avoid washed out look
 */
function drawColoredGlows(
  ctx: CanvasRenderingContext2D,
  lights: LightSource[],
  lightIntensity: number
): void {
  for (const light of lights) {
    const { screenX, screenY } = gridToScreen(light.x, light.y);
    const tileCenterX = screenX + TILE_WIDTH / 2;
    const tileCenterY = screenY + TILE_HEIGHT / 2;
    
    if (light.type === 'path') {
      // Subtle warm glow - very low opacity
      const gradient = ctx.createRadialGradient(tileCenterX, tileCenterY - 5, 0, tileCenterX, tileCenterY - 5, 16);
      gradient.addColorStop(0, `rgba(255, 220, 150, ${0.15 * lightIntensity})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(tileCenterX, tileCenterY - 5, 16, 0, Math.PI * 2);
      ctx.fill();
    } else if (light.type === 'track' && light.seed !== undefined) {
      // Subtle red safety lights
      const trackHeight = light.trackHeight || 0;
      const elevationOffset = trackHeight * HEIGHT_UNIT;
      const lightY = tileCenterY - elevationOffset - 10;
      
      const gradient = ctx.createRadialGradient(tileCenterX, lightY, 0, tileCenterX, lightY, 12);
      gradient.addColorStop(0, `rgba(255, 100, 100, ${0.2 * lightIntensity})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(tileCenterX, lightY, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (light.type === 'lamp') {
      // Warm golden glow from street lamps - bright and inviting
      const gradient = ctx.createRadialGradient(tileCenterX, tileCenterY - 20, 0, tileCenterX, tileCenterY - 20, 30);
      gradient.addColorStop(0, `rgba(255, 230, 150, ${0.35 * lightIntensity})`);
      gradient.addColorStop(0.5, `rgba(255, 210, 120, ${0.2 * lightIntensity})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(tileCenterX, tileCenterY - 20, 30, 0, Math.PI * 2);
      ctx.fill();
    } else if (light.type === 'shop') {
      // Warm inviting storefront glow - bright and welcoming
      const gradient = ctx.createRadialGradient(tileCenterX, tileCenterY - 18, 0, tileCenterX, tileCenterY - 18, 35);
      gradient.addColorStop(0, `rgba(255, 240, 180, ${0.35 * lightIntensity})`);
      gradient.addColorStop(0.5, `rgba(255, 220, 140, ${0.2 * lightIntensity})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(tileCenterX, tileCenterY - 18, 35, 0, Math.PI * 2);
      ctx.fill();
    } else if (light.type === 'ride' && light.seed !== undefined) {
      // Subtle colorful ride lights
      const colors = [
        { r: 255, g: 100, b: 150 }, // Pink
        { r: 100, g: 200, b: 255 }, // Cyan
        { r: 255, g: 200, b: 100 }, // Gold
        { r: 150, g: 255, b: 150 }, // Green
      ];
      const colorIdx = Math.floor(pseudoRandom(light.seed, 5) * colors.length);
      const color = colors[colorIdx];
      
      const gradient = ctx.createRadialGradient(tileCenterX, tileCenterY - 20, 0, tileCenterX, tileCenterY - 20, 25);
      gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.2 * lightIntensity})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(tileCenterX, tileCenterY - 20, 25, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * Hook for rendering day/night lighting effects in IsoCoaster
 */
export function useCoasterLightingSystem(config: CoasterLightingConfig): void {
  const {
    canvasRef,
    grid,
    gridSize,
    hour,
    offset,
    zoom,
    canvasWidth,
    canvasHeight,
  } = config;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const darkness = getDarkness(hour);
    
    // Clear canvas first
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // If it's full daylight, just clear and return
    if (darkness <= 0.01) return;
    
    const ambient = getAmbientColor(hour);
    
    // Apply darkness overlay - use very low alpha to avoid washed out look
    // Use pure dark blue with minimal opacity
    const alpha = darkness * 0.25;
    ctx.fillStyle = `rgba(0, 5, 20, ${alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate viewport bounds
    const viewWidth = canvas.width / (dpr * zoom);
    const viewHeight = canvas.height / (dpr * zoom);
    const viewLeft = -offset.x / zoom - TILE_WIDTH * 2;
    const viewTop = -offset.y / zoom - TILE_HEIGHT * 4;
    const viewRight = viewWidth - offset.x / zoom + TILE_WIDTH * 2;
    const viewBottom = viewHeight - offset.y / zoom + TILE_HEIGHT * 4;
    
    // Calculate visible diagonal range
    const visibleMinSum = Math.max(0, Math.floor((viewTop - TILE_HEIGHT * 6) * 2 / TILE_HEIGHT));
    const visibleMaxSum = Math.min(gridSize * 2 - 2, Math.ceil((viewBottom + TILE_HEIGHT) * 2 / TILE_HEIGHT));
    
    const lightIntensity = Math.min(1, darkness * 1.3);
    
    // Collect light sources
    const lights = collectLightSources(
      grid,
      gridSize,
      visibleMinSum,
      visibleMaxSum,
      viewLeft,
      viewRight,
      viewTop,
      viewBottom
    );
    
    // Draw light cutouts (destination-out to remove darkness)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.save();
    ctx.scale(dpr * zoom, dpr * zoom);
    ctx.translate(offset.x / zoom, offset.y / zoom);
    
    drawLightCutouts(ctx, lights, lightIntensity);
    
    ctx.restore();
    
    // Draw colored glows (source-over for atmosphere)
    ctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.scale(dpr * zoom, dpr * zoom);
    ctx.translate(offset.x / zoom, offset.y / zoom);
    
    drawColoredGlows(ctx, lights, lightIntensity);
    
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
    
  }, [canvasRef, grid, gridSize, hour, offset, zoom, canvasWidth, canvasHeight]);
}
