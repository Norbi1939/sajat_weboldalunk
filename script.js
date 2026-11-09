/* =========================================================
   cleversite – felületi működés
   Külső függőség nélkül. Minden modul önállóan, hibatűrően fut:
   ha egy rész hibára fut, a többi és a tartalom használható marad.
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = reduceMQ.matches;
  if (reduceMQ.addEventListener) {
    reduceMQ.addEventListener('change', function (e) { reduced = e.matches; scheduleScroll(); });
  }

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function safe(name, fn) {
    try { fn(); } catch (err) {
      if (window.console) console.warn('[cleversite] ' + name + ' modul hiba:', err);
    }
  }
  function focusables(ctx) {
    return $$('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])', ctx)
      .filter(function (el) { return !el.closest('[hidden]') && el.getClientRects().length; });
  }

  /* ---------- Görgetéshez kötött effektek (egy közös rAF-ciklus) ---------- */
  var header = $('[data-header]');
  var heroVisual = $('[data-hero-visual]');
  var heroSection = $('.hero');
  var stepsWrap = $('[data-steps]');
  var stepItems = $$('[data-step-item]');
  var geo = { heroTop: 0, heroH: 1, stepsTop: 0, stepsH: 1, stepTops: [], vh: window.innerHeight };
  var ticking = false;
  var last = { scrolled: null, hp: -1, progress: -1, active: -1 };

  function docTop(el) {
    var r = el.getBoundingClientRect();
    return r.top + window.pageYOffset;
  }
  function measure() {
    geo.vh = window.innerHeight;
    if (heroSection) { geo.heroTop = docTop(heroSection); geo.heroH = Math.max(1, heroSection.offsetHeight); }
    if (stepsWrap) {
      geo.stepsTop = docTop(stepsWrap);
      geo.stepsH = Math.max(1, stepsWrap.offsetHeight);
      geo.stepTops = stepItems.map(function (s) { return docTop(s); });
    }
    last.hp = last.progress = last.active = -1;
    scheduleScroll();
  }
  function onScrollFrame() {
    ticking = false;
    var y = window.pageYOffset;

    // Fejléc: kompakt állapot
    var scrolled = y > 12;
    if (header && scrolled !== last.scrolled) {
      header.classList.toggle('is-scrolled', scrolled);
      last.scrolled = scrolled;
    }

    // Hero: finom mélységi elmozdulás, visszagörgetéskor visszafordul
    if (heroVisual) {
      var hp = reduced ? 0 : clamp((y - geo.heroTop) / geo.heroH, 0, 1);
      hp = Math.round(hp * 1000) / 1000;
      if (hp !== last.hp && (y < geo.heroTop + geo.heroH + 200 || last.hp !== 1)) {
        heroVisual.style.setProperty('--hp', hp);
        last.hp = hp;
      }
    }

    // Folyamat: haladásjelző vonal + aktív lépés
    if (stepsWrap) {
      var line = y + geo.vh * 0.6;
      var progress = clamp((line - geo.stepsTop) / geo.stepsH, 0, 1);
      progress = Math.round(progress * 1000) / 1000;
      if (progress !== last.progress) {
        stepsWrap.style.setProperty('--progress', progress);
        last.progress = progress;
      }
      var active = -1;
      for (var i = 0; i < geo.stepTops.length; i++) { if (line >= geo.stepTops[i] + 8) active = i; }
      if (active !== last.active) {
        stepItems.forEach(function (s, idx) { s.classList.toggle('is-active', idx <= active); });
        last.active = active;
      }
    }
  }
  function scheduleScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScrollFrame); }
  }

  safe('scroll', function () {
    window.addEventListener('scroll', scheduleScroll, { passive: true });
    var rT;
    var onResize = function () { clearTimeout(rT); rT = setTimeout(measure, 120); };
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });
    window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    if ('ResizeObserver' in window) {
      var roT;
      new ResizeObserver(function () { clearTimeout(roT); roT = setTimeout(measure, 150); }).observe(document.body);
    }
    measure();
  });

  /* ---------- Megjelenési animációk ---------- */
  safe('reveal', function () {
    var items = $$('[data-reveal]');
    // Testvérelemek enyhe lépcsőzése
    items.forEach(function (el) {
      var sibs = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.hasAttribute('data-reveal'); });
      var idx = sibs.indexOf(el);
      if (idx > 0) el.style.setProperty('--rd', Math.min(idx, 4) * 70 + 'ms');
    });
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    /*
      Oda-vissza lejátszás:
      - Belépés: ha az elem a nézetbe ér (alul kis ráhagyással), megjelenik.
      - Kilépés: csak ha TELJESEN kiért a képernyőről, akkor áll vissza
        kezdőállapotba – így olvasás közben semmi nem tűnik el, de
        visszagörgetéskor újra lejátszódik.
      - Irány: a felülről (visszagörgetéskor) érkező elem felülről úszik be.
    */
    var enter = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add('is-in');
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    var exit = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) return;
        var el = e.target;
        var above = e.boundingClientRect.bottom <= 0;
        // Átmenet nélkül állítjuk vissza, hogy ne „animáljon ki” a képernyő szélén
        el.classList.add('no-trans');
        el.classList.remove('is-in');
        el.classList.toggle('from-top', above);
        void el.offsetWidth;
        el.classList.remove('no-trans');
      });
    }, { rootMargin: '0px', threshold: 0 });

    items.forEach(function (el) { enter.observe(el); exit.observe(el); });
  });

  /* ---------- Aktív menüpont ---------- */
  safe('nav-active', function () {
    if (!('IntersectionObserver' in window)) return;
    var links = $$('[data-nav-link]');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var sections = Object.keys(map).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var link = map[e.target.id];
        if (!link) return;
        if (e.isIntersecting) {
          links.forEach(function (l) { l.removeAttribute('aria-current'); });
          link.setAttribute('aria-current', 'true');
        } else if (link.getAttribute('aria-current')) {
          link.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  });

  /* ---------- Mobilmenü ---------- */
  safe('menu', function () {
    var toggle = $('[data-menu-toggle]');
    var menu = $('[data-mobile-menu]');
    var label = $('[data-menu-label]');
    if (!toggle || !menu) return;
    var outside = [$('main'), $('.site-footer')].filter(Boolean);
    var hideT;

    function isOpen() { return toggle.getAttribute('aria-expanded') === 'true'; }
    function open() {
      clearTimeout(hideT);
      menu.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      label.textContent = 'Menü bezárása';
      root.classList.add('menu-open');
      outside.forEach(function (el) { el.setAttribute('inert', ''); });
      requestAnimationFrame(function () {
        menu.classList.add('is-open');
        var first = $('a', menu);
        if (first) first.focus({ preventScroll: true });
      });
    }
    function close(returnFocus) {
      if (!isOpen()) return;
      toggle.setAttribute('aria-expanded', 'false');
      label.textContent = 'Menü megnyitása';
      menu.classList.remove('is-open');
      root.classList.remove('menu-open');
      outside.forEach(function (el) { el.removeAttribute('inert'); });
      hideT = setTimeout(function () { menu.hidden = true; }, reduced ? 0 : 400);
      if (returnFocus) toggle.focus();
    }
    toggle.addEventListener('click', function () { isOpen() ? close(false) : open(); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(false); });
    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') { e.preventDefault(); close(true); return; }
      if (e.key === 'Tab') {
        var f = [toggle].concat(focusables(menu));
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.matchMedia('(min-width: 961px)').addEventListener('change', function (e) { if (e.matches) close(false); });
  });

  /* ---------- Előtte–utána csúszka ---------- */
  safe('compare', function () {
    $$('[data-compare]').forEach(function (box) {
      var input = $('[data-compare-input]', box);
      if (!input) return;
      var update = function () {
        var v = Number(input.value);
        box.style.setProperty('--pos', v + '%');
        input.setAttribute('aria-valuetext', v <= 5 ? 'Teljesen az új nézet' : v >= 95 ? 'Teljesen a régi nézet' : 'Bal oldalon a régi, jobb oldalon az új nézet, ' + v + '%-nál elválasztva');
      };
      input.addEventListener('input', update);
      update();
    });
  });

  /* ---------- Demó étlap fülek ---------- */
  safe('menu-tabs', function () {
    $$('[data-menu-tabs]').forEach(function (list) {
      var tabs = $$('[role="tab"]', list);
      function select(tab, focus) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.tabIndex = on ? 0 : -1;
          var panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) panel.hidden = !on;
        });
        if (focus) tab.focus();
      }
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { select(t, false); });
        t.addEventListener('keydown', function (e) {
          var n = null;
          if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
          if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
          if (e.key === 'Home') n = tabs[0];
          if (e.key === 'End') n = tabs[tabs.length - 1];
          if (n) { e.preventDefault(); select(n, true); }
        });
      });
    });
  });

  /* ---------- Foglalási demó ---------- */
  safe('booking', function () {
    var box = $('[data-booking]');
    if (!box) return;
    var people = 2;
    var out = $('[data-people]', box);
    var summary = $('[data-booking-summary]', box);
    var note = $('[data-booking-note]', box);
    var btns = $$('[data-step]', box);
    function val(name) { var c = $('input[name="' + name + '"]:checked', box); return c ? c.value : ''; }
    function render() {
      out.textContent = people + ' fő';
      btns.forEach(function (b) {
        var d = Number(b.getAttribute('data-step'));
        b.disabled = (d < 0 && people <= 1) || (d > 0 && people >= 12);
      });
      summary.textContent = people + ' fő · ' + val('bk-day') + ' · ' + val('bk-time');
      note.textContent = '';
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        people = clamp(people + Number(b.getAttribute('data-step')), 1, 12);
        render();
      });
    });
    box.addEventListener('change', render);
    $('[data-booking-submit]', box).addEventListener('click', function () {
      note.textContent = 'Ez csak bemutató, foglalás nem jött létre. Egy valódi oldalon itt menne el a kérés: ' + summary.textContent + '.';
    });
    render();
  });

  /* ---------- Chatbot demó (előre megírt válaszok) ---------- */
  safe('chat', function () {
    var chat = $('[data-chat]');
    if (!chat) return;
    var log = $('[data-chat-log]', chat);
    var wrap = $('[data-chat-suggest]', chat);
    var answers = {
      open: 'Hétfőtől szombatig 12:00 és 22:00 között várunk, vasárnap zárva vagyunk. (Demóadat – a valódi oldalon a te nyitvatartásod szerepelne.)',
      gluten: 'Igen, az étlapon jelöljük a gluténmentes fogásokat, ilyen most például a céklás rizottó. Ételallergia esetén kérlek, szólj a felszolgálónak is.',
      book: 'A „Foglalás” gombbal: megadod a létszámot, a napot és az időpontot, és már küldheted is. Nagyobb társaság esetén érdemes előtte egyeztetni.',
      dog: 'Jól nevelt kutyussal a teraszon szívesen látunk. (Ezt a hely saját szabálya szerint írnánk meg.)'
    };
    var busy = false;
    function add(cls, text) {
      var p = document.createElement('p');
      p.className = 'msg ' + cls;
      p.textContent = text;
      log.appendChild(p);
      scrollLog();
      return p;
    }
    function scrollLog() {
      log.scrollTo({ top: log.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
    }
    function setDisabled(state) {
      $$('button', wrap).forEach(function (b) { if (!b.dataset.used) b.disabled = state; });
    }
    function maybeReset(moveFocus) {
      var left = $$('button[data-q]', wrap).filter(function (b) { return !b.dataset.used; });
      if (left.length) return;
      var r = document.createElement('button');
      r.type = 'button';
      r.textContent = 'Kezdjük újra';
      r.addEventListener('click', function () {
        $$('.msg', log).slice(1).forEach(function (m) { m.remove(); });
        $$('button[data-q]', wrap).forEach(function (b) { delete b.dataset.used; b.hidden = false; b.disabled = false; });
        r.remove();
        var first = $('button[data-q]', wrap);
        if (first) first.focus();
      });
      wrap.appendChild(r);
      if (moveFocus) r.focus({ preventScroll: true });
    }
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-q]');
      if (!b || busy) return;
      busy = true;
      var hadFocus = document.activeElement === b;
      var nextFocus = null;
      b.dataset.used = '1';
      add('msg--user', b.textContent);
      setDisabled(true);
      var typing = document.createElement('p');
      typing.className = 'msg msg--bot msg--typing';
      typing.setAttribute('aria-label', 'Válasz érkezik');
      typing.innerHTML = '<i></i><i></i><i></i>';
      log.appendChild(typing);
      scrollLog();
      setTimeout(function () {
        typing.remove();
        add('msg--bot', answers[b.getAttribute('data-q')]);
        busy = false;
        b.hidden = true;
        setDisabled(false);
        nextFocus = $$('button[data-q]', wrap).filter(function (x) { return !x.dataset.used; })[0];
        if (hadFocus && nextFocus) nextFocus.focus({ preventScroll: true });
        maybeReset(hadFocus);
      }, reduced ? 50 : 750);
    });
  });

  /* ---------- Projekt-részletek (modális ablakok) ---------- */
  safe('dialogs', function () {
    var lastTrigger = null;
    function fill(dialog, card) {
      var slot = $('[data-mock-slot]', dialog);
      if (!slot || slot.childElementCount) return;
      var b = $('.case__browser', card), p = $('.case__phone', card);
      if (b) slot.appendChild(b.cloneNode(true));
      if (p) slot.appendChild(p.cloneNode(true));
      $$('[id]', slot).forEach(function (el) { el.removeAttribute('id'); });
      slot.setAttribute('aria-hidden', 'true');
    }
    function finishClose(dialog) {
      dialog.classList.remove('is-closing');
      if (dialog.open) dialog.close();
      root.classList.remove('dialog-open');
    }
    function close(dialog, opts) {
      opts = opts || {};
      if (!dialog.open || dialog.classList.contains('is-closing')) return;
      if (reduced || opts.instant) { finishClose(dialog); }
      else {
        dialog.classList.add('is-closing');
        var done = false;
        var end = function () { if (done) return; done = true; finishClose(dialog); if (lastTrigger && !opts.noFocus) lastTrigger.focus(); };
        dialog.addEventListener('animationend', end, { once: true });
        setTimeout(end, 350);
        return;
      }
      if (lastTrigger && !opts.noFocus) lastTrigger.focus();
    }

    $$('[data-open-case]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var dialog = document.getElementById(btn.getAttribute('data-open-case'));
        if (!dialog || typeof dialog.showModal !== 'function') return;
        lastTrigger = btn;
        fill(dialog, btn.closest('.case'));
        root.classList.add('dialog-open');
        dialog.showModal();
        var inner = $('.case-dialog__inner', dialog);
        if (inner) inner.scrollTop = 0;
        var c = $('[data-close-dialog]', dialog);
        if (c) c.focus();
      });
    });

    $$('.case-dialog').forEach(function (dialog) {
      dialog.addEventListener('cancel', function (e) { e.preventDefault(); close(dialog); });
      dialog.addEventListener('close', function () { root.classList.remove('dialog-open'); });
      dialog.addEventListener('click', function (e) { if (e.target === dialog) close(dialog); });
      $$('[data-close-dialog]', dialog).forEach(function (b) { b.addEventListener('click', function () { close(dialog); }); });
      $$('[data-close-dialog-link]', dialog).forEach(function (a) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          close(dialog, { instant: true, noFocus: true });
          var target = document.getElementById('kapcsolat');
          if (!target) return;
          target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
          if (history.replaceState) history.replaceState(null, '', '#kapcsolat');
          var field = document.getElementById('f-name');
          if (field) field.focus({ preventScroll: true });
        });
      });
    });
  });

  /* ---------- GYIK ---------- */
  safe('faq', function () {
    $$('[data-accordion] .acc__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.acc');
        var open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        item.classList.toggle('is-open', open);
      });
    });
  });

  /* ---------- Kapcsolati űrlap ---------- */
  safe('form', function () {
    var form = $('[data-contact-form]');
    if (!form) return;
    /*
      BEKÖTÉS: add meg a fogadó végpontot a <form data-endpoint="..."> attribútumban.
      A küldés JSON-ként történik POST kéréssel:
      { name, email, company, website, message }
      Sikeresnek csak a 2xx válasz számít.
    */
    var endpoint = (form.getAttribute('data-endpoint') || '').trim();
    var status = $('[data-form-status]', form);
    var submit = $('[data-submit]', form);
    var submitLabel = $('[data-submit-label]', form);
    var demoBanner = $('[data-form-demo]', form);
    var count = $('[data-count]', form);
    var msg = form.elements.message;
    if (endpoint && demoBanner) demoBanner.hidden = true;

    var rules = {
      name: function (v) { return v.length < 2 ? 'Add meg a neved, hogy tudjuk, kinek válaszolunk.' : ''; },
      email: function (v) {
        if (!v) return 'Add meg az e-mail-címed, erre küldjük a választ.';
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Ez nem tűnik érvényes e-mail-címnek. Példa: nev@vallalkozas.hu';
      },
      website: function (v) {
        if (!v) return '';
        return /^(https?:\/\/)?([a-z0-9áéíóöőúüű-]+\.)+[a-z]{2,}(:\d+)?(\/\S*)?$/i.test(v) ? '' : 'Ellenőrizd a címet. Példa: sajatoldal.hu';
      },
      message: function (v) {
        if (!v) return 'Írd le pár mondatban, mire lenne szükséged.';
        return v.length < 10 ? 'Írj még egy kicsit – legalább 10 karakter kell.' : '';
      }
    };
    var touched = {};

    function check(name) {
      var el = form.elements[name];
      var err = rules[name](el.value.trim());
      var box = $('[data-error-for="' + name + '"]', form);
      el.closest('.field').classList.toggle('has-error', !!err);
      if (err) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
      if (box) box.textContent = err;
      return !err;
    }
    Object.keys(rules).forEach(function (name) {
      var el = form.elements[name];
      el.addEventListener('blur', function () { if (el.value.trim() || touched[name]) { touched[name] = true; check(name); } });
      el.addEventListener('input', function () { if (touched[name]) check(name); });
    });
    msg.addEventListener('input', function () { count.textContent = msg.value.length; });

    function setStatus(state, html) {
      status.setAttribute('data-state', state);
      status.innerHTML = html;
    }
    function setBusy(b) {
      submit.setAttribute('aria-busy', b ? 'true' : 'false');
      submit.disabled = b;
      submitLabel.textContent = b ? 'Küldés folyamatban…' : 'Üzenet küldése';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var names = Object.keys(rules);
      var firstBad = null;
      names.forEach(function (n) { touched[n] = true; if (!check(n) && !firstBad) firstBad = form.elements[n]; });
      if (firstBad) {
        setStatus('error', '<b>Még néhány mezőt javítani kell.</b>A hibás mezők alatt látod, mi hiányzik.');
        firstBad.focus();
        return;
      }
      if (form.elements.company_url && form.elements.company_url.value) return; // spamcsapda

      var data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        company: form.elements.company.value.trim(),
        website: form.elements.website.value.trim(),
        message: form.elements.message.value.trim()
      };

      if (!endpoint) {
        setStatus('demo', '<b>Demó mód – az üzenet nem lett elküldve.</b>Az űrlap ellenőrzése működik, de még nincs beállítva fogadó végpont, ezért semmi nem jutott el hozzánk. A beírt adatokat nem töröltük.');
        return;
      }

      setBusy(true);
      setStatus('sending', 'Küldjük az üzenetedet…');
      var ctrl = 'AbortController' in window ? new AbortController() : null;
      var to = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        setStatus('success', '<b>Köszönjük, megkaptuk az üzenetedet.</b>A megadott e-mail-címre válaszolunk.');
        form.reset();
        count.textContent = '0';
        touched = {};
      }).catch(function () {
        setStatus('error', '<b>Az üzenetet nem sikerült elküldeni.</b>Ellenőrizd az internetkapcsolatot, és próbáld újra néhány perc múlva. A beírt szöveget megtartottuk.');
      }).then(function () {
        clearTimeout(to);
        setBusy(false);
      });
    });
  });

  /* ---------- Apróságok ---------- */
  safe('year', function () {
    var y = $('[data-year]');
    if (y) y.textContent = new Date().getFullYear();
  });

  window.__csReady = true;
})();
