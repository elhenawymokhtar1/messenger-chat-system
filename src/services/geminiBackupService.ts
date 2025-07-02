import fs from 'fs';
import path from 'path';
import { GeminiSettings } from './geminiAi';

export class GeminiBackupService {
  private static backupFilePath = path.join(process.cwd(), 'src/config/gemini-backup.json');

  // حفظ الإعدادات في الملف المحلي
  static async saveToBackup(settings: GeminiSettings): Promise<void> {
    try {
      const backupData = {
        ...settings,
        backup_timestamp: new Date().toISOString(),
        auto_restore: true
      };

      // إنشاء المجلد إذا لم يكن موجود
      const configDir = path.dirname(this.backupFilePath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      fs.writeFileSync(this.backupFilePath, JSON.stringify(backupData, null, 2));
      console.log('✅ Gemini settings backed up successfully');
    } catch (error) {
      console.error('❌ Error backing up Gemini settings:', error);
    }
  }

  // استرجاع الإعدادات من الملف المحلي
  static async loadFromBackup(): Promise<GeminiSettings | null> {
    try {
      if (!fs.existsSync(this.backupFilePath)) {
        console.log('⚠️ No backup file found');
        return null;
      }

      const backupData = JSON.parse(fs.readFileSync(this.backupFilePath, 'utf8'));
      console.log('✅ Gemini settings loaded from backup');
      
      return {
        api_key: backupData.api_key,
        model: backupData.model,
        is_enabled: backupData.is_enabled,
        max_tokens: backupData.max_tokens,
        temperature: backupData.temperature,
        prompt_template: backupData.prompt_template
      };
    } catch (error) {
      console.error('❌ Error loading backup:', error);
      return null;
    }
  }

  // استرجاع الإعدادات تلقائ<|im_start|> إلى قاعدة البيانات
  static async restoreToDatabase(): Promise<boolean> {
    try {
      const backupSettings = await this.loadFromBackup();
      if (!backupSettings) {
        console.log('❌ No backup settings to restore');
        return false;
      }

      // حفظ في قاعدة البيانات
      const { error } = await supabase
        // TODO: Replace with MySQL API
        .upsert({
          ...backupSettings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error restoring to database:', error);
        return false;
      }

      console.log('🔄 Gemini settings restored to database from backup');
      return true;
    } catch (error) {
      console.error('❌ Error in restore process:', error);
      return false;
    }
  }

  // التحقق من وجود الإعدادات واسترجاعها إذا لزم الأمر
  static async ensureSettingsExist(): Promise<GeminiSettings | null> {
    try {
      // محاولة الحصول على الإعدادات من قاعدة البيانات
      const { data, error } = await supabase
        // TODO: Replace with MySQL API
        // TODO: Replace with MySQL API
        .single();

      if (data && !error) {
        console.log('✅ Gemini settings found in database');
        // حفظ backup جديد
        await this.saveToBackup(data);
        return data;
      }

      // إذا لم توجد في قاعدة البيانات، استرجع من الـ backup
      console.log('⚠️ Gemini settings not found in database, trying backup...');
      const restored = await this.restoreToDatabase();
      
      if (restored) {
        // إعادة محاولة الحصول على الإعدادات
        const { data: restoredData } = await supabase
          // TODO: Replace with MySQL API
          // TODO: Replace with MySQL API
          .single();
        
        return restoredData;
      }

      return null;
    } catch (error) {
      console.error('❌ Error ensuring settings exist:', error);
      return null;
    }
  }

  // تحديث الإعدادات مع حفظ backup
  static async updateSettings(settings: Partial<GeminiSettings>): Promise<void> {
    try {
      // تحديث قاعدة البيانات
      const { error } = await supabase
        // TODO: Replace with MySQL API
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      // حفظ backup
      const fullSettings = await this.ensureSettingsExist();
      if (fullSettings) {
        await this.saveToBackup(fullSettings);
      }

      console.log('✅ Gemini settings updated and backed up');
    } catch (error) {
      console.error('❌ Error updating settings:', error);
      throw error;
    }
  }
}
