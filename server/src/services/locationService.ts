/**
 * Location Parser and Eligibility Engine for GigSync Platform.
 * Normalizes location queries, maps aliases (e.g., Bengaluru -> Bangalore),
 * verifies country/city containment, and determines candidate eligibility for remote/hybrid roles.
 */

export interface ParsedLocationCriteria {
  raw: string;
  isRemoteOnly: boolean;
  isAnywhere: boolean;
  countryCode?: 'IN' | 'US' | 'GB' | 'CA' | 'AU' | 'DE' | 'GLOBAL';
  countryName?: string;
  city?: string;
  state?: string;
  tokens: string[];
}

// City to canonical provider format & country
const CITY_MAP: Record<string, { city: string; countryCode: 'IN' | 'US' | 'GB' | 'CA' | 'AU' | 'DE'; countryName: string; museQuery?: string }> = {
  // India
  'bengaluru': { city: 'Bangalore', countryCode: 'IN', countryName: 'India', museQuery: 'Bangalore, India' },
  'bangalore': { city: 'Bangalore', countryCode: 'IN', countryName: 'India', museQuery: 'Bangalore, India' },
  'mumbai': { city: 'Mumbai', countryCode: 'IN', countryName: 'India', museQuery: 'Mumbai, India' },
  'delhi': { city: 'Delhi', countryCode: 'IN', countryName: 'India', museQuery: 'Gurgaon, India' },
  'new delhi': { city: 'New Delhi', countryCode: 'IN', countryName: 'India', museQuery: 'Gurgaon, India' },
  'gurgaon': { city: 'Gurgaon', countryCode: 'IN', countryName: 'India', museQuery: 'Gurgaon, India' },
  'gurugram': { city: 'Gurgaon', countryCode: 'IN', countryName: 'India', museQuery: 'Gurgaon, India' },
  'noida': { city: 'Noida', countryCode: 'IN', countryName: 'India', museQuery: 'Gurgaon, India' },
  'hyderabad': { city: 'Hyderabad', countryCode: 'IN', countryName: 'India', museQuery: 'Hyderabad, India' },
  'chennai': { city: 'Chennai', countryCode: 'IN', countryName: 'India', museQuery: 'Chennai, India' },
  'pune': { city: 'Pune', countryCode: 'IN', countryName: 'India', museQuery: 'Mumbai, India' },
  'kolkata': { city: 'Kolkata', countryCode: 'IN', countryName: 'India' },

  // USA
  'san jose': { city: 'San Jose', countryCode: 'US', countryName: 'United States', museQuery: 'San Jose, CA' },
  'san francisco': { city: 'San Francisco', countryCode: 'US', countryName: 'United States', museQuery: 'San Francisco, CA' },
  'sunnyvale': { city: 'Sunnyvale', countryCode: 'US', countryName: 'United States', museQuery: 'Sunnyvale, CA' },
  'palo alto': { city: 'Palo Alto', countryCode: 'US', countryName: 'United States', museQuery: 'Palo Alto, CA' },
  'los angeles': { city: 'Los Angeles', countryCode: 'US', countryName: 'United States', museQuery: 'Los Angeles, CA' },
  'new york': { city: 'New York', countryCode: 'US', countryName: 'United States', museQuery: 'New York, NY' },
  'nyc': { city: 'New York', countryCode: 'US', countryName: 'United States', museQuery: 'New York, NY' },
  'seattle': { city: 'Seattle', countryCode: 'US', countryName: 'United States', museQuery: 'Seattle, WA' },
  'austin': { city: 'Austin', countryCode: 'US', countryName: 'United States', museQuery: 'Austin, TX' },
  'redmond': { city: 'Redmond', countryCode: 'US', countryName: 'United States', museQuery: 'Redmond, WA' },
  'boston': { city: 'Boston', countryCode: 'US', countryName: 'United States', museQuery: 'Boston, MA' },
  'chicago': { city: 'Chicago', countryCode: 'US', countryName: 'United States', museQuery: 'Chicago, IL' },

  // Europe / UK / Germany
  'london': { city: 'London', countryCode: 'GB', countryName: 'United Kingdom', museQuery: 'London, United Kingdom' },
  'berlin': { city: 'Berlin', countryCode: 'DE', countryName: 'Germany', museQuery: 'Berlin, Germany' },
  'munich': { city: 'Munich', countryCode: 'DE', countryName: 'Germany', museQuery: 'Munich, Germany' }
};

export function parseLocationQuery(query?: string): ParsedLocationCriteria {
  if (!query || !query.trim()) {
    return {
      raw: '',
      isRemoteOnly: false,
      isAnywhere: true,
      tokens: []
    };
  }

  const clean = query.trim().replace(/\+/g, ' ');
  const lower = clean.toLowerCase();

  // Check remote intent
  if (['remote', 'flexible', 'wfh', 'work from home', 'telecommute'].includes(lower)) {
    return {
      raw: clean,
      isRemoteOnly: true,
      isAnywhere: true,
      tokens: ['remote']
    };
  }

  if (['all', 'any', 'worldwide', 'global', 'anywhere'].includes(lower)) {
    return {
      raw: clean,
      isRemoteOnly: false,
      isAnywhere: true,
      tokens: []
    };
  }

  // Tokenize by comma or spaces
  const parts = clean.split(/[,]+/).map(p => p.trim()).filter(Boolean);
  const words = clean.split(/[\s,]+/).map(w => w.trim().toLowerCase()).filter(Boolean);

  let detectedCountryCode: 'IN' | 'US' | 'GB' | 'CA' | 'AU' | 'DE' | 'GLOBAL' | undefined;
  let detectedCountryName: string | undefined;
  let detectedCity: string | undefined;
  let museQuery: string | undefined;

  // Detect Country
  if (words.includes('india') || words.includes('ind') || words.includes('karnataka') || words.includes('maharashtra') || words.includes('delhi')) {
    detectedCountryCode = 'IN';
    detectedCountryName = 'India';
  } else if (words.includes('united states') || words.includes('usa') || words.includes('us') || words.includes('ca') || words.includes('california') || words.includes('texas') || words.includes('ny')) {
    detectedCountryCode = 'US';
    detectedCountryName = 'United States';
  } else if (words.includes('united kingdom') || words.includes('uk') || words.includes('england')) {
    detectedCountryCode = 'GB';
    detectedCountryName = 'United Kingdom';
  } else if (words.includes('germany') || words.includes('deutschland')) {
    detectedCountryCode = 'DE';
    detectedCountryName = 'Germany';
  }

  // Detect City from mapped dictionary
  for (const [key, mapping] of Object.entries(CITY_MAP)) {
    if (lower.includes(key)) {
      detectedCity = mapping.city;
      detectedCountryCode = mapping.countryCode;
      detectedCountryName = mapping.countryName;
      museQuery = mapping.museQuery;
      break;
    }
  }

  return {
    raw: clean,
    isRemoteOnly: false,
    isAnywhere: false,
    countryCode: detectedCountryCode,
    countryName: detectedCountryName,
    city: detectedCity,
    state: parts.length > 1 ? parts[1] : undefined,
    tokens: [detectedCity?.toLowerCase(), detectedCountryName?.toLowerCase(), ...words].filter(Boolean) as string[]
  };
}

/**
 * Determines whether an external job listing matches candidate's location criteria.
 * Enforces:
 * 1. Exact country & city boundaries for on-site/hybrid positions.
 * 2. Strict eligibility enforcement for remote listings (e.g. US only vs Worldwide vs India/APAC).
 */
export function isJobLocationMatch(
  jobLocation: string,
  isJobRemote: boolean,
  candidateCriteria: ParsedLocationCriteria,
  rawLocations: string[] = []
): { isMatch: boolean; reason: string } {
  // If user searched anywhere or global without constraint
  if (candidateCriteria.isAnywhere && !candidateCriteria.isRemoteOnly) {
    return { isMatch: true, reason: 'Anywhere search' };
  }

  const jobLocLower = jobLocation.toLowerCase();
  const allLocsLower = [jobLocLower, ...rawLocations.map(l => l.toLowerCase())].join(' ');

  // If user specifically requested remote only
  if (candidateCriteria.isRemoteOnly) {
    if (!isJobRemote) {
      return { isMatch: false, reason: 'Job is not remote' };
    }
    return { isMatch: true, reason: 'Remote match' };
  }

  // 1. Check if the job is explicitly in the requested city or country (On-site / Hybrid / Local)
  if (candidateCriteria.city) {
    const cityLower = candidateCriteria.city.toLowerCase();
    // Check city aliases (e.g. bangalore vs bengaluru)
    const aliases = [cityLower];
    if (cityLower === 'bangalore') aliases.push('bengaluru');
    if (cityLower === 'bengaluru') aliases.push('bangalore');
    if (cityLower === 'gurgaon') aliases.push('gurugram');

    const matchesCity = aliases.some(a => allLocsLower.includes(a));
    if (matchesCity) {
      return { isMatch: true, reason: `Matches city ${candidateCriteria.city}` };
    }
  }

  if (candidateCriteria.countryCode) {
    let countryTokens: string[] = [];
    if (candidateCriteria.countryCode === 'IN') countryTokens = ['india'];
    else if (candidateCriteria.countryCode === 'US') countryTokens = ['united states', 'usa', ', us', ' ca', ' tx', ' wa', ' ny', ' il', ' ma', ' nc'];
    else if (candidateCriteria.countryCode === 'GB') countryTokens = ['united kingdom', 'uk', 'london', 'england'];
    else if (candidateCriteria.countryCode === 'DE') countryTokens = ['germany', 'berlin', 'munich', 'hamburg'];

    const matchesCountry = countryTokens.some(ct => allLocsLower.includes(ct));

    // If candidate specified only a country (e.g. "India") and job is in that country
    if (!candidateCriteria.city && matchesCountry) {
      return { isMatch: true, reason: `Matches country ${candidateCriteria.countryName}` };
    }

    // If the job is on-site or hybrid in an unrelated country, REJECT IMMEDIATELY.
    // e.g. Candidate is in India or requested India, but job is in "Lockhart, TX" or "San Francisco, CA"
    if (!matchesCountry && !isJobRemote) {
      return { isMatch: false, reason: `On-site/Hybrid in non-matching region (${jobLocation})` };
    }
  }

  // 2. If the job is Remote, check its GEOGRAPHIC ELIGIBILITY for the candidate
  if (isJobRemote) {
    // If the job explicitly restricts to other regions, REJECT:
    if (candidateCriteria.countryCode === 'IN') {
      const restrictedToOthers = [
        'usa only', 'us only', 'united states only', 'us citizens', 'north america',
        'canada only', 'europe only', 'uk only', 'germany only', 'latin america'
      ];
      if (restrictedToOthers.some(r => allLocsLower.includes(r))) {
        return { isMatch: false, reason: 'Remote job restricted to non-India locations' };
      }
      // If worldwide, APAC, Asia, or explicit India, allow
      const allowedForIndia = ['worldwide', 'anywhere', 'global', 'apac', 'asia', 'india'];
      if (allowedForIndia.some(a => allLocsLower.includes(a))) {
        return { isMatch: true, reason: 'Remote job eligible for India candidates' };
      }
      // If unspecified "Remote" without country verification, reject to prevent US/EU remote jobs from flooding India
      return { isMatch: false, reason: 'Remote eligibility not established for India' };
    }

    if (candidateCriteria.countryCode === 'US') {
      // If user specified a specific US city like 'San Jose', don't return New Zealand or non-US listings
      const isOutsideUS = ['new zealand', 'australia', 'mexico', 'united kingdom', 'europe', 'poland', 'germany'].some(c => allLocsLower.includes(c));
      if (isOutsideUS && !allLocsLower.includes('san jose') && !allLocsLower.includes('worldwide')) {
        return { isMatch: false, reason: 'Remote job based outside US without worldwide eligibility' };
      }
      const allowedForUS = ['worldwide', 'anywhere', 'global', 'usa', 'united states', 'us', 'americas', 'north america'];
      if (allowedForUS.some(a => allLocsLower.includes(a))) {
        return { isMatch: true, reason: 'Remote job eligible for US candidates' };
      }
      return { isMatch: false, reason: 'Remote job not eligible for US' };
    }

    if (candidateCriteria.countryCode === 'GB') {
      const allowedForUK = ['worldwide', 'anywhere', 'global', 'uk', 'united kingdom', 'europe', 'emea'];
      if (allowedForUK.some(a => allLocsLower.includes(a))) {
        return { isMatch: true, reason: 'Remote job eligible for UK candidates' };
      }
      return { isMatch: false, reason: 'Remote job not eligible for UK' };
    }

    // Default global remote check
    if (allLocsLower.includes('worldwide') || allLocsLower.includes('anywhere') || allLocsLower.includes('global')) {
      return { isMatch: true, reason: 'Worldwide remote opportunity' };
    }
  }

  return { isMatch: false, reason: `Does not match location criteria (${candidateCriteria.raw})` };
}
