/**
 * ============================================================
 * SwiftBus — Bus Search Module  (js/search.js)
 * Simulated bus database, dynamic pricing, search & results
 * ============================================================
 */
(function () {
  'use strict';

  // ---- Simulated Bus Database ----
  const BUS_DB = [
    { id:'SB-101', name:'SwiftBus Express',     type:'AC Seater',      src:'Hyderabad', dest:'Bangalore', dep:'06:00 AM', arr:'12:30 PM', duration:'6h 30m', price:850,  seats:40, filled:28 },
    { id:'SB-102', name:'SwiftBus Deluxe',      type:'AC Sleeper',     src:'Hyderabad', dest:'Bangalore', dep:'09:00 PM', arr:'05:30 AM', duration:'8h 30m', price:1200, seats:30, filled:22 },
    { id:'SB-205', name:'SwiftBus Royal',       type:'AC Seater',      src:'Bangalore', dest:'Hyderabad', dep:'10:30 AM', arr:'05:00 PM', duration:'6h 30m', price:900,  seats:40, filled:15 },
    { id:'SB-206', name:'SwiftBus Night Rider', type:'Non-AC Sleeper', src:'Bangalore', dest:'Hyderabad', dep:'10:00 PM', arr:'06:00 AM', duration:'8h',     price:650,  seats:36, filled:30 },
    { id:'SB-308', name:'SwiftBus SuperJet',    type:'AC Sleeper',     src:'Chennai',   dest:'Mumbai',    dep:'08:15 PM', arr:'12:30 PM', duration:'16h 15m',price:1800, seats:30, filled:25 },
    { id:'SB-309', name:'SwiftBus Economy',     type:'Non-AC Seater',  src:'Chennai',   dest:'Mumbai',    dep:'06:00 AM', arr:'11:00 PM', duration:'17h',    price:1100, seats:45, filled:10 },
    { id:'SB-412', name:'SwiftBus Premium',     type:'AC Sleeper',     src:'Mumbai',    dest:'Delhi',     dep:'02:00 PM', arr:'08:00 AM', duration:'18h',    price:2200, seats:30, filled:27 },
    { id:'SB-413', name:'SwiftBus Standard',    type:'Non-AC Seater',  src:'Mumbai',    dest:'Delhi',     dep:'04:00 PM', arr:'12:00 PM', duration:'20h',    price:1400, seats:50, filled:20 },
    { id:'SB-510', name:'SwiftBus Morning Star',type:'AC Seater',      src:'Delhi',     dest:'Jaipur',    dep:'07:45 AM', arr:'01:15 PM', duration:'5h 30m', price:700,  seats:40, filled:35 },
    { id:'SB-511', name:'SwiftBus Pink City',   type:'Non-AC Seater',  src:'Delhi',     dest:'Jaipur',    dep:'06:00 AM', arr:'12:00 PM', duration:'6h',     price:450,  seats:50, filled:12 },
    { id:'SB-612', name:'SwiftBus Coastal',     type:'AC Seater',      src:'Mumbai',    dest:'Pune',      dep:'08:00 AM', arr:'11:30 AM', duration:'3h 30m', price:500,  seats:40, filled:18 },
    { id:'SB-613', name:'SwiftBus Shuttle',     type:'Non-AC Seater',  src:'Pune',      dest:'Mumbai',    dep:'07:00 AM', arr:'10:30 AM', duration:'3h 30m', price:350,  seats:45, filled:38 },
    { id:'SB-714', name:'SwiftBus Metro',       type:'AC Sleeper',     src:'Kolkata',   dest:'Chennai',   dep:'04:00 PM', arr:'02:00 PM', duration:'22h',    price:2500, seats:30, filled:8 },
    { id:'SB-715', name:'SwiftBus Connect',     type:'AC Seater',      src:'Hyderabad', dest:'Chennai',   dep:'11:00 AM', arr:'07:30 PM', duration:'8h 30m', price:950,  seats:40, filled:33 },
    { id:'SB-816', name:'SwiftBus Rapid',       type:'AC Seater',      src:'Jaipur',    dest:'Delhi',     dep:'02:00 PM', arr:'07:30 PM', duration:'5h 30m', price:680,  seats:40, filled:20 },
    { id:'SB-817', name:'SwiftBus Link',        type:'Non-AC Seater',  src:'Chennai',   dest:'Bangalore', dep:'06:30 AM', arr:'12:30 PM', duration:'6h',     price:550,  seats:45, filled:40 },
  ];

  // Make BUS_DB accessible globally
  window.SWIFTBUS_DB = BUS_DB;

  // ---- Dynamic Pricing Algorithm ----
  function getDynamicPrice(bus) {
    const fillPct = bus.filled / bus.seats;
    let multiplier = 1;
    if (fillPct > 0.9)      multiplier = 1.50;   // 50% surge
    else if (fillPct > 0.75) multiplier = 1.30;  // 30% surge
    else if (fillPct > 0.6)  multiplier = 1.15;  // 15% surge
    else if (fillPct > 0.4)  multiplier = 1.05;  // 5% surge
    return {
      original: bus.price,
      current: Math.round(bus.price * multiplier),
      multiplier,
      fillPct: Math.round(fillPct * 100)
    };
  }

  // Set min date to today
  const dateInput = document.getElementById('searchDate');
  if (dateInput) {
    dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);
  }

  // Travel preference toggles
  const prefToggles = document.querySelectorAll('.pref-toggle');
  let activePrefs = new Set();
  prefToggles.forEach(t => {
    t.addEventListener('click', () => {
      const pref = t.dataset.pref;
      if (activePrefs.has(pref)) {
        activePrefs.delete(pref);
        t.classList.remove('active');
      } else {
        activePrefs.add(pref);
        t.classList.add('active');
      }
    });
  });

  const searchForm  = document.getElementById('searchForm');
  const resultsArea = document.getElementById('resultsArea');

  if (!searchForm) return;

  searchForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const src  = document.getElementById('searchSource').value;
    const dest = document.getElementById('searchDest').value;
    const date = document.getElementById('searchDate').value;
    const type = document.getElementById('searchType') ? document.getElementById('searchType').value : 'Any';

    if (!src || !dest || !date) return;

    if (src === dest) {
      resultsArea.innerHTML = `
        <div class="no-results glass" style="padding:3rem; margin-top:1rem;">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p>Source and Destination cannot be the same.</p>
        </div>`;
      return;
    }

    // Filter buses
    let matches = BUS_DB.filter(b => b.src === src && b.dest === dest);
    
    // Auto-generate mock buses if none exist for this specific route!
    if (matches.length === 0) {
      matches.push({ id:'SB-GEN1', name:'SwiftBus Prime', type:'AC Sleeper', src, dest, dep:'08:00 PM', arr:'06:00 AM', duration:'10h', price:1500, seats:30, filled:Math.floor(Math.random() * 30) });
      matches.push({ id:'SB-GEN2', name:'SwiftBus Express', type:'AC Seater', src, dest, dep:'06:30 AM', arr:'02:30 PM', duration:'8h', price:950, seats:40, filled:Math.floor(Math.random() * 40) });
      matches.push({ id:'SB-GEN3', name:'SwiftBus Standard', type:'Non-AC Seater', src, dest, dep:'09:00 AM', arr:'07:00 PM', duration:'10h', price:600, seats:50, filled:Math.floor(Math.random() * 50) });
    }
    
    // Filter by AC / Non-AC type
    if (type === 'AC') {
      matches = matches.filter(b => b.type.includes('AC') && !b.type.includes('Non-AC'));
    } else if (type === 'Non-AC') {
      matches = matches.filter(b => b.type.includes('Non-AC'));
    }

    if (matches.length === 0) {
      resultsArea.innerHTML = `
        <div class="no-results glass" style="padding:3rem; margin-top:1rem;">
          <i class="fa-solid fa-face-sad-tear"></i>
          <p>No buses found for <strong>${src} → ${dest}</strong> on this route.<br>
          <span style="font-size:0.85rem;">Try a different route or date.</span></p>
        </div>`;
      return;
    }

    // Send search data to backend
    fetch('http://localhost:3000/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: src, destination: dest, travel_date: date })
    }).then(() => fetchRecentSearches())
      .catch(err => console.error('Failed to save search:', err));

    // Build preferences string for URL
    const prefsStr = [...activePrefs].join(',');

    // Render results
    let html = `<h3 style="margin-bottom:0.5rem; font-weight:600;">
      <i class="fa-solid fa-list"></i> ${matches.length} bus${matches.length > 1 ? 'es' : ''} found for 
      <span style="color:var(--accent);">${src} → ${dest}</span> on ${date}
    </h3>
    <div class="bus-results">`;

    matches.forEach(bus => {
      const pricing = getDynamicPrice(bus);
      const hasSurge = pricing.multiplier > 1;
      const seatsLeft = bus.seats - bus.filled;
      const isLoggedIn = !!localStorage.getItem('swiftbus_user');

      const bookUrl = isLoggedIn
        ? `booking.html?bus=${bus.id}&src=${encodeURIComponent(bus.src)}&dest=${encodeURIComponent(bus.dest)}&date=${date}&time=${encodeURIComponent(bus.dep)}&type=${encodeURIComponent(bus.type)}&price=${pricing.current}&basePrice=${pricing.original}&name=${encodeURIComponent(bus.name)}&prefs=${prefsStr}`
        : 'login.html';

      const priceBadge = hasSurge
        ? `<div class="price-badge"><i class="fa-solid fa-fire"></i> ${Math.round((pricing.multiplier - 1) * 100)}% Surge</div>`
        : '';
      const originalPriceHtml = hasSurge
        ? `<div class="original-price">₹${pricing.original}</div>` : '';

      html += `
      <div class="bus-card glass">
        <div class="bus-info">
          <span class="bus-name">${bus.name}</span>
          <span class="bus-type">${bus.type}</span>
          <span style="font-size:0.78rem; color:var(--muted); margin-top:0.2rem;">${bus.id} • <span style="color:${seatsLeft <= 5 ? 'var(--danger)' : seatsLeft <= 15 ? 'var(--accent)' : 'var(--success)'}; font-weight:600;">${seatsLeft} seats left</span></span>
        </div>
        <div class="bus-timing">
          <div class="time">${bus.dep}</div>
          <div class="label">Departure</div>
        </div>
        <div class="bus-duration">
          <i class="fa-solid fa-clock"></i>
          ${bus.duration}
        </div>
        <div class="bus-timing">
          <div class="time">${bus.arr}</div>
          <div class="label">Arrival</div>
        </div>
        <div class="bus-price">
          ${originalPriceHtml}
          <div class="amount">₹${pricing.current}</div>
          <div class="per">per seat</div>
          ${priceBadge}
        </div>
        <a href="${bookUrl}" class="btn btn-success" style="width:auto; padding:0.6rem 1.5rem; font-size:0.9rem;">
          <i class="fa-solid fa-ticket"></i> Book Now
        </a>
      </div>`;
    });

    html += '</div>';
    resultsArea.innerHTML = html;
  });

  // Fetch recent searches
  function fetchRecentSearches() {
    const container = document.getElementById('recentSearchesContainer');
    const list = document.getElementById('recentSearchesList');
    if (!container || !list) return;

    fetch('http://localhost:3000/searches')
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          container.style.display = 'block';
          list.innerHTML = data.map(s => `
            <div style="background:rgba(255,255,255,0.05); padding:0.8rem 1rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong style="color:var(--accent);">${s.source}</strong> 
                <i class="fa-solid fa-arrow-right" style="font-size:0.8rem; margin:0 0.4rem;"></i> 
                <strong style="color:var(--accent);">${s.destination}</strong>
              </div>
              <div style="font-size:0.85rem; color:var(--muted);">
                <i class="fa-regular fa-calendar" style="margin-right:0.3rem;"></i> 
                ${new Date(s.travel_date).toLocaleDateString()}
              </div>
            </div>
          `).join('');
        } else {
          container.style.display = 'none';
        }
      })
      .catch(err => console.error('Failed to fetch recent searches:', err));
  }

  // Load recent searches on initial page load
  fetchRecentSearches();

})();
