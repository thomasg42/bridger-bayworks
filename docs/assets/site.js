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
    // Prices must be readable and accurate at every frame, including while scrolling.
    if (prefix === '$') return;
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
        // Progress through the compact section without an empty multi-screen spacer.
        var travel = Math.max(1, r.height + vh * 0.2);
        var p = clamp((vh * 0.75 - r.top) / travel, 0, 1);
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

  // ---------- home hero: the shop clip plays on a loop behind the text ----------
  // Poster first. The 1 MB clip downloads only when motion is welcome and Save-Data is off, and
  // it fades in only once it is really playing, so a refused autoplay (iPhone Low Power Mode)
  // leaves the photo, never a play icon. Low Power Mode does allow play() inside a tap, so the
  // first tap anywhere tries again. The corner button pauses it (moving content needs a stop).
  var hero = document.querySelector('[data-hero-slot]');
  var heroVideo = hero && hero.querySelector('[data-hero-video]');
  var saveData = typeof navigator !== 'undefined' && navigator.connection && navigator.connection.saveData;
  if (heroVideo && typeof heroVideo.play === 'function' && motionOK && !saveData) bootHeroLoop();

  function bootHeroLoop() {
    var toggle = hero.querySelector('[data-video-toggle]');
    var rmq = window.matchMedia('(prefers-reduced-motion: reduce)');
    var inView = true, userPaused = false;

    var play = function () {
      if (userPaused || !inView || rmq.matches) return;
      var p = heroVideo.play();
      if (p && typeof p.catch === 'function') p.catch(function () {}); // refused: the poster stays up
    };
    var syncToggle = function () {
      if (!toggle) return;
      var paused = heroVideo.paused;
      toggle.classList.toggle('is-paused', paused);
      toggle.setAttribute('aria-label', paused ? 'Play the background video' : 'Pause the background video');
    };
    var retry = function () { if (heroVideo.paused) play(); };
    var stopRetrying = function () {
      document.removeEventListener('touchend', retry);
      document.removeEventListener('click', retry);
    };

    heroVideo.addEventListener('playing', function () {
      heroVideo.classList.add('is-playing');
      if (toggle) toggle.hidden = false;
      syncToggle();
      stopRetrying();
    });
    heroVideo.addEventListener('pause', syncToggle);
    heroVideo.addEventListener('error', function () {
      heroVideo.classList.remove('is-playing');
      if (toggle) toggle.hidden = true;
    });
    if (toggle) {
      toggle.addEventListener('click', function () {
        if (heroVideo.paused) { userPaused = false; play(); } else { userPaused = true; heroVideo.pause(); }
        syncToggle();
      });
    }
    document.addEventListener('touchend', retry, { passive: true });
    document.addEventListener('click', retry);

    // Off screen it stops decoding; back on screen it carries on (unless the visitor paused it).
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[entries.length - 1].isIntersecting;
        if (inView) play();
        else if (!heroVideo.paused) heroVideo.pause();
      }).observe(hero);
    }
    if (rmq.addEventListener) {
      rmq.addEventListener('change', function () {
        if (!rmq.matches) { play(); return; }
        heroVideo.pause(); // back to the still poster
        heroVideo.classList.remove('is-playing');
        if (toggle) toggle.hidden = true;
      });
    }

    heroVideo.muted = true; // iOS checks the property, not only the attribute
    heroVideo.preload = 'auto';
    heroVideo.setAttribute('src', heroVideo.getAttribute('data-src'));
    play();
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
    // Browsers may restore form controls after scripts run during Back navigation.
    window.addEventListener('pageshow', function () { window.setTimeout(render, 0); });
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
    var B = CFG.booking || null;
    var jobs = CFG.jobs || [];

    // Prefill from a service page link or the plan builder.
    var pre = Core.parsePlan(window.location.search);
    if (pre.service && !f('service').value) f('service').value = pre.service;
    if (pre.tools) f('tools').checked = true;
    if (pre.impact) f('impact').checked = true;
    if (pre.coolant) f('coolant').checked = true;
    var symptom = new URLSearchParams(window.location.search).get('symptom');
    var symptomCopy = { rattle: 'I am noticing a rattle or unusual noise. It happens when: ', leak: 'I am noticing oil spots or a fluid leak. Here is what I see: ', brakes: 'I would like to check my brakes. Here is what I notice: ' };
    if (Object.prototype.hasOwnProperty.call(symptomCopy, symptom) && !f('details').value) f('details').value = symptomCopy[symptom];
    if (pre.hours && CFG.rates && CFG.showPrices && !f('details').value) {
      var e = Core.estimate(CFG.rates, pre);
      f('details').value = 'Plan: ' + Core.planLine(CFG.rates, pre) + ' (estimate $' + e.total + ').\n';
    }

    // ---------- time: book an open slot on Max's calendar, or we call to set one ----------
    // Tomorrow's schedule is already set, so the first day on offer (and the earliest preferred
    // day for a call-back) is the day after tomorrow on the shop's clock.
    var days = B ? Core.bookingDays(Date.now(), B) : [];
    var minDate = days[0] || '';
    if (minDate) f('date').min = minDate;
    var jobRow = document.getElementById('job-row');
    var jobHint = document.getElementById('f-job-hint');
    var jobHintDefault = jobHint ? jobHint.textContent : '';
    var picker = document.getElementById('slot-picker');
    var pickerNote = document.getElementById('slot-note');
    var dayList = document.getElementById('slot-days');
    var timeList = document.getElementById('slot-times');
    var callback = document.getElementById('callback');
    var callbackNote = document.getElementById('callback-note');
    var callbackDefault = callbackNote ? callbackNote.textContent : '';
    var busy = null, loadState = 'idle', anyOpen = false, chosenDay = '', chosenHour = null;

    var needHours = function () { return Core.bookingHours({ service: f('service').value, job: f('job').value }, CFG); };

    // One availability call per page view, and only once someone picks something bookable.
    var loadBusy = function () {
      if (loadState !== 'idle') return;
      if (!B || !B.availabilityEndpoint || !days.length || typeof fetch !== 'function') { loadState = 'failed'; return; }
      loadState = 'loading';
      fetch(B.availabilityEndpoint + '?from=' + days[0] + '&to=' + Core.addDaysKey(days[days.length - 1], 1))
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (data) {
          if (!data || data.ok !== true) throw new Error('bad availability');
          busy = Core.normalizeBusy(data.busy, B.timeZone);
          loadState = 'ready';
          render();
        })
        .catch(function () { loadState = 'failed'; render(); });
    };

    var drawPicker = function (hours) {
      dayList.innerHTML = '';
      timeList.innerHTML = '';
      if (loadState !== 'ready') { pickerNote.textContent = 'Checking our calendar…'; return; }
      var open = {};
      var firstOpen = '';
      days.forEach(function (d) { open[d] = Core.openStarts(d, hours, busy, B); if (!firstOpen && open[d].length) firstOpen = d; });
      anyOpen = !!firstOpen;
      if (!anyOpen) return;
      if (!open[chosenDay] || !open[chosenDay].length) { chosenDay = firstOpen; chosenHour = null; }
      if (chosenHour !== null && open[chosenDay].indexOf(chosenHour) < 0) chosenHour = null;
      dayList.innerHTML = days.map(function (d) {
        var parts = Core.dayShort(d).split(' ');
        var full = !open[d].length;
        return '<label class="slot' + (full ? ' is-full' : '') + '"><input type="radio" name="slotDay" value="' + d + '"' +
          (d === chosenDay ? ' checked' : '') + (full ? ' disabled' : '') + '><span><b>' + parts[0] + '</b>' + parts[1] + ' ' + parts[2] +
          (full ? '<small>Full</small>' : '') + '</span></label>';
      }).join('');
      timeList.innerHTML = open[chosenDay].map(function (h) {
        return '<label class="slot"><input type="radio" name="slotTime" value="' + h + '"' + (h === chosenHour ? ' checked' : '') +
          '><span>' + Core.hourLabel(h) + '</span></label>';
      }).join('');
      pickerNote.textContent = chosenHour === null
        ? 'Open times on ' + Core.dayShort(chosenDay) + '. We book ' + Core.hrs(hours) + ' for you.'
        : 'Your time: ' + Core.slotLabel(chosenDay, chosenHour, hours) + '.';
    };

    var render = function () {
      var isLift = f('service').value === 'lift';
      if (jobRow) jobRow.hidden = !isLift;
      var job = isLift ? Core.findJob(jobs, f('job').value) : null;
      if (jobHint) jobHint.textContent = job ? Core.jobHint(job) : jobHintDefault;
      var hours = needHours();
      if (hours) loadBusy();
      if (hours && loadState === 'ready') drawPicker(hours);
      // Calendar down, or nothing open in the window: fall back to a call-back request.
      var fallback = hours && (loadState === 'failed' || (loadState === 'ready' && !anyOpen));
      var booking = !!hours && !fallback;
      picker.hidden = !booking;
      if (booking && loadState !== 'ready') drawPicker(hours);
      callback.hidden = booking || !f('service').value;
      callbackNote.textContent = !fallback ? callbackDefault
        : loadState === 'failed' ? 'We couldn’t load our calendar just now. Pick a day and we’ll call you to set the time.'
          : 'No open times in the next ' + days.length + ' days. Pick a day and we’ll call you to find one.';
    };

    picker.addEventListener('change', function (ev) {
      var t = ev.target;
      if (t.name === 'slotDay') { chosenDay = t.value; chosenHour = null; }
      else if (t.name === 'slotTime') chosenHour = parseInt(t.value, 10);
      else return;
      render();
      // Redrawing replaced the radios; keep keyboard focus on the one just picked.
      var again = picker.querySelector('input[name="' + t.name + '"][value="' + t.value + '"]');
      if (again && again.focus) again.focus();
    });
    f('service').addEventListener('change', render);
    f('job').addEventListener('change', render);
    render();

    var values = function () {
      var service = f('service').value;
      var v = {
        service: service, name: f('name').value, phone: f('phone').value, email: f('email').value,
        vehicle: f('vehicle').value, job: service === 'lift' ? f('job').value : '',
        tools: f('tools').checked, impact: f('impact').checked, coolant: f('coolant').checked,
        details: f('details').value,
        // Sent as emailOk, never notify: the n8n email once printed "Texts/emails OK" from
        // body.notify, and this box only covers email.
        emailOk: f('notify').checked,
      };
      var hours = needHours();
      if (hours && !picker.hidden && chosenDay && chosenHour !== null) {
        var range = Core.slotRange(chosenDay, chosenHour, hours, B.timeZone);
        v.slotDay = chosenDay; v.slotHour = chosenHour; v.slotHours = hours;
        v.slotStart = range.start; v.slotEnd = range.end;
        v.slotLabel = Core.slotLabel(chosenDay, chosenHour, hours);
      } else if (!callback.hidden) {
        v.date = f('date').value;
      }
      var job = Core.findJob(jobs, v.job);
      v.jobLabel = service === 'diagnostics' ? 'Diagnosis' : job ? job.label : '';
      return v;
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
      if (first && first.focus) first.focus();
    };
    var hideAll = function () { [thanks, handoff, oops].forEach(function (p) { if (p) p.hidden = true; }); };
    var show = function (panel) { hideAll(); panel.hidden = false; panel.focus({ preventScroll: true }); panel.scrollIntoView({ block: 'center' }); };
    var reset = function () { sending = false; btn.disabled = false; btn.innerHTML = btnLabel; };
    var showThanks = function (v) {
      if (v.slotLabel) {
        document.getElementById('thanks-h').textContent = 'You’re booked.';
        document.getElementById('thanks-slot').textContent = v.slotLabel;
        document.getElementById('thanks-booked').hidden = false;
        document.getElementById('thanks-call').hidden = true;
      }
      form.hidden = true;
      show(thanks);
    };
    // Someone else took that time between loading the calendar and sending: reload and ask again.
    var slotTaken = function () {
      reset();
      loadState = 'idle'; busy = null; chosenHour = null;
      render();
      clearErrors();
      showErrors({ slot: 'That time was just booked. Pick another time.' });
    };

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (sending) return;
      clearErrors();
      hideAll();
      var v = values();
      var errs = Core.validate(v, { minDate: minDate, needSlot: !!needHours() && !picker.hidden && loadState === 'ready' });
      if (Object.keys(errs).length) { showErrors(errs); return; }
      if (f('bb_check').value) { show(thanks); form.hidden = true; return; } // honeypot: bots get a quiet "sent"

      var text = Core.message(v, { jobs: jobs });
      var smsLink = Core.smsHref(CFG.phoneE164, text);
      var errSms = document.getElementById('error-sms');
      if (errSms) errSms.setAttribute('href', smsLink);

      if (!endpoint) {
        // No backend wired: hand the visitor a ready-to-send text/email to Max.
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
          if (r.status === 409) { slotTaken(); return; }
          // A 4xx/5xx still resolves; only r.ok means the request reached Max.
          if (!r.ok) throw new Error('HTTP ' + r.status);
          showThanks(v);
        })
        .catch(function () {
          reset(); // every value the visitor typed stays in the form
          show(oops);
        });
    });
  }
})();
