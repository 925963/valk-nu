import raw from '../../data/atlassian-features.json';

export interface Feature {
  id: string;
  title: string;
  product: string;
  status: 'coming_soon' | 'rolling_out_new' | 'rolling_out' | 'rollout_complete' | 'released';
  announced_date: string | null;
  rollout_start_date: string | null;
  rollout_end_date: string | null;
  last_seen_week: string | null;
  source_url: string;
  description: string;
}

interface FeaturesData {
  source_repo: string;
  data_through: string;
  feature_count: number;
  features: Feature[];
}

const data = raw as FeaturesData;

export const FEATURES: Feature[] = data.features;
export const DATA_THROUGH = data.data_through;
export const SOURCE_REPO = data.source_repo;
export const SOURCE_URL = `https://github.com/${data.source_repo}`;

const byAnnouncedDesc = (a: Feature, b: Feature) => (b.announced_date ?? '').localeCompare(a.announced_date ?? '');

export function allFeaturesSorted(): Feature[] {
  return [...FEATURES].sort(byAnnouncedDesc);
}

export function featuresByStatus(statuses: Feature['status'][]): Feature[] {
  return FEATURES.filter((f) => statuses.includes(f.status)).sort(byAnnouncedDesc);
}

export function newThisWeek(): { latestWeek: string | null; byProduct: Map<string, Feature[]> } {
  const news = FEATURES.filter((f) => f.status === 'rolling_out_new');
  const latestWeek = news.map((f) => f.last_seen_week).filter((w): w is string => Boolean(w)).sort().reverse()[0] ?? null;
  const list = (latestWeek ? news.filter((f) => f.last_seen_week === latestWeek) : news).sort(
    (a, b) => a.product.localeCompare(b.product) || a.title.localeCompare(b.title)
  );
  const grouped = new Map<string, Feature[]>();
  for (const f of list) {
    const arr = grouped.get(f.product) ?? [];
    arr.push(f);
    grouped.set(f.product, arr);
  }
  const byProduct = new Map([...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  return { latestWeek, byProduct };
}

export function statusCounts() {
  const count = (s: Feature['status']) => FEATURES.filter((f) => f.status === s).length;
  return {
    nieuw: count('rolling_out_new'),
    binnenkort: count('coming_soon'),
    wordtUitgerold: count('rolling_out'),
    afgerond: count('rollout_complete') + count('released'),
  };
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
