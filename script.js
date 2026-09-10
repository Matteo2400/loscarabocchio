// ============================================
//   LO SCARABOCCHIO — Interactions
// ============================================

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

$('#year') && ($('#year').textContent = new Date().getFullYear());

// ===== Sticky nav =====
const nav = $('#nav');
window.addEventListener('scroll', () => requestAnimationFrame(() => {
  nav?.classList.toggle('is-scrolled', window.scrollY > 30);
}), { passive: true });

// ===== Hero: ferma le animazioni infinite quando esce dal viewport =====
(() => {
  const hero = document.querySelector('.hero');
  if (!hero || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(([entry]) => {
    hero.classList.toggle('is-paused', !entry.isIntersecting);
  }, { threshold: 0 });
  io.observe(hero);
})();

// ===== Scroll progress bar =====
const scrollProgress = $('#scrollProgress');
if (scrollProgress) {
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? (window.scrollY / max) * 100 : 0;
    scrollProgress.style.width = `${ratio}%`;
  };
  window.addEventListener('scroll', () => requestAnimationFrame(updateProgress), { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();
}

// ===== Custom cursor (minimal dot, desktop only) =====
const cursorDot = $('#cursorDot');
const isDesktop = window.matchMedia('(pointer: fine) and (min-width: 901px)').matches;

if (cursorDot && isDesktop && !prefersReducedMotion) {
  document.addEventListener('mousemove', (e) => {
    cursorDot.style.left = e.clientX + 'px';
    cursorDot.style.top = e.clientY + 'px';
    cursorDot.style.opacity = 1;
  });

  document.addEventListener('mouseleave', () => {
    cursorDot.style.opacity = 0;
  });

  // Subtle grow on interactive elements
  const interactives = 'a, button, .work, .artist-card, summary, .lightbox__close, .lightbox__nav, .works__nav, .hero-card';
  document.querySelectorAll(interactives).forEach(el => {
    el.addEventListener('mouseenter', () => cursorDot.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => cursorDot.classList.remove('is-hover'));
  });
}

// ===== Magnetic buttons =====
if (isDesktop && !prefersReducedMotion) {
  document.querySelectorAll('.btn, .nav__cta').forEach(btn => {
    let raf;
    btn.addEventListener('mousemove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.25;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
    });
    btn.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf);
      btn.style.transform = '';
    });
  });
}

// ===== Image reveal on scroll (fade + scale) =====
$$('img:not(.cursor-dot)').forEach(img => {
  if (img.closest('.hero-card')) return;
  img.classList.add('img-reveal');
});

if ('IntersectionObserver' in window) {
  const imgObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        imgObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -10% 0px' });
  $$('.img-reveal').forEach(el => imgObs.observe(el));
}

// ===== Counter-up animation on stats =====
const counterElements = $$('[data-count]');
if (counterElements.length > 0 && !prefersReducedMotion) {
  const animate = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1500;
    const start = performance.now();
    el.classList.add('is-counting');
    const tick = (t) => {
      const progress = Math.min((t - start) / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = String(value).padStart(2, '0') + suffix;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.classList.remove('is-counting');
      }
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counterElements.forEach(el => obs.observe(el));
  } else {
    counterElements.forEach(animate);
  }
}

// ===== Mobile menu =====
const burger = $('#burger');
const navLinks = $('.nav__links');
if (burger && navLinks) {
  const setMenuOpen = (open) => {
    navLinks.classList.toggle('is-open', open);
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
  };
  burger.addEventListener('click', () => setMenuOpen(!navLinks.classList.contains('is-open')));
  $$('a', navLinks).forEach(a => a.addEventListener('click', () => setMenuOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('is-open')) setMenuOpen(false);
  });
}

// ===== Scrollspy: evidenzia la sezione corrente nella nav =====
(() => {
  const links = $$('.nav__links a[href^="#"]');
  if (links.length === 0) return;
  const map = links
    .map(a => ({ a, el: document.getElementById(a.getAttribute('href').slice(1)) }))
    .filter(x => x.el);
  if (map.length === 0) return;

  const clear = () => map.forEach(({ a }) => {
    a.classList.remove('is-active');
    a.removeAttribute('aria-current');
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => entry.target._visible = entry.isIntersecting);
    // Una sola sezione attiva: la prima visibile a centro viewport.
    // Nessun link attivo nell'hero o in sezioni senza voce di nav.
    const hit = map.find(({ el }) => el._visible);
    clear();
    if (hit) {
      hit.a.classList.add('is-active');
      hit.a.setAttribute('aria-current', 'true');
    }
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

  map.forEach(({ el }) => io.observe(el));
})();

// ===== Works carousels — infinite loop =====
$$('.works').forEach(works => {
  const grid = works.querySelector('.works__grid');
  if (!grid) return;

  [...grid.children].forEach(item => grid.appendChild(item.cloneNode(true)));

  const scrollByCard = (dir) => {
    const card = grid.querySelector('.work');
    if (!card) return;
    const gap = parseFloat(getComputedStyle(grid).columnGap || '16');
    const step = card.offsetWidth + gap;
    grid.scrollBy({ left: dir === 'next' ? step : -step, behavior: 'smooth' });
  };

  works.querySelector('.works__nav--prev')?.addEventListener('click', () => scrollByCard('prev'));
  works.querySelector('.works__nav--next')?.addEventListener('click', () => scrollByCard('next'));

  const loop = () => {
    const half = grid.scrollWidth / 2;
    if (grid.scrollLeft >= half) {
      grid.style.scrollBehavior = 'auto';
      grid.scrollLeft -= half;
      grid.style.scrollBehavior = 'smooth';
    } else if (grid.scrollLeft <= 0) {
      grid.style.scrollBehavior = 'auto';
      grid.scrollLeft = half;
      grid.style.scrollBehavior = 'smooth';
    }
  };
  grid.addEventListener('scroll', () => requestAnimationFrame(loop), { passive: true });
});

// ===== Lightbox =====
const lightbox = $('#lightbox');
if (lightbox) {
  const lbImg   = lightbox.querySelector('.lightbox__image img');
  const lbTitle = lightbox.querySelector('.lightbox__title');
  const lbMeta  = lightbox.querySelector('.lightbox__meta');
  let currentList = [];
  let currentIdx = 0;
  let lastFocused = null;

  const openLightbox = (item, list) => {
    lastFocused = document.activeElement;
    currentList = list.filter(el => !el.classList.contains('is-hidden') && !el.dataset.clone);
    currentIdx = currentList.indexOf(item);
    if (currentIdx < 0) currentIdx = 0;
    showCurrent();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => lightbox.querySelector('.lightbox__close')?.focus(), 50);
  };

  const showCurrent = () => {
    const item = currentList[currentIdx];
    if (!item) return;
    const img = item.querySelector('img');
    const title = item.querySelector('.work__title')?.textContent
                || item.querySelector('figcaption')?.textContent.trim() || '';
    const year = item.querySelector('.work__year')?.textContent || '';
    if (img) {
      lbImg.src = img.src.replace(/\/\d+\/\d+(\?|$)/, '/1200/1500$1');
      lbImg.alt = img.alt || title;
    }
    lbTitle.textContent = title;
    lbMeta.textContent  = year ? `${year} · ${currentIdx + 1} / ${currentList.length}` : `${currentIdx + 1} / ${currentList.length}`;
  };

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastFocused?.focus();
  };

  const next = () => { currentIdx = (currentIdx + 1) % currentList.length; showCurrent(); };
  const prev = () => { currentIdx = (currentIdx - 1 + currentList.length) % currentList.length; showCurrent(); };

  lightbox.querySelector('.lightbox__close')?.addEventListener('click', closeLightbox);
  lightbox.querySelector('.lightbox__nav--next')?.addEventListener('click', next);
  lightbox.querySelector('.lightbox__nav--prev')?.addEventListener('click', prev);

  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft')  prev();
  });

  $$('.works').forEach(works => {
    const items = $$('.work', works);
    items.forEach(item => {
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      const open = () => openLightbox(item, items);
      item.addEventListener('click', open);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });
  });

  // Bind: gallery (masonry, single combined gallery)
  const galleryGrid = $('#galleryGrid');
  if (galleryGrid) {
    const items = $$('.gallery__item', galleryGrid);
    items.forEach(item => {
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      const open = () => openLightbox(item, items);
      item.addEventListener('click', open);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });
  }
}

// ===== Page transitions =====
const transition = $('#pageTransition');
if (transition) {
  $$('a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    if (href.startsWith('http') && !href.startsWith(window.location.origin)) return;
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (a.target === '_blank') return;

    a.addEventListener('click', (e) => {
      const path = href.split('#')[0];
      if (path === '' || path === window.location.pathname.split('/').pop()) return;
      e.preventDefault();
      transition.classList.add('is-active');
      setTimeout(() => { window.location.href = href; }, 350);
    });
  });
}

// ===== Reveal on scroll =====
const revealTargets = $$(
  '.big-moment__quote, .section-head, .artisti__cards, .review, .reviews__cta, .faq__list, .steps, .contatti__list, .contatti__form, .contatti__map, .footer__brand, .artist-page__head, .artist-page__main, .works, .artist-row__main, .gallery__grid, .gallery__item'
);
revealTargets.forEach(el => {
  el.classList.add('reveal');
  if (el.matches('.artisti__cards, .faq__list, .steps')) {
    el.classList.add('reveal-stagger');
  }
});

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
revealTargets.forEach(el => io.observe(el));

// ===== Hero title word stagger =====
// Already handled via CSS @keyframes triggered by the .word spans

// ===== Hero Card microinteractions: parallax 3D =====
const heroCard = $('#heroCard');
if (heroCard && !prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
  setTimeout(() => {
    let raf;
    const wrap = heroCard.closest('.hero__phone-wrap');
    const onMove = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = wrap.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const x = (e.clientX - cx) / window.innerWidth;
        const y = (e.clientY - cy) / window.innerHeight;
        heroCard.style.transform = `perspective(1400px) rotateY(${x * 6}deg) rotateX(${-y * 4}deg) translateY(0)`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      heroCard.style.transform = '';
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
  }, 1800);
}

// ===== Hero card reel: auto-load videos from /reels/ folder =====
const heroCardMedia = $('#heroCardMedia');
if (heroCardMedia) {
  const isInSubfolder = window.location.pathname.includes('/artisti/');
  const REELS_PATH = isInSubfolder ? '../reels/' : 'reels/';
  const MAX_REELS = 12;
  const exts = ['mp4', 'webm', 'mov'];

  const tryProbe = (idx) => new Promise((resolve) => {
    const padded = String(idx).padStart(2, '0');
    let extIdx = 0;
    let resolved = false;
    const tryNext = () => {
      if (resolved) return;
      if (extIdx >= exts.length) { resolve(null); return; }
      const url = `${REELS_PATH}reel-${padded}.${exts[extIdx]}`;
      extIdx++;
      const v = document.createElement('video');
      v.muted = true;
      v.playsInline = true;
      v.preload = 'metadata';
      v.addEventListener('loadedmetadata', () => { if (!resolved) { resolved = true; resolve(url); } });
      v.addEventListener('error', () => { if (!resolved) tryNext(); });
      v.src = url;
    };
    tryNext();
  });

  (async () => {
    const found = [];
    for (let i = 1; i <= MAX_REELS; i++) {
      const src = await tryProbe(i);
      if (src) found.push(src);
    }

    if (found.length === 0) return; // fallback image stays visible

    // Hide fallback
    const fallback = heroCardMedia.querySelector('.hero-card__fallback');
    if (fallback) fallback.style.display = 'none';

    // Single video that cycles through the playlist
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    heroCardMedia.appendChild(video);

    let currentIdx = 0;
    const playAt = (i) => {
      currentIdx = i % found.length;
      video.src = found[currentIdx];
      const p = video.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };

    video.addEventListener('ended', () => playAt(currentIdx + 1));
    playAt(0);

    const tryPlay = () => { const p = video.play(); if (p && typeof p.catch === 'function') p.catch(() => {}); };
    window.addEventListener('scroll', tryPlay, { once: true, passive: true });
    window.addEventListener('click', tryPlay, { once: true });

    // Pause when off-screen
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) tryPlay();
        else video.pause();
      }, { threshold: 0.1 });
      obs.observe(heroCardMedia.closest('.hero-card'));
    }
  })();
}

// ===== 3D parallax on artist cards =====
if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
  $$('.artist-card').forEach(card => {
    let raf;
    card.addEventListener('mousemove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-8px)`;
      });
    });
    card.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf);
      card.style.transform = '';
    });
  });
}

// ===== WhatsApp teaser bubble =====
const waFloat = $('#waFloat');
if (waFloat) {
  let teased = false;
  const triggerTeaser = () => {
    if (teased) return;
    teased = true;
    waFloat.classList.add('is-teasing');
    setTimeout(() => waFloat.classList.remove('is-teasing'), 5000);
  };
  // After 8s of being on page, OR after scroll past 30%
  setTimeout(triggerTeaser, 8000);
  let scrollChecker = () => {
    if (window.scrollY > document.body.scrollHeight * 0.25) {
      triggerTeaser();
      window.removeEventListener('scroll', scrollChecker);
    }
  };
  window.addEventListener('scroll', scrollChecker, { passive: true });
}

// ===== Cookie banner =====
const cookieBanner = $('#cookieBanner');
if (cookieBanner) {
  const accepted = localStorage.getItem('cookieAccepted');
  if (!accepted) {
    setTimeout(() => cookieBanner.classList.add('is-visible'), 1200);
  }
  $('#cookieAccept')?.addEventListener('click', () => {
    localStorage.setItem('cookieAccepted', '1');
    cookieBanner.classList.remove('is-visible');
  });
}

// ===== Form richiesta -> WhatsApp =====
// Sito statico senza backend: invece di fingere un invio, il form compone
// un messaggio precompilato e lo passa a WhatsApp, che e' il canale reale.
const WA_NUMBER = '390000000000';   // TODO: sostituire col numero reale
const bookingForm = $('#bookingForm');
if (bookingForm) {
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = bookingForm;
    const val = (name) => (f.elements[name] && f.elements[name].value || '').trim();
    const righe = [
      'Ciao, vorrei prenotare una consulenza.',
      '',
      `Nome: ${val('nome')}`,
      `Email: ${val('email')}`,
      `Artista: ${val('artista') || 'nessuna preferenza'}`,
      '',
      'La mia idea:',
      val('messaggio'),
    ];
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(righe.join(String.fromCharCode(10)))}`;
    window.open(url, '_blank', 'noopener');

    const successEl = $('#formSuccess');
    if (successEl) {
      successEl.classList.add('is-visible');
      setTimeout(() => f.reset(), 1000);
    }
  });
}

// ===== Directional reveal on artist-row content =====
if ('IntersectionObserver' in window) {
  const rowParts = $$('.artist-row .artist-row__main, .artist-row .works');
  if (rowParts.length > 0) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px 12% 0px' });
    rowParts.forEach(el => obs.observe(el));
  }
}
