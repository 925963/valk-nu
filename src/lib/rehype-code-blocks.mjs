/** Wraps plain `pre > code` blocks into the `.rv-code` figure with a lang label + copy button, at build time. */
export function rehypeCodeBlocks() {
  return (tree) => {
    function visit(node) {
      if (node.type === 'element' && node.tagName === 'pre') {
        const code = node.children.find((c) => c.type === 'element' && c.tagName === 'code');
        const classes = code?.properties?.className || [];
        const langClass = (Array.isArray(classes) ? classes : [classes]).find((c) => typeof c === 'string' && c.startsWith('language-'));
        const lang = langClass ? langClass.replace('language-', '') : 'Code';
        Object.assign(node, {
          type: 'element',
          tagName: 'figure',
          properties: { className: ['rv-code'] },
          children: [
            {
              type: 'element',
              tagName: 'div',
              properties: { className: ['rv-code-bar'] },
              children: [
                { type: 'element', tagName: 'span', properties: { className: ['rv-label'] }, children: [{ type: 'text', value: lang }] },
                {
                  type: 'element',
                  tagName: 'button',
                  properties: { type: 'button', className: ['rv-code-copy'], dataCopyCode: 'true', ariaLive: 'polite' },
                  children: [{ type: 'text', value: 'Kopiëren' }],
                },
              ],
            },
            { type: 'element', tagName: 'pre', properties: {}, children: [code] },
          ],
        });
        return;
      }
      if (node.children) {
        node.children.forEach(visit);
      }
    }
    visit(tree);
  };
}
