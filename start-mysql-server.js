// 🚀 تشغيل الخادم الجديد مع MySQL
import { spawn } from 'child_process';
import colors from 'colors';

console.log('🚀 بدء تشغيل خادم MySQL الجديد...'.cyan.bold);
console.log('');

// تشغيل الخادم الجديد
const serverProcess = spawn('npx', ['tsx', 'src/api/server-mysql.ts'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

serverProcess.on('error', (error) => {
  console.error('❌ خطأ في تشغيل الخادم:', error.message.red);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  if (code !== 0) {
    console.log(`❌ الخادم توقف بكود: ${code}`.red);
  } else {
    console.log('✅ تم إيقاف الخادم بنجاح'.green);
  }
  process.exit(code);
});

// التعامل مع إشارات الإيقاف
process.on('SIGINT', () => {
  console.log('\n🛑 إيقاف الخادم...'.yellow);
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 إيقاف الخادم...'.yellow);
  serverProcess.kill('SIGTERM');
});
