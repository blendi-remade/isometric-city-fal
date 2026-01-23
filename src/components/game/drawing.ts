/**
 * Drawing utilities for isometric tile rendering.
 * Extracted from Game.tsx for better code organization.
 */

import { Tile, ZoneType } from '@/types/game';
import { TILE_WIDTH, TILE_HEIGHT } from './types';

// ============================================================================
// Types
// ============================================================================

/** Color scheme for a tile surface */
export type TileColorScheme = {
  top: string;
  left: string;
  right: string;
  stroke: string;
};

/** Corner points of an isometric diamond */
export type DiamondCorners = {
  top: { x: number; y: number };
  right: { x: number; y: number };
  bottom: { x: number; y: number };
  left: { x: number; y: number };
};

/** Beach edge direction for determining inward offset */
export type BeachEdge = 'north' | 'east' | 'south' | 'west';

// ============================================================================
// Color Constants
// ============================================================================

/** Zone-based color schemes for grass tiles */
export const ZONE_COLORS: Record<ZoneType, TileColorScheme> = {
  none: {
    top: '#4a7c3f',
    left: '#3d6634',
    right: '#5a8f4f',
    stroke: '#2d4a26',
  },
  residential: {
    top: '#2d5a2d',
    left: '#1d4a1d',
    right: '#3d6a3d',
    stroke: '#22c55e',
  },
  commercial: {
    top: '#2a4a6a',
    left: '#1a3a5a',
    right: '#3a5a7a',
    stroke: '#3b82f6',
  },
  industrial: {
    top: '#6a4a2a',
    left: '#5a3a1a',
    right: '#7a5a3a',
    stroke: '#f59e0b',
  },
};

/** Zone border colors (dashed lines) */
export const ZONE_BORDER_COLORS: Record<ZoneType, string> = {
  none: 'transparent',
  residential: '#22c55e',
  commercial: '#3b82f6',
  industrial: '#f59e0b',
};

/** Grey base tile colors for buildings */
export const GREY_TILE_COLORS: TileColorScheme = {
  top: '#6b7280',
  left: '#4b5563',
  right: '#9ca3af',
  stroke: '#374151',
};

/** Beach/sidewalk colors */
export const BEACH_COLORS = {
  fill: '#d4a574',
  curb: '#b8956a',
} as const;

/** Dirt/foundation plot colors for construction phase 1 */
export const FOUNDATION_COLORS: TileColorScheme = {
  top: '#a67c52',     // Sandy brown top
  left: '#8b6914',    // Darker ochre left face
  right: '#c4a35a',   // Lighter tan right face
  stroke: '#6b4423',  // Dark brown stroke
};

// ============================================================================
// Geometry Helpers
// ============================================================================

/** Calculate the four corner points of an isometric diamond */
export function getDiamondCorners(x: number, y: number, w = TILE_WIDTH, h = TILE_HEIGHT): DiamondCorners {
  return {
    top: { x: x + w / 2, y },
    right: { x: x + w, y: y + h / 2 },
    bottom: { x: x + w / 2, y: y + h },
    left: { x, y: y + h / 2 },
  };
}

/** Inward direction vectors for each beach edge (pointing toward tile center) */
const BEACH_INWARD_VECTORS: Record<BeachEdge, { dx: number; dy: number }> = {
  north: { dx: 0.707, dy: 0.707 },   // Points center-right and down
  east: { dx: -0.707, dy: 0.707 },   // Points center-left and down
  south: { dx: -0.707, dy: -0.707 }, // Points center-left and up
  west: { dx: 0.707, dy: -0.707 },   // Points center-right and up
};

// ============================================================================
// Base Drawing Functions
// ============================================================================

/**
 * Draw an isometric diamond (top face of a tile).
 * This is the foundation for all tile rendering.
 */
export function drawIsometricDiamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  colors: TileColorScheme,
  options: {
    drawStroke?: boolean;
    strokeWidth?: number;
    dashed?: boolean;
    dashPattern?: number[];
  } = {}
): void {
  const { drawStroke = true, strokeWidth = 0.5, dashed = false, dashPattern = [4, 2] } = options;
  const corners = getDiamondCorners(x, y);

  // Draw the diamond shape
  ctx.fillStyle = colors.top;
  ctx.beginPath();
  ctx.moveTo(corners.top.x, corners.top.y);
  ctx.lineTo(corners.right.x, corners.right.y);
  ctx.lineTo(corners.bottom.x, corners.bottom.y);
  ctx.lineTo(corners.left.x, corners.left.y);
  ctx.closePath();
  ctx.fill();

  // Draw stroke if requested
  if (drawStroke) {
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = strokeWidth;
    if (dashed) {
      ctx.setLineDash(dashPattern);
    }
    ctx.stroke();
    if (dashed) {
      ctx.setLineDash([]);
    }
  }
}

// ============================================================================
// Tile Drawing Functions
// ============================================================================

/**
 * Draw a green base tile for grass/empty tiles.
 * Colors are determined by the tile's zone.
 */
export function drawGreenBaseTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tile: Tile,
  currentZoom: number
): void {
  const colors = ZONE_COLORS[tile.zone];

  // Draw the base diamond with stroke only when zoomed in
  drawIsometricDiamond(ctx, x, y, colors, {
    drawStroke: currentZoom >= 0.6,
    strokeWidth: 0.5,
  });

  // Draw zone border with dashed line when zoomed in enough
  if (tile.zone !== 'none' && currentZoom >= 0.95) {
    const borderColor = ZONE_BORDER_COLORS[tile.zone];
    const corners = getDiamondCorners(x, y);

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(corners.top.x, corners.top.y);
    ctx.lineTo(corners.right.x, corners.right.y);
    ctx.lineTo(corners.bottom.x, corners.bottom.y);
    ctx.lineTo(corners.left.x, corners.left.y);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/**
 * Draw a grey base tile for buildings.
 */
export function drawGreyBaseTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  _tile: Tile,
  currentZoom: number
): void {
  drawIsometricDiamond(ctx, x, y, GREY_TILE_COLORS, {
    drawStroke: currentZoom >= 0.6,
    strokeWidth: 0.5,
  });
}

/**
 * Draw a foundation/dirt plot tile for construction phase 1.
 * This shows a flat dirt tile to indicate construction preparation.
 */
export function drawFoundationPlot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  currentZoom: number
): void {
  // Calculate corners for the isometric tile (flat, no height)
  const topX = x + w / 2;
  const topY = y;
  const rightX = x + w;
  const rightY = y + h / 2;
  const bottomX = x + w / 2;
  const bottomY = y + h;
  const leftX = x;
  const leftY = y + h / 2;
  
  // Draw flat top face of the dirt plot
  ctx.fillStyle = FOUNDATION_COLORS.top;
  ctx.beginPath();
  ctx.moveTo(topX, topY);
  ctx.lineTo(rightX, rightY);
  ctx.lineTo(bottomX, bottomY);
  ctx.lineTo(leftX, leftY);
  ctx.closePath();
  ctx.fill();
  
  // Add some texture/detail to the dirt (small dots/pebbles) when zoomed in
  if (currentZoom >= 0.8) {
    ctx.fillStyle = '#8b6914';
    const dotCount = 10;
    for (let i = 0; i < dotCount; i++) {
      // Use deterministic positions based on coordinates
      const seed = (x * 17 + y * 31 + i * 7) % 100;
      const offsetX = (seed % 40 - 20) / 100 * w;
      const offsetY = ((seed * 3) % 40 - 20) / 100 * h;
      const dotX = x + w / 2 + offsetX;
      const dotY = y + h / 2 + offsetY;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 0.67, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Draw stroke around the tile if zoomed in enough
  if (currentZoom >= 0.6) {
    ctx.strokeStyle = FOUNDATION_COLORS.stroke;
    ctx.lineWidth = 0.5;
    
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(rightX, rightY);
    ctx.lineTo(bottomX, bottomY);
    ctx.lineTo(leftX, leftY);
    ctx.closePath();
    ctx.stroke();
  }
}

// ============================================================================
// Beach Drawing Functions
// ============================================================================

/** Configuration for beach rendering */
const BEACH_CONFIG = {
  /** Width of the beach strip as a fraction of tile width */
  widthRatio: 0.04,
  /** Curb line width */
  curbWidth: 1.5,
  /** Diagonal factor for corner shortening (√2/2) */
  cornerFactor: 0.707,
} as const;

/**
 * Draw a beach strip along one edge of a tile.
 * @param ctx - Canvas context
 * @param startX - Start X coordinate
 * @param startY - Start Y coordinate
 * @param endX - End X coordinate
 * @param endY - End Y coordinate
 * @param inwardDx - X component of inward direction
 * @param inwardDy - Y component of inward direction
 * @param beachWidth - Width of the beach strip
 * @param shortenStart - Whether to shorten at start (for corner connection)
 * @param shortenEnd - Whether to shorten at end (for corner connection)
 */
function drawBeachEdge(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  inwardDx: number,
  inwardDy: number,
  beachWidth: number,
  shortenStart: boolean,
  shortenEnd: boolean
): void {
  const shortenDist = beachWidth * BEACH_CONFIG.cornerFactor;

  // Calculate edge direction vector
  const edgeDx = endX - startX;
  const edgeDy = endY - startY;
  const edgeLen = Math.hypot(edgeDx, edgeDy);
  const edgeDirX = edgeDx / edgeLen;
  const edgeDirY = edgeDy / edgeLen;

  // Apply shortening at corners
  let actualStartX = startX;
  let actualStartY = startY;
  let actualEndX = endX;
  let actualEndY = endY;

  if (shortenStart && edgeLen > shortenDist * 2) {
    actualStartX = startX + edgeDirX * shortenDist;
    actualStartY = startY + edgeDirY * shortenDist;
  }
  if (shortenEnd && edgeLen > shortenDist * 2) {
    actualEndX = endX - edgeDirX * shortenDist;
    actualEndY = endY - edgeDirY * shortenDist;
  }

  // Draw curb (darker line at outer edge)
  ctx.strokeStyle = BEACH_COLORS.curb;
  ctx.lineWidth = BEACH_CONFIG.curbWidth;
  ctx.beginPath();
  ctx.moveTo(actualStartX, actualStartY);
  ctx.lineTo(actualEndX, actualEndY);
  ctx.stroke();

  // Draw beach fill
  ctx.fillStyle = BEACH_COLORS.fill;
  ctx.beginPath();
  ctx.moveTo(actualStartX, actualStartY);
  ctx.lineTo(actualEndX, actualEndY);
  ctx.lineTo(actualEndX + inwardDx * beachWidth, actualEndY + inwardDy * beachWidth);
  ctx.lineTo(actualStartX + inwardDx * beachWidth, actualStartY + inwardDy * beachWidth);
  ctx.closePath();
  ctx.fill();
}

/**
 * Calculate the inner endpoint of a shortened edge (for corner pieces).
 */
function getShortenedInnerEndpoint(
  cornerX: number,
  cornerY: number,
  otherCornerX: number,
  otherCornerY: number,
  inwardDx: number,
  inwardDy: number,
  beachWidth: number
): { x: number; y: number } {
  const shortenDist = beachWidth * BEACH_CONFIG.cornerFactor;

  // Edge direction FROM otherCorner TO corner
  const edgeDx = cornerX - otherCornerX;
  const edgeDy = cornerY - otherCornerY;
  const edgeLen = Math.hypot(edgeDx, edgeDy);
  const edgeDirX = edgeDx / edgeLen;
  const edgeDirY = edgeDy / edgeLen;

  // Shortened outer endpoint (move backwards from corner along edge)
  const shortenedOuterX = cornerX - edgeDirX * shortenDist;
  const shortenedOuterY = cornerY - edgeDirY * shortenDist;

  return {
    x: shortenedOuterX + inwardDx * beachWidth,
    y: shortenedOuterY + inwardDy * beachWidth,
  };
}

/**
 * Draw a corner piece where two beach edges meet.
 */
function drawBeachCorner(
  ctx: CanvasRenderingContext2D,
  cornerPoint: { x: number; y: number },
  edge1Corner: { x: number; y: number },
  edge1Inward: { dx: number; dy: number },
  edge2Corner: { x: number; y: number },
  edge2Inward: { dx: number; dy: number },
  beachWidth: number
): void {
  const inner1 = getShortenedInnerEndpoint(
    cornerPoint.x, cornerPoint.y,
    edge1Corner.x, edge1Corner.y,
    edge1Inward.dx, edge1Inward.dy,
    beachWidth
  );
  const inner2 = getShortenedInnerEndpoint(
    cornerPoint.x, cornerPoint.y,
    edge2Corner.x, edge2Corner.y,
    edge2Inward.dx, edge2Inward.dy,
    beachWidth
  );

  ctx.fillStyle = BEACH_COLORS.fill;
  ctx.beginPath();
  ctx.moveTo(cornerPoint.x, cornerPoint.y);
  ctx.lineTo(inner1.x, inner1.y);
  ctx.lineTo(inner2.x, inner2.y);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw beach effect on tiles adjacent to water.
 * Creates a sidewalk-style sandy strip along edges facing water.
 */
export function drawBeach(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  adjacentWater: { north: boolean; east: boolean; south: boolean; west: boolean }
): void {
  const { north, east, south, west } = adjacentWater;

  // Early exit if no adjacent water
  if (!north && !east && !south && !west) return;

  const beachWidth = TILE_WIDTH * BEACH_CONFIG.widthRatio;
  const corners = getDiamondCorners(x, y);

  // Draw beach edges for sides adjacent to water
  // Each edge connects two corners and has an inward direction

  // North edge (top-left: left corner → top corner)
  if (north) {
    const inward = BEACH_INWARD_VECTORS.north;
    drawBeachEdge(
      ctx,
      corners.left.x, corners.left.y,
      corners.top.x, corners.top.y,
      inward.dx, inward.dy,
      beachWidth,
      west,  // Shorten at left if west also has beach
      east   // Shorten at top if east also has beach
    );
  }

  // East edge (top-right: top corner → right corner)
  if (east) {
    const inward = BEACH_INWARD_VECTORS.east;
    drawBeachEdge(
      ctx,
      corners.top.x, corners.top.y,
      corners.right.x, corners.right.y,
      inward.dx, inward.dy,
      beachWidth,
      north, // Shorten at top if north also has beach
      south  // Shorten at right if south also has beach
    );
  }

  // South edge (bottom-right: right corner → bottom corner)
  if (south) {
    const inward = BEACH_INWARD_VECTORS.south;
    drawBeachEdge(
      ctx,
      corners.right.x, corners.right.y,
      corners.bottom.x, corners.bottom.y,
      inward.dx, inward.dy,
      beachWidth,
      east,  // Shorten at right if east also has beach
      west   // Shorten at bottom if west also has beach
    );
  }

  // West edge (bottom-left: bottom corner → left corner)
  if (west) {
    const inward = BEACH_INWARD_VECTORS.west;
    drawBeachEdge(
      ctx,
      corners.bottom.x, corners.bottom.y,
      corners.left.x, corners.left.y,
      inward.dx, inward.dy,
      beachWidth,
      south, // Shorten at bottom if south also has beach
      north  // Shorten at left if north also has beach
    );
  }

  // Draw corner pieces where two beach edges meet
  // Top corner (north + east)
  if (north && east) {
    drawBeachCorner(
      ctx,
      corners.top,
      corners.left,
      BEACH_INWARD_VECTORS.north,
      corners.right,
      BEACH_INWARD_VECTORS.east,
      beachWidth
    );
  }

  // Right corner (east + south)
  if (east && south) {
    drawBeachCorner(
      ctx,
      corners.right,
      corners.top,
      BEACH_INWARD_VECTORS.east,
      corners.bottom,
      BEACH_INWARD_VECTORS.south,
      beachWidth
    );
  }

  // Bottom corner (south + west)
  if (south && west) {
    drawBeachCorner(
      ctx,
      corners.bottom,
      corners.right,
      BEACH_INWARD_VECTORS.south,
      corners.left,
      BEACH_INWARD_VECTORS.west,
      beachWidth
    );
  }

  // Left corner (west + north)
  if (west && north) {
    drawBeachCorner(
      ctx,
      corners.left,
      corners.bottom,
      BEACH_INWARD_VECTORS.west,
      corners.top,
      BEACH_INWARD_VECTORS.north,
      beachWidth
    );
  }
}

// ============================================================================
// Beach on Water Tiles
// ============================================================================

/** Outward direction vectors for beach edges on water tiles (pointing toward tile edge) */
const BEACH_OUTWARD_VECTORS: Record<BeachEdge, { dx: number; dy: number }> = {
  north: { dx: -0.707, dy: -0.707 },  // Points toward north edge
  east: { dx: 0.707, dy: -0.707 },    // Points toward east edge
  south: { dx: 0.707, dy: 0.707 },    // Points toward south edge
  west: { dx: -0.707, dy: 0.707 },    // Points toward west edge
};

/**
 * Draw a beach edge on a water tile (beach strip at the edge facing land).
 * The beach is drawn FROM the edge INWARD toward the water center.
 */
function drawBeachEdgeOnWater(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  inwardDx: number,
  inwardDy: number,
  beachWidth: number,
  shortenStart: boolean,
  shortenEnd: boolean
): void {
  const shortenDist = beachWidth * BEACH_CONFIG.cornerFactor;

  // Calculate edge direction vector
  const edgeDx = endX - startX;
  const edgeDy = endY - startY;
  const edgeLen = Math.hypot(edgeDx, edgeDy);
  const edgeDirX = edgeDx / edgeLen;
  const edgeDirY = edgeDy / edgeLen;

  // Apply shortening at corners
  let actualStartX = startX;
  let actualStartY = startY;
  let actualEndX = endX;
  let actualEndY = endY;

  if (shortenStart && edgeLen > shortenDist * 2) {
    actualStartX = startX + edgeDirX * shortenDist;
    actualStartY = startY + edgeDirY * shortenDist;
  }
  if (shortenEnd && edgeLen > shortenDist * 2) {
    actualEndX = endX - edgeDirX * shortenDist;
    actualEndY = endY - edgeDirY * shortenDist;
  }

  // Draw beach fill (from edge inward)
  ctx.fillStyle = BEACH_COLORS.fill;
  ctx.beginPath();
  ctx.moveTo(actualStartX, actualStartY);
  ctx.lineTo(actualEndX, actualEndY);
  ctx.lineTo(actualEndX + inwardDx * beachWidth, actualEndY + inwardDy * beachWidth);
  ctx.lineTo(actualStartX + inwardDx * beachWidth, actualStartY + inwardDy * beachWidth);
  ctx.closePath();
  ctx.fill();

  // Draw curb (darker line at outer edge - the water's edge)
  ctx.strokeStyle = BEACH_COLORS.curb;
  ctx.lineWidth = BEACH_CONFIG.curbWidth;
  ctx.beginPath();
  ctx.moveTo(actualStartX + inwardDx * beachWidth, actualStartY + inwardDy * beachWidth);
  ctx.lineTo(actualEndX + inwardDx * beachWidth, actualEndY + inwardDy * beachWidth);
  ctx.stroke();
}

/**
 * Draw corner piece for beach on water tile.
 */
function drawBeachCornerOnWater(
  ctx: CanvasRenderingContext2D,
  cornerPoint: { x: number; y: number },
  edge1Corner: { x: number; y: number },
  edge1Inward: { dx: number; dy: number },
  edge2Corner: { x: number; y: number },
  edge2Inward: { dx: number; dy: number },
  beachWidth: number
): void {
  const inner1 = getShortenedInnerEndpoint(
    cornerPoint.x, cornerPoint.y,
    edge1Corner.x, edge1Corner.y,
    edge1Inward.dx, edge1Inward.dy,
    beachWidth
  );
  const inner2 = getShortenedInnerEndpoint(
    cornerPoint.x, cornerPoint.y,
    edge2Corner.x, edge2Corner.y,
    edge2Inward.dx, edge2Inward.dy,
    beachWidth
  );

  ctx.fillStyle = BEACH_COLORS.fill;
  ctx.beginPath();
  ctx.moveTo(cornerPoint.x, cornerPoint.y);
  ctx.lineTo(inner1.x, inner1.y);
  ctx.lineTo(inner2.x, inner2.y);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw beach effect on water tiles at edges facing land.
 * Creates a sandy strip along edges where water meets non-water tiles.
 * @param adjacentLand - Which adjacent tiles are land (not water)
 */
export function drawBeachOnWater(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  adjacentLand: { north: boolean; east: boolean; south: boolean; west: boolean }
): void {
  const { north, east, south, west } = adjacentLand;

  // Early exit if no adjacent land (water is fully surrounded by water)
  if (!north && !east && !south && !west) return;

  const beachWidth = TILE_WIDTH * BEACH_CONFIG.widthRatio * 2.5; // Slightly wider for visibility on water
  const corners = getDiamondCorners(x, y);

  // The inward vectors point FROM the edge TOWARD the center of the tile
  // For water tiles, we draw beach strips starting at the edge and going inward

  // North edge (top-left: left corner → top corner) - land is to the north
  if (north) {
    const inward = BEACH_INWARD_VECTORS.north;
    drawBeachEdgeOnWater(
      ctx,
      corners.left.x, corners.left.y,
      corners.top.x, corners.top.y,
      inward.dx, inward.dy,
      beachWidth,
      west,   // Shorten at left if west also has land
      east    // Shorten at top if east also has land
    );
  }

  // East edge (top-right: top corner → right corner) - land is to the east
  if (east) {
    const inward = BEACH_INWARD_VECTORS.east;
    drawBeachEdgeOnWater(
      ctx,
      corners.top.x, corners.top.y,
      corners.right.x, corners.right.y,
      inward.dx, inward.dy,
      beachWidth,
      north,  // Shorten at top if north also has land
      south   // Shorten at right if south also has land
    );
  }

  // South edge (bottom-right: right corner → bottom corner) - land is to the south
  if (south) {
    const inward = BEACH_INWARD_VECTORS.south;
    drawBeachEdgeOnWater(
      ctx,
      corners.right.x, corners.right.y,
      corners.bottom.x, corners.bottom.y,
      inward.dx, inward.dy,
      beachWidth,
      east,   // Shorten at right if east also has land
      west    // Shorten at bottom if west also has land
    );
  }

  // West edge (bottom-left: bottom corner → left corner) - land is to the west
  if (west) {
    const inward = BEACH_INWARD_VECTORS.west;
    drawBeachEdgeOnWater(
      ctx,
      corners.bottom.x, corners.bottom.y,
      corners.left.x, corners.left.y,
      inward.dx, inward.dy,
      beachWidth,
      south,  // Shorten at bottom if south also has land
      north   // Shorten at left if north also has land
    );
  }

  // Draw corner pieces where two beach edges meet
  // Top corner (north + east)
  if (north && east) {
    drawBeachCornerOnWater(
      ctx,
      corners.top,
      corners.left,
      BEACH_INWARD_VECTORS.north,
      corners.right,
      BEACH_INWARD_VECTORS.east,
      beachWidth
    );
  }

  // Right corner (east + south)
  if (east && south) {
    drawBeachCornerOnWater(
      ctx,
      corners.right,
      corners.top,
      BEACH_INWARD_VECTORS.east,
      corners.bottom,
      BEACH_INWARD_VECTORS.south,
      beachWidth
    );
  }

  // Bottom corner (south + west)
  if (south && west) {
    drawBeachCornerOnWater(
      ctx,
      corners.bottom,
      corners.right,
      BEACH_INWARD_VECTORS.south,
      corners.left,
      BEACH_INWARD_VECTORS.west,
      beachWidth
    );
  }

  // Left corner (west + north)
  if (west && north) {
    drawBeachCornerOnWater(
      ctx,
      corners.left,
      corners.bottom,
      BEACH_INWARD_VECTORS.west,
      corners.top,
      BEACH_INWARD_VECTORS.north,
      beachWidth
    );
  }
}
