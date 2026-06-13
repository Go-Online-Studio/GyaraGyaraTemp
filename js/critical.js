/**
 * GyaraGyara — critical.js
 * Core functionality loaded on every page:
 * - Navbar injection & scroll behavior
 * - Footer injection
 * - Active link detection
 * - Mobile offcanvas menu
 * - Cart/Wishlist counter badges
 * - Toast notifications
 * - Newsletter popup
 */

(function () {
  'use strict';

  // ==========================================
  // UTILITIES
  // ==========================================
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  // ==========================================
  // NAVBAR INJECTION
  // ==========================================
  async function injectNavbar() {
    // Navbar is now hardcoded in HTML, so we just initialize it
    initNavbarBehavior();
    initMobileMenu();
    updateCounters();
  }

  // ==========================================
  // FOOTER INJECTION
  // ==========================================
  async function injectFooter() {
    // Footer is now hardcoded in HTML, no fetch needed
  }

  // ==========================================
  // NAVBAR BEHAVIOR
  // ==========================================
  function initNavbarBehavior() {
    const navbar = $('#navbarInner');
    if (!navbar) return;

    // Active link detection
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = $$('[data-nav]');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('font-semibold');
        link.setAttribute('aria-current', 'page');
      }
    });

    // Make navbar fixed on all pages
    navbar.style.position = 'fixed';
    navbar.style.width = '100%';
    navbar.style.left = '0';
    navbar.style.top = '0';
    navbar.style.zIndex = '1000';

    const isHome = document.body.getAttribute('data-page') === 'home';
    if (isHome) {
      navbar.classList.add('gg-navbar-transparent');

      const handleScroll = () => {
        if (window.scrollY > 100) {
          navbar.classList.remove('gg-navbar-transparent');
          navbar.classList.add('gg-navbar-solid');
        } else {
          navbar.classList.add('gg-navbar-transparent');
          navbar.classList.remove('gg-navbar-solid');
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    } else {
      navbar.classList.add('gg-navbar-solid');

      const adjustBodyPadding = () => {
        const height = navbar.offsetHeight;
        document.body.style.paddingTop = height + 'px';
      };
      
      // Run immediately and on resize/load
      adjustBodyPadding();
      window.addEventListener('resize', adjustBodyPadding);
      window.addEventListener('load', adjustBodyPadding);
    }
  }

  // ==========================================
  // MOBILE OFFCANVAS MENU
  // ==========================================
  function initMobileMenu() {
    const hamburger = $('#hamburgerBtn');
    const overlay = $('#offcanvasOverlay');
    const menu = $('#offcanvasMenu');
    if (!hamburger || !menu) return;

    let previousFocus = null;
    let isOpen = false;

    function toggleMenu() {
      isOpen = !isOpen;
      
      if (isOpen) {
        previousFocus = document.activeElement;
        
        // Open classes
        if (overlay) {
          overlay.classList.remove('opacity-0', 'invisible');
          overlay.classList.add('opacity-100', 'visible');
        }
        menu.classList.remove('-translate-x-full');
        menu.classList.add('translate-x-0');
        
        hamburger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        
        const firstLink = $('a', menu);
        if (firstLink) firstLink.focus();
        menu.addEventListener('keydown', trapFocus);
      } else {
        // Close classes
        if (overlay) {
          overlay.classList.remove('opacity-100', 'visible');
          overlay.classList.add('opacity-0', 'invisible');
        }
        menu.classList.remove('translate-x-0');
        menu.classList.add('-translate-x-full');
        
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        
        menu.removeEventListener('keydown', trapFocus);
        if (previousFocus) previousFocus.focus();
      }
    }

    function trapFocus(e) {
      if (e.key !== 'Tab') return;
      const focusable = $$('a, button, input, [tabindex]', menu).filter(el => !el.disabled);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    hamburger.addEventListener('click', toggleMenu);
    overlay?.addEventListener('click', () => { if (isOpen) toggleMenu(); });

    // ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        toggleMenu();
      }
    });

    // Active links in offcanvas
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    $$('[data-nav]', menu).forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('text-black/20'); // styling for active
      }
    });
  }

  // ==========================================
  // CART & WISHLIST STORAGE
  // ==========================================
  window.GG = window.GG || {};

  GG.getCart = function () {
    try { return JSON.parse(localStorage.getItem('gg_cart')) || []; }
    catch { return []; }
  };
  GG.saveCart = function (cart) {
    localStorage.setItem('gg_cart', JSON.stringify(cart));
    updateCounters();
  };
  GG.addToCart = function (product, qty = 1) {
    const cart = GG.getCart();
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        currency: product.currency || '$', 
        image: product.image, 
        qty,
        slug: product.slug || '',
        isArtwork: product.isArtwork || false
      });
    }
    GG.saveCart(cart);
    GG.showToast(`${product.name} added to cart`, 'success');
  };
  GG.removeFromCart = function (productId) {
    let cart = GG.getCart();
    cart = cart.filter(item => item.id !== productId);
    GG.saveCart(cart);
  };
  GG.updateCartQty = function (productId, qty) {
    const cart = GG.getCart();
    const item = cart.find(i => i.id === productId);
    if (item) {
      item.qty = Math.max(1, qty);
      GG.saveCart(cart);
    }
  };
  GG.getCartCount = function () {
    return GG.getCart().reduce((sum, item) => sum + item.qty, 0);
  };

  GG.getWishlist = function () {
    try { return JSON.parse(localStorage.getItem('gg_wishlist')) || []; }
    catch { return []; }
  };
  GG.saveWishlist = function (list) {
    localStorage.setItem('gg_wishlist', JSON.stringify(list));
    updateCounters();
  };
  GG.toggleWishlist = function (product) {
    let list = GG.getWishlist();
    const idx = list.findIndex(item => item.id === product.id);
    if (idx > -1) {
      list.splice(idx, 1);
      GG.showToast(`${product.name} removed from wishlist`, 'success');
    } else {
      list.push({ 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        currency: product.currency || '$', 
        image: product.image,
        slug: product.slug || '',
        isArtwork: product.isArtwork || false
      });
      GG.showToast(`${product.name} added to wishlist`, 'success');
    }
    GG.saveWishlist(list);
    return list.some(item => item.id === product.id);
  };
  GG.isInWishlist = function (productId) {
    return GG.getWishlist().some(item => item.id === productId);
  };

  // ==========================================
  // COUNTER BADGES
  // ==========================================
  function updateCounters() {
    const cartBadge = $('#cartCount');
    const wishBadge = $('#wishlistCount');
    const cartTotal = GG.getCartCount();
    const wishTotal = GG.getWishlist().length;

    if (cartBadge) {
      cartBadge.textContent = cartTotal > 0 ? cartTotal : '';
      cartBadge.setAttribute('data-count', cartTotal);
    }
    if (wishBadge) {
      wishBadge.textContent = wishTotal > 0 ? wishTotal : '';
      wishBadge.setAttribute('data-count', wishTotal);
    }
  }

  // ==========================================
  // TOAST NOTIFICATIONS
  // ==========================================
  function ensureToastContainer() {
    let container = $('.gg-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'gg-toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('role', 'status');
      document.body.appendChild(container);
    }
    return container;
  }

  GG.showToast = function (message, type = 'success', duration = 3000) {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `gg-toast gg-toast-${type}`;
    const iconSvg = type === 'success'
      ? '<svg class="gg-toast-icon" fill="none" stroke="#4caf50" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg class="gg-toast-icon" fill="none" stroke="#f44336" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });
    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, duration);
  };

  // ==========================================
  // NEWSLETTER POPUP
  // ==========================================
  function initNewsletter() {
    if (localStorage.getItem('gg_newsletter_shown')) return;

    setTimeout(() => {
      if (localStorage.getItem('gg_newsletter_shown')) return;
      showNewsletterPopup();
    }, 5000);
  }

  function showNewsletterPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'gg-popup-overlay';
    overlay.id = 'newsletterOverlay';

    overlay.innerHTML = `
      <div class="gg-popup-content relative w-full max-w-[500px] bg-white rounded-lg h-screen overflow-y-auto custom-scroll shadow-2xl pb-8">
        <button aria-label="Close popup" class="absolute top-4 right-4 z-50 text-gray-500 hover:text-black transition-colors" id="popupCloseBtn">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="relative w-full pt-8 px-3 md:px-8">
          <div class="relative shadow-gray-900/45 z-10 w-full h-full shadow-md bg-white flex items-center justify-center mt-16 pb-8 border-2 border-gray-900">
            <div class="w-[80%] ml-4 lg:ml-8 -mt-8">
              <img  
                alt="Plant in a decorative wooden vase" 
                class="filter drop-shadow-[0_12px_12px_rgba(37,33,28,0.40)] object-cover aspect-square object-center" 
                src="images/PopUp.webp"
                loading="lazy"
              />
            </div>

          </div>
        </div>
        <div class="px-3 md:px-8 mt-6">
          <form class="space-y-3" id="newsletterForm" novalidate>
            <div class="relative flex items-center border border-black rounded shadow-sm overflow-hidden bg-white h-10">
              <label class="shrink-0 pl-1 md:pl-4 pr-1 md:pr-3 py-2 text-sm font-medium text-black min-w-[70px] font-serif" for="nl-email">Email</label>
              <div class="h-5 w-px bg-gray-300"></div>
              <input class="flex-1 px-3 py-2 border-none focus:ring-0 text-sm outline-none" id="nl-email" type="email" required/>
            </div>
            <div class="relative flex items-center border border-black rounded shadow-sm overflow-hidden bg-white h-10">
              <label class="shrink-0 pl-1 md:pl-4 pr-1 md:pr-3 py-2 text-sm font-medium text-black min-w-[78px] font-serif" for="nl-phone">Phone no.</label>
              <div class="h-5 w-px bg-gray-300"></div>
              <input class="flex-1 px-3 py-2 border-none focus:ring-0 text-sm outline-none" id="nl-phone" type="tel"/>
            </div>
            <div class="pt-3 flex justify-center">
              <button class="bg-[#c4c4c4] border border-black text-black px-12 py-2 rounded text-sm font-medium shadow hover:bg-gray-300 transition-colors w-[200px]" type="submit">Register</button>
            </div>
          </form>
        </div>
        <div class="mx-8 mt-6 bg-[#f2e8d5] border border-[#f2e8d5] shadow-md text-center py-5 px-4">
          <h3 class="text-2xl text-[#1a2942] mb-2 tracking-wide font-serif" style="font-weight:600;">10% OFF</h3>
          <p class="text-[#1a2942] text-sm leading-relaxed max-w-[250px] mx-auto font-serif">Register and get upto 10% off on your Purchase</p>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add('active'));
    });

    function closePopup() {
      overlay.classList.remove('active');
      localStorage.setItem('gg_newsletter_shown', '1');
      overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
    }

    $('#popupCloseBtn', overlay).addEventListener('click', closePopup);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePopup();
    });
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        closePopup();
        document.removeEventListener('keydown', escHandler);
      }
    });

    const form = $('#newsletterForm', overlay);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = $('#nl-email', overlay).value;
      if (email) {
        localStorage.setItem('gg_newsletter_email', email);
        localStorage.setItem('gg_newsletter_phone', $('#nl-phone', overlay).value || '');
        GG.showToast('Thanks for subscribing! Enjoy 10% off.', 'success');
        closePopup();
      }
    });
  }

  // ==========================================
  // FADE UP ANIMATION ON SCROLL
  // ==========================================
  function initScrollAnimations() {
    const elements = $$('.gg-fade-up');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    elements.forEach(el => observer.observe(el));
  }

  // ==========================================
  // PRODUCT DATA LOADER
  // ==========================================
  GG.products = null;
  GG.loadProducts = async function () {
    if (GG.products) return GG.products;
    try {
      const resp = await fetch('data/products.json?v=' + Date.now());
      if (!resp.ok) throw new Error('Failed to load products');
      GG.products = await resp.json();
      return GG.products;
    } catch (e) {
      console.warn('Product data load failed:', e);
      return [];
    }
  };

  GG.getProductBySlug = function (slug) {
    if (!GG.products) return null;
    return GG.products.find(p => p.slug === slug) || null;
  };

  GG.getProductById = function (id) {
    if (!GG.products) return null;
    return GG.products.find(p => p.id === id) || null;
  };

  // ==========================================
  // INIT
  // ==========================================
  async function init() {
    await Promise.all([injectNavbar(), injectFooter()]);
    initScrollAnimations();
    initNewsletter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
