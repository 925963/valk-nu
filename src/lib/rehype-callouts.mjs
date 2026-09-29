/** Turns `> Label: rest of the sentence.` blockquotes into an `.rv-callout` aside, at build time. */
export function rehypeCallouts() {
  return (tree) => {
    function visit(node) {
      if (node.type === 'element' && node.tagName === 'blockquote') {
        const p = node.children.find((c) => c.type === 'element' && c.tagName === 'p');
        const first = p?.children?.[0];
        const match = first?.type === 'text' ? first.value.match(/^\s*([^\s:][^:]{0,30}):\s*/) : null;
        if (p && first && match) {
          const label = match[1];
          const rest = first.value.slice(match[0].length);
          const bodyChildren = rest ? [{ type: 'text', value: rest }, ...p.children.slice(1)] : p.children.slice(1);
          node.tagName = 'aside';
          node.properties = { className: ['rv-callout'] };
          node.children = [
            { type: 'element', tagName: 'span', properties: { className: ['rv-label'] }, children: [{ type: 'text', value: label }] },
            { type: 'element', tagName: 'div', properties: { className: ['rv-callout-body'] }, children: [{ type: 'element', tagName: 'p', properties: {}, children: bodyChildren }] },
          ];
          return;
        }
      }
      if (node.children) {
        node.children.forEach(visit);
      }
    }
    visit(tree);
  };
}
