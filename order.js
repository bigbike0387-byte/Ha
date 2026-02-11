// ====================================================
// order.js - จัดการออเดอร์, ตะกร้า, สถานะ, ชำระเงิน
// ====================================================

// -------- สถานะออเดอร์ (ตามลำดับ) --------
const ORDER_STATUS = {
  pending: { label: 'รอยืนยัน', icon: '⏳', badge: 'badge-pending' },
  confirmed: { label: 'ยืนยันแล้ว', icon: '✅', badge: 'badge-confirmed' },
  cooking: { label: 'กำลังทำ', icon: '👨‍🍳', badge: 'badge-cooking' },
  ready: { label: 'พร้อมเสิร์ฟ', icon: '🔔', badge: 'badge-ready' },
  served: { label: 'เสิร์ฟแล้ว', icon: '✨', badge: 'badge-served' },
  paid: { label: 'ชำระแล้ว', icon: '💳', badge: 'badge-paid' },
  cancelled: { label: 'ยกเลิก', icon: '❌', badge: 'badge-cancelled' }
};

// -------- วิธีชำระเงิน --------
const PAYMENT_METHODS = {
  cash: { label: 'เงินสด', icon: '💵' },
  transfer: { label: 'โอนเงิน', icon: '📲' }
};

// -------- ตะกร้าสินค้า (session) --------
function getCart(tableId) {
  const key = `cart_table_${tableId}`;
  return JSON.parse(sessionStorage.getItem(key) || '{}');
}

function saveCart(tableId, cart) {
  sessionStorage.setItem(`cart_table_${tableId}`, JSON.stringify(cart));
}

// -------- เพิ่มสินค้าในตะกร้า --------
function addToCart(tableId, menuId) {
  const cart = getCart(tableId);
  cart[menuId] = (cart[menuId] || 0) + 1;
  saveCart(tableId, cart);
}

// -------- ลดสินค้าในตะกร้า --------
function removeFromCart(tableId, menuId) {
  const cart = getCart(tableId);
  if (cart[menuId] > 0) cart[menuId]--;
  if (cart[menuId] === 0) delete cart[menuId];
  saveCart(tableId, cart);
}

// -------- ลบสินค้าออกจากตะกร้าทั้งหมด --------
function removeItemFromCart(tableId, menuId) {
  const cart = getCart(tableId);
  delete cart[menuId];
  saveCart(tableId, cart);
}

// -------- ล้างตะกร้า --------
function clearCart(tableId) {
  sessionStorage.removeItem(`cart_table_${tableId}`);
}

// -------- คำนวณราคารวมในตะกร้า --------
function calculateCartTotal(tableId) {
  const cart = getCart(tableId);
  const menus = getMenus();
  let total = 0;
  Object.entries(cart).forEach(([menuId, qty]) => {
    const menu = menus.find(m => m.id === menuId);
    if (menu) total += menu.price * qty;
  });
  return total;
}

// -------- นับจำนวนรายการในตะกร้า --------
function getCartCount(tableId) {
  const cart = getCart(tableId);
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

// -------- ดึงออเดอร์ทั้งหมด --------
function getOrders() {
  return JSON.parse(localStorage.getItem('orders') || '[]');
}

// -------- บันทึกออเดอร์ --------
function saveOrders(orders) {
  localStorage.setItem('orders', JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent('ordersUpdated'));
}

// -------- ดึงออเดอร์ตามโต๊ะ --------
function getOrdersByTable(tableId) {
  return getOrders().filter(o => o.tableId == tableId);
}

// -------- ดึงออเดอร์ที่ active ของโต๊ะ --------
function getActiveOrderByTable(tableId) {
  return getOrders().find(o =>
    o.tableId == tableId &&
    !['paid', 'cancelled'].includes(o.status)
  ) || null;
}

// -------- ดึงออเดอร์ตาม ID --------
function getOrderById(orderId) {
  return getOrders().find(o => o.id === orderId) || null;
}

// -------- สร้างออเดอร์ใหม่ --------
function createOrder(tableId, cartItems, note, customerName) {
  const orders = getOrders();
  const menus = getMenus();

  // สร้างรายการสินค้าพร้อมราคา
  const items = Object.entries(cartItems).map(([menuId, qty]) => {
    const menu = menus.find(m => m.id === menuId);
    return {
      menuId,
      menuName: menu ? menu.name : 'ไม่พบเมนู',
      emoji: menu ? menu.emoji : '🍽️',
      price: menu ? menu.price : 0,
      qty,
      subtotal: menu ? menu.price * qty : 0
    };
  });

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  const newOrder = {
    id: 'ord' + Date.now(),
    tableId: String(tableId),
    customerName: customerName || `โต๊ะ ${tableId}`,
    items,
    note: note || '',
    total,
    status: 'pending',
    paymentMethod: null,
    paymentStatus: 'unpaid',
    callStaff: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusHistory: [
      { status: 'pending', time: new Date().toISOString(), note: 'สร้างออเดอร์' }
    ]
  };

  orders.push(newOrder);
  saveOrders(orders);
  clearCart(tableId);

  // สร้างห้องแชทสำหรับออเดอร์นี้
  initChatRoom(newOrder.id, tableId);

  // เพิ่มการแจ้งเตือนให้ครัว
  addOrderNotification(newOrder);

  return newOrder;
}

// -------- อัพเดทสถานะออเดอร์ --------
function updateOrderStatus(orderId, newStatus, note) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return false;

  order.status = newStatus;
  order.updatedAt = new Date().toISOString();
  order.statusHistory.push({
    status: newStatus,
    time: new Date().toISOString(),
    note: note || ''
  });

  saveOrders(orders);

  // แจ้งเตือนลูกค้าเมื่อสถานะเปลี่ยน
  addStatusNotification(order);

  return true;
}

// -------- บันทึกการชำระเงิน --------
function processPayment(orderId, method) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return false;

  order.paymentMethod = method;
  order.paymentStatus = 'paid';
  order.status = 'paid';
  order.paidAt = new Date().toISOString();
  order.updatedAt = new Date().toISOString();
  order.statusHistory.push({
    status: 'paid',
    time: new Date().toISOString(),
    note: `ชำระด้วย${PAYMENT_METHODS[method]?.label || method}`
  });

  saveOrders(orders);
  return true;
}

// -------- เรียกพนักงาน --------
function callStaff(tableId) {
  const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  notifications.unshift({
    id: 'n' + Date.now(),
    type: 'call_staff',
    tableId: String(tableId),
    message: `⚡ โต๊ะ ${tableId} เรียกพนักงาน`,
    createdAt: new Date().toISOString(),
    read: false
  });
  localStorage.setItem('notifications', JSON.stringify(notifications));
}

// -------- เพิ่มการแจ้งเตือนออเดอร์ใหม่ --------
function addOrderNotification(order) {
  const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  notifications.unshift({
    id: 'n' + Date.now(),
    type: 'new_order',
    orderId: order.id,
    tableId: order.tableId,
    message: `🆕 ออเดอร์ใหม่ โต๊ะ ${order.tableId} - ฿${order.total}`,
    createdAt: new Date().toISOString(),
    read: false
  });
  localStorage.setItem('notifications', JSON.stringify(notifications));
}

// -------- เพิ่มการแจ้งเตือนสถานะออเดอร์ --------
function addStatusNotification(order) {
  const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  const statusInfo = ORDER_STATUS[order.status];
  notifications.unshift({
    id: 'n' + Date.now(),
    type: 'status_change',
    orderId: order.id,
    tableId: order.tableId,
    message: `${statusInfo?.icon || ''} ออเดอร์โต๊ะ ${order.tableId}: ${statusInfo?.label || order.status}`,
    createdAt: new Date().toISOString(),
    read: false
  });
  localStorage.setItem('notifications', JSON.stringify(notifications));
}

// -------- ดึงการแจ้งเตือนทั้งหมด --------
function getNotifications() {
  return JSON.parse(localStorage.getItem('notifications') || '[]');
}

// -------- นับการแจ้งเตือนที่ยังไม่ได้อ่าน --------
function getUnreadNotifCount() {
  return getNotifications().filter(n => !n.read).length;
}

// -------- ทำเครื่องหมายอ่านแล้ว --------
function markNotificationsRead() {
  const notifs = getNotifications().map(n => ({ ...n, read: true }));
  localStorage.setItem('notifications', JSON.stringify(notifs));
}

// -------- ระบบแชท --------

// เริ่มต้นห้องแชท
function initChatRoom(orderId, tableId) {
  const key = `chat_${orderId}`;
  if (!localStorage.getItem(key)) {
    const initMsg = {
      id: 'msg' + Date.now(),
      sender: 'system',
      senderName: 'ระบบ',
      text: `🍽️ เปิดแชทสำหรับออเดอร์โต๊ะ ${tableId}`,
      time: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify([initMsg]));
  }
}

// ดึงข้อความแชท
function getChatMessages(orderId) {
  return JSON.parse(localStorage.getItem(`chat_${orderId}`) || '[]');
}

// ส่งข้อความแชท
function sendChatMessage(orderId, sender, senderName, text) {
  const msgs = getChatMessages(orderId);
  const newMsg = {
    id: 'msg' + Date.now(),
    sender,
    senderName,
    text,
    time: new Date().toISOString()
  };
  msgs.push(newMsg);
  localStorage.setItem(`chat_${orderId}`, JSON.stringify(msgs));

  // แจ้งเตือนฝั่งตรงข้าม
  const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  notifications.unshift({
    id: 'n' + Date.now(),
    type: 'chat',
    orderId,
    sender,
    message: `💬 ${senderName}: ${text.substring(0, 40)}`,
    createdAt: new Date().toISOString(),
    read: false
  });
  localStorage.setItem('notifications', JSON.stringify(notifications));

  return newMsg;
}

// -------- ระบบรายงานปัญหา --------
function getReports() {
  return JSON.parse(localStorage.getItem('reports') || '[]');
}

function saveReports(reports) {
  localStorage.setItem('reports', JSON.stringify(reports));
}

function addReport(data) {
  const reports = getReports();
  const newReport = {
    id: 'rep' + Date.now(),
    tableId: data.tableId || '',
    orderId: data.orderId || '',
    type: data.type || 'general',
    description: data.description,
    submittedBy: data.submittedBy || 'ลูกค้า',
    status: 'open',
    resolution: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  reports.unshift(newReport);
  saveReports(reports);
  return newReport;
}

function updateReport(id, data) {
  const reports = getReports();
  const idx = reports.findIndex(r => r.id === id);
  if (idx === -1) return false;
  Object.assign(reports[idx], data);
  reports[idx].updatedAt = new Date().toISOString();
  saveReports(reports);
  return true;
}

// -------- สรุปยอดขาย --------
function getSalesReport() {
  const orders = getOrders().filter(o => o.paymentStatus === 'paid');
  const total = orders.reduce((sum, o) => sum + o.total, 0);
  const count = orders.length;

  // จัดกลุ่มตามวัน
  const byDay = {};
  orders.forEach(o => {
    const day = o.paidAt ? o.paidAt.split('T')[0] : o.createdAt.split('T')[0];
    if (!byDay[day]) byDay[day] = { total: 0, count: 0 };
    byDay[day].total += o.total;
    byDay[day].count++;
  });

  // เมนูขายดี
  const menuSales = {};
  orders.forEach(o => {
    o.items.forEach(item => {
      if (!menuSales[item.menuName]) menuSales[item.menuName] = { qty: 0, total: 0 };
      menuSales[item.menuName].qty += item.qty;
      menuSales[item.menuName].total += item.subtotal;
    });
  });

  const topMenus = Object.entries(menuSales)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5)
    .map(([name, data]) => ({ name, ...data }));

  return { total, count, byDay, topMenus };
}

// -------- แสดง badge สถานะ --------
function renderStatusBadge(status) {
  const info = ORDER_STATUS[status] || { label: status, icon: '?', badge: '' };
  return `<span class="badge ${info.badge}">${info.icon} ${info.label}</span>`;
}

// -------- แปลงเวลาเป็นข้อความ --------
function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) +
    ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function formatPrice(n) {
  return '฿' + Number(n).toLocaleString('th-TH');
}
