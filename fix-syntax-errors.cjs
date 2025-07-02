/**
 * 🔧 إصلاح أخطاء Syntax في الملفات
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/api/subscription-routes.ts',
  'src/api/whatsapp-baileys-routes.ts',
  'src/services/baileysWhatsAppService.ts',
  'src/services/permissionsService.ts',
  'src/services/usageTrackingService.ts'
];

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ الملف غير موجود: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // إصلاح الخطأ الأساسي
    const brokenPattern = /const supabaseUrl = 'https:\/\/ddwszecfsfkjnahesymm\.\/\/ TODO: Replace with MySQL APIconst supabaseKey = 'eyJ[^']+';/g;
    
    if (brokenPattern.test(content)) {
      content = content.replace(brokenPattern, '// TODO: Replace with MySQL API\n// إعداد قاعدة البيانات المحلية بدلاً من Supabase');
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ تم إصلاح: ${filePath}`);
    } else {
      console.log(`ℹ️ لا يحتاج إصلاح: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ خطأ في إصلاح ${filePath}:`, error.message);
  }
}

console.log('🔧 بدء إصلاح أخطاء Syntax...');

filesToFix.forEach(fixFile);

console.log('✅ تم الانتهاء من الإصلاح!');
