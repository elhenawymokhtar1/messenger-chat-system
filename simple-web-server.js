// خادم ويب بسيط لخدمة صفحة الاختبار
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 8080;

// إعداد CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// خدمة الملفات الثابتة
app.use(express.static('.'));

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-send-message.html'));
});

// بدء الخادم
app.listen(PORT, () => {
  console.log(`🌐 خادم الويب يعمل على: http://localhost:${PORT}`);
  console.log(`📄 صفحة الاختبار: http://localhost:${PORT}/test-send-message.html`);
  console.log(`🔗 الصفحة الرئيسية: http://localhost:${PORT}/`);
});
