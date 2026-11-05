import { initMobileMenu } from './js/mobile-menu.js';
import { initSectionNavigation } from './js/section-navigation.js';

const navigateToSection = initSectionNavigation();
initMobileMenu({ navigateToSection });
