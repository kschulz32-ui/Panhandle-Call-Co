/* ============================================================
   PANHANDLE CALL CO. — Main JavaScript
   ============================================================ */

// ---- STICKY NAV ----
const nav = document.getElementById('nav');
const scrollThreshold = 50;

function handleNavScroll() {
  if (window.scrollY > scrollThreshold) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
}
window.addEventListener('scroll', handleNavScroll, { passive: true });
handleNavScroll();


// ---- MOBILE HAMBURGER ----
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
});

// Close mobile nav when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});


// ---- SMOOTH SCROLL OFFSET (for fixed nav) ----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navHeight = nav.offsetHeight;
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});


// ---- SCROLL REVEAL ----
function initScrollReveal() {
  const elements = document.querySelectorAll(
    '.service-card, .step, .testimonial, .stat, .pain-card, .industry-tag, .faq-item, .contact__copy, .contact__form-wrap'
  );

  elements.forEach((el, i) => {
    el.classList.add('reveal');
    // Stagger cards in grids
    const parent = el.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(c => c.classList.contains(el.classList[0]));
      const idx = siblings.indexOf(el);
      if (idx > 0 && idx <= 4) {
        el.classList.add(`reveal-delay-${idx}`);
      }
    }
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
initScrollReveal();




// ---- FAQ ACCORDION ----
document.querySelectorAll('.faq-question').forEach(button => {
  button.addEventListener('click', () => {
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    const answer = button.nextElementSibling;

    // Close all others
    document.querySelectorAll('.faq-question').forEach(btn => {
      if (btn !== button) {
        btn.setAttribute('aria-expanded', 'false');
        btn.nextElementSibling.classList.remove('open');
      }
    });

    // Toggle current
    button.setAttribute('aria-expanded', String(!isExpanded));
    answer.classList.toggle('open', !isExpanded);
  });
});


// ---- CONTACT FORM ----
// Setup: sign up free at https://formspree.io, create a form pointed at
// kevin@coastalcallflow.com, then replace the placeholder ID below.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/REPLACE_WITH_YOUR_FORM_ID';

const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();

    const btn = contactForm.querySelector('button[type="submit"]');
    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        contactForm.style.display = 'none';
        formSuccess.style.display = 'flex';
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = data.errors ? data.errors.map(err => err.message).join(', ') : 'Submission failed.';
        alert('There was a problem: ' + msg + '\n\nPlease call us at (678) 559-4771.');
        btn.textContent = 'Book My Free Demo →';
        btn.disabled = false;
      }
    } catch {
      alert('Network error — please check your connection or call us directly at (678) 559-4771.');
      btn.textContent = 'Book My Free Demo →';
      btn.disabled = false;
    }
  });
}


// ---- PHONE NUMBER FORMATTING ----
const phoneInput = document.getElementById('phone');
if (phoneInput) {
  phoneInput.addEventListener('input', e => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 10);
    if (val.length >= 6) {
      val = `(${val.slice(0,3)}) ${val.slice(3,6)}-${val.slice(6)}`;
    } else if (val.length >= 3) {
      val = `(${val.slice(0,3)}) ${val.slice(3)}`;
    }
    e.target.value = val;
  });
}


// ---- REVENUE CALCULATOR ----
(function () {
  const missedCallsSlider = document.getElementById('missedCalls');
  if (!missedCallsSlider) return;

  const jobValueSlider  = document.getElementById('jobValue');
  const bookRateSlider  = document.getElementById('bookRate');

  const missedCallsVal  = document.getElementById('missedCallsVal');
  const jobValueVal     = document.getElementById('jobValueVal');
  const bookRateVal     = document.getElementById('bookRateVal');

  const monthlyLostEl   = document.getElementById('monthlyLost');
  const annualLostEl    = document.getElementById('annualLost');
  const recoverableEl   = document.getElementById('recoverable');
  const netGainEl       = document.getElementById('netGain');
  const insightEl       = document.getElementById('calcInsight');

  // Bail out early if any required element is missing
  if (!jobValueSlider || !bookRateSlider ||
      !monthlyLostEl  || !annualLostEl   ||
      !recoverableEl  || !netGainEl      || !insightEl) return;

  const animFrames = {};
  // Tracks the last value that was displayed so animations start from the right place
  const displayed  = { monthlyLost: 0, annualLost: 0, recoverable: 0, netGain: 0 };

  function formatDollars(n) {
    const rounded = Math.round(n);
    const abs = Math.abs(rounded).toLocaleString('en-US');
    return rounded < 0 ? '-$' + abs : '$' + abs;
  }

  function setSliderFill(slider) {
    const pct = ((+slider.value - +slider.min) / (+slider.max - +slider.min)) * 100;
    slider.style.setProperty('--fill', pct.toFixed(1) + '%');
  }

  // Always sets the value synchronously (so it's never stuck at $0),
  // then layers a smooth count-up animation on top for visual polish.
  function animateTo(key, el, target) {
    cancelAnimationFrame(animFrames[key]);

    // ── Synchronous baseline: value is always correct immediately ──
    el.textContent = formatDollars(target);

    const from = displayed[key];
    displayed[key] = target;

    // Skip animation when change is trivial
    if (Math.abs(target - from) < 2) return;

    // ── Animated count-up (purely cosmetic) ──
    let startTime = null; // initialised inside the first rAF frame to avoid timing mismatch

    function step(now) {
      if (startTime === null) startTime = now;
      const t = Math.min((now - startTime) / 380, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const cur = from + (target - from) * eased;
      el.textContent = formatDollars(cur);
      if (t < 1) {
        animFrames[key] = requestAnimationFrame(step);
      } else {
        el.textContent = formatDollars(target);
      }
    }
    animFrames[key] = requestAnimationFrame(step);
  }

  function calculate() {
    const missed  = +missedCallsSlider.value;
    const jobVal  = +jobValueSlider.value;
    const rate    = +bookRateSlider.value / 100;

    const weekly      = missed * jobVal * rate;
    const monthly     = weekly * 4.33;
    const annual      = monthly * 12;
    const recoverable = monthly * 0.80;
    const netGain     = recoverable - 397;

    // Update label readouts
    missedCallsVal.textContent = missed + ' missed calls/week';
    jobValueVal.textContent    = '$' + jobVal.toLocaleString('en-US') + ' per job';
    bookRateVal.textContent    = +bookRateSlider.value + '% book rate';

    // Update slider fill gradients
    setSliderFill(missedCallsSlider);
    setSliderFill(jobValueSlider);
    setSliderFill(bookRateSlider);

    // Update result cards
    animateTo('monthlyLost', monthlyLostEl, monthly);
    animateTo('annualLost',  annualLostEl,  annual);
    animateTo('recoverable', recoverableEl, recoverable);
    animateTo('netGain',     netGainEl,     netGain);

    // Dynamic insight line
    if (monthly < 1000) {
      insightEl.textContent = `Even at lower call volume, that's ${formatDollars(annual)} per year you're leaving on the table. Our system pays for itself with just 2 recovered jobs.`;
    } else if (monthly <= 3000) {
      insightEl.textContent = `That's a full-time employee's salary walking out the door every year. Coastal Call Flow costs less than $400/month to fix it.`;
    } else {
      insightEl.textContent = `You're losing serious money every single month. At this call volume, our AI system typically pays for itself in the first week.`;
    }
  }

  [missedCallsSlider, jobValueSlider, bookRateSlider].forEach(s => {
    s.addEventListener('input', calculate);
  });

  calculate(); // run immediately on page load
}());
