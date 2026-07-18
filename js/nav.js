// Shared header: toggle the collapsed nav dropdown. Pure DOM, no deps.
(function () {
  'use strict';

  var toggle = document.getElementById('menu-toggle');
  var dropdown = document.getElementById('menu-dropdown');
  if (!toggle || !dropdown) return;

  function setOpen(open) {
    dropdown.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  }

  toggle.addEventListener('click', function () {
    setOpen(dropdown.hidden);
  });

  // Close on Escape for keyboard users.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !dropdown.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
})();
