// ====================================================
// admin.js - ฟังก์ชันสำหรับหน้าแอดมิน
// จัดการเมนู, รายงาน, ยอดขาย, การแจ้งเตือน
// ====================================================

// -------- ตัวแปรสถานะ Admin --------
let adminCurrentPage = 'dashboard';
let editingMenuId = null;

// -------- สลับหน้า Admin --------
function adminNavigate(page) {
  adminCurrentPage = page;

  // ซ่อนทุกหน้า
  document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));

  // แสดงหน้าที่เลือก
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  // อัพเดท nav
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // Load ข้อมูลตามหน้า
  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'menus': loadMenuManagement(); break;
    case 'orders': loadOrderManagement(); break;
    case 'qrcodes': loadQRPage(); break;
    case 'reports': loadReportsPage(); break;
    case 'sales': loadSalesPage(); break;
    case 'users': loadUsersPage(); break;
  }

  // ปิด sidebar บนมือถือ
  const sidebar = document.getElementById('admin-sidebar');
  if (sidebar && window.innerWidth < 768) {
    sidebar.classList.remove('open');
  }
}

// -------- Dashboard --------
function loadDashboard() {
  const orders = getOrders();
  const todayOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });
  const sales = getSalesReport();

  // อัพเดทสถิติ
  setEl('stat-total-today', formatPrice(
    todayOrders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0)
  ));
  setEl('stat-orders-today', todayOrders.length);
  setEl('stat-orders-pending',
    orders.filter(o => ['pending', 'confirmed', 'cooking', 'ready'].includes(o.status)).length
  );
  setEl('stat-total-revenue', formatPrice(sales.total));

  // ออเดอร์ล่าสุด
  renderRecentOrders();

  // แจ้งเตือนล่าสุด
  renderRecentNotifs();
}

function renderRecentOrders() {
  const container = document.getElementById('recent-orders-list');
  if (!container) return;
  const orders = getOrders().slice(-8).reverse();
  if (orders.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p class="empty-text">ยังไม่มีออเดอร์</p></div>`;
    return;
  }
  container.innerHTML = orders.map(o => `
    <div class="order-item-row" style="padding:8px 0;">
      <div>
        <span class="fw-bold">โต๊ะ ${o.tableId}</span>
        <span class="text-muted text-sm ml-2">${formatTime(o.createdAt)}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="fw-bold text-primary">${formatPrice(o.total)}</span>
        ${renderStatusBadge(o.status)}
      </div>
    </div>
  `).join('');
}

function renderRecentNotifs() {
  const container = document.getElementById('recent-notifs');
  if (!container) return;
  const notifs = getNotifications().slice(0, 6);
  if (notifs.length === 0) {
    container.innerHTML = '<p class="text-muted text-sm">ไม่มีการแจ้งเตือน</p>';
    return;
  }
  container.innerHTML = notifs.map(n => `
    <div class="alert alert-${n.type === 'new_order' ? 'info' : n.type === 'call_staff' ? 'warning' : 'success'}"
         style="padding:8px 12px;font-size:0.8rem;margin-bottom:6px;">
      ${n.message}
      <span class="text-xs" style="float:right">${formatTime(n.createdAt)}</span>
    </div>
  `).join('');
}

// -------- จัดการเมนู --------
function loadMenuManagement() {
  renderAdminMenuList();
}

function renderAdminMenuList(filter) {
  const container = document.getElementById('admin-menu-list');
  if (!container) return;

  let menus = getMenus();
  if (filter) menus = menus.filter(m => m.category === filter);

  if (menus.length === 0) {
    container.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:20px">ไม่มีเมนู</td></tr>`;
    return;
  }

  container.innerHTML = menus.map(m => `
    <tr>
      <td><span style="font-size:1.5rem">${m.emoji}</span></td>
      <td>
        <div class="fw-bold">${m.name}</div>
        <div class="text-muted text-xs">${m.description}</div>
        <div style="display:flex;gap:4px;margin-top:4px">${renderMenuTags(m.tags)}</div>
      </td>
      <td>${m.category}</td>
      <td class="fw-bold text-primary">${formatPrice(m.price)}</td>
      <td>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
          <input type="checkbox" ${m.available ? 'checked' : ''}
            onchange="toggleMenuAvailability('${m.id}');renderAdminMenuList()">
          <span class="text-sm">${m.available ? 'พร้อม' : 'หมด'}</span>
        </label>
      </td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm btn-outline" onclick="openEditMenu('${m.id}')">✏️ แก้ไข</button>
          <button class="btn btn-sm btn-danger" onclick="confirmDeleteMenu('${m.id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// เปิด Modal เพิ่ม/แก้ไขเมนู
function openAddMenu() {
  editingMenuId = null;
  document.getElementById('menu-modal-title').textContent = 'เพิ่มเมนูใหม่';
  document.getElementById('menu-form').reset();
  document.getElementById('menu-category').innerHTML = MENU_CATEGORIES.map(c =>
    `<option value="${c}">${c}</option>`
  ).join('');
  document.getElementById('menu-modal').style.display = 'flex';
}

function openEditMenu(id) {
  const menu = getMenuById(id);
  if (!menu) return;
  editingMenuId = id;
  document.getElementById('menu-modal-title').textContent = 'แก้ไขเมนู';
  document.getElementById('menu-name').value = menu.name;
  document.getElementById('menu-price').value = menu.price;
  document.getElementById('menu-description').value = menu.description;
  document.getElementById('menu-emoji').value = menu.emoji;
  document.getElementById('menu-available').checked = menu.available;
  document.getElementById('menu-category').innerHTML = MENU_CATEGORIES.map(c =>
    `<option value="${c}" ${c === menu.category ? 'selected' : ''}>${c}</option>`
  ).join('');
  // Tags
  const tagChecks = document.querySelectorAll('.tag-check');
  tagChecks.forEach(cb => {
    cb.checked = menu.tags.includes(cb.value);
  });
  document.getElementById('menu-modal').style.display = 'flex';
}

function closeMenuModal() {
  document.getElementById('menu-modal').style.display = 'none';
  editingMenuId = null;
}

function saveMenuForm() {
  const name = document.getElementById('menu-name').value.trim();
  const price = document.getElementById('menu-price').value;
  const description = document.getElementById('menu-description').value.trim();
  const emoji = document.getElementById('menu-emoji').value.trim() || '🍽️';
  const category = document.getElementById('menu-category').value;
  const available = document.getElementById('menu-available').checked;
  const tags = Array.from(document.querySelectorAll('.tag-check:checked')).map(cb => cb.value);

  if (!name || !price || !category) {
    showToast('กรุณากรอกข้อมูลให้ครบ', 'warning');
    return;
  }

  const data = { name, price: Number(price), description, emoji, category, available, tags };

  if (editingMenuId) {
    updateMenu(editingMenuId, data);
    showToast('แก้ไขเมนูสำเร็จ ✅', 'success');
  } else {
    addMenu(data);
    showToast('เพิ่มเมนูสำเร็จ ✅', 'success');
  }

  closeMenuModal();
  renderAdminMenuList();
}

function confirmDeleteMenu(id) {
  const menu = getMenuById(id);
  if (!menu) return;
  if (confirm(`ยืนยันลบเมนู "${menu.name}"?`)) {
    deleteMenu(id);
    showToast('ลบเมนูแล้ว', 'success');
    renderAdminMenuList();
  }
}

// -------- จัดการออเดอร์ (Admin) --------
function loadOrderManagement() {
  renderAdminOrders();
}

function renderAdminOrders(statusFilter) {
  const container = document.getElementById('admin-orders-table');
  if (!container) return;

  let orders = getOrders().slice().reverse();
  if (statusFilter) orders = orders.filter(o => o.status === statusFilter);

  if (orders.length === 0) {
    container.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding:20px">ไม่มีออเดอร์</td></tr>`;
    return;
  }

  container.innerHTML = orders.map(o => `
    <tr>
      <td class="fw-bold">${o.id.slice(-6)}</td>
      <td class="fw-bold text-primary">โต๊ะ ${o.tableId}</td>
      <td>${o.items.map(i => `${i.emoji}${i.menuName} x${i.qty}`).join(', ')}</td>
      <td class="fw-bold">${formatPrice(o.total)}</td>
      <td>${renderStatusBadge(o.status)}</td>
      <td>
        <span class="badge ${o.paymentStatus === 'paid' ? 'badge-paid' : 'badge-pending'}">
          ${o.paymentStatus === 'paid' ? '💳 ชำระแล้ว' : '⏳ ค้างชำระ'}
        </span>
      </td>
      <td>
        <select class="form-select" style="font-size:0.78rem;padding:4px 8px;width:auto"
          onchange="adminUpdateStatus('${o.id}', this.value)">
          ${Object.entries(ORDER_STATUS).map(([k, v]) =>
    `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v.icon} ${v.label}</option>`
  ).join('')}
        </select>
      </td>
    </tr>
  `).join('');
}

function adminUpdateStatus(orderId, status) {
  updateOrderStatus(orderId, status);
  showToast(`อัพเดทสถานะ: ${ORDER_STATUS[status]?.label}`, 'success');
  renderAdminOrders();
}

// -------- หน้าการแจ้งปัญหา --------
function loadReportsPage() {
  renderReportsList();
}

function renderReportsList() {
  const container = document.getElementById('reports-list');
  if (!container) return;

  const reports = getReports();
  if (reports.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p class="empty-text">ไม่มีรายการแจ้งปัญหา</p></div>`;
    return;
  }

  container.innerHTML = reports.map(r => `
    <div class="card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span class="badge ${r.status === 'open' ? 'badge-pending' : r.status === 'in_progress' ? 'badge-confirmed' : 'badge-paid'}">
              ${r.status === 'open' ? '🔴 ใหม่' : r.status === 'in_progress' ? '🟡 กำลังแก้ไข' : '🟢 แก้ไขแล้ว'}
            </span>
            <span class="text-xs text-muted">${formatDateTime(r.createdAt)}</span>
          </div>
          <p class="fw-bold" style="margin-bottom:4px">${r.description}</p>
          <p class="text-sm text-muted">โต๊ะ: ${r.tableId || '-'} | แจ้งโดย: ${r.submittedBy}</p>
          ${r.resolution ? `<div class="alert alert-success" style="margin-top:8px;padding:6px 10px;font-size:0.8rem">✅ การแก้ไข: ${r.resolution}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
          ${r.status !== 'resolved' ? `
            <button class="btn btn-sm btn-outline" onclick="openResolveModal('${r.id}')">✏️ แก้ไข</button>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function openResolveModal(reportId) {
  document.getElementById('resolve-report-id').value = reportId;
  document.getElementById('resolve-modal').style.display = 'flex';
}

function closeResolveModal() {
  document.getElementById('resolve-modal').style.display = 'none';
}

function submitResolve() {
  const id = document.getElementById('resolve-report-id').value;
  const resolution = document.getElementById('resolve-text').value.trim();
  const status = document.getElementById('resolve-status').value;

  if (!resolution) { showToast('กรุณากรอกรายละเอียดการแก้ไข', 'warning'); return; }

  updateReport(id, { status, resolution });
  showToast('บันทึกการแก้ไขแล้ว ✅', 'success');
  closeResolveModal();
  renderReportsList();
}

// -------- ยอดขาย --------
function loadSalesPage() {
  const sales = getSalesReport();

  setEl('sales-total', formatPrice(sales.total));
  setEl('sales-count', `${sales.count} ออเดอร์`);

  // เมนูขายดี
  const topContainer = document.getElementById('top-menus-list');
  if (topContainer) {
    if (sales.topMenus.length === 0) {
      topContainer.innerHTML = '<p class="text-muted">ยังไม่มีข้อมูล</p>';
    } else {
      topContainer.innerHTML = sales.topMenus.map((m, i) => `
        <div class="order-item-row" style="padding:8px 0">
          <div><span class="fw-bold">${i + 1}. ${m.name}</span></div>
          <div>
            <span class="text-muted text-sm">${m.qty} จาน | </span>
            <span class="fw-bold text-primary">${formatPrice(m.total)}</span>
          </div>
        </div>
      `).join('');
    }
  }

  // ยอดขายตามวัน
  const dayContainer = document.getElementById('daily-sales-list');
  if (dayContainer) {
    const days = Object.entries(sales.byDay).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7);
    if (days.length === 0) {
      dayContainer.innerHTML = '<p class="text-muted">ยังไม่มีข้อมูล</p>';
    } else {
      dayContainer.innerHTML = days.map(([date, data]) => `
        <div class="order-item-row" style="padding:8px 0">
          <span>${new Date(date).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          <div>
            <span class="text-muted text-sm">${data.count} ออเดอร์ | </span>
            <span class="fw-bold text-primary">${formatPrice(data.total)}</span>
          </div>
        </div>
      `).join('');
    }
  }
}

// -------- จัดการผู้ใช้ --------
function loadUsersPage() {
  const container = document.getElementById('users-list');
  if (!container) return;

  const users = getUsers();
  container.innerHTML = users.map(u => `
    <tr>
      <td class="fw-bold">${u.name}</td>
      <td>${u.username}</td>
      <td>${u.email || '-'}</td>
      <td>
        <span class="badge ${u.role === 'admin' ? 'badge-confirmed' : u.role === 'staff' ? 'badge-cooking' : 'badge-served'}">
          ${getRoleLabel(u.role)}
        </span>
      </td>
      <td>${new Date(u.createdAt).toLocaleDateString('th-TH')}</td>
      <td>
        ${u.role !== 'admin' ? `<button class="btn btn-sm btn-danger" onclick="deleteUserConfirm('${u.id}')">ลบ</button>` : '-'}
      </td>
    </tr>
  `).join('');
}

function deleteUserConfirm(id) {
  if (confirm('ยืนยันลบผู้ใช้นี้?')) {
    const users = getUsers().filter(u => u.id !== id);
    saveUsers(users);
    showToast('ลบผู้ใช้แล้ว', 'success');
    loadUsersPage();
  }
}

// -------- QR Codes Page --------
function loadQRPage() {
  renderAllQRCodes('qr-codes-grid');
}

// -------- Toast Notification --------
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span style="font-size:1rem">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function createToastContainer() {
  const el = document.createElement('div');
  el.id = 'toast-container';
  el.className = 'toast-container';
  document.body.appendChild(el);
  return el;
}

// -------- Helper --------
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// -------- Auto-refresh สำหรับ Admin --------
let adminRefreshTimer;
function startAdminRefresh() {
  adminRefreshTimer = setInterval(() => {
    if (adminCurrentPage === 'dashboard') loadDashboard();
    if (adminCurrentPage === 'orders') renderAdminOrders();
  }, 10000); // refresh ทุก 10 วินาที
}

function stopAdminRefresh() {
  clearInterval(adminRefreshTimer);
}
