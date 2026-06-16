/**
 * GyaraGyara — script.js
 * Feature-specific functionality:
 * - Homepage: featured products, Swiper carousel
 * - Shop: filtering, sorting, search, product rendering
 * - Product Detail: dynamic loading from slug
 * - Checkout: cart integration, totals, validation
 * - Dashboard: profile persistence
 * - Counter animations (About page)
 */

(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  // ==========================================
  // PAGE DETECTION
  // ==========================================
  const dataPage = document.body.getAttribute("data-page") || "home";

  // ==========================================
  // HOMEPAGE — FEATURED PRODUCTS & SWIPER
  // ==========================================
  async function initHomepage() {
    const products = await GG.loadProducts();
    const featured = products.filter((p) => p.featured);

    // Populate featured products carousel
    const carouselContainer = $("#featured-products-container");
    if (carouselContainer && featured.length > 0) {
      carouselContainer.innerHTML = featured
        .map((p) => createHomeProductCard(p))
        .join("");
      bindCardEvents(carouselContainer);

      // Initialize Swiper if loaded
      if (typeof Swiper !== "undefined") {
        new Swiper("#featured-swiper", {
          slidesPerView: 1.2,
          spaceBetween: 24,
          grabCursor: true,
          breakpoints: {
            576: { slidesPerView: 2.2 },
            768: { slidesPerView: 3.2 },
            1024: { slidesPerView: 4 },
          },
          navigation: {
            nextEl: "#swiper-next",
            prevEl: "#swiper-prev",
          },
        });
      }
    }

    // Category links
    $$("[data-category-link]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const cat = link.getAttribute("data-category-link");
        window.location.href = `shop_now.html?category=${cat}`;
      });
    });

    // CTA buttons
    $$("[data-cta]").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.location.href = btn.getAttribute("data-cta");
      });
    });
  }

  function createHomeProductCard(product) {
    const isWished = GG.isInWishlist(product.id);
    return `
      <div class="swiper-slide bg-[#F4E6D1] rounded-xl p-4 shadow-sm border border-[#c3c6cf]/30 gg-hover-lift">
        <div class="aspect-square bg-white rounded-lg mb-4 overflow-hidden relative gg-img-zoom">
          <img alt="${product.name}" class="w-[75%] m-auto  relative top-1/2 -translate-y-1/2 object-cover" src="${product.image}" loading="lazy" width="280" height="280"/>
          <button class="absolute top-2 right-2 p-1 bg-white/50 rounded-full hover:bg-white transition-colors ${isWished ? "gg-heart-active" : ""}"
                  data-wishlist-btn="${product.id}" aria-label="${isWished ? "Remove from" : "Add to"} wishlist">
            <svg class="w-5 h-5 text-gray-700" fill="${isWished ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="flex justify-between items-center mb-2">
          <span class="font-semibold text-lg">${product.currency}${product.price}</span>
        </div>
        <h3 class="text-sm md:text-md lg:text-lg text-gray-950 mb-4 font-bodyPoppins">${product.name}</h3>
        <div class="flex gap-2">
          <button class="flex-1  text-center py-2 px-4 border border-[#73777f] rounded-md text-sm hover:bg-[#efedef] transition-colors"
                  data-add-cart="${product.id}">Add to Cart</button>
          <a href="product_description_vase.html?slug=${product.slug}" 
             class="flex-1  text-center py-2 px-4 border border-[#73777f] rounded-md text-sm hover:bg-[#efedef] transition-colors">Buy Now</a>
        </div>
      </div>`;
  }

  // ==========================================
  // SHOP PAGE — FILTERING, SORTING, SEARCH
  // ==========================================
  let shopProducts = [];
  let currentCategory = "all";
  let currentSort = "featured";
  let searchQuery = "";
  let searchTimer = null;

  async function initShop() {
    shopProducts = await GG.loadProducts();

    // Check URL for category filter
    const params = new URLSearchParams(window.location.search);
    if (params.has("category")) {
      currentCategory = params.get("category").toLowerCase();
    }

    // Render products
    renderShopProducts();

    // Category tabs
    const categoryNav = $("#category-nav");
    if (categoryNav) {
      $$("a, button", categoryNav).forEach((tab) => {
        const cat = (
          tab.getAttribute("data-category") || tab.textContent.trim()
        ).toLowerCase();
        if (cat === currentCategory) {
          tab.classList.add("font-medium", "text-on-surface");
          tab.classList.remove("text-on-surface-variant");
          tab.setAttribute("aria-current", "page");
        }
        tab.addEventListener("click", (e) => {
          e.preventDefault();
          currentCategory = cat;
          $$("a, button", categoryNav).forEach((t) => {
            t.classList.remove(
              "font-medium",
              "text-on-surface",
              "nav-link",
              "active",
            );
            t.classList.add("text-on-surface-variant");
            t.removeAttribute("aria-current");
          });
          tab.classList.add(
            "font-medium",
            "text-on-surface",
            "nav-link",
            "active",
          );
          tab.classList.remove("text-on-surface-variant");
          tab.setAttribute("aria-current", "page");
          renderShopProducts();
        });
      });
    }

    // Sort select
    const sortSelect = $("#sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", () => {
        currentSort = sortSelect.value.toLowerCase();
        renderShopProducts();
      });
    }

    // Search input
    const searchInput = $("#shop-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          searchQuery = e.target.value.trim().toLowerCase();
          renderShopProducts();
        }, 300);
      });
    }
  }

  function getFilteredProducts() {
    let filtered = [...shopProducts];

    // Category filter
    if (currentCategory && currentCategory !== "all") {
      filtered = filtered.filter(
        (p) => p.category.toLowerCase() === currentCategory,
      );
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery) ||
          p.description.toLowerCase().includes(searchQuery) ||
          p.category.toLowerCase().includes(searchQuery),
      );
    }

    // Sort
    switch (currentSort) {
      case "price: low to high":
      case "price low to high":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price: high to low":
      case "price high to low":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "latest":
        filtered.sort((a, b) => b.id - a.id);
        break;
      case "featured":
      default:
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return filtered;
  }

  function renderShopProducts() {
    const grid = $("#product-grid");
    if (!grid) return;

    const filtered = getFilteredProducts();

    if (filtered.length === 0) {
      grid.innerHTML =
        '<div class="col-span-full gg-no-results"><p>No products found matching your criteria.</p></div>';
      return;
    }

    grid.innerHTML = filtered.map((p) => createShopProductCard(p)).join("");

    bindCardEvents(grid);

    if (typeof VanillaTilt !== "undefined") {
      VanillaTilt.init(grid.querySelectorAll("[data-tilt]"), {
        max: 15,
        speed: 400,
        glare: false,
        "full-page-listening": false
      });
    } // <--- MISSING BRACKET 1 (Closes the 'if' statement)
  } // <--- MISSING BRACKET 2 (Closes the 'renderShopProducts' function)


  function createShopProductCard(product) {
    const isWished = GG.isInWishlist(product.id);
    // ... rest of your code stays exactly the same
    const detailPage = product.isArtwork
      ? "product_description_art_work.html"
      : "product_description_vase.html";
    return ` 
      <article class="product-card flex flex-col relative group">
  <button aria-label="${isWished ? "Remove from" : "Add to"} favorites" class="absolute top-6 right-6 z-10 text-on-surface-variant hover:text-red-500 transition-colors bg-white/50 rounded-full p-1.5 ${isWished ? "gg-heart-active" : ""}" data-wishlist-btn="${product.id}">
          <svg class="w-5 h-5" fill="${isWished ? "currentColor" : "none"}" stroke="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/></svg>
        </button>
  <a href="${detailPage}?slug=${product.slug}" class="product-stage !pb-0 p-2 lg:p-3 w-full rounded-t-[7px] [transform-style:preserve-3d]">

    <!-- Vanilla-tilt attributes handle the mouse parallax -->
  <div class="relative aspect-[0.78/1] max-w-[85%] cursor-pointer [transform-style:preserve-3d]" data-tilt="" data-tilt-max="15" data-tilt-speed="400" data-tilt-perspective="1000" style="will-change: transform; transform: perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1);">
    <div class="relative w-full h-full flex justify-center items-center [transform-style:preserve-3d]">
      
      <!-- Fixed Stage/Podium Background -->
      <img src="images/backProduct.webp" alt="Podium" class="absolute inset-0 w-full h-full object-contain object-bottom [transform:translateZ(-20px)]">

      <!-- Floating Shadow -->
      <span class="absolute bottom-[20%] left-1/2 w-[40%] h-[20px] rounded-full bg-black/60 blur-[8px] z-10 [transform:translateX(-50%)_translateZ(10px)] animate-shadow-float"></span>

      <!-- Product Vase -->
      <img src="${product.image}" alt="${product.name}" class="relative z-20 w-[68%] h-auto object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.4)] animate-vase-float">
      
    </div>
  </div>
  </a>
  <div class="p-4 flex flex-col flex-grow">
    <a href="${detailPage}?slug=${product.slug}" class="text-lg text-on-surface mb-1 hover:underline">${product.name}</a>
    <p class="text-xl font-medium text-on-surface mb-4">${product.currency}${product.price}</p>
    <div class="mt-auto flex items-center justify-between gap-2">
      <button class="btn-outline flex-1 py-1.5 px-3 text-sm font-medium tracking-wide uppercase flex justify-center items-center" data-add-cart="${product.id}">Add To Cart</button>
      <div class="btn-outline flex items-center h-full px-2 py-1.5">
        <button class="px-2  hover:text-opacity-70" data-qty-minus="${product.id}">-</button>
        <input class="w-6 text-center text-sm font-medium bg-transparent border-none p-0 focus:ring-0 " min="1" type="number" value="1" data-qty-input="${product.id}" aria-label="Quantity">
        <button class="px-2  hover:text-opacity-70" data-qty-plus="${product.id}">+</button>
      </div>
    </div>
  </div>
</article>`;
  }

  // ==========================================
  // PRODUCT DETAIL — DYNAMIC LOADING
  // ==========================================
  async function initProductDetail() {
    const params = new URLSearchParams(window.location.search);
    let slug = params.get("slug");
    if (!slug) {
      const path = window.location.pathname.toLowerCase();
      if (path.includes("art_work") || path.includes("artwork")) {
        slug = "abstract-art-print";
      } else {
        slug = "sandel-vase";
      }
    }

    const products = await GG.loadProducts();
    const product = products.find((p) => p.slug === slug);
    if (!product) return;

    // Update page title
    document.title = `${product.name} - Gyara Gyara`;

    // Populate product details
    const nameEl = $("#product-name");
    const priceEl = $("#product-price");
    const descEl = $("#product-description");
    const imgEl = $("#product-image");
    const artistEl = $("#product-artist");

    if (nameEl) nameEl.textContent = product.name;
    if (priceEl) priceEl.textContent = `${product.currency}${product.price}`;
    if (descEl) descEl.textContent = product.description;
    if (imgEl) {
      imgEl.src = product.image;
      imgEl.alt = product.name;
    }
    if (artistEl) artistEl.textContent = product.artist;

    // Populate specs
    if (product.specs) {
      const specEntries = Object.entries(product.specs);
      specEntries.forEach(([key, value]) => {
        const el = $(`[data-spec="${key}"]`);
        if (el) el.textContent = value;
      });
    }

    // JSON-LD for product
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: product.image,
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: product.currency === "₹" ? "INR" : "USD",
        availability: "https://schema.org/InStock",
      },
    };
    const scriptTag = document.createElement("script");
    scriptTag.type = "application/ld+json";
    scriptTag.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(scriptTag);

    // Bind add to cart / buy now / wishlist
    bindProductDetailEvents(product);
  }

  function bindProductDetailEvents(product) {
    // Add to Cart
    $$('[data-action="add-to-cart"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const qtyEl =
          btn
            .closest("[data-qty-group]")
            ?.querySelector('[data-action="qty-display"]') ||
          $('[data-action="qty-display"]');
        const qty = qtyEl ? parseInt(qtyEl.textContent) || 1 : 1;
        GG.addToCart(product, qty);
      });
    });

    // Wishlist
    $$('[data-action="wishlist"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const isActive = GG.toggleWishlist(product);
        btn.classList.toggle("gg-heart-active", isActive);
      });
    });

    // Quantity controls
    $$('[data-action="qty-minus"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const display =
          btn
            .closest("[data-qty-group]")
            ?.querySelector('[data-action="qty-display"]') ||
          $('[data-action="qty-display"]');
        if (display) {
          let val = parseInt(display.textContent) || 1;
          display.textContent = Math.max(1, val - 1);
        }
      });
    });
    $$('[data-action="qty-plus"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const display =
          btn
            .closest("[data-qty-group]")
            ?.querySelector('[data-action="qty-display"]') ||
          $('[data-action="qty-display"]');
        if (display) {
          let val = parseInt(display.textContent) || 1;
          const max = product.inventory || 10;
          if (val < max) {
            display.textContent = val + 1;
          } else {
            GG.showToast(`Only ${max} items available in stock`, "error");
          }
        }
      });
    });

    // Buy Now → add to cart then go to checkout
    $$('[data-action="buy-now"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const qtyEl = btn
          .closest("[data-qty-group]")
          ?.querySelector('[data-action="qty-display"]');
        const qty = qtyEl ? parseInt(qtyEl.textContent) || 1 : 1;
        GG.addToCart(product, qty);
        window.location.href = "checkout.html";
      });
    });
  }

  // ==========================================
  // CHECKOUT — CART INTEGRATION & VALIDATION
  // ==========================================
  function initCheckout() {
    renderCheckoutItems();
    bindCheckoutEvents();
  }

  function renderCheckoutItems() {
    const container = $("#checkout-items");
    const cart = GG.getCart();

    if (container && cart.length > 0) {
      container.innerHTML = cart
        .map((item) => createCheckoutItem(item))
        .join("");
      bindCheckoutItemEvents();
    } else if (container) {
      container.innerHTML =
        '<p class="text-gray-500 py-8 text-center">Your cart is empty. <a href="shop_now.html" class="underline">Continue shopping</a></p>';
    }

    // Update item count
    const countEl = $("#checkout-item-count");
    if (countEl) {
      const total = cart.reduce((sum, i) => sum + i.qty, 0);
      countEl.textContent = `${total} Item${total !== 1 ? "s" : ""}`;
    }

    updateCheckoutTotals();
  }

  function createCheckoutItem(item) {
    return `
      <div class="flex items-center space-x-6" data-checkout-item="${item.id}">
        <div class="w-32 h-32 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
          <img alt="${item.name}" class="w-full h-full object-cover" src="${item.image}" width="128" height="128" loading="lazy"/>
        </div>
        <div class="flex-grow">
          <h3 class="text-lg font-medium font-bodyPoppins">${item.name}</h3>
          <p class="font-bold text-lg mt-1">${item.currency}${item.price}</p>
          <div class="flex items-center space-x-4 mt-4">
            <div class="flex border border-gray-700 rounded overflow-hidden">
              <button class="px-3 py-1 hover:bg-gray-100 border-r border-gray-300 focus:outline-none" data-checkout-minus="${item.id}">-</button>
              <input class="max-w-10 text-center py-1 border-none focus:ring-0 text-sm" readonly type="text" value="${item.qty}" data-checkout-qty="${item.id}"/>
              <button class="px-3 py-1 hover:bg-gray-100 border-l border-gray-300 focus:outline-none" data-checkout-plus="${item.id}">+</button>
            </div>
            <button aria-label="Remove item" class="text-gray-500 hover:text-red-500 transition-colors focus:outline-none" data-checkout-remove="${item.id}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/></svg>
            </button>
          </div>
        </div>
      </div>`;
  }

  function bindCheckoutItemEvents() {
    $$("[data-checkout-minus]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-checkout-minus"));
        const input = $(`[data-checkout-qty="${id}"]`);
        let val = parseInt(input?.value) || 1;
        if (val > 1) {
          GG.updateCartQty(id, val - 1);
          renderCheckoutItems();
        }
      });
    });
    $$("[data-checkout-plus]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = parseInt(btn.getAttribute("data-checkout-plus"));
        const input = $(`[data-checkout-qty="${id}"]`);
        let val = parseInt(input?.value) || 1;

        const products = await GG.loadProducts();
        const product = products.find((p) => p.id === id);
        const max = product ? product.inventory || 10 : 10;

        if (val < max) {
          GG.updateCartQty(id, val + 1);
          renderCheckoutItems();
        } else {
          GG.showToast(`Only ${max} items available in stock`, "error");
        }
      });
    });
    $$("[data-checkout-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-checkout-remove"));
        GG.removeFromCart(id);
        renderCheckoutItems();
        GG.showToast("Item removed from cart", "success");
      });
    });
  }

  function updateCheckoutTotals() {
    const cart = GG.getCart();
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const taxRate = 0.05;
    const taxes = subtotal * taxRate;
    const total = subtotal + taxes;

    const subtotalEl = $("#checkout-subtotal");
    const taxesEl = $("#checkout-taxes");
    const totalEl = $("#checkout-total");

    if (subtotalEl) subtotalEl.textContent = subtotal.toFixed(2);
    if (taxesEl) taxesEl.textContent = taxes.toFixed(2);
    if (totalEl) totalEl.textContent = total.toFixed(2);
  }

  function bindCheckoutEvents() {
    // Form validation
    const proceedBtn = $("#proceed-payment");
    if (proceedBtn) {
      proceedBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (validateCheckoutForm()) {
          GG.showToast("Order placed successfully!", "success");
          localStorage.removeItem("gg_cart");
          setTimeout(() => (window.location.href = "index.html"), 2000);
        }
      });
    }

    // Discount code (placeholder)
    const applyBtn = $("#apply-discount");
    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        GG.showToast("Discount code applied!", "success");
      });
    }
  }

  function validateCheckoutForm() {
    const fields = [
      { id: "name", label: "Name", required: true },
      { id: "email", label: "Email", required: true, type: "email" },
      { id: "mobile", label: "Mobile number", required: true },
      { id: "street", label: "Street number", required: true },
      { id: "city", label: "City", required: true },
      { id: "zipcode", label: "Zipcode", required: true },
      { id: "country", label: "Country", required: true },
    ];

    let valid = true;

    // Clear previous errors
    $$(".gg-error-message").forEach((el) => {
      el.classList.remove("visible");
      el.remove();
    });
    $$(".gg-field-error").forEach((el) =>
      el.classList.remove("gg-field-error"),
    );

    fields.forEach((field) => {
      const input = $(`#${field.id}`);
      if (!input) return;
      const val = input.value.trim();

      if (field.required && !val) {
        showFieldError(input, `${field.label} is required`);
        valid = false;
      } else if (
        field.type === "email" &&
        val &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
      ) {
        showFieldError(input, "Please enter a valid email");
        valid = false;
      }
    });

    if (!valid) {
      GG.showToast("Please fill in all required fields", "error");
    }

    return valid;
  }

  function showFieldError(input, message) {
    input.classList.add("gg-field-error");
    const error = document.createElement("div");
    error.className = "gg-error-message visible";
    error.textContent = message;
    input.parentNode.appendChild(error);
  }

  // ==========================================
  // DASHBOARD — PROFILE PERSISTENCE
  // ==========================================
  function initDashboard() {
    const profile = JSON.parse(localStorage.getItem("gg_profile") || "{}");

    // Load saved values
    const firstNameInput = $("#firstName");
    const lastNameInput = $("#lastName");
    const emailInput = $("#emailAddress");

    if (firstNameInput && profile.firstName)
      firstNameInput.value = profile.firstName;
    if (lastNameInput && profile.lastName)
      lastNameInput.value = profile.lastName;
    if (emailInput && profile.email) emailInput.value = profile.email;

    // Save changes
    const form = $("form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const data = {
          firstName: firstNameInput?.value || "",
          lastName: lastNameInput?.value || "",
          email: emailInput?.value || "",
        };
        localStorage.setItem("gg_profile", JSON.stringify(data));
        GG.showToast("Profile saved successfully!", "success");
      });
    }

    // Cancel button
    const cancelBtn = $('button[type="button"]');
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        if (firstNameInput) firstNameInput.value = profile.firstName || "Elena";
        if (lastNameInput) lastNameInput.value = profile.lastName || "Sato";
        if (emailInput)
          emailInput.value = profile.email || "elena.sato@slowliving.com";
        GG.showToast("Changes cancelled", "success");
      });
    }
  }


  // ==========================================
  // WISHLIST — DYNAMIC RENDERING
  // ==========================================
  function initWishlist() {
    const wishlist = GG.getWishlist();
    const container = $("#wishlist-grid");
    if (!container) return;

    if (wishlist.length === 0) {
      container.innerHTML =
        '<div class="col-span-full py-12 text-center text-gray-500">Your wishlist is empty. <br><br> <a href="shop_now.html" class="underline hover:text-primary">Continue shopping</a></div>';
      return;
    }

    container.innerHTML = wishlist
      .map((p) => createShopProductCard(p))
      .join("");
    
    bindCardEvents(container);

    // Initialize Vanilla-Tilt on the newly generated wishlist cards
    if (typeof VanillaTilt !== "undefined") {
      VanillaTilt.init(container.querySelectorAll("[data-tilt]"), {
        max: 15,
        speed: 400,
        glare: false,
        "full-page-listening": false
      });
    }
  }

  // ==========================================
  // COUNTER ANIMATIONS (About page)
  // ==========================================
  function initCounterAnimations() {
    const counters = $$("[data-counter]");
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = el.getAttribute("data-counter");
            const suffix = el.getAttribute("data-counter-suffix") || "";
            animateCounter(el, parseFloat(target), suffix);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.5 },
    );

    counters.forEach((el) => observer.observe(el));
  }

  function animateCounter(el, target, suffix) {
    const duration = 2000;
    const startTime = performance.now();
    const isFloat = target % 1 !== 0;

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = eased * target;

      el.textContent =
        (isFloat ? current.toFixed(1) : Math.floor(current)) + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  // ==========================================
  // CARD EVENT BINDING (shared)
  // ==========================================
  function bindCardEvents(container) {
    if (!container) return;

    // Add to cart buttons
    $$("[data-add-cart]", container).forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = parseInt(btn.getAttribute("data-add-cart"));
        const products = await GG.loadProducts();
        const product = products.find((p) => p.id === id);
        if (!product) return;
        const qtyInput = $(`[data-qty-input="${id}"]`, container);
        const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
        GG.addToCart(product, qty);
      });
    });

    // Wishlist buttons
    $$("[data-wishlist-btn]", container).forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = parseInt(btn.getAttribute("data-wishlist-btn"));
        const products = await GG.loadProducts();
        const product = products.find((p) => p.id === id);
        if (!product) return;
        const isActive = GG.toggleWishlist(product);
        btn.classList.toggle("gg-heart-active", isActive);
        const svg = $("svg", btn);
        if (svg) svg.setAttribute("fill", isActive ? "currentColor" : "none");
      });
    });

    // Quantity +/- buttons
    $$("[data-qty-plus]", container).forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = parseInt(btn.getAttribute("data-qty-plus"));
        const input = $(`[data-qty-input="${id}"]`, container);
        const products = await GG.loadProducts();
        const product = products.find((p) => p.id === id);
        const max = product ? product.inventory || 10 : 10;

        if (input) {
          let val = parseInt(input.value || 1);
          if (val < max) {
            input.value = val + 1;
          } else {
            GG.showToast(`Only ${max} items available in stock`, "error");
          }
        }
      });
    });
    $$("[data-qty-minus]", container).forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-qty-minus"));
        const input = $(`[data-qty-input="${id}"]`, container);
        if (input) input.value = Math.max(1, parseInt(input.value || 1) - 1);
      });
    });
  }

  // ==========================================
  // INIT BY PAGE
  // ==========================================
  function init() {
    if (dataPage === "home") {
      initHomepage();
    } else if (dataPage === "shop") {
      initShop();
    } else if (dataPage === "product") {
      initProductDetail();
    } else if (dataPage === "checkout") {
      initCheckout();
    } else if (dataPage === "dashboard") {
      initDashboard();
    } else if (dataPage === "about") {
      initCounterAnimations();
    } else if (dataPage === "wishlist") {
      initWishlist();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
