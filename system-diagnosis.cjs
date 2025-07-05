#!/usr/bin/env node

/**
 * 🔍 أداة تشخيص النظام الشاملة
 * تكشف جميع المشاكل في المشروع وتقترح الحلول
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class SystemDiagnosis {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.successes = [];
    this.servers = [];
    this.duplicateFiles = [];
    this.conflictingPorts = [];
    this.missingDependencies = [];
  }

  log(type, message, details = null) {
    const timestamp = new Date().toLocaleTimeString('ar-EG');
    const icons = {
      success: '✅',
      warn: '⚠️',
      error: '❌',
      info: 'ℹ️',
      check: '🔍'
    };
    
    console.log(`${icons[type] || '📋'} [${timestamp}] ${message}`);
    if (details) {
      console.log('   ', JSON.stringify(details, null, 2));
    }
  }

  // فحص الخوادم المتعددة
  async checkServers() {
    this.log('check', 'فحص الخوادم المتعددة...');
    
    const serverFiles = [
      'database-connected-server.cjs',
      'api-server.js',
      'src/api/server.ts',
      'src/api/server-mysql.ts',
      'src/api/server-mysql-complete.ts',
      'simple-products-api.js',
      'quick-products-api.js',
      'products-server-debug.cjs'
    ];

    for (const serverFile of serverFiles) {
      if (fs.existsSync(serverFile)) {
        this.servers.push(serverFile);
        
        try {
          const content = fs.readFileSync(serverFile, 'utf8');
          
          // فحص المنافذ
          const portMatches = content.match(/PORT.*?(\d{4,5})/g);
          if (portMatches) {
            portMatches.forEach(match => {
              const port = match.match(/(\d{4,5})/)[1];
              this.conflictingPorts.push({ file: serverFile, port });
            });
          }
          
          // فحص قواعد البيانات
          const hasMySQL = content.includes('mysql') || content.includes('MySQL');
          const hasSupabase = content.includes('supabase') || content.includes('Supabase');
          
          this.log('info', `خادم: ${serverFile}`, {
            hasMySQL,
            hasSupabase,
            ports: portMatches || []
          });
          
        } catch (error) {
          this.issues.push(`خطأ في قراءة ${serverFile}: ${error.message}`);
        }
      }
    }

    // تحليل تضارب المنافذ
    const portGroups = {};
    this.conflictingPorts.forEach(({ file, port }) => {
      if (!portGroups[port]) portGroups[port] = [];
      portGroups[port].push(file);
    });

    Object.entries(portGroups).forEach(([port, files]) => {
      if (files.length > 1) {
        this.issues.push(`تضارب في المنفذ ${port}: ${files.join(', ')}`);
      }
    });

    this.log('success', `تم العثور على ${this.servers.length} خادم`);
  }

  // فحص package.json
  async checkPackageJson() {
    this.log('check', 'فحص package.json...');
    
    if (!fs.existsSync('package.json')) {
      this.issues.push('ملف package.json مفقود');
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // فحص السكريبتات
      const scripts = packageJson.scripts || {};
      const hasDevScript = scripts.dev || scripts.start;

      if (!hasDevScript) {
        this.warnings.push('لا يوجد سكريبت dev أو start');
      }

      // فحص التبعيات المهمة
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      const requiredDeps = ['mysql2', 'express', 'cors'];
      
      requiredDeps.forEach(dep => {
        if (!deps[dep]) {
          this.missingDependencies.push(dep);
        }
      });

      this.log('success', 'تم فحص package.json');
      
    } catch (error) {
      this.issues.push(`خطأ في قراءة package.json: ${error.message}`);
    }
  }

  // فحص قواعد البيانات
  async checkDatabases() {
    this.log('check', 'فحص إعدادات قواعد البيانات...');
    
    const dbFiles = [
      '.env',
      'src/lib/mysql-api.ts',
      'src/lib/mysql-company-api.ts',
      'database-connected-server.cjs'
    ];

    let mysqlConfigs = 0;
    let supabaseConfigs = 0;

    for (const file of dbFiles) {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          if (content.includes('mysql') || content.includes('MySQL')) {
            mysqlConfigs++;
          }
          
          if (content.includes('supabase') || content.includes('Supabase')) {
            supabaseConfigs++;
          }
          
        } catch (error) {
          this.warnings.push(`لا يمكن قراءة ${file}`);
        }
      }
    }

    if (mysqlConfigs > 0 && supabaseConfigs > 0) {
      this.issues.push('تضارب بين MySQL و Supabase - يجب استخدام واحد فقط');
    }

    this.log('info', `إعدادات قواعد البيانات: MySQL=${mysqlConfigs}, Supabase=${supabaseConfigs}`);
  }

  // إنشاء التقرير
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 تقرير تشخيص النظام الشامل');
    console.log('='.repeat(60));

    // الخوادم
    console.log('\n🖥️ الخوادم الموجودة:');
    this.servers.forEach((server, index) => {
      console.log(`   ${index + 1}. ${server}`);
    });

    // المنافذ
    console.log('\n🔌 المنافذ المستخدمة:');
    const portGroups = {};
    this.conflictingPorts.forEach(({ file, port }) => {
      if (!portGroups[port]) portGroups[port] = [];
      portGroups[port].push(file);
    });
    
    Object.entries(portGroups).forEach(([port, files]) => {
      const status = files.length > 1 ? '❌ تضارب' : '✅ طبيعي';
      console.log(`   المنفذ ${port}: ${status} (${files.length} ملف)`);
    });

    // التبعيات المفقودة
    if (this.missingDependencies.length > 0) {
      console.log('\n📦 التبعيات المفقودة:');
      this.missingDependencies.forEach(dep => {
        console.log(`   - ${dep}`);
      });
    }

    // المشاكل
    if (this.issues.length > 0) {
      console.log('\n❌ المشاكل الحرجة:');
      this.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    // التحذيرات
    if (this.warnings.length > 0) {
      console.log('\n⚠️ التحذيرات:');
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    // الخلاصة
    console.log('\n📋 الخلاصة:');
    console.log(`   ✅ نجح: ${this.successes.length}`);
    console.log(`   ⚠️ تحذيرات: ${this.warnings.length}`);
    console.log(`   ❌ مشاكل: ${this.issues.length}`);
    console.log(`   🖥️ خوادم: ${this.servers.length}`);

    // التوصيات
    this.generateRecommendations();
  }

  // إنشاء التوصيات
  generateRecommendations() {
    console.log('\n💡 التوصيات:');
    
    if (this.servers.length > 3) {
      console.log('   1. دمج الخوادم المتعددة في خادم واحد موحد');
    }
    
    if (this.issues.some(issue => issue.includes('تضارب في المنفذ'))) {
      console.log('   2. حل تضارب المنافذ بتخصيص منافذ مختلفة');
    }
    
    if (this.missingDependencies.length > 0) {
      console.log('   3. تثبيت التبعيات المفقودة: npm install ' + this.missingDependencies.join(' '));
    }
    
    console.log('   4. استخدام خادم واحد فقط (database-connected-server.cjs)');
    console.log('   5. حذف ملفات Supabase إذا كنت تستخدم MySQL');
    console.log('   6. تشغيل: node system-cleanup.cjs لتنظيف تلقائي');
  }

  // تشغيل التشخيص الكامل
  async run() {
    console.log('🚀 بدء تشخيص النظام الشامل...\n');
    
    await this.checkServers();
    await this.checkPackageJson();
    await this.checkDatabases();
    
    this.generateReport();
    
    console.log('\n🎯 انتهى التشخيص!');
  }
}

// تشغيل الأداة
if (require.main === module) {
  const diagnosis = new SystemDiagnosis();
  diagnosis.run().catch(console.error);
}

module.exports = SystemDiagnosis;
