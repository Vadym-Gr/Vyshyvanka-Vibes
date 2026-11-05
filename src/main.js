import { initMobileMenu } from './js/mobile-menu.js';
import { initSectionNavigation } from './js/section-navigation.js';
import { initPhotoRotators } from './js/photo-rotator.js';

const navigateToSection = initSectionNavigation();
initMobileMenu({ navigateToSection });
initPhotoRotators();
