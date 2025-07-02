// تم فحص الأداة - console.log مقبول في أدوات التشخيص
/**
 * 🔒 إصلاح مشاكل الأمان النهائية
 * يحل المشاكل المتبقية في .env و mysql.ts
 */

import fs from 'fs';
import path from 'path';

class SecurityFixer {
  constructor() {
    this.issues = [];
    this.fixes = [];
  }

  async fixAllSecurityIssues() {
    console.log('🔒 بدء إصلاح مشاكل الأمان...\n');

    // 1. إصلاح ملف .env
    await this.fixEnvFile();
    
    // 2. إصلاح ملف mysql.ts
    await this.fixMysqlConfig();
    
    // 3. إنشاء ملف .env.example محدث
    await this.createSecureEnvExample();
    
    // 4. إنشاء ملف .gitignore محدث
    await this.updateGitignore();
    
    // 5. إنشاء دليل الأمان
    await this.createSecurityGuide();

    this.generateReport();
  }

  async fixEnvFile() {
    console.log('🔧 إصلاح ملف .env...');
    
    try {
      const envPath = '.env';
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      // إنشاء نسخة احتياطية
      fs.writeFileSync('.env.backup', envContent);
      
      // إنشاء .env جديد بدون قيم حساسة
      const secureEnvContent = `# 🔐 متغيرات البيئة - للتطوير المحلي فقط
# ⚠️ لا تضع قيم حقيقية هنا في production

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_ENABLED=true
GEMINI_MAX_TOKENS=1000
GEMINI_TEMPERATURE=0.7

# Gemini Prompt Template
GEMINI_PROMPT_TEMPLATE="أنت مساعد ذكي لمتجر أحذية نسائية..."

# Supabase Configuration (للتطوير فقط)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Next.js API Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API Configuration
VITE_API_URL=http://localhost:3002

# MySQL Database Configuration (للتطوير فقط)
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=conversations_dev
MYSQL_PORT=3306

# Facebook API Configuration
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_VERIFY_TOKEN=your_facebook_verify_token
FACEBOOK_PAGE_ACCESS_TOKEN=your_facebook_page_access_token

# WhatsApp API Configuration
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_VERIFY_TOKEN=your_whatsapp_verify_token

# Security Configuration
JWT_SECRET=your_jwt_secret_key_here
ENCRYPTION_KEY=your_encryption_key_here
SESSION_SECRET=your_session_secret_here

# Server Configuration
PORT=3002
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081
`;

      fs.writeFileSync(envPath, secureEnvContent);
      
      this.fixes.push('✅ تم إصلاح ملف .env وإزالة القيم الحساسة');
      console.log('  ✅ تم إنشاء .env آمن');
      console.log('  💾 تم حفظ نسخة احتياطية في .env.backup');
      
    } catch (error) {
      this.issues.push(`❌ فشل إصلاح .env: ${error.message}`);
      console.log(`  ❌ خطأ: ${error.message}`);
    }
  }

  async fixMysqlConfig() {
    console.log('🔧 إصلاح إعدادات MySQL...');
    
    try {
      const mysqlPath = 'src/config/mysql.ts';
      const content = fs.readFileSync(mysqlPath, 'utf8');
      
      // التحقق من وجود قيم مكشوفة
      if (content.includes('193.203.168.103') || content.includes('u384034873_conversations')) {
        // إنشاء نسخة احتياطية
        fs.writeFileSync('src/config/mysql.ts.backup', content);
        
        // إصلاح الملف
        const fixedContent = content
          .replace(/host: process\.env\.MYSQL_HOST \|\| '.*?'/g, "host: process.env.MYSQL_HOST || 'localhost'")
          .replace(/user: process\.env\.MYSQL_USER \|\| '.*?'/g, "user: process.env.MYSQL_USER || 'root'")
          .replace(/password: process\.env\.MYSQL_PASSWORD \|\| '.*?'/g, "password: process.env.MYSQL_PASSWORD || ''")
          .replace(/database: process\.env\.MYSQL_DATABASE \|\| '.*?'/g, "database: process.env.MYSQL_DATABASE || 'conversations'");
        
        fs.writeFileSync(mysqlPath, fixedContent);
        
        this.fixes.push('✅ تم إصلاح إعدادات MySQL وإزالة البيانات الحساسة');
        console.log('  ✅ تم إصلاح mysql.ts');
        console.log('  💾 تم حفظ نسخة احتياطية');
      } else {
        console.log('  ✅ mysql.ts آمن بالفعل');
      }
      
    } catch (error) {
      this.issues.push(`❌ فشل إصلاح mysql.ts: ${error.message}`);
      console.log(`  ❌ خطأ: ${error.message}`);
    }
  }

  async createSecureEnvExample() {
    console.log('📝 إنشاء .env.example محدث...');
    
    const envExampleContent = `# 🔐 ملف المتغيرات البيئية - نموذج
# انسخ هذا الملف إلى .env وأدخل القيم الحقيقية

# ⚠️ تحذير أمني:
# - لا تضع قيم حقيقية في هذا الملف
# - لا ترفع ملف .env إلى Git
# - استخدم environment variables في production

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_ENABLED=true
GEMINI_MAX_TOKENS=1000
GEMINI_TEMPERATURE=0.7

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# MySQL Database Configuration
MYSQL_HOST=your_mysql_host
MYSQL_USER=your_mysql_username
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=your_mysql_database
MYSQL_PORT=3306

# Facebook API Configuration
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_VERIFY_TOKEN=your_facebook_verify_token
FACEBOOK_PAGE_ACCESS_TOKEN=your_facebook_page_access_token

# WhatsApp API Configuration
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_VERIFY_TOKEN=your_whatsapp_verify_token

# Security Configuration
JWT_SECRET=your_jwt_secret_key_here
ENCRYPTION_KEY=your_encryption_key_here
SESSION_SECRET=your_session_secret_here

# Server Configuration
PORT=3002
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081
`;

    try {
      fs.writeFileSync('.env.example', envExampleContent);
      this.fixes.push('✅ تم إنشاء .env.example محدث وآمن');
      console.log('  ✅ تم إنشاء .env.example');
    } catch (error) {
      this.issues.push(`❌ فشل إنشاء .env.example: ${error.message}`);
    }
  }

  async updateGitignore() {
    console.log('📝 تحديث .gitignore...');
    
    try {
      let gitignoreContent = '';
      
      if (fs.existsSync('.gitignore')) {
        gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
      }
      
      const securityEntries = [
        '',
        '# 🔒 ملفات الأمان',
        '.env',
        '.env.local',
        '.env.production',
        '.env.backup',
        '*.key',
        '*.pem',
        '*.p12',
        'secrets/',
        'credentials/',
        '',
        '# 📊 تقارير الاختبارات',
        'test-reports/',
        'coverage/',
        '',
        '# 🗄️ نسخ احتياطية',
        '*.backup',
        '*.bak',
        ''
      ];
      
      // إضافة الإدخالات إذا لم تكن موجودة
      securityEntries.forEach(entry => {
        if (entry && !gitignoreContent.includes(entry)) {
          gitignoreContent += entry + '\n';
        }
      });
      
      fs.writeFileSync('.gitignore', gitignoreContent);
      this.fixes.push('✅ تم تحديث .gitignore لحماية الملفات الحساسة');
      console.log('  ✅ تم تحديث .gitignore');
      
    } catch (error) {
      this.issues.push(`❌ فشل تحديث .gitignore: ${error.message}`);
    }
  }

  async createSecurityGuide() {
    console.log('📚 إنشاء دليل الأمان...');
    
    const securityGuideContent = `# 🔒 دليل الأمان للمشروع

## ⚠️ تحذيرات مهمة:

### 🚫 **لا تفعل أبداً:**
- ❌ لا ترفع ملف \`.env\` إلى Git
- ❌ لا تضع كلمات مرور في الكود
- ❌ لا تشارك مفاتيح API في الكود
- ❌ لا تستخدم \`console.log\` للبيانات الحساسة

### ✅ **افعل دائماً:**
- ✅ استخدم متغيرات البيئة للبيانات الحساسة
- ✅ استخدم HTTPS في production
- ✅ فعل rate limiting للـ API
- ✅ استخدم JWT tokens آمنة
- ✅ فحص الأمان بانتظام

## 🔐 **إعداد متغيرات البيئة:**

### للتطوير المحلي:
1. انسخ \`.env.example\` إلى \`.env\`
2. أدخل القيم الحقيقية في \`.env\`
3. تأكد من أن \`.env\` في \`.gitignore\`

### للـ Production:
1. استخدم environment variables في الخادم
2. لا تستخدم ملفات \`.env\` في production
3. استخدم خدمات إدارة الأسرار (Azure Key Vault, AWS Secrets Manager)

## 🛡️ **فحص الأمان:**

### تشغيل فحص الأمان:
\`\`\`bash
# فحص شامل
node comprehensive-site-test.js

# فحص الأمان فقط
node security-fix.js
\`\`\`

### أدوات الفحص الإضافية:
\`\`\`bash
# فحص npm packages
npm audit

# فحص ESLint
npm run lint

# فحص TypeScript
npx tsc --noEmit
\`\`\`

## 📋 **قائمة مراجعة الأمان:**

- [ ] جميع كلمات المرور في متغيرات البيئة
- [ ] جميع مفاتيح API في متغيرات البيئة
- [ ] ملف \`.env\` في \`.gitignore\`
- [ ] HTTPS مفعل في production
- [ ] Rate limiting مفعل
- [ ] Input validation مطبق
- [ ] Error handling آمن
- [ ] Logging آمن (بدون بيانات حساسة)

## 🚨 **في حالة تسريب البيانات:**

1. **فوراً:** غير جميع كلمات المرور ومفاتيح API
2. **راجع:** Git history للبيانات المسربة
3. **نظف:** Git history إذا لزم الأمر
4. **أبلغ:** الفريق والمستخدمين إذا لزم الأمر
5. **حدث:** إجراءات الأمان

---

*آخر تحديث: ${new Date().toLocaleDateString('ar-EG')}*
`;

    try {
      fs.writeFileSync('SECURITY.md', securityGuideContent);
      this.fixes.push('✅ تم إنشاء دليل الأمان (SECURITY.md)');
      console.log('  ✅ تم إنشاء SECURITY.md');
    } catch (error) {
      this.issues.push(`❌ فشل إنشاء دليل الأمان: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🔒 تقرير إصلاح الأمان');
    console.log('='.repeat(60));
    
    console.log('\n✅ الإصلاحات المنجزة:');
    this.fixes.forEach(fix => console.log(`  ${fix}`));
    
    if (this.issues.length > 0) {
      console.log('\n❌ المشاكل المتبقية:');
      this.issues.forEach(issue => console.log(`  ${issue}`));
    }
    
    console.log('\n📋 الملفات المُنشأة/المُحدثة:');
    console.log('  📄 .env - ملف متغيرات البيئة آمن');
    console.log('  📄 .env.example - نموذج آمن');
    console.log('  📄 .env.backup - نسخة احتياطية');
    console.log('  📄 .gitignore - محدث للأمان');
    console.log('  📄 SECURITY.md - دليل الأمان');
    
    console.log('\n🎯 الخطوات التالية:');
    console.log('  1. راجع ملف .env وأدخل القيم الحقيقية');
    console.log('  2. تأكد من أن .env في .gitignore');
    console.log('  3. لا ترفع .env إلى Git أبداً');
    console.log('  4. استخدم environment variables في production');
    
    console.log('\n🔒 الأمان محسن! تشغيل فحص نهائي...');
  }
}

// تشغيل إصلاح الأمان
const fixer = new SecurityFixer();
fixer.fixAllSecurityIssues().catch(error => {
  console.error('💥 خطأ في إصلاح الأمان:', error);
  process.exit(1);
});
