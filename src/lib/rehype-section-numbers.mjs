/** Tags every h2 with `rv-h2` so it picks up the numbered-heading CSS counter (site.css).
    Deliberately doesn't touch heading text/children — that runs before Astro's own
    heading-id/slug collection, and mutating it here would leak into slugs and TOC labels. */
export function rehypeSectionNumbers() {
  return (tree) => {
    function visit(node) {
      if (node.type === 'element' && node.tagName === 'h2') {
        node.properties = node.properties || {};
        const existing = node.properties.className;
        node.properties.className = Array.isArray(existing) ? [...existing, 'rv-h2'] : existing ? [existing, 'rv-h2'] : ['rv-h2'];
      }
      if (node.children) {
        node.children.forEach(visit);
      }
    }
    visit(tree);
  };
}
