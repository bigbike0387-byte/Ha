// ====================================================
// menu.js - จัดการข้อมูลเมนูอาหาร
// หมวดหมู่, ป้ายพิเศษ, เพิ่ม/แก้ไข/ลบเมนู
// ====================================================

// -------- ข้อมูลเมนูเริ่มต้น --------
const DEFAULT_MENUS = [
  {
    id: 'm001',
    name: 'ข้าวผัดกะเพราไก่',
    description: 'กะเพราสด ไข่ดาว รสจัดจ้าน',
    price: 60,
    category: 'ข้าวและเส้น',
    emoji: '🍳',
    tags: ['popular', 'spicy'],
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'm002',
    name: 'ต้มยำกุ้ง',
    description: 'กุ้งสดใหญ่ น้ำใส/น้ำข้น เผ็ดร้อน',
    price: 120,
    category: 'ซุปและน้ำแกง',
    emoji: '🍲',
    tags: ['hot', 'popular'],
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'm003',
    name: 'ผัดไทยกุ้งสด',
    description: 'เส้นจันท์ กุ้งใหญ่ ถั่วงอก หน่อไม้ฝรั่ง',
    price: 90,
    category: 'ข้าวและเส้น',
    emoji: '🍜',
    tags: ['popular'],
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'm004',
    name: 'ส้มตำไทย',
    description: 'มะละกอสด กุ้งแห้ง ถั่วลิสง',
    price: 50,
    category: 'ยำและสลัด',
    emoji: '🥗',
    tags: ['spicy', 'veg'],
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'm005',
    name: 'ไก่ทอดสมุนไพร',
    description: 'ไก่ทอดกรอบ สมุนไพร ซอสพริก',
    price: 80,
    category: 'อาหารจานเดี่ยว',
    emoji: '🍗',
    tags: ['hot', 'new'],
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'm006',
    name: 'แกงเขียวหวานไก่',
    description: 'มะเขือเปราะ ใบโหระพา กะทิสด',
    price: 80,
    category: 'ซุปและน้ำแกง',
    emoji: '🫕',
    tags: ['popular'],
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'm007',
    name: 'ข้าวมันไก่',
    description: 'ไก่ต้มนุ่ม ข้าวมัน ซุปกระดูก',
    price: 65,
    category: 'ข้าวและเส้น',
    emoji: '🍚',
    tags: [],
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'm008',
    name: 'ชาไทย',
    description: 'ชาไทยหอม นมข้น เย็นชื่นใจ',
    price: 35,
    category: 'เครื่องดื่ม',
    emoji: '🧋',
    tags: ['popular'],
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'm009',
    name: 'น้ำมะนาว',
    description: 'มะนาวสด ไม่หวาน/หวานน้อย',
    price: 25,
    category: 'เครื่องดื่ม',
    emoji: '🍋',
    tags: [],
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'm010',
    name: 'กาแฟเย็น',
    description: 'กาแฟดำ นมสด น้ำตาลทรายแดง',
    price: 40,
    category: 'เครื่องดื่ม',
    emoji: '☕',
    tags: ['new'],
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'm011',
    name: 'ข้าวสวย',
    description: 'ข้าวหอมมะลิใหม่',
    price: 10,
    category: 'ข้าวและเส้น',
    emoji: '🍚',
    tags: [],
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'm012',
    name: 'ไข่เจียว',
    description: 'ไข่เจียวฟู หอมหัวใหญ่',
    price: 40,
    category: 'อาหารจานเดี่ยว',
    emoji: '🍳',
    tags: ['veg'],
    available: true,
    createdAt: new Date().toISOString()
  }
];

// -------- หมวดหมู่เมนู --------
const MENU_CATEGORIES = [
  'ข้าวและเส้น',
  'ซุปและน้ำแกง',
  'อาหารจานเดี่ยว',
  'ยำและสลัด',
  'เครื่องดื่ม',
  'ของหวาน'
];

// -------- ป้ายกำกับพิเศษ --------
const MENU_TAGS = {
  popular: { label: 'ยอดนิยม', class: 'menu-tag-popular', icon: '🔥' },
  new: { label: 'เมนูใหม่', class: 'menu-tag-new', icon: '✨' },
  hot: { label: 'เผ็ด', class: 'menu-tag-hot', icon: '🌶️' },
  veg: { label: 'มังสวิรัติ', class: 'menu-tag-veg', icon: '🥬' },
  spicy: { label: 'เผ็ดมาก', class: 'menu-tag-spicy', icon: '🔥' }
};

// -------- เริ่มต้นข้อมูลเมนู --------
function initMenus() {
  if (!localStorage.getItem('menus')) {
    localStorage.setItem('menus', JSON.stringify(DEFAULT_MENUS));
  }
}

// -------- ดึงเมนูทั้งหมด --------
function getMenus() {
  initMenus();
  return JSON.parse(localStorage.getItem('menus') || '[]');
}

// -------- บันทึกเมนู --------
function saveMenus(menus) {
  localStorage.setItem('menus', JSON.stringify(menus));
  // แจ้ง listener ว่าเมนูเปลี่ยน
  dispatchMenuChange();
}

// -------- ดึงเมนูตาม ID --------
function getMenuById(id) {
  return getMenus().find(m => m.id === id) || null;
}

// -------- ดึงเมนูที่พร้อมเสิร์ฟ --------
function getAvailableMenus() {
  return getMenus().filter(m => m.available);
}

// -------- จัดกลุ่มเมนูตามหมวด --------
function getMenusByCategory() {
  const menus = getAvailableMenus();
  const grouped = {};
  menus.forEach(m => {
    if (!grouped[m.category]) grouped[m.category] = [];
    grouped[m.category].push(m);
  });
  return grouped;
}

// -------- เพิ่มเมนูใหม่ --------
function addMenu(data) {
  const menus = getMenus();
  const newMenu = {
    id: 'm' + Date.now(),
    name: data.name,
    description: data.description || '',
    price: Number(data.price),
    category: data.category,
    emoji: data.emoji || '🍽️',
    tags: data.tags || [],
    available: data.available !== false,
    createdAt: new Date().toISOString()
  };
  menus.push(newMenu);
  saveMenus(menus);
  return newMenu;
}

// -------- แก้ไขเมนู --------
function updateMenu(id, data) {
  const menus = getMenus();
  const idx = menus.findIndex(m => m.id === id);
  if (idx === -1) return false;
  Object.assign(menus[idx], data);
  menus[idx].updatedAt = new Date().toISOString();
  saveMenus(menus);
  return true;
}

// -------- ลบเมนู --------
function deleteMenu(id) {
  const menus = getMenus().filter(m => m.id !== id);
  saveMenus(menus);
  return true;
}

// -------- เปลี่ยนสถานะเมนู (พร้อม/ไม่พร้อม) --------
function toggleMenuAvailability(id) {
  const menus = getMenus();
  const menu = menus.find(m => m.id === id);
  if (!menu) return false;
  menu.available = !menu.available;
  saveMenus(menus);

  // แจ้งเตือนลูกค้าเมื่อเมนูเปลี่ยนสถานะ
  addMenuChangeNotification(menu);
  return menu.available;
}

// -------- เพิ่มการแจ้งเตือนเมื่อเมนูเปลี่ยน --------
function addMenuChangeNotification(menu) {
  const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  notifications.unshift({
    id: 'n' + Date.now(),
    type: 'menu_change',
    message: menu.available
      ? `เมนู "${menu.name}" พร้อมสั่งได้แล้ว`
      : `เมนู "${menu.name}" หมดชั่วคราว`,
    menuId: menu.id,
    createdAt: new Date().toISOString(),
    read: false
  });
  localStorage.setItem('notifications', JSON.stringify(notifications));
}

// -------- แจ้ง event เมื่อเมนูเปลี่ยน --------
function dispatchMenuChange() {
  window.dispatchEvent(new CustomEvent('menuUpdated'));
}

// -------- ค้นหาเมนู --------
function searchMenus(keyword) {
  const menus = getAvailableMenus();
  const kw = keyword.toLowerCase();
  return menus.filter(m =>
    m.name.toLowerCase().includes(kw) ||
    m.description.toLowerCase().includes(kw) ||
    m.category.toLowerCase().includes(kw)
  );
}

// -------- สร้าง HTML สำหรับ menu tag --------
function renderMenuTags(tags) {
  if (!tags || tags.length === 0) return '';
  return tags.map(tag => {
    const info = MENU_TAGS[tag];
    if (!info) return '';
    return `<span class="menu-tag ${info.class}">${info.icon} ${info.label}</span>`;
  }).join('');
}

// -------- สร้าง HTML สำหรับ menu item --------
function renderMenuItem(menu, qty = 0) {
  const tagHtml = renderMenuTags(menu.tags);
  return `
    <div class="menu-item ${!menu.available ? 'unavailable' : ''}" data-id="${menu.id}">
      <div class="menu-item-img">${menu.emoji}</div>
      <div class="menu-item-info">
        <div class="menu-item-name">${menu.name}</div>
        <div class="menu-item-desc">${menu.description}</div>
        ${tagHtml ? `<div class="menu-item-tags">${tagHtml}</div>` : ''}
        <div class="menu-item-price">฿${menu.price}</div>
      </div>
      <div class="menu-item-actions">
        ${menu.available ? `
          <button class="qty-btn" onclick="decreaseQty('${menu.id}')" ${qty === 0 ? 'style="opacity:0.3"' : ''}>−</button>
          <span class="qty-num" id="qty-${menu.id}">${qty}</span>
          <button class="qty-btn active" onclick="increaseQty('${menu.id}')">+</button>
        ` : '<span class="text-muted text-sm">หมด</span>'}
      </div>
    </div>
  `;
}

// -------- เริ่มต้นเมนู --------
initMenus();
