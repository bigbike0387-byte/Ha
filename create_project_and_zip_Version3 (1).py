#!/usr/bin/env python3
# สคริปต์สร้างโปรเจค food-order-qr และบีบเป็น ZIP (ครบทุกไฟล์)
# ใช้: python create_project_and_zip.py
# ผลลัพธ์: โฟลเดอร์ food-order-qr และไฟล์ food-order-qr.zip
import os
import zipfile
from pathlib import Path

PROJECT_DIR = "food-order-qr"

# ไฟล์ทั้งหมด (HTML, CSS, JS, images)
FILES = {
"login.html": """<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Login — Food QR</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="bg">
  <main class="container auth-card">
    <h1 class="brand">FoodQR</h1>
    <form id="loginForm">
      <label>อีเมลหรือยูสเนม
        <input id="loginUser" required>
      </label>
      <label>รหัสผ่าน
        <input id="loginPass" type="password" required>
      </label>
      <div class="row gap">
        <button type="submit" class="btn primary">เข้าสู่ระบบ</button>
        <a href="register.html" class="btn outline">ลงทะเบียน</a>
      </div>
    </form>
    <p class="muted">หรือสแกน QR ที่โต๊ะ → จะไปที่หน้าลูกค้า (guest)</p>
  </main>

  <script src="js/auth.js"></script>
  <script>
    // ถ้าล็อกอินสำเร็จแล้วจะรีไดเรกต์ตามสิทธิ์
    document.getElementById('loginForm').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const id = document.getElementById('loginUser').value.trim();
      const pw = document.getElementById('loginPass').value;
      const ok = auth.login(id,pw);
      if(!ok){ alert('ข้อมูลไม่ถูกต้อง'); return; }
      const user = auth.currentUser();
      if(user.role === 'admin') location.href='admin.html';
      else if(user.role === 'staff') location.href='staff.html';
      else location.href='customer.html';
    });
  </script>
</body>
</html>
""",

"register.html": """<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Register — Food QR</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="bg">
  <main class="container auth-card">
    <h1 class="brand">สมัครสมาชิก</h1>
    <form id="regForm">
      <label>ชื่อ-สกุล
        <input id="regName" required>
      </label>
      <label>อีเมล/ยูสเนม
        <input id="regUser" required>
      </label>
      <label>รหัสผ่าน
        <input id="regPass" type="password" required>
      </label>
      <label>บทบาท
        <select id="regRole">
          <option value="customer">ลูกค้า</option>
          <option value="staff">พนักงาน (staff)</option>
          <option value="admin">แอดมิน</option>
        </select>
      </label>
      <div class="row gap">
        <button class="btn primary" type="submit">ลงทะเบียน</button>
        <a href="login.html" class="btn outline">กลับหน้า Login</a>
      </div>
    </form>
  </main>

  <script src="js/auth.js"></script>
  <script>
    document.getElementById('regForm').addEventListener('submit',(e)=>{
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const user = document.getElementById('regUser').value.trim();
      const pass = document.getElementById('regPass').value;
      const role = document.getElementById('regRole').value;
      const ok = auth.register({name,username:user,password:pass,role});
      if(!ok){ alert('มีผู้ใช้ซ้ำ'); return; }
      alert('สมัครสำเร็จ! ไปล็อกอิน');
      location.href = 'login.html';
    });
  </script>
</body>
</html>
""",

"customer.html": """<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Customer — Food QR</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="bg-light">
  <header class="topbar">
    <div class="brand">FoodQR</div>
    <div id="tableInfo" class="muted"></div>
    <div>
      <button id="btnLogin" class="btn small">Login</button>
      <button id="btnLogout" class="btn small outline">Logout</button>
    </div>
  </header>

  <main class="container">
    <section class="grid cols-2" id="menuSection">
      <aside>
        <h2>เมนู</h2>
        <div id="categories" class="chips"></div>
        <div id="menuList"></div>
      </aside>

      <aside>
        <h2>ตะกร้า</h2>
        <div id="cartList" class="card"></div>
        <div class="row between">
          <div>หมายเหตุถึงครัว</div>
          <input id="orderNote" placeholder="เช่น ไม่ใส่พริก">
        </div>
        <div class="row between">
          <div class="muted">เรียกพนักงาน</div>
          <button id="callStaff" class="btn warn">เรียก</button>
        </div>
        <div class="row between">
          <div>รวม</div>
          <div id="totalPrice">0 ฿</div>
        </div>
        <div class="row gap">
          <button id="placeOrder" class="btn primary">สั่งอาหาร</button>
          <button id="payBtn" class="btn outline">ชำระ / จำลอง</button>
        </div>
        <hr/>
        <h3>สถานะออเดอร์</h3>
        <div id="ordersStatus"></div>

        <hr/>
        <h3>แชทกับครัว</h3>
        <div id="chatBox" class="chat-box"></div>
        <div class="row gap">
          <input id="chatInput" placeholder="ข้อความถึงครัว">
          <button id="chatSend" class="btn">ส่ง</button>
        </div>
      </aside>
    </section>
  </main>

  <script src="js/auth.js"></script>
  <script src="js/menu.js"></script>
  <script src="js/order.js"></script>
  <script src="js/qr.js"></script>
  <script>
    // อ่านพาราม table จาก URL
    const params = new URLSearchParams(location.search);
    const table = params.get('table') || 'guest';
    document.getElementById('tableInfo').textContent = 'โต๊ะ: ' + table;

    // ถ้ามี session user ให้แสดงชื่อ/ปุ่ม
    function updateAuthUI(){
      const u = auth.currentUser();
      if(u){ document.getElementById('btnLogin').style.display='none'; document.getElementById('btnLogout').style.display='inline-block'; }
      else{ document.getElementById('btnLogin').style.display='inline-block'; document.getElementById('btnLogout').style.display='none'; }
    }
    updateAuthUI();
    document.getElementById('btnLogin').addEventListener('click', ()=> location.href = 'login.html');
    document.getElementById('btnLogout').addEventListener('click', ()=> { auth.logout(); updateAuthUI(); });

    // โหลดเมนูและ cart & สถานะ
    menu.renderMenu('menuList','categories');
    order.initCustomer(table);
    order.renderCart();
    order.renderOrdersStatus();

    // Call staff (create notification)
    document.getElementById('callStaff').addEventListener('click', ()=>{
      order.callStaff(table);
      alert('เรียกพนักงานแล้ว');
    });

    // สั่งอาหาร
    document.getElementById('placeOrder').addEventListener('click', async ()=>{
      const note = document.getElementById('orderNote').value;
      const created = order.placeOrder(table,note);
      if(created){ alert('สั่งสำเร็จ'); order.renderCart(); order.renderOrdersStatus(); }
      else alert('ตะกร้าว่าง');
    });

    // ชำระเงินจำลอง
    document.getElementById('payBtn').addEventListener('click', ()=>{
      const paid = order.payLastUnpaid(table);
      if(paid) alert('ชำระเรียบร้อย');
      else alert('ไม่มีออเดอร์ที่รอชำระ');
      order.renderOrdersStatus();
    });

    // แชท
    document.getElementById('chatSend').addEventListener('click', ()=>{
      const txt = document.getElementById('chatInput').value.trim();
      if(!txt) return;
      order.sendMessage(table, txt, 'customer');
      document.getElementById('chatInput').value='';
      order.renderChat(table);
    });
    order.renderChat(table);

    // รับ event เมื่อ storage เปลี่ยน (real-time ข้ามแท็บ)
    window.addEventListener('storage', ()=> {
      menu.renderMenu('menuList','categories');
      order.renderOrdersStatus();
      order.renderChat(table);
    });
  </script>
</body>
</html>
""",

"staff.html": """<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Staff — Food QR</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="bg-light">
  <header class="topbar">
    <div class="brand">ครัว — FoodQR</div>
    <div>
      <button id="logout" class="btn small outline">Logout</button>
    </div>
  </header>

  <main class="container">
    <section>
      <h2>ออเดอร์เรียลไทม์</h2>
      <div id="ordersList"></div>

      <hr/>
      <h3>แจ้งปัญหา / เรียกพนักงาน</h3>
      <div id="reportsList"></div>
    </section>
  </main>

  <script src="js/auth.js"></script>
  <script src="js/order.js"></script>
  <script>
    // ป้องกันการเข้าถึง ถ้าไม่ใช่ staff/ admin รีไดเรก��์หน้า login
    const u = auth.currentUser();
    if(!u || (u.role!=='staff' && u.role!=='admin')) location.href='login.html';

    document.getElementById('logout').addEventListener('click', ()=>{
      auth.logout(); location.href='login.html';
    });

    function render(){
      order.renderOrdersForStaff('ordersList');
      order.renderReports('reportsList');
    }
    render();
    // อัปเดตแบบเรียลไทม์
    window.addEventListener('storage', render);
    setInterval(render,2000);
  </script>
</body>
</html>
""",

"admin.html": """<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Admin — Food QR</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="bg">
  <header class="topbar">
    <div class="brand">Admin — FoodQR</div>
    <div>
      <button id="logout" class="btn small outline">Logout</button>
    </div>
  </header>

  <main class="container">
    <section class="grid cols-2">
      <div>
        <h2>จัดการเมนู</h2>
        <form id="menuForm" class="card">
          <label>ชื่อเมนู<input id="m_name" required></label>
          <label>ราคา<input id="m_price" type="number" required></label>
          <label>หมวดหมู่<input id="m_cat"></label>
          <label>แท็กพิเศษ (คั่นด้วย ,)<input id="m_tags"></label>
          <div class="row gap">
            <button class="btn primary" id="addMenu">เพิ่ม/อัปเดต</button>
            <button class="btn outline" type="button" id="clearMenu">ล้าง</button>
          </div>
        </form>
        <div id="menuAdminList"></div>
      </div>

      <div>
        <h2>ยอดขาย / รายงาน</h2>
        <div id="salesReport" class="card"></div>
        <h3>ศูนย์รับแจ้งปัญหา</h3>
        <div id="adminReports"></div>
      </div>
    </section>

    <!-- QR container จะแสดงรายการ QR และปุ่มพิมพ์/ดาวน์โหลด -->
    <section style="margin-top:16px">
      <h2>QR สำหรับโต๊ะ (พิมพ์ / ดาวน์โหลด)</h2>
      <div id="qrContainer"></div>
    </section>
  </main>

  <script src="js/auth.js"></script>
  <script src="js/menu.js"></script>
  <script src="js/admin.js"></script>
  <script src="js/order.js"></script>
  <script src="js/qr.js"></script>
  <script>
    const u = auth.currentUser();
    if(!u || u.role!=='admin') location.href='login.html';
    document.getElementById('logout').addEventListener('click', ()=> { auth.logout(); location.href='login.html'; });

    // เมนูฟอร์ม
    document.getElementById('addMenu').addEventListener('click', (e)=>{
      e.preventDefault();
      const item = {
        name: document.getElementById('m_name').value.trim(),
        price: parseFloat(document.getElementById('m_price').value),
        category: document.getElementById('m_cat').value.trim()||'ทั่วไป',
        tags: document.getElementById('m_tags').value.split(',').map(s=>s.trim()).filter(Boolean)
      };
      menu.addOrUpdate(item);
      menu.renderAdminList('menuAdminList');
      menu.renderMenu('',''); // notify customers via storage event
      alert('บันทึกเมนูแล้ว แจ้งลูกค้าเรียบร้อย');
    });

    document.getElementById('clearMenu').addEventListener('click', ()=>{
      document.getElementById('m_name').value='';
      document.getElementById('m_price').value='';
      document.getElementById('m_cat').value='';
      document.getElementById('m_tags').value='';
    });

    // โหลดข้อมูล
    menu.renderAdminList('menuAdminList');
    admin.renderSales('salesReport');
    order.renderReports('adminReports');

    window.addEventListener('storage', ()=>{
      menu.renderAdminList('menuAdminList');
      admin.renderSales('salesReport');
      order.renderReports('adminReports');
    });

    // แสดงรายการ QR โดยอัตโนมัติ (ตัวอย่าง 10 โต๊ะ)
    // เรียกใช้ฟังก์ชันใน js/qr.js
    document.addEventListener('DOMContentLoaded', ()=>{
      // แสดง QR สำหรับโต๊ะ 1..10
      if(window.renderTableQRs) renderTableQRs('qrContainer', 10, location.origin);
    });
  </script>
</body>
</html>
""",

"css/style.css": """/* โทน: ฟ้าและเหลือง, พื้นหลังขาว/เทาอ่อน */
/* รีเซตเล็กน้อย */
:root{
  --bg:#f7f8fa;
  --card:#ffffff;
  --muted:#6b7280;
  --primary:#0ea5e9; /* ฟ้า */
  --accent:#fbbf24; /* เหลือง */
  --danger:#ef4444;
  --glass: rgba(255,255,255,0.6);
  --radius:10px;
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
}
*{box-sizing:border-box}
html,body{height:100%;margin:0;background:var(--bg);color:#0f172a}
.container{max-width:1100px;margin:18px auto;padding:16px}
.topbar{display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:var(--card);border-radius:10px;box-shadow:0 2px 6px rgba(2,6,23,0.06)}
.brand{font-weight:700;color:var(--primary);font-size:20px}
.auth-card{max-width:420px;margin:60px auto;padding:20px;background:var(--card);border-radius:12px;box-shadow:0 6px 24px rgba(2,6,23,0.06)}
.bg{background:#fff}
.bg-light{background:linear-gradient(0deg,#fff,#f7f8fa)}

label{display:block;margin:8px 0;color:#0b1220}
input,select,textarea{width:100%;padding:10px;border-radius:8px;border:1px solid #e6e9ef;background:transparent}
.btn{padding:8px 12px;border-radius:8px;border:0;cursor:pointer;background:var(--card)}
.btn.primary{background:linear-gradient(90deg,var(--primary),#0284c7);color:white}
.btn.warn{background:linear-gradient(90deg,var(--accent),#f59e0b);color:#042c3a}
.btn.outline{background:transparent;border:1px solid #d1d5db}
.btn.small{padding:6px 8px;font-size:13px}
.row{display:flex;align-items:center}
.row.gap{gap:8px}
.row.between{display:flex;justify-content:space-between;align-items:center}
.muted{color:var(--muted);font-size:13px}
.grid{display:grid;gap:16px}
.cols-2{grid-template-columns:1fr 380px}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
.chips button{padding:6px 8px;border-radius:999px;border:1px solid #e5e7eb;background:white}
.card{background:var(--card);padding:12px;border-radius:10px;box-shadow:0 2px 8px rgba(2,6,23,0.04);}

.menu-item{display:flex;justify-content:space-between;padding:8px;border-radius:8px;border-bottom:1px dashed #eef2f7}
.cart-item{display:flex;justify-content:space-between;padding:6px;border-bottom:1px solid #f1f5f9}
.chat-box{height:160px;overflow:auto;background:#fbfdff;padding:8px;border-radius:8px;border:1px solid #eef2f7}
.order-card{padding:10px;border-radius:8px;margin:8px 0;border:1px solid #eef2f7}
.status-badge{padding:6px 8px;border-radius:999px;background:#e6f6ff;color:#036;display:inline-block;font-size:12px}
.small-muted{font-size:12px;color:var(--muted)}
@media(max-width:900px){
  .cols-2{grid-template-columns:1fr}
  .auth-card{margin:24px}
}
""",

"js/auth.js": """// auth.js - จัดการ register / login / session (localStorage)
// คีย์หลัก: foq_users, foq_session

const auth = (()=> {
  const USER_KEY = 'foq_users';
  const SESSION_KEY = 'foq_session';

  // โหลด users จาก localStorage
  function loadUsers(){
    const s = localStorage.getItem(USER_KEY);
    if(!s) return [];
    try { return JSON.parse(s); } catch(e){ return []; }
  }
  // บันทึก users ลง storage
  function saveUsers(u){
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    // แจ้งให้แท็บอื่นอัปเดต
    localStorage.setItem('foq_last_update', Date.now());
  }

  // ตรวจสอบว่ามี user อยู่แล้วหรือไม่ (username unique)
  function findUser(username){
    return loadUsers().find(x=> x.username === username);
  }

  // ลงทะเบียน (ไม่เข้ารหัสจริง เก็บ plain text สำหรับงานโรงเรียน)
  // คืนค่า true ถ้าสำเร็จ, false ถ้าซ้ำ
  function register({name,username,password,role='customer'}) {
    const users = loadUsers();
    if(users.some(u=>u.username === username)) return false;
    const newU = { id: 'u'+Date.now(), name, username, password, role };
    users.push(newU);
    saveUsers(users);
    return true;
  }

  // ล็อกอิน: รับ username (หรือ email) และ password
  // คืนค่า true ถ้าสำเร็จ
  function login(username,password){
    const u = findUser(username);
    if(u && u.password === password){
      // เก็บ session ใน sessionStorage (แท็บนี้)
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
      // เก็บ timestamp ใน localStorage เพื่อแจ้งแท็บอื่น
      localStorage.setItem('foq_session_update', Date.now());
      return true;
    }
    return false;
  }

  // คืน current user จาก sessionStorage
  function currentUser(){
    const s = sessionStorage.getItem(SESSION_KEY);
    if(!s) return null;
    try{ return JSON.parse(s);}catch(e){ return null; }
  }

  function logout(){
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.setItem('foq_session_update', Date.now());
  }

  // ถ้ยังไม่มี user เดิม ให้สร้าง admin ตัวอย่าง และ เมนูตัวอย่าง
  function bootstrap(){
    const users = loadUsers();
    if(users.length===0){
      users.push({id:'u1',name:'Admin',username:'admin',password:'admin',role:'admin'});
      users.push({id:'u2',name:'Staff',username:'staff',password:'staff',role:'staff'});
      saveUsers(users);
    }
  }

  bootstrap();

  return { register, login, currentUser, logout, loadUsers };
})();
""",

"js/menu.js": """// menu.js - จัดการเมนู (เก็บใน localStorage)
// โครงข้อมูล: menus = [{id,name,price,category,tags:[]}]
const menu = (()=>{
  const KEY = 'foq_menus';

  // โหลดเมนู
  function load(){
    const s = localStorage.getItem(KEY);
    if(!s) return defaultMenus();
    try { return JSON.parse(s); } catch(e){ return defaultMenus(); }
  }

  // ถ้าไม่มีเมนู ให้ใส่ตัวอย่าง
  function defaultMenus(){
    const sample = [
      {id:'m1',name:'ผัดไทย',price:80,category:'จานหลัก',tags:['แนะนำ']},
      {id:'m2',name:'ต้มยำกุ้ง',price:120,category:'ซุป',tags:[]},
      {id:'m3',name:'ข้าวผัด',price:70,category:'จานหลัก',tags:[]}
    ];
    localStorage.setItem(KEY, JSON.stringify(sample));
    return sample;
  }

  function save(list){
    localStorage.setItem(KEY, JSON.stringify(list));
    // แจ้งลูกค้า / staff ว่ามีการอัปเดตเมนู
    localStorage.setItem('foq_menu_update', Date.now());
  }

  // เพิ่มหรืออัปเดตเมนู (ถ้าชื่อซ้ำจะอัปเดต)
  function addOrUpdate({name,price,category,tags=[]}){
    const list = load();
    let item = list.find(x=>x.name === name);
    if(item){
      item.price = price; item.category = category; item.tags = tags;
    } else {
      item = { id:'m'+Date.now(), name, price, category, tags };
      list.push(item);
    }
    save(list);
  }

  function remove(id){
    const list = load().filter(x=>x.id!==id);
    save(list);
  }

  // Render สำหรับลูกค้า
  function renderMenu(containerId, catsId){
    const list = load();
    // สร้างหมวดหมู่
    const cats = [...new Set(list.map(x=>x.category || 'ทั่วไป'))];
    const cont = document.getElementById(containerId);
    const catWrap = document.getElementById(catsId);
    if(catWrap){
      catWrap.innerHTML = '';
      cats.forEach(c=>{
        const b = document.createElement('button'); b.textContent = c;
        b.onclick = ()=> {
          renderListFiltered(c);
        };
        catWrap.appendChild(b);
      });
    }
    if(cont) renderListFiltered();

    function renderListFiltered(filter){
      cont.innerHTML = '';
      const filtered = filter ? list.filter(x=>x.category===filter) : list;
      filtered.forEach(it=>{
        const div = document.createElement('div'); div.className='menu-item';
        div.innerHTML = `<div>
          <strong>${it.name}</strong><div class="small-muted">${it.category} ${it.tags && it.tags.length?(' • '+it.tags.join(',')) : ''}</div>
        </div>
        <div style="text-align:right">
          <div>${it.price} ฿</div>
          <div style="margin-top:6px">
            <button class="btn small" onclick="order.addToCart('${it.id}')">ใส่ตะกร้า</button>
          </div>
        </div>`;
        cont.appendChild(div);
      });
    }
  }

  // Render สำหรับ admin
  function renderAdminList(containerId){
    const list = load();
    const c = document.getElementById(containerId);
    if(!c) return;
    c.innerHTML = '';
    list.forEach(it=>{
      const d = document.createElement('div'); d.className='card';
      d.innerHTML = `<div class="row between"><strong>${it.name}</strong><div>${it.price} ฿</div></div>
      <div class="small-muted">${it.category} • ${it.tags.join(',')}</div>
      <div class="row gap" style="margin-top:8px">
        <button class="btn" onclick="menu.remove('${it.id}'); menu.renderAdminList('${containerId}');">ลบ</button>
      </div>`;
      c.appendChild(d);
    });
  }

  return { load, addOrUpdate, remove, renderMenu, renderAdminList };
})();
""",

"js/order.js": """// order.js - จัดการตะกร้า ออเดอร์ แชท และรายงาน
// โครงข้อมูลหลัก:
// carts: object per-table (sessionStorage) key 'foq_cart_{table}'
// orders: saved in localStorage key 'foq_orders' -> array of orders
// order = {id,table,items:[{id,qty,price,name}],status:'pending'/'cooking'/'ready'/'served',note,paid:false,createdAt, messages:[] }
// messages จะเก็บใน order.messages [{from:'customer'|'staff',text,time}]

const order = (()=>{
  const ORD_KEY = 'foq_orders';

  function loadOrders(){ const s = localStorage.getItem(ORD_KEY); return s?JSON.parse(s):[]; }
  function saveOrders(list){ localStorage.setItem(ORD_KEY, JSON.stringify(list)); localStorage.setItem('foq_orders_update', Date.now()); }

  // cart per table in sessionStorage (ไม่หายแม้รีเฟรชหน้าเดิม)
  function cartKey(table){ return 'foq_cart_'+table; }
  function initCustomer(table){
    if(!sessionStorage.getItem(cartKey(table))){
      sessionStorage.setItem(cartKey(table), JSON.stringify([]));
    }
  }

  // เพิ่มเมนูลงตะกร้า
  function addToCart(menuId){
    const menus = menu.load();
    const m = menus.find(x=>x.id===menuId); if(!m) return;
    const params = new URLSearchParams(location.search);
    const table = params.get('table') || 'guest';
    const key = cartKey(table);
    const cart = JSON.parse(sessionStorage.getItem(key) || '[]');
    const found = cart.find(x=>x.id===m.id);
    if(found) found.qty++;
    else cart.push({id:m.id,name:m.name,price:m.price,qty:1});
    sessionStorage.setItem(key, JSON.stringify(cart));
    // แจ้งแท็บอื่น (ไม่จำเป็นแต่ใช้เป็นสัญญาณ)
    localStorage.setItem('foq_cart_update_'+table, Date.now());
    renderCart();
  }

  // แสดงตะกร้า
  function renderCart(){
    const params = new URLSearchParams(location.search);
    const table = params.get('table') || 'guest';
    const key = cartKey(table);
    const cart = JSON.parse(sessionStorage.getItem(key) || '[]');
    const el = document.getElementById('cartList');
    if(!el) return;
    if(cart.length===0){ el.innerHTML = '<div class="small-muted">ตะกร้าว่าง</div>'; document.getElementById('totalPrice').textContent='0 ฿'; return; }
    el.innerHTML = '';
    let total = 0;
    cart.forEach(it=>{
      total += it.price * it.qty;
      const d = document.createElement('div'); d.className='cart-item';
      d.innerHTML = `<div>${it.name} x${it.qty}</div><div>${it.price*it.qty} ฿</div>`;
      el.appendChild(d);
    });
    document.getElementById('totalPrice').textContent = total + ' ฿';
  }

  // สร้าง Order จาก cart
  function placeOrder(table,note=''){
    const key = cartKey(table);
    const cart = JSON.parse(sessionStorage.getItem(key) || '[]');
    if(!cart || cart.length===0) return false;
    const orders = loadOrders();
    const id = 'o'+Date.now();
    const o = { id, table, items:cart, status:'pending', note, paid:false, createdAt:Date.now(), messages:[] };
    orders.push(o);
    saveOrders(orders);
    // ล้าง cart
    sessionStorage.setItem(key, JSON.stringify([]));
    localStorage.setItem('foq_new_order_notify', JSON.stringify({orderId:id,table}));
    return true;
  }

  // เรียกพนักงาน -> สร้าง report
  function callStaff(table){
    const reports = loadReports();
    reports.push({ id:'r'+Date.now(), table, type:'call_staff', status:'open', note:'เรียกพนักงาน', createdAt:Date.now(), handledBy:null, history:[] });
    saveReports(reports);
    localStorage.setItem('foq_report_update', Date.now());
  }

  // แชท: เก็บใน order.messages
  function sendMessage(table,text,from){
    // หาออเดอร์ล่าสุดของโต๊ะ
    const orders = loadOrders();
    const ord = orders.slice().reverse().find(o=>o.table==table);
    if(!ord) {
      // ถ้ายังไม่มีออเดอร์ ให้เก็บเป็น message แบบ temp (เก็บแยก key per table)
      const mkey = 'foq_messages_'+table;
      const msgs = JSON.parse(localStorage.getItem(mkey) || '[]');
      msgs.push({from,text,time:Date.now(),orderId:null});
      localStorage.setItem(mkey, JSON.stringify(msgs));
      localStorage.setItem('foq_msg_update_'+table, Date.now());
      return;
    }
    ord.messages.push({from,text,time:Date.now()});
    saveOrders(orders);
    localStorage.setItem('foq_msg_update_'+table, Date.now());
  }

  function renderChat(table){
    const el = document.getElementById('chatBox');
    if(!el) return;
    // รวม messages จาก order ล่าสุด + messages per table (ก่อนสั่ง)
    const orders = loadOrders();
    const ord = orders.slice().reverse().find(o=>o.table==table);
    const msgs = [];
    const mkey = 'foq_messages_'+table;
    const pre = JSON.parse(localStorage.getItem(mkey) || '[]');
    if(pre.length) msgs.push(...pre);
    if(ord && ord.messages) msgs.push(...ord.messages);
    el.innerHTML = '';
    if(msgs.length===0) { el.innerHTML = '<div class="small-muted">ยังไม่มีข้อความ</div>'; return; }
    msgs.forEach(m=>{
      const d = document.createElement('div');
      d.className = 'row'; d.style.marginBottom='6px';
      d.innerHTML = `<div style="flex:1"><strong>${m.from}</strong> <div class="small-muted">${new Date(m.time).toLocaleString()}</div></div>
      <div style="flex:2">${m.text}</div>`;
      el.appendChild(d);
    });
    el.scrollTop = el.scrollHeight;
  }

  // แสดงสถานะออเดอร์ของโต๊ะ
  function renderOrdersStatus(){
    const params = new URLSearchParams(location.search);
    const table = params.get('table') || 'guest';
    const el = document.getElementById('ordersStatus');
    if(!el) return;
    const orders = loadOrders().filter(o=>o.table==table).sort((a,b)=>b.createdAt-a.createdAt);
    if(orders.length===0){ el.innerHTML = '<div class="small-muted">ยังไม่มีออเดอร์</div>'; return; }
    el.innerHTML = '';
    orders.forEach(o=>{
      const d = document.createElement('div'); d.className='order-card';
      d.innerHTML = `<div class="row between"><strong>Order ${o.id}</strong><div class="status-badge">${o.status}${o.paid? ' • ชำระแล้ว':''}</div></div>
      <div class="small-muted">เวลา: ${new Date(o.createdAt).toLocaleString()}</div>
      <div>${o.items.map(i=>`${i.name} x${i.qty}`).join('<br/>')}</div>
      <div class="small-muted">หมายเหตุ: ${o.note || '-'}</div>`;
      el.appendChild(d);
    });
  }

  // Staff side: render orders
  function renderOrdersForStaff(containerId){
    const el = document.getElementById(containerId);
    if(!el) return;
    const orders = loadOrders().sort((a,b)=>b.createdAt-a.createdAt);
    if(orders.length===0){ el.innerHTML='<div class="small-muted">ยังไม่มีออเดอร์</div>'; return; }
    el.innerHTML = '';
    orders.forEach(o=>{
      const d = document.createElement('div'); d.className='order-card';
      d.innerHTML = `<div class="row between"><strong>${o.id} — โต๊ะ ${o.table}</strong>
        <div><span class="small-muted">${new Date(o.createdAt).toLocaleString()}</span></div></div>
        <div>${o.items.map(i=>`${i.name} x${i.qty}`).join('<br/>')}</div>
        <div class="small-muted">หมายเหตุ: ${o.note || '-'}</div>
        <div class="row gap" style="margin-top:8px">
          <button class="btn" onclick="order.updateStatus('${o.id}','pending')">รอ</button>
          <button class="btn" onclick="order.updateStatus('${o.id}','cooking')">กำลังทำ</button>
          <button class="btn" onclick="order.updateStatus('${o.id}','ready')">พร้อมแล้ว</button>
          <button class="btn" onclick="order.updateStatus('${o.id}','served')">เสิร์ฟ</button>
        </div>
        <div style="margin-top:8px">
          <strong>แชท</strong>
          <div class="chat-box" id="chat_${o.id}">${(o.messages||[]).map(m=>`<div><strong>${m.from}</strong>: ${m.text}</div>`).join('')}</div>
          <div class="row gap" style="margin-top:6px">
            <input id="reply_${o.id}" placeholder="ตอบข้อความ">
            <button class="btn" onclick="order.replyOrder('${o.id}')">ส่ง</button>
          </div>
        </div>`;
      el.appendChild(d);
    });
  }

  // update status (staff/admin)
  function updateStatus(orderId,status){
    const orders = loadOrders();
    const o = orders.find(x=>x.id===orderId); if(!o) return;
    o.status = status; saveOrders(orders);
    localStorage.setItem('foq_status_change', JSON.stringify({orderId,status}));
  }

  // staff ตอบแชท ใน order
  function replyOrder(orderId){
    const input = document.getElementById('reply_'+orderId);
    if(!input) return;
    const txt = input.value.trim(); if(!txt) return;
    const orders = loadOrders();
    const o = orders.find(x=>x.id===orderId);
    if(!o) return;
    o.messages.push({from:'staff',text:txt,time:Date.now()});
    saveOrders(orders);
    input.value='';
    localStorage.setItem('foq_msg_update_'+o.table, Date.now());
  }

  // ชำระเงินจำลอง: จะค้นหาออเดอร์ล่าสุดที่ยังไม่จ่าย
  function payLastUnpaid(table){
    const orders = loadOrders();
    const ord = orders.slice().reverse().find(o=>o.table==table && !o.paid);
    if(!ord) return false;
    ord.paid = true;
    saveOrders(orders);
    return true;
  }

  // รายงาน/ปัญหา
  const REP_KEY = 'foq_reports';
  function loadReports(){ const s = localStorage.getItem(REP_KEY); return s?JSON.parse(s):[]; }
  function saveReports(list){ localStorage.setItem(REP_KEY, JSON.stringify(list)); localStorage.setItem('foq_report_update', Date.now()); }

  function reportIssue(table, type, note){
    const reps = loadReports();
    reps.push({ id:'r'+Date.now(), table, type, status:'open', note, createdAt:Date.now(), history:[] });
    saveReports(reps);
  }

  function renderReports(containerId){
    const el = document.getElementById(containerId);
    if(!el) return;
    const reps = loadReports().slice().reverse();
    if(reps.length===0){ el.innerHTML = '<div class="small-muted">ไม่มีรายงาน</div>'; return; }
    el.innerHTML = '';
    reps.forEach(r=>{
      const d = document.createElement('div'); d.className='card';
      d.innerHTML = `<div class="row between"><strong>${r.type} — โต๊ะ ${r.table}</strong><div class="small-muted">${r.status}</div></div>
      <div class="small-muted">${new Date(r.createdAt).toLocaleString()}</div>
      <div>${r.note}</div>`;
      el.appendChild(d);
    });
  }

  // สำหรับ admin: คืนยอดขาย
  function salesReport(){
    const orders = loadOrders();
    const paid = orders.filter(o=>o.paid);
    const total = paid.reduce((s,o)=> s + o.items.reduce((t,i)=> t + i.price * i.qty,0),0);
    const byDate = {};
    paid.forEach(o=>{
      const d = new Date(o.createdAt).toLocaleDateString();
      byDate[d] = (byDate[d]||0) + o.items.reduce((t,i)=> t + i.price * i.qty,0);
    });
    return { total, count: paid.length, byDate };
  }

  // สำหรับ admin view reports
  function renderReportsForAdmin(containerId){
    const el = document.getElementById(containerId);
    if(!el) return;
    const rep = loadReports();
    if(rep.length===0) { el.innerHTML='<div class="small-muted">ไม่มีรายงาน</div>'; return; }
    el.innerHTML = '';
    rep.forEach(r=>{
      const d = document.createElement('div'); d.className='card';
      d.innerHTML = `<div class="row between"><strong>${r.type} — โต๊ะ ${r.table}</strong><div>${r.status}</div></div>
      <div>${r.note}</div>
      <div class="row gap" style="margin-top:8px">
        <button class="btn" onclick="order.handleReport('${r.id}')">ทำเครื่องหมายแก้ไขแล้ว</button>
      </div>`;
      el.appendChild(d);
    });
  }

  function handleReport(id){
    const reps = loadReports();
    const r = reps.find(x=>x.id===id); if(!r) return;
    r.status = 'resolved'; r.history.push({by: auth.currentUser()?auth.currentUser().username:'admin', at:Date.now()});
    saveReports(reps);
    localStorage.setItem('foq_report_update', Date.now());
  }

  // export ฟังก์ชันที่ใช้จากภายนอก
  return {
    initCustomer, addToCart, renderCart, placeOrder, callStaff, sendMessage, renderChat,
    renderOrdersStatus, renderOrdersForStaff, updateStatus, replyOrder, payLastUnpaid,
    reportIssue, renderReports, salesReport, renderReportsForAdmin, handleReport
  };
})();
""",

"js/admin.js": """// admin.js - ฟังก์ชันช่วยสำหรับหน้า admin (รายงานยอดขาย)
const admin = (()=>{
  function renderSales(containerId){
    const el = document.getElementById(containerId);
    if(!el) return;
    const s = order.salesReport();
    el.innerHTML = `<div class="card"><div class="row between"><div><strong>ยอดขายรวม</strong><div class="small-muted">จำนวนบิลที่ชำระ: ${s.count}</div></div><div style="text-align:right"><div style="font-size:20px;color:var(--primary)">${s.total} ฿</div></div></div>
    <hr/>
    <div><strong>แยกตามวัน</strong></div>
    <div>${Object.entries(s.byDate).map(([d,v])=>`<div class="row between"><div>${d}</div><div>${v} ฿</div></div>`).join('')}</div></div>`;
  }

  return { renderSales };
})();
""",

"js/qr.js": """// qr.js - สร้างลิงก์ / QR code สำหรับแต่ละโต๊ะ (ใช้ Google Chart API สร้างรูป QR)
// ฟังก์ชันช่วยสำหรับ admin พิมพ์ QR สำหรับติดโต๊ะ

// สร้าง URL และ QR image สำหรับโต๊ะที่กำหนด
// คืนค่า { url, qrUrl }
function generateTableQR(table, host){
  // host ควรเป็น url จริง เช่น http://localhost:8000
  const url = `${host.replace(/\\/$/,'')}/customer.html?table=${encodeURIComponent(table)}`;
  // ใช้ Google Chart API (ต้องต่ออินเทอร์เน็ต) สร้างรูป QR
  const qrUrl = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(url)}`;
  return { url, qrUrl };
}

// แสดงรายการ QR ใน container (เช่น หน้าแอดมินให้พิมพ์ หรือ export)
// - containerId: id ของ element ที่จะใส่ผลลัพธ์
// - tables: array ของหมายเลข/ชื่อโต๊ะ หรือจำนวน (ถ้าเป็น number จะสร้าง 1..n)
// - host: พื้นฐาน URL (เช่น http://localhost:8000) (default: location.origin)
// สร้างปุ่มพิมพ์และปุ่มดาวน์โหลดภาพ QR แบบรวม
function renderTableQRs(containerId, tables=10, host=location.origin){
  const cont = document.getElementById(containerId);
  if(!cont) return;
  // ถ้า tables เป็น number ให้สร้าง array 1..n
  let tableList = Array.isArray(tables) ? tables : Array.from({length:tables},(_,i)=> (i+1).toString());
  cont.innerHTML = '';
  // สร้าง header ปุ่ม
  const header = document.createElement('div'); header.className='row gap';
  const btnPrint = document.createElement('button'); btnPrint.className='btn'; btnPrint.textContent='พิมพ์ QR ทั้งหมด';
  const btnDownload = document.createElement('button'); btnDownload.className='btn outline'; btnDownload.textContent='ดาวน์โหลด ZIP รูป';
  header.appendChild(btnPrint); header.appendChild(btnDownload);
  cont.appendChild(header);

  const grid = document.createElement('div'); grid.style.display='grid'; grid.style.gridTemplateColumns='repeat(auto-fit,minmax(180px,1fr))'; grid.style.gap='12px'; grid.style.marginTop='12px';
  cont.appendChild(grid);

  const imagesForZip = []; // เก็บข้อมูลรูป (url, filename)

  tableList.forEach(t => {
    const info = generateTableQR(t, host);
    const box = document.createElement('div'); box.className='card';
    box.style.textAlign='center';
    box.innerHTML = `<div style="font-weight:700;margin-bottom:8px">โต๊ะ ${t}</div>
      <img src="${info.qrUrl}" alt="QR ${t}" width="160" height="160" style="border-radius:8px;border:1px solid #eef2f7"/>
      <div class="small-muted" style="margin-top:8px;word-break:break-all">${info.url}</div>
      <div style="margin-top:8px" class="row gap">
        <a class="btn small" href="${info.qrUrl}" target="_blank" download="qr_table_${t}.png">เปิดภาพ</a>
        <a class="btn small outline" href="${info.url}" target="_blank">ทดสอบ</a>
      </div>`;
    grid.appendChild(box);
    imagesForZip.push({url: info.qrUrl, filename: `qr_table_${t}.png`});
  });

  // พิมพ์: สร้างหน้าต่างใหม่ที่มีภาพทั้งหมดแล้วเรียก print()
  btnPrint.addEventListener('click', ()=>{
    const win = window.open('','_blank','width=800,height=600');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Print QR</title>
      <style>body{font-family:Arial; padding:20px; background:#fff} .item{display:inline-block;margin:12px;text-align:center}</style>
      </head><body>
      ${tableList.map(t=>{
        const info = generateTableQR(t, host);
        return `<div class="item"><div style="font-weight:700">โต๊ะ ${t}</div><img src="${info.qrUrl}" width="240" height="240"/><div style="word-break:break-all">${info.url}</div></div>`;
      }).join('')}
      <script>window.onload=()=>{ setTimeout(()=>{ window.print(); },300); }</script>
      </body></html>`;
    win.document.write(html);
    win.document.close();
  });

  // ดาวน์โหลด ZIP รูป: เราจะรวบรวมลิงก์ภาพและเปิดแต่ละลิงก์ลงในแท็บใหม่
  // หมายเห���ุ: การสร้าง ZIP จริงต้อง backend หรือการดาวน์โหลดรูปแล้ว zip ผ่าน server/ไคลเอนต์เพิ่มเติม
  // ที่นี่ให้เป็นฟังก์ชันช่วยดาวน์โหลดทีละรูป (ผู้ใช้สามารถบันทึกภาพรวม)
  btnDownload.addEventListener('click', ()=>{
    imagesForZip.forEach(img=>{
      // เปิดแต่ละรูปในแท็บใหม่เพื่อให้ผู้ใช้บันทึก (browser อาจบล็อก popup ถ้าไม่ได้เป็น interaction)
      window.open(img.url,'_blank');
    });
    alert('เปิดภาพ QR หลายแท็บ — ให้บันทึกทีละภาพ (หากต้องการ ZIP ให้รันสคริปต์ Python ในเครื่องของคุณ)');
  });
}

// ฟังก์ชันช่วย: คืน QR สำหรับโต๊ะเดียว (public)
window.generateTableQR = generateTableQR;
window.renderTableQRs = renderTableQRs;
""",

"images/logo.svg": """<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80" viewBox="0 0 240 80">
  <rect width="240" height="80" rx="12" fill="#0ea5e9"/>
  <text x="24" y="48" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#fff" font-weight="700">FoodQR</text>
  <circle cx="196" cy="40" r="18" fill="#fbbf24"/>
  <text x="188" y="46" font-family="Arial" font-size="16" fill="#042c3a">QR</text>
</svg>
""",
}

# --- helper functions to write files and zip project ---

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def write_file(path, content):
    ensure_dir(os.path.dirname(path))
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def create_project():
    print("สร้างโฟลเดอร์โครงการ และเขียนไฟล์...")
    base = Path(PROJECT_DIR)
    ensure_dir(str(base / "css"))
    ensure_dir(str(base / "js"))
    ensure_dir(str(base / "images"))
    for rel, content in FILES.items():
        p = base / rel
        write_file(str(p), content)
        print("เขียน:", p)
    print("สร้างไฟล์เสร็จแล้ว")

def zip_project():
    zip_name = PROJECT_DIR + ".zip"
    print("บีบเป็น:", zip_name)
    with zipfile.ZipFile(zip_name, "w", zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(PROJECT_DIR):
            for file in files:
                filepath = os.path.join(root, file)
                arcname = os.path.relpath(filepath, start=os.path.dirname(PROJECT_DIR))
                z.write(filepath, arcname=arcname)
    print("สร้างไฟล์ ZIP เสร็จ:", zip_name)
    return zip_name

if __name__ == "__main__":
    create_project()
    zip_path = zip_project()
    print(f"""
เรียบร้อย:
- โฟลเดอร์โครงการ: {PROJECT_DIR}
- ไฟล์ ZIP: {zip_path}

วิธีใช้งาน:
1) รันเว็บเซิร์ฟเวอร์ในโฟลเดอร์นี้:
   cd {PROJECT_DIR}
   python -m http.server 8000
2) เปิดเบราว์เซอร์: http://localhost:8000/login.html
ผู้ใช้ตัวอย่าง: admin/admin , staff/staff

หากต้องการปรับจำนวนโต๊ะในหน้า admin ให้แก้พารามิเตอร์ใน admin.html: renderTableQRs('qrContainer', 10, location.origin)
""")