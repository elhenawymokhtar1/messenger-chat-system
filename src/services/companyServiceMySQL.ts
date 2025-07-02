/**
 * 🏢 خدمة الشركات - MySQL
 * تحل محل Supabase للتعامل مع الشركات
 */

import crypto from 'crypto';
import { executeQuery } from '../config/mysql';

export interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country: string;
  status: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface CompanyRegistrationData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
}

export class CompanyServiceMySQL {
  
  /**
   * 🏢 تسجيل شركة جديدة
   */
  static async registerCompany(data: CompanyRegistrationData): Promise<{
    success: boolean;
    message: string;
    company?: Company;
  }> {
    try {
      console.log('🏢 [MYSQL] تسجيل شركة جديدة:', data.name);
      
      // التحقق من البيانات المطلوبة
      if (!data.name || !data.email || !data.password) {
        return {
          success: false,
          message: 'اسم الشركة والإيميل وكلمة المرور مطلوبة'
        };
      }
      
      // التحقق من صحة الإيميل
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return {
          success: false,
          message: 'صيغة الإيميل غير صحيحة'
        };
      }
      
      // التحقق من قوة كلمة المرور
      if (data.password.length < 6) {
        return {
          success: false,
          message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
        };
      }
      
      // التحقق من عدم وجود الإيميل
      const existingCompanies = await executeQuery(
        'SELECT id FROM companies WHERE email = ?', 
        [data.email.toLowerCase()]
      );
      
      if (existingCompanies.length > 0) {
        return {
          success: false,
          message: 'هذا الإيميل مسجل بالفعل'
        };
      }
      
      // تشفير كلمة المرور
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash(data.password, 12);
      
      // إنشاء الشركة
      const companyId = crypto.randomUUID();
      await executeQuery(`
        INSERT INTO companies (
          id, name, email, password_hash, phone, website, 
          address, city, country, is_verified, status, 
          subscription_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, 'active', 'active', NOW(), NOW())
      `, [
        companyId, 
        data.name, 
        data.email.toLowerCase(), 
        passwordHash, 
        data.phone || null, 
        data.website || null, 
        data.address || null, 
        data.city || null, 
        data.country || 'Egypt'
      ]);
      
      // جلب الشركة المنشأة
      const companies = await executeQuery(
        'SELECT * FROM companies WHERE id = ?', 
        [companyId]
      );
      
      const company = companies[0] as Company;
      
      // إعداد الشركة الجديدة
      await this.setupNewCompany(companyId, data.name);
      
      console.log(`✅ [MYSQL] تم تسجيل الشركة بنجاح: ${data.name}`);
      
      return {
        success: true,
        message: 'تم تسجيل الشركة بنجاح',
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          phone: company.phone,
          website: company.website,
          address: company.address,
          city: company.city,
          country: company.country,
          status: company.status,
          subscription_status: company.subscription_status,
          created_at: company.created_at,
          updated_at: company.updated_at
        }
      };
      
    } catch (error) {
      console.error('❌ [MYSQL] خطأ في تسجيل الشركة:', error);
      
      if (error.message.includes('duplicate') || error.message.includes('Duplicate')) {
        return {
          success: false,
          message: 'الإيميل مستخدم بالفعل'
        };
      }
      
      return {
        success: false,
        message: 'فشل في تسجيل الشركة'
      };
    }
  }
  
  /**
   * 🔐 تسجيل دخول الشركة
   */
  static async loginCompany(email: string, password: string): Promise<{
    success: boolean;
    message: string;
    company?: Company;
  }> {
    try {
      console.log('🔐 [MYSQL] تسجيل دخول شركة:', email);
      
      if (!email || !password) {
        return {
          success: false,
          message: 'الإيميل وكلمة المرور مطلوبان'
        };
      }
      
      // البحث عن الشركة
      const companies = await executeQuery(
        'SELECT * FROM companies WHERE email = ?', 
        [email.toLowerCase()]
      );
      
      if (companies.length === 0) {
        return {
          success: false,
          message: 'الإيميل أو كلمة المرور غير صحيحة'
        };
      }
      
      const company = companies[0] as Company;
      
      // التحقق من كلمة المرور
      const bcrypt = await import('bcrypt');
      const isValidPassword = await bcrypt.compare(password, (company as any).password_hash);
      
      if (!isValidPassword) {
        return {
          success: false,
          message: 'الإيميل أو كلمة المرور غير صحيحة'
        };
      }
      
      // تحديث آخر تسجيل دخول
      await executeQuery(
        'UPDATE companies SET last_login_at = NOW() WHERE id = ?', 
        [company.id]
      );
      
      console.log(`✅ [MYSQL] تم تسجيل الدخول بنجاح: ${company.name}`);
      
      return {
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          phone: company.phone,
          website: company.website,
          address: company.address,
          city: company.city,
          country: company.country,
          status: company.status,
          subscription_status: company.subscription_status,
          created_at: company.created_at,
          updated_at: company.updated_at,
          last_login_at: company.last_login_at
        }
      };
      
    } catch (error) {
      console.error('❌ [MYSQL] خطأ في تسجيل الدخول:', error);
      return {
        success: false,
        message: 'فشل في تسجيل الدخول'
      };
    }
  }
  
  /**
   * 🔧 إعداد الشركة الجديدة
   */
  private static async setupNewCompany(companyId: string, companyName: string): Promise<void> {
    try {
      console.log(`🔧 [MYSQL] إعداد الشركة الجديدة: ${companyName}`);
      
      // إنشاء إعدادات Gemini افتراضية
      try {
        await executeQuery(`
          INSERT INTO gemini_settings (
            id, company_id, model, temperature, max_tokens, 
            system_prompt, is_enabled, created_at, updated_at
          ) VALUES (?, ?, 'gemini-1.5-flash', 0.7, 1000, 
            'أنت مساعد ذكي للرد على استفسارات العملاء. كن مفيداً ومهذباً.', 
            FALSE, NOW(), NOW())
        `, [crypto.randomUUID(), companyId]);
        
        console.log('✅ [MYSQL] تم إنشاء إعدادات Gemini افتراضية');
      } catch (error) {
        console.log('⚠️ [MYSQL] خطأ في إنشاء إعدادات Gemini:', error.message);
      }
      
      // إنشاء متجر افتراضي
      try {
        await executeQuery(`
          INSERT INTO stores (
            id, company_id, name, slug, description, 
            owner_email, currency, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'EGP', TRUE, NOW(), NOW())
        `, [
          crypto.randomUUID(), 
          companyId, 
          `متجر ${companyName}`, 
          `store-${companyId.substring(0, 8)}`, 
          `المتجر الإلكتروني لشركة ${companyName}`, 
          ''
        ]);
        
        console.log('✅ [MYSQL] تم إنشاء متجر افتراضي');
      } catch (error) {
        console.log('⚠️ [MYSQL] خطأ في إنشاء المتجر:', error.message);
      }
      
      // إنشاء إعدادات WhatsApp افتراضية
      try {
        await executeQuery(`
          INSERT INTO whatsapp_settings (
            id, company_id, session_name, is_active, 
            auto_reply_enabled, welcome_message, created_at, updated_at
          ) VALUES (?, ?, 'whatsapp-session', TRUE, TRUE, 
            'مرحباً بك! كيف يمكنني مساعدتك؟', NOW(), NOW())
        `, [crypto.randomUUID(), companyId]);
        
        console.log('✅ [MYSQL] تم إنشاء إعدادات WhatsApp افتراضية');
      } catch (error) {
        console.log('⚠️ [MYSQL] خطأ في إنشاء إعدادات WhatsApp:', error.message);
      }
      
      console.log(`✅ [MYSQL] تم إعداد الشركة ${companyName} بنجاح`);
      
    } catch (error) {
      console.error(`❌ [MYSQL] خطأ في إعداد الشركة ${companyName}:`, error);
    }
  }
  
  /**
   * 📋 جلب معلومات الشركة
   */
  static async getCompany(companyId: string): Promise<Company | null> {
    try {
      const companies = await executeQuery(
        'SELECT * FROM companies WHERE id = ?', 
        [companyId]
      );
      
      return companies.length > 0 ? companies[0] as Company : null;
    } catch (error) {
      console.error('❌ [MYSQL] خطأ في جلب الشركة:', error);
      return null;
    }
  }
  
  /**
   * 📋 جلب جميع الشركات
   */
  static async getAllCompanies(): Promise<Company[]> {
    try {
      const companies = await executeQuery(
        'SELECT * FROM companies ORDER BY created_at DESC'
      );
      
      return companies as Company[];
    } catch (error) {
      console.error('❌ [MYSQL] خطأ في جلب الشركات:', error);
      return [];
    }
  }
}
