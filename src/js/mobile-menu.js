export function initMobileMenu({ navigateToSection }) {
  const menu = document.querySelector('#mobile-menu');
  const toggle = document.querySelector('.menu-toggle');
  const closeButton = menu?.querySelector('.mobile-menu__close');

  if (!menu || !toggle || !closeButton) return;

  const desktop = window.matchMedia('(min-width: 1280px)');
  const root = document.documentElement;
  const body = document.body;
  const lockedProperties = ['position', 'top', 'left', 'right', 'paddingRight'];
  let previousStyles = {};
  let previousFocus;
  let scrollPosition = 0;
  let destination;

  function openMenu() {
    if (desktop.matches || menu.open) return;

    previousFocus = document.activeElement;
    scrollPosition = window.scrollY;
    previousStyles = Object.fromEntries(
      lockedProperties.map(property => [property, body.style[property]])
    );
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    const bodyPadding = parseFloat(getComputedStyle(body).paddingRight);
    root.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);

    Object.assign(body.style, {
      position: 'fixed',
      top: `-${scrollPosition}px`,
      left: '0',
      right: '0',
      paddingRight: `${bodyPadding + scrollbarWidth}px`,
    });
    root.classList.add('menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    menu.showModal();
    menu.classList.add('is-open');
    closeButton.focus({ preventScroll: true });
  }

  function closeMenu() {
    if (menu.open) menu.close();
  }

  menu.addEventListener('close', () => {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    Object.assign(body.style, previousStyles);
    root.classList.remove('menu-open');
    root.style.removeProperty('--scrollbar-width');

    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, scrollPosition);
    root.style.scrollBehavior = previousScrollBehavior;

    if (destination) {
      const target = destination;
      destination = undefined;
      navigateToSection(target);
    } else {
      const focusTarget = previousFocus?.getClientRects().length
        ? previousFocus
        : document.querySelector('.brand-link');
      focusTarget?.focus({ preventScroll: true });
    }
  });

  toggle.addEventListener('click', openMenu);
  closeButton.addEventListener('click', closeMenu);
  menu.addEventListener('cancel', event => {
    event.preventDefault();
    closeMenu();
  });

  menu.addEventListener('click', event => {
    const bounds = menu.getBoundingClientRect();
    const isOutside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (event.target === menu && isOutside) {
      closeMenu();
      return;
    }

    const link = event.target.closest('.mobile-menu__link');
    if (!link) return;

    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;

    event.preventDefault();
    destination = target;
    closeMenu();
  });

  // Native dialog makes the background inert; wrap Tab explicitly as well.
  menu.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;

    const focusable = [...menu.querySelectorAll('a[href], button')];
    const first = focusable[0];
    const last = focusable.at(-1);

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  desktop.addEventListener('change', event => {
    if (event.matches) closeMenu();
  });

  toggle.hidden = false;
}
