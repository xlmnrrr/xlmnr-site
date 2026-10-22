
  if (!document.body.classList.contains('is-wip')) setTimeout(() => document.getElementById('mainHeader').classList.add('show'), 150);

  const navToggle = document.getElementById('navToggle');
  const mainHeader = document.getElementById('mainHeader');
  function closeMenu() {
    mainHeader.classList.remove('menu-open');
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Открыть меню');
    }
  }
  navToggle?.addEventListener('click', () => {
    const open = mainHeader.classList.toggle('menu-open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  });
  document.querySelectorAll('#siteNav a').forEach(a => a.addEventListener('click', closeMenu));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        if (entry.target.classList.contains('code-bg-section')) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    });
  }, { threshold: 0.1 });
  
  document.querySelectorAll('.reveal, .code-bg-section').forEach(el => observer.observe(el));

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#admin') return; 
      if (targetId === '#' || targetId === '#home') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      e.preventDefault();
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        const headerOffset = 60;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    });
  });

  function initCSSBackground() {
    document.querySelectorAll('.css-code-bg').forEach(bg => {
      bg.innerHTML = '';
      const chars = ['<', '>', '/', '=', '{', '}', '(', ')', '[', ']', ';', ':', '0', '1', 'a', 'b', 'c', 'x', 'y', 'z', '#', '*', '_', '.', ','];
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const saveData = navigator.connection && navigator.connection.saveData;
      const cores = navigator.hardwareConcurrency || 8;
      const weak = saveData || cores <= 4;
      const narrow = window.innerWidth < 768;
      if (weak && !bg.closest('.hero')) return;
      const colCount = weak ? 7 : (narrow ? 8 : Math.min(18, Math.max(10, Math.round(window.innerWidth / 100))));
      for (let i = 0; i < colCount; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'code-column-wrapper';
        wrapper.style.left = (i * 100 / colCount) + '%';
        wrapper.style.width = (100 / colCount) + '%';
        wrapper.style.animationDelay = (Math.random() * 2.4).toFixed(2) + 's';
        wrapper.style.setProperty('--float-dur', (10 + Math.random() * 12).toFixed(1) + 's');
        wrapper.style.setProperty('--float-delay', (Math.random() * 6).toFixed(2) + 's');
        const col = document.createElement('div');
        col.className = 'code-column';
        const content = document.createElement('div');
        content.className = 'code-content';
        const lineLength = narrow ? 5 : 7;
        const rows = weak ? 14 : (narrow ? 18 : 24);
        let cursor = Math.random() * 1.8;
        for (let j = 0; j < rows; j++) {
          const span = document.createElement('span');
          span.className = 'code-line';
          const len = lineLength + ((Math.random() * 3) | 0) - 1;
          for (let k = 0; k < Math.max(3, len); k++) {
            const ch = document.createElement('span');
            const r = Math.random();
            ch.className = 'code-char ' + (r < 0.62 ? 'orange' : (r < 0.88 ? 'white' : 'dim'));
            ch.textContent = chars[(Math.random() * chars.length) | 0];
            cursor += 0.04 + Math.random() * 0.11;
            ch.style.animationDelay = cursor.toFixed(2) + 's';
            span.appendChild(ch);
          }
          cursor += 0.08 + Math.random() * 0.35;
          content.appendChild(span);
        }
        col.appendChild(content);
        wrapper.appendChild(col);
        bg.appendChild(wrapper);
      }
    });
  }

  if (!document.body.classList.contains('is-wip')) initCSSBackground();

  document.addEventListener('visibilitychange', () => {
    const play = document.hidden ? 'paused' : 'running';
    document.querySelectorAll('.code-char, .code-column-wrapper').forEach(el => {
      el.style.animationPlayState = play;
    });
  });
