gsap.registerPlugin(ScrollTrigger);

// [Scroll Animation that changes the slides]
document.addEventListener("DOMContentLoaded", () => {
  const allSlides = gsap.utils.toArray(".slide");
  const uniqueSlides = [];
  const seenIndexes = new Set();

  allSlides.forEach((slide) => {
    const index = slide.getAttribute("data-index");
    if (!seenIndexes.has(index)) {
      seenIndexes.add(index);
      uniqueSlides.push(slide);
    }
  });

  const slide_group = uniqueSlides;
  const delay = 0.1;

  const tl = gsap.timeline({
    defaults: {
      ease: "power1.inOut",
    },
    scrollTrigger: {
      trigger: ".numbers-section",
      start: "center center",
      end: "+=" + (slide_group.length - 1) * 50 + "%",
      pin: true,
      scrub: true,
      //   markers: true,
    },
  });

  gsap.set(slide_group, {
    rotationX: (i) => (i ? -90 : 0),
    transformOrigin: "center center",
    opacity: 1,
    visibility: "visible",
  });

  // "Flip" animation:
  slide_group.forEach((slide, i) => {
    const nextSlide = slide_group[i + 1];
    if (!nextSlide) return;

    tl.to(
      slide,
      {
        rotationX: 90,
        transformOrigin: "center center -130px",
      },
      "+=" + delay
    ).to(
      nextSlide,
      {
        rotationX: 0,
        transformOrigin: "center center -130px",
      },
      "<"
    );
  });

  tl.to({}, { duration: delay });

  // [Active dot animation and dot navigation]
  const dots = document.querySelectorAll(".dot");
  const scrollTriggerInstance = tl.scrollTrigger;

  function updateActiveDot(activeIndex) {
    dots.forEach((dot) => {
      const dotIndex = dot.getAttribute("data-index");
      if (dotIndex === activeIndex) {
        dot.setAttribute("data-state", "active");
      } else {
        dot.removeAttribute("data-state");
      }
    });
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const targetIndex = dot.getAttribute("data-index");

      const slideIndex = slide_group.findIndex(
        (slide) => slide.getAttribute("data-index") === targetIndex
      );

      if (slideIndex !== -1 && scrollTriggerInstance) {
        const progress = slideIndex / (slide_group.length - 1);

        // Calculate the exact scroll position
        const targetScroll =
          scrollTriggerInstance.start +
          (scrollTriggerInstance.end - scrollTriggerInstance.start) * progress;

        // Smooth scroll to position
        window.scrollTo({
          top: targetScroll,
          behavior: "smooth",
        });
      }
    });
  });

  // Update active dot based on scroll progress
  ScrollTrigger.create({
    trigger: ".numbers-section",
    start: "center center",
    end: "+=" + (slide_group.length - 1) * 50 + "%",
    onUpdate: (self) => {
      const progress = self.progress;
      const currentSlideIndex = Math.min(
        Math.round(progress * (slide_group.length - 1)),
        slide_group.length - 1
      );
      const currentSlide = slide_group[currentSlideIndex];
      if (currentSlide) {
        const currentIndex = currentSlide.getAttribute("data-index");
        updateActiveDot(currentIndex);
      }
    },
  });

  updateActiveDot("1");
});
