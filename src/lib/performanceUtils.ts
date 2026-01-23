// Performance utilities for large map support
// Provides spatial indexing, caching, and LOD (Level of Detail) management

import { Tile, Building, City } from '@/types/game';

// ============================================================================
// SPATIAL INDEXING
// ============================================================================

/**
 * Spatial hash grid for efficient tile/entity queries
 * Divides the map into cells for O(1) lookup of entities in an area
 */
export class SpatialGrid<T extends { x: number; y: number }> {
  private cellSize: number;
  private cells: Map<number, T[]> = new Map();
  private gridWidth: number;
  
  constructor(gridSize: number, cellSize: number = 8) {
    this.cellSize = cellSize;
    this.gridWidth = Math.ceil(gridSize / cellSize);
  }
  
  private getCellKey(x: number, y: number): number {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return cellY * this.gridWidth + cellX;
  }
  
  clear(): void {
    this.cells.clear();
  }
  
  insert(entity: T): void {
    const key = this.getCellKey(entity.x, entity.y);
    if (!this.cells.has(key)) {
      this.cells.set(key, []);
    }
    this.cells.get(key)!.push(entity);
  }
  
  insertAll(entities: T[]): void {
    for (const entity of entities) {
      this.insert(entity);
    }
  }
  
  /**
   * Get entities near a point (within radius cells)
   */
  getNearby(x: number, y: number, radius: number = 1): T[] {
    const result: T[] = [];
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const key = (cellY + dy) * this.gridWidth + (cellX + dx);
        const cell = this.cells.get(key);
        if (cell) {
          result.push(...cell);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Get entities in a rectangular area
   */
  getInRect(minX: number, minY: number, maxX: number, maxY: number): T[] {
    const result: T[] = [];
    const startCellX = Math.floor(minX / this.cellSize);
    const startCellY = Math.floor(minY / this.cellSize);
    const endCellX = Math.floor(maxX / this.cellSize);
    const endCellY = Math.floor(maxY / this.cellSize);
    
    for (let cy = startCellY; cy <= endCellY; cy++) {
      for (let cx = startCellX; cx <= endCellX; cx++) {
        const key = cy * this.gridWidth + cx;
        const cell = this.cells.get(key);
        if (cell) {
          // Filter to only entities actually in the rect
          for (const entity of cell) {
            if (entity.x >= minX && entity.x <= maxX && entity.y >= minY && entity.y <= maxY) {
              result.push(entity);
            }
          }
        }
      }
    }
    
    return result;
  }
}

// ============================================================================
// LOD (Level of Detail) MANAGEMENT
// ============================================================================

export interface LODLevel {
  zoomMin: number;
  zoomMax: number;
  // Rendering detail options
  drawBuildings: boolean;
  drawVehicles: boolean;
  drawPedestrians: boolean;
  drawDecorations: boolean; // Trees, parks, details
  drawAnimations: boolean;  // Animated effects
  drawLighting: boolean;    // Day/night lighting
  // Update frequency multiplier (1 = every frame, 2 = every other frame, etc.)
  updateFrequency: number;
}

export const LOD_LEVELS: LODLevel[] = [
  // Far out - overview mode (zoom < 0.15)
  {
    zoomMin: 0,
    zoomMax: 0.15,
    drawBuildings: true,
    drawVehicles: false,
    drawPedestrians: false,
    drawDecorations: false,
    drawAnimations: false,
    drawLighting: false,
    updateFrequency: 4,
  },
  // Zoomed out - city overview (0.15 <= zoom < 0.3)
  {
    zoomMin: 0.15,
    zoomMax: 0.3,
    drawBuildings: true,
    drawVehicles: false,
    drawPedestrians: false,
    drawDecorations: true,
    drawAnimations: false,
    drawLighting: true,
    updateFrequency: 2,
  },
  // Normal view - standard rendering (0.3 <= zoom < 0.7)
  {
    zoomMin: 0.3,
    zoomMax: 0.7,
    drawBuildings: true,
    drawVehicles: true,
    drawPedestrians: false,
    drawDecorations: true,
    drawAnimations: true,
    drawLighting: true,
    updateFrequency: 1,
  },
  // Zoomed in - full detail (zoom >= 0.7)
  {
    zoomMin: 0.7,
    zoomMax: Infinity,
    drawBuildings: true,
    drawVehicles: true,
    drawPedestrians: true,
    drawDecorations: true,
    drawAnimations: true,
    drawLighting: true,
    updateFrequency: 1,
  },
];

/**
 * Get the current LOD level for a given zoom
 */
export function getLODLevel(zoom: number): LODLevel {
  for (const level of LOD_LEVELS) {
    if (zoom >= level.zoomMin && zoom < level.zoomMax) {
      return level;
    }
  }
  return LOD_LEVELS[LOD_LEVELS.length - 1];
}

// ============================================================================
// VIEWPORT CULLING
// ============================================================================

export interface ViewportBounds {
  minTileX: number;
  minTileY: number;
  maxTileX: number;
  maxTileY: number;
}

/**
 * Calculate which tiles are visible in the current viewport
 */
export function getVisibleTileBounds(
  offset: { x: number; y: number },
  zoom: number,
  canvasWidth: number,
  canvasHeight: number,
  gridSize: number,
  tileWidth: number = 64,
  tileHeight: number = 38.4
): ViewportBounds {
  // Convert screen bounds to tile coordinates with padding
  const padding = 2; // Extra tiles for smooth scrolling
  
  const viewLeft = -offset.x / zoom;
  const viewTop = -offset.y / zoom;
  const viewRight = (canvasWidth - offset.x) / zoom;
  const viewBottom = (canvasHeight - offset.y) / zoom;
  
  // Convert to rough tile coordinates (isometric projection)
  // This is an approximation - actual conversion is more complex
  const halfWidth = tileWidth / 2;
  const halfHeight = tileHeight / 2;
  
  // Estimate visible tile range
  const minTileX = Math.max(0, Math.floor((viewLeft / halfWidth + viewTop / halfHeight) / 2) - padding);
  const minTileY = Math.max(0, Math.floor((-viewLeft / halfWidth + viewTop / halfHeight) / 2) - padding);
  const maxTileX = Math.min(gridSize - 1, Math.ceil((viewRight / halfWidth + viewBottom / halfHeight) / 2) + padding);
  const maxTileY = Math.min(gridSize - 1, Math.ceil((-viewRight / halfWidth + viewBottom / halfHeight) / 2) + padding);
  
  return { minTileX, minTileY, maxTileX, maxTileY };
}

/**
 * Check if a tile is within the visible viewport bounds
 */
export function isTileVisible(
  tileX: number,
  tileY: number,
  bounds: ViewportBounds
): boolean {
  return (
    tileX >= bounds.minTileX &&
    tileX <= bounds.maxTileX &&
    tileY >= bounds.minTileY &&
    tileY <= bounds.maxTileY
  );
}

// ============================================================================
// CACHING UTILITIES
// ============================================================================

/**
 * LRU (Least Recently Used) cache for computed values
 */
export class LRUCache<K, V> {
  private cache: Map<K, V> = new Map();
  private maxSize: number;
  
  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }
  
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }
  
  set(key: K, value: V): void {
    // Delete first to update order
    this.cache.delete(key);
    this.cache.set(key, value);
    
    // Evict oldest if over capacity
    if (this.cache.size > this.maxSize) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) {
        this.cache.delete(oldest);
      }
    }
  }
  
  has(key: K): boolean {
    return this.cache.has(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  get size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// FRAME BUDGET MANAGEMENT
// ============================================================================

/**
 * Tracks time spent per frame to maintain target FPS
 */
export class FrameBudget {
  private targetFPS: number;
  private frameBudgetMs: number;
  private frameStartTime: number = 0;
  
  constructor(targetFPS: number = 60) {
    this.targetFPS = targetFPS;
    this.frameBudgetMs = 1000 / targetFPS;
  }
  
  startFrame(): void {
    this.frameStartTime = performance.now();
  }
  
  /**
   * Check if we still have time budget remaining
   */
  hasRemainingBudget(reserveMs: number = 2): boolean {
    const elapsed = performance.now() - this.frameStartTime;
    return elapsed < (this.frameBudgetMs - reserveMs);
  }
  
  /**
   * Get remaining time in milliseconds
   */
  getRemainingMs(): number {
    const elapsed = performance.now() - this.frameStartTime;
    return Math.max(0, this.frameBudgetMs - elapsed);
  }
  
  /**
   * Get elapsed time in milliseconds
   */
  getElapsedMs(): number {
    return performance.now() - this.frameStartTime;
  }
}

// ============================================================================
// CHUNK-BASED RENDERING
// ============================================================================

/**
 * Divides the map into chunks for efficient rendering
 * Each chunk can be pre-rendered to an off-screen canvas
 */
export interface RenderChunk {
  x: number;
  y: number;
  width: number;
  height: number;
  canvas: HTMLCanvasElement | null;
  dirty: boolean;
  lastRenderedAt: number;
}

export class ChunkRenderer {
  private chunks: Map<string, RenderChunk> = new Map();
  private chunkSize: number;
  private gridSize: number;
  
  constructor(gridSize: number, chunkSize: number = 16) {
    this.gridSize = gridSize;
    this.chunkSize = chunkSize;
  }
  
  private getChunkKey(chunkX: number, chunkY: number): string {
    return `${chunkX},${chunkY}`;
  }
  
  /**
   * Mark a chunk as dirty (needs re-rendering)
   */
  markDirty(tileX: number, tileY: number): void {
    const chunkX = Math.floor(tileX / this.chunkSize);
    const chunkY = Math.floor(tileY / this.chunkSize);
    const key = this.getChunkKey(chunkX, chunkY);
    const chunk = this.chunks.get(key);
    if (chunk) {
      chunk.dirty = true;
    }
  }
  
  /**
   * Mark all chunks as dirty
   */
  markAllDirty(): void {
    for (const chunk of this.chunks.values()) {
      chunk.dirty = true;
    }
  }
  
  /**
   * Get or create a chunk for the given tile coordinates
   */
  getChunk(tileX: number, tileY: number): RenderChunk {
    const chunkX = Math.floor(tileX / this.chunkSize);
    const chunkY = Math.floor(tileY / this.chunkSize);
    const key = this.getChunkKey(chunkX, chunkY);
    
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = {
        x: chunkX * this.chunkSize,
        y: chunkY * this.chunkSize,
        width: this.chunkSize,
        height: this.chunkSize,
        canvas: null,
        dirty: true,
        lastRenderedAt: 0,
      };
      this.chunks.set(key, chunk);
    }
    
    return chunk;
  }
  
  /**
   * Get all chunks that intersect the given viewport
   */
  getVisibleChunks(bounds: ViewportBounds): RenderChunk[] {
    const result: RenderChunk[] = [];
    const startChunkX = Math.floor(bounds.minTileX / this.chunkSize);
    const startChunkY = Math.floor(bounds.minTileY / this.chunkSize);
    const endChunkX = Math.floor(bounds.maxTileX / this.chunkSize);
    const endChunkY = Math.floor(bounds.maxTileY / this.chunkSize);
    
    for (let cy = startChunkY; cy <= endChunkY; cy++) {
      for (let cx = startChunkX; cx <= endChunkX; cx++) {
        const key = this.getChunkKey(cx, cy);
        const chunk = this.chunks.get(key) || this.getChunk(cx * this.chunkSize, cy * this.chunkSize);
        result.push(chunk);
      }
    }
    
    return result;
  }
  
  /**
   * Clear all chunks
   */
  clear(): void {
    this.chunks.clear();
  }
}

// ============================================================================
// BATCH RENDERING
// ============================================================================

/**
 * Batch similar draw calls for better GPU performance
 */
export interface DrawBatch {
  type: 'fill' | 'stroke' | 'image';
  color?: string;
  image?: HTMLImageElement | HTMLCanvasElement;
  paths: Path2D[];
  rects: Array<{ x: number; y: number; w: number; h: number }>;
  images: Array<{ sx: number; sy: number; sw: number; sh: number; dx: number; dy: number; dw: number; dh: number }>;
}

export class BatchRenderer {
  private batches: Map<string, DrawBatch> = new Map();
  
  addFillRect(color: string, x: number, y: number, w: number, h: number): void {
    const key = `fill:${color}`;
    if (!this.batches.has(key)) {
      this.batches.set(key, {
        type: 'fill',
        color,
        paths: [],
        rects: [],
        images: [],
      });
    }
    this.batches.get(key)!.rects.push({ x, y, w, h });
  }
  
  addImage(
    image: HTMLImageElement | HTMLCanvasElement,
    sx: number, sy: number, sw: number, sh: number,
    dx: number, dy: number, dw: number, dh: number
  ): void {
    const key = `image:${'src' in image ? image.src : 'canvas'}`;
    if (!this.batches.has(key)) {
      this.batches.set(key, {
        type: 'image',
        image,
        paths: [],
        rects: [],
        images: [],
      });
    }
    this.batches.get(key)!.images.push({ sx, sy, sw, sh, dx, dy, dw, dh });
  }
  
  flush(ctx: CanvasRenderingContext2D): void {
    for (const batch of this.batches.values()) {
      if (batch.type === 'fill' && batch.color) {
        ctx.fillStyle = batch.color;
        for (const rect of batch.rects) {
          ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        }
      } else if (batch.type === 'image' && batch.image) {
        for (const img of batch.images) {
          ctx.drawImage(
            batch.image,
            img.sx, img.sy, img.sw, img.sh,
            img.dx, img.dy, img.dw, img.dh
          );
        }
      }
    }
    this.batches.clear();
  }
  
  clear(): void {
    this.batches.clear();
  }
}
