/* =====================================================
   NEON HORIZON — MAIN JAVASCRIPT
   Particles, Custom Cursor, Tilt, Typed Text,
   Scroll Reveal, Counter, Navbar, Magnetic Buttons
   ===================================================== */

'use strict';

// ============================================================
// UTILITY
// ============================================================
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// ============================================================
// 1. CUSTOM CURSOR
// ============================================================
function initCursor() {
  const cursor = document.createElement('div');
  const follower = document.createElement('div');
  cursor.className = 'cursor';
  follower.className = 'cursor-follower';
  document.body.append(cursor, follower);

  let mx = -200, my = -200, fx = -200, fy = -200;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  });

  const hoverEls = 'a, button, [role="button"], input';
  document.querySelectorAll(hoverEls).forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.classList.add('is-hovering'); follower.classList.add('is-hovering'); });
    el.addEventListener('mouseleave', () => { cursor.classList.remove('is-hovering'); follower.classList.remove('is-hovering'); });
  });

  document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; follower.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; follower.style.opacity = '1'; });

  function animateCursor() {
    cursor.style.transform = `translate(${mx - 5}px, ${my - 5}px)`;
    fx = lerp(fx, mx, 0.1);
    fy = lerp(fy, my, 0.1);
    follower.style.transform = `translate(${fx - 18}px, ${fy - 18}px)`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();
}

// ============================================================
// 2. PARTICLE CANVAS
// ============================================================
function initParticles() {
  const canvas = $('#particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], mouse = { x: -9999, y: -9999 };
  const PARTICLE_COUNT = 100;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.r = Math.random() * 1.5 + 0.5;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.alpha = Math.random() * 0.5 + 0.1;
      const hues = ['168,85,247', '34,211,238', '236,72,153'];
      this.color = hues[Math.floor(Math.random() * hues.length)];
    }
    update() {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120;
        this.vx -= (dx / dist) * force * 0.3;
        this.vy -= (dy / dist) * force * 0.3;
      }
      this.vx *= 0.98;
      this.vy *= 0.98;
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0) this.x = W;
      if (this.x > W) this.x = 0;
      if (this.y < 0) this.y = H;
      if (this.y > H) this.y = 0;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = `rgba(${this.color},1)`;
      ctx.shadowColor = `rgba(${this.color},0.8)`;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

  // Draw connections
  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.save();
          ctx.globalAlpha = (1 - dist / 100) * 0.15;
          ctx.strokeStyle = 'rgba(168,85,247,1)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawLines();
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
}

// ============================================================
// 3. TYPED TEXT EFFECT
// ============================================================
function initTypedText() {
  const el = $('#typed');
  if (!el) return;
  const words = ['Future', 'Web', 'Products', 'Vision', 'Ideas'];
  let wi = 0, ci = 0, deleting = false;

  function tick() {
    const word = words[wi];
    if (!deleting) {
      el.textContent = word.slice(0, ci + 1);
      ci++;
      if (ci === word.length) { deleting = true; setTimeout(tick, 1800); return; }
    } else {
      el.textContent = word.slice(0, ci - 1);
      ci--;
      if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
    }
    setTimeout(tick, deleting ? 60 : 100);
  }
  tick();
}

// ============================================================
// 4. SCROLL REVEAL (IntersectionObserver)
// ============================================================
function initScrollReveal() {
  const els = $$('.reveal');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  els.forEach(el => obs.observe(el));

  // Immediately reveal hero elements in viewport
  els.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) el.classList.add('visible');
  });
}

// ============================================================
// 5. COUNTER ANIMATION
// ============================================================
function initCounters() {
  const counters = $$('[data-target]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.target, 10);
      const duration = 2000;
      const start = performance.now();
      function step(now) {
        const t = clamp((now - start) / duration, 0, 1);
        // Easing: ease-out-expo
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        el.textContent = Math.floor(eased * target).toLocaleString();
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString();
      }
      requestAnimationFrame(step);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => obs.observe(c));
}

// ============================================================
// 6. NAVBAR SCROLL EFFECT
// ============================================================
function initNavbar() {
  const nav = $('#navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  });

  const burger = $('#hamburger');
  const menu = $('#mobile-menu');
  if (burger && menu) {
    burger.addEventListener('click', () => menu.classList.toggle('open'));
  }
}

// ============================================================
// 7. 3D TILT CARDS
// ============================================================
function initTiltCards() {
  $$('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateZ(6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.5s ease';
      card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
      setTimeout(() => card.style.transition = '', 500);
    });
    card.addEventListener('mouseenter', () => { card.style.transition = 'none'; });
  });
}

// ============================================================
// 8. MAGNETIC BUTTONS
// ============================================================
function initMagneticButtons() {
  $$('.magnetic-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * 0.35;
      const y = (e.clientY - rect.top - rect.height / 2) * 0.35;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
      btn.style.transition = 'transform 0.5s cubic-bezier(.23,1,.32,1)';
    });
    btn.addEventListener('mouseenter', () => { btn.style.transition = 'transform 0.1s ease'; });
  });
}

// ============================================================
// 9. SMOOTH SCROLL FOR NAV LINKS
// ============================================================
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Close mobile menu if open
        const menu = $('#mobile-menu');
        if (menu) menu.classList.remove('open');
      }
    });
  });
}

// ============================================================
// 10. CTA BUTTON RIPPLE + EMAIL SUBMIT
// ============================================================
function initCTA() {
  const submitBtn = $('#cta-submit');
  const emailInput = $('#email-input');
  if (!submitBtn || !emailInput) return;

  submitBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (isValid) {
      submitBtn.textContent = '✓ You\'re On The List!';
      submitBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
      submitBtn.style.boxShadow = '0 0 30px rgba(34,197,94,0.5)';
      emailInput.value = '';
    } else {
      emailInput.style.borderColor = '#f43f5e';
      emailInput.style.boxShadow = '0 0 0 3px rgba(244,63,94,0.1)';
      emailInput.placeholder = 'Enter a valid email address...';
      setTimeout(() => {
        emailInput.style.borderColor = '';
        emailInput.style.boxShadow = '';
        emailInput.placeholder = 'Enter your email address...';
      }, 2000);
    }
  });
}

// ============================================================
// 11. CHART BARS ANIMATION
// ============================================================
function initChartBars() {
  $$('.chart-bar').forEach((bar, i) => {
    bar.style.setProperty('--data-delay', i * 100);
  });
}

// ============================================================
// INIT ALL
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Only init cursor on non-touch devices
  if (window.matchMedia('(pointer: fine)').matches) {
    initCursor();
    initMagneticButtons();
  }
  initParticles();
  initTypedText();
  initScrollReveal();
  initCounters();
  initNavbar();
  initTiltCards();
  initSmoothScroll();
  initCTA();
  initChartBars();

  // Subtle page-load body animation
  document.body.style.opacity = '0';
  requestAnimationFrame(() => {
    document.body.style.transition = 'opacity 0.6s ease';
    document.body.style.opacity = '1';
  });
});
