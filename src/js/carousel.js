export function initCarousels() {
  for (const carousel of document.querySelectorAll('[data-carousel]')) {
    if (carousel.hasAttribute('data-carousel-ready')) continue;

    const viewport = carousel.querySelector('.carousel__viewport');
    const track = carousel.querySelector('.carousel__track');
    const previous = carousel.querySelector('.carousel__previous');
    const next = carousel.querySelector('.carousel__next');
    const status = carousel.querySelector('[data-carousel-status]');
    const items = [...carousel.querySelectorAll('[data-carousel-item]')];
    if (!viewport || !track || !previous || !next || !items.length) continue;

    const groupSize = Math.max(
      1,
      Number(carousel.dataset.carouselGroupSize) || items.length
    );
    const itemName = carousel.dataset.carouselItemName || 'items';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let placements = [];
    let columns = 1;
    let rows = 1;
    let current = 0;
    let target;
    let step = 0;
    let lastWidth = 0;
    let totalColumns = 0;
    let queued = false;
    let scrollTimer;
    let touching = false;

    const lastPosition = () => Math.max(0, totalColumns - columns);
    const clamp = position => Math.max(0, Math.min(lastPosition(), position));

    function renderState(announce = false, updateItems = true) {
      let visibleCount = 0;
      for (const { item, column } of placements) {
        const visible = column >= current && column < current + columns;
        if (updateItems) {
          item.inert = !visible;
          item.setAttribute('aria-hidden', String(!visible));
        }
        if (visible) visibleCount++;
      }
      const buttonPosition = target ?? current;
      previous.disabled = buttonPosition <= 0;
      next.disabled = buttonPosition >= lastPosition();

      if (announce && status) {
        const message = `Showing ${visibleCount} of ${items.length} ${itemName}. Position ${current + 1} of ${lastPosition() + 1}.`;
        if (status.textContent !== message) status.textContent = message;
      }
    }

    function layout() {
      const styles = getComputedStyle(carousel);
      const nextColumns = Math.max(
        1,
        parseInt(styles.getPropertyValue('--carousel-columns'), 10) || 1
      );
      const nextRows = Math.max(
        1,
        parseInt(styles.getPropertyValue('--carousel-rows'), 10) || 1
      );
      const width = viewport.getBoundingClientRect().width;
      if (width === lastWidth && columns === nextColumns && rows === nextRows)
        return;

      const anchor =
        placements.find(placement => placement.column === current)?.item ||
        items[0];
      columns = nextColumns;
      rows = nextRows;
      lastWidth = width;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const itemWidth = (width - gap * (columns - 1)) / columns;
      step = itemWidth + gap;
      carousel.style.setProperty('--carousel-item-width', `${itemWidth}px`);

      // Preserve each source group's row-major layout while moving whole columns.
      const groupColumns = Math.ceil(groupSize / rows);
      placements = items.map((item, index) => {
        const local = index % groupSize;
        const column =
          Math.floor(index / groupSize) * groupColumns + (local % groupColumns);
        const row = Math.floor(local / groupColumns);
        item.style.gridColumn = String(column + 1);
        item.style.gridRow = String(row + 1);
        return { item, column, row };
      });
      // Match the screen-reader order to the visual rows, including mixed groups.
      for (const { item } of [...placements].sort(
        (a, b) => a.row - b.row || a.column - b.column
      )) {
        track.appendChild(item);
      }
      totalColumns =
        Math.max(...placements.map(placement => placement.column)) + 1;
      carousel.setAttribute('data-carousel-ready', '');
      current = clamp(
        placements.find(placement => placement.item === anchor).column
      );
      target = undefined;
      viewport.scrollTo({ left: current * step, behavior: 'instant' });
      renderState(true);
      previous.hidden = false;
      next.hidden = false;
    }

    function updateFromScroll() {
      queued = false;
      current = clamp(Math.round(viewport.scrollLeft / step));
      if (
        target !== undefined &&
        Math.abs(viewport.scrollLeft - target * step) < 2
      ) {
        target = undefined;
      }
      // Do not make the touched card inert while a native swipe is in progress.
      renderState(false, false);
    }

    function finishScroll() {
      window.clearTimeout(scrollTimer);
      if (touching) return;
      if (
        target !== undefined &&
        Math.abs(viewport.scrollLeft - target * step) >= 2
      )
        return;
      // Keep every completed gesture aligned to a full column.
      const aligned = clamp(Math.round(viewport.scrollLeft / step));
      if (Math.abs(viewport.scrollLeft - aligned * step) >= 2) {
        target = aligned;
        viewport.scrollTo({
          left: aligned * step,
          behavior: reducedMotion.matches ? 'instant' : 'smooth',
        });
        return;
      }
      target = undefined;
      updateFromScroll();
      renderState(true);
    }

    function move(direction) {
      target = clamp((target ?? current) + direction);
      renderState();
      viewport.scrollTo({
        left: target * step,
        behavior: reducedMotion.matches ? 'instant' : 'smooth',
      });
    }

    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    viewport.addEventListener(
      'scroll',
      () => {
        if (!queued) {
          queued = true;
          requestAnimationFrame(updateFromScroll);
        }
        window.clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(finishScroll, 180);
      },
      { passive: true }
    );
    viewport.addEventListener('scrollend', finishScroll);
    viewport.addEventListener('pointerdown', () => {
      target = undefined;
    });
    viewport.addEventListener(
      'touchstart',
      () => {
        touching = true;
        target = undefined;
      },
      { passive: true }
    );
    const endTouch = () => {
      touching = false;
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(finishScroll, 180);
    };
    viewport.addEventListener('touchend', endTouch, { passive: true });
    viewport.addEventListener('touchcancel', endTouch, { passive: true });
    viewport.addEventListener(
      'wheel',
      () => {
        target = undefined;
      },
      { passive: true }
    );
    viewport.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (event.target.closest('input, textarea, select, [contenteditable]'))
        return;
      event.preventDefault();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    });
    new ResizeObserver(layout).observe(viewport);
    layout();
  }
}
