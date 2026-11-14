/**
 * TravelEase Main Interactive Logic
 */

document.addEventListener('DOMContentLoaded', function () {
  // 1. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navMenu = document.getElementById('siteNavMenu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', function () {
      navMenu.classList.toggle('mobile-open');
      const expanded = navMenu.classList.contains('mobile-open');
      mobileToggle.setAttribute('aria-expanded', expanded);
    });
  }

  // 2. Header Scroll Effect
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', function () {
    if (window.scrollY > 20) {
      header && header.classList.add('scrolled');
    } else {
      header && header.classList.remove('scrolled');
    }
  });

  // 3. Search Widget Tabs (Hotels / Flights / Tours)
  const tabButtons = document.querySelectorAll('.search-tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const targetTab = this.getAttribute('data-tab');
      // Update buttons
      tabButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      // Update panes
      document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
      });
      const activePane = document.getElementById(targetTab + '-pane');
      if (activePane) activePane.classList.add('active');
    });
  });

  // 4. FAQ Accordions
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(btn => {
    btn.addEventListener('click', function () {
      const item = this.parentElement;
      const isActive = item.classList.contains('active');
      
      // Close others
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // 5. Promo Code Copy
  const promoBox = document.getElementById('copyPromoBtn');
  if (promoBox) {
    promoBox.addEventListener('click', function () {
      const code = this.getAttribute('data-code') || 'SUMMER35';
      navigator.clipboard.writeText(code).then(() => {
        showToast('Promo code ' + code + ' copied to clipboard!');
      });
    });
  }

  // 6. Newsletter Form
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = this.querySelector('input[type="email"]').value;
      if (email) {
        showToast('Thank you for subscribing! Check your inbox for your 15% discount voucher.');
        this.reset();
      }
    });
  }

  // 7. Global Country & Currency Switcher
  const currencySelect = document.getElementById('currencySelect');
  const savedCountry = localStorage.getItem('voyo_country');
  const savedCurrency = localStorage.getItem('voyo_currency') || 'USD';

  if (currencySelect) {
    let matchedOption = null;
    if (savedCountry) {
      matchedOption = currencySelect.querySelector(`option[value="${savedCountry}"]`);
    }
    if (!matchedOption && savedCurrency) {
      matchedOption = currencySelect.querySelector(`option[data-currency="${savedCurrency}"]`) ||
                      currencySelect.querySelector(`option[value="${savedCurrency}"]`);
    }

    if (matchedOption) {
      currencySelect.value = matchedOption.value;
      const targetCurr = matchedOption.dataset.currency || matchedOption.value;
      window.VoyoCurrency.apply(targetCurr, false, matchedOption.dataset.country);
    } else {
      window.VoyoCurrency.apply('USD', false, 'United States');
    }

    currencySelect.addEventListener('change', function () {
      const selectedOpt = this.options[this.selectedIndex];
      if (!selectedOpt) return;
      const countryCode = this.value;
      const currCode = selectedOpt.dataset.currency || countryCode;
      const countryName = selectedOpt.dataset.country || selectedOpt.text;

      localStorage.setItem('voyo_country', countryCode);
      localStorage.setItem('voyo_currency', currCode);

      window.VoyoCurrency.apply(currCode, true, countryName);
      window.dispatchEvent(new CustomEvent('voyo:currencyChange', { detail: { currency: currCode, country: countryName } }));
    });
  } else if (savedCurrency) {
    window.VoyoCurrency.apply(savedCurrency, false);
  }
});

// ========================================================
// Global Country & Currency Conversion Engine for Voyo
// ========================================================
const VOYO_RATES = {
  USD: { rate: 1.0, symbol: '$', name: 'United States', pos: 'before' },
  INR: { rate: 86.5, symbol: '₹', name: 'India', pos: 'before' },
  EUR: { rate: 0.92, symbol: '€', name: 'Eurozone', pos: 'before' },
  GBP: { rate: 0.78, symbol: '£', name: 'United Kingdom', pos: 'before' },
  AED: { rate: 3.67, symbol: 'AED ', name: 'United Arab Emirates', pos: 'before' },
  CAD: { rate: 1.38, symbol: 'C$', name: 'Canada', pos: 'before' },
  AUD: { rate: 1.55, symbol: 'A$', name: 'Australia', pos: 'before' },
  SGD: { rate: 1.35, symbol: 'S$', name: 'Singapore', pos: 'before' },
  SAR: { rate: 3.75, symbol: 'SAR ', name: 'Saudi Arabia', pos: 'before' },
  JPY: { rate: 152.0, symbol: '¥', name: 'Japan', pos: 'before' },
  AFN: { rate: 70.5, symbol: '؋', name: 'Afghanistan', pos: 'after' },
  ALL: { rate: 92.5, symbol: ' Lek', name: 'Albania', pos: 'after' },
  AMD: { rate: 387.0, symbol: '֏', name: 'Armenia', pos: 'after' },
  ARS: { rate: 980.0, symbol: 'ARS $', name: 'Argentina', pos: 'before' },
  AZN: { rate: 1.70, symbol: '₼', name: 'Azerbaijan', pos: 'before' },
  BAM: { rate: 1.80, symbol: ' KM', name: 'Bosnia & Herzegovina', pos: 'after' },
  BDT: { rate: 120.0, symbol: '৳', name: 'Bangladesh', pos: 'before' },
  BGN: { rate: 1.80, symbol: ' лв', name: 'Bulgaria', pos: 'after' },
  BHD: { rate: 0.38, symbol: 'BD ', name: 'Bahrain', pos: 'before' },
  BND: { rate: 1.35, symbol: 'B$', name: 'Brunei', pos: 'before' },
  BOB: { rate: 6.90, symbol: 'Bs ', name: 'Bolivia', pos: 'before' },
  BRL: { rate: 5.65, symbol: 'R$ ', name: 'Brazil', pos: 'before' },
  BSD: { rate: 1.0, symbol: 'B$', name: 'Bahamas', pos: 'before' },
  BBD: { rate: 2.0, symbol: 'Bds$', name: 'Barbados', pos: 'before' },
  BTN: { rate: 86.5, symbol: 'Nu. ', name: 'Bhutan', pos: 'before' },
  CHF: { rate: 0.88, symbol: 'CHF ', name: 'Switzerland', pos: 'before' },
  CLP: { rate: 940.0, symbol: 'CLP $', name: 'Chile', pos: 'before' },
  CNY: { rate: 7.25, symbol: '¥', name: 'China', pos: 'before' },
  COP: { rate: 4200.0, symbol: 'COL $', name: 'Colombia', pos: 'before' },
  CRC: { rate: 515.0, symbol: '₡', name: 'Costa Rica', pos: 'before' },
  CZK: { rate: 23.2, symbol: ' Kč', name: 'Czech Republic', pos: 'after' },
  DKK: { rate: 6.85, symbol: ' kr', name: 'Denmark', pos: 'after' },
  DOP: { rate: 59.8, symbol: 'RD$ ', name: 'Dominican Republic', pos: 'before' },
  DZD: { rate: 134.0, symbol: ' DA', name: 'Algeria', pos: 'after' },
  EGP: { rate: 49.0, symbol: 'E£ ', name: 'Egypt', pos: 'before' },
  ETB: { rate: 120.0, symbol: 'Br ', name: 'Ethiopia', pos: 'before' },
  FJD: { rate: 2.25, symbol: 'FJ$', name: 'Fiji', pos: 'before' },
  GEL: { rate: 2.75, symbol: '₾', name: 'Georgia', pos: 'before' },
  GHS: { rate: 15.5, symbol: 'GH₵ ', name: 'Ghana', pos: 'before' },
  GTQ: { rate: 7.75, symbol: 'Q ', name: 'Guatemala', pos: 'before' },
  HKD: { rate: 7.78, symbol: 'HK$', name: 'Hong Kong', pos: 'before' },
  HNL: { rate: 24.8, symbol: 'L ', name: 'Honduras', pos: 'before' },
  HUF: { rate: 368.0, symbol: ' Ft', name: 'Hungary', pos: 'after' },
  IDR: { rate: 16200.0, symbol: 'Rp ', name: 'Indonesia', pos: 'before' },
  ILS: { rate: 3.65, symbol: '₪', name: 'Israel', pos: 'before' },
  ISK: { rate: 137.0, symbol: ' kr', name: 'Iceland', pos: 'after' },
  JMD: { rate: 157.0, symbol: 'J$ ', name: 'Jamaica', pos: 'before' },
  JOD: { rate: 0.71, symbol: ' JD', name: 'Jordan', pos: 'after' },
  KES: { rate: 129.0, symbol: 'KSh ', name: 'Kenya', pos: 'before' },
  KGS: { rate: 86.0, symbol: ' сом', name: 'Kyrgyzstan', pos: 'after' },
  KHR: { rate: 4050.0, symbol: '៛', name: 'Cambodia', pos: 'after' },
  KRW: { rate: 1380.0, symbol: '₩', name: 'South Korea', pos: 'before' },
  KWD: { rate: 0.31, symbol: 'KD ', name: 'Kuwait', pos: 'before' },
  KZT: { rate: 490.0, symbol: '₸', name: 'Kazakhstan', pos: 'after' },
  LAK: { rate: 22000.0, symbol: '₭', name: 'Laos', pos: 'after' },
  LKR: { rate: 295.0, symbol: 'Rs ', name: 'Sri Lanka', pos: 'before' },
  MAD: { rate: 9.85, symbol: ' MAD', name: 'Morocco', pos: 'after' },
  MKD: { rate: 56.5, symbol: ' den', name: 'North Macedonia', pos: 'after' },
  MMK: { rate: 2100.0, symbol: 'K ', name: 'Myanmar', pos: 'before' },
  MNT: { rate: 3420.0, symbol: '₮', name: 'Mongolia', pos: 'after' },
  MOP: { rate: 8.0, symbol: 'MOP$ ', name: 'Macao', pos: 'before' },
  MUR: { rate: 46.5, symbol: 'Rs ', name: 'Mauritius', pos: 'before' },
  MVR: { rate: 15.4, symbol: 'Rf ', name: 'Maldives', pos: 'before' },
  MXN: { rate: 20.0, symbol: 'Mex$ ', name: 'Mexico', pos: 'before' },
  MYR: { rate: 4.45, symbol: 'RM ', name: 'Malaysia', pos: 'before' },
  NAD: { rate: 18.2, symbol: 'N$ ', name: 'Namibia', pos: 'before' },
  NGN: { rate: 1650.0, symbol: '₦', name: 'Nigeria', pos: 'before' },
  NOK: { rate: 10.8, symbol: ' kr', name: 'Norway', pos: 'after' },
  NPR: { rate: 138.4, symbol: 'Rs ', name: 'Nepal', pos: 'before' },
  NZD: { rate: 1.68, symbol: 'NZ$', name: 'New Zealand', pos: 'before' },
  OMR: { rate: 0.38, symbol: 'RO ', name: 'Oman', pos: 'before' },
  PAB: { rate: 1.0, symbol: 'B/. ', name: 'Panama', pos: 'before' },
  PEN: { rate: 3.75, symbol: 'S/ ', name: 'Peru', pos: 'before' },
  PGK: { rate: 3.95, symbol: 'K ', name: 'Papua New Guinea', pos: 'before' },
  PHP: { rate: 58.0, symbol: '₱', name: 'Philippines', pos: 'before' },
  PKR: { rate: 278.0, symbol: 'Rs ', name: 'Pakistan', pos: 'before' },
  PLN: { rate: 3.98, symbol: ' zł', name: 'Poland', pos: 'after' },
  PYG: { rate: 7800.0, symbol: '₲', name: 'Paraguay', pos: 'before' },
  QAR: { rate: 3.64, symbol: 'QR ', name: 'Qatar', pos: 'before' },
  RON: { rate: 4.58, symbol: ' lei', name: 'Romania', pos: 'after' },
  RSD: { rate: 108.0, symbol: ' din.', name: 'Serbia', pos: 'after' },
  RUB: { rate: 96.0, symbol: ' ₽', name: 'Russia', pos: 'after' },
  RWF: { rate: 1360.0, symbol: 'FRw ', name: 'Rwanda', pos: 'before' },
  SCR: { rate: 14.2, symbol: 'SR ', name: 'Seychelles', pos: 'before' },
  SEK: { rate: 10.6, symbol: ' kr', name: 'Sweden', pos: 'after' },
  THB: { rate: 34.5, symbol: '฿', name: 'Thailand', pos: 'before' },
  TJS: { rate: 10.6, symbol: ' ЅМ', name: 'Tajikistan', pos: 'after' },
  TMT: { rate: 3.50, symbol: ' m', name: 'Turkmenistan', pos: 'after' },
  TND: { rate: 3.10, symbol: ' DT', name: 'Tunisia', pos: 'after' },
  TRY: { rate: 34.5, symbol: '₺', name: 'Turkey', pos: 'before' },
  TTD: { rate: 6.80, symbol: 'TT$ ', name: 'Trinidad & Tobago', pos: 'before' },
  TWD: { rate: 32.5, symbol: 'NT$', name: 'Taiwan', pos: 'before' },
  TZS: { rate: 2680.0, symbol: 'TSh ', name: 'Tanzania', pos: 'before' },
  UAH: { rate: 41.2, symbol: '₴', name: 'Ukraine', pos: 'before' },
  UGX: { rate: 3680.0, symbol: 'USh ', name: 'Uganda', pos: 'before' },
  UYU: { rate: 41.5, symbol: '$U ', name: 'Uruguay', pos: 'before' },
  UZS: { rate: 12800.0, symbol: ' so\'m', name: 'Uzbekistan', pos: 'after' },
  VND: { rate: 25400.0, symbol: '₫', name: 'Vietnam', pos: 'after' },
  XOF: { rate: 605.0, symbol: 'CFA ', name: 'West Africa', pos: 'before' },
  ZAR: { rate: 18.2, symbol: 'R ', name: 'South Africa', pos: 'before' },
  ZMW: { rate: 26.5, symbol: 'ZK ', name: 'Zambia', pos: 'before' }
};

window.VoyoCurrency = {
  rates: VOYO_RATES,
  current: 'USD',
  
  format(usdAmount, code) {
    const curr = code || this.current;
    const info = VOYO_RATES[curr] || VOYO_RATES.USD;
    const num = parseFloat(usdAmount);
    if (isNaN(num)) return '$' + usdAmount;
    const converted = Math.round(num * info.rate);
    const formatted = converted.toLocaleString();
    return info.pos === 'after' ? `${formatted}${info.symbol}` : `${info.symbol}${formatted}`;
  },

  initElements() {
    // 1. .price-value
    document.querySelectorAll('.price-value').forEach(el => {
      if (!el.dataset.usdBase) {
        const match = el.textContent.match(/\$([0-9,]+)/);
        if (match) {
          el.dataset.usdBase = match[1].replace(/,/g, '');
          const span = el.querySelector('span');
          el.dataset.suffix = span ? span.outerHTML : '';
        }
      }
    });

    // 2. Strike-through original prices
    document.querySelectorAll('[style*="line-through"]').forEach(el => {
      if (!el.dataset.usdBase) {
        const match = el.textContent.match(/\$([0-9,]+)/);
        if (match) el.dataset.usdBase = match[1].replace(/,/g, '');
      }
    });

    // 3. Isolated price spans/strongs like $260, $899
    document.querySelectorAll('strong, span, h4, div').forEach(el => {
      if (!el.dataset.usdBase && el.children.length === 0) {
        const text = el.textContent.trim();
        const match = text.match(/^\$([0-9,]+)$/);
        if (match) el.dataset.usdBase = match[1].replace(/,/g, '');
      }
    });

    // 4. Select dropdown options like ($240/night) or ($899)
    document.querySelectorAll('option').forEach(opt => {
      if (!opt.dataset.origText && opt.textContent.includes('$') && opt.parentElement.id !== 'currencySelect') {
        opt.dataset.origText = opt.textContent;
      }
    });

    // 5. Buttons or links with ($XXX)
    document.querySelectorAll('button, a, label').forEach(el => {
      if (!el.dataset.origText && el.textContent.includes('($') && el.children.length === 0) {
        el.dataset.origText = el.textContent;
      }
    });

    // 6. Checkout breakdown rows
    document.querySelectorAll('.price-breakdown-row span:last-child').forEach(el => {
      if (!el.dataset.usdBase) {
        const match = el.textContent.match(/\$([0-9,]+)/);
        if (match) el.dataset.usdBase = match[1].replace(/,/g, '');
      }
    });
  },

  apply(currCode, showNotice = false) {
    this.current = currCode;
    this.initElements();
    const info = VOYO_RATES[currCode] || VOYO_RATES.USD;

    // Update .price-value
    document.querySelectorAll('.price-value[data-usd-base]').forEach(el => {
      const formatted = this.format(el.dataset.usdBase, currCode);
      const suffix = el.dataset.suffix || '';
      el.innerHTML = formatted + (suffix ? ' ' + suffix : '');
    });

    // Update line-through
    document.querySelectorAll('[style*="line-through"][data-usd-base]').forEach(el => {
      el.textContent = this.format(el.dataset.usdBase, currCode);
    });

    // Update other elements with data-usd-base
    document.querySelectorAll('[data-usd-base]').forEach(el => {
      if (!el.classList.contains('price-value') && !el.matches('[style*="line-through"]')) {
        el.textContent = this.format(el.dataset.usdBase, currCode);
      }
    });

    // Update options
    document.querySelectorAll('option[data-orig-text]').forEach(opt => {
      opt.textContent = opt.dataset.origText.replace(/\$([0-9,]+)/g, (m, p1) => {
        return this.format(p1.replace(/,/g, ''), currCode);
      });
    });

    // Update buttons/labels
    document.querySelectorAll('[data-orig-text]').forEach(el => {
      if (el.tagName !== 'OPTION') {
        el.textContent = el.dataset.origText.replace(/\$([0-9,]+)/g, (m, p1) => {
          return this.format(p1.replace(/,/g, ''), currCode);
        });
      }
    });

    // Sync select element if needed
    const select = document.getElementById('currencySelect');
    if (select) {
      const currentOpt = select.options[select.selectedIndex];
      const optCurr = currentOpt ? (currentOpt.dataset.currency || currentOpt.value) : '';
      if (optCurr !== currCode) {
        const matchingOpt = select.querySelector(`option[data-currency="${currCode}"]`) ||
                            select.querySelector(`option[value="${currCode}"]`);
        if (matchingOpt) {
          select.value = matchingOpt.value;
        }
      }
    }

    if (showNotice) {
      const displayCountry = countryName || info.name;
      showToast(`Updated to ${displayCountry} • ${currCode} (${info.symbol.trim()})`);
    }
  }
};

// Toast notification helper
function showToast(message, type = 'success') {
  let toast = document.getElementById('traveleaseToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'traveleaseToast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0a192f;
      color: #fff;
      padding: 14px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25);
      border-left: 4px solid #0d9488;
      z-index: 99999;
      font-size: 0.9375rem;
      font-weight: 600;
      transition: all 0.3s ease;
      transform: translateY(100px);
      opacity: 0;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';

  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
  }, 4000);
}

// 8. Scenic Hero Background Slider Auto-rotation
document.addEventListener('DOMContentLoaded', function () {
  const heroSlides = document.querySelectorAll('.hero-slide');
  const heroDots = document.querySelectorAll('.hero-dot');
  const heroTitle = document.getElementById('heroSlideTitle');
  const heroTag = document.getElementById('heroSlideTag');

  if (heroSlides.length > 0) {
    let currentSlide = 0;
    let slideTimer = null;

    function goToSlide(index) {
      heroSlides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
      });
      heroDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });
      if (heroTitle && heroSlides[index]) {
        heroTitle.textContent = heroSlides[index].getAttribute('data-name') || '';
      }
      if (heroTag && heroSlides[index]) {
        const tag = heroSlides[index].getAttribute('data-tag') || '';
        heroTag.textContent = tag ? '• ' + tag : '';
      }
      currentSlide = index;
    }

    function nextSlide() {
      const nextIndex = (currentSlide + 1) % heroSlides.length;
      goToSlide(nextIndex);
    }

    function startAutoSlide() {
      stopAutoSlide();
      slideTimer = setInterval(nextSlide, 5000);
    }

    function stopAutoSlide() {
      if (slideTimer) clearInterval(slideTimer);
    }

    heroDots.forEach((dot, i) => {
      dot.addEventListener('click', function () {
        goToSlide(i);
        startAutoSlide();
      });
    });

    const heroSection = document.getElementById('heroSlider');
    if (heroSection) {
      heroSection.addEventListener('mouseenter', stopAutoSlide);
      heroSection.addEventListener('mouseleave', startAutoSlide);
    }

    startAutoSlide();
  }
});

