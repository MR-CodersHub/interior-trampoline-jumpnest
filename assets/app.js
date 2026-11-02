(function () {
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('jn-theme') || 'light';
  root.dataset.theme = savedTheme;
  if (localStorage.getItem('jn-dir') === 'rtl') {
    document.body.classList.add('rtl');
  }

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const announcementBar = $('.announcement-bar');
  if (announcementBar) {
    const syncAnnouncementHeight = () => {
      const height = announcementBar.getBoundingClientRect().height;
      root.style.setProperty('--announcement-h', `${height}px`);
    };
    syncAnnouncementHeight();
    window.addEventListener('resize', syncAnnouncementHeight);
    window.addEventListener('load', syncAnnouncementHeight);
    if ('ResizeObserver' in window) {
      new ResizeObserver(syncAnnouncementHeight).observe(announcementBar);
    }
  }

  window.toggleTheme = function () {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('jn-theme', root.dataset.theme);
  };

  window.toggleRTL = function () {
    document.body.classList.toggle('rtl');
    localStorage.setItem('jn-dir', document.body.classList.contains('rtl') ? 'rtl' : 'ltr');
  };

  window.toggleMobile = function () {
    const n = $('.nav');
    if (n) n.classList.toggle('open');
  };

  window.toggleDashboardSidebar = function () {
    const sidebar = $('#dashboardSidebar') || $('.app-page .sidebar');
    if (!sidebar) return;
    const isOpen = sidebar.classList.toggle('open');
    document.body.classList.toggle('dash-nav-open', isOpen);
    const toggle = $('.dash-menu-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  };

  window.closeDashboardSidebar = function () {
    const sidebar = $('#dashboardSidebar') || $('.app-page .sidebar');
    if (!sidebar) return;
    sidebar.classList.remove('open');
    document.body.classList.remove('dash-nav-open');
    const toggle = $('.dash-menu-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  };

  document.addEventListener('click', (e) => {
    if (e.target.closest('.app-page .sidebar .side-link, .app-page .sidebar .brand')) {
      if (window.innerWidth <= 640) window.closeDashboardSidebar();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 640) window.closeDashboardSidebar();
  });

  window.togglePortal = function (btn) {
    const m = $('.portal-menu');
    if (m) {
      m.classList.toggle('open');
      if (btn) btn.setAttribute('aria-expanded', m.classList.contains('open') ? 'true' : 'false');
    }
  };

  window.toggleContact = function () {
    const m = $('.portal-menu');
    if (m) m.classList.toggle('open');
  };

  document.addEventListener('click', (e) => {
    const m = $('.portal-menu');
    if (m && !m.contains(e.target)) m.classList.remove('open');
  });

  window.closeModal = function () {
    const m = $('#modal');
    if (m) m.classList.remove('open');
  };

  window.toast = function (msg) {
    let t = $('#toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.innerHTML = `<span style="display:inline-block;margin-right:6px">âœ¦</span> ` + msg;
    t.classList.add('show');
    clearTimeout(window._toast);
    window._toast = setTimeout(() => t.classList.remove('show'), 3200);
  };

  window.fakeAuth = function (label) {
    toast(label + ' opened â€” no password required in this frontend demo.');
  };

  window.openDash = function (type) {
    window.location.href = type === 'admin' ? 'admin.html' : 'dashboard.html';
  };

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Today & Tomorrow date helpers
  function getTodayString(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${day}`;
  }

  // PRICING MATRIX
  const TICKET_PRICES = {
    'standard-90': { name: 'Standard Open Jump (90 Mins)', price: 699, badge: 'Most Popular' },
    'quick-60': { name: 'Quick Energy Jump (60 Mins)', price: 499, badge: 'Fast Play' },
    'toddler-60': { name: 'Toddler Morning Play (60 Mins)', price: 399, badge: 'Ages 1â€“4' },
    'family-90': { name: 'Weekend Family Bundle (4 Jumpers, 90 Mins)', price: 2199, badge: 'Best Value' },
    'pass-holder': { name: 'Use Existing Multi-Visit Pass (1 Visit Deduction)', price: 0, badge: 'Pass Balance: 6 Left' }
  };
  const SOCK_PRICE = 80;

  // INTERACTIVE MULTI-STEP SESSION BOOKING MODAL
  window.openBooking = function (preset = {}) {
    const modal = $('#modal');
    if (!modal) return;
    modal.classList.add('open');

    let currentExp = preset.experience || 'standard-90';
    let currentDate = preset.date || getTodayString(0);
    let currentSlot = preset.slot || '2:30 PM';
    let currentJumpers = parseInt(preset.jumpers, 10) || 2;
    let currentSocks = preset.socks !== undefined ? parseInt(preset.socks, 10) : currentJumpers;
    let waiverSigned = localStorage.getItem('jn-waiver-signed') === 'true';

    function renderModal() {
      const expInfo = TICKET_PRICES[currentExp] || TICKET_PRICES['standard-90'];
      const baseSubtotal = currentExp === 'family-90' ? expInfo.price : expInfo.price * currentJumpers;
      const socksSubtotal = currentSocks * SOCK_PRICE;
      const totalAmount = baseSubtotal + socksSubtotal;

      const slots = [
        { time: '10:00 AM', status: 'Available', spots: '18 spots left', disabled: false },
        { time: '11:30 AM', status: 'Filling Fast', spots: '6 spots left', almost: true, disabled: false },
        { time: '1:00 PM', status: 'Available', spots: '22 spots left', disabled: false },
        { time: '2:30 PM', status: 'Filling Fast', spots: '4 spots left', almost: true, disabled: false },
        { time: '4:00 PM', status: 'Full', spots: 'Waitlist only', disabled: true },
        { time: '5:30 PM', status: 'Available', spots: '14 spots left', disabled: false },
        { time: '7:00 PM', status: 'Available', spots: '16 spots left', disabled: false }
      ];

      $('#modal-content').innerHTML = `
        <div class="modal-head">
          <div>
            <span class="eyebrow" style="color:var(--accent)">Instant Parent Booking</span>
            <h2 style="font:800 clamp(24px, 3.5vw, 32px) Manrope; margin: 6px 0 2px; letter-spacing:-0.04em">Reserve Your Play Session</h2>
            <p style="font-size:12px; color:var(--muted); margin:0">Instant confirmation Â· Free cancellation up to 2 hrs before session</p>
          </div>
          <button class="close" onclick="closeModal()" aria-label="Close dialog">Ã—</button>
        </div>

        <div style="margin-top:18px">
          <!-- Session Type Selection -->
          <div class="field">
            <label style="display:flex; justify-content:space-between">
              <span>Select Experience</span>
              <span style="color:var(--accent); font-weight:700">${expInfo.badge}</span>
            </label>
            <select id="modal-exp-select">
              <option value="standard-90" ${currentExp === 'standard-90' ? 'selected' : ''}>Standard Jump (90 Mins) â€” â‚¹699 / child</option>
              <option value="quick-60" ${currentExp === 'quick-60' ? 'selected' : ''}>Quick Jump (60 Mins) â€” â‚¹499 / child</option>
              <option value="toddler-60" ${currentExp === 'toddler-60' ? 'selected' : ''}>Toddler Morning (60 Mins, Ages 1â€“4) â€” â‚¹399</option>
              <option value="family-90" ${currentExp === 'family-90' ? 'selected' : ''}>Weekend Family Bundle (4 Jumpers) â€” â‚¹2,199</option>
              <option value="pass-holder" ${currentExp === 'pass-holder' ? 'selected' : ''}>Redeem Multi-Visit Pass (Active: 6 visits left)</option>
            </select>
          </div>

          <!-- Date & Slot Grid -->
          <div class="form-grid" style="margin-bottom:12px">
            <div class="field" style="margin-bottom:0">
              <label>Select Date</label>
              <input type="date" id="modal-date-input" min="${getTodayString(0)}" value="${currentDate}">
            </div>
            <div class="field" style="margin-bottom:0">
              <label>Quick Shortcut</label>
              <div style="display:flex; gap:6px; margin-top:2px">
                <button type="button" class="btn btn-soft" style="flex:1; padding:10px 8px; font-size:11px" onclick="setModalDate('${getTodayString(0)}')">Today</button>
                <button type="button" class="btn btn-soft" style="flex:1; padding:10px 8px; font-size:11px" onclick="setModalDate('${getTodayString(1)}')">Tomorrow</button>
                <button type="button" class="btn btn-soft" style="flex:1; padding:10px 8px; font-size:11px" onclick="setModalDate('${getTodayString(2)}')">This Weekend</button>
              </div>
            </div>
          </div>

          <div class="field">
            <label style="display:flex; justify-content:space-between">
              <span>Select Time Slot</span>
              <span style="font-size:11px; color:var(--muted)">Slots start promptly on schedule</span>
            </label>
            <div class="slot-grid">
              ${slots.map((s) => `
                <button type="button" 
                  class="slot ${s.time === currentSlot ? 'selected' : ''} ${s.almost ? 'almost' : ''} ${s.disabled ? 'full' : ''}" 
                  ${s.disabled ? 'disabled' : ''} 
                  onclick="selectSlot('${s.time}')">
                  ${s.time}
                  <small>${s.spots}</small>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Jumpers & Grip Socks Steppers -->
          <div class="form-grid" style="background:var(--surface2); padding:16px; border-radius:18px; margin-bottom:16px; border:1px solid var(--line)">
            <div>
              <label style="font-size:12px; font-weight:800; display:block; margin-bottom:6px">Number of Jumpers</label>
              <div style="display:flex; align-items:center; gap:10px">
                <button type="button" class="icon-btn" style="width:34px; height:34px" onclick="adjustJumpers(-1)">âˆ’</button>
                <b style="font-size:18px; font-family:Manrope; min-width:30px; text-align:center">${currentJumpers}</b>
                <button type="button" class="icon-btn" style="width:34px; height:34px" onclick="adjustJumpers(1)">ï¼‹</button>
                <span style="font-size:11px; color:var(--muted)">kids</span>
              </div>
            </div>

            <div>
              <label style="font-size:12px; font-weight:800; display:block; margin-bottom:6px">
                Official Grip Socks (â‚¹${SOCK_PRICE}/pr)
              </label>
              <div style="display:flex; align-items:center; gap:10px">
                <button type="button" class="icon-btn" style="width:34px; height:34px" onclick="adjustSocks(-1)">âˆ’</button>
                <b style="font-size:18px; font-family:Manrope; min-width:30px; text-align:center">${currentSocks}</b>
                <button type="button" class="icon-btn" style="width:34px; height:34px" onclick="adjustSocks(1)">ï¼‹</button>
                <span style="font-size:11px; color:var(--muted)">${currentSocks === 0 ? '(Bringing own)' : 'pairs'}</span>
              </div>
            </div>
          </div>

          <!-- Digital Waiver Notice -->
          <div style="padding:12px 14px; border-radius:14px; background:${waiverSigned ? '#eaf6f0' : '#fcf3e6'}; border:1px solid ${waiverSigned ? '#c3e8d4' : '#f2d8b1'}; display:flex; align-items:center; justify-content:space-between; margin-bottom:18px">
            <div style="display:flex; align-items:center; gap:10px">
              <span style="font-size:18px">${waiverSigned ? 'âœ…' : 'ðŸ“'}</span>
              <div>
                <b style="font-size:12px; color:${waiverSigned ? '#1f5e43' : '#8a5a0f'}">${waiverSigned ? 'Digital Waiver on File (Active)' : 'Digital Waiver Required'}</b>
                <small style="display:block; font-size:10px; color:${waiverSigned ? '#2b7858' : '#73521d'}">
                  ${waiverSigned ? 'Valid for all family jumpers until 2027.' : 'Takes 30 seconds online so kids can jump straight away.'}
                </small>
              </div>
            </div>
            ${!waiverSigned ? `<button type="button" class="btn btn-soft" style="font-size:11px; padding:6px 12px" onclick="openWaiverModal()">Sign Now</button>` : ''}
          </div>

          <!-- Total Calculation Breakdown -->
          <div style="border-top:1px dashed var(--line); padding-top:14px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:flex-end">
            <div>
              <span style="font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:0.08em; display:block">Total Summary</span>
              <div style="font-size:12px; color:var(--muted); margin-top:2px">
                ${currentExp === 'pass-holder' ? 'Multi-visit pass deduction (â‚¹0 cash)' : `${currentJumpers} jumper(s) + ${currentSocks} pair(s) socks`}
              </div>
            </div>
            <div style="text-align:right">
              <div style="font:800 clamp(24px, 4vw, 32px) Manrope; color:var(--ink); letter-spacing:-0.04em">
                ${currentExp === 'pass-holder' ? '1 Pass Visit' : 'â‚¹' + totalAmount.toLocaleString('en-IN')}
              </div>
              <small style="color:var(--muted); font-size:10px">All taxes & arena fees included</small>
            </div>
          </div>

          <!-- Submit Action -->
          <div style="display:flex; gap:10px">
            <button type="button" class="btn btn-primary" style="flex:2; font-size:14px; padding:14px 20px" onclick="finalizeBooking()">
              Confirm & Get Jump Pass
            </button>
            <button type="button" class="btn btn-soft" style="flex:1; font-size:13px" onclick="closeModal()">
              Cancel
            </button>
          </div>
        </div>
      `;

      // Event listener for experience select
      const expSelect = $('#modal-exp-select');
      if (expSelect) {
        expSelect.addEventListener('change', (e) => {
          currentExp = e.target.value;
          renderModal();
        });
      }

      // Event listener for date input
      const dateInput = $('#modal-date-input');
      if (dateInput) {
        dateInput.addEventListener('change', (e) => {
          currentDate = e.target.value;
        });
      }
    }

    window.selectSlot = function (slot) {
      currentSlot = slot;
      renderModal();
    };

    window.setModalDate = function (dateStr) {
      currentDate = dateStr;
      renderModal();
    };

    window.adjustJumpers = function (delta) {
      currentJumpers = Math.max(1, Math.min(10, currentJumpers + delta));
      if (currentSocks < currentJumpers) currentSocks = currentJumpers;
      renderModal();
    };

    window.adjustSocks = function (delta) {
      currentSocks = Math.max(0, Math.min(10, currentSocks + delta));
      renderModal();
    };

    window.finalizeBooking = function () {
      const bookingId = 'JN-' + Math.floor(100000 + Math.random() * 900000);
      const expInfo = TICKET_PRICES[currentExp] || TICKET_PRICES['standard-90'];
      const totalAmount = (currentExp === 'family-90' ? expInfo.price : expInfo.price * currentJumpers) + (currentSocks * SOCK_PRICE);

      $('#modal-content').innerHTML = `
        <div style="text-align:center; padding:15px 10px 10px">
          <div style="width:68px; height:68px; border-radius:50%; background:#dcefe7; color:#24634d; font-size:32px; display:grid; place-items:center; margin:0 auto 16px; border:2px solid #a9d9c6">
            âœ“
          </div>
          <span class="eyebrow" style="color:var(--green)">Session Confirmed</span>
          <h2 style="font:800 32px Manrope; letter-spacing:-0.04em; margin:8px 0 6px">You're Ready to Jump!</h2>
          <p style="color:var(--muted); font-size:13px; max-width:440px; margin:0 auto 20px">
            Your booking confirmation has been generated. Simply show this digital pass or your booking code at reception.
          </p>

          <!-- TICKET CARD PASS -->
          <div style="background:var(--surface); border:2px solid var(--accent); border-radius:22px; padding:22px; text-align:left; box-shadow:var(--shadow); position:relative; overflow:hidden; margin-bottom:22px">
            <div style="position:absolute; top:0; right:0; background:var(--accent); color:#fff; font-size:10px; font-weight:900; padding:4px 14px; border-bottom-left-radius:12px; letter-spacing:0.06em">
              FAST-PASS ACCESS
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:flex-start">
              <div>
                <span style="font-size:11px; text-transform:uppercase; letter-spacing:0.1em; color:var(--muted); font-weight:800">JUMPNEST HYDERABAD</span>
                <h3 style="font:800 22px Manrope; margin:4px 0 2px">${expInfo.name}</h3>
                <span style="font-size:12px; color:var(--accent); font-weight:700">Ref: ${bookingId}</span>
              </div>
              <div style="width:60px; height:60px; border-radius:10px; background:var(--surface2); border:1px solid var(--line); display:grid; place-items:center; font-size:9px; text-align:center; color:var(--muted); font-weight:700">
                [ QR CODE ]
              </div>
            </div>

            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin-top:18px; padding-top:14px; border-top:1px dashed var(--line)">
              <div>
                <span style="font-size:10px; color:var(--muted); text-transform:uppercase">Date</span>
                <b style="display:block; font-size:14px">${currentDate}</b>
              </div>
              <div>
                <span style="font-size:10px; color:var(--muted); text-transform:uppercase">Time Slot</span>
                <b style="display:block; font-size:14px; color:var(--accent)">${currentSlot}</b>
              </div>
              <div>
                <span style="font-size:10px; color:var(--muted); text-transform:uppercase">Jumpers</span>
                <b style="display:block; font-size:14px">${currentJumpers} Kids (${currentSocks} socks)</b>
              </div>
            </div>

            <div style="margin-top:14px; padding:10px 12px; background:var(--surface2); border-radius:12px; font-size:11px; color:var(--ink); display:flex; justify-content:space-between; align-items:center">
              <span>Payment Status: <b style="color:var(--green)">CONFIRMED</b></span>
              <span>Total: <b>${currentExp === 'pass-holder' ? 'Pass Redeemed' : 'â‚¹' + totalAmount.toLocaleString('en-IN')}</b></span>
            </div>
          </div>

          <div style="display:flex; gap:10px; flex-wrap:wrap">
            <button type="button" class="btn btn-primary" style="flex:1" onclick="toast('Pass saved! Check parent dashboard.'); closeModal();">
              Go to Parent Dashboard
            </button>
            <button type="button" class="btn btn-soft" style="flex:1" onclick="window.print()">
              ðŸ–¨ï¸ Print / Save PDF
            </button>
          </div>
        </div>
      `;
      toast(`Booking ${bookingId} created successfully!`);
    };

    renderModal();
  };

  // QUICK HERO BOOKING HELPER
  window.checkHeroBooking = function () {
    const dateInput = $('#hero-book-date');
    const expSelect = $('#hero-book-exp');
    const jumpersSelect = $('#hero-book-jumpers');

    const opts = {
      date: dateInput ? dateInput.value : getTodayString(0),
      experience: expSelect ? expSelect.value : 'standard-90',
      jumpers: jumpersSelect ? parseInt(jumpersSelect.value, 10) : 2
    };

    openBooking(opts);
  };

  // INTERACTIVE DIGITAL WAIVER MODAL
  window.openWaiverModal = function () {
    const modal = $('#modal');
    if (!modal) return;
    modal.classList.add('open');

    $('#modal-content').innerHTML = `
      <div class="modal-head">
        <div>
          <span class="eyebrow" style="color:var(--accent)">Safety First</span>
          <h2 style="font:800 clamp(24px, 3.5vw, 32px) Manrope; margin: 6px 0 2px; letter-spacing:-0.04em">Express Digital Waiver</h2>
          <p style="font-size:12px; color:var(--muted); margin:0">Complete once online Â· Valid for all visits for 1 full year</p>
        </div>
        <button class="close" onclick="closeModal()" aria-label="Close dialog">Ã—</button>
      </div>

      <form onsubmit="event.preventDefault(); submitWaiver();" style="margin-top:20px">
        <div class="form-grid">
          <div class="field">
            <label>Parent / Guardian Full Name *</label>
            <input required placeholder="e.g. Ananya Sharma" id="waiver-parent">
          </div>
          <div class="field">
            <label>Mobile Number (For Check-in) *</label>
            <input required type="tel" placeholder="+91 98765 43210" id="waiver-phone">
          </div>
        </div>

        <div class="field">
          <label>Email Address</label>
          <input required type="email" placeholder="ananya@example.com" id="waiver-email">
        </div>

        <div style="background:var(--surface2); padding:16px; border-radius:18px; border:1px solid var(--line); margin-bottom:16px">
          <label style="font-size:12px; font-weight:800; display:block; margin-bottom:8px">Child / Jumper Information</label>
          <div id="waiver-children-list">
            <div class="form-grid" style="margin-bottom:8px">
              <input required placeholder="Child 1 Full Name" class="child-name">
              <select class="child-age">
                <option value="3">3 Years (Toddler Zone)</option>
                <option value="5" selected>5 Years (Cloud Club)</option>
                <option value="7">7 Years (Open Trampoline)</option>
                <option value="9">9 Years (Ninja / Slam)</option>
                <option value="12">12 Years (All Zones)</option>
              </select>
            </div>
          </div>
          <button type="button" class="btn btn-soft" style="font-size:11px; padding:6px 12px; margin-top:4px" onclick="addWaiverChildRow()">
            ï¼‹ Add Another Child
          </button>
        </div>

        <!-- Safety Rules Affirmation -->
        <div style="font-size:12px; line-height:1.5; color:var(--muted); background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:14px; margin-bottom:16px">
          <b style="color:var(--ink); display:block; margin-bottom:4px">Key Safety Rules Agreement:</b>
          <label style="display:flex; gap:8px; align-items:flex-start; margin-bottom:8px; cursor:pointer">
            <input type="checkbox" required style="margin-top:3px">
            <span>I agree to ensure children wear official anti-slip grip socks on trampoline beds at all times.</span>
          </label>
          <label style="display:flex; gap:8px; align-items:flex-start; margin-bottom:8px; cursor:pointer">
            <input type="checkbox" required style="margin-top:3px">
            <span>I understand one person per trampoline mat is strictly enforced to prevent collisions.</span>
          </label>
          <label style="display:flex; gap:8px; align-items:flex-start; cursor:pointer">
            <input type="checkbox" required style="margin-top:3px">
            <span>I confirm the jumper(s) have no pre-existing orthopedic or cardiovascular conditions preventing active play.</span>
          </label>
        </div>

        <button type="submit" class="btn btn-primary" style="width:100%; font-size:14px; padding:13px">
          Sign Electronically & Activate Waiver
        </button>
      </form>
    `;

    window.addWaiverChildRow = function () {
      const container = $('#waiver-children-list');
      const row = document.createElement('div');
      row.className = 'form-grid';
      row.style.marginBottom = '8px';
      row.innerHTML = `
        <input required placeholder="Additional Child Name" class="child-name">
        <select class="child-age">
          <option value="3">3 Years (Toddler Zone)</option>
          <option value="5">5 Years (Cloud Club)</option>
          <option value="7" selected>7 Years (Open Trampoline)</option>
          <option value="9">9 Years (Ninja / Slam)</option>
          <option value="12">12 Years (All Zones)</option>
        </select>
      `;
      container.appendChild(row);
    };

    window.submitWaiver = function () {
      localStorage.setItem('jn-waiver-signed', 'true');
      const parentName = $('#waiver-parent').value || 'Parent';
      $('#modal-content').innerHTML = `
        <div style="text-align:center; padding:20px 10px">
          <div style="width:68px; height:68px; border-radius:50%; background:#dcefe7; color:#24634d; font-size:32px; display:grid; place-items:center; margin:0 auto 16px">
            âœ“
          </div>
          <span class="eyebrow" style="color:var(--green)">Waiver Activated</span>
          <h2 style="font:800 30px Manrope; letter-spacing:-0.04em; margin:8px 0 6px">Waiver Verified for ${parentName}</h2>
          <p style="color:var(--muted); font-size:13px; max-width:420px; margin:0 auto 20px">
            Your express digital waiver is active for 12 months. Your children can now skip the desk queue and go straight to the sock check station!
          </p>
          <div style="display:flex; gap:10px; justify-content:center">
            <button class="btn btn-primary" onclick="openBooking();">Book a Play Session</button>
            <button class="btn btn-soft" onclick="closeModal()">Close</button>
          </div>
        </div>
      `;
      toast('Digital waiver signed and recorded successfully!');
    };
  };

  // INTERACTIVE BIRTHDAY ESTIMATOR & BOOKING MODAL
  window.openBirthday = function (preselectedPkg = 'Jump & Feast') {
    const modal = $('#modal');
    if (!modal) return;
    modal.classList.add('open');

    $('#modal-content').innerHTML = `
      <div class="modal-head">
        <div>
          <span class="eyebrow" style="color:var(--accent)">Birthday Club Planner</span>
          <h2 style="font:800 clamp(24px, 3.5vw, 32px) Manrope; margin: 6px 0 2px; letter-spacing:-0.04em">Custom Party Builder</h2>
          <p style="font-size:12px; color:var(--muted); margin:0">Host an unforgettable active party with dedicated table & host</p>
        </div>
        <button class="close" onclick="closeModal()" aria-label="Close dialog">Ã—</button>
      </div>

      <form onsubmit="event.preventDefault(); submitBirthdayEnquiry();" style="margin-top:20px">
        <div class="form-grid">
          <div class="field">
            <label>Birthday Child's Name *</label>
            <input required placeholder="e.g. Kabir" id="bday-child">
          </div>
          <div class="field">
            <label>Turning Age *</label>
            <select id="bday-age">
              <option>4th Birthday</option>
              <option>5th Birthday</option>
              <option selected>6th Birthday</option>
              <option>7th Birthday</option>
              <option>8th Birthday</option>
              <option>9th Birthday</option>
              <option>10+ Birthday</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label>Selected Celebration Package</label>
          <select id="bday-pkg-select" onchange="updateBdayEstimate()">
            <option value="4999" ${preselectedPkg.includes('Little') ? 'selected' : ''}>Little Leap (Up to 8 Kids Â· 60m Play + 60m Table) â€” â‚¹4,999</option>
            <option value="7499" ${preselectedPkg.includes('Feast') ? 'selected' : ''}>Jump & Feast (Up to 12 Kids Â· 90m Play + Host + Food) â€” â‚¹7,499</option>
            <option value="12999" ${preselectedPkg.includes('Private') ? 'selected' : ''}>VIP Park Takeover (Up to 20 Kids Â· 120m Private Play) â€” â‚¹12,999</option>
          </select>
        </div>

        <div class="form-grid">
          <div class="field">
            <label>Expected Kids Count</label>
            <input type="number" id="bday-kids-count" min="6" max="35" value="12" oninput="updateBdayEstimate()">
          </div>
          <div class="field">
            <label>Preferred Date</label>
            <input type="date" min="${getTodayString(3)}" value="${getTodayString(7)}" id="bday-date">
          </div>
        </div>

        <div class="field">
          <label>Popular Party Add-ons</label>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px">
            <label style="border:1px solid var(--line); padding:10px; border-radius:12px; font-size:12px; display:flex; gap:8px; align-items:center; cursor:pointer">
              <input type="checkbox" id="addon-theme" onchange="updateBdayEstimate()">
              <span>Themed Balloon Arch (+â‚¹1,200)</span>
            </label>
            <label style="border:1px solid var(--line); padding:10px; border-radius:12px; font-size:12px; display:flex; gap:8px; align-items:center; cursor:pointer">
              <input type="checkbox" id="addon-pizza" checked onchange="updateBdayEstimate()">
              <span>Artisan Pizza & Juice (+â‚¹250/kid)</span>
            </label>
            <label style="border:1px solid var(--line); padding:10px; border-radius:12px; font-size:12px; display:flex; gap:8px; align-items:center; cursor:pointer">
              <input type="checkbox" id="addon-cake" onchange="updateBdayEstimate()">
              <span>Custom Themed Cake (+â‚¹1,500)</span>
            </label>
            <label style="border:1px solid var(--line); padding:10px; border-radius:12px; font-size:12px; display:flex; gap:8px; align-items:center; cursor:pointer">
              <input type="checkbox" id="addon-gifts" onchange="updateBdayEstimate()">
              <span>Jumpnest Gift Bags (+â‚¹180/kid)</span>
            </label>
          </div>
        </div>

        <div class="field">
          <label>Special Requests or Dietary Requirements</label>
          <input placeholder="e.g. Vegetarian only, eggless cake, superhero theme...">
        </div>

        <!-- Estimated Total Bar -->
        <div style="background:var(--surface2); border:1px solid var(--line); border-radius:14px; padding:14px; display:flex; justify-content:space-between; align-items:center; margin-bottom:18px">
          <div>
            <span style="font-size:10px; text-transform:uppercase; letter-spacing:0.08em; color:var(--muted); font-weight:800">Estimated Total</span>
            <div style="font-size:11px; color:var(--muted)">Includes dedicated party host & setup</div>
          </div>
          <div id="bday-estimate-price" style="font:800 26px Manrope; color:var(--accent)">
            â‚¹7,499
          </div>
        </div>

        <button type="submit" class="btn btn-primary" style="width:100%; font-size:14px; padding:14px">
          Send Party Reservation Enquiry
        </button>
      </form>
    `;

    window.updateBdayEstimate = function () {
      const basePkg = parseInt($('#bday-pkg-select').value, 10) || 7499;
      const kids = parseInt($('#bday-kids-count').value, 10) || 12;
      let total = basePkg;

      // Base included count
      const baseCount = basePkg === 4999 ? 8 : (basePkg === 7499 ? 12 : 20);
      if (kids > baseCount) {
        total += (kids - baseCount) * 450;
      }

      if ($('#addon-theme') && $('#addon-theme').checked) total += 1200;
      if ($('#addon-pizza') && $('#addon-pizza').checked) total += (kids * 250);
      if ($('#addon-cake') && $('#addon-cake').checked) total += 1500;
      if ($('#addon-gifts') && $('#addon-gifts').checked) total += (kids * 180);

      const priceElem = $('#bday-estimate-price');
      if (priceElem) {
        priceElem.textContent = 'â‚¹' + total.toLocaleString('en-IN');
      }
    };

    window.submitBirthdayEnquiry = function () {
      const childName = $('#bday-child').value || 'the child';
      closeModal();
      toast(`Birthday enquiry received for ${childName}! Our coordinator will reach out within 2 hours.`);
    };

    window.updateBdayEstimate();
  };

  // INTERACTIVE ATTRACTIONS ZONE FILTER
  window.filterZones = function (category, btn) {
    const buttons = $$('.zone-filter-btn');
    buttons.forEach((b) => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const cards = $$('.zone-card');
    cards.forEach((c) => {
      if (category === 'all' || c.dataset.category.includes(category)) {
        c.style.display = 'flex';
        c.style.animation = 'fadeIn 0.3s ease forwards';
      } else {
        c.style.display = 'none';
      }
    });
  };

  // INSTANT FAQ SEARCH / FILTER
  window.filterFAQ = function (searchTerm) {
    const term = (searchTerm || '').trim().toLowerCase();
    const details = $$('.faq details');
    details.forEach((d) => {
      const text = d.innerText.toLowerCase();
      if (!term || text.includes(term)) {
        d.style.display = 'block';
        if (term) d.open = true;
      } else {
        d.style.display = 'none';
      }
    });
  };
})();
