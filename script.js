const menuToggle = document.querySelector(".menu-toggle");

      const primaryNav = document.querySelector("#primary-nav");

      const contactForm = document.querySelector("#contact-form");

      const formNotice = document.querySelector("#form-notice");

      const formError = document.querySelector("#form-error");

      function closeMenu(returnFocus = false) {

        setMenuOpen(false);

        if (returnFocus) menuToggle.focus();

      }

      function setMenuOpen(isOpen) {

        const isMobile = window.innerWidth <= 760;

        menuToggle.setAttribute("aria-expanded", String(isOpen));

        menuToggle.setAttribute("aria-label", isOpen ? "Menü bezárása" : "Menü megnyitása");

        primaryNav.classList.toggle("is-open", isOpen);

        primaryNav.inert = isMobile && !isOpen;

        primaryNav.setAttribute("aria-hidden", String(isMobile && !isOpen));

      }

      setMenuOpen(false);

      menuToggle.addEventListener("click", () => {

        const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";

        setMenuOpen(!isExpanded);

      });

      primaryNav.addEventListener("click", (event) => {

        if (event.target.closest("a")) closeMenu();

      });

      document.addEventListener("click", (event) => {

        if (

          primaryNav.classList.contains("is-open") &&

          !primaryNav.contains(event.target) &&

          !menuToggle.contains(event.target)

        ) {

          closeMenu();

        }

      });

      document.addEventListener("keydown", (event) => {

        if (event.key !== "Escape") return;

        if (projectDialog.open) {

          event.preventDefault();

          closeProjectDialog();

          return;

        }

        if (primaryNav.classList.contains("is-open")) {

          closeMenu(true);

        }

      }, true);

      window.addEventListener("resize", () => {

        if (window.innerWidth > 760 && primaryNav.classList.contains("is-open")) {

          closeMenu();

          return;

        }

        primaryNav.inert = window.innerWidth <= 760 && !primaryNav.classList.contains("is-open");

        primaryNav.setAttribute("aria-hidden", String(window.innerWidth <= 760 && !primaryNav.classList.contains("is-open")));

      });

      const demoTabs = [...document.querySelectorAll("[data-demo-tab]")];

      const demoPanels = [...document.querySelectorAll("[data-demo-panel]")];

      function activateDemoTab(selectedTab, moveFocus = false) {

        const selectedName = selectedTab.dataset.demoTab;

        for (const tab of demoTabs) {

          const active = tab === selectedTab;

          tab.classList.toggle("is-active", active);

          tab.setAttribute("aria-selected", String(active));

          tab.tabIndex = active ? 0 : -1;

          if (active && moveFocus) tab.focus();

        }

        for (const panel of demoPanels) {

          const active = panel.dataset.demoPanel === selectedName;

          panel.inert = !active;

          panel.setAttribute("aria-hidden", String(!active));

          panel.classList.toggle("is-active", active);

        }

      }

      for (const tab of demoTabs) {

        tab.addEventListener("click", () => activateDemoTab(tab));

        tab.addEventListener("keydown", (event) => {

          const currentIndex = demoTabs.indexOf(tab);

          let nextIndex = currentIndex;

          if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % demoTabs.length;

          if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + demoTabs.length) % demoTabs.length;

          if (event.key === "Home") nextIndex = 0;

          if (event.key === "End") nextIndex = demoTabs.length - 1;

          if (nextIndex === currentIndex) return;

          event.preventDefault();

          activateDemoTab(demoTabs[nextIndex], true);

        });

      }

      activateDemoTab(demoTabs[0]);

      const chatForm = document.querySelector("#chat-form");

      const chatInput = document.querySelector("#chat-input");

      const chatLog = document.querySelector("#chat-log");

      const quickQuestions = document.querySelectorAll("[data-chat-question]");

      function normalizeQuestion(question) {

        return question

          .toLocaleLowerCase("hu-HU")

          .normalize("NFD")

          .replace(/[\u0300-\u036f]/g, "")

          .trim();

      }

      function getDemoReply(question) {

        const normalized = normalizeQuestion(question);

        if (/nyitva|nyitvatart|mikor/.test(normalized)) {

          return "A koncepcióoldalon szereplő 11:00–22:00 csak kitalált bemutatóadat. Éles weboldalon a te általad megadott nyitvatartás jelenne meg.";

        }

        if (/etlap|menu|etel|ar/.test(normalized)) {

          return "Ez a demó nem tartalmaz valódi étlapot. Egy elkészült oldalon az étlap jól látható helyről lenne megnyitható.";

        }

        if (/foglal|asztal|hely/.test(normalized)) {

          return "A foglalási demóban kipróbálhatod a dátum- és időpontválasztást. Ez a chatbot-válasz és a foglalási példa sem kapcsolódik valódi étteremhez.";

        }

        if (/hol|cim|megkozelit|parkol/.test(normalized)) {

          return "Ez kitalált éttermi koncepció, ezért nincs valódi címe vagy megközelítési információja. Éles oldalon az általad jóváhagyott cím kerülne ide.";

        }

        if (/allerg|vegan|veget|gluten|tej|kutya|gyerek/.test(normalized)) {

          return "A demóban nincs ellenőrzött éttermi vagy allergéninformáció. Ilyen válaszokat csak a vállalkozás által megadott, pontos adatok alapján szabad beállítani.";

        }

        return "Ez egy előre beállított válaszokkal működő demó. Kérdezz a nyitvatartásról, az étlapról, a címről vagy a foglalásról — a bemutatóadatok kitaláltak.";

      }

      function appendChatMessage(message, sender) {

        const bubble = document.createElement("div");

        bubble.className = `chat-message ${sender === "user" ? "user-message" : "bot-message"}`;

        const label = document.createElement("span");

        label.className = "chat-message-label";

        label.textContent = sender === "user" ? "TE · DEMÓ" : "SEGÍTŐ · DEMÓ";

        const text = document.createElement("p");

        text.textContent = message;

        bubble.append(label, text);

        chatLog.append(bubble);

        while (chatLog.children.length > 12) {

          chatLog.firstElementChild.remove();

        }

        chatLog.scrollTop = chatLog.scrollHeight;

      }

      function askChatbot(question) {

        const trimmedQuestion = question.trim();

        if (!trimmedQuestion) {

          chatInput.setAttribute("aria-invalid", "true");

          chatInput.focus();

          return;

        }

        chatInput.removeAttribute("aria-invalid");

        appendChatMessage(trimmedQuestion, "user");

        appendChatMessage(getDemoReply(trimmedQuestion), "bot");

      }

      for (const questionButton of quickQuestions) {

        questionButton.addEventListener("click", () => {

          askChatbot(questionButton.dataset.chatQuestion);

        });

      }

      chatForm.addEventListener("submit", (event) => {

        event.preventDefault();

        askChatbot(chatInput.value);

        if (chatInput.value.trim()) {

          chatInput.value = "";

          chatInput.focus();

        }

      });

      chatInput.addEventListener("input", () => chatInput.removeAttribute("aria-invalid"));

      const bookingForm = document.querySelector("#booking-form");

      const bookingDate = document.querySelector("#booking-date");

      const bookingTime = document.querySelector("#booking-time");

      const bookingGuests = document.querySelector("#booking-guests");

      const bookingError = document.querySelector("#booking-error");

      const bookingResult = document.querySelector("#booking-result");

      function getLocalDateValue(date = new Date()) {

        const year = date.getFullYear();

        const month = String(date.getMonth() + 1).padStart(2, "0");

        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;

      }

      bookingDate.min = getLocalDateValue();

      function clearBookingError() {

        bookingError.textContent = "";

        for (const field of [bookingDate, bookingTime, bookingGuests]) {

          field.removeAttribute("aria-invalid");

        }

      }

      for (const field of [bookingDate, bookingTime, bookingGuests]) {

        field.addEventListener("input", clearBookingError);

        field.addEventListener("change", clearBookingError);

      }

      bookingForm.addEventListener("submit", (event) => {

        event.preventDefault();

        clearBookingError();

        bookingResult.hidden = true;

        const firstMissingField = [bookingDate, bookingTime, bookingGuests].find((field) => !field.value);

        if (firstMissingField) {

          firstMissingField.setAttribute("aria-invalid", "true");

          bookingError.textContent = "Válassz dátumot, időpontot és létszámot a demó kipróbálásához.";

          firstMissingField.focus();

          return;

        }

        if (bookingDate.value < getLocalDateValue()) {

          bookingDate.setAttribute("aria-invalid", "true");

          bookingError.textContent = "Múltbeli napra nem lehet demóválasztást készíteni. Válassz mai vagy későbbi dátumot.";

          bookingDate.focus();

          return;

        }

        const [year, month, day] = bookingDate.value.split("-").map(Number);

        const formattedDate = new Intl.DateTimeFormat("hu-HU", {

          year: "numeric",

          month: "long",

          day: "numeric",

        }).format(new Date(year, month - 1, day));

        const guestCount = Number(bookingGuests.value);

        bookingResult.replaceChildren();

        const heading = document.createElement("strong");

        heading.textContent = "Demóválasztás — nem foglalás";

        const details = document.createElement("span");

        details.textContent = `${formattedDate}, ${bookingTime.value}, ${guestCount} ${guestCount === 1 ? "fő" : "fő"}. Valódi szabad helyet nem ellenőriztünk; adatot nem küldtünk el, foglalás nem történt.`;

        bookingResult.append(heading, details);

        bookingResult.hidden = false;

      });

      const projectDialog = document.querySelector("#project-dialog");

      const projectOpeners = document.querySelectorAll("[data-project]");

      const dialogCloseButton = document.querySelector(".dialog-close");

      const dialogDeviceFrame = document.querySelector("#dialog-device-frame");

      const previewModeButtons = document.querySelectorAll("[data-preview-mode]");

      const projectDialogTitle = document.querySelector("#project-dialog-title");

      const dialogProjectType = document.querySelector("#dialog-project-type");

      const dialogProjectDescription = document.querySelector("#dialog-project-description");

      const dialogProjectImage = document.querySelector("#dialog-project-image");

      const dialogProjectBrand = document.querySelector("#dialog-project-brand");

      const dialogProjectKicker = document.querySelector("#dialog-project-kicker");

      const dialogProjectHeadline = document.querySelector("#dialog-project-headline");

      const dialogProjectSubtitle = document.querySelector("#dialog-project-subtitle");

      const dialogProjectFocus = document.querySelector("#dialog-project-focus");

      let lastProjectOpener = null;

      let projectCloseTimer = 0;

      const projectContent = {

        asztalka: {

          title: "Asztalka",

          type: "ÉTTEREM · HANGULATOS, KÖZVETLEN",

          description: "Meleg tónusú, vendégközpontú éttermi koncepció. A főoldal rögtön megmutatja a hely hangulatát, miközben az étlap és az asztalfoglalás jól látható marad.",

          image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1100&q=78",

          imageAlt: "Asztalka nevű kitalált éttermi koncepció hangulatos előnézete",

          brand: "asztalka.",

          kicker: "JÓ HELYEN JÁRSZ",

          headline: "Egy asztal.\nJó társaság.",

          subtitle: "Helyi ízek, szezonális alapanyagok, hosszúra nyúló esték.",

          focus: [

            "Étlap és foglalás gyors elérése.",

            "Hangulatos, de jól olvasható tipográfia.",

            "Asztali és mobilnézetre komponált elrendezés.",

          ],

        },

        part: {

          title: "Part Bisztró",

          type: "BISZTRÓ · FRISS, NAPFÉNYES",

          description: "Világos, kortárs bisztrókoncepció, ahol a napi ajánlat, a nyitvatartás és a megközelítés könnyen megtalálható. A példa nem valódi vállalkozást vagy ügyfélmunkát mutat be.",

          image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1100&q=78",

          imageAlt: "Part Bisztró nevű kitalált éttermi koncepció előnézete",

          brand: "part bisztró.",

          kicker: "ÍZEK A PART MELLŐL",

          headline: "Friss. Egyszerű.\nTengerparti.",

          subtitle: "A napi ajánlat és minden fontos tudnivaló egy helyen.",

          focus: [

            "Napi ajánlat és nyitvatartás előtérben.",

            "Világos tónusok, könnyen olvasható szövegek.",

            "Közvetlen út az étlaptól a kapcsolatfelvételig.",

          ],

        },

      };

      function setProjectPreviewMode(mode) {

        const isMobile = mode === "mobile";

        dialogDeviceFrame.classList.toggle("is-mobile", isMobile);

        for (const button of previewModeButtons) {

          const active = button.dataset.previewMode === mode;

          button.classList.toggle("is-active", active);

          button.setAttribute("aria-pressed", String(active));

        }

      }

      function openProject(projectKey, opener) {

        const project = projectContent[projectKey];

        if (!project) {

          console.error(`Ismeretlen projektazonosító: ${projectKey}`);

          return;

        }

        lastProjectOpener = opener;

        projectDialogTitle.textContent = project.title;

        dialogProjectType.textContent = project.type;

        dialogProjectDescription.textContent = project.description;

        dialogProjectImage.src = project.image;

        dialogProjectImage.alt = project.imageAlt;

        dialogProjectBrand.textContent = project.brand;

        dialogProjectKicker.textContent = project.kicker;

        dialogProjectHeadline.textContent = project.headline;

        dialogProjectSubtitle.textContent = project.subtitle;

        dialogProjectFocus.replaceChildren();

        for (const item of project.focus) {

          const listItem = document.createElement("li");

          listItem.textContent = item;

          dialogProjectFocus.append(listItem);

        }

        setProjectPreviewMode("desktop");

        window.clearTimeout(projectCloseTimer);

        projectDialog.classList.remove("is-closing");

        projectDialog.showModal();

        dialogCloseButton.focus();

      }

      function closeProjectDialog() {

        if (!projectDialog.open || projectDialog.classList.contains("is-closing")) return;

        projectDialog.classList.add("is-closing");

        const finishClose = () => {

          window.clearTimeout(projectCloseTimer);

          if (projectDialog.open && projectDialog.classList.contains("is-closing")) {

            projectDialog.close();

          }

        };

        projectDialog.addEventListener("transitionend", (event) => {

          if (event.target === projectDialog && event.propertyName === "opacity") finishClose();

        }, { once: true });

        projectCloseTimer = window.setTimeout(finishClose, 320);

      }

      for (const opener of projectOpeners) {

        opener.addEventListener("click", () => openProject(opener.dataset.project, opener));

      }

      dialogCloseButton.addEventListener("click", closeProjectDialog);

      for (const button of previewModeButtons) {

        button.addEventListener("click", () => setProjectPreviewMode(button.dataset.previewMode));

      }

      projectDialog.addEventListener("click", (event) => {

        if (event.target === projectDialog) closeProjectDialog();

      });

      projectDialog.addEventListener("cancel", (event) => {

        event.preventDefault();

        closeProjectDialog();

      });

      projectDialog.addEventListener("keydown", (event) => {

        if (event.key !== "Escape") return;

        event.preventDefault();

        closeProjectDialog();

      });

      projectDialog.addEventListener("close", () => {

        window.clearTimeout(projectCloseTimer);

        projectDialog.classList.remove("is-closing");

        setProjectPreviewMode("desktop");

        if (lastProjectOpener?.isConnected) lastProjectOpener.focus();

      });

      const serviceInterest = document.querySelector("#service-interest");

      const ideaField = document.querySelector("#idea");

      function selectInterest(interest) {

        const matchingOption = [...serviceInterest.options].find((option) => option.value === interest || option.textContent === interest);

        if (matchingOption) serviceInterest.value = matchingOption.value;

        if (!ideaField.value.trim()) {

          ideaField.value = `A(z) „${interest}” szolgáltatásról szeretnék egyeztetni. `;

        }

      }

      document.addEventListener("click", (event) => {

        const interestLink = event.target.closest("[data-interest]");

        if (!interestLink) return;

        selectInterest(interestLink.dataset.interest);

        if (projectDialog.open) closeProjectDialog();

      });

      const fieldRules = [

        {

          field: document.querySelector("#name"),

          error: document.querySelector("#name-error"),

          validate: (value) => value.length > 0 ? "" : "Írd be, hogyan szólíthatunk.",

        },

        {

          field: document.querySelector("#email"),

          error: document.querySelector("#email-error"),

          validate: (value) => {

            if (!value) return "Add meg az e-mail-címed.";

            return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) ? "" : "Ellenőrizd az e-mail-címet (például nev@pelda.hu).";

          },

        },

        {

          field: serviceInterest,

          error: document.querySelector("#service-error"),

          validate: (value) => value ? "" : "Válaszd ki, miben kérnél segítséget.",

        },

        {

          field: ideaField,

          error: document.querySelector("#idea-error"),

          validate: (value) => value ? "" : "Írj néhány szót az elképzelésedről.",

        },

      ];

      function validateField(rule) {

        const value = rule.field.value.trim();

        const message = rule.validate(value);

        rule.error.textContent = message;

        rule.field.setAttribute("aria-invalid", String(Boolean(message)));

        return !message;

      }

      for (const rule of fieldRules) {

        rule.field.addEventListener("input", () => {

          validateField(rule);

          if (fieldRules.every((fieldRule) => !fieldRule.field.hasAttribute("aria-invalid") || fieldRule.field.getAttribute("aria-invalid") === "false")) {

            formError.textContent = "";

          }

        });

        rule.field.addEventListener("change", () => validateField(rule));

      }

      contactForm.addEventListener("submit", (event) => {

        event.preventDefault();

        const invalidFields = fieldRules.filter((rule) => !validateField(rule));

        formNotice.classList.remove("is-checked");

        if (invalidFields.length) {

          formError.textContent = "Nézd át a pirossal jelölt mezőket, és javítsd a hibákat.";

          invalidFields[0].field.focus();

          return;

        }

        formError.textContent = "";

        formNotice.textContent = "A mezők rendben vannak, de ez továbbra is demó: az üzenet nem lett elküldve és nem tárolódott. Az éles ajánlatkéréshez űrlapbekötés és adatkezelési tájékoztató szükséges.";

        formNotice.classList.add("is-checked");

      });

      document.querySelector("#current-year").textContent = String(new Date().getFullYear());

      const revealTargets = document.querySelectorAll(

        ".section-intro, .comparison-heading, .compare-preview, .services-heading, .service-row, .demo-heading, .demo-panel-copy, .project, .process-intro, .process-step, .about-copy, .faq-intro, .faq-item, .contact-copy, .contact-form",

      );

      const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

      let reducedMotion = motionPreference.matches;

      let revealObserver = null;

      function updateRevealEnhancement() {

        revealObserver?.disconnect();

        revealObserver = null;

        if (document.hidden || reducedMotion || !("IntersectionObserver" in window)) {

          for (const target of revealTargets) {

            delete target.dataset.reveal;

            target.classList.remove("is-visible");

          }

          return;

        }

        revealObserver = new IntersectionObserver((entries) => {

          for (const entry of entries) {

            entry.target.classList.toggle("is-visible", entry.isIntersecting);

          }

        }, {

          rootMargin: "0px 0px -45px 0px",

          threshold: 0.08,

        });

        for (const target of revealTargets) {

          target.dataset.reveal = "";

          revealObserver.observe(target);

        }

      }

      updateRevealEnhancement();

      document.addEventListener("visibilitychange", updateRevealEnhancement);

      motionPreference.addEventListener("change", (event) => {

        reducedMotion = event.matches;

        updateRevealEnhancement();

      });

      let scrollFrame = 0;

      const heroBrowser = document.querySelector(".hero-browser");

      const heroVisual = document.querySelector(".hero-visual");

      const comparisonBoard = document.querySelector(".comparison-board");

      const projectVisuals = document.querySelectorAll(".project-visual");

      function updateScrollProgress() {

        if (scrollFrame) return;

        scrollFrame = window.requestAnimationFrame(() => {

          const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;

          const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;

          document.documentElement.style.setProperty("--page-progress", String(Math.min(1, Math.max(0, progress))));

          if (!reducedMotion && heroBrowser && heroVisual) {

            const bounds = heroVisual.getBoundingClientRect();

            const assembly = Math.min(1, Math.max(0, (window.innerHeight * .95 - bounds.top) / (window.innerHeight * .95)));

            heroBrowser.style.setProperty("--hero-turn", `${(1 - assembly) * 5}deg`);

            heroBrowser.style.setProperty("--hero-yaw", `${(1 - assembly) * -4}deg`);

            heroBrowser.style.setProperty("--hero-lift", `${(1 - assembly) * 24}px`);

            heroBrowser.style.setProperty("--hero-size", String(.975 + assembly * .025));

            heroVisual.style.setProperty("--hero-orbit", String(.52 + assembly * .48));

            for (const note of heroVisual.querySelectorAll(".float-note")) {

              note.style.setProperty("--note-progress", String(assembly));

            }

          }

          if (!reducedMotion && comparisonBoard) {

            const bounds = comparisonBoard.getBoundingClientRect();

            const reveal = Math.min(1, Math.max(0, (window.innerHeight - bounds.top) / (bounds.height + window.innerHeight * .35)));

            comparisonBoard.style.setProperty("--before-shift", `${(1 - reveal) * -12}px`);

            comparisonBoard.style.setProperty("--before-angle", `${(1 - reveal) * 1.5}deg`);

            comparisonBoard.style.setProperty("--after-shift", `${(1 - reveal) * 20}px`);

            comparisonBoard.style.setProperty("--after-angle", `${(1 - reveal) * -2}deg`);

            comparisonBoard.style.setProperty("--after-scale", String(.965 + reveal * .035));

            comparisonBoard.style.setProperty("--after-opacity", String(.65 + reveal * .35));

          }

          if (!reducedMotion) {

            for (const visual of projectVisuals) {

              const bounds = visual.getBoundingClientRect();

              const arrival = Math.min(1, Math.max(0, (window.innerHeight * .92 - bounds.top) / (window.innerHeight * .65)));

              visual.style.setProperty("--project-rise", `${(1 - arrival) * 16}px`);

              visual.style.setProperty("--project-angle", `${(1 - arrival) * -1.2}deg`);

            }

          }

          scrollFrame = 0;

        });

      }

      window.addEventListener("scroll", updateScrollProgress, { passive: true });

      window.addEventListener("resize", updateScrollProgress);

      updateScrollProgress();

      const tiltTargets = document.querySelectorAll(".hero-browser, .project-browser");

      const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

      if (finePointer.matches && !reducedMotion) {

        for (const target of tiltTargets) {

          target.addEventListener("pointermove", (event) => {

            const bounds = target.getBoundingClientRect();

            const x = (event.clientX - bounds.left) / bounds.width - .5;

            const y = (event.clientY - bounds.top) / bounds.height - .5;

            target.style.setProperty("--pointer-y", `${y * -4}deg`);

            target.style.setProperty("--pointer-x", `${x * 5}deg`);

          });

          target.addEventListener("pointerleave", () => {

            target.style.setProperty("--pointer-y", "0deg");

            target.style.setProperty("--pointer-x", "0deg");

          });

        }

      }

      const faqItems = document.querySelectorAll(".faq-item");

      for (const item of faqItems) {

        const summary = item.querySelector("summary");

        summary.setAttribute("aria-expanded", String(item.open));

        item.classList.toggle("is-open", item.open);

        summary.addEventListener("click", (event) => {

          event.preventDefault();

          const shouldOpen = !item.classList.contains("is-open");

          item.classList.toggle("is-open", shouldOpen);

          if (shouldOpen) {

            item.open = true;

            summary.setAttribute("aria-expanded", "true");

            return;

          }

          summary.setAttribute("aria-expanded", "false");

          window.setTimeout(() => {

            if (!item.classList.contains("is-open")) item.open = false;

          }, reducedMotion ? 0 : 340);

        });

      }

      // ---------- ELŐTTE–UTÁNA: ÉRINTÉSSEL ÉS BILLENTYŰZETTEL ----------
      const comparisonRange = document.querySelector('.comparison-range');
      const interactiveComparison = document.querySelector('[data-comparison]');
      comparisonRange.addEventListener('input', (event) => {
        interactiveComparison.style.setProperty('--split', event.target.value + '%');
        comparisonRange.setAttribute('aria-valuetext', event.target.value + ' százalék régi nézet');
      });



/* ==========================================================
   CLEVERsite — ANIMÁCIÓS RÉTEG
   Natív Web Animations API, külső könyvtár nélkül.
   ========================================================== */
(() => {
  'use strict';

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const smallScreen = window.matchMedia('(max-width: 760px)');
  const activeAnimations = new Set();
  const headingStates = new WeakMap();
  const headlineTargets = document.querySelectorAll(
    '.hero-copy h1, .comparison-heading h2, .services-heading h2, ' +
    '.demo-heading h2, .work-heading h2, .about-copy h2, .cf-footer-copy h2'
  );

  // A szöveg címként, teljesen és egyben marad a képernyőolvasóban.
  function prepareHeadline(element) {
    const originalLabel = element.innerText.replace(/\s+/g, ' ').trim();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textNodes = [];

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    for (const node of textNodes) {
      if (!node.textContent.trim()) continue;
      const fragment = document.createDocumentFragment();
      const parts = node.textContent.split(/(\s+)/);

      for (const part of parts) {
        if (!part.trim()) {
          fragment.append(document.createTextNode(part));
          continue;
        }

        const mask = document.createElement('span');
        mask.className = 'motion-word-mask';
        mask.setAttribute('aria-hidden', 'true');

        const word = document.createElement('span');
        word.className = 'motion-word';
        word.textContent = part;
        mask.append(word);
        fragment.append(mask);
      }

      node.replaceWith(fragment);
    }

    element.setAttribute('aria-label', originalLabel);
  }

  function trackAnimation(animation) {
    activeAnimations.add(animation);
    animation.finished.then(
      () => activeAnimations.delete(animation),
      () => activeAnimations.delete(animation)
    );
    return animation;
  }

  function animateHeadline(element) {
    if (preference.matches || !element.animate) return;
    if (headingStates.get(element)) return;
    headingStates.set(element, true);

    element.querySelectorAll('.motion-word').forEach((word, index) => {
      trackAnimation(word.animate(
        [
          { transform: 'translateY(110%) rotate(3deg)', opacity: 0 },
          { transform: 'translateY(0) rotate(0)', opacity: 1 }
        ],
        {
          duration: smallScreen.matches ? 650 : 950,
          delay: Math.min(index * 55, 450),
          easing: 'cubic-bezier(.16,1,.3,1)',
          fill: 'backwards'
        }
      ));
    });
  }

  if (!preference.matches && 'IntersectionObserver' in window) {
    headlineTargets.forEach(prepareHeadline);

    const headlineObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          animateHeadline(entry.target);
        } else {
          // Új belépéskor újra lejátszható, mindkét görgetési irányban.
          headingStates.set(entry.target, false);
        }
      }
    }, { threshold: .25 });

    headlineTargets.forEach(element => headlineObserver.observe(element));
  }

  // Nyitókompozíció: külön időzítést kap a böngésző, a szöveg és a címkék.
  if (!preference.matches && Element.prototype.animate) {
    const introItems = document.querySelectorAll(
      '.hero-copy .eyebrow, .hero-lede, .hero-intro, .hero-actions, ' +
      '.hero-visual .float-note'
    );

    introItems.forEach((element, index) => {
      trackAnimation(element.animate(
        [
          { opacity: 0, transform: 'translateY(22px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        {
          duration: 850,
          delay: 120 + index * 85,
          easing: 'cubic-bezier(.16,1,.3,1)',
          fill: 'backwards'
        }
      ));
    });
  }

  // A fény a kártyán belüli koordinátákat követi; nincs egyedi egérkurzor.
  document.querySelectorAll('.project-visual').forEach(visual => {
    const spotlight = document.createElement('div');
    spotlight.className = 'motion-spotlight';
    spotlight.setAttribute('aria-hidden', 'true');
    visual.append(spotlight);

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    visual.addEventListener('pointermove', event => {
      if (preference.matches || !finePointer.matches) return;
      const bounds = visual.getBoundingClientRect();
      pointerX = event.clientX - bounds.left;
      pointerY = event.clientY - bounds.top;
      if (frame) return;

      frame = requestAnimationFrame(() => {
        spotlight.style.setProperty('--light-x', pointerX + 'px');
        spotlight.style.setProperty('--light-y', pointerY + 'px');
        frame = 0;
      });
    }, { passive: true });
  });

  // Mágneses gombmozgás: legfeljebb 7px, kizárólag pontos mutatónál.
  document.querySelectorAll(
    '.hero-actions .button, .nav-cta, .cf-footer-cta'
  ).forEach(button => {
    button.classList.add('motion-magnetic');

    const reset = () => {
      button.style.setProperty('--magnetic-x', '0px');
      button.style.setProperty('--magnetic-y', '0px');
    };

    button.addEventListener('pointermove', event => {
      if (preference.matches || !finePointer.matches) return;
      const bounds = button.getBoundingClientRect();
      const x = (event.clientX - bounds.left - bounds.width / 2) * .08;
      const y = (event.clientY - bounds.top - bounds.height / 2) * .12;
      button.style.setProperty('--magnetic-x', Math.max(-7, Math.min(7, x)) + 'px');
      button.style.setProperty('--magnetic-y', Math.max(-7, Math.min(7, y)) + 'px');
    }, { passive: true });

    button.addEventListener('pointerleave', reset);
    button.addEventListener('blur', reset);
    preference.addEventListener('change', reset);
  });

  // A demó tartalma finoman beúszik, miközben a meglévő tablogika megmarad.
  document.querySelectorAll('[data-demo-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      if (preference.matches) return;
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      const content = panel?.querySelector(
        '.desktop-mockup, .chat-demo-card, .booking-card'
      );

      if (content?.animate) {
        trackAnimation(content.animate(
          [
            { opacity: .3, translate: '0 15px' },
            { opacity: 1, translate: '0 0' }
          ],
          { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)' }
        ));
      }
    });
  });

  // A fejléc csak tényleges görgetéskor kap tömörebb megjelenést.
  const header = document.querySelector('.site-header');
  let scrollFrame = 0;

  function updateHeader() {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      header?.classList.toggle('is-scrolled', window.scrollY > 35);
      scrollFrame = 0;
    });
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  // A mozgó sáv megállítható; háttérben sem fut tovább.
  const ribbon = document.querySelector('.motion-ribbon');
  const pauseButton = document.querySelector('.motion-ribbon-toggle');
  let userPaused = false;
  let ribbonInView = true;

  function updateRibbon() {
    if (!ribbon) return;
    ribbon.classList.toggle(
      'is-paused', userPaused || document.hidden || preference.matches || !ribbonInView
    );
  }

  pauseButton?.addEventListener('click', () => {
    userPaused = !userPaused;
    pauseButton.setAttribute('aria-pressed', String(userPaused));
    pauseButton.setAttribute('aria-label', userPaused ? 'Mozgó sáv elindítása' : 'Mozgó sáv megállítása');
    pauseButton.textContent = userPaused ? '▶' : 'Ⅱ';
    updateRibbon();
  });

  if (ribbon && 'IntersectionObserver' in window) {
    const ribbonObserver = new IntersectionObserver(entries => {
      ribbonInView = entries[0].isIntersecting;
      updateRibbon();
    });
    ribbonObserver.observe(ribbon);
  }

  document.addEventListener('visibilitychange', updateRibbon);
  preference.addEventListener('change', () => {
    if (preference.matches) {
      activeAnimations.forEach(animation => animation.cancel());
      activeAnimations.clear();
    }
    updateRibbon();
  });
  updateRibbon();
})();
