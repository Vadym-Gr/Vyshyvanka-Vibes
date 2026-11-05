import { initMobileMenu } from './js/mobile-menu.js';
import { initSectionNavigation } from './js/section-navigation.js';
import { initPhotoRotators } from './js/photo-rotator.js';
import { initCarousels } from './js/carousel.js';
import { initOrderForm } from './js/order-form.js';

const navigateToSection = initSectionNavigation();
initMobileMenu({ navigateToSection });
initPhotoRotators();
initCarousels();
initOrderForm();
