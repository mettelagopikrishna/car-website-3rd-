/**
 * NOCTIS — Main Scrollytelling Engine
 * Pure Vanilla JavaScript. Zero libraries. Zero frameworks.
 * Performance targeted for 60fps canvas scrubbing, accessible motion fallbacks,
 * debounced interactions, and reactive custom cursor.
 */

(function () {
  'use strict';

  // Fallback config if config.js not yet loaded
  const CFG = window.NOCTIS_CONFIG || {};

  // Check prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --------------------------------------------------------------------------
  // Utility: Clamp
  // --------------------------------------------------------------------------
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  // --------------------------------------------------------------------------
  // 1. Film Grain Canvas (Monochromatic Noise Tile, ~8 FPS jitter)
  // --------------------------------------------------------------------------
  function initFilmGrain() {
    const grainCanvas = document.getElementById('grain-canvas');
    if (!grainCanvas) return;
    const ctx = grainCanvas.getContext('2d', { alpha: true });

    const tileSize = 128;
    const offscreen = document.createElement('canvas');
    offscreen.width = tileSize;
    offscreen.height = tileSize;
    const offCtx = offscreen.getContext('2d');
    const imgData = offCtx.createImageData(tileSize, tileSize);
    const data = imgData.data;

    // Generate static noise tile
    for (let i = 0; i < data.length; i += 4) {
      const val = Math.floor(Math.random() * 255);
      data[i] = val;     // R
      data[i + 1] = val; // G
      data[i + 2] = val; // B
      data[i + 3] = 255; // A (canvas opacity is 3.5% in CSS)
    }
    offCtx.putImageData(imgData, 0, 0);

    let pattern;
    function resizeGrain() {
      grainCanvas.width = window.innerWidth;
      grainCanvas.height = window.innerHeight;
      pattern = ctx.createPattern(offscreen, 'repeat');
    }
    window.addEventListener('resize', resizeGrain, { passive: true });
    resizeGrain();

    // Jitter ~8 times per second (125ms)
    let lastJitter = 0;
    function jitterGrain(time) {
      if (time - lastJitter > 125) {
        lastJitter = time;
        ctx.clearRect(0, 0, grainCanvas.width, grainCanvas.height);
        const ox = Math.floor(Math.random() * tileSize);
        const oy = Math.floor(Math.random() * tileSize);
        ctx.save();
        ctx.translate(ox, oy);
        ctx.fillStyle = pattern;
        ctx.fillRect(-tileSize, -tileSize, grainCanvas.width + tileSize * 2, grainCanvas.height + tileSize * 2);
        ctx.restore();
      }
      requestAnimationFrame(jitterGrain);
    }
    requestAnimationFrame(jitterGrain);
  }

  // --------------------------------------------------------------------------
  // 2. Custom Cursor ("The Headlight" — Desktop Fine Pointer Only)
  // --------------------------------------------------------------------------
  function initCustomCursor() {
    if (prefersReducedMotion || !window.matchMedia('(pointer: fine)').matches) return;

    const cursor = document.getElementById('custom-cursor');
    const cursorLabel = cursor ? cursor.querySelector('.cursor-label') : null;
    if (!cursor) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let isVisible = false;

    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        cursor.style.opacity = '1';
      }
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      isVisible = false;
      cursor.style.opacity = '0';
    });

    // Mousedown flash (120ms brighter white)
    window.addEventListener('mousedown', function () {
      cursor.classList.add('is-active');
      setTimeout(function () {
        cursor.classList.remove('is-active');
      }, 120);
    });

    // Interaction targets & morphing
    function updateCursorTargets() {
      const targets = document.querySelectorAll('a, button, [role="tab"], .swatch-box, [data-cursor]');
      targets.forEach(function (el) {
        el.addEventListener('mouseenter', function () {
          cursor.classList.add('is-hovering');
          const customLabel = el.getAttribute('data-cursor') || 'VIEW';
          if (cursorLabel) cursorLabel.textContent = customLabel;
        });
        el.addEventListener('mouseleave', function () {
          cursor.classList.remove('is-hovering');
          if (cursorLabel) cursorLabel.textContent = '';
        });
      });
    }
    updateCursorTargets();
    window.updateCursorTargets = updateCursorTargets;

    // Follow mouse with lerp factor 0.18
    function renderCursor() {
      currentX += (mouseX - currentX) * 0.18;
      currentY += (mouseY - currentY) * 0.18;
      cursor.style.transform = `translate(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px)`;
      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);
  }

  // --------------------------------------------------------------------------
  // 3. Navigation Header Auto-Hide on Scroll Down / Show on Scroll Up
  // --------------------------------------------------------------------------
  function initNav() {
    const nav = document.getElementById('site-nav');
    if (!nav) return;

    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', function () {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        nav.classList.add('nav-hidden');
      } else {
        nav.classList.remove('nav-hidden');
      }
      lastScrollY = currentScrollY;
    }, { passive: true });
  }

  // --------------------------------------------------------------------------
  // 4. Scrollytelling Sequence Manager (Hero & Dismantle)
  // --------------------------------------------------------------------------
  class FrameSequencePlayer {
    constructor(options) {
      this.wrapper = options.wrapper;
      this.canvas = options.canvas;
      this.ctx = this.canvas.getContext('2d', { alpha: false });
      this.totalFrames = options.frameCount;
      this.desktopPattern = options.desktopPattern;
      this.mobilePattern = options.mobilePattern;
      this.progressLine = options.progressLine;
      this.fadeToBlackStart = options.fadeToBlackStart || 1.0;
      this.onProgress = options.onProgress || null;

      this.images = new Array(this.totalFrames);
      this.loadedIndices = new Set();
      this.currentFrame = 0;
      this.targetFrame = 0;
      this.lastDrawnFrame = -1;

      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.isMobile = window.innerWidth < 768;

      this.initEvents();
      this.resize();
    }

    getFramePath(index) {
      const num = String(index + 1).padStart(4, '0');
      const pattern = this.isMobile ? this.mobilePattern : this.desktopPattern;
      return pattern.replace('%s', num);
    }

    loadFrame(index) {
      if (index < 0 || index >= this.totalFrames || this.images[index]) return this.images[index];

      const img = new Image();
      img.src = this.getFramePath(index);
      this.images[index] = img;

      img.decode().then(() => {
        this.loadedIndices.add(index);
      }).catch(() => {
        // Fallback for older decoders
        img.onload = () => { this.loadedIndices.add(index); };
      });
      return img;
    }

    preloadRange(start, end) {
      const min = Math.max(0, start);
      const max = Math.min(this.totalFrames - 1, end);
      const promises = [];
      for (let i = min; i <= max; i++) {
        const img = this.loadFrame(i);
        if (img && img.decode) {
          promises.push(img.decode().catch(() => {}));
        }
      }
      return Promise.all(promises);
    }

    preloadAllGradual(batchSize = 10, delay = 60) {
      let currentIdx = 0;
      const loadNextBatch = () => {
        if (currentIdx >= this.totalFrames) return;
        const end = Math.min(currentIdx + batchSize, this.totalFrames);
        for (let i = currentIdx; i < end; i++) {
          this.loadFrame(i);
        }
        currentIdx = end;
        setTimeout(loadNextBatch, delay);
      };
      loadNextBatch();
    }

    findNearestLoadedFrame(target) {
      if (this.loadedIndices.has(target)) return target;
      for (let offset = 1; offset < this.totalFrames; offset++) {
        if (this.loadedIndices.has(target - offset)) return target - offset;
        if (this.loadedIndices.has(target + offset)) return target + offset;
      }
      return -1;
    }

    resize() {
      this.isMobile = window.innerWidth < 768;
      const rect = this.wrapper.getBoundingClientRect();
      const w = window.innerWidth;
      const h = window.innerHeight;

      this.canvas.width = Math.floor(w * this.dpr);
      this.canvas.height = Math.floor(h * this.dpr);
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';

      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(this.dpr, this.dpr);

      // Force redraw
      this.lastDrawnFrame = -1;
      this.draw();
    }

    initEvents() {
      window.addEventListener('resize', () => this.resize(), { passive: true });
    }

    updateScroll() {
      const rect = this.wrapper.getBoundingClientRect();
      const scrollDist = this.wrapper.offsetHeight - window.innerHeight;
      if (scrollDist <= 0) return 0;

      const progress = clamp(-rect.top / scrollDist, 0, 1);
      this.targetFrame = Math.round(progress * (this.totalFrames - 1));

      if (this.progressLine) {
        this.progressLine.style.transform = `scaleX(${progress})`;
      }

      if (this.onProgress) {
        this.onProgress(progress);
      }
      return progress;
    }

    tick() {
      // Lerp current frame with 0.15 factor
      this.currentFrame += (this.targetFrame - this.currentFrame) * 0.15;
      const rounded = Math.round(this.currentFrame);

      if (rounded !== this.lastDrawnFrame) {
        this.lastDrawnFrame = rounded;
        this.draw();
      }
    }

    draw() {
      const targetIdx = clamp(this.lastDrawnFrame, 0, this.totalFrames - 1);
      const frameToDraw = this.findNearestLoadedFrame(targetIdx);
      if (frameToDraw < 0) return;

      const img = this.images[frameToDraw];
      if (!img || !img.naturalWidth) return;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;
      const imgRatio = imgW / imgH;
      const stageRatio = w / h;

      // Cover-fit on landscape; Contain-fit centered on portrait
      let drawW, drawH, drawX, drawY;

      if (stageRatio >= 1) {
        // Landscape: cover-fit
        if (stageRatio > imgRatio) {
          drawW = w;
          drawH = w / imgRatio;
          drawX = 0;
          drawY = (h - drawH) / 2;
        } else {
          drawH = h;
          drawW = h * imgRatio;
          drawX = (w - drawW) / 2;
          drawY = 0;
        }
      } else {
        // Portrait: contain-fit vertically centered on --asphalt
        drawW = w;
        drawH = w / imgRatio;
        drawX = 0;
        drawY = (h - drawH) / 2;
      }

      // Draw asphalt background
      this.ctx.fillStyle = '#07080A';
      this.ctx.fillRect(0, 0, w, h);

      // Draw car frame
      this.ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // Fade to solid black over the final 5% of scroll (if configured)
      const progress = this.targetFrame / (this.totalFrames - 1);
      if (progress >= this.fadeToBlackStart) {
        const fadeAlpha = clamp((progress - this.fadeToBlackStart) / (1 - this.fadeToBlackStart), 0, 1);
        this.ctx.fillStyle = `rgba(7, 8, 10, ${fadeAlpha.toFixed(3)})`;
        this.ctx.fillRect(0, 0, w, h);
      }
    }
  }

  // --------------------------------------------------------------------------
  // 5. Preloader & Initial Sequence Boot
  // --------------------------------------------------------------------------
  function initPreloader(heroPlayer, dismantlePlayer) {
    const preloader = document.getElementById('preloader');
    const bar = document.getElementById('preloader-bar');
    const counter = document.getElementById('preloader-counter');

    const initialCount = (CFG.preloader && CFG.preloader.initialFramesToLoad) || 40;
    let loadedInitial = 0;

    // Load initial 40 frames of Hero
    for (let i = 0; i < initialCount; i++) {
      const img = heroPlayer.loadFrame(i);
      const onDone = () => {
        loadedInitial++;
        const pct = Math.round((loadedInitial / initialCount) * 100);
        if (bar) bar.style.transform = `translateX(-50%) scaleX(${pct / 100})`;
        if (counter) counter.textContent = String(pct).padStart(3, '0');

        if (loadedInitial >= initialCount) {
          revealSite();
        }
      };

      if (img.decode) {
        img.decode().then(onDone).catch(onDone);
      } else {
        img.onload = onDone;
        img.onerror = onDone;
      }
    }

    let siteRevealed = false;
    function revealSite() {
      if (siteRevealed) return;
      siteRevealed = true;

      // Bright flash on the line before exit
      if (preloader) preloader.classList.add('is-flash');

      setTimeout(() => {
        if (preloader) preloader.classList.add('is-hidden');

        // Draw initial frame
        heroPlayer.targetFrame = 0;
        heroPlayer.draw();

        // Continue loading rest of hero sequence, then dismantle sequence in background
        heroPlayer.preloadAllGradual(15, 50);
        setTimeout(() => {
          dismantlePlayer.preloadAllGradual(15, 50);
        }, 1500);
      }, 250);
    }
  }

  // --------------------------------------------------------------------------
  // 6. Section 1 — Hero Chapters & HUD Update
  // --------------------------------------------------------------------------
  function setupHeroChapters(heroConfig) {
    const chapters = heroConfig.chapters || [];
    const chapterEls = [
      document.getElementById('chapter-1'),
      document.getElementById('chapter-2'),
      document.getElementById('chapter-3'),
      document.getElementById('chapter-4')
    ];

    const hudChapterText = document.getElementById('hud-chapter-text');
    const hudSpeed = document.getElementById('hud-speed');
    const hudDistance = document.getElementById('hud-distance');

    return function onHeroProgress(progress) {
      // Update HUD metrics
      const speed = Math.round(progress * (heroConfig.speedMax || 118));
      const dist = (progress * (heroConfig.distanceMax || 4.2)).toFixed(1);

      if (hudSpeed) hudSpeed.textContent = `${String(speed).padStart(3, '0')} KM/H`;
      if (hudDistance) hudDistance.textContent = `${dist} KM`;

      // Update Active Chapter Text & HUD chapter indicator
      chapters.forEach((ch, idx) => {
        const el = chapterEls[idx];
        if (!el) return;

        const isActive = progress >= ch.start && progress <= ch.end;
        if (isActive && !el.classList.contains('active')) {
          chapterEls.forEach(c => c && c.classList.remove('active'));
          el.classList.add('active');
          if (hudChapterText) hudChapterText.textContent = ch.hudNumber || `0${idx + 1}/04`;
        } else if (!isActive && el.classList.contains('active')) {
          // Check if any other is active
          const anyActive = chapters.some(c => progress >= c.start && progress <= c.end);
          if (!anyActive) {
            el.classList.remove('active');
          }
        }
      });
    };
  }

  // --------------------------------------------------------------------------
  // 7. Section 2 — Statement Word-by-Word Scroll Reveal
  // --------------------------------------------------------------------------
  function initStatementWordScrub() {
    const quoteEl = document.getElementById('statement-quote');
    const section = document.getElementById('statement');
    if (!quoteEl || !section) return;

    const sentence = (CFG.statement && CFG.statement.sentence) || quoteEl.textContent.trim();
    const words = sentence.split(/\s+/);
    quoteEl.innerHTML = words.map(w => `<span class="statement-word">${w}</span>`).join(' ');

    const wordSpans = quoteEl.querySelectorAll('.statement-word');

    function updateWords() {
      const rect = section.getBoundingClientRect();
      const windowH = window.innerHeight;

      // Section progress from entering bottom to leaving top
      const start = windowH * 0.85;
      const end = -windowH * 0.2;
      const progress = clamp((start - rect.top) / (start - end), 0, 1);

      const totalWords = wordSpans.length;
      wordSpans.forEach((span, idx) => {
        const wordThreshold = (idx + 0.5) / totalWords;
        // Smooth interpolation per word around its threshold
        const wordProgress = clamp((progress - wordThreshold + 0.2) / 0.3, 0, 1);
        const opacity = 0.15 + wordProgress * 0.85; // 15% to 100%
        span.style.opacity = opacity.toFixed(3);
      });
    }

    window.addEventListener('scroll', updateWords, { passive: true });
    updateWords();
  }

  // --------------------------------------------------------------------------
  // 8. Section 3 — Dismantle Callouts Manager
  // --------------------------------------------------------------------------
  function setupDismantleCallouts(dismantleConfig) {
    const calloutsContainer = document.getElementById('dismantle-callouts');
    if (!calloutsContainer) return () => {};

    const calloutData = dismantleConfig.callouts || [];
    calloutsContainer.innerHTML = '';

    // Create Callout DOM elements with SVG leader lines
    const elements = calloutData.map(c => {
      const item = document.createElement('div');
      item.className = 'callout-item';
      item.id = `callout-${c.id}`;

      // Xenon Dot
      const dot = document.createElement('div');
      dot.className = 'callout-dot';
      dot.style.left = `${c.dotX}%`;
      dot.style.top = `${c.dotY}%`;

      // Text Content
      const content = document.createElement('div');
      content.className = 'callout-content';
      content.style.left = `${c.labelX}%`;
      content.style.top = `${c.labelY}%`;
      content.innerHTML = `
        <span class="callout-tag">${c.tag}</span>
        <span class="callout-desc">${c.desc}</span>
      `;

      // SVG Line
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'callout-svg-line');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', `${c.dotX}%`);
      line.setAttribute('y1', `${c.dotY}%`);
      line.setAttribute('x2', `${c.labelX}%`);
      line.setAttribute('y2', `${c.labelY}%`);
      line.setAttribute('stroke', '#CFE3FF');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-opacity', '0.6');
      svg.appendChild(line);

      item.appendChild(svg);
      item.appendChild(dot);
      item.appendChild(content);
      calloutsContainer.appendChild(item);

      return { el: item, data: c };
    });

    return function onDismantleProgress(progress) {
      elements.forEach(({ el, data }) => {
        if (progress >= data.start) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      });
    };
  }

  // --------------------------------------------------------------------------
  // 9. Section 4 — The Lineup (Hover Accordion)
  // --------------------------------------------------------------------------
  function initLineupAccordion() {
    const container = document.getElementById('lineup-container');
    const lineupSection = document.getElementById('lineup');
    if (!container || !lineupSection) return;

    const models = (CFG.lineup && CFG.lineup.models) || [];
    let activeIndex = (CFG.lineup && CFG.lineup.defaultOpenIndex) || 0;
    const hoverDebounceMs = (CFG.lineup && CFG.lineup.hoverDebounceMs) || 80;
    let hoverTimeout = null;

    container.innerHTML = '';

    const slideElements = models.map((car, idx) => {
      const slide = document.createElement('button');
      slide.type = 'button';
      slide.className = `lineup-slide ${idx === activeIndex ? 'open' : 'closed'}`;
      slide.setAttribute('role', 'tab');
      slide.setAttribute('aria-expanded', idx === activeIndex ? 'true' : 'false');
      slide.setAttribute('aria-label', `${car.number} ${car.name} — ${car.tagline}`);
      slide.setAttribute('data-cursor', idx === activeIndex ? 'CONFIGURE' : 'OPEN');

      const swatchesHtml = car.swatches.map((color, sIdx) => `
        <span class="swatch-box ${sIdx === 0 ? 'active' : ''}" style="background-color: ${color};" title="Color ${sIdx + 1}" data-color="${color}" aria-label="Color ${color}"></span>
      `).join('');

      const specsHtml = car.specs.map(s => `
        <div class="spec-cell">
          <span class="spec-cell-label">${s.label}</span>
          <span class="spec-cell-val">${s.value}</span>
        </div>
      `).join('');

      slide.innerHTML = `
        <div class="slide-floor-line" aria-hidden="true"></div>
        <div class="slide-car-wrap">
          <img class="slide-car-img" src="${car.image}" alt="${car.alt}" loading="lazy">
        </div>
        <div class="slide-closed-header">
          <span class="slide-closed-num">${car.number}</span>
          <span class="slide-closed-name">${car.name}</span>
        </div>
        <div class="slide-open-content">
          <div class="slide-open-top">
            <span class="slide-open-num">${car.number}</span>
            <h3 class="slide-open-name">${car.name}</h3>
          </div>
          <div class="slide-open-bottom">
            <p class="slide-tagline">${car.tagline}</p>
            <div class="slide-specs-row">${specsHtml}</div>
            <div class="slide-actions-row">
              <div class="slide-swatches" aria-label="Available Finishes">${swatchesHtml}</div>
              <a href="#reserve" class="slide-configure-link" data-cursor="RESERVE">Configure →</a>
            </div>
          </div>
        </div>
      `;

      // Swatch click logic
      slide.querySelectorAll('.swatch-box').forEach(sw => {
        sw.addEventListener('click', function (e) {
          e.stopPropagation();
          slide.querySelectorAll('.swatch-box').forEach(s => s.classList.remove('active'));
          sw.classList.add('active');
        });
      });

      // Hover open (desktop, debounced by 80ms)
      slide.addEventListener('mouseenter', function () {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(function () {
          activateSlide(idx);
        }, hoverDebounceMs);
      });

      // Click / Tap / Focus open
      slide.addEventListener('click', function () {
        activateSlide(idx);
      });

      container.appendChild(slide);
      return slide;
    });

    function activateSlide(index) {
      if (index === activeIndex) return;
      activeIndex = index;

      slideElements.forEach((s, i) => {
        const isOpen = i === index;
        s.classList.remove('open', 'closed', 'is-opening');

        if (isOpen) {
          s.classList.add('open', 'is-opening');
          s.setAttribute('aria-expanded', 'true');
          s.setAttribute('data-cursor', 'CONFIGURE');
          setTimeout(() => s.classList.remove('is-opening'), 50);
        } else {
          s.classList.add('closed');
          s.setAttribute('aria-expanded', 'false');
          s.setAttribute('data-cursor', 'OPEN');
        }
      });

      // Update cursor label if currently hovering over the slide
      const cursor = document.getElementById('custom-cursor');
      const cursorLabel = cursor ? cursor.querySelector('.cursor-label') : null;
      if (cursor && cursor.classList.contains('is-hovering') && cursorLabel) {
        cursorLabel.textContent = 'CONFIGURE';
      }
    }

    // Keyboard Arrow Navigation
    container.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (activeIndex + 1) % slideElements.length;
        activateSlide(next);
        slideElements[next].focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = (activeIndex - 1 + slideElements.length) % slideElements.length;
        activateSlide(prev);
        slideElements[prev].focus();
      }
    });

    // IntersectionObserver: Entrance rise of slides (40px + 0.08s stagger)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          lineupSection.classList.add('in-view');
          observer.unobserve(lineupSection);
        }
      });
    }, { threshold: 0.15 });
    observer.observe(lineupSection);

    // Refresh custom cursor listeners
    if (window.updateCursorTargets) window.updateCursorTargets();
  }

  // --------------------------------------------------------------------------
  // 10. Master Initialization Loop
  // --------------------------------------------------------------------------
  function init() {
    initFilmGrain();
    initCustomCursor();
    initNav();
    initStatementWordScrub();

    // Setup Hero Player
    const heroWrapper = document.getElementById('hero-wrapper');
    const heroCanvas = document.getElementById('hero-canvas');
    const heroProgressLine = document.getElementById('hero-progress-line');
    const heroConfig = CFG.hero || {};
    const onHeroProgress = setupHeroChapters(heroConfig);

    const heroPlayer = new FrameSequencePlayer({
      wrapper: heroWrapper,
      canvas: heroCanvas,
      frameCount: heroConfig.frameCount || 448,
      desktopPattern: heroConfig.desktopPathPattern || 'assets/frames/hero/frame_%s.webp',
      mobilePattern: heroConfig.mobilePathPattern || 'assets/frames/hero-mobile/frame_%s.webp',
      progressLine: heroProgressLine,
      fadeToBlackStart: heroConfig.fadeToBlackStart || 0.95,
      onProgress: onHeroProgress
    });

    // Setup Dismantle Player
    const dismantleWrapper = document.getElementById('dismantle-wrapper');
    const dismantleCanvas = document.getElementById('dismantle-canvas');
    const dismantleProgressLine = document.getElementById('dismantle-progress-line');
    const dismantleConfig = CFG.dismantle || {};
    const onDismantleProgress = setupDismantleCallouts(dismantleConfig);

    const dismantlePlayer = new FrameSequencePlayer({
      wrapper: dismantleWrapper,
      canvas: dismantleCanvas,
      frameCount: dismantleConfig.frameCount || 150,
      desktopPattern: dismantleConfig.desktopPathPattern || 'assets/frames/dismantle/frame_%s.webp',
      mobilePattern: dismantleConfig.mobilePathPattern || 'assets/frames/dismantle-mobile/frame_%s.webp',
      progressLine: dismantleProgressLine,
      onProgress: onDismantleProgress
    });

    // Init Lineup
    initLineupAccordion();

    // Unified requestAnimationFrame loop for 60fps scrub
    function mainRenderLoop() {
      heroPlayer.updateScroll();
      heroPlayer.tick();

      dismantlePlayer.updateScroll();
      dismantlePlayer.tick();

      requestAnimationFrame(mainRenderLoop);
    }
    requestAnimationFrame(mainRenderLoop);

    // Start preloader with hero initial frames
    initPreloader(heroPlayer, dismantlePlayer);

    // Reserve Button scroll / click feedback
    const btnReserve = document.getElementById('btn-reserve');
    if (btnReserve) {
      btnReserve.addEventListener('click', function () {
        btnReserve.querySelector('.btn-label').textContent = 'ALLOCATION REQUESTED';
        setTimeout(function () {
          btnReserve.querySelector('.btn-label').textContent = 'RESERVE YOUR NOCTIS';
        }, 3000);
      });
    }

    // Footer Model Links
    document.querySelectorAll('.footer-link[data-model]').forEach(link => {
      link.addEventListener('click', function (e) {
        const idx = parseInt(link.getAttribute('data-model'), 10);
        const lineupSlides = document.querySelectorAll('.lineup-slide');
        if (lineupSlides[idx]) {
          lineupSlides[idx].click();
        }
      });
    });
  }

  // DOMContentLoaded bootstrap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

