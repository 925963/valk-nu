// Contact page boot sequence: types the diagnostic lines in one at a time,
// then reveals the email panel. Click/Enter on the terminal skips to the end.
// Progressive enhancement — the email also lives in a <noscript> fallback.
(function () {
  'use strict';

  var lines = document.getElementById('contact-lines');
  if (!lines) return; // only runs on the contact page

  var term = document.getElementById('contact-term');
  var prompt = document.getElementById('contact-prompt');
  var reveal = document.getElementById('contact-reveal');
  var foot = document.getElementById('contact-foot');

  var SCRIPT = [
    { t: '$ locate contact_methods.db', cls: 'ct-bright', g: 10 },
    { t: 'searching known universe...', cls: 'ct-dim', g: 4 },
    { t: 'FOUND: 1 result', cls: 'ct-dim', g: 10 },
    { t: '$ ./run_diagnostics.sh --channel=all', cls: 'ct-bright', g: 10 },
    { t: '  [ CARRIER PIGEON ]  ......... STATUS: MIA since 1997', cls: 'ct-red', g: 2 },
    { t: '  [ FAX MACHINE ]     ......... STATUS: exists, regrets exist too', cls: 'ct-red', g: 2 },
    { t: '  [ PHONE CALL ]      ......... STATUS: anxiety.exe crashed', cls: 'ct-red', g: 2 },
    { t: '  [ SMOKE SIGNALS ]   ......... STATUS: HOA complaint filed', cls: 'ct-red', g: 2 },
    { t: '  [ ELECTRONIC MAIL ] ......... STATUS: ✓ ONLINE', cls: 'ct-light', g: 10 },
    { t: '$ sudo decrypt contact.gpg', cls: 'ct-bright', g: 6 },
    { t: '[sudo] this is a personal site, there is no password, just kidding', cls: 'ct-dim', g: 4 },
    { t: 'access granted.', cls: 'ct-light', g: 8 },
  ];

  var FOOT_DONE = 'no forms. no chatbots. no "we\'ll get back to you within 3-5 business days." just email.';

  var shown = 0;
  var done = false;
  var timer = null;

  function addLine(i) {
    var s = SCRIPT[i];
    var d = document.createElement('div');
    d.className = 'contact-line ' + s.cls;
    d.textContent = s.t;
    d.style.marginBottom = s.g + 'px';
    lines.appendChild(d);
  }

  function finish() {
    if (done) return;
    done = true;
    if (timer) { clearInterval(timer); timer = null; }
    while (shown < SCRIPT.length) { addLine(shown); shown++; }
    if (prompt) prompt.hidden = false;
    if (reveal) reveal.hidden = false;
    if (foot) foot.textContent = FOOT_DONE;
  }

  function tick() {
    if (shown >= SCRIPT.length) { finish(); return; }
    addLine(shown);
    shown++;
    if (shown >= SCRIPT.length) finish();
  }

  timer = setInterval(tick, 550);

  function skip() { if (!done) finish(); }
  if (term) {
    term.addEventListener('click', skip);
    term.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skip(); }
    });
  }
})();
