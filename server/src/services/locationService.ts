/**
 * Location Parser and Eligibility Engine for GigSync Platform.
 * Normalizes location queries, maps aliases (e.g., Bengaluru <-> Bangalore),
 * verifies country/city containment, and determines candidate eligibility for remote/hybrid roles.
 */

export interface ParsedLocationCriteria {
  raw: string;
  isRemoteOnly: boolean;
  isAnywhere: boolean;
  isUnrecognized: boolean;
  isSpecificCity: boolean;
  countryCode?: 'IN' | 'US' | 'GB' | 'CA' | 'AU' | 'DE' | 'FR' | 'NL' | 'IE' | 'IS' | 'GLOBAL';
  countryName?: string;
  city?: string;
  state?: string;
  tokens: string[];
}

interface CityMapping {
  city: string;
  countryCode: 'IN' | 'US' | 'GB' | 'CA' | 'AU' | 'DE' | 'FR' | 'NL' | 'IE' | 'IS';
  countryName: string;
  state?: string;
  aliases: string[];
  museQuery?: string;
}

// Canonical city directory with verified provider query mappings
export const CITY_MAP: Record<string, CityMapping> = {
  // India
  'bengaluru': { city: 'Bangalore', aliases: ['bengaluru', 'bangalore'], countryCode: 'IN', countryName: 'India', state: 'Karnataka', museQuery: 'Bangalore, India' },
  'bangalore': { city: 'Bangalore', aliases: ['bengaluru', 'bangalore'], countryCode: 'IN', countryName: 'India', state: 'Karnataka', museQuery: 'Bangalore, India' },
  'mumbai': { city: 'Mumbai', aliases: ['mumbai', 'bombay'], countryCode: 'IN', countryName: 'India', state: 'Maharashtra', museQuery: 'Mumbai, India' },
  'delhi': { city: 'Delhi', aliases: ['delhi', 'new delhi'], countryCode: 'IN', countryName: 'India', museQuery: 'Gurgaon, India' },
  'new delhi': { city: 'New Delhi', aliases: ['new delhi', 'delhi'], countryCode: 'IN', countryName: 'India', museQuery: 'Gurgaon, India' },
  'gurgaon': { city: 'Gurgaon', aliases: ['gurgaon', 'gurugram'], countryCode: 'IN', countryName: 'India', state: 'Haryana', museQuery: 'Gurgaon, India' },
  'gurugram': { city: 'Gurgaon', aliases: ['gurugram', 'gurgaon'], countryCode: 'IN', countryName: 'India', state: 'Haryana', museQuery: 'Gurgaon, India' },
  'noida': { city: 'Noida', aliases: ['noida'], countryCode: 'IN', countryName: 'India', state: 'Uttar Pradesh', museQuery: 'Gurgaon, India' },
  'hyderabad': { city: 'Hyderabad', aliases: ['hyderabad'], countryCode: 'IN', countryName: 'India', state: 'Telangana', museQuery: 'Hyderabad, India' },
  'chennai': { city: 'Chennai', aliases: ['chennai', 'madras'], countryCode: 'IN', countryName: 'India', state: 'Tamil Nadu', museQuery: 'Chennai, India' },
  'pune': { city: 'Pune', aliases: ['pune'], countryCode: 'IN', countryName: 'India', state: 'Maharashtra', museQuery: 'Mumbai, India' },
  'kolkata': { city: 'Kolkata', aliases: ['kolkata', 'calcutta'], countryCode: 'IN', countryName: 'India', state: 'West Bengal' },
  'ahmedabad': { city: 'Ahmedabad', aliases: ['ahmedabad'], countryCode: 'IN', countryName: 'India', state: 'Gujarat' },
  'kochi': { city: 'Kochi', aliases: ['kochi', 'cochin'], countryCode: 'IN', countryName: 'India', state: 'Kerala' },

  // USA
  'san jose': { city: 'San Jose', aliases: ['san jose'], countryCode: 'US', countryName: 'United States', state: 'CA', museQuery: 'San Jose, CA' },
  'san francisco': { city: 'San Francisco', aliases: ['san francisco', 'sf'], countryCode: 'US', countryName: 'United States', state: 'CA', museQuery: 'San Francisco, CA' },
  'sunnyvale': { city: 'Sunnyvale', aliases: ['sunnyvale'], countryCode: 'US', countryName: 'United States', state: 'CA', museQuery: 'Sunnyvale, CA' },
  'palo alto': { city: 'Palo Alto', aliases: ['palo alto'], countryCode: 'US', countryName: 'United States', state: 'CA', museQuery: 'Palo Alto, CA' },
  'mountain view': { city: 'Mountain View', aliases: ['mountain view'], countryCode: 'US', countryName: 'United States', state: 'CA', museQuery: 'Mountain View, CA' },
  'los angeles': { city: 'Los Angeles', aliases: ['los angeles', 'la'], countryCode: 'US', countryName: 'United States', state: 'CA', museQuery: 'Los Angeles, CA' },
  'san diego': { city: 'San Diego', aliases: ['san diego'], countryCode: 'US', countryName: 'United States', state: 'CA', museQuery: 'San Diego, CA' },
  'new york': { city: 'New York', aliases: ['new york', 'nyc', 'manhattan'], countryCode: 'US', countryName: 'United States', state: 'NY', museQuery: 'New York, NY' },
  'nyc': { city: 'New York', aliases: ['new york', 'nyc', 'manhattan'], countryCode: 'US', countryName: 'United States', state: 'NY', museQuery: 'New York, NY' },
  'seattle': { city: 'Seattle', aliases: ['seattle'], countryCode: 'US', countryName: 'United States', state: 'WA', museQuery: 'Seattle, WA' },
  'bellevue': { city: 'Bellevue', aliases: ['bellevue'], countryCode: 'US', countryName: 'United States', state: 'WA', museQuery: 'Bellevue, WA' },
  'redmond': { city: 'Redmond', aliases: ['redmond'], countryCode: 'US', countryName: 'United States', state: 'WA', museQuery: 'Redmond, WA' },
  'austin': { city: 'Austin', aliases: ['austin'], countryCode: 'US', countryName: 'United States', state: 'TX', museQuery: 'Austin, TX' },
  'dallas': { city: 'Dallas', aliases: ['dallas'], countryCode: 'US', countryName: 'United States', state: 'TX', museQuery: 'Dallas, TX' },
  'boston': { city: 'Boston', aliases: ['boston'], countryCode: 'US', countryName: 'United States', state: 'MA', museQuery: 'Boston, MA' },
  'chicago': { city: 'Chicago', aliases: ['chicago'], countryCode: 'US', countryName: 'United States', state: 'IL', museQuery: 'Chicago, IL' },
  'atlanta': { city: 'Atlanta', aliases: ['atlanta'], countryCode: 'US', countryName: 'United States', state: 'GA', museQuery: 'Atlanta, GA' },
  'denver': { city: 'Denver', aliases: ['denver'], countryCode: 'US', countryName: 'United States', state: 'CO', museQuery: 'Denver, CO' },

  // UK & Europe
  'london': { city: 'London', aliases: ['london'], countryCode: 'GB', countryName: 'United Kingdom', museQuery: 'London, United Kingdom' },
  'manchester': { city: 'Manchester', aliases: ['manchester'], countryCode: 'GB', countryName: 'United Kingdom' },
  'edinburgh': { city: 'Edinburgh', aliases: ['edinburgh'], countryCode: 'GB', countryName: 'United Kingdom' },
  'berlin': { city: 'Berlin', aliases: ['berlin'], countryCode: 'DE', countryName: 'Germany', museQuery: 'Berlin, Germany' },
  'munich': { city: 'Munich', aliases: ['munich'], countryCode: 'DE', countryName: 'Germany', museQuery: 'Munich, Germany' },
  'frankfurt': { city: 'Frankfurt', aliases: ['frankfurt'], countryCode: 'DE', countryName: 'Germany' },
  'paris': { city: 'Paris', aliases: ['paris'], countryCode: 'FR', countryName: 'France', museQuery: 'Paris, France' },
  'amsterdam': { city: 'Amsterdam', aliases: ['amsterdam'], countryCode: 'NL', countryName: 'Netherlands' },
  'dublin': { city: 'Dublin', aliases: ['dublin'], countryCode: 'IE', countryName: 'Ireland' },
  'reykjavik': { city: 'Reykjavik', aliases: ['reykjavik'], countryCode: 'IS', countryName: 'Iceland' }
};

export function parseLocationQuery(query?: string): ParsedLocationCriteria {
  if (!query || !query.trim()) {
    return {
      raw: '',
      isRemoteOnly: false,
      isAnywhere: true,
      isUnrecognized: false,
      isSpecificCity: false,
      tokens: []
    };
  }

  const clean = query.trim().replace(/\+/g, ' ');
  const lower = clean.toLowerCase();

  // Check remote intent
  if (['remote', 'flexible', 'wfh', 'work from home', 'telecommute', 'virtual'].includes(lower)) {
    return {
      raw: clean,
      isRemoteOnly: true,
      isAnywhere: true,
      isUnrecognized: false,
      isSpecificCity: false,
      tokens: ['remote']
    };
  }

  // Check generic global / anywhere intent
  if (['all', 'any', 'worldwide', 'global', 'anywhere'].includes(lower)) {
    return {
      raw: clean,
      isRemoteOnly: false,
      isAnywhere: true,
      isUnrecognized: false,
      isSpecificCity: false,
      tokens: []
    };
  }

  // Tokenize by comma or spaces
  const parts = clean.split(/[,]+/).map(p => p.trim()).filter(Boolean);
  const words = clean.split(/[\s,]+/).map(w => w.trim().toLowerCase()).filter(Boolean);

  let detectedCountryCode: 'IN' | 'US' | 'GB' | 'CA' | 'AU' | 'DE' | 'FR' | 'NL' | 'IE' | 'IS' | 'GLOBAL' | undefined;
  let detectedCountryName: string | undefined;
  let detectedCity: string | undefined;
  let detectedState: string | undefined;

  // Detect Country standalone
  if (words.includes('india') || words.includes('ind') || words.includes('bharat') || words.includes('karnataka') || words.includes('maharashtra') || words.includes('delhi')) {
    detectedCountryCode = 'IN';
    detectedCountryName = 'India';
  } else if (words.includes('united states') || words.includes('usa') || words.includes('us') || words.includes('u.s.') || words.includes('california') || words.includes('texas') || words.includes('washington')) {
    detectedCountryCode = 'US';
    detectedCountryName = 'United States';
  } else if (words.includes('united kingdom') || words.includes('uk') || words.includes('u.k.') || words.includes('england') || words.includes('scotland')) {
    detectedCountryCode = 'GB';
    detectedCountryName = 'United Kingdom';
  } else if (words.includes('germany') || words.includes('deutschland') || words.includes('de')) {
    detectedCountryCode = 'DE';
    detectedCountryName = 'Germany';
  } else if (words.includes('france') || words.includes('fr')) {
    detectedCountryCode = 'FR';
    detectedCountryName = 'France';
  } else if (words.includes('netherlands') || words.includes('holland') || words.includes('nl')) {
    detectedCountryCode = 'NL';
    detectedCountryName = 'Netherlands';
  } else if (words.includes('ireland') || words.includes('ie')) {
    detectedCountryCode = 'IE';
    detectedCountryName = 'Ireland';
  } else if (words.includes('iceland') || words.includes('is')) {
    detectedCountryCode = 'IS';
    detectedCountryName = 'Iceland';
  }

  // Detect City from mapped dictionary
  for (const [key, mapping] of Object.entries(CITY_MAP)) {
    if (lower.includes(key)) {
      detectedCity = mapping.city;
      detectedCountryCode = mapping.countryCode;
      detectedCountryName = mapping.countryName;
      detectedState = mapping.state;
      break;
    }
  }

  const isSpecificCity = Boolean(detectedCity);

  // If neither a city nor a recognized country could be detected from a non-empty string, mark as unrecognized
  const isUnrecognized = !isSpecificCity && !detectedCountryCode;

  return {
    raw: clean,
    isRemoteOnly: false,
    isAnywhere: false,
    isUnrecognized,
    isSpecificCity,
    countryCode: detectedCountryCode,
    countryName: detectedCountryName,
    city: detectedCity,
    state: detectedState || (parts.length > 1 ? parts[1] : undefined),
    tokens: [detectedCity?.toLowerCase(), detectedCountryName?.toLowerCase(), ...words].filter(Boolean) as string[]
  };
}

/**
 * Determines whether an external job listing matches candidate's location criteria.
 * Enforces:
 * 1. Exact country & city boundaries for on-site/hybrid positions.
 * 2. Does NOT treat missing or ambiguous location data as a match.
 * 3. Does NOT silently substitute remote positions or unrelated cities when searching for a specific city.
 * 4. Strict geographic eligibility enforcement for remote listings (Worldwide, APAC, US Only, etc.).
 */
export function isJobLocationMatch(
  jobLocation: string,
  isJobRemote: boolean,
  candidateCriteria: ParsedLocationCriteria,
  rawLocations: string[] = [],
  workModeFilter?: string
): { isMatch: boolean; reason: string; eligibility?: string } {
  // Rule A: Do not treat missing or unrecognized location information as a match
  if (candidateCriteria.isUnrecognized) {
    return { isMatch: false, reason: 'Unrecognized location - cannot establish geographic match' };
  }

  // If candidate searched anywhere / all without location constraints
  if (candidateCriteria.isAnywhere && !candidateCriteria.isRemoteOnly) {
    if (workModeFilter === 'Remote' && !isJobRemote) {
      return { isMatch: false, reason: 'Job is not remote' };
    }
    if (workModeFilter === 'On-site' && isJobRemote) {
      return { isMatch: false, reason: 'Job is remote' };
    }
    return { isMatch: true, reason: 'Anywhere search' };
  }

  const jobLocLower = (jobLocation || '').toLowerCase();
  const allLocsLower = [jobLocLower, ...rawLocations.map(l => (l || '').toLowerCase())].join(' ');

  // If work mode is explicitly On-site, exclude any remote job
  if (workModeFilter === 'On-site' && isJobRemote) {
    return { isMatch: false, reason: 'Job is remote but user requested on-site' };
  }

  // If candidate specifically requested Remote Only or workMode is Remote
  const isCandidateSeekingRemote = candidateCriteria.isRemoteOnly || workModeFilter === 'Remote';

  if (isCandidateSeekingRemote) {
    if (!isJobRemote) {
      return { isMatch: false, reason: 'Job is not remote' };
    }
    // Verify remote geographic eligibility for candidate's location
    return verifyRemoteEligibility(allLocsLower, candidateCriteria);
  }

  // =========================================================================
  // Case 1: Specific City Requested (e.g. "Bengaluru, India" or "San Jose, CA")
  // =========================================================================
  if (candidateCriteria.isSpecificCity && candidateCriteria.city) {
    const cityKey = candidateCriteria.city.toLowerCase();
    const cityEntry = CITY_MAP[cityKey] || Object.values(CITY_MAP).find(c => c.city.toLowerCase() === cityKey);
    const aliases = cityEntry ? cityEntry.aliases : [cityKey];

    // Check if job locations contain any city alias (as a distinct word/phrase)
    const matchesCity = aliases.some(alias => {
      const regex = new RegExp(`(^|[^a-z0-9])${alias}([^a-z0-9]|$)`, 'i');
      return regex.test(allLocsLower);
    });

    if (matchesCity) {
      return { isMatch: true, reason: `Matches city ${candidateCriteria.city}` };
    }

    // Rule A & D: When a user selects a specific city, do NOT silently substitute
    // remote jobs or vacancies from other cities as local matches.
    return { isMatch: false, reason: `Not available in requested city (${candidateCriteria.city})` };
  }

  // =========================================================================
  // Case 2: Country-Level Search (e.g. "India", "United States", "Germany")
  // =========================================================================
  if (candidateCriteria.countryCode) {
    const countryTokens = getCountryTokens(candidateCriteria.countryCode);
    const matchesCountry = countryTokens.some(ct => allLocsLower.includes(ct));

    // If the job is on-site/hybrid in the target country
    if (!isJobRemote && matchesCountry) {
      return { isMatch: true, reason: `Matches country ${candidateCriteria.countryName}` };
    }

    // If on-site in a DIFFERENT country, strictly reject
    if (!isJobRemote && !matchesCountry) {
      return { isMatch: false, reason: `On-site/Hybrid in non-matching region (${jobLocation})` };
    }

    // If job is Remote and candidate searched for a country with workMode !== 'On-site'
    if (isJobRemote && workModeFilter !== 'On-site') {
      return verifyRemoteEligibility(allLocsLower, candidateCriteria);
    }
  }

  return { isMatch: false, reason: `Does not match location criteria (${candidateCriteria.raw})` };
}

/**
 * Checks whether a remote job listing's geographic restrictions allow candidates
 * in the specified country.
 */
function verifyRemoteEligibility(
  allLocsLower: string,
  criteria: ParsedLocationCriteria
): { isMatch: boolean; reason: string; eligibility?: string } {
  const isWorldwide = allLocsLower.includes('worldwide') || allLocsLower.includes('anywhere') || allLocsLower.includes('global');

  if (criteria.countryCode === 'IN') {
    // Strictly reject remote jobs restricted to Americas or Europe
    const restrictedToOthers = [
      'usa only', 'us only', 'united states only', 'us citizens', 'north america',
      'canada only', 'europe only', 'uk only', 'germany only', 'latin america'
    ];
    if (restrictedToOthers.some(r => allLocsLower.includes(r))) {
      return { isMatch: false, reason: 'Remote job restricted to non-India locations' };
    }

    const allowedForIndia = ['worldwide', 'anywhere', 'global', 'apac', 'asia', 'india'];
    if (allowedForIndia.some(a => allLocsLower.includes(a))) {
      return { isMatch: true, reason: 'Remote job eligible for India candidates', eligibility: isWorldwide ? 'Worldwide' : 'India / APAC' };
    }
    return { isMatch: false, reason: 'Remote eligibility not established for India' };
  }

  if (criteria.countryCode === 'US') {
    // Reject jobs restricted to outside US
    const restrictedToOthers = ['europe only', 'uk only', 'germany only', 'australia only', 'india only', 'latin america only'];
    if (restrictedToOthers.some(r => allLocsLower.includes(r))) {
      return { isMatch: false, reason: 'Remote job restricted to non-US locations' };
    }

    const allowedForUS = ['worldwide', 'anywhere', 'global', 'usa', 'united states', 'us', 'americas', 'north america'];
    if (allowedForUS.some(a => allLocsLower.includes(a))) {
      return { isMatch: true, reason: 'Remote job eligible for US candidates', eligibility: isWorldwide ? 'Worldwide' : 'United States' };
    }
    return { isMatch: false, reason: 'Remote job not eligible for US' };
  }

  if (criteria.countryCode === 'GB') {
    const allowedForUK = ['worldwide', 'anywhere', 'global', 'uk', 'united kingdom', 'europe', 'emea'];
    if (allowedForUK.some(a => allLocsLower.includes(a))) {
      return { isMatch: true, reason: 'Remote job eligible for UK candidates', eligibility: isWorldwide ? 'Worldwide' : 'United Kingdom / Europe' };
    }
    return { isMatch: false, reason: 'Remote job not eligible for UK' };
  }

  if (criteria.countryCode === 'DE') {
    const allowedForDE = ['worldwide', 'anywhere', 'global', 'germany', 'deutschland', 'europe', 'emea', 'eu'];
    if (allowedForDE.some(a => allLocsLower.includes(a))) {
      return { isMatch: true, reason: 'Remote job eligible for Germany candidates', eligibility: isWorldwide ? 'Worldwide' : 'Germany / Europe' };
    }
    return { isMatch: false, reason: 'Remote job not eligible for Germany' };
  }

  // If candidate is in another recognized country (e.g. Iceland)
  if (isWorldwide) {
    return { isMatch: true, reason: 'Worldwide remote opportunity', eligibility: 'Worldwide' };
  }

  return { isMatch: false, reason: `Remote job not verified for ${criteria.countryName || criteria.raw}` };
}

function getCountryTokens(countryCode: string): string[] {
  switch (countryCode) {
    case 'IN': return ['india', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'gurgaon', 'gurugram', 'noida', 'hyderabad', 'chennai', 'pune', 'kolkata'];
    case 'US': return ['united states', 'usa', ', us', ' ca', ' tx', ' wa', ' ny', ' il', ' ma', ' nc', ' ga', ' co'];
    case 'GB': return ['united kingdom', 'uk', 'london', 'england', 'scotland', 'manchester'];
    case 'DE': return ['germany', 'deutschland', 'berlin', 'munich', 'münchen', 'frankfurt', 'hamburg'];
    case 'FR': return ['france', 'paris'];
    case 'NL': return ['netherlands', 'amsterdam'];
    case 'IE': return ['ireland', 'dublin'];
    case 'IS': return ['iceland', 'reykjavik'];
    default: return [];
  }
}
