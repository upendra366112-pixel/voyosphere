/**
 * TravelEase Flight Search & Integration Engine
 */

document.addEventListener('DOMContentLoaded', function () {
  const flightFilterForm = document.getElementById('flightFilterForm');
  const flightCards = document.querySelectorAll('.flight-card');

  // Flight filter handler
  if (flightFilterForm && flightCards.length > 0) {
    const airlineCheckboxes = flightFilterForm.querySelectorAll('input[name="airline"]');
    const stopsCheckboxes = flightFilterForm.querySelectorAll('input[name="stops"]');
    const priceSlider = document.getElementById('priceRangeSlider');
    const priceDisplay = document.getElementById('priceRangeValue');

    function applyFilters() {
      const selectedAirlines = Array.from(airlineCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
      const selectedStops = Array.from(stopsCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
      const maxPrice = priceSlider ? parseInt(priceSlider.value) : 99999;

      if (priceDisplay && priceSlider) {
        priceDisplay.textContent = (window.VoyoCurrency && typeof window.VoyoCurrency.format === 'function')
          ? window.VoyoCurrency.format(priceSlider.value)
          : '$' + priceSlider.value;
      }

      flightCards.forEach(card => {
        const airline = card.getAttribute('data-airline');
        const stops = card.getAttribute('data-stops');
        const price = parseInt(card.getAttribute('data-price') || '0');

        const matchAirline = selectedAirlines.length === 0 || selectedAirlines.includes(airline);
        const matchStops = selectedStops.length === 0 || selectedStops.includes(stops);
        const matchPrice = price <= maxPrice;

        if (matchAirline && matchStops && matchPrice) {
          card.style.display = 'grid';
        } else {
          card.style.display = 'none';
        }
      });
    }

    airlineCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));
    stopsCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));
    if (priceSlider) priceSlider.addEventListener('input', applyFilters);
    window.addEventListener('voyo:currencyChange', applyFilters);
  }

  // Flight Details Modal Trigger
  const detailBtns = document.querySelectorAll('.view-flight-details-btn');
  const flightModal = document.getElementById('flightDetailsModal');
  if (detailBtns && flightModal) {
    detailBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        const airline = this.getAttribute('data-airline');
        const number = this.getAttribute('data-number');
        const from = this.getAttribute('data-from');
        const to = this.getAttribute('data-to');
        const fare = this.getAttribute('data-price');
        const duration = this.getAttribute('data-duration');

        document.getElementById('modalAirlineName').textContent = airline + ' (' + number + ')';
        document.getElementById('modalRoute').textContent = from + ' ➔ ' + to;
        const fareFormatted = (window.VoyoCurrency && typeof window.VoyoCurrency.format === 'function')
          ? window.VoyoCurrency.format(fare)
          : '$' + fare;
        document.getElementById('modalFare').textContent = fareFormatted;
        document.getElementById('modalDuration').textContent = duration;

        flightModal.classList.add('active');
      });
    });

    const closeBtn = flightModal.querySelector('.modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => flightModal.classList.remove('active'));
    }
  }
});
