(function(){
  const desktop = document.getElementById('desktop');
  const clock = document.getElementById('menu-clock');
  const menus = Array.from(document.querySelectorAll('.menu'));
  const windows = Array.from(document.querySelectorAll('.mac-window'));
  let zIndexCounter = 10;
  let iosModeInitialized = false;

  function init() {
    setupClock();
    setupStatusClock();
    setupMenus();
    setupDesktopIcons();
    setupWindows();
    setupDock();
    setupIOS();
    setupLanguageAndWeather();
    detectMobileAndToggleMode();
    setupGlobalHandlers();
    setTimeout(() => {
      openWindow('win-about');
    }, 0);
  }

  function updateAppName(activeTitle) {
    const label = document.querySelector('.app-name');
    if (!label) return;
    label.textContent = activeTitle || 'Finder';
    label.classList.add('active');
    setTimeout(() => label.classList.remove('active'), 180);
  }

  // Clock
  function setupClock() {
    function format(dt) {
      const day = dt.toLocaleDateString(undefined, { weekday: 'short' });
      const month = dt.toLocaleDateString(undefined, { month: 'short' });
      const dayNum = dt.getDate();
      const hh = dt.getHours();
      const mm = dt.getMinutes().toString().padStart(2, '0');
      const ampm = hh >= 12 ? 'PM' : 'AM';
      const h12 = ((hh + 11) % 12 + 1);
      return `${day} ${month} ${dayNum} ${h12}:${mm} ${ampm}`;
    }
    function tick() {
      clock.textContent = format(new Date());
    }
    tick();
    setInterval(tick, 30_000);
  }

  // Status bar clock (mobile)
  function setupStatusClock() {
    const statusClock = document.getElementById('status-clock');
    if (!statusClock) return;
    function fmt(dt) {
      const hh = dt.getHours();
      const mm = dt.getMinutes().toString().padStart(2, '0');
      const h12 = ((hh + 11) % 12 + 1);
      return `${h12}:${mm}`;
    }
    const tick = () => { statusClock.textContent = fmt(new Date()); };
    tick();
    setInterval(tick, 30_000);
  }

  // Menus
  function setupMenus() {
    menus.forEach(menu => {
      const trigger = menu.querySelector('.menu-trigger');
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu(menu);
      });
      menu.querySelectorAll('.menu-dropdown [data-action]')
        .forEach(item => item.addEventListener('click', (e) => handleMenuAction(e, item)));
    });
    // Apple menu dropdown
    const appleBtn = document.querySelector('.apple-menu');
    const appleDrop = document.getElementById('apple-dropdown');
    if (appleBtn && appleDrop) {
      appleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = appleDrop.style.display === 'block';
        appleDrop.style.display = open ? 'none' : 'block';
      });
      document.addEventListener('click', () => { appleDrop.style.display = 'none'; });
      appleDrop.querySelectorAll('[data-action]')
        .forEach(item => item.addEventListener('click', (e) => handleMenuAction(e, item)));
    }
  }
  function toggleMenu(menu) {
    const isOpen = menu.classList.contains('open');
    closeAllMenus();
    if (!isOpen) {
      menu.classList.add('open');
      const trigger = menu.querySelector('.menu-trigger');
      trigger.setAttribute('aria-expanded', 'true');
    }
  }
  function closeAllMenus() {
    menus.forEach(menu => {
      menu.classList.remove('open');
      const trigger = menu.querySelector('.menu-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }
  function handleMenuAction(event, item) {
    const action = item.getAttribute('data-action');
    if (!action) return;
    switch(action) {
      case 'open-about': openWindow('win-about'); break;
      case 'open-blog': openWindow('win-blog'); break;
      case 'open-projects': openWindow('win-projects'); break;
      case 'open-contact': openWindow('win-contact'); break;
      case 'about-this-mac': openWindow('win-about-mac'); break;
      case 'minimize-all': minimizeAll(); break;
      case 'arrange-windows': tileWindows(); break;
      case 'tidy-icons': tidyIcons(); break;
      case 'show-grid': alert('Grid toggled'); break;
      // removed
      case 'sleep': alert('Zzz…'); break;
      case 'restart': alert('Restarting…'); break;
      case 'shutdown': alert('Shutting down…'); break;
      // removed
    }
    closeAllMenus();
  }

  // Language switching and weather
  const translations = {
    en: {
      'icon.about': 'About Me',
      'icon.projects': 'Projects',
      'icon.blog': 'Blog',
      'icon.contact': 'Contact',
      'win.about': 'About Me',
      'win.projects': 'Projects',
      'win.blog': 'Blog',
      'win.contact': 'Contact',
      'about.intro': "Hello! I'm Reza. I build performant, delightful web experiences.",
      'about.specialties': 'Specialties: UX Focused Design, JavaScript, Node.js, Shopify, A/B Testing, Analytics.',
      'contact.sayHello': 'Say hello:'
    },
    tr: {
      'icon.about': 'Hakkımda',
      'icon.projects': 'Projeler',
      'icon.blog': 'Blog',
      'icon.contact': 'İletişim',
      'win.about': 'Hakkımda',
      'win.projects': 'Projeler',
      'win.blog': 'Blog',
      'win.contact': 'İletişim',
      'about.intro': 'Merhaba! Ben Reza. Keyifli web deneyimleri geliştiriyorum.',
      'about.specialties': 'UX Tasarım, JavaScript, Node.js, Shopify, A/B Test.',
      'contact.sayHello': 'Merhaba deyin:'
    },
  };

  function applyLanguage(lang) {
    const dict = translations[lang] || translations.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });
    const btn = document.getElementById('lang-btn');
    if (btn) btn.textContent = (lang.toUpperCase()) + ' ▾';
  }

  function setupLanguageAndWeather() {
    // Language
    const btn = document.getElementById('lang-btn');
    const menu = document.getElementById('lang-menu');
    if (btn && menu) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = menu.style.display === 'block';
        menu.style.display = open ? 'none' : 'block';
        btn.setAttribute('aria-expanded', String(!open));
      });
      document.addEventListener('click', () => { menu.style.display = 'none'; btn.setAttribute('aria-expanded', 'false'); });
      menu.querySelectorAll('[data-lang]').forEach(item => {
        item.addEventListener('click', () => {
          const lang = item.getAttribute('data-lang');
          applyLanguage(lang);
          menu.style.display = 'none';
        });
      });
    }
    applyLanguage('en');

    // Weather (Istanbul via Open-Meteo)
    const weatherEl = document.getElementById('menu-weather');
    if (weatherEl && navigator.onLine) {
      // Istanbul approx: 41.0082, 28.9784
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=41.0082&longitude=28.9784&current_weather=true';
      fetch(url)
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(data => {
          const t = Math.round(data?.current_weather?.temperature);
          if (Number.isFinite(t)) weatherEl.textContent = `${t}°`;
        })
        .catch(() => { /* ignore */ });
    }
  }

  // Desktop Icons
  function setupDesktopIcons() {
    const icons = Array.from(document.querySelectorAll('.desktop-icon'));
    icons.forEach(icon => {
      const target = icon.getAttribute('data-target');
      icon.addEventListener('dblclick', () => { if (target) openWindow(target); });
      icon.addEventListener('click', (e) => {
        icons.forEach(i => i.classList.remove('selected'));
        icon.classList.add('selected');
      });
      icon.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && target) {
          e.preventDefault();
          openWindow(target);
        }
      });
    });
  }

  // Windows
  function setupWindows() {
    windows.forEach(win => {
      const titleBar = win.querySelector('[data-window-drag-handle]');
      const closeBtn = win.querySelector('[data-action="close"]');
      const minimizeBtn = win.querySelector('[data-action="minimize"]');
      const zoomBtn = win.querySelector('[data-action="zoom"]');
      // Position windows staggered on first open
      win.dataset.initialized = 'false';

      // Controls
      closeBtn?.addEventListener('click', () => closeWindow(win.id));
      minimizeBtn?.addEventListener('click', () => minimizeWindow(win.id));
      zoomBtn?.addEventListener('click', () => toggleZoom(win.id));

      // Focus
      win.addEventListener('mousedown', () => focusWindow(win));

      // Dragging
      enableDrag(win, titleBar);

      // Resizing
      enableResize(win);

      // Windowshade behavior: double-click on title bar collapses content
      let isShaded = false;
      titleBar?.addEventListener('dblclick', () => {
        const content = win.querySelector('.window-content');
        if (!content) return;
        isShaded = !isShaded;
        if (isShaded) {
          win.dataset.prevHeight = String(win.offsetHeight);
          content.style.display = 'none';
          win.style.height = '22px';
        } else {
          const prevH = parseInt(win.dataset.prevHeight || '360', 10);
          content.style.display = '';
          win.style.height = `${prevH}px`;
        }
      });
    });
  }

  function focusWindow(win) {
    windows.forEach(w => w.classList.remove('active'));
    win.classList.add('active');
    win.style.zIndex = String(++zIndexCounter);
    setDockIndicator(win.id, true);
    const title = win.querySelector('.title')?.textContent || '';
    updateAppName(title);
  }

  function openWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    const wasHidden = win.hasAttribute('hidden');
    win.removeAttribute('hidden');
    if (wasHidden && win.dataset.initialized !== 'true') {
      // Stagger placement
      const offset = (zIndexCounter - 10) * 16;
      const x = 80 + (offset % 160);
      const y = 80 + (offset % 120);
      setWindowPosition(win, x, y);
      win.dataset.initialized = 'true';
    }
    focusWindow(win);
    bounceDockIcon(id);
  }

  function closeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.setAttribute('hidden', '');
    setDockIndicator(id, false);
  }

  function minimizeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    animateGenieToDock(win, () => {
      win.setAttribute('hidden', '');
      setDockIndicator(id, false);
    });
  }

  function restoreWindowFromDock(id) {
    const win = document.getElementById(id);
    if (!win) return openWindow(id);
    const icon = document.querySelector(`.dock .dock-icon[data-win="${id}"]`);
    if (!icon) return openWindow(id);
    // prepare
    win.removeAttribute('hidden');
    focusWindow(win);
    animateFromIconToWindow(icon, win);
  }

  function minimizeAll() {
    windows.forEach(w => w.setAttribute('hidden', ''));
  }

  function toggleZoom(id) {
    const win = document.getElementById(id);
    if (!win) return;
    const isZoomed = win.dataset.zoomed === 'true';
    if (isZoomed) {
      // Restore size
      const w = parseInt(win.dataset.prevWidth || '520', 10);
      const h = parseInt(win.dataset.prevHeight || '360', 10);
      const x = parseInt(win.dataset.prevX || '80', 10);
      const y = parseInt(win.dataset.prevY || '80', 10);
      win.style.width = `${w}px`;
      win.style.height = `${h}px`;
      setWindowPosition(win, x, y);
      win.dataset.zoomed = 'false';
    } else {
      // Save and maximize within desktop
      win.dataset.prevWidth = String(win.offsetWidth);
      win.dataset.prevHeight = String(win.offsetHeight);
      const rect = win.getBoundingClientRect();
      win.dataset.prevX = String(rect.left);
      win.dataset.prevY = String(rect.top);
      const bounds = desktop.getBoundingClientRect();
      win.style.width = `${Math.max(300, bounds.width - 20)}px`;
      win.style.height = `${Math.max(200, bounds.height - 40)}px`;
      setWindowPosition(win, 10, 30);
      win.dataset.zoomed = 'true';
    }
  }

  function setWindowPosition(win, x, y) {
    const bounds = desktop.getBoundingClientRect();
    const maxX = bounds.width - win.offsetWidth - 2;
    const maxY = bounds.height - win.offsetHeight - 2;
    const clampedX = Math.max(2, Math.min(x, maxX));
    const clampedY = Math.max(24, Math.min(y, maxY));
    win.style.left = `${clampedX}px`;
    win.style.top = `${clampedY}px`;
  }

  function enableDrag(win, handle) {
    let isDragging = false;
    let startX = 0, startY = 0, winX = 0, winY = 0;

    handle.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      focusWindow(win);
      const rect = win.getBoundingClientRect();
      startX = e.clientX; startY = e.clientY;
      winX = rect.left; winY = rect.top;
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      setWindowPosition(win, winX + dx, winY + dy);
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      document.body.style.userSelect = '';
    });
  }

  function enableResize(win) {
    const handle = win.querySelector('.resize-handle');
    if (!handle) return;
    let isResizing = false;
    let startX = 0, startY = 0, startW = 0, startH = 0;

    handle.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isResizing = true;
      focusWindow(win);
      startX = e.clientX; startY = e.clientY;
      startW = win.offsetWidth; startH = win.offsetHeight;
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newW = Math.max(300, startW + dx);
      const newH = Math.max(180, startH + dy);
      win.style.width = `${newW}px`;
      win.style.height = `${newH}px`;
    });

    window.addEventListener('mouseup', () => {
      if (!isResizing) return;
      isResizing = false;
      document.body.style.userSelect = '';
    });
  }

  // macOS-style Dock
  const dockId = 'dock';
  const dockApps = [
    { id: 'win-about', label: 'About', iconHtml: `<i class="fa-regular fa-address-card"></i>` },
    { id: 'win-projects', label: 'Projects', iconHtml: `<i class="fa-regular fa-folder-open"></i>` },
    { id: 'win-blog', label: 'Blog', iconHtml: `<i class="fa-regular fa-note-sticky"></i>` },
    { id: 'win-contact', label: 'Contact', iconHtml: `<i class="fa-regular fa-envelope"></i>` }
  ];
  function ensureDock() {
    let dock = document.getElementById(dockId);
    if (!dock) {
      dock = document.createElement('div');
      dock.id = dockId;
      dock.className = 'dock';
      dock.setAttribute('role', 'toolbar');
      document.body.appendChild(dock);
    }
    return dock;
  }
  function setupDock() {
    const dock = ensureDock();
    dock.innerHTML = '';
    for (const app of dockApps) {
      const btn = document.createElement('button');
      btn.className = 'dock-icon';
      btn.setAttribute('data-win', app.id);
      btn.setAttribute('aria-label', app.label);
      btn.innerHTML = `${app.iconHtml}<span class="indicator"></span><span class="label">${app.label}</span>`;
      btn.addEventListener('click', () => {
        const win = document.getElementById(app.id);
        if (win && !win.hasAttribute('hidden')) {
          minimizeWindow(app.id);
        } else {
          restoreWindowFromDock(app.id);
        }
      });
      dock.appendChild(btn);
    }
    // magnification
    dock.addEventListener('mousemove', (e) => {
      const icons = Array.from(dock.querySelectorAll('.dock-icon'));
      icons.forEach(icon => {
        const rect = icon.getBoundingClientRect();
                 const cx = rect.left + rect.width/2;
         const dx = Math.abs(e.clientX - cx);
         const dist = Math.min(160, dx);
         const mag = 1 + (1 - dist/160) * 0.9; // up to 1.9x
        icon.style.setProperty('--mag', mag.toFixed(3));
        icon.style.transform = `scale(${mag.toFixed(3)})`;
      });
    });
    dock.addEventListener('mouseleave', () => {
      dock.querySelectorAll('.dock-icon').forEach(i => { i.style.transform = 'scale(1)'; i.style.removeProperty('--mag'); });
    });
  }
  function bounceDockIcon(id) {
    const icon = document.querySelector(`.dock .dock-icon[data-win="${id}"]`);
    if (!icon) return;
    icon.classList.remove('bounce');
    void icon.offsetWidth; // restart animation
    icon.classList.add('bounce');
    setDockIndicator(id, true);
  }
  function setDockIndicator(id, on) {
    const icon = document.querySelector(`.dock .dock-icon[data-win="${id}"]`);
    if (!icon) return;
    icon.classList.toggle('active', !!on);
  }

  // Window management helpers
  function tileWindows() {
    const openWins = windows.filter(w => !w.hasAttribute('hidden'));
    if (openWins.length === 0) return;
    const bounds = desktop.getBoundingClientRect();
    const cols = Math.ceil(Math.sqrt(openWins.length));
    const rows = Math.ceil(openWins.length / cols);
    const pad = 8;
    const cellW = Math.floor((bounds.width - pad*(cols+1)) / cols);
    const cellH = Math.floor((bounds.height - 30 - pad*(rows+1)) / rows);
    openWins.forEach((w, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const x = pad + c*(cellW + pad);
      const y = 30 + pad + r*(cellH + pad);
      w.style.width = `${Math.max(300, cellW)}px`;
      w.style.height = `${Math.max(180, cellH)}px`;
      setWindowPosition(w, x, y);
      focusWindow(w);
    });
  }

  function tidyIcons() {
    const icons = Array.from(document.querySelectorAll('.desktop-icon'));
    icons.forEach((icon, idx) => {
      icon.style.order = String(idx);
    });
  }

  // Global handlers
  function setupGlobalHandlers() {
    document.addEventListener('click', () => closeAllMenus());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const active = document.querySelector('.mac-window.active:not([hidden])');
        if (active) active.setAttribute('hidden', '');
      }
    });
  }

  // Boot overlay removed

  // iOS Mode
  function setupIOS() {
    cloneContentToIOS();
    setupSpringboard();
  }
  function enableIOSMode() {
    document.body.classList.add('ios-mode');
    updateModeVisibility();
    window.scrollTo(0,0);
    // Open About on first entry to iOS mode (after DOM updates)
    if (!iosModeInitialized) {
      iosModeInitialized = true;
      setTimeout(() => {
        showSpringboard();
        openIOSApp('ios-about');
      }, 0);
    }
  }
  function disableIOSMode() {
    document.body.classList.remove('ios-mode');
    updateModeVisibility();
  }
  function cloneContentToIOS() {
    const mapping = [
      ['win-about', 'ios-about'],
      ['win-projects', 'ios-projects'],
      ['win-blog', 'ios-blog'],
      ['win-contact', 'ios-contact']
    ];
    for (const [winId, iosId] of mapping) {
      const src = document.querySelector(`#${winId} .window-content`);
      const dest = document.querySelector(`#${iosId} .app-body`);
      if (src && dest && dest.childElementCount === 0) {
        dest.appendChild(src.cloneNode(true));
      }
    }
  }
  function setupSpringboard() {
    const springboard = document.getElementById('springboard');
    if (!springboard) return;

    // paging
    const pages = Array.from(document.querySelectorAll('.sb-page'));
    const dots = document.getElementById('page-dots');
    let current = 0; let downX = 0; let isDown = false;
    positionPages();
    function positionPages() {
      pages.forEach((p, i) => {
        p.style.transform = `translateX(${(i-current)*100}%)`;
        p.style.transition = 'transform 260ms cubic-bezier(0.2, 0.9, 0.2, 1)';
      });
      Array.from(dots.children).forEach((d,i)=> d.classList.toggle('active', i===current));
    }
    function goTo(i) { current = Math.max(0, Math.min(i, pages.length-1)); positionPages(); }

    function onDown(x){ isDown=true; downX=x; pages.forEach(p=>p.style.transition='none'); }
    function onMove(x){ if(!isDown) return; const dx=(x-downX)/springboard.clientWidth*100; pages.forEach((p,i)=>{p.style.transform=`translateX(${(i-current)*100+dx}%)`;}); }
    function onUp(x){ if(!isDown) return; isDown=false; const dx=(x-downX)/springboard.clientWidth; if (dx>0.15) goTo(current-1); else if(dx<-0.15) goTo(current+1); else positionPages(); }

    springboard.addEventListener('mousedown', e=>onDown(e.clientX));
    springboard.addEventListener('mousemove', e=>onMove(e.clientX));
    window.addEventListener('mouseup', e=>onUp(e.clientX));
    springboard.addEventListener('touchstart', e=>onDown(e.touches[0].clientX), { passive: true });
    springboard.addEventListener('touchmove', e=>onMove(e.touches[0].clientX), { passive: true });
    springboard.addEventListener('touchend', e=>onUp(e.changedTouches[0].clientX), { passive: true });
    dots.querySelectorAll('span').forEach(s=> s.addEventListener('click', ()=> goTo(parseInt(s.dataset.page,10))));

    springboard.querySelectorAll('[data-app]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = btn.getAttribute('data-app');
        const app = document.getElementById(targetId);
        if (!app) return;
        const icRect = btn.getBoundingClientRect();
        app.style.opacity = '0';
        app.style.transform = `translate(${icRect.left + icRect.width/2}px, ${icRect.top + icRect.height/2}px) scale(0.05)`;
        hideSpringboard();
        app.removeAttribute('hidden');
        requestAnimationFrame(() => {
          app.style.transition = 'transform 260ms cubic-bezier(0.2, 0.9, 0.2, 1), opacity 180ms ease-out';
          app.style.transform = 'translate(0,0) scale(1)';
          app.style.opacity = '1';
          setTimeout(() => { app.style.transition = ''; app.style.transform = ''; app.style.opacity = ''; }, 300);
        });
        // no home button; dock remains visible as it's outside springboard
      });
    });
    // Also wire global dock buttons (outside springboard)
    document.querySelectorAll('.ios-dock [data-app]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-app');
        openIOSApp(id);
      });
    });
    // home button removed

    // Jiggle on long press
    let pressTimer = null;
    springboard.addEventListener('touchstart', () => { pressTimer = setTimeout(() => springboard.classList.add('jiggle'), 600); }, { passive: true });
    springboard.addEventListener('touchend', () => { clearTimeout(pressTimer); pressTimer = null; });

    // Back buttons in apps
    document.querySelectorAll('.ios-app .ios-back').forEach(btn => {
      btn.addEventListener('click', () => showSpringboard());
    });
  }
  function openIOSApp(id) {
    const app = document.getElementById(id);
    if (!app) return;
    hideSpringboard();
    app.removeAttribute('hidden');
    app.classList.remove('opening');
    void app.offsetWidth;
    app.classList.add('opening');
    // home button removed
  }
  function showSpringboard() {
    document.querySelectorAll('.ios-app').forEach(a => a.setAttribute('hidden', ''));
    document.getElementById('springboard')?.removeAttribute('hidden');
  }
  function hideSpringboard() {
    document.getElementById('springboard')?.setAttribute('hidden', '');
  }
  function updateModeVisibility() {
    const isIOS = document.body.classList.contains('ios-mode');
    const sb = document.getElementById('springboard');
    if (isIOS) {
      windows.forEach(w => w.setAttribute('hidden', ''));
      sb?.removeAttribute('hidden');
    } else {
      sb?.setAttribute('hidden', '');
      document.querySelectorAll('.ios-app').forEach(a => a.setAttribute('hidden', ''));
    }
  }

  // Toggle iOS-like mode based on screen size only (<= 768px)
  function detectMobileAndToggleMode() {
    const apply = () => {
      const isSmall = window.matchMedia('(max-width: 768px)').matches;
      if (isSmall) enableIOSMode(); else disableIOSMode();
    };
    apply();
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
  }

  // Genie animation (approximate)
  function animateGenieToDock(win, onDone) {
    const icon = document.querySelector(`.dock .dock-icon[data-win="${win.id}"]`);
    if (!icon) { onDone?.(); return; }
    const winRect = win.getBoundingClientRect();
    const icRect = icon.getBoundingClientRect();
    const ghost = win.cloneNode(true);
    ghost.style.pointerEvents = 'none';
    ghost.style.position = 'fixed';
    ghost.style.left = `${winRect.left}px`;
    ghost.style.top = `${winRect.top}px`;
    ghost.style.width = `${winRect.width}px`;
    ghost.style.height = `${winRect.height}px`;
    ghost.style.opacity = '0.98';
    document.body.appendChild(ghost);
    // compute transform
    const dx = (icRect.left + icRect.width/2) - (winRect.left + winRect.width/2);
    const dy = (icRect.top) - (winRect.top + winRect.height);
    const scaleX = Math.max(0.05, icRect.width / winRect.width);
    const scaleY = Math.max(0.05, icRect.height / winRect.height);
    ghost.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1, borderRadius: getComputedStyle(win).borderRadius },
      { offset: 0.6, transform: `translate(${dx*0.9}px, ${dy*0.6}px) scale(${Math.max(scaleX,0.2)}, ${Math.max(scaleY,0.2)})`, opacity: 0.7, filter: 'blur(0.5px)' },
      { transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`, opacity: 0.0, filter: 'blur(1px)' }
    ], { duration: 380, easing: 'cubic-bezier(0.2, 0.9, 0.2, 1)' }).onfinish = () => {
      ghost.remove();
      onDone?.();
    };
  }

  function animateFromIconToWindow(icon, win) {
    const icRect = icon.getBoundingClientRect();
    const winRect = win.getBoundingClientRect();
    const ghost = win.cloneNode(true);
    ghost.style.pointerEvents = 'none';
    ghost.style.position = 'fixed';
    ghost.style.left = `${icRect.left}px`;
    ghost.style.top = `${icRect.top}px`;
    ghost.style.width = `${icRect.width}px`;
    ghost.style.height = `${icRect.height}px`;
    ghost.style.opacity = '0.0';
    document.body.appendChild(ghost);
    const dx = (winRect.left + winRect.width/2) - (icRect.left + icRect.width/2);
    const dy = (winRect.top + 22) - (icRect.top + icRect.height/2);
    const scaleX = Math.max(0.05, icRect.width / Math.max(1, winRect.width));
    const scaleY = Math.max(0.05, icRect.height / Math.max(1, winRect.height));
    ghost.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 0.0 },
      { offset: 0.2, opacity: 0.6 },
      { transform: `translate(${dx}px, ${dy}px) scale(${1/scaleX}, ${1/scaleY})`, opacity: 1 }
    ], { duration: 360, easing: 'cubic-bezier(0.2, 0.9, 0.2, 1)' }).onfinish = () => {
      ghost.remove();
      focusWindow(win);
    };
  }

  // iOS: Lock Screen, SpringBoard paging, and animations
  /* lock screen removed */ function setupLockScreen_removed() {
    const lock = document.getElementById('lock-screen');
    const thumb = document.querySelector('#lock-slider .slider-thumb');
    const time = document.getElementById('lock-time');
    if (!lock || !thumb || !time) return;
    const tick = () => {
      const d = new Date();
      const hh = ((d.getHours()+11)%12)+1;
      const mm = String(d.getMinutes()).padStart(2,'0');
      time.textContent = `${hh}:${mm}`;
    };
    tick(); setInterval(tick, 60_000);

    let dragging = false, startX = 0;
    thumb.addEventListener('mousedown', (e) => { dragging = true; startX = e.clientX; });
    window.addEventListener('mouseup', () => { if (!dragging) return; dragging = false; resetThumb(); });
    window.addEventListener('mousemove', (e) => { if (!dragging) return; dragTo(e.clientX); });
    thumb.addEventListener('touchstart', (e) => { dragging = true; startX = e.touches[0].clientX; }, { passive: true });
    window.addEventListener('touchend', () => { if (!dragging) return; dragging = false; resetThumb(); }, { passive: true });
    window.addEventListener('touchmove', (e) => { if (!dragging) return; dragTo(e.touches[0].clientX); }, { passive: true });

    function dragTo(x) {
      const track = document.querySelector('#lock-slider');
      const min = 4, max = track.clientWidth - thumb.clientWidth - 4;
      let dx = Math.max(min, Math.min(x - startX + 4, max));
      thumb.style.left = dx + 'px';
      if (dx >= max) {
        hideLockScreen();
        showSpringboard();
      }
    }
    function resetThumb() { thumb.style.left = '4px'; }
  }
  /* lock screen removed */

  // Start
  init();
})();