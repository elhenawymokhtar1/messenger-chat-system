/**
 * سكريبت الاسترداد الطارئ للجداول القديمة
 * يستخدم في حالة الطوارئ لاسترداد الجداول المحذوفة
 * تاريخ الإنشاء: 11 يوليو 2025
 */

const mysql = require('mysql2/promise');
const colors = require('colors');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// إعدادات قاعدة البيانات
const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

class EmergencyRestore {
  constructor() {
    this.connection = null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async init() {
    try {
      console.log('🔌 الاتصال بقاعدة البيانات...'.cyan);
      this.connection = await mysql.createConnection(dbConfig);
      console.log('✅ تم الاتصال بقاعدة البيانات بنجاح'.green);
      return true;
    } catch (error) {
      console.error('❌ خطأ في الاتصال بقاعدة البيانات:'.red, error.message);
      return false;
    }
  }

  async askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  async confirmAction(message) {
    const answer = await this.askQuestion(`${message} (yes/no): `);
    return answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y';
  }

  async findBackupFiles() {
    const backupDir = path.join(__dirname, 'backups');
    
    if (!fs.existsSync(backupDir)) {
      console.log('❌ مجلد النسخ الاحتياطي غير موجود'.red);
      return [];
    }

    const backupFolders = fs.readdirSync(backupDir)
      .filter(item => {
        const fullPath = path.join(backupDir, item);
        return fs.statSync(fullPath).isDirectory() && item.startsWith('facebook_tables_backup_');
      })
      .sort()
      .reverse(); // الأحدث أولاً

    console.log(`📁 تم العثور على ${backupFolders.length} نسخة احتياطية`.cyan);
    
    return backupFolders.map(folder => {
      const fullPath = path.join(backupDir, folder);
      const metadataPath = path.join(fullPath, 'backup_metadata.json');
      
      let metadata = null;
      if (fs.existsSync(metadataPath)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        } catch (error) {
          console.warn(`⚠️ خطأ في قراءة البيانات الوصفية: ${folder}`.yellow);
        }
      }
      
      return {
        folder,
        fullPath,
        metadata
      };
    });
  }

  async selectBackup(backups) {
    if (backups.length === 0) {
      console.log('❌ لا توجد نسخ احتياطية متاحة'.red);
      return null;
    }

    console.log('\n📋 النسخ الاحتياطية المتاحة:'.blue.bold);
    backups.forEach((backup, index) => {
      console.log(`  ${index + 1}. ${backup.folder}`.white);
      if (backup.metadata) {
        console.log(`     📅 التاريخ: ${new Date(backup.metadata.backupDate).toLocaleString('ar-EG')}`.gray);
        console.log(`     📊 السجلات: ${backup.metadata.totalRecords}`.gray);
        console.log(`     📄 الجداول: ${backup.metadata.tables.map(t => t.table).join(', ')}`.gray);
      }
      console.log('');
    });

    const selection = await this.askQuestion('اختر رقم النسخة الاحتياطية للاسترداد: ');
    const index = parseInt(selection) - 1;
    
    if (index >= 0 && index < backups.length) {
      return backups[index];
    } else {
      console.log('❌ اختيار غير صحيح'.red);
      return null;
    }
  }

  async checkCurrentTables() {
    try {
      console.log('🔍 فحص الجداول الحالية...'.blue);
      
      const tables = ['facebook_settings', 'facebook_pages'];
      const existingTables = [];
      
      for (const table of tables) {
        try {
          const [result] = await this.connection.execute(`SHOW TABLES LIKE '${table}'`);
          if (result.length > 0) {
            const [count] = await this.connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
            existingTables.push({
              name: table,
              exists: true,
              recordCount: count[0].count
            });
            console.log(`  📄 ${table}: موجود (${count[0].count} سجل)`.white);
          } else {
            existingTables.push({
              name: table,
              exists: false,
              recordCount: 0
            });
            console.log(`  📄 ${table}: غير موجود`.gray);
          }
        } catch (error) {
          existingTables.push({
            name: table,
            exists: false,
            recordCount: 0
          });
          console.log(`  📄 ${table}: غير موجود`.gray);
        }
      }
      
      return existingTables;
    } catch (error) {
      console.error('❌ خطأ في فحص الجداول الحالية:'.red, error.message);
      return [];
    }
  }

  async restoreTable(backupPath, tableName) {
    try {
      console.log(`🔄 استرداد الجدول ${tableName}...`.blue);
      
      const sqlFile = path.join(backupPath, `${tableName}_backup.sql`);
      
      if (!fs.existsSync(sqlFile)) {
        console.log(`❌ ملف النسخة الاحتياطية غير موجود: ${sqlFile}`.red);
        return false;
      }
      
      // قراءة ملف SQL
      const sqlContent = fs.readFileSync(sqlFile, 'utf8');
      
      // تقسيم الاستعلامات
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`  📊 تنفيذ ${statements.length} استعلام...`.cyan);
      
      // تنفيذ كل استعلام
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        try {
          await this.connection.execute(statement);
          
          if (statement.toLowerCase().includes('create table')) {
            console.log(`    ✅ تم إنشاء الجدول`.green);
          } else if (statement.toLowerCase().includes('insert into')) {
            // عدم طباعة كل INSERT للتقليل من الإخراج
          }
        } catch (error) {
          console.log(`    ❌ خطأ في الاستعلام ${i + 1}: ${error.message}`.red);
          return false;
        }
      }
      
      // التحقق من النتيجة
      try {
        const [count] = await this.connection.execute(`SELECT COUNT(*) as count FROM ${tableName}_backup`);
        console.log(`  ✅ تم استرداد ${count[0].count} سجل في ${tableName}_backup`.green);
        
        // إعادة تسمية الجدول
        await this.connection.execute(`DROP TABLE IF EXISTS ${tableName}`);
        await this.connection.execute(`ALTER TABLE ${tableName}_backup RENAME TO ${tableName}`);
        console.log(`  ✅ تم إعادة تسمية الجدول إلى ${tableName}`.green);
        
        return true;
      } catch (error) {
        console.log(`  ❌ خطأ في التحقق من النتيجة: ${error.message}`.red);
        return false;
      }
      
    } catch (error) {
      console.error(`❌ خطأ في استرداد الجدول ${tableName}:`.red, error.message);
      return false;
    }
  }

  async performRestore(backup) {
    try {
      console.log('\n🚨 بدء عملية الاسترداد الطارئ...'.red.bold);
      console.log(`📁 النسخة الاحتياطية: ${backup.folder}`.cyan);
      
      if (backup.metadata) {
        console.log(`📅 تاريخ النسخة: ${new Date(backup.metadata.backupDate).toLocaleString('ar-EG')}`.cyan);
        console.log(`📊 إجمالي السجلات: ${backup.metadata.totalRecords}`.cyan);
      }
      
      // التأكيد النهائي
      const confirmed = await this.confirmAction('\n⚠️ هذا سيحذف الجداول الحالية ويستردها من النسخة الاحتياطية. هل أنت متأكد؟');
      if (!confirmed) {
        console.log('❌ تم إلغاء عملية الاسترداد'.yellow);
        return false;
      }
      
      const tables = ['facebook_settings', 'facebook_pages'];
      const results = [];
      
      for (const table of tables) {
        const success = await this.restoreTable(backup.fullPath, table);
        results.push({ table, success });
      }
      
      // تقرير النتائج
      console.log('\n📊 تقرير الاسترداد:'.blue.bold);
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log(`✅ نجح: ${successful}/${results.length}`.green);
      console.log(`❌ فشل: ${failed}/${results.length}`.red);
      
      results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`  ${status} ${result.table}`.white);
      });
      
      if (successful === results.length) {
        console.log('\n🎉 تم الاسترداد بنجاح!'.green.bold);
        console.log('💡 يُنصح بإعادة تشغيل التطبيق للتأكد من عمل كل شيء'.yellow);
        return true;
      } else {
        console.log('\n⚠️ الاسترداد مكتمل جزئياً'.yellow.bold);
        console.log('🔧 قد تحتاج لمراجعة الجداول يدوياً'.yellow);
        return false;
      }
      
    } catch (error) {
      console.error('❌ خطأ في عملية الاسترداد:'.red, error.message);
      return false;
    }
  }

  async runEmergencyRestore() {
    console.log('🚨 سكريبت الاسترداد الطارئ'.red.bold);
    console.log('⚠️ يستخدم هذا السكريبت في حالات الطوارئ فقط!'.yellow.bold);
    console.log('💡 سيقوم بحذف الجداول الحالية واستردادها من النسخة الاحتياطية'.yellow);
    
    // التحقق من الجداول الحالية
    const currentTables = await this.checkCurrentTables();
    
    // البحث عن النسخ الاحتياطية
    const backups = await this.findBackupFiles();
    
    if (backups.length === 0) {
      console.log('\n❌ لا توجد نسخ احتياطية للاسترداد!'.red.bold);
      console.log('🚫 لا يمكن المتابعة بدون نسخة احتياطية'.red);
      return false;
    }
    
    // اختيار النسخة الاحتياطية
    const selectedBackup = await this.selectBackup(backups);
    
    if (!selectedBackup) {
      console.log('❌ لم يتم اختيار نسخة احتياطية'.red);
      return false;
    }
    
    // تنفيذ الاسترداد
    const success = await this.performRestore(selectedBackup);
    
    return success;
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات'.gray);
    }
    
    this.rl.close();
  }
}

// تشغيل الاسترداد الطارئ
async function runEmergencyRestore() {
  const restore = new EmergencyRestore();
  
  if (await restore.init()) {
    const success = await restore.runEmergencyRestore();
    await restore.close();
    
    if (success) {
      console.log('\n✅ تم الاسترداد الطارئ بنجاح!'.green.bold);
      process.exit(0);
    } else {
      console.log('\n❌ فشل في الاسترداد الطارئ!'.red.bold);
      process.exit(1);
    }
  } else {
    console.error('❌ فشل في تهيئة سكريبت الاسترداد'.red);
    process.exit(1);
  }
}

// تشغيل الاسترداد إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  runEmergencyRestore().catch(console.error);
}

module.exports = { EmergencyRestore };
