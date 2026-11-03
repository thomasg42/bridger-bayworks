/* Pure logic shared by the browser and the tests. No DOM in here. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BBCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // The three things a visitor can ask for, in order of what matters most (Thomas, 2026-11-02).
  var SERVICE_LABELS = {
    lift: 'Lift time',
    diagnostics: 'Diagnostics and scan tools',
    quote: 'Just get a quote',
  };
  // Links and ads from before 2026-11-02 still use the old values; send them somewhere sensible.
  // ?service=tools becomes lift time with the tool access add-on ticked.
  var SERVICE_ALIASES = { tools: 'lift', regular: 'quote', other: 'quote' };

  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var HOUR = 3600000;
  var has = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };

  function clampHours(h) {
    var n = parseInt(h, 10);
    if (!isFinite(n) || n < 1) return 1;
    return n > 12 ? 12 : n;
  }

  function hrs(n) { return n + ' hr' + (n === 1 ? '' : 's'); }

  // Lift and add-on hourly charges scale with hours; coolant disposal is a flat fee.
  function estimate(rates, plan) {
    var hours = clampHours(plan.hours);
    var lift = hours * rates.lift;
    var tools = plan.tools ? hours * rates.tools : 0;
    var impact = plan.impact ? hours * rates.impact : 0;
    var coolant = plan.coolant ? rates.coolantDisposal : 0;
    return { hours: hours, lift: lift, tools: tools, impact: impact, coolant: coolant, total: lift + tools + impact + coolant };
  }

  function planLine(rates, plan) {
    var e = estimate(rates, plan);
    var parts = [hrs(e.hours) + ' lift and shop time'];
    if (plan.tools) parts.push('tool access');
    if (plan.impact) parts.push('impact guns');
    if (plan.coolant) parts.push('coolant disposal');
    return parts.join(' + ');
  }

  // Reads ?service=&hours=&tools=&impact=&coolant= into a clean plan. Unknown values are dropped.
  function parsePlan(search) {
    var p = new URLSearchParams(search || '');
    var service = p.get('service');
    var hoursRaw = p.get('hours');
    var flag = function (k) { return p.get(k) === '1'; };
    var legacyTools = service === 'tools';
    if (service && has(SERVICE_ALIASES, service)) service = SERVICE_ALIASES[service];
    return {
      service: service && has(SERVICE_LABELS, service) ? service : '',
      hours: hoursRaw && /^\d{1,2}$/.test(hoursRaw) ? clampHours(hoursRaw) : null,
      tools: flag('tools') || legacyTools,
      impact: flag('impact'),
      coolant: flag('coolant'),
    };
  }

  function planQuery(plan) {
    var q = { service: plan.service || 'lift', hours: String(clampHours(plan.hours)) };
    if (plan.tools) q.tools = '1';
    if (plan.impact) q.impact = '1';
    if (plan.coolant) q.coolant = '1';
    return new URLSearchParams(q).toString();
  }

  // ---------- jobs: what goes on Max's calendar ----------

  function findJob(jobs, id) {
    if (!id || !jobs) return null;
    for (var i = 0; i < jobs.length; i++) if (jobs[i].id === id) return jobs[i];
    return null;
  }
  // Hours to book on Max's calendar, or null when we call the visitor to set a time instead.
  // Diagnosis is a fixed bay; lift time books only for a job with a known length.
  function bookingHours(v, cfg) {
    var b = cfg && cfg.booking;
    if (!b) return null;
    if (v.service === 'diagnostics') return b.diagnosticsHours || null;
    if (v.service !== 'lift') return null;
    var job = findJob(cfg.jobs, v.job);
    return job ? job.bayHours : null;
  }
  function jobHint(job) {
    return job.bayHours > job.hours
      ? job.label + ': about ' + hrs(job.hours) + ' of work. We book ' + hrs(job.bayHours) + ' so you’re not rushed.'
      : job.label + ': we book ' + hrs(job.bayHours) + '.';
  }

  // ---------- dates and time zones (Intl only, no library) ----------
  // Bookings run on the shop's clock (America/Denver), whatever zone the visitor's phone is in.

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function keyOf(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }
  function parseKey(key) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ''));
    return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
  }
  function zoneParts(ms, tz) {
    var out = {};
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(new Date(ms)).forEach(function (p) { if (p.type !== 'literal') out[p.type] = parseInt(p.value, 10); });
    return out;
  }
  // Minutes the zone is ahead of UTC at that instant (Denver: -420 in winter, -360 in summer).
  function tzOffsetMin(ms, tz) {
    var p = zoneParts(ms, tz);
    return Math.round((Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second) - Math.floor(ms / 1000) * 1000) / 60000);
  }
  // The instant (ms) of wall-clock `hour`:00 on day `key` in `tz`. Two passes settle DST changes.
  function zonedToUtc(key, hour, tz) {
    var k = parseKey(key);
    var guess = Date.UTC(k.y, k.m - 1, k.d, hour);
    var ms = guess - tzOffsetMin(guess, tz) * 60000;
    return guess - tzOffsetMin(ms, tz) * 60000;
  }
  function dateKeyInZone(ms, tz) { var p = zoneParts(ms, tz); return keyOf(p.year, p.month, p.day); }
  function addDaysKey(key, n) {
    var k = parseKey(key);
    var d = new Date(Date.UTC(k.y, k.m - 1, k.d + n));
    return keyOf(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  // Days a visitor can book. Tomorrow is already set, so on Monday the first day is Wednesday.
  function bookingDays(nowMs, b) {
    var first = addDaysKey(dateKeyInZone(nowMs, b.timeZone), b.firstDay);
    var out = [];
    for (var i = 0; i < b.days; i++) out.push(addDaysKey(first, i));
    return out;
  }

  // "2026-11-04" -> "Wed Nov 4, 2026", the same on every device.
  function dayLabel(key) {
    var k = parseKey(key);
    if (!k) return String(key || '');
    var d = new Date(Date.UTC(k.y, k.m - 1, k.d));
    return DAYS[d.getUTCDay()] + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + k.y;
  }
  function dayShort(key) { return dayLabel(key).replace(/, \d{4}$/, ''); }
  function hourLabel(h) { return ((h + 11) % 12 + 1) + ':00 ' + (h % 24 < 12 ? 'AM' : 'PM'); }

  // ---------- open slots ----------

  // The availability endpoint returns { start, end } instants, or { allDay, start, end } dates.
  // All-day entries block whole days on the shop's clock.
  function normalizeBusy(list, tz) {
    var out = [];
    (list || []).forEach(function (b) {
      if (!b || !b.start) return;
      if (b.allDay) {
        if (!parseKey(b.start)) return;
        out.push([zonedToUtc(b.start, 0, tz), zonedToUtc(parseKey(b.end) ? b.end : addDaysKey(b.start, 1), 0, tz)]);
        return;
      }
      var s = Date.parse(b.start), e = Date.parse(b.end || b.start);
      if (isFinite(s) && isFinite(e)) out.push([s, e]);
    });
    return out;
  }
  // Whole-hour start times on `key` where `hours` fit inside opening hours and clash with nothing.
  function openStarts(key, hours, busy, b) {
    var out = [];
    for (var h = b.openHour; h + hours <= b.closeHour; h++) {
      var s = zonedToUtc(key, h, b.timeZone), e = s + hours * HOUR;
      var clash = false;
      for (var i = 0; i < busy.length; i++) if (busy[i][0] < e && busy[i][1] > s) { clash = true; break; }
      if (!clash) out.push(h);
    }
    return out;
  }
  function slotLabel(key, hour, hours) { return dayShort(key) + ', ' + hourLabel(hour) + ' to ' + hourLabel(hour + hours); }
  function slotRange(key, hour, hours, tz) {
    var s = zonedToUtc(key, hour, tz);
    return { start: new Date(s).toISOString(), end: new Date(s + hours * HOUR).toISOString() };
  }

  // ---------- validation ----------

  function digitCount(s) { return String(s || '').replace(/\D/g, '').length; }
  function phoneOk(s) {
    var d = digitCount(s);
    return d >= 10 && d <= 15 && /^[0-9\s().+\-]+$/.test(String(s).trim());
  }
  function emailOk(s) {
    if (!s) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s).trim());
  }

  // Returns { field: message } for every problem. Empty object = valid.
  // opts.minDate (YYYY-MM-DD): earliest preferred day. opts.needSlot: a day and time must be picked.
  function validate(v, opts) {
    var errs = {};
    var minDate = opts && opts.minDate;
    if (!v.service) errs.service = 'Pick what you need.';
    if (!v.name || !String(v.name).trim()) errs.name = 'Add your name.';
    if (!phoneOk(v.phone)) errs.phone = 'Add a phone number we can call or text.';
    if (!emailOk(v.email)) errs.email = 'That email does not look right.';
    if (!v.vehicle || !String(v.vehicle).trim()) errs.vehicle = 'Add the year, make, and model.';
    if (opts && opts.needSlot && !(v.slotStart && v.slotEnd)) errs.slot = 'Pick a day and time.';
    // Only compare real YYYY-MM-DD values; a browser without a date picker may send "11/04/2026".
    if (v.date && minDate && parseKey(v.date) && String(v.date) < minDate) errs.date = 'Pick ' + dayShort(minDate) + ' or later.';
    if (!v.details || !String(v.details).trim()) errs.details = 'Tell us what’s going on with your car.';
    return errs;
  }

  // The written-up request Max reads, whether it arrives by POST, text, or email.
  // opts.jobs: the job presets from the site config, so the job reads as words, not an id.
  function message(v, opts) {
    var jobs = (opts && opts.jobs) || [];
    var lines = ['Bay request from the website'];
    lines.push('Need: ' + (SERVICE_LABELS[v.service] || v.service || 'Not given'));
    lines.push('Name: ' + String(v.name || '').trim());
    lines.push('Phone: ' + String(v.phone || '').trim());
    if (v.email) lines.push('Email: ' + String(v.email).trim());
    lines.push('Vehicle: ' + String(v.vehicle || '').trim());
    var job = findJob(jobs, v.job);
    if (job) lines.push('Job: ' + job.label + ' (about ' + hrs(job.hours) + ' of work)');
    else if (v.job === 'other') lines.push('Job: Something else');
    if (v.slotLabel) lines.push('Booked online: ' + v.slotLabel + ' (' + hrs(v.slotHours) + ')');
    else lines.push('Time: call them to set one' + (v.date ? '. Preferred day: ' + dayLabel(v.date) : ''));
    var adds = [];
    if (v.tools) adds.push('tool access');
    if (v.impact) adds.push('impact guns');
    if (v.coolant) adds.push('coolant disposal');
    if (adds.length) lines.push('Add-ons: ' + adds.join(', '));
    lines.push("What's going on: " + String(v.details || '').trim());
    if (v.email) lines.push('Email updates OK: ' + (v.emailOk ? 'yes' : 'no'));
    return lines.join('\n');
  }

  function smsHref(e164, body) { return 'sms:' + e164 + '?&body=' + encodeURIComponent(body); }
  function mailtoHref(email, subject, body) {
    return 'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  return {
    SERVICE_LABELS: SERVICE_LABELS, SERVICE_ALIASES: SERVICE_ALIASES,
    estimate: estimate, planLine: planLine, parsePlan: parsePlan, planQuery: planQuery,
    findJob: findJob, bookingHours: bookingHours, jobHint: jobHint, hrs: hrs,
    zonedToUtc: zonedToUtc, dateKeyInZone: dateKeyInZone, addDaysKey: addDaysKey, bookingDays: bookingDays,
    dayLabel: dayLabel, dayShort: dayShort, hourLabel: hourLabel,
    normalizeBusy: normalizeBusy, openStarts: openStarts, slotLabel: slotLabel, slotRange: slotRange,
    phoneOk: phoneOk, emailOk: emailOk, validate: validate, message: message,
    smsHref: smsHref, mailtoHref: mailtoHref,
  };
});
