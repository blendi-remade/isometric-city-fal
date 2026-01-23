'use client';

import { useCallback, useRef } from 'react';

// =============================================================================
// CLOUD TYPES - Simplified cloud types for theme park atmosphere
// =============================================================================

export type CloudType = 'cumulus' | 'cirrus' | 'altocumulus';

export interface CloudPuff {
  offsetX: number;
  offsetY: number;
  size: number;
  opacity: number;
  stretchX?: number;
  stretchY?: number;
}

export interface Cloud {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  opacity: number;
  puffs: CloudPuff[];
  layer: number; // 0=low, 1=mid, 2=high (parallax)
  cloudType: CloudType;
}

// =============================================================================
// CLOUD CONSTANTS
// =============================================================================

const CLOUD_MIN_ZOOM = 0.2;           // Minimum zoom to show clouds
const CLOUD_MAX_ZOOM = 1.2;           // Zoom level above which clouds start to fade
const CLOUD_FADE_ZOOM = 1.8;          // Zoom level at which clouds are fully invisible
const CLOUD_MAX_COVERAGE = 0.30;      // Viewport fraction above which clouds fade
const CLOUD_COVERAGE_FADE_END = 0.6;  // At this coverage, clouds are fully faded
const CLOUD_MAX_COUNT = 14;           // Maximum clouds on screen
const CLOUD_MAX_COUNT_MOBILE = 8;     // Fewer clouds on mobile
const CLOUD_SPAWN_INTERVAL = 3.0;     // Seconds between cloud spawn attempts
const CLOUD_SPAWN_INTERVAL_MOBILE = 5.0;
const CLOUD_SPEED_MIN = 6;            // Minimum cloud drift speed
const CLOUD_SPEED_MAX = 18;           // Maximum cloud drift speed
const CLOUD_WIDTH = 140;              // Approximate cloud width for spawn offset
const CLOUD_DESPAWN_MARGIN = 350;     // Distance past viewport to despawn

// Wind direction: clouds drift from southwest to northeast (isometric perspective)
const CLOUD_WIND_ANGLE = -Math.PI / 4;

// Parallax effect: higher clouds move faster
const CLOUD_LAYER_SPEEDS = [0.7, 1.0, 1.4];
const CLOUD_LAYER_OPACITY = [0.85, 1.0, 0.9];

// Night darkening
const CLOUD_NIGHT_OPACITY_MULT = 0.55;

// Cloud type spawn weights - theme park favors fair weather
const CLOUD_TYPE_WEIGHTS: [number, number, number] = [7, 3, 5]; // cumulus, cirrus, altocumulus
const CLOUD_TYPES_ORDERED: CloudType[] = ['cumulus', 'cirrus', 'altocumulus'];

// Per-type visual configuration
const CLOUD_TYPE_CONFIG: Record<CloudType, {
  opacityMin: number;
  opacityMax: number;
  layerRestriction: number; // -1 = any layer, 0/1/2 = only that layer
  speedMult: number;
  scaleMin: number;
  scaleMax: number;
  puffStretchX: [number, number];
  puffStretchY: [number, number];
}> = {
  cumulus: {
    opacityMin: 0.2,
    opacityMax: 0.4,
    layerRestriction: -1,
    speedMult: 1.0,
    scaleMin: 0.7,
    scaleMax: 1.5,
    puffStretchX: [1, 1],
    puffStretchY: [1, 1],
  },
  cirrus: {
    opacityMin: 0.06,
    opacityMax: 0.18,
    layerRestriction: 2,
    speedMult: 1.5,
    scaleMin: 0.8,
    scaleMax: 1.4,
    puffStretchX: [2, 4],
    puffStretchY: [0.3, 0.5],
  },
  altocumulus: {
    opacityMin: 0.15,
    opacityMax: 0.35,
    layerRestriction: 1,
    speedMult: 1.1,
    scaleMin: 0.6,
    scaleMax: 1.2,
    puffStretchX: [1, 1.5],
    puffStretchY: [0.7, 1],
  },
};

// =============================================================================
// CLOUD SYSTEM HOOK
// =============================================================================

interface CloudSystemProps {
  canvasWidth: number;
  canvasHeight: number;
  offset: { x: number; y: number };
  zoom: number;
  hour: number;
  isMobile?: boolean;
}

interface CloudSystemRefs {
  cloudsRef: React.MutableRefObject<Cloud[]>;
  cloudIdRef: React.MutableRefObject<number>;
  cloudSpawnTimerRef: React.MutableRefObject<number>;
}

export function useCoasterCloudSystem(
  props: CloudSystemProps,
  refs: CloudSystemRefs
) {
  const { canvasWidth, canvasHeight, offset, zoom, hour, isMobile = false } = props;
  const { cloudsRef, cloudIdRef, cloudSpawnTimerRef } = refs;

  // Small jitter helper for natural variation
  const jitter = (base: number, range: number) => base + (Math.random() - 0.5) * range;

  // Pick cloud type based on weights
  const pickCloudType = useCallback((): CloudType => {
    const total = CLOUD_TYPE_WEIGHTS.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < CLOUD_TYPES_ORDERED.length; i++) {
      r -= CLOUD_TYPE_WEIGHTS[i];
      if (r <= 0) return CLOUD_TYPES_ORDERED[i];
    }
    return CLOUD_TYPES_ORDERED[0];
  }, []);

  // Generate cloud puffs with proper geometric patterns
  const generateCloudPuffs = useCallback((cloudType: CloudType): CloudPuff[] => {
    const cfg = CLOUD_TYPE_CONFIG[cloudType];
    const [sxMin, sxMax] = cfg.puffStretchX;
    const [syMin, syMax] = cfg.puffStretchY;
    const stretchX = () => sxMin + Math.random() * (sxMax - sxMin);
    const stretchY = () => syMin + Math.random() * (syMax - syMin);
    const puffs: CloudPuff[] = [];

    switch (cloudType) {
      case 'cumulus': {
        // Coherent cotton-ball cluster
        puffs.push({ offsetX: jitter(0, 6), offsetY: jitter(0, 5), size: jitter(42, 10), opacity: 0.9 });
        const innerCount = 4 + Math.floor(Math.random() * 2);
        for (let i = 0; i < innerCount; i++) {
          const angle = (i / innerCount) * Math.PI * 2 + 0.3;
          const dist = jitter(18, 6);
          puffs.push({
            offsetX: Math.cos(angle) * dist + jitter(0, 5),
            offsetY: Math.sin(angle) * dist * 0.7 + jitter(0, 4),
            size: jitter(32, 8),
            opacity: 0.75 + Math.random() * 0.2,
          });
        }
        const outerCount = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < outerCount; i++) {
          const angle = (i / outerCount) * Math.PI * 2 + 0.7;
          const dist = jitter(38, 8);
          puffs.push({
            offsetX: Math.cos(angle) * dist + jitter(0, 6),
            offsetY: Math.sin(angle) * dist * 0.6 + jitter(0, 5),
            size: jitter(24, 6),
            opacity: 0.6 + Math.random() * 0.25,
          });
        }
        break;
      }

      case 'cirrus': {
        // Wispy line
        const points = [[-40, 3], [-15, -1], [10, 2], [38, -2]];
        const n = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < n; i++) {
          const [ox, oy] = points[i];
          puffs.push({
            offsetX: jitter(ox, 8),
            offsetY: jitter(oy, 4),
            size: jitter(28, 6),
            opacity: 0.5 + Math.random() * 0.3,
            stretchX: stretchX(),
            stretchY: stretchY(),
          });
        }
        break;
      }

      case 'altocumulus': {
        // Patchy mackerel sky
        const row1X = [-50, -25, 0, 25, 50];
        const row2X = [-38, -12, 12, 38];
        for (const x of row1X) {
          puffs.push({
            offsetX: jitter(x, 6),
            offsetY: jitter(-5, 3),
            size: jitter(26, 6),
            opacity: 0.65 + Math.random() * 0.2,
            stretchX: stretchX(),
            stretchY: stretchY(),
          });
        }
        for (const x of row2X) {
          puffs.push({
            offsetX: jitter(x, 6),
            offsetY: jitter(6, 3),
            size: jitter(24, 5),
            opacity: 0.6 + Math.random() * 0.2,
            stretchX: stretchX(),
            stretchY: stretchY(),
          });
        }
        break;
      }

      default: {
        puffs.push({ offsetX: 0, offsetY: 0, size: 40, opacity: 0.85 });
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          puffs.push({
            offsetX: Math.cos(a) * 20 + jitter(0, 5),
            offsetY: Math.sin(a) * 14 + jitter(0, 4),
            size: jitter(30, 6),
            opacity: 0.7,
          });
        }
      }
    }

    return puffs;
  }, []);

  // Spawn a new cloud
  const spawnCloud = useCallback((opts?: { position?: { x: number; y: number }; cloudType?: CloudType }) => {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    const cloudType = opts?.cloudType ?? pickCloudType();
    const cfg = CLOUD_TYPE_CONFIG[cloudType];

    const viewWidth = canvasWidth / (dpr * zoom);
    const viewHeight = canvasHeight / (dpr * zoom);
    const viewLeft = -offset.x / zoom;
    const viewTop = -offset.y / zoom;

    const windX = Math.cos(CLOUD_WIND_ANGLE);
    const windY = Math.sin(CLOUD_WIND_ANGLE);

    let spawnX: number;
    let spawnY: number;
    if (opts?.position) {
      spawnX = opts.position.x;
      spawnY = opts.position.y;
    } else if (Math.random() < 0.5) {
      spawnX = viewLeft - CLOUD_WIDTH;
      spawnY = viewTop + Math.random() * viewHeight;
    } else {
      spawnX = viewLeft + Math.random() * viewWidth * 0.5;
      spawnY = viewTop + viewHeight + CLOUD_WIDTH * 0.5;
    }

    const layer = cfg.layerRestriction >= 0 ? cfg.layerRestriction : Math.floor(Math.random() * 3);
    const speed = (CLOUD_SPEED_MIN + Math.random() * (CLOUD_SPEED_MAX - CLOUD_SPEED_MIN)) * cfg.speedMult;
    const scale = cfg.scaleMin + Math.random() * (cfg.scaleMax - cfg.scaleMin);
    const cloudOpacity = cfg.opacityMin + Math.random() * (cfg.opacityMax - cfg.opacityMin);

    const cloud: Cloud = {
      id: cloudIdRef.current++,
      x: spawnX,
      y: spawnY,
      vx: windX * speed * CLOUD_LAYER_SPEEDS[layer],
      vy: windY * speed * CLOUD_LAYER_SPEEDS[layer],
      scale,
      opacity: cloudOpacity * CLOUD_LAYER_OPACITY[layer],
      puffs: generateCloudPuffs(cloudType),
      layer,
      cloudType,
    };

    cloudsRef.current.push(cloud);
    return { x: spawnX, y: spawnY, cloudType };
  }, [canvasWidth, canvasHeight, offset, zoom, cloudIdRef, cloudsRef, generateCloudPuffs, pickCloudType]);

  // Update clouds - spawn new ones and move existing
  const updateClouds = useCallback((delta: number, gameSpeed: number) => {
    // Don't update when game is paused
    if (gameSpeed === 0) return;

    // Skip clouds when very zoomed out
    if (zoom < CLOUD_MIN_ZOOM) {
      cloudsRef.current = [];
      return;
    }

    const maxClouds = isMobile ? CLOUD_MAX_COUNT_MOBILE : CLOUD_MAX_COUNT;
    const spawnInterval = isMobile ? CLOUD_SPAWN_INTERVAL_MOBILE : CLOUD_SPAWN_INTERVAL;

    // Spawn new clouds
    cloudSpawnTimerRef.current += delta;
    if (cloudSpawnTimerRef.current >= spawnInterval && cloudsRef.current.length < maxClouds) {
      cloudSpawnTimerRef.current = 0;
      const pos = spawnCloud();
      // 25% chance to spawn a companion cloud for natural cloud banks
      if (cloudsRef.current.length < maxClouds && Math.random() < 0.25) {
        const windX = Math.cos(CLOUD_WIND_ANGLE);
        const windY = Math.sin(CLOUD_WIND_ANGLE);
        const alongWind = -(55 + Math.random() * 35);
        const perp = (Math.random() - 0.5) * 44;
        const companionX = pos.x + windX * alongWind + (-windY) * perp;
        const companionY = pos.y + windY * alongWind + windX * perp;
        spawnCloud({ position: { x: companionX, y: companionY }, cloudType: pos.cloudType });
        cloudSpawnTimerRef.current = -spawnInterval * 0.4;
      }
    }

    // Update existing clouds
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const viewWidth = canvasWidth / (dpr * zoom);
    const viewHeight = canvasHeight / (dpr * zoom);
    const viewLeft = -offset.x / zoom;
    const viewTop = -offset.y / zoom;
    const viewRight = viewLeft + viewWidth;

    cloudsRef.current = cloudsRef.current.filter(cloud => {
      cloud.x += cloud.vx * delta;
      cloud.y += cloud.vy * delta;

      // Remove if too far past viewport
      if (cloud.x > viewRight + CLOUD_DESPAWN_MARGIN ||
          cloud.y < viewTop - CLOUD_DESPAWN_MARGIN) {
        return false;
      }

      return true;
    });
  }, [canvasWidth, canvasHeight, offset, zoom, cloudsRef, cloudSpawnTimerRef, isMobile, spawnCloud]);

  // Get gradient color stops for a cloud type
  const getCloudGradientStops = (cloudType: CloudType, puffOpacity: number): [number, string][] => {
    switch (cloudType) {
      case 'cumulus':
        return [
          [0, `rgba(255, 255, 255, ${puffOpacity})`],
          [0.4, `rgba(250, 250, 252, ${puffOpacity * 0.9})`],
          [0.7, `rgba(245, 245, 250, ${puffOpacity * 0.5})`],
          [1, `rgba(240, 240, 248, 0)`],
        ];
      case 'cirrus':
        return [
          [0, `rgba(255, 255, 255, ${puffOpacity * 0.9})`],
          [0.3, `rgba(248, 250, 255, ${puffOpacity * 0.6})`],
          [0.6, `rgba(240, 245, 252, ${puffOpacity * 0.25})`],
          [1, `rgba(235, 240, 250, 0)`],
        ];
      case 'altocumulus':
        return [
          [0, `rgba(238, 240, 245, ${puffOpacity})`],
          [0.4, `rgba(225, 228, 235, ${puffOpacity * 0.85})`],
          [0.7, `rgba(210, 215, 225, ${puffOpacity * 0.45})`],
          [1, `rgba(200, 206, 218, 0)`],
        ];
      default:
        return [[0, `rgba(255,255,255,${puffOpacity})`], [1, `rgba(240,240,245,0)`]];
    }
  };

  // Draw a single puff
  const drawPuff = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    stretchX: number,
    stretchY: number,
    gradient: CanvasGradient
  ) => {
    ctx.fillStyle = gradient;
    ctx.beginPath();
    const rx = radius * stretchX;
    const ry = radius * stretchY;
    if (Math.abs(rx - ry) < 0.5) {
      ctx.arc(x, y, radius, 0, Math.PI * 2);
    } else {
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    }
    ctx.fill();
  };

  // Draw clouds
  const drawClouds = useCallback((ctx: CanvasRenderingContext2D) => {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    // Skip if no clouds or zoomed out too far
    if (cloudsRef.current.length === 0 || zoom < CLOUD_MIN_ZOOM) return;

    // Zoom-based fade
    let zoomOpacity = 1;
    if (zoom > CLOUD_FADE_ZOOM) {
      return;
    } else if (zoom > CLOUD_MAX_ZOOM) {
      zoomOpacity = 1 - (zoom - CLOUD_MAX_ZOOM) / (CLOUD_FADE_ZOOM - CLOUD_MAX_ZOOM);
    }

    // Night opacity modifier
    const isNight = hour >= 20 || hour < 6;
    const isDusk = hour >= 18 && hour < 20;
    const isDawn = hour >= 6 && hour < 8;
    let nightMult = 1.0;
    if (isNight) nightMult = CLOUD_NIGHT_OPACITY_MULT;
    else if (isDusk) nightMult = 1.0 - (1.0 - CLOUD_NIGHT_OPACITY_MULT) * ((hour - 18) / 2);
    else if (isDawn) nightMult = CLOUD_NIGHT_OPACITY_MULT + (1.0 - CLOUD_NIGHT_OPACITY_MULT) * ((hour - 6) / 2);

    ctx.save();
    ctx.scale(dpr * zoom, dpr * zoom);
    ctx.translate(offset.x / zoom, offset.y / zoom);

    const viewWidth = canvasWidth / (dpr * zoom);
    const viewHeight = canvasHeight / (dpr * zoom);
    const viewLeft = -offset.x / zoom - CLOUD_WIDTH;
    const viewTop = -offset.y / zoom - CLOUD_WIDTH;
    const viewRight = viewWidth - offset.x / zoom + CLOUD_WIDTH;
    const viewBottom = viewHeight - offset.y / zoom + CLOUD_WIDTH;
    const viewportArea = viewWidth * viewHeight;

    const sortedClouds = [...cloudsRef.current].sort((a, b) => a.layer - b.layer);

    // Estimate cloud coverage
    let totalCloudArea = 0;
    for (const cloud of sortedClouds) {
      if (cloud.x < viewLeft || cloud.x > viewRight || cloud.y < viewTop || cloud.y > viewBottom) continue;
      let maxExtent = 0;
      for (const puff of cloud.puffs) {
        const rx = puff.size * cloud.scale * (puff.stretchX ?? 1);
        const ry = puff.size * cloud.scale * (puff.stretchY ?? 1);
        const extent = Math.sqrt(puff.offsetX * puff.offsetX + puff.offsetY * puff.offsetY) + Math.max(rx, ry);
        if (extent > maxExtent) maxExtent = extent;
      }
      totalCloudArea += Math.PI * maxExtent * maxExtent;
    }
    const coverage = viewportArea > 0 ? totalCloudArea / viewportArea : 0;
    let coverageOpacity = 1;
    if (coverage > CLOUD_MAX_COVERAGE) {
      const fadeRange = CLOUD_COVERAGE_FADE_END - CLOUD_MAX_COVERAGE;
      coverageOpacity = Math.max(0, 1 - (coverage - CLOUD_MAX_COVERAGE) / fadeRange);
    }

    for (const cloud of sortedClouds) {
      if (cloud.x < viewLeft || cloud.x > viewRight || cloud.y < viewTop || cloud.y > viewBottom) continue;

      const finalOpacity = cloud.opacity * nightMult * zoomOpacity * coverageOpacity;

      // Draw each puff
      for (const puff of cloud.puffs) {
        const puffX = cloud.x + puff.offsetX * cloud.scale;
        const puffY = cloud.y + puff.offsetY * cloud.scale;
        const puffSize = puff.size * cloud.scale;
        const puffOpacity = finalOpacity * puff.opacity;
        const stretchX = puff.stretchX ?? 1;
        const stretchY = puff.stretchY ?? 1;
        const maxRadius = Math.max(puffSize * stretchX, puffSize * stretchY);

        if (puffOpacity <= 0.01) continue;

        const stops = getCloudGradientStops(cloud.cloudType, puffOpacity);
        const gradient = ctx.createRadialGradient(puffX, puffY, 0, puffX, puffY, maxRadius);
        for (const [pos, color] of stops) gradient.addColorStop(pos, color);

        drawPuff(ctx, puffX, puffY, puffSize, stretchX, stretchY, gradient);
      }

      // Shadow/depth (skip for cirrus)
      const shadowMult = cloud.cloudType === 'cirrus' ? 0 : 0.15;
      if (shadowMult > 0) {
        const shadowY = cloud.y + 8 * cloud.scale;
        for (const puff of cloud.puffs) {
          const puffX = cloud.x + puff.offsetX * cloud.scale;
          const puffY = shadowY + puff.offsetY * cloud.scale;
          const puffSize = puff.size * cloud.scale * 0.9;
          const stretchX = puff.stretchX ?? 1;
          const stretchY = puff.stretchY ?? 1;
          const shadowOpacity = finalOpacity * puff.opacity * shadowMult;
          if (shadowOpacity <= 0.01) continue;

          const grad = ctx.createRadialGradient(puffX, puffY, 0, puffX, puffY, puffSize * Math.max(stretchX, stretchY));
          grad.addColorStop(0, `rgba(160, 168, 185, ${shadowOpacity})`);
          grad.addColorStop(0.5, `rgba(175, 182, 198, ${shadowOpacity * 0.5})`);
          grad.addColorStop(1, `rgba(190, 195, 208, 0)`);
          drawPuff(ctx, puffX, puffY, puffSize, stretchX, stretchY, grad);
        }
      }
    }

    ctx.restore();
  }, [cloudsRef, canvasWidth, canvasHeight, offset, zoom, hour]);

  return {
    updateClouds,
    drawClouds,
  };
}
