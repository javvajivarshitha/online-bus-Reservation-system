/**
 * ============================================================
 * SwiftBus — Booking Module  (js/booking.js)
 * Seat map, smart recommendations, group booking optimization,
 * travel preferences, dynamic pricing, booking + redirect to payment
 * ============================================================
 */
(function () {
  'use strict';

  const SESSION_KEY = 'swiftbus_user';
  const userStr = localStorage.getItem(SESSION_KEY);
  if (!userStr) { window.location.href = 'login.html'; return; }

  const user = JSON.parse(userStr);

  // ---- Pre-fill user info ----
  document.getElementById('welcomeUser').textContent = `Hello, ${user.fullName}`;
  document.getElementById('bName').value   = user.fullName;
  document.getElementById('bMobile').value = user.mobile;
  document.getElementById('bEmail').value  = user.email;

  // ---- Read URL params from search page ----
  const params = new URLSearchParams(window.location.search);
  const busIdVal    = params.get('bus')  || '';
  const srcVal      = params.get('src')  || '';
  const destVal     = params.get('dest') || '';
  const dateVal     = params.get('date') || '';
  const timeVal     = params.get('time') || '';
  const typeVal     = params.get('type') || '';
  const priceVal    = params.get('price')|| '0';
  const basePriceVal= params.get('basePrice') || priceVal;
  const busNameVal  = params.get('name') || '';
  const prefsVal    = params.get('prefs') || '';

  if (!busIdVal) {
    window.location.href = 'search.html';
    return;
  }

  document.getElementById('busId').value        = busIdVal;
  document.getElementById('busType').value       = typeVal;
  document.getElementById('source').value        = srcVal;
  document.getElementById('destination').value   = destVal;
  document.getElementById('travelDate').value    = dateVal;
  document.getElementById('depTime').value       = timeVal;
  document.getElementById('pricePerSeat').value  = `₹${priceVal}`;

  // Dynamic pricing info
  const currentPrice = parseInt(priceVal);
  const basePrice    = parseInt(basePriceVal);
  if (currentPrice > basePrice) {
    const dpInfo = document.getElementById('dynamicPriceInfo');
    const dpText = document.getElementById('dynamicPriceText');
    dpInfo.style.display = 'flex';
    const surgePercent = Math.round(((currentPrice - basePrice) / basePrice) * 100);
    dpText.innerHTML = `<strong>Dynamic Pricing Active:</strong> Base price ₹${basePrice} → Current ₹${currentPrice} (+${surgePercent}% due to high demand)`;
  }

  // Travel preferences display
  const prefsArr = prefsVal ? prefsVal.split(',') : [];
  const prefsContainer = document.getElementById('selectedPrefs');
  if (prefsArr.length > 0 && prefsArr[0]) {
    const prefLabels = { window:'🪟 Window Seat', silent:'🔇 Silent Journey', charging:'🔌 Charging Point', front:'⬆️ Front Seats' };
    prefsContainer.innerHTML = `
      <label style="font-size:0.78rem; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:0.6px; margin-bottom:0.4rem; display:block;">Your Preferences</label>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
        ${prefsArr.map(p => `<span style="padding:0.35rem 0.75rem; border-radius:8px; font-size:0.8rem; font-weight:600; background:rgba(99,102,241,0.12); border:1px solid rgba(99,102,241,0.3); color:#A5B4FC;">${prefLabels[p] || p}</span>`).join('')}
      </div>
    `;
  }

  // ============================================
  //  SEAT MAP
  // ============================================
  const seatMap     = document.getElementById('seatMap');
  const seatsInput  = document.getElementById('seatsList');
  const seatCountEl = document.getElementById('seatCount');
  const confirmBtn  = document.getElementById('confirmBtn');
  const suggestBtn  = document.getElementById('suggestBtn');
  const recBox      = document.getElementById('recommendBox');
  const recText     = document.getElementById('recText');
  const totalEl     = document.getElementById('totalAmount');

  const ROWS    = 10;
  const MAX_SEL = 6;
  let selected  = [];

  let seatData = [];

  function buildSeatMap() {
    seatMap.innerHTML = '';
    seatData = [];
    let letter = 'A';

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < 5; c++) {
        if (c === 2) {
          const spacer = document.createElement('div');
          spacer.className = 'aisle';
          seatMap.appendChild(spacer);
          continue;
        }
        const colNum = c < 2 ? c + 1 : c - 1;
        const seatNo = `${letter}${colNum}`;
        const el = document.createElement('div');
        el.className = 'seat';
        el.textContent = seatNo;
        el.dataset.seat = seatNo;
        el.dataset.row = r;
        el.dataset.col = c < 2 ? c : c - 1;
        // Window seats are columns 0 and 3 (leftmost and rightmost)
        const isWindow = (c === 0 || c === 4);
        el.dataset.window = isWindow ? '1' : '0';

        // Random status: 55% available, 18% booked, 14% female, 13% male
        const rand = Math.random();
        let status;
        if (rand < 0.55)      { status = 'available'; }
        else if (rand < 0.73) { status = 'booked'; }
        else if (rand < 0.87) { status = 'female'; }
        else                  { status = 'male'; }

        el.classList.add(status);
        el.addEventListener('click', () => onSeatClick(el));
        seatMap.appendChild(el);
        seatData.push({ no: seatNo, el, status, row: r, col: c < 2 ? c : c - 1, isWindow });
      }
      letter = String.fromCharCode(letter.charCodeAt(0) + 1);
    }
  }

  function onSeatClick(el) {
    if (!el.classList.contains('available') && !el.classList.contains('selected') && !el.classList.contains('recommended')) return;

    const seatNo = el.dataset.seat;

    if (el.classList.contains('selected')) {
      el.classList.remove('selected');
      el.classList.add('available');
      selected = selected.filter(s => s !== seatNo);
    } else {
      if (selected.length >= MAX_SEL) { alert(`Max ${MAX_SEL} seats.`); return; }
      el.classList.remove('available', 'recommended');
      el.classList.add('selected');
      selected.push(seatNo);
    }
    selected.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    refreshUI();
  }

  function refreshUI() {
    seatsInput.value = selected.join(', ');
    seatCountEl.textContent = selected.length;
    confirmBtn.disabled = selected.length === 0;
    totalEl.textContent = `₹${selected.length * currentPrice}`;
  }

  // ============================================
  //  SMART SEAT RECOMMENDATION (Enhanced)
  // ============================================
  suggestBtn.addEventListener('click', function () {
    // Clear previous recommendations
    seatData.forEach(s => s.el.classList.remove('recommended'));

    const availableSeats = seatData.filter(s => s.status === 'available' && !s.el.classList.contains('selected'));
    if (availableSeats.length === 0) {
      recBox.classList.add('show');
      recText.innerHTML = 'Sorry, no available seats to recommend.';
      return;
    }

    let recommended = [];
    const gender = user.gender;
    const wantsWindow = prefsArr.includes('window');
    const wantsFront = prefsArr.includes('front');

    // Strategy 1: For female passengers, find seats near other female passengers (safety)
    if (gender === 'Female') {
      const femaleRows = [...new Set(seatData.filter(s => s.status === 'female').map(s => s.row))];
      recommended = availableSeats.filter(s => femaleRows.includes(s.row));

      if (recommended.length < 2) {
        const adjRows = new Set();
        femaleRows.forEach(r => { adjRows.add(r - 1); adjRows.add(r); adjRows.add(r + 1); });
        recommended = availableSeats.filter(s => adjRows.has(s.row));
      }
    }

    // Strategy 2: Window preference
    if (wantsWindow) {
      const windowSeats = availableSeats.filter(s => s.isWindow);
      if (windowSeats.length > 0) {
        if (recommended.length > 0) {
          recommended = recommended.filter(s => s.isWindow);
          if (recommended.length === 0) recommended = windowSeats;
        } else {
          recommended = windowSeats;
        }
      }
    }

    // Strategy 3: Front seats preference
    if (wantsFront) {
      const frontSeats = availableSeats.filter(s => s.row <= 2);
      if (frontSeats.length > 0) {
        if (recommended.length > 0) {
          const frontRec = recommended.filter(s => s.row <= 2);
          if (frontRec.length > 0) recommended = frontRec;
        } else {
          recommended = frontSeats;
        }
      }
    }

    // Strategy 4: Group Booking Optimization — find adjacent seats
    if (recommended.length < 2) {
      for (let r = 0; r < ROWS; r++) {
        const rowAvail = availableSeats.filter(s => s.row === r).sort((a, b) => a.col - b.col);
        if (rowAvail.length >= 2) {
          recommended = rowAvail;
          break;
        }
      }
    }

    // Fallback: just pick first available seats
    if (recommended.length === 0) {
      recommended = availableSeats.slice(0, 3);
    }

    // Limit to max 4 recommendations
    recommended = recommended.slice(0, 4);

    // Highlight recommended seats
    recommended.forEach(s => s.el.classList.add('recommended'));

    // Build recommendation message
    const recSeats = recommended.map(s => s.no).join(', ');
    let message = '';
    const reasons = [];
    if (gender === 'Female') reasons.push('near other female passengers for safety');
    if (wantsWindow) reasons.push('window seats as preferred');
    if (wantsFront) reasons.push('front section as preferred');
    if (recommended.length >= 2 && recommended[0].row === recommended[1].row) reasons.push('adjacent seats for group comfort');

    if (reasons.length > 0) {
      message = `<strong>Recommended for you:</strong> Seats <strong>${recSeats}</strong> — ${reasons.join(', ')}.`;
    } else {
      message = `<strong>Recommended seats:</strong> <strong>${recSeats}</strong> — best available seats in a less crowded area.`;
    }

    recBox.classList.add('show');
    recText.innerHTML = message;
  });

  buildSeatMap();

  // ============================================
  //  FORM SUBMISSION → PAYMENT
  // ============================================
  document.getElementById('bookingForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const booking = {
      id:           'SWB' + Math.floor(100000 + Math.random() * 900000),
      fullName:     user.fullName,
      mobile:       user.mobile,
      email:        user.email,
      gender:       user.gender,
      busNumber:    busIdVal,
      busName:      busNameVal,
      busType:      typeVal,
      source:       srcVal,
      destination:  destVal,
      time:         timeVal,
      date:         dateVal,
      seats:        selected.join(', '),
      seatCount:    selected.length,
      pricePerSeat: currentPrice,
      basePrice:    basePrice,
      totalPrice:   selected.length * currentPrice,
      preferences:  prefsArr,
      bookedAt:     new Date().toISOString()
    };

    localStorage.setItem('swiftbus_booking', JSON.stringify(booking));
    window.location.href = 'payment.html';
  });

})();
