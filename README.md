# 🍽️ ระบบสั่งอาหารผ่าน QR Code

ระบบสั่งอาหารแบบ QR Code สำหรับร้านอาหารขนาดเล็ก
พัฒนาด้วย HTML + CSS + JavaScript พื้นฐาน (ไม่มี Framework, ไม่มี Backend จริง)
ข้อมูลเก็บใน `localStorage` / `sessionStorage`

---

## 📁 โครงสร้างไฟล์

```
food-order-qr/
├── login.html          ← หน้า Login
├── register.html       ← หน้าสมัครสมาชิก
├── customer.html       ← หน้าลูกค้า (เข้าผ่าน QR)
├── staff.html          ← หน้าครัว/พนักงาน
├── admin.html          ← หน้าแอดมิน
├── css/
│   └── style.css       ← สไตล์ทั้งหมด (ธีมฟ้า/เหลือง)
├── js/
│   ├── auth.js         ← ระบบสมาชิก Login/Logout
│   ├── menu.js         ← จัดการเมนูอาหาร
│   ├── order.js        ← ออเดอร์ ตะกร้า แชท
│   ├── admin.js        ← ฟังก์ชันสำหรับ Admin
│   └── qr.js           ← สร้าง QR Code
└── README.md
```

---

## 🚀 วิธีเปิดใช้งาน

### วิธีที่ 1: เปิดตรง (ง่ายที่สุด)
1. แตกไฟล์ ZIP ออกมา
2. ดับเบิ้ลคลิกที่ `login.html`
3. ระบบจะเปิดใน Browser ทันที

> ⚠️ **หมายเหตุ**: ฟีเจอร์ QR Code ต้องใช้ผ่าน Web Server จึงจะสร้าง URL ถูกต้อง

### วิธีที่ 2: ใช้ Live Server (แนะนำ)
1. ติดตั้ง [VS Code](https://code.visualstudio.com/)
2. ติดตั้ง Extension **Live Server**
3. เปิดโฟลเดอร์ `food-order-qr` ใน VS Code
4. คลิกขวาที่ `login.html` → **Open with Live Server**
5. Browser จะเปิดที่ `http://127.0.0.1:5500/login.html`

### วิธีที่ 3: Python Web Server
```bash
cd food-order-qr
python -m http.server 8000
```
เปิด Browser ที่ `http://localhost:8000/login.html`

---

## 🔑 บัญชีทดสอบ

| บทบาท | Username | Password |
|-------|----------|----------|
| 👑 Admin | `admin` | `admin123` |
| 👨‍🍳 พนักงาน/ครัว | `staff` | `staff123` |

---

## 📱 วิธีสร้าง QR Code สำหรับโต๊ะ

1. Login ด้วยบัญชี Admin
2. ไปที่เมนู **📱 QR โต๊ะ**
3. ระบบจะแสดง QR Code สำหรับโต๊ะ 1-10
4. คลิกปุ่ม **🖨️ พิมพ์** เพื่อพิมพ์ใส่กระดาษ หรือ **📋 คัดลอก URL** เพื่อส่งให้ลูกค้า
5. นำ QR Code ไปติดที่โต๊ะในร้าน

### URL รูปแบบ QR Code
```
http://[your-server]/customer.html?table=1
http://[your-server]/customer.html?table=2
...
```

---

## 🔄 ผังการทำงาน (Workflow)

```
ลูกค้าสแกน QR Code
        ↓
เปิดหน้า customer.html?table=X
        ↓
เลือกเมนู → เพิ่มลงตะกร้า
        ↓
กรอกหมายเหตุ (ไม่บังคับ)
        ↓
กดสั่งอาหาร → สร้างออเดอร์
        ↓
[หน้าครัว staff.html]
พนักงานเห็นออเดอร์ใหม่ → กดยืนยัน
        ↓
เปลี่ยนสถานะ: กำลังทำ → พร้อมเสิร์ฟ → เสิร์ฟแล้ว
        ↓
[หน้าลูกค้า]
เห็นสถานะอัพเดทอัตโนมัติ
        ↓
กดชำระเงิน (เงินสด / โอน)
        ↓
ออเดอร์เป็น "ชำระแล้ว" → บันทึกยอดขาย
```

---

## 🗂️ ฟีเจอร์แต่ละหน้า

### 📱 customer.html (หน้าลูกค้า)
- [x] รับเลขโต๊ะจาก URL parameter
- [x] แสดงเมนูแยกหมวดหมู่
- [x] ค้นหาเมนู / กรองตามหมวด
- [x] เพิ่ม/ลดจำนวนในตะกร้า
- [x] หมายเหตุถึงครัว
- [x] Timeline สถานะออเดอร์
- [x] ระบบแชทกับครัว
- [x] เรียกพนักงาน
- [x] ชำระเงิน (เงินสด/โอน)
- [x] แจ้งปัญหา
- [x] ข้อมูลไม่หายเมื่อ refresh (sessionStorage)

### 👨‍🍳 staff.html (หน้าครัว)
- [x] เห็นออเดอร์ Real-time (refresh ทุก 4 วินาที)
- [x] กรองออเดอร์ตามสถานะ
- [x] เปลี่ยนสถานะด้วยปุ่มเดียว
- [x] แจ้งเตือนเสียงเมื่อมีออเดอร์ใหม่
- [x] แจ้งเตือนเมื่อลูกค้าเรียกพนักงาน
- [x] แชทกับลูกค้า
- [x] ข้อความสำเร็จรูปสำหรับครัว

### 👑 admin.html (หน้าแอดมิน)
- [x] Dashboard สถิติประจำวัน
- [x] จัดการเมนู (เพิ่ม/แก้ไข/ลบ)
- [x] ป้ายกำกับพิเศษ (ยอดนิยม, ใหม่, เผ็ด, มังสวิรัติ)
- [x] ดูและอัพเดทออเดอร์ทั้งหมด
- [x] สร้างและพิมพ์ QR Code สำหรับโต๊ะ
- [x] ศูนย์รับแจ้งปัญหา + บันทึกการแก้ไข
- [x] รายงานยอดขายรายวัน
- [x] เมนูขายดี Top 5
- [x] จัดการผู้ใช้
- [x] เครื่องมือทดสอบ (สร้างออเดอร์จำลอง)

---

## 🗄️ โครงสร้างข้อมูล (localStorage)

### users
```json
[{ "id": "u001", "username": "admin", "name": "ผู้ดูแลระบบ", "role": "admin" }]
```

### menus
```json
[{ "id": "m001", "name": "ข้าวผัดกะเพราไก่", "price": 60, "category": "ข้าวและเส้น", "emoji": "🍳", "tags": ["popular"], "available": true }]
```

### orders
```json
[{ "id": "ord...", "tableId": "1", "items": [...], "total": 120, "status": "cooking", "paymentStatus": "unpaid" }]
```

### notifications
```json
[{ "id": "n...", "type": "new_order|call_staff|chat|menu_change", "message": "...", "read": false }]
```

### reports
```json
[{ "id": "rep...", "tableId": "2", "description": "...", "status": "open|in_progress|resolved" }]
```

### chat_{orderId}
```json
[{ "id": "msg...", "sender": "customer|staff|system", "senderName": "...", "text": "...", "time": "..." }]
```

---

## 🎨 ธีมและสี

| ชื่อ | HEX | ใช้สำหรับ |
|------|-----|-----------|
| Primary Blue | `#1A73E8` | หัวข้อ ปุ่มหลัก |
| Primary Dark | `#1558B0` | Hover state |
| Accent Yellow | `#F9A825` | ไฮไลท์ แจ้งเตือน |
| Success | `#2E7D32` | สถานะสำเร็จ |
| Danger | `#C62828` | ลบ ผิดพลาด |
| Background | `#FAFAFA` | พื้นหลัง |

---

## 📝 หมายเหตุ

- ระบบใช้ `localStorage` เก็บข้อมูลในเครื่องเท่านั้น ข้อมูลจะหายเมื่อล้าง browser cache
- ใช้ `sessionStorage` สำหรับตะกร้าและข้อมูลของแต่ละแท็บ
- หน้าต่างหลายอันในเครื่องเดียวกันจะใช้ข้อมูล localStorage ร่วมกัน
- สำหรับระบบจริงควรใช้ Backend API เช่น Node.js + MongoDB

---

## 👨‍🎓 ผลิตโดย: นักเรียน ม.3
วิชา: เทคโนโลยีสารสนเทศ
