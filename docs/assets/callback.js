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
    var payload = {
      mode: 'callback',
      firstName: values.firstName,
      lastName: values.lastName,
      name: values.firstName + ' ' + values.lastName,
      phone: values.phone.replace(/\D/g, ''),
      message: 'Callback request\nName: ' + values.firstName + ' ' + values.lastName + '\nPhone: ' + values.phone + '\nPlease call within 24 hours to arrange a bay time; no slot booked.',
      page: window.location.href,
      submittedAt: new Date().toISOString(),
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
