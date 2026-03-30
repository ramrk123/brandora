// =============================================
// MAIN.JS — Public Site Interactivity
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  initHeader();
  initMobileNav();
  initTestimonials();
  initParticles();
});

// --- Sticky Header ---
function initHeader() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// --- Mobile Navigation ---
function initMobileNav() {
  const toggle = document.getElementById('mobileToggle');
  const nav = document.getElementById('mainNav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    nav.classList.toggle('open');
    document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
  });

  // Close on link click
  nav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      nav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !toggle.contains(e.target) && nav.classList.contains('open')) {
      toggle.classList.remove('active');
      nav.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

// --- Testimonials Carousel ---
function initTestimonials() {
  const track = document.querySelector('.testimonial-track');
  const prevBtn = document.getElementById('testimonialPrev');
  const nextBtn = document.getElementById('testimonialNext');
  const dotsContainer = document.getElementById('testimonialDots');
  
  if (!track || !prevBtn || !nextBtn || !dotsContainer) return;

  const cards = track.querySelectorAll('.testimonial-card');
  let current = 0;
  const total = cards.length;

  // Create dots
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('div');
    dot.classList.add('testimonial-dot');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  }

  function goTo(index) {
    current = index;
    track.style.transform = `translateX(-${current * 100}%)`;
    dotsContainer.querySelectorAll('.testimonial-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  prevBtn.addEventListener('click', () => goTo(current > 0 ? current - 1 : total - 1));
  nextBtn.addEventListener('click', () => goTo(current < total - 1 ? current + 1 : 0));

  // Auto-play
  let autoplay = setInterval(() => goTo(current < total - 1 ? current + 1 : 0), 5000);
  
  track.closest('.testimonial-slider')?.addEventListener('mouseenter', () => clearInterval(autoplay));
  track.closest('.testimonial-slider')?.addEventListener('mouseleave', () => {
    autoplay = setInterval(() => goTo(current < total - 1 ? current + 1 : 0), 5000);
  });
}

// --- Hero Particles ---
function initParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;

  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.classList.add('hero-particle');
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 15 + 's';
    particle.style.animationDuration = (10 + Math.random() * 20) + 's';
    particle.style.width = (2 + Math.random() * 4) + 'px';
    particle.style.height = particle.style.width;
    container.appendChild(particle);
  }
}

// --- Toast Notification ---
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);
  lucide.createIcons();

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// Make showToast global
window.showToast = showToast;
