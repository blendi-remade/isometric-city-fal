/**
 * Incident Data - Crime types, fire types, and their descriptions
 * Comprehensive incident system for city simulation
 */

// ============================================================================
// CRIME TYPES
// ============================================================================

export type CrimeType =
  // Violent Crimes
  | 'armed_robbery'
  | 'mugging'
  | 'assault'
  | 'aggravated_assault'
  | 'carjacking'
  | 'kidnapping'
  | 'hostage_situation'
  | 'gang_violence'
  | 'shooting'
  | 'stabbing'
  
  // Property Crimes
  | 'burglary'
  | 'home_invasion'
  | 'commercial_burglary'
  | 'car_theft'
  | 'bike_theft'
  | 'package_theft'
  | 'shoplifting'
  | 'smash_and_grab'
  | 'warehouse_theft'
  | 'construction_theft'
  
  // Financial Crimes
  | 'fraud'
  | 'identity_theft'
  | 'credit_card_fraud'
  | 'insurance_fraud'
  | 'embezzlement'
  | 'counterfeiting'
  
  // Public Order
  | 'disturbance'
  | 'public_intoxication'
  | 'disorderly_conduct'
  | 'noise_complaint'
  | 'loitering'
  | 'trespassing'
  | 'public_urination'
  | 'street_racing'
  | 'illegal_dumping'
  
  // Drug Related
  | 'drug_dealing'
  | 'drug_possession'
  | 'illegal_dispensary'
  | 'public_drug_use'
  
  // Traffic & Vehicle
  | 'hit_and_run'
  | 'dui'
  | 'reckless_driving'
  | 'traffic_violation'
  | 'parking_violation'
  | 'illegal_street_vendor'
  
  // Vandalism & Destruction
  | 'vandalism'
  | 'graffiti'
  | 'arson_attempt'
  | 'property_damage'
  | 'broken_windows'
  
  // Other
  | 'suspicious_activity'
  | 'prowler'
  | 'stalking'
  | 'domestic_disturbance'
  | 'animal_cruelty'
  | 'illegal_gambling'
  | 'prostitution'
  | 'solicitation';

export interface CrimeData {
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: number; // seconds before incident expires if unresponded
  weight: number; // relative spawn frequency (higher = more common)
}

export const CRIME_DATA: Record<CrimeType, CrimeData> = {
  // Violent Crimes (critical/high severity, longer duration)
  armed_robbery: {
    name: 'Armed Robbery',
    description: 'Armed suspect threatening civilians. Weapon drawn.',
    severity: 'critical',
    duration: 45,
    weight: 3,
  },
  mugging: {
    name: 'Mugging',
    description: 'Victim being robbed on the street. Suspect fleeing.',
    severity: 'high',
    duration: 30,
    weight: 5,
  },
  assault: {
    name: 'Assault',
    description: 'Physical altercation in progress. Multiple individuals.',
    severity: 'high',
    duration: 25,
    weight: 6,
  },
  aggravated_assault: {
    name: 'Aggravated Assault',
    description: 'Violent attack with potential weapon. Victim injured.',
    severity: 'critical',
    duration: 40,
    weight: 2,
  },
  carjacking: {
    name: 'Carjacking',
    description: 'Armed suspect stealing vehicle from driver.',
    severity: 'critical',
    duration: 35,
    weight: 2,
  },
  kidnapping: {
    name: 'Kidnapping',
    description: 'Individual being forced into vehicle. Urgent response.',
    severity: 'critical',
    duration: 50,
    weight: 1,
  },
  hostage_situation: {
    name: 'Hostage Situation',
    description: 'Armed suspect holding hostages. Negotiator needed.',
    severity: 'critical',
    duration: 60,
    weight: 0.5,
  },
  gang_violence: {
    name: 'Gang Violence',
    description: 'Rival groups in confrontation. Multiple suspects.',
    severity: 'critical',
    duration: 40,
    weight: 2,
  },
  shooting: {
    name: 'Shots Fired',
    description: 'Gunshots reported. Possible casualties.',
    severity: 'critical',
    duration: 45,
    weight: 1,
  },
  stabbing: {
    name: 'Stabbing',
    description: 'Knife attack reported. Medical response needed.',
    severity: 'critical',
    duration: 40,
    weight: 1.5,
  },

  // Property Crimes (medium/high severity)
  burglary: {
    name: 'Burglary',
    description: 'Break-in detected. Suspect inside building.',
    severity: 'high',
    duration: 30,
    weight: 8,
  },
  home_invasion: {
    name: 'Home Invasion',
    description: 'Intruder in occupied residence. Residents in danger.',
    severity: 'critical',
    duration: 35,
    weight: 3,
  },
  commercial_burglary: {
    name: 'Commercial Burglary',
    description: 'Business break-in in progress. Alarm triggered.',
    severity: 'high',
    duration: 28,
    weight: 6,
  },
  car_theft: {
    name: 'Car Theft',
    description: 'Vehicle being stolen. Suspect breaking into car.',
    severity: 'medium',
    duration: 22,
    weight: 10,
  },
  bike_theft: {
    name: 'Bike Theft',
    description: 'Bicycle being stolen. Suspect cutting lock.',
    severity: 'low',
    duration: 15,
    weight: 12,
  },
  package_theft: {
    name: 'Package Theft',
    description: 'Porch pirate stealing delivered packages.',
    severity: 'low',
    duration: 12,
    weight: 15,
  },
  shoplifting: {
    name: 'Shoplifting',
    description: 'Theft in progress at retail store. Suspect fleeing.',
    severity: 'low',
    duration: 15,
    weight: 20,
  },
  smash_and_grab: {
    name: 'Smash & Grab',
    description: 'Window smashed. Multiple suspects grabbing merchandise.',
    severity: 'high',
    duration: 25,
    weight: 4,
  },
  warehouse_theft: {
    name: 'Warehouse Theft',
    description: 'Large-scale theft at industrial facility.',
    severity: 'high',
    duration: 35,
    weight: 3,
  },
  construction_theft: {
    name: 'Construction Theft',
    description: 'Equipment or materials being stolen from site.',
    severity: 'medium',
    duration: 25,
    weight: 5,
  },

  // Financial Crimes
  fraud: {
    name: 'Fraud',
    description: 'Suspected fraud scheme. Victim reporting financial loss.',
    severity: 'medium',
    duration: 30,
    weight: 4,
  },
  identity_theft: {
    name: 'Identity Theft',
    description: 'Personal information being used fraudulently.',
    severity: 'medium',
    duration: 30,
    weight: 3,
  },
  credit_card_fraud: {
    name: 'Credit Card Fraud',
    description: 'Unauthorized card transactions in progress.',
    severity: 'medium',
    duration: 25,
    weight: 5,
  },
  insurance_fraud: {
    name: 'Insurance Fraud',
    description: 'Staged accident or false claim detected.',
    severity: 'medium',
    duration: 35,
    weight: 2,
  },
  embezzlement: {
    name: 'Embezzlement',
    description: 'Employee caught stealing company funds.',
    severity: 'high',
    duration: 40,
    weight: 1,
  },
  counterfeiting: {
    name: 'Counterfeiting',
    description: 'Fake currency or goods being distributed.',
    severity: 'high',
    duration: 35,
    weight: 2,
  },

  // Public Order (low/medium severity, short duration)
  disturbance: {
    name: 'Public Disturbance',
    description: 'Loud argument escalating. Crowd gathering.',
    severity: 'low',
    duration: 18,
    weight: 25,
  },
  public_intoxication: {
    name: 'Public Intoxication',
    description: 'Heavily intoxicated individual causing disruption.',
    severity: 'low',
    duration: 15,
    weight: 18,
  },
  disorderly_conduct: {
    name: 'Disorderly Conduct',
    description: 'Individual refusing to comply. Causing scene.',
    severity: 'low',
    duration: 18,
    weight: 15,
  },
  noise_complaint: {
    name: 'Noise Complaint',
    description: 'Excessive noise disturbing neighborhood.',
    severity: 'low',
    duration: 12,
    weight: 20,
  },
  loitering: {
    name: 'Loitering',
    description: 'Suspicious individuals hanging around property.',
    severity: 'low',
    duration: 10,
    weight: 12,
  },
  trespassing: {
    name: 'Trespassing',
    description: 'Unauthorized person on private property.',
    severity: 'low',
    duration: 15,
    weight: 14,
  },
  public_urination: {
    name: 'Public Urination',
    description: 'Indecent act in public area.',
    severity: 'low',
    duration: 8,
    weight: 10,
  },
  street_racing: {
    name: 'Street Racing',
    description: 'Vehicles racing at dangerous speeds.',
    severity: 'high',
    duration: 20,
    weight: 4,
  },
  illegal_dumping: {
    name: 'Illegal Dumping',
    description: 'Unauthorized waste being dumped.',
    severity: 'low',
    duration: 20,
    weight: 6,
  },

  // Drug Related
  drug_dealing: {
    name: 'Drug Deal',
    description: 'Suspected narcotics transaction in progress.',
    severity: 'high',
    duration: 20,
    weight: 8,
  },
  drug_possession: {
    name: 'Drug Possession',
    description: 'Individual with suspected controlled substances.',
    severity: 'medium',
    duration: 18,
    weight: 10,
  },
  illegal_dispensary: {
    name: 'Illegal Dispensary',
    description: 'Unlicensed drug operation discovered.',
    severity: 'high',
    duration: 35,
    weight: 2,
  },
  public_drug_use: {
    name: 'Public Drug Use',
    description: 'Individual using substances openly.',
    severity: 'low',
    duration: 15,
    weight: 12,
  },

  // Traffic & Vehicle
  hit_and_run: {
    name: 'Hit & Run',
    description: 'Driver fled after collision. Possible injuries.',
    severity: 'high',
    duration: 25,
    weight: 6,
  },
  dui: {
    name: 'DUI',
    description: 'Suspected impaired driver. Erratic behavior.',
    severity: 'high',
    duration: 22,
    weight: 7,
  },
  reckless_driving: {
    name: 'Reckless Driving',
    description: 'Vehicle driving dangerously. Endangering others.',
    severity: 'medium',
    duration: 18,
    weight: 10,
  },
  traffic_violation: {
    name: 'Traffic Violation',
    description: 'Moving violation observed. Driver being cited.',
    severity: 'low',
    duration: 12,
    weight: 25,
  },
  parking_violation: {
    name: 'Parking Violation',
    description: 'Illegally parked vehicle blocking access.',
    severity: 'low',
    duration: 10,
    weight: 20,
  },
  illegal_street_vendor: {
    name: 'Illegal Vendor',
    description: 'Unlicensed vendor operating without permit.',
    severity: 'low',
    duration: 15,
    weight: 8,
  },

  // Vandalism & Destruction
  vandalism: {
    name: 'Vandalism',
    description: 'Property being damaged or destroyed.',
    severity: 'medium',
    duration: 18,
    weight: 12,
  },
  graffiti: {
    name: 'Graffiti',
    description: 'Individual spray painting building or surface.',
    severity: 'low',
    duration: 15,
    weight: 15,
  },
  arson_attempt: {
    name: 'Attempted Arson',
    description: 'Individual attempting to start fire. Urgent.',
    severity: 'critical',
    duration: 30,
    weight: 2,
  },
  property_damage: {
    name: 'Property Damage',
    description: 'Intentional destruction of property in progress.',
    severity: 'medium',
    duration: 20,
    weight: 8,
  },
  broken_windows: {
    name: 'Broken Windows',
    description: 'Windows being smashed. Possible burglary.',
    severity: 'medium',
    duration: 18,
    weight: 10,
  },

  // Other
  suspicious_activity: {
    name: 'Suspicious Activity',
    description: 'Unknown individual acting strangely near building.',
    severity: 'low',
    duration: 15,
    weight: 18,
  },
  prowler: {
    name: 'Prowler',
    description: 'Individual lurking around property at night.',
    severity: 'medium',
    duration: 18,
    weight: 8,
  },
  stalking: {
    name: 'Stalking',
    description: 'Person being followed by unknown individual.',
    severity: 'high',
    duration: 25,
    weight: 3,
  },
  domestic_disturbance: {
    name: 'Domestic Disturbance',
    description: 'Heated argument at residence. Possible violence.',
    severity: 'high',
    duration: 25,
    weight: 10,
  },
  animal_cruelty: {
    name: 'Animal Cruelty',
    description: 'Animal being mistreated or endangered.',
    severity: 'medium',
    duration: 20,
    weight: 3,
  },
  illegal_gambling: {
    name: 'Illegal Gambling',
    description: 'Unlicensed gambling operation discovered.',
    severity: 'medium',
    duration: 30,
    weight: 2,
  },
  prostitution: {
    name: 'Prostitution',
    description: 'Illegal activity reported in area.',
    severity: 'medium',
    duration: 20,
    weight: 4,
  },
  solicitation: {
    name: 'Solicitation',
    description: 'Aggressive soliciting of passersby.',
    severity: 'low',
    duration: 12,
    weight: 8,
  },
};

// Get all crime types as an array
export const CRIME_TYPES = Object.keys(CRIME_DATA) as CrimeType[];

// Get a weighted random crime type
export function getRandomCrimeType(): CrimeType {
  const totalWeight = CRIME_TYPES.reduce((sum, type) => sum + CRIME_DATA[type].weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const type of CRIME_TYPES) {
    random -= CRIME_DATA[type].weight;
    if (random <= 0) {
      return type;
    }
  }
  
  return CRIME_TYPES[0];
}

// ============================================================================
// FIRE TYPES
// ============================================================================

export type FireType =
  | 'structural'
  | 'electrical'
  | 'kitchen'
  | 'industrial'
  | 'chemical'
  | 'vehicle'
  | 'brush'
  | 'explosion'
  | 'gas_leak'
  | 'arson';

export interface FireData {
  name: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'catastrophic';
}

export const FIRE_DATA: Record<FireType, FireData> = {
  structural: {
    name: 'Structure Fire',
    description: 'Flames spreading through building. Multiple floors at risk. Evacuate immediately.',
    severity: 'major',
  },
  electrical: {
    name: 'Electrical Fire',
    description: 'Electrical system overload. Smoke billowing from outlets. Power lines sparking.',
    severity: 'moderate',
  },
  kitchen: {
    name: 'Kitchen Fire',
    description: 'Cooking fire out of control. Grease flames spreading rapidly. Ventilation compromised.',
    severity: 'moderate',
  },
  industrial: {
    name: 'Industrial Fire',
    description: 'Factory blaze with heavy smoke. Hazardous materials may be involved. Wide perimeter needed.',
    severity: 'catastrophic',
  },
  chemical: {
    name: 'Chemical Fire',
    description: 'Toxic chemical combustion. Dangerous fumes spreading. Specialized response required.',
    severity: 'catastrophic',
  },
  vehicle: {
    name: 'Vehicle Fire',
    description: 'Car engulfed in flames. Risk of fuel tank explosion. Keep clear.',
    severity: 'minor',
  },
  brush: {
    name: 'Brush Fire',
    description: 'Vegetation fire spreading with wind. Nearby structures threatened.',
    severity: 'moderate',
  },
  explosion: {
    name: 'Explosion',
    description: 'Building rocked by blast. Structural integrity compromised. Possible casualties.',
    severity: 'catastrophic',
  },
  gas_leak: {
    name: 'Gas Fire',
    description: 'Natural gas ignited. Continuous flame from leak. Shut-off valve needed.',
    severity: 'major',
  },
  arson: {
    name: 'Arson Fire',
    description: 'Deliberately set fire detected. Accelerant used. Fire spreading rapidly.',
    severity: 'major',
  },
};

export const FIRE_TYPES = Object.keys(FIRE_DATA) as FireType[];

// Get a random fire type (weighted toward structural/electrical for realism)
export function getRandomFireType(): FireType {
  const weights: Record<FireType, number> = {
    structural: 25,
    electrical: 20,
    kitchen: 15,
    industrial: 8,
    chemical: 3,
    vehicle: 10,
    brush: 5,
    explosion: 2,
    gas_leak: 7,
    arson: 5,
  };
  
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (const [type, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      return type as FireType;
    }
  }
  
  return 'structural';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getCrimeName(crimeType: CrimeType): string {
  return CRIME_DATA[crimeType]?.name || 'Unknown Incident';
}

export function getCrimeDescription(crimeType: CrimeType): string {
  return CRIME_DATA[crimeType]?.description || 'Incident reported.';
}

export function getCrimeDuration(crimeType: CrimeType): number {
  return CRIME_DATA[crimeType]?.duration || 20;
}

export function getFireName(fireType: FireType): string {
  return FIRE_DATA[fireType]?.name || 'Fire';
}

export function getFireDescription(fireType: FireType): string {
  return FIRE_DATA[fireType]?.description || 'Building on fire. Fire trucks responding.';
}

// Get fire description based on tile coordinates (deterministic)
export function getFireDescriptionForTile(x: number, y: number): string {
  // Use coordinates to deterministically pick a fire type
  const index = Math.abs((x * 31 + y * 17) % FIRE_TYPES.length);
  return FIRE_DATA[FIRE_TYPES[index]].description;
}

// Get fire name based on tile coordinates (deterministic)
export function getFireNameForTile(x: number, y: number): string {
  const index = Math.abs((x * 31 + y * 17) % FIRE_TYPES.length);
  return FIRE_DATA[FIRE_TYPES[index]].name;
}
