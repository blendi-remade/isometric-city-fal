// City management system for multi-city maps
// Provides efficient caching and lookup for city-related operations

import { City, CityEconomy, GameState, Tile, Building } from '@/types/game';

// Cache for city lookups by tile position
// Uses a Map with numeric keys (y * gridSize + x) for O(1) lookup
let cityLookupCache: Map<number, string | null> = new Map();
let cityLookupGridSize = 0;
let cityLookupVersion = 0;

// Cache for city economy calculations
const cityEconomyCache: Map<string, CityEconomy> = new Map();
const ECONOMY_CACHE_TTL = 1000; // Cache economy data for 1 second

/**
 * Generate a unique ID for a city
 */
export function generateCityId(): string {
  return `city-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new city with default values
 */
export function createCity(
  name: string,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  color?: string
): City {
  const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  return {
    id: generateCityId(),
    name,
    bounds: { minX, minY, maxX, maxY },
    economy: {
      population: 0,
      jobs: 0,
      income: 0,
      expenses: 0,
      happiness: 0,
      lastCalculated: 0,
    },
    color: color || colors[Math.floor(Math.random() * colors.length)],
  };
}

/**
 * Invalidate the city lookup cache (call when cities are modified)
 */
export function invalidateCityCache(): void {
  cityLookupVersion++;
  cityLookupCache.clear();
  cityEconomyCache.clear();
}

/**
 * Build the city lookup cache for O(1) tile->city lookups
 */
function buildCityLookupCache(cities: City[], gridSize: number): void {
  cityLookupCache.clear();
  cityLookupGridSize = gridSize;
  
  // For each city, mark all tiles within its bounds
  for (const city of cities) {
    for (let y = city.bounds.minY; y <= city.bounds.maxY; y++) {
      for (let x = city.bounds.minX; x <= city.bounds.maxX; x++) {
        const key = y * gridSize + x;
        cityLookupCache.set(key, city.id);
      }
    }
  }
}

/**
 * Get the city ID for a given tile position (O(1) lookup with cache)
 */
export function getCityAtTile(
  x: number,
  y: number,
  cities: City[],
  gridSize: number
): string | null {
  // Rebuild cache if grid size changed or cache is empty
  if (gridSize !== cityLookupGridSize || cityLookupCache.size === 0) {
    buildCityLookupCache(cities, gridSize);
  }
  
  const key = y * gridSize + x;
  return cityLookupCache.get(key) ?? null;
}

/**
 * Get a city by ID
 */
export function getCityById(cities: City[], cityId: string): City | undefined {
  return cities.find(c => c.id === cityId);
}

/**
 * Assign a building to a city based on its position
 */
export function assignBuildingToCity(
  building: Building,
  x: number,
  y: number,
  cities: City[],
  gridSize: number
): void {
  const cityId = getCityAtTile(x, y, cities, gridSize);
  building.cityId = cityId ?? undefined;
}

/**
 * Calculate economy stats for a single city (with caching)
 */
export function calculateCityEconomy(
  city: City,
  grid: Tile[][],
  gridSize: number,
  forceRecalculate = false
): CityEconomy {
  const now = Date.now();
  const cached = cityEconomyCache.get(city.id);
  
  // Return cached value if still valid
  if (!forceRecalculate && cached && (now - cached.lastCalculated) < ECONOMY_CACHE_TTL) {
    return cached;
  }
  
  let population = 0;
  let jobs = 0;
  let income = 0;
  let expenses = 0;
  let happinessSum = 0;
  let buildingCount = 0;
  
  // Only iterate over tiles within city bounds
  for (let y = city.bounds.minY; y <= city.bounds.maxY && y < gridSize; y++) {
    for (let x = city.bounds.minX; x <= city.bounds.maxX && x < gridSize; x++) {
      const tile = grid[y]?.[x];
      if (!tile) continue;
      
      const building = tile.building;
      if (building.type === 'grass' || building.type === 'water' || building.type === 'empty') {
        continue;
      }
      
      // Only count buildings belonging to this city
      if (building.cityId !== city.id) continue;
      
      population += building.population;
      jobs += building.jobs;
      
      // Simple income/expense calculation
      if (building.population > 0) {
        income += building.population * 0.5; // Residential tax income
      }
      if (building.jobs > 0) {
        income += building.jobs * 0.3; // Commercial/industrial tax
      }
      
      // Expenses from service buildings
      const serviceBuildings = ['police_station', 'fire_station', 'hospital', 'school', 'university', 'power_plant', 'water_tower'];
      if (serviceBuildings.includes(building.type)) {
        expenses += building.jobs * 0.8;
      }
      
      // Happiness from land value (simplified)
      if (tile.landValue > 0) {
        happinessSum += Math.min(100, tile.landValue);
        buildingCount++;
      }
    }
  }
  
  const economy: CityEconomy = {
    population,
    jobs,
    income: Math.floor(income),
    expenses: Math.floor(expenses),
    happiness: buildingCount > 0 ? Math.floor(happinessSum / buildingCount) : 50,
    lastCalculated: now,
  };
  
  // Cache the result
  cityEconomyCache.set(city.id, economy);
  city.economy = economy;
  
  return economy;
}

/**
 * Calculate economy for all cities in the game
 */
export function calculateAllCityEconomies(state: GameState): void {
  for (const city of state.cities) {
    calculateCityEconomy(city, state.grid, state.gridSize);
  }
}

/**
 * Get all buildings belonging to a city
 */
export function getCityBuildings(
  cityId: string,
  grid: Tile[][],
  gridSize: number,
  city?: City
): { tile: Tile; x: number; y: number }[] {
  const buildings: { tile: Tile; x: number; y: number }[] = [];
  
  // If we have city bounds, use them for faster iteration
  if (city) {
    for (let y = city.bounds.minY; y <= city.bounds.maxY && y < gridSize; y++) {
      for (let x = city.bounds.minX; x <= city.bounds.maxX && x < gridSize; x++) {
        const tile = grid[y]?.[x];
        if (tile && tile.building.cityId === cityId) {
          buildings.push({ tile, x, y });
        }
      }
    }
  } else {
    // Fallback: scan entire grid
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const tile = grid[y]?.[x];
        if (tile && tile.building.cityId === cityId) {
          buildings.push({ tile, x, y });
        }
      }
    }
  }
  
  return buildings;
}

/**
 * Get the border tiles for a city (for rendering city boundaries)
 */
export function getCityBorderTiles(city: City, gridSize: number): { x: number; y: number; edge: 'north' | 'south' | 'east' | 'west' }[] {
  const borders: { x: number; y: number; edge: 'north' | 'south' | 'east' | 'west' }[] = [];
  
  const { minX, minY, maxX, maxY } = city.bounds;
  
  // North edge
  for (let x = minX; x <= maxX && x < gridSize; x++) {
    if (minY >= 0 && minY < gridSize) {
      borders.push({ x, y: minY, edge: 'north' });
    }
  }
  
  // South edge
  for (let x = minX; x <= maxX && x < gridSize; x++) {
    if (maxY >= 0 && maxY < gridSize) {
      borders.push({ x, y: maxY, edge: 'south' });
    }
  }
  
  // East edge
  for (let y = minY; y <= maxY && y < gridSize; y++) {
    if (maxX >= 0 && maxX < gridSize) {
      borders.push({ x: maxX, y, edge: 'east' });
    }
  }
  
  // West edge
  for (let y = minY; y <= maxY && y < gridSize; y++) {
    if (minX >= 0 && minX < gridSize) {
      borders.push({ x: minX, y, edge: 'west' });
    }
  }
  
  return borders;
}

/**
 * Create a default city covering the entire map
 */
export function createDefaultCity(cityName: string, gridSize: number): City {
  return createCity(
    cityName,
    0,
    0,
    gridSize - 1,
    gridSize - 1,
    '#3b82f6' // Default blue
  );
}

/**
 * Split a city into multiple cities based on a dividing line
 */
export function splitCity(
  originalCity: City,
  direction: 'horizontal' | 'vertical',
  position: number,
  newCityName: string
): { city1: City; city2: City } {
  const { minX, minY, maxX, maxY } = originalCity.bounds;
  
  if (direction === 'horizontal') {
    // Split horizontally (north/south)
    const city1: City = {
      ...originalCity,
      bounds: { minX, minY, maxX, maxY: position - 1 },
    };
    const city2 = createCity(
      newCityName,
      minX,
      position,
      maxX,
      maxY
    );
    return { city1, city2 };
  } else {
    // Split vertically (east/west)
    const city1: City = {
      ...originalCity,
      bounds: { minX, minY, maxX: position - 1, maxY },
    };
    const city2 = createCity(
      newCityName,
      position,
      minY,
      maxX,
      maxY
    );
    return { city1, city2 };
  }
}
