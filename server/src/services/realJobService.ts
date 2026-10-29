import https from 'https';
import http from 'http';
import { JobListing, JobRequirements } from '../types';

function cleanHtml(raw: string): string {
  if (!raw) return '';
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractSkills(text: string): { essential: string[]; preferred: string[] } {
  const catalog = [
    'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Java', 'C++',
    'C#', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'AWS', 'Azure', 'GCP',
    'Docker', 'Kubernetes', 'Git', 'REST APIs', 'FastAPI', 'Django', 'Flask',
    'HTML5', 'CSS3', 'Linux', 'GraphQL', 'Redis', 'CI/CD', 'Machine Learning'
  ];
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const sk of catalog) {
    const escaped = sk.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    if (regex.test(lower)) {
      found.push(sk);
    }
  }
  return {
    essential: found.slice(0, 5).length ? found.slice(0, 5) : ['Software Engineering', 'Problem Solving'],
    preferred: found.slice(5, 10)
  };
}

function fetchJson(url: string, headers: Record<string, string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          'User-Agent': 'GigSync/1.0 (Real Job Search Engine)',
          Accept: 'application/json',
          ...headers
        },
        timeout: 8000
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchJson(res.headers.location, headers).then(resolve).catch(reject);
        }
        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e: any) {
            reject(new Error(`JSON Parse error: ${e.message}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

/**
 * Searches real-world job postings directly from authorized public providers:
 * - The Muse (US, Tech, Global)
 * - Remotive (Remote software engineering)
 * - Arbeitnow (Remote, Hybrid, EU/Global)
 */
export async function searchRealWorldJobs(options: {
  role?: string;
  location?: string;
  workMode?: string;
  experienceLevel?: string;
  limit?: number;
}): Promise<JobListing[]> {
  const { role, location, workMode, experienceLevel, limit = 20 } = options;
  const results: JobListing[] = [];
  const seenKeys = new Set<string>();

  // Run external searches concurrently
  const [museRes, remotiveRes, arbeitnowRes] = await Promise.allSettled([
    // 1. The Muse
    (async () => {
      const museUrl = 'https://www.themuse.com/api/public/jobs?category=Software+Engineering&page=0';
      const data = await fetchJson(museUrl);
      const jobs = data.results || [];
      const out: JobListing[] = [];

      for (const item of jobs) {
        const title = item.name || '';
        const company = item.company?.name || 'Company';
        const locs = (item.locations || []).map((l: any) => l.name);
        const locStr = locs.join(', ') || 'Flexible / Remote';
        const desc = cleanHtml(item.contents || '');
        const fullText = `${title} ${desc} ${locStr}`.toLowerCase();

        // Role filtering
        if (role && role.trim()) {
          const tokens = role.toLowerCase().split(/[\s,&/]+/).filter(t => t.length > 2);
          if (tokens.length && !tokens.some(t => fullText.includes(t))) continue;
        }

        // Location filtering
        if (location && location.trim()) {
          const reqLoc = location.trim().toLowerCase();
          if (reqLoc !== 'all' && reqLoc !== 'any' && reqLoc !== 'worldwide') {
            const isRemoteSearch = ['remote', 'flexible', 'wfh'].includes(reqLoc);
            const locTokens = reqLoc.split(/[\s,]+/).filter(t => t.length > 2);
            const matchesLoc = locTokens.some(t => locStr.toLowerCase().includes(t)) ||
              locs.some((l: string) => locTokens.some(t => l.toLowerCase().includes(t)));
            const isJobRemote = locStr.toLowerCase().includes('remote') || locStr.toLowerCase().includes('flexible');

            if (isRemoteSearch) {
              if (!isJobRemote) continue;
            } else {
              if (!matchesLoc && !isJobRemote) continue;
            }
          }
        }

        let detectedMode: 'Remote' | 'Hybrid' | 'On-site' = 'On-site';
        if (locStr.toLowerCase().includes('remote') || locStr.toLowerCase().includes('flexible')) {
          detectedMode = 'Remote';
        } else if (fullText.includes('hybrid')) {
          detectedMode = 'Hybrid';
        }

        if (workMode && workMode !== 'All' && detectedMode !== workMode) continue;

        let detectedExp: 'Internship' | 'Entry-level' | 'Junior' | 'Mid-level' = 'Entry-level';
        const levels = (item.levels || []).map((l: any) => l.name?.toLowerCase() || '');
        if (levels.some((l: string) => l.includes('intern'))) detectedExp = 'Internship';
        else if (levels.some((l: string) => l.includes('entry'))) detectedExp = 'Entry-level';
        else if (levels.some((l: string) => l.includes('mid'))) detectedExp = 'Junior';
        else if (levels.some((l: string) => l.includes('senior'))) detectedExp = 'Mid-level';

        if (experienceLevel && experienceLevel !== 'All' && detectedExp !== experienceLevel) continue;

        const skills = extractSkills(`${title} ${desc}`);
        const applyUrl = item.refs?.landing_page || `https://www.themuse.com/job/redirect/${item.id}`;

        out.push({
          id: `themuse_${item.id}`,
          source: 'Company Direct',
          sourceJobId: String(item.id),
          title,
          company,
          location: locStr,
          workMode: detectedMode,
          experienceLevel: detectedExp,
          salaryRange: 'Competitive / Disclosed upon interview',
          description: desc.slice(0, 1000) + '...',
          requirements: {
            essentialSkills: skills.essential,
            preferredSkills: skills.preferred,
            constraints: [`Eligible for ${detectedMode} work in ${locStr}`],
            minYearsExperience: detectedExp === 'Internship' || detectedExp === 'Entry-level' ? 0 : 1
          },
          postedAt: item.publication_date || new Date().toISOString(),
          applyUrl,
          verified: true
        });
      }
      return out;
    })(),

    // 2. Remotive
    (async () => {
      if (workMode === 'On-site' || workMode === 'Hybrid') return [];
      const tokens = role ? role.toLowerCase().split(/[\s,&/]+/).filter(t => t.length > 2) : [];
      const searchParam = tokens.length ? `&search=${encodeURIComponent(tokens[0])}` : '';
      const remotiveUrl = `https://remotive.com/api/remote-jobs?category=software-dev&limit=40${searchParam}`;
      const data = await fetchJson(remotiveUrl);
      const jobs = data.jobs || [];
      const out: JobListing[] = [];

      for (const item of jobs) {
        const title = item.title || '';
        const company = item.company_name || 'Tech Company';
        const reqLoc = item.candidate_required_location || 'Worldwide';
        const desc = cleanHtml(item.description || '');
        const fullText = `${title} ${desc} ${(item.tags || []).join(' ')}`.toLowerCase();

        if (tokens.length && !tokens.some(t => fullText.includes(t))) continue;

        if (location && location.trim()) {
          const candLoc = location.trim().toLowerCase();
          if (candLoc !== 'all' && candLoc !== 'worldwide' && candLoc !== 'remote') {
            const reqLower = reqLoc.toLowerCase();
            const isGlobal = ['worldwide', 'anywhere', 'global', 'all'].some(k => reqLower.includes(k));
            if (!isGlobal) {
              const locTokens = candLoc.split(/[\s,]+/).filter(t => t.length > 2);
              const matches = locTokens.some(t => reqLower.includes(t));
              if (!matches) continue;
            }
          }
        }

        let detectedExp: 'Internship' | 'Entry-level' | 'Junior' | 'Mid-level' = 'Entry-level';
        if (fullText.includes('intern')) detectedExp = 'Internship';
        else if (fullText.includes('junior') || fullText.includes('associate')) detectedExp = 'Junior';
        else if (fullText.includes('senior') || fullText.includes('lead')) detectedExp = 'Mid-level';

        if (experienceLevel && experienceLevel !== 'All' && detectedExp !== experienceLevel) continue;

        const tags = (item.tags || []).map((t: string) => t.trim());
        const essentialSkills = tags.slice(0, 5).length ? tags.slice(0, 5) : ['Software Engineering', 'Problem Solving'];
        const prefSkills = tags.slice(5, 10);

        out.push({
          id: `remotive_${item.id}`,
          source: 'Curated Partner',
          sourceJobId: String(item.id),
          title,
          company,
          location: `Remote (${reqLoc})`,
          workMode: 'Remote',
          experienceLevel: detectedExp,
          salaryRange: item.salary || 'Competitive / Disclosed upon interview',
          description: desc.slice(0, 1000) + '...',
          requirements: {
            essentialSkills,
            preferredSkills: prefSkills,
            constraints: [`Eligible location: ${reqLoc}`],
            minYearsExperience: detectedExp === 'Internship' || detectedExp === 'Entry-level' ? 0 : 1
          },
          postedAt: item.publication_date || new Date().toISOString(),
          applyUrl: item.url || '',
          verified: true
        });
      }
      return out;
    })(),

    // 3. Arbeitnow
    (async () => {
      const url = 'https://www.arbeitnow.com/api/job-board-api';
      const data = await fetchJson(url);
      const jobs = data.data || [];
      const out: JobListing[] = [];

      for (const item of jobs) {
        const title = item.title || '';
        const company = item.company_name || 'Tech Company';
        const locStr = item.location || 'Remote';
        const isRemote = Boolean(item.remote);
        const desc = cleanHtml(item.description || '');
        const tags = (item.tags || []).join(' ');
        const fullText = `${title} ${desc} ${locStr} ${tags}`.toLowerCase();

        if (role && role.trim()) {
          const tokens = role.toLowerCase().split(/[\s,&/]+/).filter(t => t.length > 2);
          if (tokens.length && !tokens.some(t => fullText.includes(t))) continue;
        }

        if (location && location.trim()) {
          const reqLoc = location.trim().toLowerCase();
          if (reqLoc !== 'all' && reqLoc !== 'any' && reqLoc !== 'worldwide') {
            const isRemoteSearch = ['remote', 'flexible', 'wfh'].includes(reqLoc);
            const locTokens = reqLoc.split(/[\s,]+/).filter(t => t.length > 2);
            const matchesLoc = locTokens.some(t => locStr.toLowerCase().includes(t));
            if (isRemoteSearch) {
              if (!isRemote) continue;
            } else {
              if (!matchesLoc && !isRemote) continue;
            }
          }
        }

        let detectedMode: 'Remote' | 'Hybrid' | 'On-site' = isRemote ? 'Remote' : 'On-site';
        if (fullText.includes('hybrid') || locStr.toLowerCase().includes('hybrid')) {
          detectedMode = 'Hybrid';
        }

        if (workMode && workMode !== 'All' && detectedMode !== workMode) continue;

        let detectedExp: 'Internship' | 'Entry-level' | 'Junior' | 'Mid-level' = 'Entry-level';
        if (fullText.includes('intern')) detectedExp = 'Internship';
        else if (fullText.includes('junior') || fullText.includes('associate')) detectedExp = 'Junior';
        else if (fullText.includes('senior') || fullText.includes('lead')) detectedExp = 'Mid-level';

        if (experienceLevel && experienceLevel !== 'All' && detectedExp !== experienceLevel) continue;

        const skills = extractSkills(`${title} ${desc}`);
        out.push({
          id: `arbeitnow_${(item.slug || '').slice(-24)}`,
          source: 'Company Direct',
          sourceJobId: String(item.slug || item.id || ''),
          title,
          company,
          location: isRemote && !locStr.toLowerCase().includes('remote') ? `Remote (${locStr})` : locStr,
          workMode: detectedMode,
          experienceLevel: detectedExp,
          salaryRange: 'Competitive / Disclosed upon interview',
          description: desc.slice(0, 1000) + '...',
          requirements: {
            essentialSkills: skills.essential,
            preferredSkills: skills.preferred,
            constraints: [`Eligible for ${detectedMode} work in ${locStr}`],
            minYearsExperience: detectedExp === 'Internship' || detectedExp === 'Entry-level' ? 0 : 1
          },
          postedAt: item.created_at ? new Date(item.created_at * 1000).toISOString() : new Date().toISOString(),
          applyUrl: item.url || '',
          verified: true
        });
      }
      return out;
    })()
  ]);

  const candidates: JobListing[][] = [];
  if (museRes.status === 'fulfilled') candidates.push(museRes.value);
  if (remotiveRes.status === 'fulfilled') candidates.push(remotiveRes.value);
  if (arbeitnowRes.status === 'fulfilled') candidates.push(arbeitnowRes.value);

  for (const jobList of candidates) {
    for (const job of jobList) {
      const key = `${job.title.trim().toLowerCase()}::${job.company.trim().toLowerCase()}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        results.push(job);
      }
      if (results.length >= limit) break;
    }
    if (results.length >= limit) break;
  }

  return results;
}
