/* A callback request is acknowledged only after the receiving endpoint accepts it. */
(function () {
  'use strict';

  var form = document.getElementById('callback-form');
  if (!form) return;

  var endpoint = form.getAttribute('data-endpoint');
  var button = form.querySelector('button[type="submit"]');
  var buttonLabel = document.getElementById('callback-submit-label');
  var entry = document.getElementById('callback-entry');
  var success = document.getElementById('callback-success');
  var failure = document.getElementById('callback-error');
  var failureMessage = document.getElementById('callback-error-message');
  var fields = ['firstName', 'lastName', 'phone'];
  var sending = false;
  var sent = false;
  var leadId = '';
  var ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'campaign_id', 'adset_id', 'ad_id', 'fbclid'];
  var ATTR_COOKIE = 'bb_attr_v1';
  var ATTR_MS = 7 * 24 * 60 * 60 * 1000;

  function field(name) { return form.elements.namedItem(name); }
  function clean(value) { return value.trim().replace(/\s+/g, ' '); }

  function clearError(name) {
    field(name).removeAttribute('aria-invalid');
    document.getElementById('callback-' + name + '-error').textContent = '';
  }

  function setError(name, message) {
    field(name).setAttribute('aria-invalid', 'true');
    document.getElementById('callback-' + name + '-error').textContent = message;
  }

  function validate(values) {
    var errors = {};
    ['firstName', 'lastName'].forEach(function (name) {
      if (!values[name] || values[name].length > 60 || !/\p{L}/u.test(values[name]) || /[<>\u0000-\u001f]/.test(values[name])) {
        errors[name] = name === 'firstName' ? 'Please enter your first name.' : 'Please enter your last name.';
      }
    });
    var digits = values.phone.replace(/\D/g, '');
    if (!/^[+\d\s().-]+$/.test(values.phone) || digits.length < 10 || digits.length > 15) {
      errors.phone = 'Please enter a phone number with 10 to 15 digits.';
    }
    return errors;
  }

  function setSending(pending) {
    sending = pending;
    button.disabled = pending || sent;
    buttonLabel.textContent = pending ? 'Sending your request…' : 'Have Max call me';
    form.setAttribute('aria-busy', String(pending));
    fields.forEach(function (name) { field(name).readOnly = pending; });
  }

  function showFailure(message) {
    failureMessage.textContent = message;
    failure.hidden = false;
    failure.focus();
  }

  function uuid() {
    var cryptoApi = window.crypto;
    if (cryptoApi && typeof cryptoApi.randomUUID === 'function') return cryptoApi.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function sessionStore() {
    try { return window.sessionStorage || null; } catch (error) { return null; }
  }

  function currentLeadId() {
    if (leadId) return leadId;
    var store = sessionStore();
    try {
      var saved = store && store.getItem('bb_lead_id');
      if (saved && /^[0-9a-f-]{36}$/i.test(saved)) {
        leadId = saved;
        return leadId;
      }
    } catch (error) { /* storage can be blocked; the in-memory id still dedupes this page */ }
    leadId = uuid();
    try { if (store) store.setItem('bb_lead_id', leadId); } catch (error) { /* receipt still works */ }
    return leadId;
  }

  function clearLeadId() {
    leadId = '';
    try {
      var store = sessionStore();
      if (store) store.removeItem('bb_lead_id');
    } catch (error) { /* nothing to clear */ }
  }

  function queryMap(href) {
    var out = {};
    var query = String(href || '').split('?')[1] || '';
    query.split('#')[0].split('&').forEach(function (pair) {
      try {
        var cut = pair.indexOf('=');
        var key = decodeURIComponent((cut >= 0 ? pair.slice(0, cut) : pair).replace(/\+/g, ' '));
        if (ATTR_KEYS.indexOf(key) === -1) return;
        var value = decodeURIComponent((cut >= 0 ? pair.slice(cut + 1) : '').replace(/\+/g, ' '));
        if (!(key in out)) out[key] = value;
      } catch (error) { /* A malformed optional tag must never block an inquiry. */ }
    });
    return out;
  }

  function cleanTag(value, key) {
    var text = String(value || '').trim();
    if (!text || text.length > 200 || /[<>{}\u0000-\u001f]/.test(text)) return '';
    // Meta IDs are long numeric strings, not phone numbers. Never parse as Number.
    if (['campaign_id', 'adset_id', 'ad_id', 'utm_id'].indexOf(key) !== -1 && /^\d{1,30}$/.test(text)) return text;
    if (key === 'fbclid') return /^[A-Za-z0-9_-]+$/.test(text) ? text : '';
    if (/\d{10,}/.test(text) || /@/.test(text)) return '';
    return text;
  }

  function pickedTags(source) {
    var tags = {};
    ATTR_KEYS.forEach(function (key) {
      var value = cleanTag(source[key], key);
      if (value) tags[key] = value;
    });
    return tags;
  }

  function readCookie(name) {
    try {
      var parts = String(document.cookie || '').split(';');
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i].trim();
        if (part.indexOf(name + '=') === 0) return decodeURIComponent(part.slice(name.length + 1));
      }
    } catch (error) { /* cookies can be blocked */ }
    return '';
  }

  function writeCookie(name, value) {
    try {
      var secure = String(window.location.href || '').indexOf('https:') === 0 ? '; Secure' : '';
      document.cookie = name + '=' + encodeURIComponent(value) + '; Path=/; Max-Age=' + Math.floor(ATTR_MS / 1000) + '; SameSite=Lax' + secure;
    } catch (error) { /* attribution is optional */ }
  }

  function loadAttribution() {
    var raw = readCookie(ATTR_COOKIE);
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.expiresAt || parsed.expiresAt < Date.now()) return null;
      parsed.first = pickedTags(parsed.first || {});
      parsed.last = pickedTags(parsed.last || {});
      return parsed;
    } catch (error) { return null; }
  }

  function attribution() {
    var incoming = pickedTags(queryMap(window.location.href));
    var record = loadAttribution();
    var now = Date.now();
    if (!record) {
      record = { first: incoming, last: incoming, firstAt: now, lastAt: now, expiresAt: now + ATTR_MS };
    } else if (Object.keys(incoming).length) {
      record.last = incoming;
      record.lastAt = now;
      if (!Object.keys(record.first || {}).length) {
        record.first = incoming;
        record.firstAt = now;
      }
    }
    var known = Object.keys(record.first || {}).length || Object.keys(record.last || {}).length;
    if (known) writeCookie(ATTR_COOKIE, JSON.stringify(record));
    return {
      confidence: known ? 'campaign-tags' : 'unknown',
      first: record.first || {},
      last: record.last || {},
      expiresAt: new Date(record.expiresAt).toISOString()
    };
  }

  function safeAttribution() {
    try { return attribution(); }
    catch (error) { return { confidence: 'unknown', first: {}, last: {} }; }
  }

  // Capture the tagged landing before the visitor browses away without submitting.
  safeAttribution();

  function sourceLine(attr) {
    var tags = Object.keys(attr.first || {}).length ? attr.first : (attr.last || {});
    var parts = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'campaign_id', 'ad_id'].filter(function (key) {
      return tags[key];
    }).map(function (key) { return key + '=' + tags[key]; });
    return parts.length ? 'Source: ' + parts.join(', ') : 'Source: unknown';
  }

  function isQa(values) {
    var first = values.firstName.replace(/\s+/g, ' ').trim().toLowerCase();
    var last = values.lastName.replace(/\s+/g, ' ').trim().toLowerCase();
    var name = (first + ' ' + last).trim();
    if (first === 'qa probe' || last === 'qa probe' || name === 'qa probe' || name === 'qa probe qa probe' || name === 'test thomas') return true;
    return /(?:\?|&)bb_qa=1(?:&|#|$)/.test(String(window.location.href || ''));
  }

  function qaSignal() {
    try {
      return isQa({ firstName: clean(field('firstName').value), lastName: clean(field('lastName').value) });
    } catch (error) { return false; }
  }

  function metaConfig() {
    var cfg = window.BB_META;
    if (!cfg || cfg.enabled !== true || !cfg.datasetId) return null;
    if (cfg.business && String(cfg.business) !== 'bridger-bayworks') return null;
    return cfg;
  }

  function analyticsBlocked() {
    try {
      if (navigator.globalPrivacyControl === true) return true;
      var dnt = navigator.doNotTrack || window.doNotTrack;
      if (dnt === '1' || dnt === 'yes') return true;
    } catch (error) { /* a blocked preference check must not block the inquiry */ }
    return false;
  }

  function queryAllowed() {
    var query = String(window.location.href || '').split('?')[1] || '';
    query = query.split('#')[0];
    if (!query) return true;
    var allowed = { bb_qa: true };
    ATTR_KEYS.forEach(function (key) { allowed[key] = true; });
    var ok = true;
    query.split('&').forEach(function (pair) {
      if (!pair) return;
      var cut = pair.indexOf('=');
      var key = cut >= 0 ? pair.slice(0, cut) : pair;
      var value = cut >= 0 ? pair.slice(cut + 1) : '';
      try {
        key = decodeURIComponent(key.replace(/\+/g, ' '));
        value = decodeURIComponent(value.replace(/\+/g, ' '));
      } catch (error) { ok = false; return; }
      if (!allowed[key] || /phone|email|name/i.test(key) || /@/.test(value)) ok = false;
    });
    return ok;
  }

  function installPixel() {
    var cfg = metaConfig();
    if (!cfg || analyticsBlocked() || !queryAllowed()) return false;
    if (typeof document.createElement !== 'function' || typeof document.getElementsByTagName !== 'function') return false;
    var pixelId = String(cfg.datasetId || '');
    if (!/^\d{5,30}$/.test(pixelId)) return false;
    if (window.__bbPixelId === pixelId) return true;
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      if (s && s.parentNode) s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    try {
      window.fbq('set', 'autoConfig', false, pixelId);
      window.fbq('init', pixelId);
      window.__bbPixelId = pixelId;
      return true;
    } catch (error) { return false; }
  }

  function track(eventName, eventId) {
    try {
      if (!metaConfig() || analyticsBlocked() || !queryAllowed() || qaSignal()) return false;
      installPixel();
      if (typeof window.fbq !== 'function') return false;
      if (eventName === 'Lead') window.fbq('track', 'Lead', {}, { eventID: eventId });
      else window.fbq('trackCustom', 'CallIntent', {}, { eventID: eventId });
      return true;
    } catch (error) { return false; }
  }

  function deliveryNote(receipt) {
    var notify = receipt && receipt.notify;
    if (!notify || typeof notify !== 'object') return '';
    var failed = [];
    if (notify.email === false || notify.email === 'failed') failed.push('email');
    if (notify.sms === false || notify.sms === 'failed') failed.push('text');
    if (!failed.length) return '';
    return 'Your request was accepted, but the ' + failed.join(' and ') + ' alert to Max did not confirm. Please call Max so this is not missed. Reference ' + currentLeadId() + '.';
  }

  function rememberCall(id) {
    try {
      var store = sessionStore();
      if (store) store.setItem('bb_last_call_intent', JSON.stringify({ id: id, at: new Date().toISOString() }));
    } catch (error) { /* call intent must never block the dialer */ }
  }

  function recentCallId() {
    try {
      var store = sessionStore();
      var saved = store && store.getItem('bb_last_call_intent');
      var parsed = saved ? JSON.parse(saved) : null;
      return parsed && parsed.id ? parsed.id : '';
    } catch (error) { return ''; }
  }

  if (typeof document.addEventListener === 'function') {
    document.addEventListener('click', function (event) {
      var node = event.target;
      var link = null;
      while (node) {
        if (node.getAttribute && String(node.getAttribute('href') || '').indexOf('tel:') === 0) {
          link = node;
          break;
        }
        node = node.parentElement || null;
      }
      if (!link) return;
      var id = uuid();
      rememberCall(id);
      track('CallIntent', id);
    }, true);
  }

  fields.forEach(function (name) {
    field(name).addEventListener('input', function () { clearError(name); });
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (sending || sent) return;
    failure.hidden = true;
    fields.forEach(clearError);

    var values = {
      firstName: clean(field('firstName').value),
      lastName: clean(field('lastName').value),
      phone: clean(field('phone').value)
    };
    var errors = validate(values);
    var invalid = fields.filter(function (name) { return errors[name]; });
    if (invalid.length) {
      invalid.forEach(function (name) { setError(name, errors[name]); });
      field(invalid[0]).focus();
      return;
    }

    if (field('bb_check').value) {
      showFailure('We could not submit this request. Please call or text Max using the links below.');
      return;
    }

    if (!endpoint) {
      showFailure('Online requests are unavailable right now. Please call or text Max using the links below.');
      return;
    }

    var controller = new AbortController();
    var timeout = window.setTimeout(function () { controller.abort(); }, 15000);
    var attr = safeAttribution();
    var id = currentLeadId();
    var qa = isQa(values);
    var payload = {
      mode: 'callback',
      firstName: values.firstName,
      lastName: values.lastName,
      name: values.firstName + ' ' + values.lastName,
      phone: values.phone.replace(/\D/g, ''),
      message: 'Callback request\nName: ' + values.firstName + ' ' + values.lastName + '\nPhone: ' + values.phone + '\nPlease call within 24 hours to arrange a bay time; no slot booked.\nLead ID: ' + id + '\n' + sourceLine(attr),
      page: window.location.href,
      submittedAt: new Date().toISOString(),
      leadId: id,
      eventId: id,
      qa: qa,
      attribution: attr,
      recentCallIntentId: recentCallId(),
      // The existing n8n spam check uses company; retain the non-autofilled field name in HTML.
      company: field('bb_check').value,
      bb_check: field('bb_check').value
    };

    setSending(true);
    try {
      var response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
        credentials: 'omit'
      });
      if (!response.ok) throw new Error('Request rejected');
      var receipt = await response.json();
      if (!receipt || receipt.ok !== true) throw new Error('Acceptance not confirmed');

      sent = true;
      if (!qa && receipt.test !== true) track('Lead', id);
      var warning = document.getElementById('callback-delivery-warning');
      if (warning) {
        var note = deliveryNote(receipt);
        warning.hidden = !note;
        warning.textContent = note;
      }
      clearLeadId();
      document.getElementById('callback-customer-name').textContent = values.firstName;
      document.getElementById('callback-customer-phone').textContent = values.phone;
      entry.hidden = true;
      success.hidden = false;
      document.getElementById('callback-request').setAttribute('aria-labelledby', 'callback-success-heading');
      document.getElementById('callback-success-heading').focus();
    } catch (error) {
      showFailure(error.name === 'AbortError'
        ? 'This is taking longer than expected, so we could not confirm your request. Your details are still here. Try again or call Max below.'
        : 'We could not confirm your request was received. Your details are still here. Please try again, or call or text Max below.');
    } finally {
      window.clearTimeout(timeout);
      setSending(false);
    }
  });

  button.disabled = false;

  // Supporting motion never hides the form or waits between a visitor and submit.
  var steps = document.querySelector('.cb-next-steps');
  if (steps) {
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) {
          steps.classList.add('is-visible');
          observer.disconnect();
        }
      }, { threshold: 0.25 });
      observer.observe(steps);
    } else {
      steps.classList.add('is-visible');
    }
  }
})();
