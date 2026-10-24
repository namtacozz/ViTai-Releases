/**
 * ViTai v4.1.2 - Interactive Landing Page Engine
 * Incorporates Bencho UI Image Compare Slider, Scrollspy, VietQR modal, and OS detection.
 * Zero-dependency, modern ES6 vanilla JavaScript
 */

const APP_VERSION = "4.1.4";
const DISCLAIMER_STORAGE_KEY = "vitai_disclaimer_accepted";

document.addEventListener('DOMContentLoaded', () => {
  renderAppVersion();
  initDisclaimerModal();
  initSmoothScroll();
  initSubtleAnimations();
  initBenchoImageCompare();
  initPillsScrollspy();
  initMobileDrawer();
  initHeaderScroll();
  detectUserOS();
});

/**
 * Render APP_VERSION across the document elements dynamically
 */
function renderAppVersion() {
  const versionTargets = document.querySelectorAll('[data-app-version]');
  versionTargets.forEach(el => {
    el.textContent = APP_VERSION;
  });

  const versionPrefixTargets = document.querySelectorAll('[data-app-version-v]');
  versionPrefixTargets.forEach(el => {
    el.textContent = `v${APP_VERSION}`;
  });
}

/* --------------------------------------------------------------------------
   MANDATORY FIRST-TIME DISCLAIMER MODAL
   Enforces user responsibility confirmation before interacting with the site.
   Escape and backdrop clicks disabled. Focus trapped inside modal.
   -------------------------------------------------------------------------- */
function initDisclaimerModal() {
  const modal = document.getElementById('disclaimer-modal');
  if (!modal) return;

  // Check if previously accepted
  try {
    const stored = localStorage.getItem(DISCLAIMER_STORAGE_KEY);
    if (stored) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      return;
    }
  } catch (e) {
    // If localStorage unavailable, allow modal to proceed
  }

  const acceptBtn = document.getElementById('disclaimer-accept-btn');
  const termsLink = modal.querySelector('a');

  // Lock body scroll only while modal is visible
  document.body.style.overflow = 'hidden';

  // Display modal and trigger entrance transition
  modal.style.display = 'flex';
  void modal.offsetWidth; // Force reflow
  modal.classList.add('active');

  // Focus the accept button
  setTimeout(() => {
    if (acceptBtn) acceptBtn.focus();
  }, 60);

  // Focus trap & Escape key blocker (capture phase)
  function handleKeyDown(e) {
    if (!modal.classList.contains('active')) return;

    // Block Escape key unconditionally
    if (e.key === 'Escape' || e.keyCode === 27) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Trap focus between focusable elements inside modal
    if (e.key === 'Tab') {
      const focusables = [termsLink, acceptBtn].filter(Boolean);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
  }

  window.addEventListener('keydown', handleKeyDown, true);

  // Accept button click handler
  if (acceptBtn) {
    acceptBtn.addEventListener('click', (e) => {
      e.preventDefault();

      // Store acceptance in localStorage with timestamp
      try {
        localStorage.setItem(DISCLAIMER_STORAGE_KEY, JSON.stringify({
          accepted: true,
          timestamp: new Date().toISOString()
        }));
      } catch (err) {
        console.warn('[ViTai Disclaimer] LocalStorage write failed:', err);
      }

      // Remove focus trap listener
      window.removeEventListener('keydown', handleKeyDown, true);

      // Restore scroll immediately and comprehensively
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }

      // Handle exit transition respecting prefers-reduced-motion
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      modal.classList.remove('active');
      if (prefersReduced) {
        modal.style.display = 'none';
      } else {
        setTimeout(() => {
          modal.style.display = 'none';
        }, 260);
      }
    });
  }
}

/* --------------------------------------------------------------------------
   BENCHO IMAGE COMPARE COMPONENT
   Draggable vertical slider comparing Dark and Light themes with snap buttons
   -------------------------------------------------------------------------- */
function initBenchoImageCompare() {
  const widgets = document.querySelectorAll('.bencho-compare-widget');
  if (!widgets.length) return;

  widgets.forEach((widget) => {
    const viewport = widget.querySelector('.compare-viewport');
    const clipLayer = widget.querySelector('.compare-layer-clip');
    const divider = widget.querySelector('.compare-divider');
    const handle = widget.querySelector('.divider-handle');
    const snapButtons = widget.querySelectorAll('.snap-btn');

    if (!viewport || !clipLayer || !divider) return;

    let isDragging = false;
    let currentPct = 50;

    /**
     * Updates the clip path and divider position
     * @param {number} pct Percentage of Dark theme visible (0 to 100)
     * @param {boolean} smooth If true, enables smooth CSS transition
     */
    function setSliderPosition(pct, smooth = false) {
      // Clamp between 0 and 100
      pct = Math.max(0, Math.min(100, pct));
      currentPct = pct;

      if (smooth) {
        clipLayer.style.transition = 'clip-path 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        divider.style.transition = 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        setTimeout(() => {
          clipLayer.style.transition = '';
          divider.style.transition = '';
        }, 300);
      } else {
        clipLayer.style.transition = 'none';
        divider.style.transition = 'none';
      }

      // clip-path: inset(top right bottom left) -> reveal dark theme from left
      // When pct = 100: inset(0 0% 0 0) -> 100% Dark visible
      // When pct = 50:  inset(0 50% 0 0) -> 50% Dark, 50% Light
      // When pct = 0:   inset(0 100% 0 0) -> 0% Dark (100% Light visible)
      const insetRight = (100 - pct).toFixed(2);
      clipLayer.style.clipPath = `inset(0 ${insetRight}% 0 0)`;
      clipLayer.style.webkitClipPath = `inset(0 ${insetRight}% 0 0)`;
      divider.style.left = `${pct.toFixed(2)}%`;

      if (handle) {
        handle.setAttribute('aria-valuenow', Math.round(pct));
      }

      // Update active snap button if exact or near match
      snapButtons.forEach(btn => {
        const snapVal = parseFloat(btn.getAttribute('data-snap'));
        if (Math.abs(pct - snapVal) < 3) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    /**
     * Calculates percentage from pointer event
     */
    function updateFromPointer(e) {
      const rect = viewport.getBoundingClientRect();
      const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const offsetX = clientX - rect.left;
      const pct = (offsetX / rect.width) * 100;
      setSliderPosition(pct, false);
    }

    // Pointer events on the viewport (supports both mouse and touch)
    viewport.addEventListener('pointerdown', (e) => {
      // Avoid text selection or image drag
      e.preventDefault();
      isDragging = true;
      viewport.setPointerCapture(e.pointerId);
      viewport.style.cursor = 'ew-resize';
      updateFromPointer(e);
    });

    viewport.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      updateFromPointer(e);
    });

    const stopDragging = (e) => {
      if (isDragging) {
        isDragging = false;
        try {
          viewport.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
    };

    viewport.addEventListener('pointerup', stopDragging);
    viewport.addEventListener('pointercancel', stopDragging);

    // Keyboard support when handle is focused
    if (handle) {
      handle.setAttribute('tabindex', '0');
      handle.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setSliderPosition(currentPct - 5, true);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setSliderPosition(currentPct + 5, true);
        } else if (e.key === 'Home') {
          e.preventDefault();
          setSliderPosition(0, true);
        } else if (e.key === 'End') {
          e.preventDefault();
          setSliderPosition(100, true);
        }
      });
    }

    // Snap buttons click handlers
    snapButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const snapVal = parseFloat(btn.getAttribute('data-snap'));
        if (!isNaN(snapVal)) {
          setSliderPosition(snapVal, true);
        }
      });
    });

    // Initialize with 50% split
    setSliderPosition(50, false);
  });
}

/* --------------------------------------------------------------------------
   STICKY FEATURE PILLS SCROLLSPY
   Highlights active feature pill based on scroll position
   -------------------------------------------------------------------------- */
function initPillsScrollspy() {
  const pills = document.querySelectorAll('.feature-pill');
  if (!pills.length) return;

  const sections = [];
  pills.forEach(pill => {
    const targetId = pill.getAttribute('href');
    if (targetId && targetId.startsWith('#')) {
      const section = document.querySelector(targetId);
      if (section) {
        sections.push({ pill, section, id: targetId });
      }
    }
  });

  if (!sections.length) return;

  const onScroll = () => {
    const scrollPos = window.scrollY + 220; // Offset for navbar and sticky pill bar
    let currentId = '';

    for (let i = sections.length - 1; i >= 0; i--) {
      const { section, id } = sections[i];
      if (section.offsetTop <= scrollPos) {
        currentId = id;
        break;
      }
    }

    if (!currentId && sections[0]) {
      currentId = sections[0].id;
    }

    pills.forEach(pill => {
      if (pill.getAttribute('href') === currentId) {
        if (!pill.classList.contains('active')) {
          pill.classList.add('active');
          // Auto-scroll pill container into view on mobile
          pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      } else {
        pill.classList.remove('active');
      }
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* --------------------------------------------------------------------------
   Mobile Drawer Navigation
   -------------------------------------------------------------------------- */
function initMobileDrawer() {
  const burgerBtn = document.getElementById('burger-trigger');
  const drawer = document.getElementById('mobile-drawer');
  const closeBtn = document.getElementById('drawer-close');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  if (!burgerBtn || !drawer) return;

  function openDrawer() {
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    document.body.style.overflow = '';
  }

  burgerBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (drawer.classList.contains('open') && 
        !drawer.contains(e.target) && 
        !burgerBtn.contains(e.target)) {
      closeDrawer();
    }
  });
}

/* --------------------------------------------------------------------------
   Header Blur & Shadow on Scroll
   -------------------------------------------------------------------------- */
function initHeaderScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.style.background = 'rgba(17, 18, 22, 0.95)';
      navbar.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.45)';
    } else {
      navbar.style.background = 'rgba(17, 18, 22, 0.85)';
      navbar.style.boxShadow = 'none';
    }
  }, { passive: true });
}

/* --------------------------------------------------------------------------
   Simple Toast Notification
   -------------------------------------------------------------------------- */
function showToast(message) {
  let toast = document.getElementById('vitai-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'vitai-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 28px;
      right: 28px;
      background: #E0562D;
      color: #ffffff;
      padding: 12px 24px;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 700;
      box-shadow: 0 8px 24px rgba(224, 86, 45, 0.45);
      z-index: 4000;
      opacity: 0;
      transform: translateY(12px);
      transition: all 0.25s ease;
      pointer-events: none;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
  }, 2500);
}

/* --------------------------------------------------------------------------
   OS Auto-Detection
   -------------------------------------------------------------------------- */
function detectUserOS() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = (window.navigator.userAgentData?.platform || window.navigator.platform || '').toLowerCase();
  const heroDlBtn = document.getElementById('hero-dl-btn');
  const heroSecondaryBtn = document.getElementById('hero-secondary-btn');
  const drawerDlBtn = document.getElementById('drawer-dl-btn');
  const winCard = document.getElementById('dl-card-windows');
  const linuxCard = document.getElementById('dl-card-linux');
  const switchToLinuxBtn = document.getElementById('switch-to-linux-btn');
  const switchToWinBtn = document.getElementById('switch-to-windows-btn');

  const WIN_ICON_PATH = 'M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.949-1.801';
  const LINUX_ICON_PATH = 'M12.007 0C9.697 0 7.824 1.77 7.747 4.081c-.035 1.05.21 2.083.714 2.977C6.012 8.358 4.417 11.235 4.417 14.54c0 3.313 1.83 5.484 4.148 6.554-.258.625-.567 1.228-.938 1.777-.32.476-.089 1.13.486 1.13h7.774c.575 0 .806-.654.486-1.13-.371-.549-.68-1.152-.938-1.777 2.318-1.07 4.148-3.241 4.148-6.554 0-3.305-1.595-6.182-4.044-7.482.504-.894.749-1.927.714-2.977C16.19 1.77 14.317 0 12.007 0z';

  const isLinux = (userAgent.includes('linux') || platform.includes('linux')) && !userAgent.includes('android');

  // Helper to activate specific OS card
  function setDownloadOS(targetOS) {
    if (targetOS === 'linux') {
      if (winCard) {
        winCard.hidden = true;
        winCard.setAttribute('hidden', '');
        winCard.style.display = 'none';
      }
      if (linuxCard) {
        linuxCard.hidden = false;
        linuxCard.removeAttribute('hidden');
        linuxCard.style.display = 'flex';
        linuxCard.style.opacity = '1';
        linuxCard.style.visibility = 'visible';
      }

      if (heroDlBtn) {
        const iconPath = heroDlBtn.querySelector('.cta-icon path');
        if (iconPath) iconPath.setAttribute('d', LINUX_ICON_PATH);
        const mainText = heroDlBtn.querySelector('.cta-main');
        const subText = heroDlBtn.querySelector('.cta-sub');
        if (mainText) mainText.textContent = `Tải ViTai v${APP_VERSION} (Linux)`;
        if (subText) subText.textContent = 'Bản .tar.gz (X11 & Wayland) • Portable';
        heroDlBtn.href = `https://github.com/namtacozz/ViTai-Releases/releases/download/v${APP_VERSION}/ViTai-Linux-x86_64.tar.gz`;
        heroDlBtn.removeAttribute('download');
      }

      if (heroSecondaryBtn) {
        const iconPath = heroSecondaryBtn.querySelector('.cta-icon path');
        if (iconPath) iconPath.setAttribute('d', WIN_ICON_PATH);
        const mainText = heroSecondaryBtn.querySelector('.cta-main');
        const subText = heroSecondaryBtn.querySelector('.cta-sub');
        if (mainText) mainText.textContent = 'Bản Windows (.zip)';
        if (subText) subText.textContent = 'Win 10/11 64-bit';
      }

      if (drawerDlBtn) {
        drawerDlBtn.textContent = 'Tải về cho Linux x86_64';
        drawerDlBtn.href = `https://github.com/namtacozz/ViTai-Releases/releases/download/v${APP_VERSION}/ViTai-Linux-x86_64.tar.gz`;
      }
    } else {
      if (linuxCard) {
        linuxCard.hidden = true;
        linuxCard.setAttribute('hidden', '');
        linuxCard.style.display = 'none';
      }
      if (winCard) {
        winCard.hidden = false;
        winCard.removeAttribute('hidden');
        winCard.style.display = 'flex';
        winCard.style.opacity = '1';
        winCard.style.visibility = 'visible';
      }

      if (heroDlBtn) {
        const iconPath = heroDlBtn.querySelector('.cta-icon path');
        if (iconPath) iconPath.setAttribute('d', WIN_ICON_PATH);
        const mainText = heroDlBtn.querySelector('.cta-main');
        const subText = heroDlBtn.querySelector('.cta-sub');
        if (mainText) mainText.textContent = `Tải ViTai v${APP_VERSION} (Windows)`;
        if (subText) subText.textContent = 'Bản 64-bit chạy ngay, không cần cài đặt';
        heroDlBtn.href = `https://github.com/namtacozz/ViTai-Releases/releases/download/v${APP_VERSION}/ViTai-Windows-x64.zip`;
        heroDlBtn.removeAttribute('download');
      }

      if (heroSecondaryBtn) {
        const iconPath = heroSecondaryBtn.querySelector('.cta-icon path');
        if (iconPath) iconPath.setAttribute('d', LINUX_ICON_PATH);
        const mainText = heroSecondaryBtn.querySelector('.cta-main');
        const subText = heroSecondaryBtn.querySelector('.cta-sub');
        if (mainText) mainText.textContent = 'Bản Linux';
        if (subText) subText.textContent = 'Ubuntu, Fedora, Arch';
      }

      if (drawerDlBtn) {
        drawerDlBtn.textContent = 'Tải về cho Windows x64';
        drawerDlBtn.href = `https://github.com/namtacozz/ViTai-Releases/releases/download/v${APP_VERSION}/ViTai-Windows-x64.zip`;
      }
    }
  }

  // Set initial OS view based on client detection
  setDownloadOS(isLinux ? 'linux' : 'windows');

  // Manual switch event handlers
  if (switchToLinuxBtn) {
    switchToLinuxBtn.addEventListener('click', (e) => {
      e.preventDefault();
      setDownloadOS('linux');
    });
  }

  if (switchToWinBtn) {
    switchToWinBtn.addEventListener('click', (e) => {
      e.preventDefault();
      setDownloadOS('windows');
    });
  }
}

/* --------------------------------------------------------------------------
   Native Smooth Scrolling Engine (100% reliable across all hardware & browsers)
   -------------------------------------------------------------------------- */
function initSmoothScroll() {
  document.documentElement.style.scrollBehavior = 'smooth';
}

/* --------------------------------------------------------------------------
   Purposeful & Subtle GSAP Animations (Linear / Raycast / Supabase style)
   Strictly zero AI-slop: Fast (0.4-0.6s), transform/opacity only, trigger once.
   -------------------------------------------------------------------------- */
function initSubtleAnimations() {
  // 1. Accessibility guard: if user prefers reduced motion, do not animate
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    console.info('[ViTai Animation] prefers-reduced-motion active: decorative animations disabled.');
    return;
  }

  // Ensure GSAP is loaded
  if (typeof gsap === 'undefined') return;

  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // --- A. HERO SECTION: SplitText Word Reveal ---
  const heroHeading = document.querySelector('.hero-heading');
  if (heroHeading) {
    // If SplitText is available, stagger by WORDS (smooth and respectful of Vietnamese diacritics)
    if (typeof SplitText !== 'undefined') {
      try {
        const split = new SplitText(heroHeading, { type: 'words', wordsClass: 'hero-word' });
        gsap.from(split.words, {
          opacity: 0,
          y: 16,
          duration: 0.55,
          stagger: 0.04,
          ease: 'power2.out',
          clearProps: 'all',
        });
      } catch (e) {
        // Fallback simple reveal
        gsap.from(heroHeading, { opacity: 0, y: 16, duration: 0.6, ease: 'power2.out' });
      }
    } else {
      gsap.from(heroHeading, { opacity: 0, y: 16, duration: 0.6, ease: 'power2.out' });
    }

    // Hero secondary elements soft fade
    gsap.from('.hero-chip', { opacity: 0, y: 10, duration: 0.45, delay: 0.05, ease: 'power2.out' });
    gsap.from('.hero-subtext', { opacity: 0, y: 12, duration: 0.5, delay: 0.15, ease: 'power2.out' });
    gsap.from('.hero-cta-wrapper', { opacity: 0, y: 12, duration: 0.5, delay: 0.25, ease: 'power2.out' });
    gsap.from('.hero-card-frame', { opacity: 0, y: 20, duration: 0.65, delay: 0.2, ease: 'power2.out' });
  }

  // --- B. HERO METRIC COUNT-UP ---
  const countElements = document.querySelectorAll('.hero-metrics [data-count]');
  if (countElements.length && typeof ScrollTrigger !== 'undefined') {
    countElements.forEach((el) => {
      const targetVal = parseFloat(el.getAttribute('data-count')) || 0;
      const suffix = el.getAttribute('data-suffix') || '';
      const counter = { val: 0 };

      gsap.to(counter, {
        val: targetVal,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 92%',
          once: true,
        },
        onUpdate: () => {
          el.textContent = `${Math.round(counter.val)}${suffix}`;
        },
        onComplete: () => {
          el.textContent = `${targetVal}${suffix}`;
        },
      });
    });
  }

  // --- C. FEATURE SHOWCASE SECTIONS: Subtle Slide-In on Scroll (Trigger Once) ---
  const featureArticles = document.querySelectorAll('.feature-detail-section');
  if (featureArticles.length && typeof ScrollTrigger !== 'undefined') {
    featureArticles.forEach((article) => {
      const infoCol = article.querySelector('.feature-info-col');
      const visualCol = article.querySelector('.feature-visual-col');

      if (infoCol) {
        gsap.from(infoCol, {
          opacity: 0,
          y: 22,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: article,
            start: 'top 82%',
            once: true,
          },
          clearProps: 'all',
        });
      }

      if (visualCol) {
        gsap.from(visualCol, {
          opacity: 0,
          y: 22,
          duration: 0.6,
          delay: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: article,
            start: 'top 82%',
            once: true,
          },
          clearProps: 'all',
        });
      }
    });
  }

  // --- D. PRICING CARDS ---
  const pricingCards = document.querySelectorAll('.pricing-card');
  if (pricingCards.length && typeof ScrollTrigger !== 'undefined') {
    gsap.from(pricingCards, {
      opacity: 0,
      y: 20,
      duration: 0.55,
      stagger: 0.1,
      ease: 'power2.out',
      clearProps: 'all',
      scrollTrigger: {
        trigger: pricingCards[0].parentElement,
        start: 'top 85%',
        once: true,
      },
    });
  }

  // --- E. DISCORD COMMUNITY BANNER ---
  const discordCard = document.querySelector('.discord-community-card');
  if (discordCard && typeof ScrollTrigger !== 'undefined') {
    gsap.from(discordCard, {
      opacity: 0,
      y: 18,
      duration: 0.55,
      ease: 'power2.out',
      clearProps: 'all',
      scrollTrigger: {
        trigger: discordCard,
        start: 'top 88%',
        once: true,
      },
    });
  }

  // Refresh ScrollTrigger once full assets (fonts, images) settle
  window.addEventListener('load', () => {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  });
}

