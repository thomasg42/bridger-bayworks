/* Page behaviour. Motion sells on the way in; the reserve form itself never animates. */
(function () {
  'use strict';
  window.__bbReady = true; // the head script un-hides everything if this never runs
  var CFG = window.BB_CONFIG || {};
  var Core = window.BBCore;
  var motionOK = window.matchMedia && window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

  // ---------- header + mobile nav ----------
  var header = document.querySelector('[data-header]');
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');
  if (toggle && menu) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  }
  var onScrollHeader = function () { if (header) header.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  // ---------- reveal + count-up ----------
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));

  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var prefix = el.getAttribute('data-prefix') || '';
    if (!motionOK || !isFinite(target)) return;
    var start = null, dur = 900;
    var step = function (t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });

    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        countUp(en.target);
        cio.unobserve(en.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  // ---------- signature: the lift rises as you scroll ----------
  var stories = Array.prototype.slice.call(document.querySelectorAll('[data-lift-story]'));
  if (stories.length && motionOK) {
    var RISE = 80; // car roof stays under the overhead beam
    var ticking = false;
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var ease = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
    var update = function () {
      ticking = false;
      var vh = window.innerHeight;
      stories.forEach(function (s) {
        var r = s.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) return;
        var travel = Math.max(1, r.height - vh);
        var p = clamp(-r.top / travel, 0, 1);
        var load = s.querySelector('[data-lift-load]');
        var shadow = s.querySelector('.lift-shadow');
        var meter = s.querySelector('[data-lift-meter]');
        var lift = ease(clamp(p / 0.85, 0, 1));
        if (load) load.style.transform = 'translateY(' + (-RISE * lift).toFixed(1) + 'px)';
        if (shadow) { shadow.style.transform = 'scaleX(' + (1 - 0.35 * lift).toFixed(3) + ')'; shadow.style.opacity = (0.22 - 0.12 * lift).toFixed(3); }
        if (meter) meter.style.transform = 'scaleX(' + p.toFixed(3) + ')';
        var active = Math.min(3, Math.floor(p * 4));
        s.querySelectorAll('.lift-step').forEach(function (li, i) {
          li.classList.toggle('is-active', i === active);
          li.classList.toggle('is-done', i < active);
        });
      });
    };
    var request = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();
  }

  // ---------- home hero video: poster first, video only when motion is welcome ----------
  var heroVideo = document.querySelector('[data-hero-video]');
  if (heroVideo) {
    var rmq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var saveData = typeof navigator !== 'undefined' && navigator.connection && navigator.connection.saveData;
    var heroInView = true;
    var heroPlay = function () {
      if ((rmq && rmq.matches) || saveData || !heroInView) return;
      if (!heroVideo.getAttribute('src')) heroVideo.setAttribute('src', heroVideo.getAttribute('data-src'));
      heroVideo.muted = true;
      var pr = heroVideo.play();
      if (pr && pr.catch) pr.catch(function () { heroVideo.classList.remove('is-playing'); }); // poster stays
    };
    heroVideo.addEventListener('playing', function () { heroVideo.classList.add('is-playing'); });
    if (rmq && rmq.addEventListener) {
      rmq.addEventListener('change', function () {
        if (rmq.matches) { heroVideo.pause(); heroVideo.classList.remove('is-playing'); } else heroPlay();
      });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        heroInView = es[0].isIntersecting;
        if (heroInView) heroPlay(); else heroVideo.pause();
      }, { threshold: 0.1 }).observe(heroVideo);
    }
    heroPlay();
  }

  // ---------- plan builder (rates page) ----------
  var plan = document.querySelector('[data-plan]');
  if (plan && Core && CFG.rates) {
    var hours = plan.querySelector('#plan-hours');
    var hoursOut = plan.querySelector('#plan-hours-out');
    var tools = plan.querySelector('#plan-tools');
    var impact = plan.querySelector('#plan-impact');
    var coolant = plan.querySelector('#plan-coolant');
    var total = plan.querySelector('#plan-total');
    var brk = plan.querySelector('#plan-break');
    var send = plan.querySelector('#plan-send');
    var base = send.getAttribute('href').split('?')[0];
    var render = function () {
      var p = { service: 'lift', hours: hours.value, tools: tools.checked, impact: impact.checked, coolant: coolant.checked };
      var e = Core.estimate(CFG.rates, p);
      hoursOut.textContent = e.hours;
      total.textContent = '$' + e.total;
      brk.textContent = Core.planLine(CFG.rates, p);
      send.setAttribute('href', base + '?' + Core.planQuery(p));
    };
    [hours, tools, impact, coolant].forEach(function (el) { el.addEventListener('input', render); el.addEventListener('change', render); });
    render();
  }

  // ---------- reserve form ----------
  var form = document.getElementById('reserve-form');
  if (form && Core) initForm(form);

  function initForm(form) {
    var thanks = document.getElementById('form-thanks');
    var handoff = document.getElementById('form-handoff');
    var oops = document.getElementById('form-error');
    var btn = form.querySelector('button[type="submit"]');
    var btnLabel = btn.innerHTML;
    var endpoint = form.getAttribute('data-endpoint') || '';
    var sending = false;
    // Always go through namedItem: form.name / form.action are the FORM's own attributes.
    var f = function (n) { return form.elements.namedItem(n); };

    // Prefill from a service page link or the plan builder.
    var pre = Core.parsePlan(window.location.search);
    if (pre.service && !f('service').value) f('service').value = pre.service;
    if (pre.hours && !f('hours').value) f('hours').value = String(pre.hours);
    if (pre.tools) f('tools').checked = true;
    if (pre.impact) f('impact').checked = true;
    if (pre.coolant) f('coolant').checked = true;
    if (pre.hours && CFG.rates && CFG.showPrices && !f('details').value) {
      var e = Core.estimate(CFG.rates, pre);
      f('details').value = 'Plan: ' + Core.planLine(CFG.rates, pre) + ' (estimate $' + e.total + ').\n';
    }

    // No booking in the past.
    var d = new Date();
    f('date').min = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

    var values = function () {
      return {
        service: f('service').value, name: f('name').value, phone: f('phone').value, email: f('email').value,
        vehicle: f('vehicle').value, date: f('date').value, hours: f('hours').value,
        tools: f('tools').checked, impact: f('impact').checked, coolant: f('coolant').checked,
        details: f('details').value,
      };
    };

    var clearErrors = function () {
      form.querySelectorAll('.field.is-invalid').forEach(function (f) { f.classList.remove('is-invalid'); });
      form.querySelectorAll('.field-err').forEach(function (n) { n.remove(); });
      form.querySelectorAll('[aria-invalid]').forEach(function (n) { n.removeAttribute('aria-invalid'); });
    };
    var showErrors = function (errs) {
      var first = null;
      Object.keys(errs).forEach(function (k) {
        var input = f(k);
        if (!input) return;
        var field = input.closest('.field');
        field.classList.add('is-invalid');
        input.setAttribute('aria-invalid', 'true');
        var msg = document.createElement('span');
        msg.className = 'field-err';
        msg.id = 'err-' + k;
        msg.textContent = errs[k];
        field.appendChild(msg);
        input.setAttribute('aria-describedby', msg.id);
        if (!first) first = input;
      });
      if (first) first.focus();
    };
    var hideAll = function () { [thanks, handoff, oops].forEach(function (p) { if (p) p.hidden = true; }); };
    var show = function (panel) { hideAll(); panel.hidden = false; panel.focus({ preventScroll: true }); panel.scrollIntoView({ block: 'center' }); };
    var reset = function () { sending = false; btn.disabled = false; btn.innerHTML = btnLabel; };

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (sending) return;
      clearErrors();
      hideAll();
      var v = values();
      var errs = Core.validate(v);
      if (Object.keys(errs).length) { showErrors(errs); return; }
      if (f('company').value) { show(thanks); form.hidden = true; return; } // honeypot: bots get a quiet "sent"

      var text = Core.message(v);
      var smsLink = Core.smsHref(CFG.phoneE164, text);
      var errSms = document.getElementById('error-sms');
      if (errSms) errSms.setAttribute('href', smsLink);

      if (!endpoint) {
        // No backend wired yet: hand the visitor a ready-to-send text/email to Max.
        document.getElementById('handoff-sms').setAttribute('href', smsLink);
        document.getElementById('handoff-mail').setAttribute('href', Core.mailtoHref(CFG.email, 'Bay request: ' + v.name.trim(), text));
        show(handoff);
        return;
      }

      sending = true;
      btn.disabled = true;
      btn.textContent = 'Sending...';
      var payload = Object.assign({}, v, { message: text, page: window.location.href, submittedAt: new Date().toISOString() });
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) {
          // A 4xx/5xx still resolves; only r.ok means the request reached Max.
          if (!r.ok) throw new Error('HTTP ' + r.status);
          form.hidden = true;
          show(thanks);
        })
        .catch(function () {
          reset(); // every value the visitor typed stays in the form
          show(oops);
        });
    });
  }
})();
