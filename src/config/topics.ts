export interface Topic {
  id: 'agile' | 'reviews' | 'vondsten';
  label: string;
  slug: string;
  description: string;
}

export const TOPICS: Topic[] = [
  {
    id: 'agile',
    label: 'Agile & Atlassian',
    slug: 'agile',
    description: 'Werken op schaal, Jira, Confluence en wat daar tussen zit.',
  },
  {
    id: 'reviews',
    label: 'Reviews',
    slug: 'reviews',
    description: 'Producten die ik zelf gebruik, zonder sponsor.',
  },
  {
    id: 'vondsten',
    label: 'Vondsten',
    slug: 'vondsten',
    description: 'Korte tips over digitale diensten die het proberen waard zijn.',
  },
];

export function getTopic(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}
