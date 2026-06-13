/**
 * GyaraGyara — whatsapp.js
 * WhatsApp enquiry system for artwork product pages:
 * - Device detection (mobile vs desktop)
 * - Message generation from form fields
 * - Speciality Paper / Custom Size / Send Enquiry buttons
 * - Form reset after launch
 */

(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  // ==========================================
  // DEVICE DETECTION
  // ==========================================
  function isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent);
  }

  function getWhatsAppBaseUrl() {
    return isMobile()
      ? 'https://api.whatsapp.com/send'
      : 'https://web.whatsapp.com/send';
  }

  const PHONE_NUMBER = '918156087656'; // From footer contact info

  // ==========================================
  // MESSAGE GENERATION
  // ==========================================
  function getProductName() {
    const el = $('#product-name') || $('h1');
    return el ? el.textContent.trim() : 'Art Work';
  }

  function getFormValues() {
    return {
      paperMaterial: $('#paper-material')?.value || '',
      frame: $('#frame')?.value || '',
      paperSize: $('#paper-size')?.value || '',
      canvasType: $('#canvas-type')?.value || ''
    };
  }

  function getCustomSizeValues() {
    return {
      height: $('#custom-height')?.value || '',
      width: $('#custom-width')?.value || ''
    };
  }

  function buildEnquiryMessage(type) {
    const productName = getProductName();
    const form = getFormValues();
    let message = '';

    switch (type) {
      case 'speciality':
        message = `Hi! I'm interested in a *Speciality Paper* enquiry for:\n\n`
          + `*Product:* ${productName}\n`
          + `*Paper Material:* ${form.paperMaterial}\n`
          + `*Frame:* ${form.frame}\n`
          + `*Size:* ${form.paperSize}\n`
          + `*Canvas Type:* ${form.canvasType}\n\n`
          + `Could you please provide more details about speciality paper options?`;
        break;

      case 'custom-size': {
        const custom = getCustomSizeValues();
        message = `Hi! I'd like to enquire about a *Custom Size* for:\n\n`
          + `*Product:* ${productName}\n`
          + `*Custom Height:* ${custom.height}\n`
          + `*Custom Width:* ${custom.width}\n`
          + `*Paper Material:* ${form.paperMaterial}\n`
          + `*Frame:* ${form.frame}\n`
          + `*Canvas Type:* ${form.canvasType}\n\n`
          + `Please let me know about availability and pricing.`;
        break;
      }

      case 'enquiry':
      default:
        message = `Hi! I'd like to enquire about:\n\n`
          + `*Product:* ${productName}\n`
          + `*Paper Material:* ${form.paperMaterial}\n`
          + `*Frame:* ${form.frame}\n`
          + `*Size:* ${form.paperSize}\n`
          + `*Canvas Type:* ${form.canvasType}\n\n`
          + `Could you please share more details?`;
        break;
    }

    return message;
  }

  // ==========================================
  // LAUNCH WHATSAPP
  // ==========================================
  function launchWhatsApp(type) {
    const message = buildEnquiryMessage(type);
    const baseUrl = getWhatsAppBaseUrl();
    const url = `${baseUrl}?phone=${PHONE_NUMBER}&text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');

    // Reset form fields
    resetFormFields();

    if (window.GG?.showToast) {
      GG.showToast('WhatsApp enquiry opened!', 'success');
    }
  }

  function resetFormFields() {
    const selects = ['#paper-material', '#frame', '#paper-size', '#canvas-type', '#custom-height', '#custom-width'];
    selects.forEach(sel => {
      const el = $(sel);
      if (el) el.selectedIndex = 0;
    });
  }

  // ==========================================
  // BIND BUTTONS
  // ==========================================
  function init() {
    // Speciality Paper button
    const specialityBtn = $('[data-wa="speciality"]');
    if (specialityBtn) {
      specialityBtn.addEventListener('click', (e) => {
        e.preventDefault();
        launchWhatsApp('speciality');
      });
    }

    // Custom Size button
    const customBtn = $('[data-wa="custom-size"]');
    if (customBtn) {
      customBtn.addEventListener('click', (e) => {
        e.preventDefault();
        launchWhatsApp('custom-size');
      });
    }

    // Send Enquiry link
    const enquiryBtn = $('[data-wa="enquiry"]');
    if (enquiryBtn) {
      enquiryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        launchWhatsApp('enquiry');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
