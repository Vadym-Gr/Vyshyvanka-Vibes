export function initSectionNavigation() {
  const header = document.querySelector('.page-header');
  const root = document.documentElement;
  const links = [
    ...document.querySelectorAll('.header-nav__link, .mobile-menu__link'),
  ];
  const sectionIds = new Set(
    links.map(link => link.getAttribute('href').slice(1))
  );
  // Keep DOM order: only one section wins even when several are visible.
  const sections = [...document.querySelectorAll('main section[id]')].filter(
    section => sectionIds.has(section.id)
  );
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let navigation;
  let queued = false;
  let headerHeight = 0;

  function setActive(id) {
    for (const link of links) {
      if (link.getAttribute('href') === `#${id}`) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  }

  function updateActiveSection() {
    queued = false;
    if (root.classList.contains('menu-open')) return;

    // Hold the clicked section throughout smooth scrolling. At the bottom,
    // multiple short sections may share one scroll position: keep the user's
    // selection there until they actually scroll or request another section.
    if (navigation) {
      const atDestination = Math.abs(window.scrollY - navigation.top) < 2;
      if (!navigation.settled) {
        navigation.settled = atDestination;
        return;
      }
      if (atDestination) return;
      navigation = undefined;
    }

    const activationLine = headerHeight + 24;
    let activeId;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= activationLine + 1) {
        activeId = section.id;
      } else {
        break;
      }
    }

    // The last section may be too short to reach the header before the page ends.
    if (
      window.scrollY > 0 &&
      window.scrollY + window.innerHeight >= root.scrollHeight - 2
    ) {
      activeId = sections.at(-1)?.id;
    }
    setActive(activeId);
  }

  function queueUpdate() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(updateActiveSection);
  }

  function syncHeaderHeight() {
    const measuredHeight = header.getBoundingClientRect().height;
    if (measuredHeight !== headerHeight) {
      headerHeight = measuredHeight;
      root.style.setProperty('--header-height', `${headerHeight}px`);
      navigation = undefined;
    }
    queueUpdate();
  }

  function navigateToSection(
    target,
    { updateHistory = true, instant = false } = {}
  ) {
    const offset = parseFloat(getComputedStyle(root).scrollPaddingTop);
    const maxScroll = Math.max(0, root.scrollHeight - window.innerHeight);
    const top = Math.max(
      0,
      Math.min(
        window.scrollY + target.getBoundingClientRect().top - offset,
        maxScroll
      )
    );
    navigation = { top, settled: Math.abs(window.scrollY - top) < 2 };
    setActive(target.id);
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (updateHistory && window.location.hash !== `#${target.id}`) {
      window.history.pushState(null, '', `#${target.id}`);
    }
    window.scrollTo({
      top,
      behavior: instant || reducedMotion.matches ? 'instant' : 'smooth',
    });
    queueUpdate();
  }

  function releaseNavigation() {
    if (root.classList.contains('menu-open')) return;
    navigation = undefined;
    queueUpdate();
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('.header-nav__link, [data-section-link]');
    if (
      !link ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;

    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    event.preventDefault();
    navigateToSection(target);
  });

  window.addEventListener('scroll', queueUpdate, { passive: true });
  window.addEventListener('wheel', releaseNavigation, { passive: true });
  window.addEventListener('touchmove', releaseNavigation, { passive: true });
  window.addEventListener('keydown', event => {
    const isEditable = event.target.closest(
      'input, textarea, select, [contenteditable]'
    );
    if (
      !isEditable &&
      [
        'ArrowUp',
        'ArrowDown',
        'PageUp',
        'PageDown',
        'Home',
        'End',
        ' ',
      ].includes(event.key)
    )
      releaseNavigation();
  });
  window.addEventListener('pointerdown', event => {
    if (event.clientX >= root.clientWidth) releaseNavigation();
  });
  window.addEventListener('resize', () => {
    navigation = undefined;
    syncHeaderHeight();
  });

  function followHash() {
    const target = sections.find(
      section => `#${section.id}` === window.location.hash
    );
    if (target)
      navigateToSection(target, { updateHistory: false, instant: true });
    else releaseNavigation();
  }

  window.addEventListener('hashchange', followHash);
  window.addEventListener('load', followHash, { once: true });
  new ResizeObserver(syncHeaderHeight).observe(header);
  new ResizeObserver(queueUpdate).observe(document.querySelector('main'));
  syncHeaderHeight();
  if (document.readyState === 'complete') followHash();

  return navigateToSection;
}
