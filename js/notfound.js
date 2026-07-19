// 404 page: inject the requested path into the fake trace, cycle the glitch
// ASCII block, and reroll the joke on click. Pure DOM, no deps.
(function () {
  'use strict';

  var pathEls = document.querySelectorAll('.nf-path');
  var glitchEl = document.getElementById('nf-glitch');
  var factEl = document.getElementById('nf-fact');
  var factBox = document.getElementById('nf-facts');
  if (!pathEls.length && !glitchEl && !factBox) return;

  // Requested path: strip the site base ("/valk-nu/") off window.location.
  var base = (document.body.getAttribute('data-base') || '/');
  var p = window.location.pathname || '';
  if (base && p.indexOf(base) === 0) p = p.slice(base.length);
  p = p.replace(/^\/+|\/+$/g, '');
  if (!p) p = 'undefined';
  Array.prototype.forEach.call(pathEls, function (el) { el.textContent = p; });

  // Glitch ASCII block, cycling every ~700ms.
  if (glitchEl) {
    var glitch = ['▓▓▓ 4 0 4 ▓▓▓', '▓▓▓ N U L L ▓▓▓', '▓▓▓ V O I D ▓▓▓'];
    var gi = 0;
    setInterval(function () {
      gi = (gi + 1) % glitch.length;
      glitchEl.textContent = glitch[gi];
    }, 700);
  }

  // Rerollable facts (advance on click / Enter / Space).
  if (factEl && factBox) {
    var facts = [
      '404 errors are named after a room at CERN that never actually existed. (this is a myth. don\'t fact-check me.)',
      'this page has been visited by 1 lost soul and 0 search engines that will ever rank it.',
      'in an alternate universe, this URL leads to a fully functional page. we do not live there.',
      'you have been awarded 0 achievement points for finding this error.',
      'the developer was warned about this typo in 2019. the developer did not listen.',
      'somewhere, a 404 page is happier than you. it has a hamster wheel. this one does not.',
    ];
    var fi = 0;
    function reroll() {
      fi = (fi + 1) % facts.length;
      factEl.textContent = facts[fi];
    }
    factBox.addEventListener('click', reroll);
    factBox.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reroll(); }
    });
  }
})();
