#!/usr/bin/env node

/**
 * 📊 سيرفر التحليلات المستقل
 */

import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 3003;

// إعدادات قاعدة البيانات
const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

const pool = mysql.createPool(dbConfig);

// Middleware
app.use(cors());
app.use(express.json());

// تقرير تحليل الأداء
app.get('/api/analytics/performance', async (req, res) => {
  try {
    const { 
      company_id, 
      start_date, 
      end_date, 
      page_id,
      compare_start_date,
      compare_end_date 
    } = req.query;

    console.log(`📊 [ANALYTICS] طلب تقرير الأداء للشركة: ${company_id}`);

    if (!company_id) {
      return res.status(400).json({
        success: false,
        error: 'معرف الشركة مطلوب'
      });
    }

    // تحديد الفترة الزمنية (افتراضي: اليوم الحالي)
    const startDate = start_date || new Date().toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];

    // بناء الاستعلام الأساسي
    let whereClause = `WHERE c.company_id = ? AND DATE(m.sent_at) BETWEEN ? AND ?`;
    let params = [company_id, startDate, endDate];

    if (page_id && page_id !== 'all') {
      whereClause += ` AND c.facebook_page_id = ?`;
      params.push(page_id);
    }

    // 1. إحصائيات الرسائل الصادرة (من الشركة للعملاء)
    const [outgoingStats] = await pool.execute(`
      SELECT 
        c.facebook_page_id,
        COUNT(DISTINCT c.user_id) as customers_contacted,
        COUNT(m.id) as total_outgoing_messages
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      ${whereClause} AND m.direction = 'outgoing'
      GROUP BY c.facebook_page_id
    `, params);

    // 2. إحصائيات الرسائل الواردة (من العملاء للشركة)
    const [incomingStats] = await pool.execute(`
      SELECT 
        c.facebook_page_id,
        COUNT(DISTINCT c.user_id) as customers_replied,
        COUNT(m.id) as total_incoming_messages
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      ${whereClause} AND m.direction = 'incoming'
      GROUP BY c.facebook_page_id
    `, params);

    // 3. إحصائيات عامة
    const [generalStats] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT CASE WHEN m.direction = 'outgoing' THEN c.user_id END) as total_customers_contacted,
        COUNT(DISTINCT CASE WHEN m.direction = 'incoming' THEN c.user_id END) as total_customers_replied,
        COUNT(CASE WHEN m.direction = 'outgoing' THEN 1 END) as total_outgoing,
        COUNT(CASE WHEN m.direction = 'incoming' THEN 1 END) as total_incoming,
        COUNT(DISTINCT c.facebook_page_id) as active_pages
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      ${whereClause}
    `, params);

    // 4. توزيع الرسائل حسب الساعة
    const [hourlyDistribution] = await pool.execute(`
      SELECT 
        HOUR(m.sent_at) as hour,
        COUNT(CASE WHEN m.direction = 'incoming' THEN 1 END) as incoming_count,
        COUNT(CASE WHEN m.direction = 'outgoing' THEN 1 END) as outgoing_count
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      ${whereClause}
      GROUP BY HOUR(m.sent_at)
      ORDER BY hour
    `, params);

    // 5. أفضل العملاء تفاعلاً
    const [topCustomers] = await pool.execute(`
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
      ${whereClause}
      GROUP BY c.user_id, c.user_name, c.facebook_page_id
      HAVING total_messages > 0
      ORDER BY total_messages DESC
      LIMIT 10
    `, params);

    // 6. معلومات الصفحات
    const [pageInfo] = await pool.execute(`
      SELECT page_id, page_name 
      FROM facebook_settings 
      WHERE company_id = ? AND is_active = 1
    `, [company_id]);

    // حساب معدل الرد
    const general = generalStats[0];
    const responseRate = general.total_customers_contacted > 0 
      ? ((general.total_customers_replied / general.total_customers_contacted) * 100).toFixed(1)
      : 0;

    // تجميع البيانات حسب الصفحة
    const pageData = {};
    pageInfo.forEach(page => {
      pageData[page.page_id] = {
        page_name: page.page_name,
        customers_contacted: 0,
        customers_replied: 0,
        total_outgoing: 0,
        total_incoming: 0,
        response_rate: 0
      };
    });

    // دمج إحصائيات الرسائل الصادرة
    outgoingStats.forEach(stat => {
      if (pageData[stat.facebook_page_id]) {
        pageData[stat.facebook_page_id].customers_contacted = stat.customers_contacted;
        pageData[stat.facebook_page_id].total_outgoing = stat.total_outgoing_messages;
      }
    });

    // دمج إحصائيات الرسائل الواردة
    incomingStats.forEach(stat => {
      if (pageData[stat.facebook_page_id]) {
        pageData[stat.facebook_page_id].customers_replied = stat.customers_replied;
        pageData[stat.facebook_page_id].total_incoming = stat.total_incoming_messages;
        
        // حساب معدل الرد للصفحة
        const contacted = pageData[stat.facebook_page_id].customers_contacted;
        if (contacted > 0) {
          pageData[stat.facebook_page_id].response_rate = 
            ((stat.customers_replied / contacted) * 100).toFixed(1);
        }
      }
    });

    const result = {
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
      pages: pageData,
      hourly_distribution: hourlyDistribution,
      top_customers: topCustomers
    };

    // 7. مقارنة مع فترة سابقة (إذا طُلبت)
    if (compare_start_date && compare_end_date) {
      console.log(`📊 [ANALYTICS] إضافة مقارنة مع الفترة: ${compare_start_date} - ${compare_end_date}`);
      
      const compareParams = [company_id, compare_start_date, compare_end_date];
      if (page_id && page_id !== 'all') {
        compareParams.push(page_id);
      }

      const [compareStats] = await pool.execute(`
        SELECT 
          COUNT(DISTINCT CASE WHEN m.direction = 'outgoing' THEN c.user_id END) as total_customers_contacted,
          COUNT(DISTINCT CASE WHEN m.direction = 'incoming' THEN c.user_id END) as total_customers_replied,
          COUNT(CASE WHEN m.direction = 'outgoing' THEN 1 END) as total_outgoing,
          COUNT(CASE WHEN m.direction = 'incoming' THEN 1 END) as total_incoming
        FROM conversations c
        LEFT JOIN messages m ON c.id = m.conversation_id
        WHERE c.company_id = ? AND DATE(m.sent_at) BETWEEN ? AND ?
        ${page_id && page_id !== 'all' ? 'AND c.facebook_page_id = ?' : ''}
      `, compareParams);

      const compareData = compareStats[0];
      const compareResponseRate = compareData.total_customers_contacted > 0 
        ? ((compareData.total_customers_replied / compareData.total_customers_contacted) * 100).toFixed(1)
        : 0;

      result.comparison = {
        period: {
          start_date: compare_start_date,
          end_date: compare_end_date
        },
        summary: {
          total_customers_contacted: compareData.total_customers_contacted || 0,
          total_customers_replied: compareData.total_customers_replied || 0,
          total_outgoing_messages: compareData.total_outgoing || 0,
          total_incoming_messages: compareData.total_incoming || 0,
          response_rate: compareResponseRate
        },
        changes: {
          customers_contacted_change: ((result.summary.total_customers_contacted - compareData.total_customers_contacted) / Math.max(compareData.total_customers_contacted, 1) * 100).toFixed(1),
          customers_replied_change: ((result.summary.total_customers_replied - compareData.total_customers_replied) / Math.max(compareData.total_customers_replied, 1) * 100).toFixed(1),
          response_rate_change: (result.summary.response_rate - compareResponseRate).toFixed(1)
        }
      };
    }

    console.log(`✅ [ANALYTICS] تم إنشاء التقرير بنجاح`);
    res.json(result);

  } catch (error) {
    console.error('❌ [ANALYTICS] خطأ في إنشاء التقرير:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إنشاء التقرير',
      details: error.message
    });
  }
});

// صفحة اختبار
app.get('/', (req, res) => {
  res.json({
    message: '📊 سيرفر التحليلات يعمل بشكل مثالي!',
    endpoints: [
      'GET /api/analytics/performance?company_id=c677b32f-fe1c-4c64-8362-a1c03406608d',
      'GET /api/analytics/performance?company_id=c677b32f-fe1c-4c64-8362-a1c03406608d&start_date=2025-07-01&end_date=2025-07-01',
      'GET /api/analytics/performance?company_id=c677b32f-fe1c-4c64-8362-a1c03406608d&page_id=260345600493273',
      'GET /api/analytics/performance?company_id=c677b32f-fe1c-4c64-8362-a1c03406608d&compare_start_date=2025-06-30&compare_end_date=2025-06-30'
    ]
  });
});

// بدء الخادم
app.listen(PORT, () => {
  console.log(`🚀 Analytics API started on port ${PORT}`);
  console.log(`📊 Test URL: http://localhost:${PORT}/api/analytics/performance?company_id=c677b32f-fe1c-4c64-8362-a1c03406608d`);
  console.log(`🌐 Homepage: http://localhost:${PORT}`);
});
