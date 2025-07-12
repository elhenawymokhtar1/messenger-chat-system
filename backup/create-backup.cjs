/**
 * إنشاء نسخة احتياطية كاملة من الجداول القديمة
 * تاريخ الإنشاء: 11 يوليو 2025
 */

const mysql = require('mysql2/promise');
const colors = require('colors');
const fs = require('fs');
const path = require('path');

// إعدادات قاعدة البيانات
const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// إعدادات النسخ الاحتياطي
const BACKUP_CONFIG = {
  backupDir: path.join(__dirname, 'backups'),
  timestamp: new Date().toISOString().replace(/[:.]/g, '-').split('T')[0],
  tables: ['facebook_settings', 'facebook_pages'],
  compressionEnabled: false // يمكن تفعيلها لاحقاً
};

class BackupManager {
  constructor() {
    this.connection = null;
    this.backupPath = path.join(BACKUP_CONFIG.backupDir, `facebook_tables_backup_${BACKUP_CONFIG.timestamp}`);
  }

  async init() {
    try {
      console.log('🔌 الاتصال بقاعدة البيانات...'.cyan);
      this.connection = await mysql.createConnection(dbConfig);
      console.log('✅ تم الاتصال بقاعدة البيانات بنجاح'.green);
      
      // إنشاء مجلد النسخ الاحتياطي
      if (!fs.existsSync(BACKUP_CONFIG.backupDir)) {
        fs.mkdirSync(BACKUP_CONFIG.backupDir, { recursive: true });
        console.log('📁 تم إنشاء مجلد النسخ الاحتياطي'.blue);
      }
      
      if (!fs.existsSync(this.backupPath)) {
        fs.mkdirSync(this.backupPath, { recursive: true });
        console.log(`📁 تم إنشاء مجلد النسخة الاحتياطية: ${this.backupPath}`.blue);
      }
      
      return true;
    } catch (error) {
      console.error('❌ خطأ في الاتصال بقاعدة البيانات:'.red, error.message);
      return false;
    }
  }

  async getTableStructure(tableName) {
    try {
      console.log(`🔍 جلب بنية الجدول ${tableName}...`.blue);
      
      const [createTable] = await this.connection.execute(`SHOW CREATE TABLE ${tableName}`);
      const createStatement = createTable[0]['Create Table'];
      
      return createStatement;
    } catch (error) {
      console.error(`❌ خطأ في جلب بنية الجدول ${tableName}:`.red, error.message);
      throw error;
    }
  }

  async getTableData(tableName) {
    try {
      console.log(`📊 جلب بيانات الجدول ${tableName}...`.blue);
      
      const [rows] = await this.connection.execute(`SELECT * FROM ${tableName}`);
      console.log(`  📄 تم جلب ${rows.length} سجل من ${tableName}`.white);
      
      return rows;
    } catch (error) {
      console.error(`❌ خطأ في جلب بيانات الجدول ${tableName}:`.red, error.message);
      throw error;
    }
  }

  generateInsertStatements(tableName, rows) {
    if (rows.length === 0) {
      return '-- لا توجد بيانات في الجدول\n';
    }

    let sql = `-- بيانات الجدول ${tableName}\n`;
    sql += `DELETE FROM ${tableName};\n`;
    
    const columns = Object.keys(rows[0]);
    const columnsList = columns.map(col => `\`${col}\``).join(', ');
    
    for (const row of rows) {
      const values = columns.map(col => {
        const value = row[col];
        if (value === null) {
          return 'NULL';
        } else if (typeof value === 'string') {
          return `'${value.replace(/'/g, "''")}'`;
        } else if (value instanceof Date) {
          return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
        } else {
          return value;
        }
      }).join(', ');
      
      sql += `INSERT INTO ${tableName} (${columnsList}) VALUES (${values});\n`;
    }
    
    sql += '\n';
    return sql;
  }

  async backupTable(tableName) {
    try {
      console.log(`💾 نسخ احتياطي للجدول ${tableName}...`.green.bold);
      
      // جلب بنية الجدول
      const structure = await this.getTableStructure(tableName);
      
      // جلب بيانات الجدول
      const data = await this.getTableData(tableName);
      
      // إنشاء ملف SQL
      let sqlContent = `-- نسخة احتياطية للجدول ${tableName}\n`;
      sqlContent += `-- تاريخ الإنشاء: ${new Date().toLocaleString('ar-EG')}\n`;
      sqlContent += `-- عدد السجلات: ${data.length}\n\n`;
      
      // إضافة بنية الجدول
      sqlContent += `-- بنية الجدول\n`;
      sqlContent += `DROP TABLE IF EXISTS ${tableName}_backup;\n`;
      sqlContent += structure.replace(`CREATE TABLE \`${tableName}\``, `CREATE TABLE \`${tableName}_backup\``) + ';\n\n';
      
      // إضافة بيانات الجدول
      sqlContent += this.generateInsertStatements(`${tableName}_backup`, data);
      
      // حفظ الملف
      const filePath = path.join(this.backupPath, `${tableName}_backup.sql`);
      fs.writeFileSync(filePath, sqlContent, 'utf8');
      
      console.log(`  ✅ تم حفظ النسخة الاحتياطية: ${filePath}`.green);
      
      // إنشاء ملف JSON أيضاً للسهولة
      const jsonPath = path.join(this.backupPath, `${tableName}_data.json`);
      fs.writeFileSync(jsonPath, JSON.stringify({
        table: tableName,
        timestamp: new Date().toISOString(),
        recordCount: data.length,
        data: data
      }, null, 2), 'utf8');
      
      console.log(`  ✅ تم حفظ البيانات بصيغة JSON: ${jsonPath}`.green);
      
      return {
        table: tableName,
        recordCount: data.length,
        sqlFile: filePath,
        jsonFile: jsonPath
      };
      
    } catch (error) {
      console.error(`❌ خطأ في نسخ الجدول ${tableName}:`.red, error.message);
      throw error;
    }
  }

  async createMetadataFile(backupResults) {
    try {
      const metadata = {
        backupDate: new Date().toISOString(),
        backupPath: this.backupPath,
        database: dbConfig.database,
        host: dbConfig.host,
        tables: backupResults,
        totalRecords: backupResults.reduce((sum, result) => sum + result.recordCount, 0),
        version: '1.0',
        description: 'نسخة احتياطية من جداول Facebook قبل التوحيد'
      };
      
      const metadataPath = path.join(this.backupPath, 'backup_metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
      
      console.log(`📋 تم إنشاء ملف البيانات الوصفية: ${metadataPath}`.cyan);
      
      return metadata;
    } catch (error) {
      console.error('❌ خطأ في إنشاء ملف البيانات الوصفية:'.red, error.message);
      throw error;
    }
  }

  async createRestoreScript(backupResults) {
    try {
      let restoreScript = `#!/bin/bash
# سكريبت استرداد النسخة الاحتياطية
# تاريخ الإنشاء: ${new Date().toLocaleString('ar-EG')}

echo "🔄 بدء استرداد النسخة الاحتياطية..."

# إعدادات قاعدة البيانات
DB_HOST="${dbConfig.host}"
DB_USER="${dbConfig.user}"
DB_NAME="${dbConfig.database}"

# استرداد الجداول
`;

      for (const result of backupResults) {
        restoreScript += `
echo "📊 استرداد الجدول ${result.table}..."
mysql -h $DB_HOST -u $DB_USER -p $DB_NAME < "${result.table}_backup.sql"
if [ $? -eq 0 ]; then
    echo "✅ تم استرداد ${result.table} بنجاح"
else
    echo "❌ فشل في استرداد ${result.table}"
fi
`;
      }

      restoreScript += `
echo "✅ تم الانتهاء من استرداد النسخة الاحتياطية"
`;

      const scriptPath = path.join(this.backupPath, 'restore.sh');
      fs.writeFileSync(scriptPath, restoreScript, 'utf8');
      
      // جعل السكريبت قابل للتنفيذ (على أنظمة Unix)
      try {
        fs.chmodSync(scriptPath, '755');
      } catch (error) {
        // تجاهل الخطأ على Windows
      }
      
      console.log(`🔧 تم إنشاء سكريبت الاسترداد: ${scriptPath}`.cyan);
      
      return scriptPath;
    } catch (error) {
      console.error('❌ خطأ في إنشاء سكريبت الاسترداد:'.red, error.message);
      throw error;
    }
  }

  async createFullBackup() {
    console.log('💾 بدء إنشاء النسخة الاحتياطية الكاملة...'.green.bold);
    console.log(`📁 مسار النسخة الاحتياطية: ${this.backupPath}`.cyan);
    console.log(`📊 الجداول المراد نسخها: ${BACKUP_CONFIG.tables.join(', ')}`.cyan);
    
    const backupResults = [];
    
    try {
      // نسخ كل جدول
      for (const tableName of BACKUP_CONFIG.tables) {
        const result = await this.backupTable(tableName);
        backupResults.push(result);
      }
      
      // إنشاء ملف البيانات الوصفية
      const metadata = await this.createMetadataFile(backupResults);
      
      // إنشاء سكريبت الاسترداد
      await this.createRestoreScript(backupResults);
      
      // إنشاء تقرير النسخة الاحتياطية
      this.generateBackupReport(metadata, backupResults);
      
      console.log('\n🎉 تم إنشاء النسخة الاحتياطية بنجاح!'.green.bold);
      console.log(`📁 المسار: ${this.backupPath}`.cyan);
      
      return {
        success: true,
        backupPath: this.backupPath,
        metadata: metadata,
        results: backupResults
      };
      
    } catch (error) {
      console.error('❌ فشل في إنشاء النسخة الاحتياطية:'.red, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateBackupReport(metadata, results) {
    console.log('\n📊 تقرير النسخة الاحتياطية'.blue.bold);
    console.log('='.repeat(50).cyan);
    
    console.log(`📅 تاريخ النسخة: ${new Date(metadata.backupDate).toLocaleString('ar-EG')}`.white);
    console.log(`📁 المسار: ${metadata.backupPath}`.white);
    console.log(`🗄️ قاعدة البيانات: ${metadata.database}`.white);
    console.log(`📊 إجمالي السجلات: ${metadata.totalRecords}`.white);
    
    console.log('\n📋 تفاصيل الجداول:'.cyan);
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. 📄 ${result.table}: ${result.recordCount} سجل`.white);
      console.log(`     💾 SQL: ${path.basename(result.sqlFile)}`.gray);
      console.log(`     📄 JSON: ${path.basename(result.jsonFile)}`.gray);
    });
    
    console.log('\n📁 الملفات المُنشأة:'.cyan);
    console.log(`  📋 backup_metadata.json - البيانات الوصفية`.white);
    console.log(`  🔧 restore.sh - سكريبت الاسترداد`.white);
    results.forEach(result => {
      console.log(`  💾 ${path.basename(result.sqlFile)} - نسخة احتياطية SQL`.white);
      console.log(`  📄 ${path.basename(result.jsonFile)} - بيانات JSON`.white);
    });
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// تشغيل النسخ الاحتياطي
async function createBackup() {
  const backupManager = new BackupManager();
  
  if (await backupManager.init()) {
    const result = await backupManager.createFullBackup();
    await backupManager.close();
    
    if (result.success) {
      console.log('\n✅ تم إنشاء النسخة الاحتياطية بنجاح!'.green.bold);
      console.log('💡 يمكنك الآن المتابعة بأمان لحذف الجداول القديمة'.yellow);
    } else {
      console.error('\n❌ فشل في إنشاء النسخة الاحتياطية!'.red.bold);
      console.error('🚫 لا تقم بحذف الجداول القديمة!'.red);
      process.exit(1);
    }
  } else {
    console.error('❌ فشل في تهيئة مدير النسخ الاحتياطي'.red);
    process.exit(1);
  }
}

// تشغيل النسخ الاحتياطي إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  createBackup().catch(console.error);
}

module.exports = { BackupManager };
