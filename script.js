// ============================================
//   LO SCARABOCCHIO — Interactions
// ============================================

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

$('#year') && ($('#year').textContent = new Date().getFullYear());

// ===== Sticky nav =====
const nav = $('#nav');
window.addEventListener('scroll', () => {
  nav?.classList.toggle('is-scrolled', window.scrollY > 30);
});

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
  const interactives = 'a, button, .work, .archive__item, .artist-card, summary, .lightbox__close, .lightbox__nav, .works__nav, .archive__nav, .filmstrip__gate, .hero-card';
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

// ===== Kinetic hero title (letters drift with mouse) =====
if (isDesktop && !prefersReducedMotion) {
  const heroTitleWords = $$('.hero__title .word');
  if (heroTitleWords.length > 0) {
    setTimeout(() => {
      let raf;
      document.addEventListener('mousemove', (e) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const x = (e.clientX / window.innerWidth - 0.5) * 8;
          const y = (e.clientY / window.innerHeight - 0.5) * 4;
          heroTitleWords.forEach((word, i) => {
            const intensity = (i + 1) * 0.4;
            word.style.transform = `translate(${x * intensity}px, ${y * intensity}px)`;
          });
        });
      });
    }, 1500); // wait for hero title stagger animation to complete
  }
}

// ===== 3D parallax tilt on glass cards (extends artist-card to value, work, review, steps) =====
if (isDesktop && !prefersReducedMotion) {
  document.querySelectorAll('.value, .review, .steps li').forEach(card => {
    let raf;
    card.addEventListener('mousemove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateY(-5px)`;
      });
    });
    card.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf);
      card.style.transform = '';
    });
  });
}

// ===== Image reveal on scroll (fade + scale) =====
$$('img:not(.cursor-dot):not(.cursor-ring)').forEach(img => {
  if (img.closest('.phone__reel-stack, .filmstrip, .hero-card, .footer__artist-avatar')) return;
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
$('#burger')?.addEventListener('click', () => $('.nav__links')?.classList.toggle('is-open'));
$$('.nav__links a').forEach(a => {
  a.addEventListener('click', () => $('.nav__links')?.classList.remove('is-open'));
});

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

// ===== Archive — infinite carousel + multi-filter =====
const archive = $('#archive');
const archiveWrap = archive?.closest('.archive-wrap');

if (archive && archiveWrap) {
  [...archive.children].forEach(item => {
    const clone = item.cloneNode(true);
    clone.dataset.clone = 'true';
    archive.appendChild(clone);
  });

  const allItems = () => [...archive.children];

  const scrollByCard = (dir) => {
    const card = archive.querySelector('.archive__item:not(.is-hidden)');
    if (!card) return;
    const gap = parseFloat(getComputedStyle(archive).columnGap || '16');
    const step = card.offsetWidth + gap;
    archive.scrollBy({ left: dir === 'next' ? step : -step, behavior: 'smooth' });
  };

  archiveWrap.querySelector('.archive__nav--prev')?.addEventListener('click', () => scrollByCard('prev'));
  archiveWrap.querySelector('.archive__nav--next')?.addEventListener('click', () => scrollByCard('next'));

  const loop = () => {
    const half = archive.scrollWidth / 2;
    if (archive.scrollLeft >= half) {
      archive.style.scrollBehavior = 'auto';
      archive.scrollLeft -= half;
      archive.style.scrollBehavior = 'smooth';
    } else if (archive.scrollLeft <= 0) {
      archive.style.scrollBehavior = 'auto';
      archive.scrollLeft = half;
      archive.style.scrollBehavior = 'smooth';
    }
  };
  archive.addEventListener('scroll', () => requestAnimationFrame(loop), { passive: true });

  // Multi-filter: artist + style + zone (with live count + empty state)
  const activeFilters = { artist: 'all', style: 'all', zone: 'all' };
  const countEl = $('#filtersCount');
  const emptyEl = $('#archiveEmpty');

  const applyFilters = () => {
    let visibleOriginals = 0;
    allItems().forEach(item => {
      const matchArtist = activeFilters.artist === 'all' || item.dataset.artist === activeFilters.artist;
      const matchStyle  = activeFilters.style  === 'all' || (item.dataset.style || '').includes(activeFilters.style);
      const matchZone   = activeFilters.zone   === 'all' || item.dataset.zone === activeFilters.zone;
      const visible = matchArtist && matchStyle && matchZone;
      item.classList.toggle('is-hidden', !visible);
      if (visible && !item.dataset.clone) visibleOriginals++;
    });

    if (countEl) {
      countEl.textContent = visibleOriginals === 1 ? '1 opera' : `${visibleOriginals} opere`;
    }
    if (emptyEl) {
      emptyEl.hidden = visibleOriginals > 0;
      archiveWrap.style.display = visibleOriginals > 0 ? '' : 'none';
    }
  };

  $$('.filter[data-filter-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.filterType;
      const value = btn.dataset.filter;
      activeFilters[type] = value;
      $$(`[data-filter-type="${type}"]`).forEach(f => f.classList.remove('is-active'));
      btn.classList.add('is-active');
      applyFilters();
      archive.style.scrollBehavior = 'auto';
      archive.scrollLeft = 0;
      archive.style.scrollBehavior = 'smooth';
    });
  });

  $('#archiveReset')?.addEventListener('click', () => {
    activeFilters.artist = activeFilters.style = activeFilters.zone = 'all';
    $$('.filter[data-filter-type]').forEach(f => {
      f.classList.toggle('is-active', f.dataset.filter === 'all');
    });
    applyFilters();
  });

  applyFilters();
}

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

  if (archive) {
    const items = $$('.archive__item', archive);
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
  '.section-head, .studio__grid, .artisti__cards, .review, .reviews__cta, .faq__list, .archive-wrap, .filters-group, .steps, .contatti__list, .contatti__form, .contatti__map, .footer__brand, .artist-page__head, .artist-page__main, .works, .artist-row__main, .gallery__grid, .gallery__item'
);
revealTargets.forEach(el => {
  el.classList.add('reveal');
  if (el.matches('.studio__grid, .artisti__cards, .faq__list, .steps')) {
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

// ===== Filmstrip — single gate, cycles through /reels/ videos =====
const filmstripGate = $('#filmstripGate');
if (filmstripGate) {
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

    if (found.length === 0) {
      // Fallback: static image inside the gate
      const img = document.createElement('img');
      img.src = 'https://picsum.photos/seed/filmstrip-gate/440/640';
      img.alt = '';
      img.loading = 'lazy';
      filmstripGate.appendChild(img);
      return;
    }

    // Single video element that cycles through all found reels
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    filmstripGate.appendChild(video);

    let currentIdx = 0;

    const playAt = (idx) => {
      currentIdx = idx % found.length;
      video.src = found[currentIdx];
      const p = video.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };

    video.addEventListener('ended', () => playAt(currentIdx + 1));

    playAt(0);

    // Unlock autoplay on first user interaction (Safari/iOS)
    const tryPlay = () => { const p = video.play(); if (p && typeof p.catch === 'function') p.catch(() => {}); };
    window.addEventListener('scroll', tryPlay, { once: true, passive: true });
    window.addEventListener('click', tryPlay, { once: true });

    // Pause when off-screen
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) tryPlay();
        else video.pause();
      }, { threshold: 0.05 });
      obs.observe(filmstripGate.closest('.filmstrip'));
    }
  })();
}

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

// ===== Scroll storytelling — manifesto words activate as you scroll =====
const storyManifesto = $('#storyManifesto');
if (storyManifesto && !prefersReducedMotion) {
  const words = $$('.word', storyManifesto);
  const story = storyManifesto.closest('.story');

  const updateStory = () => {
    if (!story) return;
    const rect = story.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
    const activeCount = Math.floor(progress * (words.length + 1));
    words.forEach((w, i) => {
      w.classList.toggle('is-active', i < activeCount);
    });
  };

  window.addEventListener('scroll', () => requestAnimationFrame(updateStory), { passive: true });
  updateStory();
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

// ===== Form submit success animation =====
const bookingForm = $('#bookingForm');
if (bookingForm) {
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const successEl = $('#formSuccess');
    if (successEl) {
      successEl.classList.add('is-visible');
      setTimeout(() => bookingForm.reset(), 1000);
    }
  });
}

// ===== Parallax background on artist-row sections =====
if (!prefersReducedMotion) {
  const rows = $$('.artist-row');
  if (rows.length > 0) {
    const updateParallax = () => {
      const vh = window.innerHeight;
      rows.forEach(row => {
        const r = row.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const center = r.top + r.height / 2;
        const ratio = (center - vh / 2) / vh;
        const offset = ratio * -40; // px, negative so bg moves opposite to scroll
        row.style.backgroundPosition = `center calc(50% + ${offset}px)`;
      });
    };
    window.addEventListener('scroll', () => requestAnimationFrame(updateParallax), { passive: true });
    window.addEventListener('resize', updateParallax);
    updateParallax();
  }
}

// ===== Scroll-velocity tilt on artist-row media (subtle film-like sway) =====
if (!prefersReducedMotion) {
  const medias = $$('.artist-row__media');
  if (medias.length > 0) {
    let lastY = window.scrollY;
    let velocity = 0;
    let raf;

    const decay = () => {
      velocity *= 0.9;
      medias.forEach(m => {
        if (m.matches(':hover')) return;
        const skew = Math.max(-2.5, Math.min(2.5, velocity * 0.05));
        m.style.transform = `translateY(0) skewY(${skew}deg)`;
      });
      if (Math.abs(velocity) > 0.1) raf = requestAnimationFrame(decay);
      else {
        medias.forEach(m => { if (!m.matches(':hover')) m.style.transform = ''; });
      }
    };

    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      velocity = (y - lastY);
      lastY = y;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(decay);
    }, { passive: true });
  }
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
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
    rowParts.forEach(el => obs.observe(el));
  }
}

// ===== Language switch (basic IT/EN) =====
const langSwitch = $('.lang-switch');
if (langSwitch) {
  const i18n = {
    en: {
      'Studio': 'Studio',
      'Artisti': 'Artists',
      'Opere': 'Works',
      'Archivio': 'Archive',
      'FAQ': 'FAQ',
      'Contatti': 'Contact',
      'Prenota': 'Book',
      'Conosci gli artisti': 'Meet the artists',
      'Tatuaggi': 'Tattoos',
    },
    it: {} // identity (default)
  };

  const applyLang = (lang) => {
    document.documentElement.lang = lang;
    langSwitch.querySelectorAll('button').forEach(b => {
      b.classList.toggle('is-active', b.dataset.lang === lang);
    });
    // Apply mapping (best-effort, only for explicit items)
    const dict = i18n[lang] || {};
    document.querySelectorAll('[data-i18n-original]').forEach(el => {
      const orig = el.dataset.i18nOriginal;
      el.textContent = dict[orig] || orig;
    });
    document.querySelectorAll('a, button, h1, h2, h3, h4, p, span').forEach(el => {
      if (el.children.length > 0 || !el.textContent.trim()) return;
      const original = el.dataset.i18nOriginal || el.textContent.trim();
      if (dict[original]) {
        if (!el.dataset.i18nOriginal) el.dataset.i18nOriginal = original;
        el.textContent = dict[original];
      } else if (lang === 'it' && el.dataset.i18nOriginal) {
        el.textContent = el.dataset.i18nOriginal;
      }
    });
    localStorage.setItem('lang', lang);
  };

  langSwitch.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => applyLang(btn.dataset.lang));
  });

  const saved = localStorage.getItem('lang');
  if (saved && saved !== 'it') applyLang(saved);
}
