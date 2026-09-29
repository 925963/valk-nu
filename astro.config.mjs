import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import { rehypeSectionNumbers } from './src/lib/rehype-section-numbers.mjs';
import { rehypeCallouts } from './src/lib/rehype-callouts.mjs';
import { rehypeCodeBlocks } from './src/lib/rehype-code-blocks.mjs';

export default defineConfig({
  site: 'https://valk.nu',
  output: 'static',
  integrations: [sitemap(), mdx()],
  markdown: {
    syntaxHighlight: false,
    processor: unified({ rehypePlugins: [rehypeSectionNumbers, rehypeCallouts, rehypeCodeBlocks] }),
  },
});
