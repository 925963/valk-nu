// Client-side table pagination. Any element with [data-paginate="N"] wrapping
// a <table> gets a pager (top + bottom) that shows N tbody rows per page.
// Pure DOM, no deps. No-ops on pages/tables that don't opt in.
(function () {
  'use strict';

  function makeBar() {
    var bar = document.createElement('div');
    bar.className = 'pager';
    bar.innerHTML =
      '<button type="button" data-act="first" aria-label="First page">[&lt;&lt;]</button>' +
      '<button type="button" data-act="prev" aria-label="Previous page">[&lt;]</button>' +
      '<span class="pager-page">page <input class="pager-input" type="text" inputmode="numeric" aria-label="Page number" value="1">/<span class="pager-total">1</span></span>' +
      '<button type="button" data-act="next" aria-label="Next page">[&gt;]</button>' +
      '<button type="button" data-act="last" aria-label="Last page">[&gt;&gt;]</button>' +
      '<span class="pager-status"></span>';
    return bar;
  }

  function paginate(container) {
    var size = parseInt(container.getAttribute('data-paginate'), 10) || 50;
    var table = container.querySelector('table');
    var tbody = table && table.tBodies[0];
    if (!tbody) return;

    var rows = Array.prototype.slice.call(tbody.rows);
    var pages = Math.ceil(rows.length / size);
    if (pages <= 1) return; // nothing to paginate

    var current = 1;
    var top = makeBar();
    var bottom = makeBar();
    container.parentNode.insertBefore(top, container);
    container.parentNode.insertBefore(bottom, container.nextSibling);
    var bars = [top, bottom];

    function render() {
      var start = (current - 1) * size;
      var end = Math.min(start + size, rows.length);
      for (var i = 0; i < rows.length; i++) {
        rows[i].style.display = (i >= start && i < end) ? '' : 'none';
      }
      bars.forEach(function (b) {
        b.querySelector('.pager-input').value = current;
        b.querySelector('.pager-total').textContent = pages;
        b.querySelector('.pager-status').textContent =
          'showing ' + (start + 1) + '–' + end + ' of ' + rows.length;
        b.querySelector('[data-act=first]').disabled = current === 1;
        b.querySelector('[data-act=prev]').disabled = current === 1;
        b.querySelector('[data-act=next]').disabled = current === pages;
        b.querySelector('[data-act=last]').disabled = current === pages;
      });
    }

    function go(p, scroll) {
      current = Math.max(1, Math.min(pages, p || 1));
      render();
      if (scroll) top.scrollIntoView({ block: 'start' });
    }

    bars.forEach(function (b) {
      b.addEventListener('click', function (e) {
        var act = e.target.getAttribute && e.target.getAttribute('data-act');
        if (!act) return;
        if (act === 'first') go(1, true);
        else if (act === 'prev') go(current - 1, true);
        else if (act === 'next') go(current + 1, true);
        else if (act === 'last') go(pages, true);
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

    render();
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-paginate]'), paginate);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
