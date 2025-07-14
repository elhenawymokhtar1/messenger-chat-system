import { executeQuery } from '../config/mysql';

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: any;
}

export class SystemHealthCheck {
  
  /**
   * فحص شامل لصحة النظام
   */
  async runFullHealthCheck(companyId: string): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    
    try {
      // 1. فحص قاعدة البيانات
      results.push(await this.checkDatabaseConnection());
      
      // 2. فحص هيكل الجداول
      results.push(await this.checkTableStructure());
      
      // 3. فحص إعدادات Facebook
      results.push(await this.checkFacebookSettings(companyId));
      
      // 4. فحص صحة البيانات
      results.push(await this.checkDataIntegrity(companyId));
      
      // 5. فحص خدمة تحديث الأسماء
      results.push(await this.checkNameUpdateService(companyId));
      
    } catch (error) {
      results.push({
        component: 'System Health Check',
        status: 'error',
        message: 'فشل في تشغيل الفحص الشامل',
        details: error
      });
    }
    
    return results;
  }
  
  /**
   * فحص اتصال قاعدة البيانات
   */
  private async checkDatabaseConnection(): Promise<HealthCheckResult> {
    try {
      await executeQuery('SELECT 1');
      return {
        component: 'Database Connection',
        status: 'healthy',
        message: 'اتصال قاعدة البيانات يعمل بشكل طبيعي'
      };
    } catch (error) {
      return {
        component: 'Database Connection',
        status: 'error',
        message: 'فشل في الاتصال بقاعدة البيانات',
        details: error
      };
    }
  }
  
  /**
   * فحص هيكل الجداول المطلوبة
   */
  private async checkTableStructure(): Promise<HealthCheckResult> {
    try {
      const requiredTables = [
        'conversations',
        'facebook_pages_unified',
        'messages'
      ];
      
      const requiredColumns = {
        conversations: ['id', 'participant_id', 'customer_name', 'facebook_page_id', 'company_id', 'last_message_time'],
        facebook_pages_unified: ['page_id', 'access_token', 'company_id', 'is_active'],
        messages: ['id', 'conversation_id', 'sender_id', 'message_text', 'is_from_page']
      };
      
      for (const table of requiredTables) {
        const columns = await executeQuery(`DESCRIBE ${table}`);
        const columnNames = (columns as any[]).map(col => col.Field);
        
        const missingColumns = requiredColumns[table].filter(col => !columnNames.includes(col));
        
        if (missingColumns.length > 0) {
          return {
            component: 'Table Structure',
            status: 'error',
            message: `أعمدة مفقودة في جدول ${table}`,
            details: { missingColumns, availableColumns: columnNames }
          };
        }
      }
      
      return {
        component: 'Table Structure',
        status: 'healthy',
        message: 'هيكل الجداول صحيح'
      };
      
    } catch (error) {
      return {
        component: 'Table Structure',
        status: 'error',
        message: 'فشل في فحص هيكل الجداول',
        details: error
      };
    }
  }
  
  /**
   * فحص إعدادات Facebook
   */
  private async checkFacebookSettings(companyId: string): Promise<HealthCheckResult> {
    try {
      const settings = await executeQuery(
        'SELECT page_id, access_token, page_name FROM facebook_pages_unified WHERE company_id = ? AND is_active = 1',
        [companyId]
      );
      
      if (!settings || settings.length === 0) {
        return {
          component: 'Facebook Settings',
          status: 'error',
          message: 'لا توجد إعدادات Facebook نشطة للشركة'
        };
      }
      
      // فحص صحة Access Token
      const pageSettings = settings[0];
      const response = await fetch(`https://graph.facebook.com/me?access_token=${pageSettings.access_token}`);
      
      if (!response.ok) {
        return {
          component: 'Facebook Settings',
          status: 'error',
          message: 'Access Token غير صالح أو منتهي الصلاحية',
          details: { pageId: pageSettings.page_id, pageName: pageSettings.page_name }
        };
      }
      
      return {
        component: 'Facebook Settings',
        status: 'healthy',
        message: `إعدادات Facebook صحيحة (${settings.length} صفحة نشطة)`
      };
      
    } catch (error) {
      return {
        component: 'Facebook Settings',
        status: 'error',
        message: 'فشل في فحص إعدادات Facebook',
        details: error
      };
    }
  }
  
  /**
   * فحص سلامة البيانات
   */
  private async checkDataIntegrity(companyId: string): Promise<HealthCheckResult> {
    try {
      // فحص المحادثات بدون أسماء
      const conversationsWithoutNames = await executeQuery(
        `SELECT COUNT(*) as count FROM conversations
         WHERE company_id = ?
         AND participant_id IS NOT NULL
         AND participant_id != ''
         AND (customer_name IS NULL OR customer_name = '' OR customer_name = 'undefined')`,
        [companyId]
      );

      const missingNamesCount = conversationsWithoutNames[0].count;

      // فحص المحادثات اليتيمة (بدون رسائل)
      const orphanConversations = await executeQuery(
        `SELECT COUNT(*) as count FROM conversations c
         LEFT JOIN messages m ON c.id = m.conversation_id
         WHERE c.company_id = ? AND m.id IS NULL`,
        [companyId]
      );

      const orphanCount = orphanConversations[0].count;
      
      const warnings = [];
      if (missingNamesCount > 0) {
        warnings.push(`${missingNamesCount} محادثة بدون أسماء`);
      }
      if (orphanCount > 0) {
        warnings.push(`${orphanCount} محادثة بدون رسائل`);
      }
      
      if (warnings.length > 0) {
        return {
          component: 'Data Integrity',
          status: 'warning',
          message: 'توجد مشاكل في سلامة البيانات',
          details: { warnings, missingNamesCount, orphanCount }
        };
      }
      
      return {
        component: 'Data Integrity',
        status: 'healthy',
        message: 'سلامة البيانات جيدة'
      };
      
    } catch (error) {
      return {
        component: 'Data Integrity',
        status: 'error',
        message: 'فشل في فحص سلامة البيانات',
        details: error
      };
    }
  }
  
  /**
   * فحص خدمة تحديث الأسماء
   */
  private async checkNameUpdateService(companyId: string): Promise<HealthCheckResult> {
    try {
      // محاولة تحديث اسم واحد كاختبار
      const response = await fetch(`http://localhost:3002/api/companies/${companyId}/update-customer-names`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        return {
          component: 'Name Update Service',
          status: 'error',
          message: 'خدمة تحديث الأسماء لا تعمل',
          details: { status: response.status, statusText: response.statusText }
        };
      }
      
      const result = await response.json();
      
      return {
        component: 'Name Update Service',
        status: 'healthy',
        message: 'خدمة تحديث الأسماء تعمل بشكل طبيعي',
        details: result
      };
      
    } catch (error) {
      return {
        component: 'Name Update Service',
        status: 'error',
        message: 'فشل في اختبار خدمة تحديث الأسماء',
        details: error
      };
    }
  }
  
  /**
   * إنشاء تقرير مفصل
   */
  generateHealthReport(results: HealthCheckResult[]): string {
    const healthy = results.filter(r => r.status === 'healthy').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const errors = results.filter(r => r.status === 'error').length;
    
    let report = `
🏥 **تقرير صحة النظام**
========================

📊 **الملخص:**
- ✅ سليم: ${healthy}
- ⚠️ تحذيرات: ${warnings}  
- ❌ أخطاء: ${errors}

📋 **التفاصيل:**
`;
    
    results.forEach(result => {
      const icon = result.status === 'healthy' ? '✅' : 
                   result.status === 'warning' ? '⚠️' : '❌';
      
      report += `
${icon} **${result.component}**
   ${result.message}
`;
      
      if (result.details) {
        report += `   التفاصيل: ${JSON.stringify(result.details, null, 2)}\n`;
      }
    });
    
    return report;
  }
}

export const healthCheck = new SystemHealthCheck();
