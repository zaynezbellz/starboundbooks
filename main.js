// ═══════════════════════════════════════════════════════════════
//  STARBOUND BOOKS — main.js
//  Place this file at: js/main.js
// ═══════════════════════════════════════════════════════════════


// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const categories = ['All ✦', 'Fiction', 'Astrology', 'Mythology', 'Fantasy', 'Tarot & Magic'];

const zodiacSigns = [
  { s: '♈', n: 'Aries'        },
  { s: '♉', n: 'Taurus'       },
  { s: '♊', n: 'Gemini'       },
  { s: '♋', n: 'Cancer'       },
  { s: '♌', n: 'Leo'          },
  { s: '♍', n: 'Virgo'        },
  { s: '♎', n: 'Libra'        },
  { s: '♏', n: 'Scorpio'      },
  { s: '♐', n: 'Sagittarius'  },
  { s: '♑', n: 'Capricorn'    },
  { s: '♒', n: 'Aquarius'     },
  { s: '♓', n: 'Pisces'       },
];

// Matches the `bg` column values in your MySQL database
const COVERS = {
  purple: 'linear-gradient(160deg,#2d1b69,#4a2c8a,#1a1244)',
  teal:   'linear-gradient(160deg,#0d3b4a,#1a6b7a,#0d2c35)',
  rose:   'linear-gradient(160deg,#4a1228,#8a2840,#3a0e20)',
  amber:  'linear-gradient(160deg,#3a2200,#7a4a08,#2a1800)',
  navy:   'linear-gradient(160deg,#0d1130,#1a2060,#08091e)',
  green:  'linear-gradient(160deg,#0d2e1a,#1a5c38,#081c10)',
};


// ─── STATE ────────────────────────────────────────────────────────────────────

// cartItems: array of { id, title, price, emoji, bg, qty }
let cartItems      = JSON.parse(localStorage.getItem('sb_cart') || '[]');
let activeCategory = 'All ✦';


// ═══════════════════════════════════════════════════════════════
//  DATABASE FETCH
// ═══════════════════════════════════════════════════════════════

// Fetches books from php/books.php and renders them into #books-grid
async function loadBooks(category = 'All') {
  const url = `php/books.php?category=${encodeURIComponent(category)}`;

  try {
    const res   = await fetch(url);
    const books = await res.json();

    if (books.error) {
      console.error('Database error:', books.error);
      showGridError('books-grid');
      return;
    }

    const grid = document.getElementById('books-grid');
    if (!grid) return;

    if (books.length === 0) {
      grid.innerHTML = `<div class="loading-msg">✦ No books found in this category.</div>`;
      return;
    }

    grid.innerHTML = books.map((b, i) => renderCard(b, i * 0.07)).join('');

  } catch (err) {
    console.error('Could not load books. Is XAMPP running?', err);
    showGridError('books-grid');
  }
}

// Fetches the first 6 books for the zodiac picks section
async function loadZodiacBooks() {
  const url = `php/books.php?limit=6`;

  try {
    const res   = await fetch(url);
    const books = await res.json();

    if (books.error) return;

    const grid = document.getElementById('zodiac-books');
    if (!grid) return;

    grid.innerHTML = books.map((b, i) => renderCard(b, i * 0.07)).join('');

  } catch (err) {
    console.error('Could not load zodiac books.', err);
  }
}

// Shows a friendly error message inside a grid
function showGridError(gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = `
    <div class="loading-msg">
      ✦ Could not connect to the database.<br>
      Make sure XAMPP (Apache + MySQL) is running.
    </div>`;
}


// ═══════════════════════════════════════════════════════════════
//  RENDER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

// Builds the HTML string for a single book card
function renderCard(book, delay = 0) {
  const rating   = Number(book.rating) || 4;
  const stars    = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const cover    = COVERS[book.bg] || COVERS.purple;

  // Badge
  let badgeHtml = '';
  if (book.badge === 'new')  badgeHtml = `<span class="book-badge badge-new">✦ New</span>`;
  if (book.badge === 'best') badgeHtml = `<span class="book-badge badge-best">☽ Bestseller</span>`;
  if (book.badge === 'sale') badgeHtml = `<span class="book-badge badge-sale">✦ Sale</span>`;

  // Price — show strikethrough original if on sale
  const priceHtml = book.original
    ? `<span class="original">₱${book.original}</span>₱${book.price}`
    : `₱${book.price}`;

  // Escape single quotes in title for the onclick attribute
  const safeTitle = book.title.replace(/'/g, "\\'");

  return `
    <div class="book-card" style="animation-delay:${delay}s"
         data-id="${book.id}" data-cat="${book.category}">

      <div class="book-cover" style="background:${cover}">
        ${badgeHtml}
        <div class="book-cover-placeholder">
          <span style="font-size:3.5rem;
                       filter:drop-shadow(0 0 20px rgba(155,127,232,0.6))">
            ${book.emoji}
          </span>
        </div>
      </div>

      <div class="book-info">
        <p class="book-category">${book.category}</p>
        <h3 class="book-title">${book.title}</h3>
        <p class="book-author">${book.author}</p>
        <div class="book-footer">
          <div>
            <div class="stars-rating">${stars}</div>
            <div class="book-price">${priceHtml}</div>
          </div>
          <button class="add-btn"
                  onclick="addToCart(event, ${book.id}, '${safeTitle}', ${book.price}, '${book.emoji}', '${book.bg}')">
            +
          </button>
        </div>
      </div>

    </div>
  `;
}

// Renders the scrolling zodiac strip
function renderZodiac() {
  const track = document.getElementById('zodiac-track');
  if (!track) return;
  const doubled = [...zodiacSigns, ...zodiacSigns];
  track.innerHTML = doubled
    .map(z => `<div class="zodiac-item"><span>${z.s}</span><span>${z.n}</span></div>`)
    .join('');
}

// Renders the category filter pills
function renderCategories() {
  const el = document.getElementById('categories');
  if (!el) return;
  el.innerHTML = categories
    .map(c => `
      <button class="cat-pill${c === activeCategory ? ' active' : ''}"
              onclick="filterBooks('${c}')">
        ${c}
      </button>`)
    .join('');
}


// ═══════════════════════════════════════════════════════════════
//  FILTER
// ═══════════════════════════════════════════════════════════════

function filterBooks(cat) {
  activeCategory = cat;
  renderCategories();
  const phpCat = cat === 'All ✦' ? 'All' : cat;
  loadBooks(phpCat);
  spawnSparkles();
}


// ═══════════════════════════════════════════════════════════════
//  CART — full implementation with localStorage
// ═══════════════════════════════════════════════════════════════

function saveCart() {
  localStorage.setItem('sb_cart', JSON.stringify(cartItems));
}

// Add a book to the cart (called from book cards and featured banner)
function addToCart(e, id, title, price, emoji, bg) {
  e.stopPropagation();

  const existing = cartItems.find(item => item.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cartItems.push({ id, title, price: Number(price), emoji, bg, qty: 1 });
  }

  saveCart();
  updateCartCount();
  renderCartDrawer();
  showToast(`"${title}" added to your cart ✦`);
  spawnShootingStar();

  // Animate button
  const btn = e.currentTarget;
  if (btn) {
    btn.textContent = '✦';
    btn.classList.add('added');
    setTimeout(() => {
      btn.textContent = '+';
      btn.classList.remove('added');
    }, 1500);
  }
}

function addFeatured(e) {
  e.preventDefault();
  const fakeEvent = { stopPropagation: () => {}, currentTarget: null };
  addToCart(fakeEvent, 0, 'The Lunar Codex', 580, '🌙', 'purple');
}

// Update cart icon count in navbar
function updateCartCount() {
  const el = document.getElementById('cart-count');
  if (!el) return;
  const total = cartItems.reduce((sum, i) => sum + i.qty, 0);
  el.textContent = total;
  el.classList.add('bump');
  setTimeout(() => el.classList.remove('bump'), 400);
}

// Change quantity of a cart item (+1 / -1)
function changeQty(id, delta) {
  const item = cartItems.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cartItems = cartItems.filter(i => i.id !== id);
  }
  saveCart();
  updateCartCount();
  renderCartDrawer();
}

// Remove one item entirely
function removeCartItem(id) {
  cartItems = cartItems.filter(i => i.id !== id);
  saveCart();
  updateCartCount();
  renderCartDrawer();
}

// Clear all items
function clearCart() {
  cartItems = [];
  saveCart();
  updateCartCount();
  renderCartDrawer();
}

// Render items inside the drawer
function renderCartDrawer() {
  const itemsEl   = document.getElementById('cart-items');
  const emptyEl   = document.getElementById('cart-empty');
  const footerEl  = document.getElementById('cart-footer');
  const subtotalEl = document.getElementById('cart-subtotal');
  if (!itemsEl) return;

  const COVERS = {
    purple: 'linear-gradient(160deg,#2d1b69,#4a2c8a,#1a1244)',
    teal:   'linear-gradient(160deg,#0d3b4a,#1a6b7a,#0d2c35)',
    rose:   'linear-gradient(160deg,#4a1228,#8a2840,#3a0e20)',
    amber:  'linear-gradient(160deg,#3a2200,#7a4a08,#2a1800)',
    navy:   'linear-gradient(160deg,#0d1130,#1a2060,#08091e)',
    green:  'linear-gradient(160deg,#0d2e1a,#1a5c38,#081c10)',
  };

  if (cartItems.length === 0) {
    itemsEl.innerHTML = '';
    emptyEl  && emptyEl.classList.remove('hidden');
    footerEl && footerEl.classList.add('hidden');
    return;
  }

  emptyEl  && emptyEl.classList.add('hidden');
  footerEl && footerEl.classList.remove('hidden');

  itemsEl.innerHTML = cartItems.map(item => {
    const bg = COVERS[item.bg] || COVERS.purple;
    return `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-cover" style="background:${bg}">${item.emoji}</div>
        <div class="cart-item-info">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-price">&#8369;${(item.price * item.qty).toLocaleString()}</div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty(${item.id}, -1)">&#8722;</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
        </div>
        <button class="cart-item-remove" onclick="removeCartItem(${item.id})" title="Remove">&#10005;</button>
      </div>
    `;
  }).join('');

  const total = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  if (subtotalEl) subtotalEl.textContent = '&#8369;' + total.toLocaleString();
  // Re-set innerHTML so entity renders
  if (subtotalEl) subtotalEl.innerHTML = '&#8369;' + total.toLocaleString();
}

// Open / close cart drawer
function openCart() {
  renderCartDrawer();
  document.getElementById('cart-drawer')?.classList.add('open');
  document.getElementById('cart-overlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-drawer')?.classList.remove('open');
  document.getElementById('cart-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

// Checkout (demo — shows success overlay and clears cart)
function checkoutCart() {
  if (cartItems.length === 0) return;
  closeCart();
  document.getElementById('checkout-overlay')?.classList.add('open');
  clearCart();
}

function closeCheckout() {
  document.getElementById('checkout-overlay')?.classList.remove('open');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}


// ═══════════════════════════════════════════════════════════════
//  VISUAL EFFECTS
// ═══════════════════════════════════════════════════════════════

function spawnShootingStar() {
  const star = document.createElement('div');
  star.className    = 'shooting-star';
  star.style.left   = Math.random() * 80 + 'vw';
  star.style.top    = Math.random() * 40 + 'vh';
  document.body.appendChild(star);
  setTimeout(() => star.remove(), 1400);
}

function spawnSparkles() {
  for (let i = 0; i < 6; i++) {
    const s     = document.createElement('div');
    const color = Math.random() > 0.5 ? 'var(--gold)' : 'var(--lavender)';
    s.style.cssText = `
      position: fixed;
      left: ${Math.random() * 90 + 5}vw;
      top:  ${Math.random() * 70 + 10}vh;
      width: 6px; height: 6px;
      background: ${color};
      border-radius: 50%;
      pointer-events: none;
      z-index: 200;
      animation: sparkle 0.8s ${i * 0.1}s ease forwards;
    `;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1000);
  }
}

function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = document.body.scrollHeight;
    stars = Array.from({ length: 220 }, () => ({
      x:            Math.random() * W,
      y:            Math.random() * H,
      r:            Math.random() * 1.8 + 0.2,
      twinkleSpeed: Math.random() * 0.015 + 0.005,
      phase:        Math.random() * Math.PI * 2,
      color: Math.random() > 0.85 ? '#c8b4f0'
           : Math.random() > 0.70 ? '#f0c84a'
           : '#ffffff',
    }));
  }

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    frame++;
    stars.forEach(s => {
      const opacity = 0.2 + 0.7 * (0.5 + 0.5 * Math.sin(frame * s.twinkleSpeed + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle   = s.color;
      ctx.globalAlpha = opacity;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
}

function drawConstellation() {
  const svg = document.getElementById('hero-svg');
  if (!svg) return;

  const pts = [
    [.15,.25],[.22,.35],[.12,.45],[.25,.55],[.18,.65],
    [.80,.20],[.88,.32],[.75,.40],[.85,.52],[.78,.62],
    [.50,.15],[.45,.30],[.55,.28],[.48,.42],
  ];
  const lines = [
    [0,1],[1,2],[2,3],[3,4],
    [5,6],[6,7],[7,8],[8,9],
    [10,11],[11,12],[12,13],[11,13],
  ];

  const W = window.innerWidth;
  const H = window.innerHeight;
  let html = '';

  lines.forEach(([a, b]) => {
    html += `
      <line
        x1="${pts[a][0] * W}" y1="${pts[a][1] * H}"
        x2="${pts[b][0] * W}" y2="${pts[b][1] * H}"
        stroke="rgba(155,127,232,0.15)"
        stroke-width="1"
        stroke-dasharray="4 6"/>`;
  });

  pts.forEach(([px, py], i) => {
    const delay = i * 0.3;
    const color = Math.random() > 0.6 ? '#f0c84a' : '#c8b4f0';
    html += `
      <circle
        cx="${px * W}" cy="${py * H}"
        r="${1.5 + Math.random()}"
        fill="${color}"
        opacity="0.7"
        style="animation: twinkle ${2 + Math.random() * 2}s ${delay}s ease-in-out infinite"/>`;
  });

  svg.innerHTML = html;
}


// ═══════════════════════════════════════════════════════════════
//  CUSTOM CURSOR
// ═══════════════════════════════════════════════════════════════

function initCursor() {
  const cur   = document.getElementById('cursor');
  const trail = document.getElementById('cursor-trail');
  if (!cur || !trail) return;

  let tx = 0, ty = 0;

  document.addEventListener('mousemove', e => {
    cur.style.left = e.clientX + 'px';
    cur.style.top  = e.clientY + 'px';
    tx = e.clientX;
    ty = e.clientY;
  });

  setInterval(() => {
    trail.style.left = tx + 'px';
    trail.style.top  = ty + 'px';
  }, 40);

  document.querySelectorAll('a, button, .cat-pill, .add-btn').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cur.style.width      = '20px';
      cur.style.height     = '20px';
      cur.style.background = 'var(--lavender)';
    });
    el.addEventListener('mouseleave', () => {
      cur.style.width      = '12px';
      cur.style.height     = '12px';
      cur.style.background = 'var(--gold)';
    });
  });
}


// ═══════════════════════════════════════════════════════════════
//  SCROLL REVEAL
// ═══════════════════════════════════════════════════════════════

function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}


// ═══════════════════════════════════════════════════════════════
//  PERIODIC AMBIENT SHOOTING STARS
// ═══════════════════════════════════════════════════════════════

function startPeriodicStars() {
  setInterval(() => {
    if (Math.random() > 0.4) spawnShootingStar();
  }, 4000);
}


// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════

window.addEventListener('DOMContentLoaded', () => {
  renderZodiac();
  renderCategories();
  loadBooks();
  loadZodiacBooks();
  initStarfield();
  drawConstellation();
  initCursor();
  initReveal();
  startPeriodicStars();
  updateCartCount(); // restore cart count from localStorage
});

window.addEventListener('resize', drawConstellation);