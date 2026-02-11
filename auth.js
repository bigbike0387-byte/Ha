// ====================================================
// auth.js - ระบบสมาชิก: Login, Register, Logout
// จัดการบทบาท: admin, staff, customer
// ====================================================

// -------- เก็บข้อมูลผู้ใช้เริ่มต้น (ตัวอย่าง) --------
const DEFAULT_USERS = [
  {
    id: 'u001',
    username: 'admin',
    password: 'admin123',
    name: 'ผู้ดูแลระบบ',
    role: 'admin',
    email: 'admin@restaurant.com',
    createdAt: new Date().toISOString()
  },
  {
    id: 'u002',
    username: 'staff',
    password: 'staff123',
    name: 'พนักงานห้องครัว',
    role: 'staff',
    email: 'staff@restaurant.com',
    createdAt: new Date().toISOString()
  }
];

// -------- เริ่มต้นข้อมูลผู้ใช้ถ้ายังไม่มี --------
function initUsers() {
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(DEFAULT_USERS));
  }
}

// -------- ดึงรายชื่อผู้ใช้ทั้งหมด --------
function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '[]');
}

// -------- บันทึกรายชื่อผู้ใช้ --------
function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

// -------- ดึงข้อมูลผู้ใช้ที่ login อยู่ --------
function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem('currentUser') || 'null');
}

// -------- บันทึกผู้ใช้ที่ login --------
function setCurrentUser(user) {
  sessionStorage.setItem('currentUser', JSON.stringify(user));
}

// -------- ตรวจสอบว่า login อยู่หรือไม่ --------
function isLoggedIn() {
  return getCurrentUser() !== null;
}

// -------- ตรวจสอบบทบาทของผู้ใช้ --------
function hasRole(role) {
  const user = getCurrentUser();
  if (!user) return false;
  return user.role === role;
}

// -------- Login ด้วย username + password --------
function login(username, password) {
  initUsers();
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    const safeUser = { ...user };
    delete safeUser.password; // ไม่เก็บรหัสผ่านใน session
    setCurrentUser(safeUser);
    return { success: true, user: safeUser };
  }
  return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
}

// -------- สมัครสมาชิกใหม่ --------
function register(data) {
  initUsers();
  const users = getUsers();

  // ตรวจสอบ username ซ้ำ
  if (users.find(u => u.username === data.username)) {
    return { success: false, message: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' };
  }

  const newUser = {
    id: 'u' + Date.now(),
    username: data.username,
    password: data.password,
    name: data.name || data.username,
    role: data.role || 'customer',
    email: data.email || '',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  // Auto login หลังสมัคร
  const safeUser = { ...newUser };
  delete safeUser.password;
  setCurrentUser(safeUser);

  return { success: true, user: safeUser };
}

// -------- Logout --------
function logout() {
  sessionStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

// -------- Redirect ตามบทบาทหลัง Login --------
function redirectByRole(user) {
  switch (user.role) {
    case 'admin':
      window.location.href = 'admin.html';
      break;
    case 'staff':
      window.location.href = 'staff.html';
      break;
    default:
      // customer - ไปหน้า login พร้อม QR หรือหน้าเลือกโต๊ะ
      window.location.href = 'customer.html?table=1';
  }
}

// -------- ป้องกันการเข้าถึงหน้าโดยไม่มีสิทธิ์ --------
// เรียกใช้ที่หัวไฟล์ HTML ที่ต้องการป้องกัน
function requireAuth(requiredRole) {
  initUsers();
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  if (requiredRole && !hasRole(requiredRole)) {
    const user = getCurrentUser();
    alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
    redirectByRole(user);
    return false;
  }
  return true;
}

// -------- ป้องกันลูกค้าที่สแกน QR --------
// ลูกค้าไม่จำเป็นต้อง login (เข้าผ่าน QR โดยตรง)
function requireTable() {
  const params = new URLSearchParams(window.location.search);
  const table = params.get('table');
  if (!table) {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;
        font-family:Sarabun,sans-serif;text-align:center;padding:20px;">
        <div>
          <div style="font-size:3rem;">🍽️</div>
          <h2 style="color:#1A73E8;margin:12px 0 8px;">กรุณาสแกน QR Code</h2>
          <p style="color:#757575;">สแกน QR Code ที่โต๊ะของคุณเพื่อสั่งอาหาร</p>
        </div>
      </div>`;
    return null;
  }
  return table;
}

// -------- ดึงหมายเลขโต๊ะจาก URL --------
function getTableFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('table') || '1';
}

// -------- อัพเดทโปรไฟล์ผู้ใช้ --------
function updateUserProfile(updates) {
  const current = getCurrentUser();
  if (!current) return false;

  const users = getUsers();
  const idx = users.findIndex(u => u.id === current.id);
  if (idx === -1) return false;

  Object.assign(users[idx], updates);
  if (updates.password) users[idx].password = updates.password;
  saveUsers(users);

  const safeUser = { ...users[idx] };
  delete safeUser.password;
  setCurrentUser(safeUser);
  return true;
}

// -------- แสดงชื่อบทบาทเป็นภาษาไทย --------
function getRoleLabel(role) {
  const labels = {
    admin: 'ผู้ดูแลระบบ',
    staff: 'พนักงาน/ครัว',
    customer: 'ลูกค้า'
  };
  return labels[role] || role;
}

// -------- เริ่มต้นระบบ --------
initUsers();
