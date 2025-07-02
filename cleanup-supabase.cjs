/**
 * 🧹 تنظيف شامل من قاعدة البيانات القديمة (Supabase)
 * يحذف جميع الملفات والكود المرتبط بـ Supabase
 */

const fs = require('fs');
const path = require('path');

class SupabaseCleanup {
  constructor() {
    this.deletedFiles = [];
    this.modifiedFiles = [];
    this.errors = [];
  }

  log(type, message, details = null) {
    const timestamp = new Date().toLocaleTimeString('ar-SA');
    const icons = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      delete: '🗑️',
      modify: '✏️'
    };
    
    console.log(`${icons[type]} [${timestamp}] ${message}`);
    if (details) {
      console.log('   ', details);
    }
  }

  async cleanup() {
    this.log('info', 'بدء تنظيف شامل من Supabase...');
    
    // 1. حذف الملفات المخصصة لـ Supabase
    await this.deleteSupabaseFiles();
    
    // 2. تنظيف الكود من imports و references
    await this.cleanupCodeReferences();
    
    // 3. تنظيف ملفات الإعداد
    await this.cleanupConfigFiles();
    
    // 4. تنظيف ملفات الخادم
    await this.cleanupServerFiles();
    
    // 5. تقرير نهائي
    this.generateReport();
  }

  async deleteSupabaseFiles() {
    this.log('info', 'حذف ملفات Supabase المخصصة...');
    
    const filesToDelete = [
      // ملفات التكامل
      'src/integrations/supabase/client.ts',
      'src/integrations/supabase/types.ts',
      'src/integrations/supabase',
      
      // ملفات المكتبة
      'src/lib/supabase.ts',
      'src/lib/supabaseAdmin.ts',
      
      // ملفات الإعداد
      'src/config/supabase.ts',
      
      // ملفات الخدمات
      'src/services/superAdminService.ts',
      
      // ملفات الخادم
      'simple-whatsapp-server.cjs',
      'test-hybrid-system.cjs',
      'smart-monitoring-system.js',
      'setup-subscription-database.mjs',
      'src/api/server-production.js',
      
      // مجلد supabase
      'supabase',
      
      // ملفات البيئة القديمة
      '.env.backup',
      '.env.example'
    ];

    for (const file of filesToDelete) {
      await this.deleteFileOrDirectory(file);
    }
  }

  async deleteFileOrDirectory(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
          this.log('delete', `حذف مجلد: ${filePath}`);
        } else {
          fs.unlinkSync(filePath);
          this.log('delete', `حذف ملف: ${filePath}`);
        }
        
        this.deletedFiles.push(filePath);
      }
    } catch (error) {
      this.log('error', `فشل حذف ${filePath}:`, error.message);
      this.errors.push({ file: filePath, error: error.message });
    }
  }

  async cleanupCodeReferences() {
    this.log('info', 'تنظيف مراجع Supabase من الكود...');
    
    const directories = [
      'src/hooks',
      'src/pages',
      'src/components',
      'src/services',
      'src/utils',
      'src/api'
    ];

    for (const dir of directories) {
      if (fs.existsSync(dir)) {
        await this.cleanupDirectory(dir);
      }
    }
  }

  async cleanupDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        await this.cleanupDirectory(fullPath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        await this.cleanupFile(fullPath);
      }
    }
  }

  async cleanupFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) return;
      
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // إزالة imports من Supabase
      const supabaseImports = [
        /import.*from\s+['"]@supabase\/supabase-js['"];?\n?/g,
        /import.*from\s+['"]@\/integrations\/supabase\/client['"];?\n?/g,
        /import.*from\s+['"]@\/lib\/supabase['"];?\n?/g,
        /import.*from\s+['"]@\/lib\/supabaseAdmin['"];?\n?/g,
        /import.*from\s+['"]@\/config\/supabase['"];?\n?/g,
        /const.*=.*createClient\(.*\);?\n?/g,
        /export.*supabase.*=.*createClient\(.*\);?\n?/g
      ];

      for (const pattern of supabaseImports) {
        if (pattern.test(content)) {
          content = content.replace(pattern, '');
          modified = true;
        }
      }

      // إزالة استخدامات Supabase
      const supabaseUsages = [
        /supabase\.[^;]+;?\n?/g,
        /await\s+supabase\.[^;]+;?\n?/g,
        /const.*=.*supabase\.[^;]+;?\n?/g,
        /\.from\(['"][^'"]+['"]\)/g,
        /\.select\([^)]*\)/g,
        /\.insert\([^)]*\)/g,
        /\.update\([^)]*\)/g,
        /\.delete\([^)]*\)/g
      ];

      for (const pattern of supabaseUsages) {
        if (pattern.test(content)) {
          content = content.replace(pattern, '// TODO: Replace with MySQL API');
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, content);
        this.log('modify', `تم تنظيف: ${filePath}`);
        this.modifiedFiles.push(filePath);
      }
    } catch (error) {
      this.log('error', `فشل تنظيف ${filePath}:`, error.message);
      this.errors.push({ file: filePath, error: error.message });
    }
  }

  async cleanupConfigFiles() {
    this.log('info', 'تنظيف ملفات الإعداد...');
    
    // تنظيف package.json من dependencies
    await this.cleanupPackageJson();
    
    // تنظيف ملف .env
    await this.cleanupEnvFile();
  }

  async cleanupPackageJson() {
    try {
      if (fs.existsSync('package.json')) {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // إزالة Supabase dependencies
        const supabaseDeps = ['@supabase/supabase-js'];
        let modified = false;
        
        for (const dep of supabaseDeps) {
          if (packageJson.dependencies && packageJson.dependencies[dep]) {
            delete packageJson.dependencies[dep];
            modified = true;
            this.log('modify', `إزالة dependency: ${dep}`);
          }
          
          if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
            delete packageJson.devDependencies[dep];
            modified = true;
            this.log('modify', `إزالة devDependency: ${dep}`);
          }
        }
        
        if (modified) {
          fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
          this.modifiedFiles.push('package.json');
        }
      }
    } catch (error) {
      this.log('error', 'فشل تنظيف package.json:', error.message);
      this.errors.push({ file: 'package.json', error: error.message });
    }
  }

  async cleanupEnvFile() {
    try {
      if (fs.existsSync('.env')) {
        let content = fs.readFileSync('.env', 'utf8');
        
        // إزالة متغيرات Supabase
        const supabaseVars = [
          /VITE_SUPABASE_URL=.*\n?/g,
          /VITE_SUPABASE_ANON_KEY=.*\n?/g,
          /SUPABASE_SERVICE_ROLE_KEY=.*\n?/g,
          /NEXT_PUBLIC_SUPABASE_URL=.*\n?/g,
          /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*\n?/g
        ];
        
        let modified = false;
        for (const pattern of supabaseVars) {
          if (pattern.test(content)) {
            content = content.replace(pattern, '');
            modified = true;
          }
        }
        
        if (modified) {
          fs.writeFileSync('.env', content);
          this.log('modify', 'تم تنظيف ملف .env من متغيرات Supabase');
          this.modifiedFiles.push('.env');
        }
      }
    } catch (error) {
      this.log('error', 'فشل تنظيف .env:', error.message);
      this.errors.push({ file: '.env', error: error.message });
    }
  }

  async cleanupServerFiles() {
    this.log('info', 'تنظيف ملفات الخادم من Supabase...');
    
    const serverFiles = [
      'src/api/whatsapp-baileys-routes.ts',
      'src/api/server.ts',
      'src/api/server-mysql.ts'
    ];

    for (const file of serverFiles) {
      if (fs.existsSync(file)) {
        await this.cleanupFile(file);
      }
    }
  }

  generateReport() {
    this.log('info', '📊 تقرير التنظيف النهائي:');
    console.log('\n' + '='.repeat(50));
    
    this.log('success', `تم حذف ${this.deletedFiles.length} ملف/مجلد`);
    this.log('success', `تم تعديل ${this.modifiedFiles.length} ملف`);
    
    if (this.errors.length > 0) {
      this.log('warning', `حدث ${this.errors.length} خطأ أثناء التنظيف`);
    }
    
    console.log('\n📋 الملفات المحذوفة:');
    this.deletedFiles.forEach(file => console.log(`   🗑️ ${file}`));
    
    console.log('\n✏️ الملفات المعدلة:');
    this.modifiedFiles.forEach(file => console.log(`   📝 ${file}`));
    
    if (this.errors.length > 0) {
      console.log('\n❌ الأخطاء:');
      this.errors.forEach(error => console.log(`   ⚠️ ${error.file}: ${error.error}`));
    }
    
    console.log('\n' + '='.repeat(50));
    this.log('success', 'تم الانتهاء من تنظيف Supabase بنجاح! 🎉');
    this.log('info', 'يمكنك الآن تشغيل: npm install لإزالة packages غير المستخدمة');
  }
}

// تشغيل التنظيف
const cleanup = new SupabaseCleanup();
cleanup.cleanup().catch(console.error);
