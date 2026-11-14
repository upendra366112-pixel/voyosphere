/**
 * TravelEase Booking & Checkout Engine
 */

document.addEventListener('DOMContentLoaded', function () {
  // 1. Payment Method Tabs in Checkout
  const paymentMethods = document.querySelectorAll('.payment-method-item');
  const paymentPanels = document.querySelectorAll('.payment-tab-content');

  paymentMethods.forEach(method => {
    method.addEventListener('click', function () {
      paymentMethods.forEach(m => m.classList.remove('active'));
      this.classList.add('active');

      const targetMethod = this.getAttribute('data-method');
      paymentPanels.forEach(p => p.style.display = 'none');
      const activePanel = document.getElementById(targetMethod + '-panel');
      if (activePanel) activePanel.style.display = 'block';

      // Update hidden input
      const gatewayInput = document.getElementById('selectedPaymentGateway');
      if (gatewayInput) gatewayInput.value = targetMethod;
    });
  });

  // 2. Promo Code Application in Checkout
  const applyPromoBtn = document.getElementById('applyCheckoutPromoBtn');
  const promoInput = document.getElementById('checkoutPromoCode');
  if (applyPromoBtn && promoInput) {
    applyPromoBtn.addEventListener('click', function () {
      const code = promoInput.value.trim().toUpperCase();
      if (code === 'SUMMER35' || code === 'SAVE15') {
        const discountRow = document.getElementById('promoDiscountRow');
        const discountVal = document.getElementById('promoDiscountValue');
        const totalVal = document.getElementById('orderTotalValue');
        const basePrice = parseFloat(document.getElementById('orderBasePrice')?.value || '500');

        const discountAmount = Math.round(basePrice * 0.15);
        if (discountRow) discountRow.style.display = 'flex';
        if (discountVal) discountVal.textContent = '-$' + discountAmount;

        // Recalculate Total
        const taxes = Math.round(basePrice * 0.12);
        const fee = 25;
        const newTotal = (basePrice + taxes + fee) - discountAmount;
        if (totalVal) totalVal.textContent = '$' + newTotal;

        showToast('Promo code ' + code + ' applied successfully! ($' + discountAmount + ' saved)');
      } else {
        showToast('Invalid or expired promo code', 'error');
      }
    });
  }

  // 3. Checkout Form Submission & Payment Gateway Processing
  const checkoutForm = document.getElementById('travelEaseCheckoutForm');
  const paymentModal = document.getElementById('paymentProcessingModal');

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Form validation
      const firstName = document.getElementById('travelerFirstName')?.value?.trim();
      const lastName = document.getElementById('travelerLastName')?.value?.trim();
      const travelerName = (firstName && lastName) ? `${firstName} ${lastName}` : (document.getElementById('travelerName')?.value?.trim() || firstName);
      const travelerEmail = document.getElementById('travelerEmail')?.value?.trim();
      const termsChecked = document.getElementById('acceptTermsCheckbox')?.checked;

      if (!travelerName || !travelerEmail) {
        showToast('Please fill in all traveler contact details.', 'error');
        return;
      }

      if (!termsChecked) {
        showToast('Please agree to the booking and cancellation policies.', 'error');
        return;
      }

      // Check card number for test failure simulation (ends in 0002)
      const cardNumber = document.getElementById('cardNumberInput')?.value || '';
      const willFail = cardNumber.endsWith('0002');

      // Open processing modal
      if (paymentModal) {
        paymentModal.classList.add('active');
        document.getElementById('paymentStateProcessing').style.display = 'block';
        document.getElementById('paymentStateSuccess').style.display = 'none';
        document.getElementById('paymentStateFailed').style.display = 'none';

        // Simulate 2.5s secure server verification
        setTimeout(() => {
          document.getElementById('paymentStateProcessing').style.display = 'none';

          if (willFail) {
            document.getElementById('paymentStateFailed').style.display = 'block';
          } else {
            document.getElementById('paymentStateSuccess').style.display = 'block';

            const bookingData = new FormData(checkoutForm);
            const fallbackCode = 'TE-' + Math.floor(100000 + Math.random() * 900000);
            const codeSpan = document.getElementById('confirmedBookingCode');
            if (codeSpan) codeSpan.textContent = fallbackCode;

            // Save demo booking to localStorage
            try {
              const newBooking = {
                code: fallbackCode,
                item_type: bookingData.get('item_type') || 'hotel',
                item_title: bookingData.get('item_title') || 'Hotel Stay',
                guest_name: travelerName,
                email: travelerEmail,
                total_amount: bookingData.get('total_amount') || '300',
                payment_gateway: bookingData.get('payment_gateway') || 'card',
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                status: 'confirmed'
              };
              const existing = JSON.parse(localStorage.getItem('travelease_demo_bookings') || '[]');
              existing.unshift(newBooking);
              localStorage.setItem('travelease_demo_bookings', JSON.stringify(existing));
            } catch(e) {}

            // Submit booking server-side via AJAX if endpoint available
            bookingData.append('action', 'travelease_create_booking');
            if (window.travelEaseData && window.travelEaseData.nonce) {
              bookingData.append('nonce', window.travelEaseData.nonce);
            }

            fetch(window.travelEaseData ? window.travelEaseData.ajaxUrl : '/wp-admin/admin-ajax.php', {
              method: 'POST',
              body: bookingData
            })
            .then(res => res.json())
            .then(data => {
              if (data.success && data.data && data.data.booking_code) {
                if (codeSpan) codeSpan.textContent = data.data.booking_code;
              }
            })
            .catch(() => {});
          }
        }, 2500);
      }
    });
  }

  // 4. Modal Close
  const closePaymentModalBtn = document.getElementById('closePaymentModalBtn');
  if (closePaymentModalBtn && paymentModal) {
    closePaymentModalBtn.addEventListener('click', function () {
      paymentModal.classList.remove('active');
      window.location.href = '/my-account/';
    });
  }

  const retryPaymentBtn = document.getElementById('retryPaymentBtn');
  if (retryPaymentBtn && paymentModal) {
    retryPaymentBtn.addEventListener('click', function () {
      paymentModal.classList.remove('active');
    });
  }

  // 5. Printable Invoice Trigger
  const printInvoiceBtn = document.getElementById('printInvoiceBtn');
  if (printInvoiceBtn) {
    printInvoiceBtn.addEventListener('click', function () {
      window.print();
    });
  }

  // 6. Cancellation Request Modal
  const cancelModal = document.getElementById('cancellationModal');
  const openCancelBtns = document.querySelectorAll('.open-cancel-request-btn');
  if (openCancelBtns && cancelModal) {
    openCancelBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        const bookingId = this.getAttribute('data-booking-id');
        const bookingCode = this.getAttribute('data-booking-code');
        document.getElementById('cancelBookingCodeText').textContent = bookingCode;
        document.getElementById('cancelBookingIdInput').value = bookingId;
        cancelModal.classList.add('active');
      });
    });

    const closeCancelBtn = cancelModal.querySelector('.modal-close-btn');
    if (closeCancelBtn) {
      closeCancelBtn.addEventListener('click', () => cancelModal.classList.remove('active'));
    }

    const cancelForm = document.getElementById('cancellationRequestForm');
    if (cancelForm) {
      cancelForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const reason = document.getElementById('cancelReasonSelect').value;
        const bookingId = document.getElementById('cancelBookingIdInput').value;

        // Update status in localStorage if present
        try {
          const existing = JSON.parse(localStorage.getItem('travelease_demo_bookings') || '[]');
          const updated = existing.map(item => {
            if (item.code === bookingId) {
              return { ...item, status: 'cancelled' };
            }
            return item;
          });
          localStorage.setItem('travelease_demo_bookings', JSON.stringify(updated));
        } catch(e) {}

        const formData = new FormData();
        formData.append('action', 'travelease_request_cancellation');
        formData.append('booking_id', bookingId);
        formData.append('reason', reason);
        if (window.travelEaseData && window.travelEaseData.nonce) {
          formData.append('nonce', window.travelEaseData.nonce);
        }

        fetch(window.travelEaseData ? window.travelEaseData.ajaxUrl : '/wp-admin/admin-ajax.php', {
          method: 'POST',
          body: formData
        })
        .then(res => res.json())
        .then(res => {
          showToast('Cancellation request submitted successfully. Status updated to Cancelled.');
          cancelModal.classList.remove('active');
          setTimeout(() => window.location.reload(), 1500);
        })
        .catch(() => {
          showToast('Cancellation request submitted.');
          cancelModal.classList.remove('active');
          setTimeout(() => window.location.reload(), 1500);
        });
      });
    }
  }
});
