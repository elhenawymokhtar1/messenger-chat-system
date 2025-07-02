#!/usr/bin/env node

/**
 * 🕐 إصلاح مشكلة التوقيت في النظام
 * يحدد المشكلة ويقترح الحلول
 */

import mysql from 'mysql2/promise';

const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  port: 3306,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function analyzeTimezoneIssue() {
  console.log('🕐 تحليل مشكلة التوقيت...\n');
  
  let connection;
  
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    
    // 1. فحص إعدادات قاعدة البيانات
    console.log('📊 إعدادات قاعدة البيانات:');
    const [dbSettings] = await connection.execute(`
      SELECT
        @@global.time_zone as global_tz,
        @@session.time_zone as session_tz,
        NOW() as db_current_time,
        UTC_TIMESTAMP() as utc_time
    `);
    
    const dbInfo = dbSettings[0];
    console.log(`- Global timezone: ${dbInfo.global_tz}`);
    console.log(`- Session timezone: ${dbInfo.session_tz}`);
    console.log(`- Database time: ${dbInfo.db_current_time}`);
    console.log(`- UTC time: ${dbInfo.utc_time}`);
    
    // 2. فحص إعدادات الخادم
    console.log('\n🖥️ إعدادات الخادم:');
    const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const serverTime = new Date();
    const cairoTime = new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' });
    
    console.log(`- Server timezone: ${serverTimezone}`);
    console.log(`- Server time: ${serverTime.toISOString()}`);
    console.log(`- Cairo time: ${cairoTime}`);
    console.log(`- Local time: ${serverTime.toLocaleString()}`);
    
    // 3. فحص أحدث الرسائل
    console.log('\n📨 تحليل أوقات الرسائل:');
    const [messages] = await connection.execute(`
      SELECT 
        id,
        sent_at,
        created_at,
        TIMESTAMPDIFF(HOUR, sent_at, NOW()) as hours_diff,
        TIMESTAMPDIFF(MINUTE, sent_at, NOW()) as minutes_diff
      FROM messages 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    messages.forEach((msg, index) => {
      console.log(`\nرسالة ${index + 1}:`);
      console.log(`- ID: ${msg.id}`);
      console.log(`- sent_at: ${msg.sent_at}`);
      console.log(`- created_at: ${msg.created_at}`);
      console.log(`- منذ ${msg.hours_diff} ساعة و ${msg.minutes_diff % 60} دقيقة`);
      
      // تحويل للتوقيت المحلي
      const sentDate = new Date(msg.sent_at);
      const localTime = sentDate.toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' });
      console.log(`- التوقيت المحلي: ${localTime}`);
    });
    
    // 4. تحليل المشكلة
    console.log('\n🔍 تحليل المشكلة:');
    
    const dbTime = new Date(dbInfo.db_current_time);
    const serverTimeUTC = new Date();
    const timeDiffHours = (serverTimeUTC.getTime() - dbTime.getTime()) / (1000 * 60 * 60);
    
    console.log(`- الفرق بين وقت الخادم وقاعدة البيانات: ${timeDiffHours.toFixed(1)} ساعة`);
    
    if (Math.abs(timeDiffHours) > 1) {
      console.log('⚠️ يوجد اختلاف كبير في التوقيت!');
    } else {
      console.log('✅ التوقيت متطابق تقريباً');
    }
    
    // 5. اقتراح الحلول
    console.log('\n💡 الحلول المقترحة:');
    console.log('1. تحديث إعدادات قاعدة البيانات لاستخدام توقيت القاهرة');
    console.log('2. تحديث الواجهة الأمامية لعرض التوقيت المحلي');
    console.log('3. توحيد معالجة التوقيت في جميع أجزاء النظام');
    
    // 6. تطبيق الإصلاحات
    console.log('\n🔧 تطبيق الإصلاحات...');
    
    // تحديث session timezone
    await connection.execute("SET time_zone = '+03:00'");
    console.log('✅ تم تحديث timezone للجلسة الحالية');
    
    // اختبار التوقيت الجديد
    const [newTime] = await connection.execute('SELECT NOW() as current_time');
    console.log(`📅 التوقيت الجديد: ${newTime[0].current_time}`);
    
  } catch (error) {
    console.error('❌ خطأ في التحليل:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// تشغيل التحليل
analyzeTimezoneIssue().catch(console.error);
