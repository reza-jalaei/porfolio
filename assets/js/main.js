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
    setupSnake();
    setupLanguageAndWeather();
    detectMobileAndToggleMode();
    setupGlobalHandlers();
    setupHashNav();
    setupProjectGate();
    // Open default window on desktop only (respect deep-link hash if present)
    setTimeout(() => {
      if (!document.body.classList.contains('ios-mode')) {
        const route = currentHashRoute();
        openWindow(route ? route[0] : 'win-about');
      }
    }, 0);
  }
  // Snake Game
  function setupSnake() {
    const gameContainers = Array.from(document.querySelectorAll('.snake-game'));
    if (gameContainers.length === 0) return;
    for (const container of gameContainers) initSnakeInstance(container);
  }

  function initSnakeInstance(container) {
    const canvas = container.querySelector('.snake-canvas');
    const scoreEl = container.querySelector('[data-score]');
    const statusEl = container.querySelector('[data-status]');
    const btnToggle = container.querySelector('[data-action="toggle"]');
    const btnRestart = container.querySelector('[data-action="restart"]');
    const btns = container.querySelectorAll('[data-dir]');
    if (!canvas || !scoreEl || !statusEl) return;

    const ctx = canvas.getContext('2d');
    const gridSize = 16; // pixels per cell
    const cols = Math.floor(canvas.width / gridSize);
    const rows = Math.floor(canvas.height / gridSize);
    const initialSpeedMs = 140;

    let snake = [ {x: 5, y: 8}, {x:4, y:8}, {x:3, y:8} ];
    let dir = {x: 1, y: 0};
    let pendingDir = dir;
    let food = spawnFood();
    let score = 0;
    let running = false;
    let rafId = null;
    let lastTick = 0;
    let speedMs = initialSpeedMs;

    function spawnFood() {
      let fx, fy;
      do {
        fx = Math.floor(Math.random() * cols);
        fy = Math.floor(Math.random() * rows);
      } while (snake.some(s => s.x === fx && s.y === fy));
      return { x: fx, y: fy };
    }

    function drawCell(x, y, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x*gridSize, y*gridSize, gridSize, gridSize);
    }

    function drawGrid() {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      // food
      drawCell(food.x, food.y, '#e74c3c');
      // snake
      snake.forEach((seg, idx) => {
        drawCell(seg.x, seg.y, idx === 0 ? '#2ecc71' : '#27ae60');
      });
    }

    function step(now) {
      if (!running) return;
      if (now - lastTick < speedMs) { rafId = requestAnimationFrame(step); return; }
      lastTick = now;

      // apply pending direction (prevent reversing)
      if ((pendingDir.x !== -dir.x || pendingDir.y !== -dir.y)) {
        dir = pendingDir;
      }

      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      // wall collision
      if (head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows) {
        return gameOver();
      }
      // self collision
      if (snake.some((s, i) => i>0 && s.x === head.x && s.y === head.y)) {
        return gameOver();
      }
      snake.unshift(head);
      // eat
      if (head.x === food.x && head.y === food.y) {
        score += 10; speedMs = Math.max(70, speedMs - 2);
        updateHUD();
        food = spawnFood();
      } else {
        snake.pop();
      }
      drawGrid();
      rafId = requestAnimationFrame(step);
    }

    function updateHUD() {
      scoreEl.textContent = String(score);
      statusEl.textContent = running ? 'Running' : 'Paused';
    }

    function start() {
      if (running) return;
      running = true; updateHUD(); lastTick = 0; rafId = requestAnimationFrame(step);
    }
    function pause() { running = false; updateHUD(); if (rafId) cancelAnimationFrame(rafId); }
    function restart() {
      snake = [ {x: 5, y: 8}, {x:4, y:8}, {x:3, y:8} ];
      dir = {x:1, y:0}; pendingDir = dir; food = spawnFood(); score = 0; speedMs = initialSpeedMs;
      drawGrid(); updateHUD();
    }
    function gameOver() {
      pause(); statusEl.textContent = 'Game Over';
    }

    // Keyboard controls (desktop)
    function onKey(e) {
      const k = e.key;
      if (k === 'ArrowUp') pendingDir = {x:0,y:-1};
      else if (k === 'ArrowDown') pendingDir = {x:0,y:1};
      else if (k === 'ArrowLeft') pendingDir = {x:-1,y:0};
      else if (k === 'ArrowRight') pendingDir = {x:1,y:0};
      else if (k === ' ' || k === 'Enter') { running ? pause() : start(); }
    }
    container.addEventListener('mouseenter', () => { window.addEventListener('keydown', onKey); });
    container.addEventListener('mouseleave', () => { window.removeEventListener('keydown', onKey); });

    // Touch controls (mobile)
    btns.forEach(b => b.addEventListener('click', () => {
      const d = b.getAttribute('data-dir');
      if (d === 'up') pendingDir = {x:0,y:-1};
      if (d === 'down') pendingDir = {x:0,y:1};
      if (d === 'left') pendingDir = {x:-1,y:0};
      if (d === 'right') pendingDir = {x:1,y:0};
    }));
    btnToggle?.addEventListener('click', () => { running ? pause() : start(); });
    btnRestart?.addEventListener('click', () => { restart(); start(); });

    // Initial draw
    drawGrid(); updateHUD();
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
      case 'sleep': alert('Zzz…'); break;
      case 'restart': window.location.reload(); break;
      case 'shutdown': alert('Shutting down…'); break;
    }
    closeAllMenus();
  }

  // Language switching and weather
  const translations = {
    en: {
      // Menu bar
      'menu.file': 'File',
      'menu.edit': 'Edit',
      'menu.view': 'View',
      'menu.go': 'Go',
      'menu.window': 'Window',
      'menu.sleep': 'Sleep',
      'menu.restart': 'Restart…',
      'menu.shutDown': 'Shut Down…',
      'menu.cut': 'Cut',
      'menu.copy': 'Copy',
      'menu.paste': 'Paste',
      'menu.selectAll': 'Select All',
      'menu.tidyUp': 'Tidy Up',
      'menu.showGrid': 'Show Grid',
      'menu.arrange': 'Arrange',
      'menu.minimizeAll': 'Minimize All',
      'menu.aboutThisMac': 'About This Mac',
      // Desktop icon labels
      'icon.about': 'About Me',
      'icon.projects': 'Projects',
      'icon.blog': 'Blog',
      'icon.contact': 'Contact',
      'icon.privacy': 'Privacy',
      // SpringBoard / iOS app titles
      'nav.about': 'About',
      'nav.projects': 'Projects',
      'nav.blog': 'Blog',
      'nav.contact': 'Contact',
      'nav.privacy': 'Privacy',
      // Window titles
      'win.about': 'About Me',
      'win.projects': 'Projects',
      'win.blog': 'Blog',
      'win.contact': 'Contact',
      'win.privacy': 'Privacy Policy',
      // About
      'about.intro': "Hello! I'm Reza. I build performant, delightful web experiences.",
      'about.role': 'Senior CRO Consultant and Product Owner at',
      'about.workExperience': 'Work Experience',
      'about.whoAmI': 'Who am I?',
      'about.bio1': "I'm an artist and software engineer with a passion for building products and online experiences that revolutionize the way people interact with the world.",
      'about.bio2': "I'm a big believer in optimization through experimentation and data-driven decision making.",
      'about.bio3': "I've been fortunate to have worked with some of the most innovative companies in the world, from startups and small online stores to Fortune 500 companies.",
      // Skill chips
      'chip.uxDesign': 'UX Design',
      'chip.abTesting': 'A/B Testing',
      'chip.analytics': 'Analytics',
      // Projects
      'projects.heading': 'Clients & Projects',
      // Contact
      'contact.sayHello': 'Say hello:',
      'form.name': 'Name',
      'form.email': 'Email',
      'form.message': 'Message',
      'form.namePlaceholder': 'Your Name',
      'form.emailPlaceholder': 'Your Email',
      'form.messagePlaceholder': 'Your Message',
      'form.send': 'Send',
      // iOS chrome
      'ios.home': 'Home',
    },
    tr: {
      'menu.file': 'Dosya',
      'menu.edit': 'Düzen',
      'menu.view': 'Görünüm',
      'menu.go': 'Git',
      'menu.window': 'Pencere',
      'menu.sleep': 'Uyku',
      'menu.restart': 'Yeniden Başlat…',
      'menu.shutDown': 'Kapat…',
      'menu.cut': 'Kes',
      'menu.copy': 'Kopyala',
      'menu.paste': 'Yapıştır',
      'menu.selectAll': 'Tümünü Seç',
      'menu.tidyUp': 'Topla',
      'menu.showGrid': 'Izgarayı Göster',
      'menu.arrange': 'Yerleştir',
      'menu.minimizeAll': 'Tümünü Küçült',
      'menu.aboutThisMac': 'Bu Mac Hakkında',
      'icon.about': 'Hakkımda',
      'icon.projects': 'Projeler',
      'icon.blog': 'Blog',
      'icon.contact': 'İletişim',
      'icon.privacy': 'Gizlilik',
      'nav.about': 'Hakkımda',
      'nav.projects': 'Projeler',
      'nav.blog': 'Blog',
      'nav.contact': 'İletişim',
      'nav.privacy': 'Gizlilik',
      'win.about': 'Hakkımda',
      'win.projects': 'Projeler',
      'win.blog': 'Blog',
      'win.contact': 'İletişim',
      'win.privacy': 'Gizlilik Politikası',
      'about.intro': 'Merhaba! Ben Reza. Keyifli web deneyimleri geliştiriyorum.',
      'about.role': 'Kıdemli CRO Danışmanı ve Ürün Sahibi —',
      'about.workExperience': 'İş Deneyimi',
      'about.whoAmI': 'Ben kimim?',
      'about.bio1': 'Ürünler ve çevrimiçi deneyimler oluşturmaya tutkuyla bağlı bir sanatçı ve yazılım mühendisiyim; insanların dünyayla etkileşim biçimini dönüştürmeyi amaçlıyorum.',
      'about.bio2': 'Deneylere ve veriye dayalı karar almaya dayanan optimizasyona güçlü bir şekilde inanıyorum.',
      'about.bio3': 'Yeni girişimlerden küçük çevrimiçi mağazalara ve Fortune 500 şirketlerine kadar dünyanın en yenilikçi şirketlerinden bazılarıyla çalışma şansına eriştim.',
      'chip.uxDesign': 'UX Tasarımı',
      'chip.abTesting': 'A/B Testi',
      'chip.analytics': 'Analitik',
      'projects.heading': 'Müşteriler ve Projeler',
      'contact.sayHello': 'Merhaba deyin:',
      'form.name': 'Ad',
      'form.email': 'E-posta',
      'form.message': 'Mesaj',
      'form.namePlaceholder': 'Adınız',
      'form.emailPlaceholder': 'E-postanız',
      'form.messagePlaceholder': 'Mesajınız',
      'form.send': 'Gönder',
      'ios.home': 'Ana Ekran',
    },
    sv: {
      'menu.file': 'Arkiv',
      'menu.edit': 'Redigera',
      'menu.view': 'Visa',
      'menu.go': 'Gå',
      'menu.window': 'Fönster',
      'menu.sleep': 'Vila',
      'menu.restart': 'Starta om…',
      'menu.shutDown': 'Stäng av…',
      'menu.cut': 'Klipp ut',
      'menu.copy': 'Kopiera',
      'menu.paste': 'Klistra in',
      'menu.selectAll': 'Markera allt',
      'menu.tidyUp': 'Städa upp',
      'menu.showGrid': 'Visa rutnät',
      'menu.arrange': 'Ordna',
      'menu.minimizeAll': 'Minimera alla',
      'menu.aboutThisMac': 'Om den här datorn',
      'icon.about': 'Om mig',
      'icon.projects': 'Projekt',
      'icon.blog': 'Blogg',
      'icon.contact': 'Kontakt',
      'icon.privacy': 'Integritet',
      'nav.about': 'Om mig',
      'nav.projects': 'Projekt',
      'nav.blog': 'Blogg',
      'nav.contact': 'Kontakt',
      'nav.privacy': 'Integritet',
      'win.about': 'Om mig',
      'win.projects': 'Projekt',
      'win.blog': 'Blogg',
      'win.contact': 'Kontakt',
      'win.privacy': 'Integritetspolicy',
      'about.intro': 'Hej! Jag heter Reza. Jag bygger snabba och förtjusande webbupplevelser.',
      'about.role': 'Senior CRO-konsult och produktägare på',
      'about.workExperience': 'Arbetslivserfarenhet',
      'about.whoAmI': 'Vem är jag?',
      'about.bio1': 'Jag är en konstnär och mjukvaruingenjör med en passion för att bygga produkter och digitala upplevelser som förändrar hur människor interagerar med världen.',
      'about.bio2': 'Jag tror starkt på optimering genom experiment och datadrivet beslutsfattande.',
      'about.bio3': 'Jag har haft förmånen att arbeta med några av världens mest innovativa företag, från nystartade bolag och små webbutiker till Fortune 500-företag.',
      'chip.uxDesign': 'UX-design',
      'chip.abTesting': 'A/B-testning',
      'chip.analytics': 'Analys',
      'projects.heading': 'Kunder & projekt',
      'contact.sayHello': 'Säg hej:',
      'form.name': 'Namn',
      'form.email': 'E-post',
      'form.message': 'Meddelande',
      'form.namePlaceholder': 'Ditt namn',
      'form.emailPlaceholder': 'Din e-post',
      'form.messagePlaceholder': 'Ditt meddelande',
      'form.send': 'Skicka',
      'ios.home': 'Hem',
    },
  };

  function getInitialLang() {
    let lang = '';
    try {
      const params = new URLSearchParams(location.search);
      lang = params.get('lang') || localStorage.getItem('lang') || '';
    } catch (e) { /* query/storage unavailable */ }
    lang = (lang || 'en').toLowerCase();
    return translations[lang] ? lang : 'en';
  }

  function applyLanguage(lang) {
    if (!translations[lang]) lang = 'en';
    const dict = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) el.setAttribute('placeholder', dict[key]);
    });
    const btn = document.getElementById('lang-btn');
    if (btn) btn.innerHTML = (lang.toUpperCase()) + ' <i class="fa-solid fa-chevron-down"></i>';
    document.documentElement.lang = lang;
    try { localStorage.setItem('lang', lang); } catch (e) { /* storage unavailable */ }
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
    applyLanguage(getInitialLang());

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
      // Compute intended placement first (used for fit check)
      const offset = (zIndexCounter - 10) * 16;
      const intendedX = 80 + (offset % 160);
      const intendedY = 80 + (offset % 120);

      // On desktop, try to fit height to content if it will fully fit on screen
      if (!document.body.classList.contains('ios-mode')) {
        const titleBarEl = win.querySelector('.title-bar');
        const contentEl = win.querySelector('.window-content');
        if (titleBarEl && contentEl) {
          // Ensure layout is up-to-date
          void contentEl.offsetHeight;
          const desktopBounds = desktop.getBoundingClientRect();
          const titleHeight = titleBarEl.offsetHeight || 22;
          const contentHeight = contentEl.scrollHeight;
          const desiredHeight = titleHeight + contentHeight;
          const bottomMargin = 10; // small breathing room at bottom
          const availableHeight = Math.max(200, desktopBounds.height - intendedY - bottomMargin);
          if (desiredHeight <= availableHeight) {
            win.style.height = `${desiredHeight}px`;
          }
        }
      }

      // Place window at intended position (will clamp inside desktop)
      setWindowPosition(win, intendedX, intendedY);
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
    // If visible, just focus/bring to front; else animate from icon
    if (!win.hasAttribute('hidden')) {
      focusWindow(win);
      return;
    }
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
    { id: 'win-contact', label: 'Contact', iconHtml: `<i class="fa-regular fa-envelope"></i>` },
    
    // Snake hidden from dock
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

  // Hash-based deep linking (keeps sitemap URLs like /#projects functional)
  const hashRoutes = {
    about: ['win-about', 'ios-about'],
    projects: ['win-projects', 'ios-projects'],
    blog: ['win-blog', 'ios-blog'],
    contact: ['win-contact', 'ios-contact'],
    privacy: ['win-privacy', 'ios-privacy'],
  };
  function currentHashRoute() {
    const key = (location.hash || '').replace(/^#/, '').toLowerCase();
    return hashRoutes[key] || null;
  }
  function navigateToHash() {
    const route = currentHashRoute();
    if (!route) return;
    if (document.body.classList.contains('ios-mode')) {
      openIOSApp(route[1]);
    } else {
      openWindow(route[0]);
    }
  }
  function setupHashNav() {
    window.addEventListener('hashchange', navigateToHash);
  }

  // iOS Mode
  function setupIOS() {
    cloneContentToIOS();
    setupSpringboard();
  }
  function enableIOSMode() {
    document.body.classList.add('ios-mode');
    updateModeVisibility();
    window.scrollTo(0,0);
    // Open About on first entry to iOS mode (after DOM updates),
    // unless a deep-link hash points to a specific app.
    if (!iosModeInitialized) {
      iosModeInitialized = true;
      setTimeout(() => {
        showSpringboard();
        const route = currentHashRoute();
        openIOSApp(route ? route[1] : 'ios-about');
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
      ['win-contact', 'ios-contact'],
      ['win-privacy', 'ios-privacy']
    ];
    for (const [winId, iosId] of mapping) {
      const src = document.querySelector(`#${winId} .window-content`);
      const dest = document.querySelector(`#${iosId} .app-body`);
      if (src && dest && dest.childElementCount === 0) {
        dest.appendChild(src.cloneNode(true));
      }
    }
    // Contact forms are plain HTML POST now; no JS wiring required
  }
  function setupProjectGate() {
    // SHA-256 of the access password, stored as a hash (never the plaintext).
    const PASSWORD_HASH = '8bd8b63d5cc9b9605c91427bd508db1b0e0d3d7c9c205054e57c6561334af295';
    const STORE_KEY = 'projectsUnlocked';

    function reveal() {
      document.body.classList.add('projects-unlocked');
      // On desktop the window auto-fit to the small gate; let it return to its
      // normal size now that the full content is visible.
      if (!document.body.classList.contains('ios-mode')) {
        const win = document.getElementById('win-projects');
        if (win) win.style.height = '';
      }
    }

    // Restore the unlocked state for the rest of this browser session.
    try { if (sessionStorage.getItem(STORE_KEY) === '1') reveal(); } catch (e) { /* storage unavailable */ }

    async function sha256Hex(text) {
      const bytes = new TextEncoder().encode(text);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Delegated so it covers both the desktop window and the cloned iOS app.
    document.addEventListener('submit', async (event) => {
      const form = event.target.closest('[data-project-gate-form]');
      if (!form) return;
      event.preventDefault();
      const input = form.querySelector('[data-project-gate-input]');
      const errorEl = form.parentElement.querySelector('[data-project-gate-error]');
      let hashed = '';
      try { hashed = await sha256Hex(input ? input.value : ''); } catch (e) { /* crypto needs https */ }
      if (hashed === PASSWORD_HASH) {
        try { sessionStorage.setItem(STORE_KEY, '1'); } catch (e) { /* storage unavailable */ }
        if (errorEl) errorEl.setAttribute('hidden', '');
        reveal();
      } else {
        if (errorEl) errorEl.removeAttribute('hidden');
        form.classList.remove('shake');
        void form.offsetWidth;
        form.classList.add('shake');
        if (input) { input.value = ''; input.focus(); }
      }
    });

    // "Reach out to request access" opens the Contact window/app in the active mode.
    document.addEventListener('click', (event) => {
      const link = event.target.closest('[data-open-contact]');
      if (!link) return;
      event.preventDefault();
      if (document.body.classList.contains('ios-mode')) openIOSApp('ios-contact');
      else openWindow('win-contact');
    });
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
    // Ensure this app comes to front: hide all others, then show target
    document.querySelectorAll('.ios-app').forEach(a => {
      if (a.id !== id) a.setAttribute('hidden', '');
    });
    app.removeAttribute('hidden');
    // Re-append to end of body to ensure top stacking (safest across browsers)
    if (app.parentElement) {
      app.parentElement.appendChild(app);
    }
    // Play small opening animation each time
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
      // Hide desktop UI
      windows.forEach(w => w.setAttribute('hidden', ''));
      document.getElementById('desktop')?.setAttribute('hidden', '');
      // Show SpringBoard and iOS dock
      sb?.removeAttribute('hidden');
    } else {
      // Show desktop UI
      document.getElementById('desktop')?.removeAttribute('hidden');
      // Hide iOS UI
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

  // Start
  init();
})();