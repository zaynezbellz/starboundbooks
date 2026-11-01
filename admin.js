// ═══════════════════════════════════════════════════════════════
//  STARBOUND BOOKS — admin.js
//  Admin panel: load, add, edit, delete books
//  Place this file at: js/admin.js
// ═══════════════════════════════════════════════════════════════

// Cover gradient map — mirrors COVERS in main.js
const COVER_GRADIENTS = {
  purple: 'linear-gradient(160deg,#2d1b69,#4a2c8a,#1a1244)',
  teal:   'linear-gradient(160deg,#0d3b4a,#1a6b7a,#0d2c35)',
  rose:   'linear-gradient(160deg,#4a1228,#8a2840,#3a0e20)',
  amber:  'linear-gradient(160deg,#3a2200,#7a4a08,#2a1800)',
  navy:   'linear-gradient(160deg,#0d1130,#1a2060,#08091e)',
  green:  'linear-gradient(160deg,#0d2e1a,#1a5c38,#081c10)',
};

// All loaded books (for client-side search filter)
let allBooks = [];
// ID of the book pending deletion
let pendingDeleteId = null;
let pendingDeleteTitle = '';


// ═══════════════════════════════════════════════════════════════
//  LOAD BOOKS
// ═══════════════════════════════════════════════════════════════

async function loadAdminBooks() {
  try {
    const res  = await fetch('php/admin_books.php');
    const json = await res.json();

    if (!json.success) {
      showTableError(json.error || 'Could not load books.');
      return;
    }

    allBooks = json.books;
    renderTable(allBooks);
    updateStats(allBooks);

  } catch (err) {
    console.error('Admin load error:', err);
    showTableError('Could not connect to database. Is XAMPP running?');
  }
}

function showTableError(msg) {
  const tbody = document.getElementById('admin-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" class="loading-msg">✦ ${msg}</td></tr>`;
}

function updateStats(books) {
  const cats = new Set(books.map(b => b.category));
  const sales = books.filter(b => b.badge === 'sale').length;
  document.getElementById('stat-total').textContent      = books.length;
  document.getElementById('stat-categories').textContent = cats.size;
  document.getElementById('stat-sale').textContent       = sales;
}


// ═══════════════════════════════════════════════════════════════
//  RENDER TABLE
// ═══════════════════════════════════════════════════════════════

function renderTable(books) {
  const tbody = document.getElementById('admin-tbody');
  if (!tbody) return;

  if (books.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="loading-msg">✦ No books found.</td></tr>`;
    return;
  }

  tbody.innerHTML = books.map(b => {
    const cover    = COVER_GRADIENTS[b.bg] || COVER_GRADIENTS.purple;
    const stars    = '★'.repeat(b.rating) + '☆'.repeat(5 - b.rating);
    const badgeMap = {
      new:  `<span class="tbl-badge tbl-badge-new">✦ New</span>`,
      best: `<span class="tbl-badge tbl-badge-best">☽ Best</span>`,
      sale: `<span class="tbl-badge tbl-badge-sale">✦ Sale</span>`,
    };
    const badge = badgeMap[b.badge] || `<span class="tbl-badge tbl-badge-none">—</span>`;
    const price = b.original
      ? `<span class="tbl-original">₱${b.original}</span><span class="tbl-price">₱${b.price}</span>`
      : `<span class="tbl-price">₱${b.price}</span>`;

    const safeTitle = b.title.replace(/'/g, "\\'");

    return `
      <tr data-id="${b.id}">
        <td>
          <div class="tbl-cover" style="background:${cover}">${b.emoji}</div>
        </td>
        <td>
          <span class="tbl-title">${b.title}</span>
          <span class="tbl-author">${b.author}</span>
        </td>
        <td>${b.category}</td>
        <td>${price}</td>
        <td><span class="tbl-stars">${stars}</span></td>
        <td>${badge}</td>
        <td>
          <div class="tbl-actions">
            <button class="btn-edit" onclick="openEditModal(${b.id})">✎ Edit</button>
            <button class="btn-delete" onclick="promptDelete(${b.id}, '${safeTitle}')">✕ Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}


// ═══════════════════════════════════════════════════════════════
//  SEARCH FILTER
// ═══════════════════════════════════════════════════════════════

function filterAdminBooks() {
  const q = document.getElementById('admin-search').value.toLowerCase().trim();
  if (!q) {
    renderTable(allBooks);
    return;
  }
  const filtered = allBooks.filter(b =>
    b.title.toLowerCase().includes(q) ||
    b.author.toLowerCase().includes(q) ||
    b.category.toLowerCase().includes(q)
  );
  renderTable(filtered);
}


// ═══════════════════════════════════════════════════════════════
//  MODAL — ADD
// ═══════════════════════════════════════════════════════════════

function openModal() {
  // Clear form
  document.getElementById('form-id').value       = '';
  document.getElementById('form-title').value    = '';
  document.getElementById('form-author').value   = '';
  document.getElementById('form-price').value    = '';
  document.getElementById('form-original').value = '';
  document.getElementById('form-category').value = '';
  document.getElementById('form-badge').value    = '';
  document.getElementById('form-emoji').value    = '';
  document.getElementById('form-bg').value       = '';
  document.getElementById('form-rating').value   = '4';

  document.getElementById('modal-title').textContent = 'Add New Book';
  document.getElementById('btn-save').textContent    = '✦ Save Book';
  updatePreview();

  document.getElementById('modal-overlay').classList.add('open');
}


// ═══════════════════════════════════════════════════════════════
//  MODAL — EDIT
// ═══════════════════════════════════════════════════════════════

function openEditModal(id) {
  const book = allBooks.find(b => b.id === id);
  if (!book) return;

  document.getElementById('form-id').value       = book.id;
  document.getElementById('form-title').value    = book.title;
  document.getElementById('form-author').value   = book.author;
  document.getElementById('form-price').value    = book.price;
  document.getElementById('form-original').value = book.original ?? '';
  document.getElementById('form-category').value = book.category;
  document.getElementById('form-badge').value    = book.badge ?? '';
  document.getElementById('form-emoji').value    = book.emoji;
  document.getElementById('form-bg').value       = book.bg;
  document.getElementById('form-rating').value   = book.rating;

  document.getElementById('modal-title').textContent = 'Edit Book';
  document.getElementById('btn-save').textContent    = '✦ Save Changes';
  updatePreview();

  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal(e) {
  // If called by overlay click, only close if clicking the overlay itself
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.remove('open');
}


// ═══════════════════════════════════════════════════════════════
//  FORM SUBMIT (add or update)
// ═══════════════════════════════════════════════════════════════

async function submitForm(e) {
  e.preventDefault();

  const id = document.getElementById('form-id').value;
  const payload = {
    action:   id ? 'update' : 'add',
    id:       id || undefined,
    title:    document.getElementById('form-title').value.trim(),
    author:   document.getElementById('form-author').value.trim(),
    price:    document.getElementById('form-price').value,
    original: document.getElementById('form-original').value,
    category: document.getElementById('form-category').value,
    badge:    document.getElementById('form-badge').value,
    emoji:    document.getElementById('form-emoji').value.trim(),
    bg:       document.getElementById('form-bg').value,
    rating:   document.getElementById('form-rating').value,
  };

  const saveBtn = document.getElementById('btn-save');
  saveBtn.disabled = true;
  saveBtn.textContent = '✦ Saving…';

  try {
    const res  = await fetch('php/admin_books.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const json = await res.json();

    if (json.success) {
      const msg = id ? `"${payload.title}" updated ✦` : `"${payload.title}" added to the cosmos ✦`;
      showToast(msg);
      document.getElementById('modal-overlay').classList.remove('open');
      await loadAdminBooks();
    } else {
      showToast('✕ Error: ' + (json.error || 'Something went wrong'));
    }
  } catch (err) {
    console.error('Save error:', err);
    showToast('✕ Could not reach the server.');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = id ? '✦ Save Changes' : '✦ Save Book';
  }
}


// ═══════════════════════════════════════════════════════════════
//  DELETE
// ═══════════════════════════════════════════════════════════════

function promptDelete(id, title) {
  pendingDeleteId    = id;
  pendingDeleteTitle = title;
  document.getElementById('confirm-msg').textContent =
    `"${title}" will be permanently removed.`;
  document.getElementById('confirm-overlay').classList.add('open');
}

function cancelDelete() {
  pendingDeleteId = null;
  pendingDeleteTitle = '';
  document.getElementById('confirm-overlay').classList.remove('open');
}

async function confirmDelete() {
  if (!pendingDeleteId) return;

  const btn = document.getElementById('btn-confirm-delete');
  btn.disabled = true;
  btn.textContent = 'Deleting…';

  try {
    const res  = await fetch('php/admin_books.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'delete', id: pendingDeleteId }),
    });
    const json = await res.json();

    if (json.success) {
      showToast(`"${pendingDeleteTitle}" removed from the cosmos ✦`);
      cancelDelete();
      await loadAdminBooks();
    } else {
      showToast('✕ Error: ' + (json.error || 'Could not delete'));
    }
  } catch (err) {
    console.error('Delete error:', err);
    showToast('✕ Could not reach the server.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Delete';
  }
}


// ═══════════════════════════════════════════════════════════════
//  COVER PREVIEW (live update)
// ═══════════════════════════════════════════════════════════════

function updatePreview() {
  const emoji   = document.getElementById('form-emoji')?.value   || '📖';
  const bg      = document.getElementById('form-bg')?.value      || 'purple';
  const preview = document.getElementById('cover-preview');
  const icon    = document.getElementById('preview-emoji');
  if (!preview || !icon) return;
  preview.style.background = COVER_GRADIENTS[bg] || COVER_GRADIENTS.purple;
  icon.textContent = emoji;
}


// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  loadAdminBooks();

  // Live cover preview
  document.getElementById('form-emoji')?.addEventListener('input', updatePreview);
  document.getElementById('form-bg')?.addEventListener('change', updatePreview);

  // Close confirm overlay on background click
  document.getElementById('confirm-overlay')?.addEventListener('click', function(e) {
    if (e.target === this) cancelDelete();
  });

  // Keyboard close
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.getElementById('modal-overlay')?.classList.remove('open');
      cancelDelete();
    }
  });
});
