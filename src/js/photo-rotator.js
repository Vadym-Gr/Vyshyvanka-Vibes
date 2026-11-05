const PHOTO_INTERVAL = 5000;

export function initPhotoRotators() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  for (const rotator of document.querySelectorAll('[data-photo-rotator]')) {
    const allSlides = [...rotator.querySelectorAll('[data-photo-slide]')];
    const toggle = rotator.querySelector('.photo-rotator__toggle');
    if (allSlides.length < 2 || !toggle) continue;
    let slides = [];
    let index = 0;
    let timer;
    let inView = false;
    let userPaused = false;
    let hovered = false;
    let focused = false;

    function scheduleNextPhoto() {
      window.clearTimeout(timer);
      if (
        slides.length < 2 ||
        reducedMotion.matches ||
        document.hidden ||
        !inView ||
        userPaused ||
        hovered ||
        focused
      )
        return;

      timer = window.setTimeout(() => {
        index = (index + 1) % slides.length;
        showPhoto();
        scheduleNextPhoto();
      }, PHOTO_INTERVAL);
    }

    function showPhoto() {
      for (const slide of allSlides) {
        const active = slide === slides[index];
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      }
    }

    function syncPreference() {
      toggle.hidden = slides.length < 2 || reducedMotion.matches;
      scheduleNextPhoto();
    }

    toggle.addEventListener('click', () => {
      userPaused = !userPaused;
      const label = userPaused ? 'Resume photos' : 'Pause photos';
      toggle.setAttribute('aria-label', label);
      toggle.title = label;
      toggle.classList.toggle('is-paused', userPaused);
      scheduleNextPhoto();
    });
    rotator.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      hovered = true;
      scheduleNextPhoto();
    });
    rotator.addEventListener('pointerleave', () => {
      hovered = false;
      scheduleNextPhoto();
    });
    rotator.addEventListener('focusin', () => {
      focused = true;
      scheduleNextPhoto();
    });
    rotator.addEventListener('focusout', event => {
      focused = rotator.contains(event.relatedTarget);
      scheduleNextPhoto();
    });
    document.addEventListener('visibilitychange', scheduleNextPhoto);
    reducedMotion.addEventListener('change', syncPreference);

    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      scheduleNextPhoto();
    }).observe(rotator);

    // Decode both photos before switching, so slow loading cannot reveal a blank frame.
    Promise.all(
      allSlides.map(async slide => {
        try {
          await slide.querySelector('img').decode();
          return slide;
        } catch {
          return null;
        }
      })
    ).then(readySlides => {
      slides = readySlides.filter(Boolean);
      if (slides.length) showPhoto();
      syncPreference();
    });
  }
}
