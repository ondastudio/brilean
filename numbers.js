gsap.registerPlugin(ScrollTrigger);

const qs = (root, sel) => Array.from(root.querySelectorAll(sel));

const injectStyles = () => {
  if (document.getElementById("odo-style-injected")) return;

  const style = document.createElement("style");
  style.id = "odo-style-injected";
  style.textContent = `.odo{display:inline-flex;align-items:flex-end}.odo-col{position:relative;display:inline-block;overflow:hidden;vertical-align:bottom}.odo-col::before{content:"0";visibility:hidden;display:block}.odo-inner{will-change:transform;position:absolute;top:0;left:0}.odo-digit{display:block}.odo-static{display:inline-block;vertical-align:baseline;align-self:flex-end}.stats-section{touch-action:pan-y;overscroll-behavior:contain}`;
  document.head.appendChild(style);
};

// Odometer logic:

const buildOdometer = (el) => {
  if (!el || el.dataset.odoBuilt) return el;
  injectStyles();
  const wrapper = document.createElement("span");
  wrapper.className = "odo";
  const final = (el.textContent || "").trim();
  el.dataset.odoFinal = final;
  final.split("").forEach((ch) => {
    if (!/\d/.test(ch)) {
      const s = document.createElement("span");
      s.className = "odo-static";
      s.textContent = ch;
      wrapper.appendChild(s);
      return;
    }

    const col = document.createElement("span");
    col.className = "odo-col";

    const inner = document.createElement("span");
    inner.className = "odo-inner";

    const target = parseInt(ch, 10) || 0;

    const pre = Array.from(
      { length: 2 + Math.floor(Math.random() * 2) },
      (_, i, arr) => {
        const n = Math.floor(Math.random() * 10);
        return n === target || n === arr?.[i - 1] ? (n + 1) % 10 : n;
      }
    );

    [...pre, target].forEach((digit) => {
      const d = document.createElement("span");
      d.className = "odo-digit";
      d.textContent = digit;
      inner.appendChild(d);
    });

    col.appendChild(inner);
    wrapper.appendChild(col);
  });

  el.textContent = "";
  el.appendChild(wrapper);
  el.dataset.odoBuilt = "1";

  return el;
};

const animateOdometer = (el) => {
  const cols = qs(el ?? document, ".odo-col");
  const targets = (el?.dataset.odoFinal || "").match(/\d/g) || [];
  const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

  cols.forEach((col, idx) => {
    const inner = col.querySelector(".odo-inner");
    const digits = inner?.querySelectorAll(".odo-digit");
    const height = digits?.[0]?.getBoundingClientRect().height || 0;

    if (!height) return;

    const target = parseInt(targets[idx] ?? "0", 10);
    const list = Array.from(digits);
    const targetIdx =
      list.findLastIndex((d) => d.textContent === String(target)) ??
      list.length - 1;

    gsap.set(inner, { y: 0 });
    tl.to(
      inner,
      { y: -targetIdx * height, duration: 0.8 + Math.random() * 0.15 },
      idx * 0.06
    );
  });

  return tl;
};

const fadeIn = (root, selector, y, duration, ease) => {
  const el = root.querySelector(selector);
  if (!el) return null;
  gsap.killTweensOf(el);
  gsap.set(el, { y, autoAlpha: 0, display: "block" });
  return gsap.to(el, { y: 0, autoAlpha: 1, duration, ease });
};

// Populate the odometer with webflow elements
const initSection = (section, overrides = {}) => {
  if (!section || !window?.gsap || !window?.ScrollTrigger) return;

  const cfg = {
    statSelector: ".stats",
    numberSelector: ".stats-number",
    symbolSelector: ".stats-symbol",
    descriptionSelector: ".stats-description",
    dotSelector: ".dot",
    markers: true,
    ...overrides,
  };

  const stats = qs(section, cfg.statSelector).filter((n, i, arr) => {
    const idx = n.getAttribute("data-index");
    return (
      idx && arr.findIndex((m) => m.getAttribute("data-index") === idx) === i
    );
  });

  if (!stats.length) return;

  const isTouch =
    ScrollTrigger.isTouch || window.matchMedia("(max-width:768px)").matches;

  const perSlide = isTouch ? 200 : 60;

  const snap =
    stats.length > 1
      ? {
          snapTo: 1 / (stats.length - 1),
          duration: { min: isTouch ? 0.3 : 0.08, max: isTouch ? 0.6 : 0.25 },
          ease: "power1.inOut",
          directional: true,
        }
      : 1;

  const originalDisplay = new Map(
    stats.map((el) => [el, window.getComputedStyle(el).display || "block"])
  );

  stats.forEach((el) => (el.style.display = "none"));

  const dots = qs(section, cfg.dotSelector);

  const show = (idx) =>
    stats.forEach(
      (el, i) =>
        (el.style.display = i === idx ? originalDisplay.get(el) : "none")
    );

  const setDots = (idx) =>
    dots.forEach((d) =>
      d.getAttribute("data-index") === idx
        ? d.setAttribute("data-state", "active")
        : d.removeAttribute("data-state")
    );

  let current = -1;

  const activate = (idx) => {
    if (idx === current || idx < 0 || idx >= stats.length) return;
    current = idx;

    const stat = stats[idx];
    const num = stat.querySelector(cfg.numberSelector);
    show(idx);
    setDots(stat.getAttribute("data-index"));

    if (!num) return;

    if (!num.dataset.odoInit) {
      buildOdometer(num);
      num.dataset.odoInit = "1";
    }

    const odo = animateOdometer(num);

    const startAt = Math.min(0.2, (odo?.duration() || 0) * 0.3);

    const call = (fn, delay = startAt) =>
      odo ? odo.call(fn, [], delay) : fn();
    call(() => fadeIn(stat, cfg.symbolSelector, 48, 0.8, "back.out(1.6)"));
    call(
      () => fadeIn(stat, cfg.descriptionSelector, 96, 1.4, "power4.out"),
      startAt + 0.12
    );
  };

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: section,
      start: "center center",
      end: "+=" + (stats.length - 1) * perSlide * (isTouch ? 3 : 2) + "%",
      pin: true,
      scrub: isTouch ? 1.5 : true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      snap,
      markers: true,
    },
  });

  dots.forEach((dot) =>
    dot.addEventListener("click", () => {
      const idx = stats.findIndex(
        (s) => s.getAttribute("data-index") === dot.getAttribute("data-index")
      );
      if (idx === -1 || !tl.scrollTrigger) return;
      const progress = idx / (stats.length - 1 || 1);
      const st = tl.scrollTrigger;
      window.scrollTo({
        top: st.start + (st.end - st.start) * progress,
        behavior: "smooth",
      });
    })
  );

  ScrollTrigger.create({
    trigger: section,
    start: "center center",
    end: "+=" + (stats.length - 1) * perSlide * 2 + "%",
    onUpdate: (self) =>
      activate(
        Math.min(
          Math.round(self.progress * (stats.length - 1)),
          stats.length - 1
        )
      ),
    onEnter: () => activate(0),
    onEnterBack: (self) =>
      activate(
        Math.min(
          Math.round(self.progress * (stats.length - 1)),
          stats.length - 1
        )
      ),
    markers: cfg.markers,
  });
  show(0);
};

document.addEventListener("DOMContentLoaded", () => {
  ScrollTrigger?.normalizeScroll?.(true);
  const sections = new Set([
    ...qs(document, "[data-stats-section]"),
    ...qs(document, ".stats-section"),
  ]);

  sections.forEach((section) =>
    initSection(section, {
      markers: section.getAttribute("data-stats-markers") === "true",
    })
  );
});
