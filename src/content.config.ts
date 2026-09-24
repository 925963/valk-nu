import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const factSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      date: z.date(),
      updated: z.date().optional(),
      topic: z.enum(['agile', 'reviews', 'vondsten']),
      type: z.enum(['artikel', 'review', 'vondst']),
      lang: z.enum(['nl', 'en']).default('nl'),
      draft: z.boolean().default(false),
      review: z
        .object({
          verdict: z.string(),
          facts: z.array(factSchema),
          pros: z.array(z.string()),
          cons: z.array(z.string()),
          disclosure: z.string(),
        })
        .optional(),
      service: z
        .object({
          domain: z.string(),
          url: z.string().url(),
          facts: z.array(factSchema),
          disclosure: z.string(),
        })
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (data.type === 'review' && !data.review) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'type "review" requires a `review` block', path: ['review'] });
      }
      if (data.type === 'vondst' && !data.service) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'type "vondst" requires a `service` block', path: ['service'] });
      }
    }),
});

export const collections = { posts };
