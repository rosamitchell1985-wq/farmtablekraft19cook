/* ==========================================================================
   FARM TABLE KRAFT - shared behaviour
   Vanilla JS, no dependencies, no build step.

   01  Boot flags
   02  Image fallback safety net
   03  Header: mobile drawer + dropdown menus
   04  Accordions
   05  Scroll reveal
   06  Back to top
   07  Cookie consent
   08  Form validation
   09  Gallery filter
   10  Small helpers (year stamp, order totals, date floors)
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------ 01 */
  // Mark that JS is available so CSS can safely opt into reveal animations.
  document.documentElement.classList.add('js');

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState !== 'loading') { fn(); }
    else { document.addEventListener('DOMContentLoaded', fn); }
  }

  /* ------------------------------------------------------------------ 02 */
  /* If a remote photo fails to load, swap in a same-subject fallback so the
     layout never collapses into a broken-image box. */
  document.addEventListener(
    'error',
    function (event) {
      var el = event.target;
      if (!el || el.tagName !== 'IMG' || el.dataset.fallbackApplied) return;
      el.dataset.fallbackApplied = '1';
      var seed = el.dataset.seed || (el.alt || 'farm-table-kraft').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
      var w = el.getAttribute('width') || 1200;
      var h = el.getAttribute('height') || 800;
      el.src = 'https://picsum.photos/seed/' + encodeURIComponent(seed) + '/' + w + '/' + h;
    },
    true
  );

  /* ------------------------------------------------------------------ 03 */
  function initHeader() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('primary-nav');
    if (!toggle || !nav) return;

    var desktop = window.matchMedia('(min-width: 1024px)');

    function closeDrawer() {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    }

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });

    // Dropdown groups
    var triggers = Array.prototype.slice.call(nav.querySelectorAll('.nav-trigger'));

    function closeAllMenus(except) {
      triggers.forEach(function (t) {
        if (t === except) return;
        t.setAttribute('aria-expanded', 'false');
        var m = document.getElementById(t.getAttribute('aria-controls'));
        if (m) m.classList.remove('is-open');
      });
    }

    triggers.forEach(function (trigger) {
      var menu = document.getElementById(trigger.getAttribute('aria-controls'));
      if (!menu) return;

      trigger.addEventListener('click', function () {
        var open = trigger.getAttribute('aria-expanded') === 'true';
        closeAllMenus(trigger);
        trigger.setAttribute('aria-expanded', String(!open));
        menu.classList.toggle('is-open', !open);
      });

      // Pointer convenience on desktop only. Keyboard path stays click based.
      var item = trigger.closest('.nav-item');
      if (item) {
        item.addEventListener('mouseenter', function () {
          if (!desktop.matches) return;
          closeAllMenus(trigger);
          trigger.setAttribute('aria-expanded', 'true');
          menu.classList.add('is-open');
        });
        item.addEventListener('mouseleave', function () {
          if (!desktop.matches) return;
          trigger.setAttribute('aria-expanded', 'false');
          menu.classList.remove('is-open');
        });
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeAllMenus(null);
      if (!desktop.matches) closeDrawer();
    });

    document.addEventListener('click', function (e) {
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      closeAllMenus(null);
      if (!desktop.matches) closeDrawer();
    });

    // Focus leaving the header closes any open menu.
    document.addEventListener('focusin', function (e) {
      var header = document.querySelector('.site-header');
      if (header && !header.contains(e.target)) closeAllMenus(null);
    });

    desktop.addEventListener('change', function () {
      closeAllMenus(null);
      closeDrawer();
    });
  }

  /* ------------------------------------------------------------------ 04 */
  function initAccordions() {
    var buttons = document.querySelectorAll('.accordion__btn');
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function () {
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        if (!panel) return;
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        panel.classList.toggle('is-open', !open);
      });
    });

    // Deep link support: /faq.html#q-parking opens that answer.
    if (window.location.hash) {
      var target = document.querySelector(window.location.hash);
      if (target && target.classList.contains('accordion__panel')) {
        var trigger = document.querySelector('[aria-controls="' + target.id + '"]');
        if (trigger) {
          trigger.setAttribute('aria-expanded', 'true');
          target.classList.add('is-open');
        }
      }
    }
  }

  /* ------------------------------------------------------------------ 05 */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    Array.prototype.forEach.call(items, function (el) { io.observe(el); });

    // Safety: anything still hidden after 2.5s is shown regardless.
    window.setTimeout(function () {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-in'); });
    }, 2500);
  }

  /* ------------------------------------------------------------------ 06 */
  function initToTop() {
    var btn = document.querySelector('.to-top');
    if (!btn) return;

    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:600px;left:0;width:1px;height:1px;pointer-events:none;';
    document.body.appendChild(sentinel);

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        btn.classList.toggle('is-visible', !entries[0].isIntersecting);
      });
      io.observe(sentinel);
    } else {
      btn.classList.add('is-visible');
    }

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      var skip = document.querySelector('.skip-link');
      if (skip) skip.focus();
    });
  }

  /* ------------------------------------------------------------------ 07 */
  /* Consent gate. Nothing beyond strictly necessary storage is written before
     an explicit choice, and the choice is stored in localStorage only. */
  var CONSENT_KEY = 'ftk_consent_v1';

  function readConsent() {
    try { return JSON.parse(window.localStorage.getItem(CONSENT_KEY) || 'null'); }
    catch (err) { return null; }
  }

  function writeConsent(value) {
    try { window.localStorage.setItem(CONSENT_KEY, JSON.stringify(value)); }
    catch (err) { /* storage blocked; banner simply reappears next visit */ }
  }

  function initCookies() {
    var banner = document.querySelector('.cookie-banner');
    if (!banner) return;

    var acceptBtn = banner.querySelector('[data-cookie="accept"]');
    var rejectBtn = banner.querySelector('[data-cookie="reject"]');
    var manageBtn = banner.querySelector('[data-cookie="manage"]');
    var saveBtn = banner.querySelector('[data-cookie="save"]');
    var prefs = banner.querySelector('.cookie-prefs');
    var analytics = banner.querySelector('#cookie-analytics');
    var marketing = banner.querySelector('#cookie-marketing');

    var stored = readConsent();
    if (!stored) {
      banner.classList.add('is-visible');
    }

    function finish(value) {
      writeConsent(value);
      banner.classList.remove('is-visible');
      // Real integrations would be initialised here, only for granted categories.
      window.ftkConsent = value;
    }

    if (acceptBtn) acceptBtn.addEventListener('click', function () {
      finish({ necessary: true, analytics: true, marketing: true, at: new Date().toISOString() });
    });

    if (rejectBtn) rejectBtn.addEventListener('click', function () {
      finish({ necessary: true, analytics: false, marketing: false, at: new Date().toISOString() });
    });

    if (manageBtn && prefs) manageBtn.addEventListener('click', function () {
      var open = prefs.classList.toggle('is-open');
      manageBtn.setAttribute('aria-expanded', String(open));
    });

    if (saveBtn) saveBtn.addEventListener('click', function () {
      finish({
        necessary: true,
        analytics: !!(analytics && analytics.checked),
        marketing: !!(marketing && marketing.checked),
        at: new Date().toISOString()
      });
    });

    // Any "Cookie settings" link on the page reopens the banner.
    Array.prototype.forEach.call(document.querySelectorAll('[data-open-cookie-settings]'), function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        banner.classList.add('is-visible');
        if (prefs) { prefs.classList.add('is-open'); }
        if (manageBtn) manageBtn.setAttribute('aria-expanded', 'true');
        if (analytics) analytics.focus();
      });
    });
  }

  /* ------------------------------------------------------------------ 08 */
  var VALIDATORS = {
    email: {
      test: function (v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()); },
      message: 'Enter a valid email address, for example you@example.com.'
    },
    tel: {
      test: function (v) { return /^[0-9+().\-\s]{10,20}$/.test(v.trim()); },
      message: 'Enter a US phone number, for example +1 (828) 555-0142.'
    },
    zip: {
      test: function (v) { return /^\d{5}(-\d{4})?$/.test(v.trim()); },
      message: 'Enter a 5 digit ZIP code.'
    },
    name: {
      test: function (v) { return v.trim().length >= 2; },
      message: 'Enter at least 2 characters.'
    },
    message: {
      test: function (v) { return v.trim().length >= 20; },
      message: 'Please give us at least 20 characters so we can help properly.'
    }
  };

  function fieldWrap(input) {
    return input.closest('.field') || input.closest('.checkline') || input.parentElement;
  }

  function showError(input, message) {
    var wrap = fieldWrap(input);
    if (!wrap) return;
    wrap.classList.add('is-invalid');
    var err = wrap.querySelector('.error');
    if (err) {
      err.textContent = message;
      if (!err.id) err.id = input.id + '-error';
      input.setAttribute('aria-describedby', err.id);
    }
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError(input) {
    var wrap = fieldWrap(input);
    if (!wrap) return;
    wrap.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
  }

  function validateInput(input) {
    var value = input.value || '';
    var required = input.hasAttribute('required');

    if (input.type === 'checkbox') {
      if (required && !input.checked) {
        showError(input, input.dataset.errorMessage || 'Please tick this box to continue.');
        return false;
      }
      clearError(input);
      return true;
    }

    if (required && !value.trim()) {
      showError(input, input.dataset.errorMessage || 'This field is required.');
      return false;
    }

    if (!value.trim()) { clearError(input); return true; }

    var rule = input.dataset.validate;
    if (rule && VALIDATORS[rule] && !VALIDATORS[rule].test(value)) {
      showError(input, input.dataset.errorMessage || VALIDATORS[rule].message);
      return false;
    }

    if (input.type === 'date' && input.min && value < input.min) {
      showError(input, 'Choose a date from today onward.');
      return false;
    }

    clearError(input);
    return true;
  }

  function initForms() {
    var forms = document.querySelectorAll('form[data-validate-form]');
    Array.prototype.forEach.call(forms, function (form) {
      var fields = Array.prototype.slice.call(form.querySelectorAll('input, select, textarea'))
        .filter(function (el) { return el.type !== 'hidden' && el.type !== 'submit'; });

      fields.forEach(function (input) {
        input.addEventListener('blur', function () { validateInput(input); });
        input.addEventListener('input', function () {
          var wrap = fieldWrap(input);
          if (wrap && wrap.classList.contains('is-invalid')) validateInput(input);
        });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var firstBad = null;
        fields.forEach(function (input) {
          if (!validateInput(input) && !firstBad) firstBad = input;
        });

        var status = form.querySelector('.form-status');

        if (firstBad) {
          if (status) {
            status.classList.add('is-visible', 'is-error');
            status.textContent = 'Please fix the highlighted fields and send again.';
          }
          firstBad.focus();
          return;
        }

        if (status) {
          status.classList.remove('is-error');
          status.classList.add('is-visible');
          status.textContent = form.dataset.successMessage ||
            'Thank you. Your message is with our team and we reply within one business day.';
          status.setAttribute('tabindex', '-1');
          status.focus();
        }
        form.reset();
        fields.forEach(clearError);
      });
    });
  }

  /* ------------------------------------------------------------------ 09 */
  function initGalleryFilter() {
    var bar = document.querySelector('.filter-bar');
    if (!bar) return;
    var buttons = bar.querySelectorAll('.filter-btn');
    var items = document.querySelectorAll('[data-gallery-cat]');
    var count = document.querySelector('[data-gallery-count]');

    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.dataset.filter;
        Array.prototype.forEach.call(buttons, function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        var shown = 0;
        Array.prototype.forEach.call(items, function (item) {
          var match = filter === 'all' || item.dataset.galleryCat === filter;
          item.hidden = !match;
          if (match) shown++;
        });
        if (count) count.textContent = shown + (shown === 1 ? ' photograph' : ' photographs');
      });
    });
  }

  /* ------------------------------------------------------------------ 10 */
  function initHelpers() {
    // Copyright year
    Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
      el.textContent = String(new Date().getFullYear());
    });

    // Date inputs cannot be booked in the past.
    var today = new Date();
    var iso = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    Array.prototype.forEach.call(document.querySelectorAll('input[type="date"][data-min-today]'), function (input) {
      input.min = iso;
      if (!input.value) input.value = iso;
    });

    // Live order estimate on the takeout page.
    var order = document.querySelector('[data-order-form]');
    if (order) {
      var out = order.querySelector('[data-order-total]');
      function recalc() {
        var subtotal = 0;
        Array.prototype.forEach.call(order.querySelectorAll('[data-price]'), function (input) {
          var qty = parseInt(input.value, 10);
          if (!qty || qty < 0) qty = 0;
          subtotal += qty * parseFloat(input.dataset.price);
        });
        var method = order.querySelector('input[name="fulfilment"]:checked');
        var fee = method && method.value === 'delivery' ? 4.95 : 0;
        var tax = subtotal * 0.0725;
        var total = subtotal + fee + tax;
        if (out) {
          out.innerHTML =
            '<div><dt>Subtotal</dt><dd>$' + subtotal.toFixed(2) + '</dd></div>' +
            '<div><dt>Delivery fee</dt><dd>$' + fee.toFixed(2) + '</dd></div>' +
            '<div><dt>Sales tax (7.25%)</dt><dd>$' + tax.toFixed(2) + '</dd></div>' +
            '<div><dt>Total due</dt><dd>$' + total.toFixed(2) + '</dd></div>';
        }
      }
      order.addEventListener('input', recalc);
      order.addEventListener('change', recalc);
      recalc();
    }

    // Gift card amount picker mirrors the chosen value into the summary.
    var gift = document.querySelector('[data-gift-form]');
    if (gift) {
      var giftOut = gift.querySelector('[data-gift-total]');
      function giftCalc() {
        var picked = gift.querySelector('input[name="amount"]:checked');
        var custom = gift.querySelector('#gift-custom');
        var value = 0;
        if (picked && picked.value === 'custom') {
          value = parseFloat(custom && custom.value) || 0;
        } else if (picked) {
          value = parseFloat(picked.value);
        }
        if (giftOut) giftOut.textContent = '$' + value.toFixed(2);
      }
      gift.addEventListener('input', giftCalc);
      gift.addEventListener('change', giftCalc);
      giftCalc();
    }
  }

  ready(function () {
    initHeader();
    initAccordions();
    initReveal();
    initToTop();
    initCookies();
    initForms();
    initGalleryFilter();
    initHelpers();
  });
})();
