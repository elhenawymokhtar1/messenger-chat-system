/**
 * 🏥 فاحص صحة النظام
 * تم إنشاؤه تلقائياً بواسطة Tools Tester
 */

import fs from 'fs';
import { execSync } from 'child_process';

class HealthChecker {
  async checkSystemHealth() {
    console.log('🏥 فحص صحة النظام...');
    
    const checks = [
      { name: 'Node.js', check: () => process.version },
      { name: 'npm', check: () => execSync('npm --version', { encoding: 'utf8' }).trim() },
      { name: 'TypeScript', check: () => execSync('npx tsc --version', { encoding: 'utf8' }).trim() },
      { name: 'package.json', check: () => fs.existsSync('package.json') ? 'موجود' : 'مفقود' }
    ];
    
    for (const check of checks) {
      try {
        const result = check.check();
        console.log(`✅ ${check.name}: ${result}`);
      } catch (error) {
        console.log(`❌ ${check.name}: خطأ`);
      }
    }
  }
}

const checker = new HealthChecker();
checker.checkSystemHealth().catch(console.error);