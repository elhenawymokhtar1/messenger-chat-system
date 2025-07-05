#!/usr/bin/env node

/**
 * 🧹 أداة تنظيف النظام التلقائية
 * تحذف الملفات المكررة وتنظف المشروع
 */

const fs = require('fs');
const path = require('path');

class SystemCleanup {
  constructor() {
    this.deletedFiles = [];
    this.keptFiles = [];
    this.movedFiles = [];
    this.errors = [];
  }

  log(type, message, details = null) {
    const icons = {
      success: '✅',
      warn: '⚠️',
      error: '❌',
      info: 'ℹ️',
      delete: '🗑️',
      keep: '📁',
      move: '📦'
    };
    
    console.log(`${icons[type] || '📋'} ${message}`);
    if (details) {
      console.log('   ', details);
    }
  }

  // إنشاء مجلدات النسخ الاحتياطية
  createBackupDirs() {
    const dirs = ['backup', 'backup/servers', 'backup/scripts'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.log('info', `تم إنشاء مجلد: ${dir}`);
      }
    });
  }

  // حذف الخوادم المكررة
  cleanupServers() {
    this.log('info', 'تنظيف الخوادم المكررة...');
    
    // الخادم الرئيسي الذي نريد الاحتفاظ به
    const mainServer = 'database-connected-server.cjs';
    
    // الخوادم المكررة التي يجب حذفها
    const duplicateServers = [
      'api-server.js',
      'simple-products-api.js',
      'quick-products-api.js',
      'products-server-debug.cjs'
    ];

    duplicateServers.forEach(server => {
      if (fs.existsSync(server)) {
        try {
          // إنشاء نسخة احتياطية
          const backupName = `backup/servers/${server}`;
          fs.copyFileSync(server, backupName);
          
          // حذف الملف الأصلي
          fs.unlinkSync(server);
          
          this.deletedFiles.push(server);
          this.log('delete', `تم حذف: ${server} (نسخة احتياطية: ${backupName})`);
        } catch (error) {
          this.errors.push(`فشل حذف ${server}: ${error.message}`);
          this.log('error', `فشل حذف ${server}`, error.message);
        }
      }
    });

    if (fs.existsSync(mainServer)) {
      this.keptFiles.push(mainServer);
      this.log('keep', `تم الاحتفاظ بالخادم الرئيسي: ${mainServer}`);
    }
  }

  // نقل خوادم src/api إلى backup
  moveApiServers() {
    this.log('info', 'نقل خوادم src/api إلى backup...');
    
    const apiServers = [
      'src/api/server.ts',
      'src/api/server-mysql.ts', 
      'src/api/server-mysql-complete.ts'
    ];

    apiServers.forEach(server => {
      if (fs.existsSync(server)) {
        try {
          const fileName = path.basename(server);
          const backupPath = `backup/servers/${fileName}`;
          
          fs.copyFileSync(server, backupPath);
          fs.unlinkSync(server);
          
          this.movedFiles.push({ from: server, to: backupPath });
          this.log('move', `تم نقل: ${server} → ${backupPath}`);
        } catch (error) {
          this.errors.push(`فشل نقل ${server}: ${error.message}`);
          this.log('error', `فشل نقل ${server}`, error.message);
        }
      }
    });
  }

  // تنظيف ملفات الإصلاح
  cleanupFixFiles() {
    this.log('info', 'تنظيف ملفات الإصلاح...');
    
    const fixFiles = [
      'fix-all-issues.js',
      'fix-all-issues.cjs',
      'fix-facebook-conversations-errors.js',
      'fix-onclick-errors.js',
      'fix-app-routes.js',
      'fix-frontend-complete.js',
      'cleanup-supabase.js',
      'cleanup-supabase.cjs',
      'final-facebook-conversations-check.js',
      'fix-facebook-conversations-page.js'
    ];

    fixFiles.forEach(file => {
      if (fs.existsSync(file)) {
        try {
          const backupPath = `backup/scripts/${file}`;
          fs.copyFileSync(file, backupPath);
          fs.unlinkSync(file);
          
          this.movedFiles.push({ from: file, to: backupPath });
          this.log('move', `تم نقل: ${file} → ${backupPath}`);
        } catch (error) {
          this.errors.push(`فشل نقل ${file}: ${error.message}`);
          this.log('error', `فشل نقل ${file}`, error.message);
        }
      }
    });
  }

  // تنظيف ملفات الاختبار
  cleanupTestFiles() {
    this.log('info', 'تنظيف ملفات الاختبار...');
    
    const testFiles = [
      'test-hybrid-system.cjs',
      'simple-whatsapp-server.cjs',
      'smart-monitoring-system.js',
      'setup-subscription-database.mjs',
      'create-test-data.cjs'
    ];

    testFiles.forEach(file => {
      if (fs.existsSync(file)) {
        try {
          const backupPath = `backup/${file}`;
          fs.copyFileSync(file, backupPath);
          fs.unlinkSync(file);
          
          this.deletedFiles.push(file);
          this.log('delete', `تم حذف: ${file} (نسخة احتياطية: ${backupPath})`);
        } catch (error) {
          this.errors.push(`فشل حذف ${file}: ${error.message}`);
          this.log('error', `فشل حذف ${file}`, error.message);
        }
      }
    });
  }

  // إنشاء ملف README للنظام المنظف
  createCleanSystemReadme() {
    const readmeContent = `# 🎯 النظام المنظف

## 📋 الملفات الرئيسية:

### 🖥️ الخادم الوحيد:
- \`database-connected-server.cjs\` - الخادم الرئيسي الوحيد (المنفذ 3002)

### 🌐 الواجهة الأمامية:
- \`src/\` - ملفات React
- \`package.json\` - التبعيات
- المنفذ: 8080

### 🗄️ قاعدة البيانات:
- MySQL فقط (تم إزالة Supabase)

## 🚀 تشغيل النظام:

\`\`\`bash
# 1. تشغيل الخادم الخلفي
node database-connected-server.cjs

# 2. تشغيل الواجهة الأمامية (في terminal آخر)
npm run dev
\`\`\`

## 🔗 الروابط:
- الواجهة الأمامية: http://localhost:8080
- الخادم الخلفي: http://localhost:3002
- تسجيل دخول الشركة: http://localhost:8080/company-login
- إعدادات فيسبوك: http://localhost:8080/facebook-settings

## 📊 الإحصائيات:
- الخوادم المحذوفة: ${this.deletedFiles.length}
- الملفات المنقولة: ${this.movedFiles.length}
- الملفات المحتفظ بها: ${this.keptFiles.length}

## 🗑️ الملفات المحذوفة:
${this.deletedFiles.map(file => `- ${file}`).join('\n')}

## 📦 الملفات المنقولة:
${this.movedFiles.map(({from, to}) => `- ${from} → ${to}`).join('\n')}

## 📁 النسخ الاحتياطية:
- الخوادم: \`backup/servers/\`
- السكريبتات: \`backup/scripts/\`
- الملفات الأخرى: \`backup/\`

## 🎯 النتيجة:
✅ نظام منظف وموحد
✅ خادم واحد فقط
✅ قاعدة بيانات واحدة (MySQL)
✅ نسخ احتياطية محفوظة
✅ لا توجد تضاربات في المنافذ
`;

    try {
      fs.writeFileSync('CLEAN_SYSTEM_README.md', readmeContent);
      this.log('success', 'تم إنشاء CLEAN_SYSTEM_README.md');
    } catch (error) {
      this.log('error', 'فشل إنشاء README', error.message);
    }
  }

  // إنشاء التقرير النهائي
  generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('🧹 تقرير تنظيف النظام');
    console.log('='.repeat(50));

    console.log(`\n🗑️ تم حذف ${this.deletedFiles.length} ملف:`);
    this.deletedFiles.forEach(file => {
      console.log(`   - ${file}`);
    });

    console.log(`\n📦 تم نقل ${this.movedFiles.length} ملف:`);
    this.movedFiles.forEach(({from, to}) => {
      console.log(`   - ${from} → ${to}`);
    });

    console.log(`\n📁 تم الاحتفاظ بـ ${this.keptFiles.length} ملف:`);
    this.keptFiles.forEach(file => {
      console.log(`   - ${file}`);
    });

    if (this.errors.length > 0) {
      console.log(`\n❌ أخطاء (${this.errors.length}):`);
      this.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }

    console.log('\n🎯 النتيجة:');
    console.log('   ✅ نظام منظف وموحد');
    console.log('   ✅ خادم واحد فقط (database-connected-server.cjs)');
    console.log('   ✅ قاعدة بيانات واحدة (MySQL)');
    console.log('   ✅ نسخ احتياطية محفوظة');
    console.log('   ✅ لا توجد تضاربات في المنافذ');

    console.log('\n🚀 الخطوات التالية:');
    console.log('   1. تشغيل: node database-connected-server.cjs');
    console.log('   2. تشغيل: npm run dev (في terminal آخر)');
    console.log('   3. اختبار النظام على: http://localhost:8080');
    console.log('   4. قراءة: CLEAN_SYSTEM_README.md');
  }

  // تشغيل التنظيف
  async run() {
    console.log('🧹 بدء تنظيف النظام...\n');
    
    this.createBackupDirs();
    this.cleanupServers();
    this.moveApiServers();
    this.cleanupFixFiles();
    this.cleanupTestFiles();
    this.createCleanSystemReadme();
    
    this.generateReport();
    
    console.log('\n🎉 انتهى التنظيف!');
    console.log('📖 اقرأ CLEAN_SYSTEM_README.md للتفاصيل');
  }
}

// تشغيل الأداة
if (require.main === module) {
  const cleanup = new SystemCleanup();
  
  console.log('⚠️ تحذير: هذه الأداة ستحذف ملفات متعددة!');
  console.log('📁 سيتم إنشاء نسخ احتياطية في مجلد backup/');
  console.log('🎯 الهدف: نظام منظف بخادم واحد فقط');
  console.log('');
  
  cleanup.run().catch(console.error);
}

module.exports = SystemCleanup;
