import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { isPublished } from '../lib/content';

export async function GET(context) {
  const posts = (await getCollection('posts'))
    .filter(isPublished)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: 'Rik de Valk',
    description: 'Agile & Atlassian, reviews en vondsten.',
    site: context.site,
    customData: '<language>nl</language>',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/${post.id}/`,
      customData: post.data.lang === 'en' ? '<language>en</language>' : undefined,
    })),
  });
}
