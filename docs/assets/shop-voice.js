// Gives the shop voice one site tool: connect_to_max.
// A website voice chat cannot forward a phone call, so this opens the visitor's
// dialer to Max's number and points at the Call Now button as the fallback.
(function () {
  var TEL = 'tel:+14062336598';

  function highlightCallNow() {
    var btn = document.querySelector('.header-call-now');
    if (!btn) return;
    btn.classList.add('voice-call-hint');
    setTimeout(function () { btn.classList.remove('voice-call-hint'); }, 6000);
  }

  function connectToMax() {
    highlightCallNow();
    try { window.location.href = TEL; } catch (e) { /* the Call Now button still works */ }
    return 'Opened the phone dialer for Max at 406-233-6598. If it did not open, the visitor can tap Call Now at the top of the page.';
  }

  function attach(widget) {
    widget.addEventListener('elevenlabs-convai:call', function (event) {
      var config = event.detail && event.detail.config;
      if (!config) return;
      config.clientTools = Object.assign({}, config.clientTools, { connect_to_max: connectToMax });
    });
  }

  function init() {
    var widget = document.querySelector('elevenlabs-convai');
    if (widget) attach(widget);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
