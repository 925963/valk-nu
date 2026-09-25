import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { TOPICS, getTopic } from '../../../config/topics';
import { isPublished } from '../../../lib/content';

export async function getStaticPaths() {
  return TOPICS.map((topic) => ({ params: { topic: topic.slug } }));
}

export async function GET(context) {
  const topic = getTopic(context.params.topic);
  const posts = (await getCollection('posts'))
    .filter((p) => p.data.topic === topic.id && isPublished(p))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: `Rik de Valk — ${topic.label}`,
    description: topic.description,
    site: context.site,
    customData: '<language>nl</language>',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/${post.id}/`,
    })),
  });
}
