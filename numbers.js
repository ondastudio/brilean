gsap.registerPlugin(ScrollTrigger);

// create odometer:
document.addEventListener("DOMContentLoaded", () => {
  const injectStyles = () => {
    if (document.getElementById("odo-style-injected")) return;
    const style = document.createElement("style");
    style.id = "odo-style-injected";
    style.textContent = `.odo{display:inline-flex;align-items:flex-end}.odo-col{position:relative;display:inline-block;overflow:hidden;vertical-align:bottom}.odo-inner{will-change:transform;display:block}.odo-digit{display:block;line-height:1}.odo-static{display:inline-block}`;
    document.head.appendChild(style);
  };

  const buildOdometer = (el) => {
    if (!el || el.dataset.odoBuilt === "1") return el;
    injectStyles();

    const final = (el.textContent || "").trim();
    el.dataset.odoFinal = final;

    const wrapper = document.createElement("span");
    wrapper.className = "odo";

    final.split("").forEach((ch) => {
      if (!/\d/.test(ch)) {
        const span = document.createElement("span");
        span.className = "odo-static";
        span.textContent = ch;
        wrapper.appendChild(span);
        return;
      }

      const col = document.createElement("span");
      col.className = "odo-col";
      const inner = document.createElement("span");
      inner.className = "odo-inner";

      const target = parseInt(ch, 10);
      const preCount = 2 + Math.floor(Math.random() * 2);
      let last = -1;

      for (let i = 0; i < preCount; i++) {
        let rand = Math.floor(Math.random() * 10);
        if (rand === last || rand === target) rand = (rand + 1) % 10;
        last = rand;
        const digit = document.createElement("span");
        digit.className = "odo-digit";
        digit.textContent = String(rand);
        inner.appendChild(digit);
      }

      const finalDigit = document.createElement("span");
      finalDigit.className = "odo-digit";
      finalDigit.textContent = String(target);
      inner.appendChild(finalDigit);

      col.appendChild(inner);
      wrapper.appendChild(col);
    });

    el.textContent = "";
    el.appendChild(wrapper);

    const sample = el.querySelector(".odo-digit");
    const height = sample?.getBoundingClientRect().height || 0;
    if (height > 0) {
      el.querySelectorAll(".odo-col").forEach(
        (c) => (c.style.height = height + "px")
      );
    }

    el.dataset.odoBuilt = "1";
    return el;
  };

  const animateOdometer = (el) => {
    if (!el) return;
    const cols = Array.from(el.querySelectorAll(".odo-col"));
    if (!cols.length) return;

    const targets = (el.dataset.odoFinal || "").match(/\d/g) || [];
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    cols.forEach((col, idx) => {
      const inner = col.querySelector(".odo-inner");
      const digits = inner?.querySelectorAll(".odo-digit");
      if (!digits?.length) return;

      const height = digits[0].getBoundingClientRect().height || 0;
      if (!height) return;

      gsap.set(inner, { y: 0 });

      const target = parseInt(targets[idx] ?? "0", 10);
      let targetIdx = -1;
      for (let i = digits.length - 1; i >= 0; i--) {
        if (digits[i].textContent === String(target)) {
          targetIdx = i;
          break;
        }
      }
      if (targetIdx === -1) targetIdx = digits.length - 1;

      tl.to(
        inner,
        {
          y: -targetIdx * height,
          duration: 0.8 + Math.random() * 0.15,
        },
        idx * 0.06
      );
    });

    return tl;
  };

  const setOdometerToFinal = (el) => {
    if (!el) return;
    const cols = Array.from(el.querySelectorAll(".odo-col"));
    const targets = (el.dataset.odoFinal || "").match(/\d/g) || [];

    cols.forEach((col, idx) => {
      const inner = col.querySelector(".odo-inner");
      const digits = inner?.querySelectorAll(".odo-digit");
      if (!digits?.length) return;

      const height = digits[0].getBoundingClientRect().height || 0;
      const target = parseInt(targets[idx] ?? "0", 10);
      let targetIdx = -1;

      for (let i = digits.length - 1; i >= 0; i--) {
        if (digits[i].textContent === String(target)) {
          targetIdx = i;
          break;
        }
      }
      if (targetIdx === -1) targetIdx = digits.length - 1;
      gsap.set(inner, { y: -targetIdx * height });
    });
  };

  const animateElement = (container, selector, y, duration, ease) => {
    if (!container) return null;
    const el = container.querySelector(selector);
    if (!el) return null;
    gsap.killTweensOf(el);
    gsap.set(el, { y, autoAlpha: 0, display: "block" });
    return gsap.to(el, { y: 0, autoAlpha: 1, duration, ease });
  };

  const allStats = gsap.utils.toArray(".stats");
  const uniqueStats = [];
  const seen = new Set();

  allStats.forEach((stats) => {
    const idx = stats.getAttribute("data-index");
    if (!seen.has(idx)) {
      seen.add(idx);
      uniqueStats.push(stats);
    }
  });

  const stats = uniqueStats;
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: ".stats-section",
      start: "center center",
      end: "+=" + (stats.length - 1) * 300 + "%",
      pin: true,
      scrub: true,
      markers: true,
    },
  });

  const originalDisplay = new Map();
  stats.forEach((el) => {
    const comp = window.getComputedStyle(el);
    originalDisplay.set(el, comp.display === "none" ? "block" : comp.display);
    el.style.display = "none";
  });

  const showOnly = (idx) => {
    stats.forEach((el, i) => {
      el.style.display =
        i === idx ? originalDisplay.get(el) || "block" : "none";
    });
  };

  // Dots animation on scroll
  const dots = document.querySelectorAll(".dot");
  const st = tl.scrollTrigger;

  const updateDots = (active) => {
    dots.forEach((dot) => {
      if (dot.getAttribute("data-index") === active) {
        dot.setAttribute("data-state", "active");
      } else {
        dot.removeAttribute("data-state");
      }
    });
  };

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const targetIdx = dot.getAttribute("data-index");
      const idx = stats.findIndex(
        (s) => s.getAttribute("data-index") === targetIdx
      );

      if (idx !== -1 && st) {
        const progress = idx / (stats.length - 1);
        const targetScroll = st.start + (st.end - st.start) * progress;
        window.scrollTo({ top: targetScroll, behavior: "smooth" });
      }
    });
  });

  ScrollTrigger.create({
    trigger: ".stats-section",
    start: "center center",
    end: "+=" + (stats.length - 1) * 300 + "%",
    onUpdate: (self) => {
      const idx = Math.min(
        Math.round(self.progress * (stats.length - 1)),
        stats.length - 1
      );
      if (window.__lastStatsIndex === undefined) window.__lastStatsIndex = -1;

      if (idx !== window.__lastStatsIndex) {
        const current = stats[idx];
        if (current) {
          const dataIdx = current.getAttribute("data-index");
          updateDots(dataIdx);
          showOnly(idx);

          const numEl = current.querySelector(".stats-number");
          if (numEl) {
            if (numEl.dataset.odoInit !== "1") {
              buildOdometer(numEl);
              numEl.dataset.odoInit = "1";
            }

            const symbol = current.querySelector(".stats-symbol");
            const desc = current.querySelector(".stats-description");

            if (symbol)
              gsap.set(symbol, { y: 48, autoAlpha: 0, display: "block" });
            if (desc) gsap.set(desc, { y: 96, autoAlpha: 0, display: "block" });

            const odoTl = animateOdometer(numEl);
            if (odoTl) {
              const offset = 0.1;
              const startAt = Math.max(0, odoTl.duration() - offset);

              if (symbol) {
                if (odoTl.duration() > 0) {
                  odoTl.call(
                    () =>
                      animateElement(
                        current,
                        ".stats-symbol",
                        48,
                        0.8,
                        "back.out(1.6)"
                      ),
                    [],
                    startAt
                  );
                } else {
                  animateElement(
                    current,
                    ".stats-symbol",
                    48,
                    0.8,
                    "back.out(1.6)"
                  );
                }
              }

              if (desc) {
                const descStart = startAt;
                if (odoTl.duration() > descStart) {
                  odoTl.call(
                    () =>
                      animateElement(
                        current,
                        ".stats-description",
                        96,
                        1.4,
                        "power4.out"
                      ),
                    [],
                    descStart
                  );
                } else {
                  odoTl.eventCallback("onComplete", () =>
                    animateElement(
                      current,
                      ".stats-description",
                      96,
                      1.4,
                      "power4.out"
                    )
                  );
                }
              }
            }
          }
        }
        window.__lastStatsIndex = idx;
      }
    },
  });

  showOnly(0);
  const first = stats[0];
  if (first) {
    const numEl = first.querySelector(".stats-number");
    if (numEl) {
      buildOdometer(numEl);
      setOdometerToFinal(numEl);
    }
    const symbol = first.querySelector(".stats-symbol");
    const desc = first.querySelector(".stats-description");
    if (symbol) gsap.set(symbol, { y: 0, autoAlpha: 1, display: "block" });
    if (desc) gsap.set(desc, { y: 0, autoAlpha: 1, display: "block" });
    updateDots(first.getAttribute("data-index") || "1");
    window.__lastStatsIndex = 0;
  }
});
