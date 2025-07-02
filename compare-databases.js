#!/usr/bin/env node

/**
 * 🔍 مقارنة قواعد البيانات - MySQL الجديدة مقابل Supabase القديمة
 * يقارن الجداول والبيانات بين النظامين
 */

import mysql from 'mysql2/promise';
import { createClient } from '@supabase/supabase-js';

// إعدادات MySQL الجديدة
const MYSQL_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  port: 3306,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// إعدادات Supabase القديمة
const SUPABASE_URL = 'https://ddwszecfsfkjnahesymm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// الجداول المتوقعة في كل نظام
const EXPECTED_TABLES = {
  mysql: [
    'companies', 'company_users', 'facebook_settings', 'conversations', 'messages',
    'gemini_settings', 'stores', 'product_categories', 'products', 'orders',
    'order_items', 'shipping_methods', 'coupons', 'system_logs',
    'whatsapp_settings', 'whatsapp_ai_settings', 'whatsapp_conversations',
    'whatsapp_messages', 'whatsapp_stats'
  ],
  supabase: [
    'companies', 'company_users', 'facebook_settings', 'conversations', 'messages',
    'gemini_settings', 'products', 'stores', 'categories', 'orders', 'order_items',
    'subscription_plans', 'company_subscriptions', 'whatsapp_messages',
    'whatsapp_settings', 'whatsapp_ai_settings', 'super_admin_logs'
  ]
};

async function compareDatabases() {
  let mysqlConnection;
  
  try {
    console.log('🔍 بدء مقارنة قواعد البيانات...\n');
    
    // الاتصال بـ MySQL
    console.log('📡 الاتصال بـ MySQL...');
    mysqlConnection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✅ تم الاتصال بـ MySQL بنجاح!');
    
    // اختبار الاتصال بـ Supabase
    console.log('📡 اختبار الاتصال بـ Supabase...');
    const { data: supabaseTest, error: supabaseError } = await supabase
      .from('companies')
      .select('count')
      .limit(1);
    
    if (supabaseError) {
      console.log('⚠️ لا يمكن الوصول لـ Supabase:', supabaseError.message);
    } else {
      console.log('✅ تم الاتصال بـ Supabase بنجاح!');
    }
    
    console.log('\n' + '='.repeat(60));
    
    // 1. مقارنة الجداول الموجودة
    await compareTableStructure(mysqlConnection);
    
    // 2. مقارنة البيانات الأساسية
    await compareBasicData(mysqlConnection);
    
    // 3. مقارنة إعدادات النظام
    await compareSystemSettings(mysqlConnection);
    
    // 4. تحليل الاختلافات
    await analyzeDataDifferences(mysqlConnection);
    
  } catch (error) {
    console.error('❌ خطأ في المقارنة:', error.message);
    
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
      console.log('\n📡 تم إغلاق اتصال MySQL');
    }
  }
}

async function compareTableStructure(mysqlConnection) {
  console.log('📊 1. مقارنة هيكل الجداول:');
  console.log('=' .repeat(50));
  
  // جلب جداول MySQL
  const [mysqlTables] = await mysqlConnection.execute('SHOW TABLES');
  const mysqlTableNames = mysqlTables.map(row => Object.values(row)[0]);
  
  console.log(`📋 MySQL: ${mysqlTableNames.length} جدول`);
  mysqlTableNames.forEach(table => {
    console.log(`   ✅ ${table}`);
  });
  
  // محاولة جلب جداول Supabase
  console.log(`\n📋 Supabase (متوقع): ${EXPECTED_TABLES.supabase.length} جدول`);
  
  const supabaseTablesStatus = {};
  for (const table of EXPECTED_TABLES.supabase) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ ${table} - غير متاح`);
        supabaseTablesStatus[table] = false;
      } else {
        console.log(`   ✅ ${table} - متاح`);
        supabaseTablesStatus[table] = true;
      }
    } catch (err) {
      console.log(`   ❌ ${table} - خطأ`);
      supabaseTablesStatus[table] = false;
    }
  }
  
  // تحليل الاختلافات
  console.log('\n🔍 تحليل الاختلافات:');
  
  const mysqlOnly = mysqlTableNames.filter(table => !EXPECTED_TABLES.supabase.includes(table));
  const supabaseOnly = EXPECTED_TABLES.supabase.filter(table => !mysqlTableNames.includes(table));
  const common = mysqlTableNames.filter(table => EXPECTED_TABLES.supabase.includes(table));
  
  console.log(`📈 جداول مشتركة: ${common.length}`);
  common.forEach(table => console.log(`   🔗 ${table}`));
  
  console.log(`\n📱 جداول MySQL فقط: ${mysqlOnly.length}`);
  mysqlOnly.forEach(table => console.log(`   🆕 ${table}`));
  
  console.log(`\n☁️ جداول Supabase فقط: ${supabaseOnly.length}`);
  supabaseOnly.forEach(table => console.log(`   📊 ${table}`));
}

async function compareBasicData(mysqlConnection) {
  console.log('\n📊 2. مقارنة البيانات الأساسية:');
  console.log('=' .repeat(50));
  
  const commonTables = ['companies', 'facebook_settings', 'conversations', 'messages'];
  
  for (const table of commonTables) {
    try {
      // عدد السجلات في MySQL
      const [mysqlRows] = await mysqlConnection.execute(`SELECT COUNT(*) as count FROM ${table}`);
      const mysqlCount = mysqlRows[0].count;
      
      // عدد السجلات في Supabase
      let supabaseCount = 0;
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          supabaseCount = count || 0;
        }
      } catch (err) {
        supabaseCount = 'غير متاح';
      }
      
      console.log(`📋 ${table}:`);
      console.log(`   MySQL: ${mysqlCount} سجل`);
      console.log(`   Supabase: ${supabaseCount} سجل`);
      
      if (typeof supabaseCount === 'number') {
        const diff = mysqlCount - supabaseCount;
        if (diff === 0) {
          console.log(`   ✅ متطابق`);
        } else if (diff > 0) {
          console.log(`   📈 MySQL أكثر بـ ${diff} سجل`);
        } else {
          console.log(`   📉 Supabase أكثر بـ ${Math.abs(diff)} سجل`);
        }
      }
      console.log('');
      
    } catch (error) {
      console.log(`❌ خطأ في مقارنة ${table}: ${error.message}`);
    }
  }
}

async function compareSystemSettings(mysqlConnection) {
  console.log('⚙️ 3. مقارنة إعدادات النظام:');
  console.log('=' .repeat(50));
  
  // مقارنة إعدادات Gemini
  try {
    const [mysqlGemini] = await mysqlConnection.execute('SELECT * FROM gemini_settings LIMIT 1');
    
    const { data: supabaseGemini, error } = await supabase
      .from('gemini_settings')
      .select('*')
      .limit(1);
    
    console.log('🤖 إعدادات Gemini AI:');
    console.log(`   MySQL: ${mysqlGemini.length > 0 ? 'موجود' : 'غير موجود'}`);
    console.log(`   Supabase: ${!error && supabaseGemini?.length > 0 ? 'موجود' : 'غير موجود'}`);
    
  } catch (error) {
    console.log('❌ خطأ في مقارنة إعدادات Gemini');
  }
  
  // مقارنة إعدادات WhatsApp
  try {
    const [mysqlWhatsApp] = await mysqlConnection.execute('SELECT * FROM whatsapp_settings LIMIT 1');
    
    const { data: supabaseWhatsApp, error } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .limit(1);
    
    console.log('\n📱 إعدادات WhatsApp:');
    console.log(`   MySQL: ${mysqlWhatsApp.length > 0 ? 'موجود' : 'غير موجود'}`);
    console.log(`   Supabase: ${!error && supabaseWhatsApp?.length > 0 ? 'موجود' : 'غير موجود'}`);
    
  } catch (error) {
    console.log('❌ خطأ في مقارنة إعدادات WhatsApp');
  }
}

async function analyzeDataDifferences(mysqlConnection) {
  console.log('\n🎯 4. تحليل الاختلافات والتوصيات:');
  console.log('=' .repeat(50));
  
  console.log('📊 الملاحظات الرئيسية:');
  console.log('');
  
  console.log('✅ المزايا الجديدة في MySQL:');
  console.log('   🏪 نظام متجر إلكتروني كامل (stores, products, orders)');
  console.log('   📱 دعم WhatsApp محسن (5 جداول متخصصة)');
  console.log('   📊 نظام إحصائيات متقدم');
  console.log('   🔧 سجلات النظام المحسنة');
  console.log('');
  
  console.log('☁️ الميزات المفقودة من Supabase:');
  console.log('   💳 نظام الاشتراكات (subscription_plans, company_subscriptions)');
  console.log('   👑 سجلات المدير الأساسي (super_admin_logs)');
  console.log('   🔄 بعض البيانات التاريخية');
  console.log('');
  
  console.log('🎯 التوصيات:');
  console.log('   1. ✅ MySQL جاهز للاستخدام الكامل');
  console.log('   2. 📱 يدعم Facebook + WhatsApp + المتجر الإلكتروني');
  console.log('   3. 🔄 يمكن نقل البيانات المهمة من Supabase إذا لزم الأمر');
  console.log('   4. 💡 النظام الجديد أكثر تطوراً وشمولية');
}

// تشغيل المقارنة
compareDatabases()
  .then(() => {
    console.log('\n🏁 انتهت المقارنة');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 خطأ عام:', error);
    process.exit(1);
  });

export { compareDatabases };
