gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  const section = document.querySelector(".stats-section");
  const statsArea = document.querySelector(".stats-area");
  const stats = gsap.utils.toArray(".stats-area .stats");
  const dots = gsap.utils.toArray(".dots-area .dot");

  if (!section || !statsArea || !stats.length) return;

  const layoutStats = () => {
    const first = stats[0];
    const rect = first.getBoundingClientRect();
    const height = rect.height;

    // Keep only one stat visible at a time and stack the rest behind it
    gsap.set(statsArea, { position: "relative", overflow: "hidden", height });
    stats.forEach((item, index) => {
      gsap.set(item, {
        position: "absolute",
        width: "100%",
        left: 0,
        top: index * height,
      });
    });

    return height;
  };

  let statHeight = layoutStats();

  const setActiveDot = (idx) => {
    const target = stats[idx];
    if (!target) return;
    const dataIndex = target.getAttribute("data-index");
    dots.forEach((dot) => {
      if (dot.getAttribute("data-index") === dataIndex) {
        dot.setAttribute("data-state", "active");
      } else {
        dot.removeAttribute("data-state");
      }
    });
  };

  // Scroll-driven odometer movement
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => "+=" + (stats.length - 1) * statHeight,
      pin: true,
      scrub: true,
      snap: stats.length > 1 ? 1 / (stats.length - 1) : false,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefresh: () => {
        statHeight = layoutStats();
        tl.invalidate();
      },
      onUpdate: (self) => {
        const idx = Math.min(
          Math.round(self.progress * (stats.length - 1)),
          stats.length - 1
        );
        setActiveDot(idx);
      },
      onEnter: () => setActiveDot(0),
      onEnterBack: (self) => {
        const idx = Math.min(
          Math.round(self.progress * (stats.length - 1)),
          stats.length - 1
        );
        setActiveDot(idx);
      },
    },
  });

  tl.to(statsArea, {
    y: () => -1 * (stats.length - 1) * statHeight,
  });

  // Dot clicks jump to the corresponding stat
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const targetIdx = dot.getAttribute("data-index");
      const idx = stats.findIndex(
        (s) => s.getAttribute("data-index") === targetIdx
      );
      const st = tl.scrollTrigger;
      if (idx !== -1 && st) {
        const progress = idx / Math.max(stats.length - 1, 1);
        const targetScroll = st.start + (st.end - st.start) * progress;
        window.scrollTo({ top: targetScroll, behavior: "smooth" });
      }
    });
  });

  // Handle resizes
  window.addEventListener("resize", () => {
    statHeight = layoutStats();
    tl.invalidate().restart();
  });
});
