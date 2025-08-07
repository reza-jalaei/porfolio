(function(){
  const desktop = document.getElementById('desktop');
  const clock = document.getElementById('menu-clock');
  const menus = Array.from(document.querySelectorAll('.menu'));
  const windows = Array.from(document.querySelectorAll('.mac-window'));
  let zIndexCounter = 10;

  // Initialize
  function init() {
    setupClock();
    setupStatusClock();
    setupMenus();
    setupDesktopIcons();
    setupWindows();
    detectMobileAndToggleMode();
    setupGlobalHandlers();
    // Open About by default; if on mobile, zoom it for full-screen feel
    setTimeout(() => {
      openWindow('win-about');
      if (document.body.classList.contains('ios-mode')) {
        // Ensure about window is maximized
        try { toggleZoom('win-about'); } catch (_) {}
      }
    }, 0);
  }

  // Clock
  function setupClock() {
    function format(dt) {
      const hh = dt.getHours();
      const mm = dt.getMinutes().toString().padStart(2, '0');
      const ampm = hh >= 12 ? 'PM' : 'AM';
      const h12 = ((hh + 11) % 12 + 1);
      return `${h12}:${mm} ${ampm}`;
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
      case 'open-projects': openWindow('win-projects'); break;
      case 'open-contact': openWindow('win-contact'); break;
      case 'minimize-all': minimizeAll(); break;
      case 'arrange-windows': tileWindows(); break;
      case 'tidy-icons': tidyIcons(); break;
      case 'show-grid': alert('Grid toggled (demo)'); break;
      case 'about-this-site': alert('Built with vanilla HTML/CSS/JS, styled after Mac OS 9.'); break;
      case 'sleep': alert('Zzz… (demo)'); break;
      case 'restart': alert('Restarting… (demo)'); break;
      case 'shutdown': alert('Shutting down… (demo)'); break;
    }
    closeAllMenus();
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
  }

  function closeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.setAttribute('hidden', '');
  }

  function minimizeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.setAttribute('hidden', '');
    addToDock(id, win.querySelector('.title')?.textContent || id);
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

  // Simple dock for minimized windows
  const dockId = 'dock';
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
  function addToDock(id, label) {
    const dock = ensureDock();
    let btn = dock.querySelector(`[data-win="${id}"]`);
    if (!btn) {
      btn = document.createElement('button');
      btn.textContent = label;
      btn.setAttribute('data-win', id);
      btn.addEventListener('click', () => {
        openWindow(id);
        btn.remove();
      });
      dock.appendChild(btn);
    }
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

  // Toggle iOS-like mode on small screens or mobile user agents
  function detectMobileAndToggleMode() {
    const isSmall = window.matchMedia('(max-width: 640px)').matches;
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    if (isSmall || isMobileUA) {
      document.body.classList.add('ios-mode');
    } else {
      document.body.classList.remove('ios-mode');
    }
    window.addEventListener('resize', () => {
      const small = window.matchMedia('(max-width: 640px)').matches;
      if (small) document.body.classList.add('ios-mode');
      else document.body.classList.remove('ios-mode');
    });
  }

  // Start
  init();
})();