// Client-side table search + pagination. Pure DOM, no deps.
// Opt in on a wrapper element:
//   data-paginate="N"  -> N rows per page, with pager bars (top + bottom)
//   data-search        -> a filter box above the table
// Search filters ALL tbody rows (across every page); pagination then applies
// to the matched subset. No-ops on tables that don't opt in.
(function () {
  'use strict';

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.firstChild;
  }

  function makePager() {
    return el(
      '<div class="pager">' +
      '<button type="button" data-act="first" aria-label="First page">[&lt;&lt;]</button>' +
      '<button type="button" data-act="prev" aria-label="Previous page">[&lt;]</button>' +
      '<span class="pager-page">page <input class="pager-input" type="text" inputmode="numeric" aria-label="Page number" value="1">/<span class="pager-total">1</span></span>' +
      '<button type="button" data-act="next" aria-label="Next page">[&gt;]</button>' +
      '<button type="button" data-act="last" aria-label="Last page">[&gt;&gt;]</button>' +
      '<span class="pager-status"></span>' +
      '</div>'
    );
  }

  function makeSearch() {
    return el(
      '<div class="tsearch">' +
      '<span class="tsearch-prompt">$ grep</span>' +
      '<input class="tsearch-input" type="text" placeholder="type to filter…" aria-label="Filter table" autocomplete="off">' +
      '<span class="tsearch-count"></span>' +
      '</div>'
    );
  }

  function enhance(container) {
    var size = parseInt(container.getAttribute('data-paginate'), 10) || 0;
    var searchable = container.hasAttribute('data-search');
    var table = container.querySelector('table');
    var tbody = table && table.tBodies[0];
    if (!tbody || (!size && !searchable)) return;

    var rows = Array.prototype.slice.call(tbody.rows);
    var texts = rows.map(function (r) { return (r.textContent || '').toLowerCase(); });
    var total = rows.length;
    var matched = rows;
    var current = 1;

    var hasPager = size > 0 && total > size;
    var bars = [];
    var searchBox = null;
    var countEl = null;

    if (searchable || hasPager) {
      searchBox = makeSearch();
      countEl = searchBox.querySelector('.tsearch-count');
      container.parentNode.insertBefore(searchBox, container);
    }
    if (hasPager) {
      var top = makePager();
      var bottom = makePager();
      container.parentNode.insertBefore(top, container);
      container.parentNode.insertBefore(bottom, container.nextSibling);
      bars = [top, bottom];
    }

    function pageCount() {
      var per = size || matched.length || 1;
      return Math.max(1, Math.ceil(matched.length / per));
    }

    function render() {
      var per = size || matched.length;
      var pages = pageCount();
      if (current > pages) current = pages;
      var start = (current - 1) * (size || 0);
      var end = size ? Math.min(start + per, matched.length) : matched.length;

      for (var i = 0; i < rows.length; i++) rows[i].style.display = 'none';
      for (var j = start; j < end; j++) matched[j].style.display = '';

      bars.forEach(function (b) {
        b.querySelector('.pager-input').value = current;
        b.querySelector('.pager-total').textContent = pages;
        b.querySelector('.pager-status').textContent = matched.length
          ? 'showing ' + (start + 1) + '–' + end + ' of ' + matched.length
          : 'no matches';
        b.querySelector('[data-act=first]').disabled = current === 1;
        b.querySelector('[data-act=prev]').disabled = current === 1;
        b.querySelector('[data-act=next]').disabled = current === pages;
        b.querySelector('[data-act=last]').disabled = current === pages;
      });

      if (countEl) {
        countEl.textContent = matched.length === total
          ? total + ' rows'
          : matched.length + ' / ' + total + ' match';
      }
    }

    function go(p, scroll) {
      current = Math.max(1, Math.min(pageCount(), p || 1));
      render();
      if (scroll && bars[0]) bars[0].scrollIntoView({ block: 'start' });
    }

    function filter(q) {
      q = (q || '').trim().toLowerCase();
      matched = q ? rows.filter(function (r, i) { return texts[i].indexOf(q) !== -1; }) : rows;
      current = 1;
      render();
    }

    bars.forEach(function (b) {
      b.addEventListener('click', function (e) {
        var act = e.target.getAttribute && e.target.getAttribute('data-act');
        if (!act) return;
        if (act === 'first') go(1, true);
        else if (act === 'prev') go(current - 1, true);
        else if (act === 'next') go(current + 1, true);
        else if (act === 'last') go(pageCount(), true);
      });
      var inp = b.querySelector('.pager-input');
      function jump() {
        var v = parseInt(inp.value, 10);
        if (!isNaN(v)) go(v, true);
        else inp.value = current;
      }
      inp.addEventListener('change', jump);
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); jump(); }
      });
    });

    if (searchBox) {
      var si = searchBox.querySelector('.tsearch-input');
      si.addEventListener('input', function () { filter(si.value); });
      si.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { si.value = ''; filter(''); }
      });
    }

    render();
  }

  function init() {
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-paginate], [data-search]'),
      enhance
    );
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
