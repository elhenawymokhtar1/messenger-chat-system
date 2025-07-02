#!/usr/bin/env node

/**
 * 🧪 اختبار بسيط مباشر للتحليلات
 */

import mysql from 'mysql2/promise';

// إعدادات قاعدة البيانات
const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

const COMPANY_ID = 'c677b32f-fe1c-4c64-8362-a1c03406608d';

async function testAnalytics() {
  let connection;
  
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بنجاح');

    // تحديد الفترة الزمنية (اليوم)
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = startDate;

    console.log(`📅 الفترة: ${startDate} إلى ${endDate}`);

    // 1. إحصائيات عامة
    console.log('\n📊 جلب الإحصائيات العامة...');
    const [generalStats] = await connection.execute(`
      SELECT 
        COUNT(DISTINCT CASE WHEN m.direction = 'outgoing' THEN c.user_id END) as total_customers_contacted,
        COUNT(DISTINCT CASE WHEN m.direction = 'incoming' THEN c.user_id END) as total_customers_replied,
        COUNT(CASE WHEN m.direction = 'outgoing' THEN 1 END) as total_outgoing,
        COUNT(CASE WHEN m.direction = 'incoming' THEN 1 END) as total_incoming,
        COUNT(DISTINCT c.facebook_page_id) as active_pages
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE c.company_id = ? AND DATE(m.sent_at) BETWEEN ? AND ?
    `, [COMPANY_ID, startDate, endDate]);

    const general = generalStats[0];
    const responseRate = general.total_customers_contacted > 0 
      ? ((general.total_customers_replied / general.total_customers_contacted) * 100).toFixed(1)
      : 0;

    console.log('📈 النتائج:');
    console.log(`   العملاء المراسلون: ${general.total_customers_contacted}`);
    console.log(`   العملاء الذين ردوا: ${general.total_customers_replied}`);
    console.log(`   الرسائل الصادرة: ${general.total_outgoing}`);
    console.log(`   الرسائل الواردة: ${general.total_incoming}`);
    console.log(`   معدل الرد: ${responseRate}%`);
    console.log(`   الصفحات النشطة: ${general.active_pages}`);

    // 2. معلومات الصفحات
    console.log('\n📄 جلب معلومات الصفحات...');
    const [pageInfo] = await connection.execute(`
      SELECT page_id, page_name 
      FROM facebook_settings 
      WHERE company_id = ? AND is_active = 1
    `, [COMPANY_ID]);

    console.log('📋 الصفحات النشطة:');
    pageInfo.forEach(page => {
      console.log(`   - ${page.page_name} (${page.page_id})`);
    });

    // 3. أفضل العملاء
    console.log('\n👥 أفضل العملاء تفاعلاً...');
    const [topCustomers] = await connection.execute(`
      SELECT 
        c.user_id,
        c.user_name,
        c.facebook_page_id,
        COUNT(m.id) as total_messages,
        COUNT(CASE WHEN m.direction = 'incoming' THEN 1 END) as customer_messages,
        COUNT(CASE WHEN m.direction = 'outgoing' THEN 1 END) as company_messages,
        MAX(m.sent_at) as last_message_at
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE c.company_id = ? AND DATE(m.sent_at) BETWEEN ? AND ?
      GROUP BY c.user_id, c.user_name, c.facebook_page_id
      HAVING total_messages > 0
      ORDER BY total_messages DESC
      LIMIT 5
    `, [COMPANY_ID, startDate, endDate]);

    console.log('🏆 أفضل 5 عملاء:');
    topCustomers.forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.user_name || 'عميل غير معروف'} - ${customer.total_messages} رسالة`);
    });

    // إنشاء تقرير JSON
    const report = {
      success: true,
      period: {
        start_date: startDate,
        end_date: endDate
      },
      summary: {
        total_customers_contacted: general.total_customers_contacted || 0,
        total_customers_replied: general.total_customers_replied || 0,
        total_outgoing_messages: general.total_outgoing || 0,
        total_incoming_messages: general.total_incoming || 0,
        response_rate: responseRate,
        active_pages: general.active_pages || 0
      },
      pages: pageInfo.reduce((acc, page) => {
        acc[page.page_id] = {
          page_name: page.page_name,
          customers_contacted: 0,
          customers_replied: 0,
          total_outgoing: 0,
          total_incoming: 0,
          response_rate: 0
        };
        return acc;
      }, {}),
      top_customers: topCustomers
    };

    console.log('\n🎉 تم إنشاء التقرير بنجاح!');
    console.log('\n📄 التقرير الكامل:');
    console.log(JSON.stringify(report, null, 2));

    return report;

  } catch (error) {
    console.error('❌ خطأ في التحليل:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل الاختبار
testAnalytics()
  .then(() => {
    console.log('\n✅ انتهى الاختبار بنجاح');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ فشل الاختبار:', error.message);
    process.exit(1);
  });
