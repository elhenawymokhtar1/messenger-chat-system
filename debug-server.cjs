// خادم تشخيص لفحص المشاكل
console.log('🔍 بدء تشخيص الخادم...');

try {
  // فحص المكتبات
  console.log('📦 فحص المكتبات...');
  const express = require('express');
  console.log('✅ Express loaded');
  
  const cors = require('cors');
  console.log('✅ CORS loaded');
  
  const mysql = require('mysql2/promise');
  console.log('✅ MySQL loaded');
  
  // إنشاء التطبيق
  console.log('🚀 إنشاء التطبيق...');
  const app = express();
  const PORT = 3001;
  
  // إعداد Middleware
  console.log('⚙️ إعداد Middleware...');
  app.use(cors());
  app.use(express.json());
  
  // إعداد قاعدة البيانات
  console.log('🗄️ إعداد قاعدة البيانات...');
  const DB_CONFIG = {
    host: '193.203.168.103',
    user: 'u384034873_conversations',
    password: '0165676135Aa@A',
    database: 'u384034873_conversations',
    port: 3306
  };
  console.log('✅ إعدادات قاعدة البيانات جاهزة');
  
  // اختبار الاتصال بقاعدة البيانات
  async function testDatabase() {
    try {
      console.log('🔗 اختبار الاتصال بقاعدة البيانات...');
      const connection = await mysql.createConnection(DB_CONFIG);
      console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
      
      const [rows] = await connection.execute('SELECT 1 as test');
      console.log('✅ استعلام الاختبار نجح:', rows);
      
      await connection.end();
      console.log('✅ تم إغلاق الاتصال');
      return true;
    } catch (error) {
      console.error('❌ خطأ في قاعدة البيانات:', error.message);
      return false;
    }
  }
  
  // Routes بسيطة
  app.get('/', (req, res) => {
    console.log('📥 طلب GET /');
    res.json({ 
      success: true, 
      message: 'خادم التشخيص يعمل!',
      timestamp: new Date().toISOString()
    });
  });
  
  app.get('/test', (req, res) => {
    console.log('📥 طلب GET /test');
    res.json({ 
      success: true, 
      message: 'اختبار بسيط',
      port: PORT
    });
  });
  
  app.get('/db-test', async (req, res) => {
    console.log('📥 طلب GET /db-test');
    const dbWorking = await testDatabase();
    res.json({ 
      success: dbWorking, 
      message: dbWorking ? 'قاعدة البيانات تعمل' : 'قاعدة البيانات لا تعمل'
    });
  });
  
  // تشغيل الخادم
  console.log('🚀 محاولة تشغيل الخادم...');
  
  const server = app.listen(PORT, () => {
    console.log('🎉 ========================================');
    console.log('🎉 خادم التشخيص يعمل بنجاح!');
    console.log(`🎉 المنفذ: ${PORT}`);
    console.log(`🎉 الرابط: http://localhost:${PORT}`);
    console.log(`🎉 اختبار: http://localhost:${PORT}/test`);
    console.log(`🎉 قاعدة البيانات: http://localhost:${PORT}/db-test`);
    console.log('🎉 ========================================');
  });
  
  server.on('error', (error) => {
    console.error('❌ خطأ في تشغيل الخادم:', error.message);
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ المنفذ ${PORT} مستخدم بالفعل!`);
    }
  });
  
  // اختبار قاعدة البيانات عند البدء
  setTimeout(async () => {
    console.log('🔍 اختبار قاعدة البيانات...');
    await testDatabase();
  }, 2000);
  
} catch (error) {
  console.error('💥 خطأ عام في الخادم:', error.message);
  console.error('📍 Stack:', error.stack);
}
