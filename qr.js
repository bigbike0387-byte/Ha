// ====================================================
// qr.js - ระบบสร้าง QR Code สำหรับแต่ละโต๊ะ
// ใช้ QRCode.js library (โหลดจาก CDN)
// ====================================================

// -------- ตั้งค่าจำนวนโต๊ะ --------
const TABLE_CONFIG = {
  count: 10,  // จำนวนโต๊ะ
  prefix: 'โต๊ะ'
};

// -------- สร้าง URL สำหรับแต่ละโต๊ะ --------
function getTableURL(tableId) {
  // สร้าง URL ที่ชี้ไปหน้า customer.html พร้อม table parameter
  const base = window.location.href.replace(/[^/]*$/, '');
  return `${base}customer.html?table=${tableId}`;
}

// -------- สร้าง QR Code ด้วย QRious library --------
function generateQRCode(tableId, canvasId, size) {
  const url = getTableURL(tableId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  try {
    // ใช้ QRious สำหรับสร้าง QR Code
    if (typeof QRious !== 'undefined') {
      new QRious({
        element: canvas,
        value: url,
        size: size || 120,
        backgroundAlpha: 1,
        foreground: '#1A73E8',
        background: '#FFFFFF',
        level: 'M'
      });
    } else {
      // fallback: แสดง URL ถ้าไม่มี library
      canvas.getContext('2d').fillText('QR: ' + url, 10, 20);
    }
  } catch (e) {
    console.error('QR generate error:', e);
  }
  return url;
}

// -------- สร้างการ์ด QR Code สำหรับโต๊ะ --------
function renderQRCard(tableId) {
  const canvasId = `qr-canvas-${tableId}`;
  const url = getTableURL(tableId);

  return `
    <div class="qr-card" onclick="showQRDetail(${tableId})">
      <div class="qr-table-label">🍽️ โต๊ะที่ ${tableId}</div>
      <div class="qr-code-area">
        <canvas id="${canvasId}" width="120" height="120"></canvas>
      </div>
      <div class="qr-url">${url}</div>
      <div style="margin-top:10px;display:flex;gap:6px;justify-content:center;">
        <button class="btn btn-sm btn-outline" onclick="event.stopPropagation();printQR(${tableId})">🖨️ พิมพ์</button>
        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();copyQRUrl(${tableId}, this)">📋 คัดลอก</button>
      </div>
    </div>
  `;
}

// -------- แสดง QR ทั้งหมด --------
function renderAllQRCodes(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let html = '';
  for (let i = 1; i <= TABLE_CONFIG.count; i++) {
    html += renderQRCard(i);
  }
  container.innerHTML = html;

  // สร้าง QR หลังจาก render HTML เสร็จ
  setTimeout(() => {
    for (let i = 1; i <= TABLE_CONFIG.count; i++) {
      generateQRCode(i, `qr-canvas-${i}`, 120);
    }
  }, 100);
}

// -------- คัดลอก URL --------
function copyQRUrl(tableId, btn) {
  const url = getTableURL(tableId);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      const orig = btn.textContent;
      btn.textContent = '✅ คัดลอกแล้ว!';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    });
  } else {
    // fallback สำหรับ iOS
    const el = document.createElement('input');
    el.value = url;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    btn.textContent = '✅ คัดลอกแล้ว!';
    setTimeout(() => { btn.textContent = '📋 คัดลอก'; }, 2000);
  }
}

// -------- พิมพ์ QR Code --------
function printQR(tableId) {
  const url = getTableURL(tableId);
  const printWindow = window.open('', '_blank');

  // สร้าง canvas ชั่วคราว
  const tempCanvasId = 'temp-print-canvas';
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>QR Code โต๊ะ ${tableId}</title>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Sarabun', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fff; }
        .print-card { border: 2px solid #1A73E8; border-radius: 12px; padding: 24px; text-align: center; width: 200px; }
        h2 { color: #1A73E8; font-size: 1.2rem; margin: 0 0 12px; }
        p { font-size: 0.7rem; color: #757575; margin: 8px 0 0; word-break: break-all; }
        canvas { display: block; margin: 0 auto; }
        @media print { body { padding: 0; } }
      </style>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js"></script>
    </head>
    <body>
      <div class="print-card">
        <h2>🍽️ โต๊ะที่ ${tableId}</h2>
        <canvas id="${tempCanvasId}" width="160" height="160"></canvas>
        <p>สแกนเพื่อสั่งอาหาร</p>
        <p style="font-size:0.6rem">${url}</p>
      </div>
      <script>
        window.onload = function() {
          new QRious({
            element: document.getElementById('${tempCanvasId}'),
            value: '${url}',
            size: 160,
            foreground: '#1A73E8',
            background: '#ffffff',
            level: 'M'
          });
          setTimeout(() => window.print(), 500);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// -------- แสดง Modal รายละเอียด QR --------
function showQRDetail(tableId) {
  const url = getTableURL(tableId);
  const modal = document.getElementById('qr-detail-modal');
  if (modal) {
    document.getElementById('qr-detail-title').textContent = `QR Code โต๊ะที่ ${tableId}`;
    document.getElementById('qr-detail-url').textContent = url;
    modal.style.display = 'flex';
    setTimeout(() => {
      generateQRCode(tableId, 'qr-detail-canvas', 200);
    }, 50);
    document.getElementById('qr-detail-print').onclick = () => printQR(tableId);
    document.getElementById('qr-detail-copy').onclick = function() { copyQRUrl(tableId, this); };
    document.getElementById('qr-detail-open').onclick = () => window.open(url, '_blank');
  }
}

// -------- ปิด Modal --------
function closeQRModal() {
  const modal = document.getElementById('qr-detail-modal');
  if (modal) modal.style.display = 'none';
}
