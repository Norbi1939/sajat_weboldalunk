/* ==========================================================
   CLEVERsite / BOLD EDITION — MŰKÖDÉS ÉS MOZGÁS
   Natív Web Animations API. Nincs külső animációs függőség.
   A dekoratív mozgás különválik az alapfunkcióktól.
   ========================================================== */

(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const desktopLayout = matchMedia('(min-width: 761px)');
  const activeAnimations = new Set();
  const ease = 'cubic-bezier(.22,.61,.36,1)';

  function animate(element, frames, settings = {}) {
    if (!element?.animate || reduceMotion.matches) return null;
    const animation = element.animate(frames, { duration: 900, easing: ease, ...settings });
    activeAnimations.add(animation);
    animation.finished.then(
      () => activeAnimations.delete(animation),
      () => activeAnimations.delete(animation)
    );
    return animation;
  }

  $('#current-year').textContent = new Date().getFullYear();

  /* ---------- NAVIGÁCIÓ ÉS MOBILMENÜ ---------- */
  const menuButton = $('.menu-toggle');
  const nav = $('#primary-nav');

  function closeMenu(returnFocus = false) {
    menuButton.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    if (returnFocus) menuButton.focus();
  }

  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });

  $$('.primary-nav a').forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu(true);
    }
  });
  desktopLayout.addEventListener('change', () => closeMenu());

  /* ---------- NYITÓKOMPOZÍCIÓ ---------- */
  $$('.hero-word').forEach((word, index) => {
    animate(word, [
      { transform: 'translateY(105%) rotate(3deg)', opacity: 0 },
      { transform: 'translateY(0) rotate(0)', opacity: 1 }
    ], { duration: 1200, delay: 80 + index * 170, fill: 'backwards' });
  });

  animate($('.hero-flower'), [
    { scale: '.65', rotate: '-65deg', opacity: 0 },
    { scale: '1', rotate: '0deg', opacity: 1 }
  ], { duration: 1300, delay: 300, fill: 'backwards' });

  animate($('.hero-foot'), [
    { translate: '0 35px', opacity: 0 },
    { translate: '0 0', opacity: 1 }
  ], { delay: 650, duration: 1000, fill: 'backwards' });

  const device = $('#scene-device');
  let deviceEntered = false;
  if ('IntersectionObserver' in window) {
    const deviceObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting && !deviceEntered) {
          deviceEntered = true;
          animate(device, [
            { translate: '0 60px', rotate: '-6deg', scale: '.92', opacity: 0 },
            { translate: '0 0', rotate: '0deg', scale: '1', opacity: 1 }
          ], { duration: 1200 });
          deviceObserver.unobserve(device);
        }
      }
    }, { threshold: .15 });
    deviceObserver.observe(device);
  }

  /* ---------- KÉPRÉTEGES VÁLTÁS / ELŐBETÖLTÉS ÉS DEKÓDOLÁS ---------- */
  const sceneSlides = new Map($$('[data-slide]').map(slide => [slide.dataset.slide, slide]));
  const sceneNames = { bistro: 'Bisztró', pizza: 'Pizzéria', cafe: 'Kávézó' };
  const addresses = { bistro: 'asztalka', pizza: 'forneriva', cafe: 'morzsa' };
  const readyImages = new Map();
  let visibleTheme = 'bistro';
  let requestedTheme = 'bistro';
  let switchingTheme = false;
  let layerOrder = 1;

  function prepareSlide(slide) {
    if (readyImages.has(slide)) return readyImages.get(slide);
    const image = slide.querySelector('img');
    const ready = new Promise(resolve => {
      let settled = false;
      let timer = 0;
      const finish = success => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        image.removeEventListener('load', onLoad);
        image.removeEventListener('error', onError);
        if (!success) image.classList.add('image-unavailable');
        resolve(success);
      };
      const onLoad = async () => {
        // A letöltött képet a böngésző a váltás előtt dekódolja.
        try { await image.decode?.(); } catch { /* Már kirajzolható kép esetén továbbmehet. */ }
        finish(image.naturalWidth > 0);
      };
      const onError = () => finish(false);
      if (image.complete) {
        onLoad();
      } else {
        image.addEventListener('load', onLoad, { once: true });
        image.addEventListener('error', onError, { once: true });
        timer = setTimeout(() => finish(false), 12000);
      }
      // Hálózati hiba után egy később betöltött kép újra megjelenhet.
      image.addEventListener('load', () => image.classList.remove('image-unavailable'), { once: true });
    });
    readyImages.set(slide, ready);
    return ready;
  }

  // Mindhárom valódi képelem már a HTML-ben van; váltáskor nincs src-csere.
  sceneSlides.forEach(slide => { prepareSlide(slide); });

  function showLayer(slide, active) {
    slide.classList.toggle('is-active', active);
    slide.setAttribute('aria-hidden', String(!active));
    slide.inert = !active;
  }

  async function runThemeQueue() {
    if (switchingTheme) return;
    switchingTheme = true;
    const site = $('#concept-site');
    site.setAttribute('aria-busy', 'true');

    try {
      while (requestedTheme !== visibleTheme) {
        const name = requestedTheme;
        const incoming = sceneSlides.get(name);
        await prepareSlide(incoming);
        // Gyors kattintásoknál a legutolsó választás a következő cél.
        if (name !== requestedTheme) continue;
        const outgoing = sceneSlides.get(visibleTheme);
        incoming.style.zIndex = String(++layerOrder);
        incoming.style.opacity = '0';
        incoming.classList.add('is-transitioning');
        showLayer(incoming, true);
        outgoing.inert = true;
        outgoing.setAttribute('aria-hidden', 'true');

        // Az előző kép végig teljesen látható az új kép mögött.
        // Így az átmenet közepén sincs sötét villanás vagy üres képkocka.
        const fade = animate(incoming, [
          { opacity: 0 },
          { opacity: 1 }
        ], { duration: 950, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both' });
        const copy = incoming.querySelector('.concept-copy');
        const textAnimation = animate(copy, [
          { transform: 'translate3d(0,12px,0)' },
          { transform: 'translate3d(0,0,0)' }
        ], { duration: 900, easing: 'cubic-bezier(.22,.61,.36,1)' });

        if (fade) {
          try { await fade.finished; } catch { /* Csökkentett mozgásra váltáskor megszakítható. */ }
        }
        incoming.style.opacity = '1';
        fade?.cancel();
        textAnimation?.cancel();
        incoming.classList.remove('is-transitioning');
        showLayer(outgoing, false);
        outgoing.style.zIndex = '';
        incoming.style.zIndex = '1';
        layerOrder = 1;
        visibleTheme = name;
        $('#scene-address').textContent = addresses[name] + ' / webkoncepció';
        $('#scene-status').textContent = sceneNames[name] + ' koncepció megjelenítve.';
      }
    } finally {
      switchingTheme = false;
      site.setAttribute('aria-busy', 'false');
    }
  }

  function switchTheme(name) {
    if (!sceneSlides.has(name)) return;
    requestedTheme = name;
    $$('[data-theme]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.theme === name));
    });
    runThemeQueue();
  }

  $$('[data-theme]').forEach(button => {
    button.addEventListener('click', () => switchTheme(button.dataset.theme));
  });

  /* ---------- MEGJELENÉS GÖRGETÉSKOR, MINDKÉT IRÁNYBAN ---------- */
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        // A már elolvasott tartalom nem tűnik el újra görgetés közben.
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .08 });
    $$('.reveal').forEach(element => revealObserver.observe(element));
  } else {
    $$('.reveal').forEach(element => element.classList.add('is-visible'));
  }

  /* ---------- LÁGY, IDŐALAPÚ KÖVETÉS / NATÍV GÖRGETÉS ---------- */
  // Csak a díszítő elemek követése késleltetett. A lap görgetése natív.
  const sceneSection = $('.scene-section');
  const aboutSection = $('.about-section');
  const contactSection = $('.contact-section');
  const sceneBackword = $('.scene-backword');
  const root = document.documentElement;
  const follow = {
    scene: { current: .5, target: .5 },
    flower: { current: 0, target: 0 },
    about: { current: .5, target: .5 },
    contact: { current: .5, target: .5 }
  };
  let scrollFrame = 0;
  let lastFrameTime = 0;
  let layoutDirty = true;
  let firstMeasurement = true;

  function scrollProgress(rect, viewport) {
    return clamp((viewport - rect.top) / (viewport + rect.height));
  }

  function measureScroll() {
    const viewport = window.innerHeight;
    const scrollHeight = root.scrollHeight - viewport;
    root.style.setProperty('--page-progress', scrollHeight > 0 ? clamp(window.scrollY / scrollHeight) : 0);

    // Az összes geometriai olvasás megelőzi a díszítő transzformációkat.
    const sceneRect = sceneSection.getBoundingClientRect();
    const aboutRect = aboutSection.getBoundingClientRect();
    const contactRect = contactSection.getBoundingClientRect();
    follow.scene.target = scrollProgress(sceneRect, viewport);
    follow.flower.target = Math.min(window.scrollY, viewport * 1.4) * .025;
    follow.about.target = scrollProgress(aboutRect, viewport);
    follow.contact.target = scrollProgress(contactRect, viewport);

    if (firstMeasurement) {
      Object.values(follow).forEach(state => { state.current = state.target; });
      firstMeasurement = false;
    }
    layoutDirty = false;
  }

  function renderScroll(time = performance.now()) {
    scrollFrame = 0;
    if (document.hidden) {
      lastFrameTime = 0;
      return;
    }
    if (layoutDirty) measureScroll();
    if (reduceMotion.matches) {
      lastFrameTime = 0;
      return;
    }

    // Ugyanaz a csillapítás 60, 120 és 144 Hz-en is.
    const elapsed = lastFrameTime ? Math.min(64, Math.max(1, time - lastFrameTime)) : 16.67;
    const alpha = 1 - Math.exp(-elapsed / 85);
    lastFrameTime = time;
    let moving = false;

    Object.values(follow).forEach(state => {
      const difference = state.target - state.current;
      if (Math.abs(difference) > .0002) {
        state.current += difference * alpha;
        moving = true;
      } else {
        state.current = state.target;
      }
    });

    const progress = follow.scene.current;
    const distance = desktopLayout.matches ? 42 : 14;
    device.style.setProperty('--scene-y', (progress - .5) * -distance + 'px');
    device.style.setProperty('--scene-rx', (1 - progress) * 12 - 3 + 'deg');
    device.style.setProperty('--scene-ry', (1 - progress) * -14 + 5 + 'deg');
    device.style.setProperty('--scene-rz', (1 - progress) * -6 + 2 + 'deg');
    device.style.setProperty('--scene-scale', .97 + progress * .045);
    sceneBackword.style.translate = `0 ${(progress - .5) * 35}px`;
    root.style.setProperty('--flower-turn', -15 + follow.flower.current + 'deg');
    aboutSection.style.setProperty('--about-turn', -25 + follow.about.current * 50 + 'deg');
    contactSection.style.setProperty('--contact-turn', -20 + follow.contact.current * 50 + 'deg');

    // Megáll, ha minden elem elérte a célját; nincs állandó renderelés.
    if (moving) scrollFrame = requestAnimationFrame(renderScroll);
    else lastFrameTime = 0;
  }

  function requestScrollRender() {
    layoutDirty = true;
    if (!scrollFrame && !document.hidden) scrollFrame = requestAnimationFrame(renderScroll);
  }

  window.addEventListener('scroll', requestScrollRender, { passive: true });
  window.addEventListener('resize', requestScrollRender);
  window.addEventListener('load', requestScrollRender);
  document.fonts?.ready.then(requestScrollRender);
  document.addEventListener('visibilitychange', requestScrollRender);

  /* ---------- MÁGNESES HATÁS / CSAK EGÉRNÉL ---------- */
  $$('.magnetic').forEach(element => {
    const reset = () => {
      element.style.setProperty('--magnetic-x', '0px');
      element.style.setProperty('--magnetic-y', '0px');
    };

    element.addEventListener('pointermove', event => {
      if (reduceMotion.matches || !finePointer.matches) return;
      const bounds = element.getBoundingClientRect();
      const x = clamp((event.clientX - bounds.left - bounds.width / 2) * .09, -8, 8);
      const y = clamp((event.clientY - bounds.top - bounds.height / 2) * .14, -8, 8);
      element.style.setProperty('--magnetic-x', x + 'px');
      element.style.setProperty('--magnetic-y', y + 'px');
    }, { passive: true });
    element.addEventListener('pointerleave', reset);
    element.addEventListener('blur', reset);
    reduceMotion.addEventListener('change', reset);
  });

  /* ---------- MOZGÓ SÁV / AUTOMATIKUS LÁTHATÓSÁGKEZELÉS ---------- */
  const marquee = $('.marquee-section');
  let marqueeVisible = true;

  function updateMarquee() {
    marquee.classList.toggle('is-paused', !marqueeVisible || document.hidden || reduceMotion.matches);
  }

  if ('IntersectionObserver' in window) {
    const marqueeObserver = new IntersectionObserver(entries => {
      marqueeVisible = entries[0].isIntersecting;
      updateMarquee();
    });
    marqueeObserver.observe(marquee);
  }
  document.addEventListener('visibilitychange', updateMarquee);

  /* ---------- FOGLALÁSI DEMÓ ---------- */
  function localDateValue(date = new Date()) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  const bookingDate = $('#booking-date');
  bookingDate.min = localDateValue();
  bookingDate.value = localDateValue();
  bookingDate.addEventListener('input', () => bookingDate.setCustomValidity(''));

  $('#booking-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!bookingDate.value || bookingDate.value < localDateValue()) {
      bookingDate.setCustomValidity('Válassz mai vagy későbbi dátumot.');
      bookingDate.reportValidity();
      return;
    }
    bookingDate.setCustomValidity('');
    const formatted = new Date(bookingDate.value + 'T12:00:00').toLocaleDateString('hu-HU', {
      month: 'long', day: 'numeric'
    });
    const result = $('#booking-result');
    result.textContent = `${formatted}, ${$('#booking-time').value}, ${$('#booking-guests').value} fő. Ez bemutató: nem történt valódi foglalás.`;
    animate(result, [
      { translate: '0 10px', opacity: 0 }, { translate: '0 0', opacity: 1 }
    ], { duration: 500 });
  });

  /* ---------- CHAT DEMÓ / NINCS KÜLSŐ ADATTOVÁBBÍTÁS ---------- */
  const answers = {
    hours: 'A kitalált Asztalka bemutató nyitvatartása 11:00–22:00. Éles oldalon a te általad jóváhagyott adatokból válaszolna az asszisztens.',
    menu: 'Az első szolgáltatáspanelen látszik a mintaétlap. A fogások és az árak kitalált bemutatóadatok.',
    book: 'A foglalási demót a fenti korall panelen tudod kipróbálni. Dátumot, időpontot és létszámot választhatsz; valódi foglalást nem küldünk.'
  };
  const chatLog = $('#chat-log');

  function addMessage(text, isUser) {
    const message = document.createElement('p');
    message.className = 'chat-message ' + (isUser ? 'user-message' : 'bot-message');
    message.textContent = text;
    chatLog.append(message);
    while (chatLog.children.length > 7) chatLog.firstElementChild.remove();
    animate(message, [
      { opacity: 0, translate: '0 14px', scale: '.94' },
      { opacity: 1, translate: '0 0', scale: '1' }
    ], { duration: 550 });
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  $$('[data-question]').forEach(button => {
    button.addEventListener('click', () => {
      addMessage(button.textContent, true);
      addMessage(answers[button.dataset.question], false);
    });
  });

  /* ---------- ÜZENET ELŐKÉSZÍTÉSE ÉS MÁSOLÁSA ---------- */
  $$('[data-interest]').forEach(link => {
    link.addEventListener('click', () => {
      const checkbox = document.querySelector('input[name="interest"][value="Weboldal"]');
      if (checkbox) checkbox.checked = true;
    });
  });

  $('#contact-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('#name').value.trim();
    const message = $('#message').value.trim();
    if (!name || message.length < 10) {
      $('#form-status').textContent = 'Írd be a neved, és legalább 10 karakterben mesélj a helyedről.';
      return;
    }
    const interests = $$('input[name="interest"]:checked').map(input => input.value);
    $('#prepared-message').value = `Szia cleversite!\n\n${message}\n\nÉrdekel: ${interests.join(', ') || 'beszéljük át'}\nNév: ${name}\nE-mail: ${$('#email').value.trim()}`;
    $('#message-output').hidden = false;
    $('#form-status').textContent = 'Az üzeneted elkészült. Kimásolhatod; elküldés nem történt.';
  });

  $('#copy-message').addEventListener('click', async () => {
    const message = $('#prepared-message');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(message.value);
      $('#form-status').textContent = 'Kimásolva. Elküldés továbbra sem történt.';
    } catch {
      message.focus();
      message.select();
      $('#form-status').textContent = 'Az üzenetet kijelöltük. Másoláshoz nyomj Ctrl+C vagy ⌘C billentyűt.';
    }
  });

  /* ---------- MOZGÁSBEÁLLÍTÁSOK ÉS INDÍTÁS ---------- */
  function updateMotionPreference() {
    document.documentElement.classList.toggle('motion-enabled', !reduceMotion.matches);
    if (reduceMotion.matches) {
      activeAnimations.forEach(animation => animation.cancel());
      activeAnimations.clear();
      $$('.reveal').forEach(element => element.classList.add('is-visible'));
    }
    updateMarquee();
    requestScrollRender();
  }

  reduceMotion.addEventListener('change', updateMotionPreference);
  updateMotionPreference();
})();


/* ---------- VENDÉGPRÓBA / HELYI ÖNELLENŐRZŐ ---------- */
(() => {
  const form = document.querySelector('#guest-check-form');
  const result = document.querySelector('#guest-check-result');
  const cta = document.querySelector('#guest-check-cta');
  const questions = ['menu-check', 'info-check', 'booking-check'];
  const suggestions = {
    'menu-check': 'egy mobilon is olvasható, közvetlenül megnyitható étlappal',
    'info-check': 'a cím és a nyitvatartás jól látható elhelyezésével',
    'booking-check': 'egy egyértelmű foglalási útvonallal'
  };
  let recommendation = '';

  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('change', () => {
    const answers = questions.map(name => form.querySelector(`input[name="${name}"]:checked`));
    if (answers.some(answer => !answer)) return;

    const improvements = questions.filter((name, index) => answers[index].value === 'improve');
    recommendation = improvements.length
      ? 'A válaszaid alapján itt kezdenénk: ' + improvements.map(name => suggestions[name]).join('; ') + '.'
      : 'A válaszaid alapján a legfontosabb információk már elérhetők. Következőként azt néznénk meg együtt, hogy a fotók, a szövegek és az oldal hangulata ugyanazt mutatják-e, amit a vendég a helyszínen kap.';
    result.textContent = recommendation;
    cta.hidden = false;
  });

  cta.addEventListener('click', () => {
    const message = document.querySelector('#message');
    const checkbox = document.querySelector('input[name="interest"][value="Weboldal"]');
    const text = 'Végigmentem a vendégpróbán. ' + recommendation;
    message.value = message.value.trim() ? message.value.trim() + '\n\n' + text : text;
    if (checkbox) checkbox.checked = true;
  });
})();


/* ==========================================================
   EGÉRGÖRGŐ FINOMÍTÁSA
   A nagy, lépcsőzetes kerékmozgások rövid lecsengést kapnak.
   Érintés, zoom, billentyűzet és belső görgetőmezők natívak.
   ========================================================== */
(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const precisePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  let target = window.scrollY;
  let animationFrame = 0;
  let running = false;
  let previousTime = 0;
  let direction = 0;

  const limit = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const maximumScroll = () => Math.max(0, root.scrollHeight - window.innerHeight);

  function stop() {
    running = false;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    previousTime = 0;
    direction = 0;
    target = window.scrollY;
    root.classList.remove('wheel-is-moving');
  }

  function hasInnerScroll(element, delta) {
    for (let node = element; node && node !== document.body && node !== root; node = node.parentElement) {
      if (!(node instanceof HTMLElement)) continue;
      if (node.matches('input, select, textarea, [contenteditable="true"], dialog')) return true;
      const overflow = getComputedStyle(node).overflowY;
      if (!/(auto|scroll|overlay)/.test(overflow)) continue;
      const available = node.scrollHeight - node.clientHeight;
      if (available <= 1) continue;
      if ((delta > 0 && node.scrollTop < available - 1) || (delta < 0 && node.scrollTop > 1)) return true;
    }
    return false;
  }

  function advance(time) {
    if (!running) return;
    animationFrame = 0;
    const elapsed = previousTime ? limit(time - previousTime, 1, 48) : 16.67;
    previousTime = time;
    target = limit(target, 0, maximumScroll());
    const current = window.scrollY;
    const difference = target - current;

    if (Math.abs(difference) < 1) {
      window.scrollTo({ top: target, left: window.scrollX, behavior: 'instant' });
      stop();
      return;
    }

    const easedStep = difference * (1 - Math.exp(-elapsed / 95));
    // Egész pixelre kerekítő böngészőknél is biztosan eléri a célt.
    const step = Math.sign(difference) * Math.min(Math.abs(difference), Math.max(1, Math.abs(easedStep)));
    const next = current + step;
    window.scrollTo({ top: next, left: window.scrollX, behavior: 'instant' });
    animationFrame = requestAnimationFrame(advance);
  }

  window.addEventListener('wheel', event => {
    if (event.defaultPrevented || !event.cancelable || reduced.matches || !precisePointer.matches) {
      stop();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.deltaX !== 0 || document.body.classList.contains('dialog-open')) {
      stop();
      return;
    }

    const raw = event.deltaY;
    // A finom, kis lépésű eszközök saját gördülése megmarad.
    if (!raw || (event.deltaMode === 0 && Math.abs(raw) < 50) || hasInnerScroll(event.target, raw)) {
      stop();
      return;
    }

    const multiplier = event.deltaMode === 1 ? 22 : event.deltaMode === 2 ? window.innerHeight * .8 : 1;
    const delta = limit(raw * multiplier, -300, 300);
    const newDirection = Math.sign(delta);
    if (!running || newDirection !== direction) target = window.scrollY;
    direction = newDirection;
    target = limit(target + delta, 0, maximumScroll());
    // Nagy kerékmozdulat után sem marad hosszú, felhalmozódó utánfutás.
    target = limit(target, Math.max(0, window.scrollY - 450), Math.min(maximumScroll(), window.scrollY + 450));
    if (Math.abs(target - window.scrollY) < 1) {
      stop();
      return;
    }

    event.preventDefault();
    if (!running) {
      running = true;
      previousTime = 0;
      root.classList.add('wheel-is-moving');
      animationFrame = requestAnimationFrame(advance);
    }
  }, { passive: false });

  window.addEventListener('pointerdown', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('resize', stop);
  window.addEventListener('pagehide', stop);
  document.addEventListener('click', stop, true);
  document.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Escape', 'Tab'].includes(event.key)) stop();
  }, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });
  reduced.addEventListener('change', stop);
  precisePointer.addEventListener('change', stop);
})();
