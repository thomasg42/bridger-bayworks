/* Bridger Bayworks, 2026-11-12. A tap on any Call link opens the phone right away: nothing here
   stops, delays or redirects it. This only adds a short note on the page behind the dialer, with
   the shop's number (for a computer that has no phone app) and, in a week with open spots, a
   reminder to ask for one. The spots number is never changed here: no countdown, no reset. */
(function () {
  'use strict';
  var me = document.currentScript;
  var phone = (me && me.getAttribute('data-phone')) || '';
  var name = (me && me.getAttribute('data-name')) || 'the shop';
  var timer = 0;

  // Built once, up front, so screen readers already know the status region when it speaks.
  var note = document.createElement('div');
  note.className = 'call-note';
  note.setAttribute('role', 'status');
  note.hidden = true;
  note.innerHTML = '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-phone"></use></svg>'
    + '<p></p><button type="button" class="call-note-close" aria-label="Close">×</button>';
  document.body.appendChild(note);
  var text = note.querySelector('p');

  function close() {
    note.hidden = true;
    clearTimeout(timer);
  }

  function show() {
    var spots = document.documentElement.classList.contains('has-spots');
    var strong = document.createElement('strong');
    strong.textContent = 'Calling ' + name;
    text.textContent = '';
    text.appendChild(strong);
    text.appendChild(document.createTextNode(' ' + phone + (spots ? '. Ask about this week’s open spots.' : '.')));
    note.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(close, 9000);
  }

  note.querySelector('button').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  document.addEventListener('click', function (e) {
    var t = e.target;
    var link = t && t.closest ? t.closest('a[href^="tel:"]') : null;
    if (link) show();
  });
})();
