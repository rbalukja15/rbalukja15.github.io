import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    context: z.string(),
    bullets: z.array(z.string()).min(2).max(3),
    stack: z.array(z.string()),
    thumbnail: z.string().optional(),
    order: z.number(),
    links: z
      .object({
        github: z.url().optional(),
        live: z.url().optional(),
        liveLabel: z.string().default('Live'),
      })
      .optional(),
    isPrivate: z.boolean().default(false),
    status: z.enum(['production', 'open-source', 'npm', 'pypi']).optional(),
  }),
});

export const collections = { projects };
