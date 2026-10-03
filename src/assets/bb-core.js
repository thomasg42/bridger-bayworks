/* Pure logic shared by the browser and the tests. No DOM in here. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BBCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SERVICE_LABELS = {
    lift: 'Lift time',
    tools: 'Tool rental',
    diagnostics: 'Diagnostics / scan tools',
    regular: 'Regular-use rate',
    other: 'A quote for something else',
  };

  function clampHours(h) {
    var n = parseInt(h, 10);
    if (!isFinite(n) || n < 1) return 1;
    return n > 12 ? 12 : n;
  }

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
    var parts = [e.hours + ' hr' + (e.hours > 1 ? 's' : '') + ' lift and shop time'];
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
    return {
      service: Object.prototype.hasOwnProperty.call(SERVICE_LABELS, service) ? service : '',
      hours: hoursRaw && /^\d{1,2}$/.test(hoursRaw) ? clampHours(hoursRaw) : null,
      tools: flag('tools'),
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
  function validate(v) {
    var errs = {};
    if (!v.service) errs.service = 'Pick what you need.';
    if (!v.name || !String(v.name).trim()) errs.name = 'Add your name.';
    if (!phoneOk(v.phone)) errs.phone = 'Add a phone number Max can call or text.';
    if (!emailOk(v.email)) errs.email = 'That email does not look right.';
    if (!v.vehicle || !String(v.vehicle).trim()) errs.vehicle = 'Add the year, make, and model.';
    if (!v.details || !String(v.details).trim()) errs.details = 'Tell Max what the job is.';
    return errs;
  }

  // The written-up request Max reads, whether it arrives by POST, text, or email.
  function message(v) {
    var lines = ['Bay request from the website'];
    lines.push('Need: ' + (SERVICE_LABELS[v.service] || v.service || 'Not given'));
    lines.push('Name: ' + String(v.name || '').trim());
    lines.push('Phone: ' + String(v.phone || '').trim());
    if (v.email) lines.push('Email: ' + String(v.email).trim());
    lines.push('Vehicle: ' + String(v.vehicle || '').trim());
    if (v.date) lines.push('Preferred day: ' + v.date);
    if (v.hours) lines.push('How long: ' + (v.hours === 'full-day' ? 'Full day' : v.hours + ' hr'));
    var adds = [];
    if (v.tools) adds.push('tool access');
    if (v.impact) adds.push('impact guns');
    if (v.coolant) adds.push('coolant disposal');
    if (adds.length) lines.push('Add-ons: ' + adds.join(', '));
    lines.push('Job: ' + String(v.details || '').trim());
    return lines.join('\n');
  }

  function smsHref(e164, body) { return 'sms:' + e164 + '?&body=' + encodeURIComponent(body); }
  function mailtoHref(email, subject, body) {
    return 'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  return {
    SERVICE_LABELS: SERVICE_LABELS,
    estimate: estimate, planLine: planLine, parsePlan: parsePlan, planQuery: planQuery,
    phoneOk: phoneOk, emailOk: emailOk, validate: validate, message: message,
    smsHref: smsHref, mailtoHref: mailtoHref,
  };
});
