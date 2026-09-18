import { initPublicOrdering } from './client/public-page.js';

function initBaseInteractions() {
  const body = document.body;
  const header = document.querySelector('#header');
  const nav = document.querySelector('#headerNav');
  const toggle = document.querySelector('#headerToggle');
  const navLinks = document.querySelectorAll('.header__nav-link');

  const closeMenu = () => {
    if (!nav || !toggle) return;
    nav.classList.remove('is-open');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    body.classList.remove('nav-open');
  };

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      toggle.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      body.classList.toggle('nav-open', isOpen);
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  const updateHeader = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 20);
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const revealItems = document.querySelectorAll(
    'main section:not(.hero):not(.menu-page-hero), .dish-card, .menu__item, .gallery__item, .review-card'
  );

  revealItems.forEach((item) => item.classList.add('reveal'));

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    // rootMargin en vez de threshold porcentual: una sección más alta que el
    // viewport nunca alcanzaría un threshold del 16% y quedaría invisible.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -8% 0px' }
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  document.addEventListener('keyup', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });
}

function init() {
  initPublicOrdering();
  initBaseInteractions();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
