/**
 * نظام حماية العزل - يضمن عدم تكرار مشاكل العزل في المستقبل
 * Isolation Guard System - Prevents isolation issues from recurring
 */

import { Request, Response, NextFunction } from 'express';

// قائمة الجداول التي تحتاج عزل
const TABLES_REQUIRING_ISOLATION = [
  'products',
  'categories', 
  'orders',
  'coupons',
  'shipping_methods',
  'payment_methods',
  'stores',
  'customers'
];

// قائمة أعمدة العزل المقبولة
const ISOLATION_COLUMNS = ['company_id', 'store_id'];

/**
 * فحص وجود عزل في استعلام SQL
 */
export function validateIsolationInQuery(query: string, companyId: string): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // تحويل الاستعلام إلى أحرف صغيرة للفحص
  const lowerQuery = query.toLowerCase();
  
  // فحص الجداول المستخدمة
  const usedTables = TABLES_REQUIRING_ISOLATION.filter(table => 
    lowerQuery.includes(table)
  );
  
  if (usedTables.length === 0) {
    return { isValid: true, warnings, suggestions };
  }
  
  // فحص وجود عزل
  const hasIsolation = ISOLATION_COLUMNS.some(column => 
    lowerQuery.includes(column)
  );
  
  if (!hasIsolation) {
    warnings.push(`⚠️ استعلام بدون عزل يستخدم الجداول: ${usedTables.join(', ')}`);
    suggestions.push(`💡 أضف WHERE company_id = '${companyId}' أو WHERE store_id = ?`);
  }
  
  // فحص استعلامات SELECT بدون WHERE
  if (lowerQuery.includes('select') && !lowerQuery.includes('where')) {
    warnings.push('⚠️ استعلام SELECT بدون شرط WHERE - قد يجلب بيانات جميع الشركات');
    suggestions.push('💡 أضف شرط WHERE للعزل');
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions
  };
}

/**
 * Middleware للتحقق من العزل في طلبات API
 */
export function isolationGuardMiddleware(req: Request, res: Response, next: NextFunction) {
  const companyId = req.params.companyId;
  
  if (!companyId) {
    console.log('⚠️ [ISOLATION-GUARD] طلب API بدون companyId');
    return res.status(400).json({
      success: false,
      error: 'معرف الشركة مطلوب للعزل',
      code: 'MISSING_COMPANY_ID'
    });
  }
  
  // التحقق من صحة معرف الشركة
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(companyId)) {
    console.log('⚠️ [ISOLATION-GUARD] معرف شركة غير صحيح:', companyId);
    return res.status(400).json({
      success: false,
      error: 'معرف الشركة غير صحيح',
      code: 'INVALID_COMPANY_ID'
    });
  }
  
  // إضافة معلومات العزل للطلب
  req.isolation = {
    companyId,
    timestamp: new Date().toISOString(),
    path: req.path
  };
  
  console.log(`🔒 [ISOLATION-GUARD] طلب معزول للشركة: ${companyId}`);
  next();
}

/**
 * دالة مساعدة لإنشاء استعلامات معزولة
 */
export class IsolatedQueryBuilder {
  private companyId: string;
  private storeId?: string;
  
  constructor(companyId: string, storeId?: string) {
    this.companyId = companyId;
    this.storeId = storeId;
  }
  
  /**
   * إنشاء شرط WHERE للعزل
   */
  getIsolationWhere(tableName: string): string {
    if (TABLES_REQUIRING_ISOLATION.includes(tableName)) {
      // محاولة استخدام company_id أولاً، ثم store_id
      return `${tableName}.company_id = ? OR ${tableName}.store_id = ?`;
    }
    return '1=1'; // لا يحتاج عزل
  }
  
  /**
   * الحصول على قيم العزل
   */
  getIsolationValues(): (string | undefined)[] {
    return [this.companyId, this.storeId].filter(Boolean);
  }
  
  /**
   * إنشاء استعلام SELECT معزول
   */
  buildSelectQuery(
    table: string, 
    columns: string = '*', 
    additionalWhere: string = '',
    orderBy: string = '',
    limit?: number,
    offset?: number
  ): { query: string; values: any[] } {
    
    let query = `SELECT ${columns} FROM ${table}`;
    const values: any[] = [];
    
    // إضافة شروط العزل
    const isolationWhere = this.getIsolationWhere(table);
    const whereConditions = [isolationWhere];
    
    if (additionalWhere) {
      whereConditions.push(additionalWhere);
    }
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
      values.push(...this.getIsolationValues());
    }
    
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }
    
    if (limit) {
      query += ` LIMIT ${limit}`;
      if (offset) {
        query += ` OFFSET ${offset}`;
      }
    }
    
    return { query, values };
  }
  
  /**
   * إنشاء استعلام INSERT معزول
   */
  buildInsertQuery(
    table: string,
    data: Record<string, any>
  ): { query: string; values: any[] } {
    
    // إضافة معرف الشركة تلقائياً
    if (TABLES_REQUIRING_ISOLATION.includes(table)) {
      if (!data.company_id && !data.store_id) {
        data.company_id = this.companyId;
        if (this.storeId) {
          data.store_id = this.storeId;
        }
      }
    }
    
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);
    
    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    return { query, values };
  }
  
  /**
   * إنشاء استعلام UPDATE معزول
   */
  buildUpdateQuery(
    table: string,
    data: Record<string, any>,
    id: string
  ): { query: string; values: any[] } {
    
    const setClause = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(data), id, ...this.getIsolationValues()];
    
    const isolationWhere = this.getIsolationWhere(table);
    const query = `UPDATE ${table} SET ${setClause} WHERE id = ? AND (${isolationWhere})`;
    
    return { query, values };
  }
  
  /**
   * إنشاء استعلام DELETE معزول
   */
  buildDeleteQuery(table: string, id: string): { query: string; values: any[] } {
    const isolationWhere = this.getIsolationWhere(table);
    const query = `DELETE FROM ${table} WHERE id = ? AND (${isolationWhere})`;
    const values = [id, ...this.getIsolationValues()];
    
    return { query, values };
  }
}

/**
 * دالة للتحقق من حالة العزل في النظام
 */
export async function checkIsolationHealth(pool: any): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  try {
    // فحص وجود أعمدة العزل في الجداول
    for (const table of TABLES_REQUIRING_ISOLATION) {
      try {
        const [columns] = await pool.execute(`DESCRIBE ${table}`);
        const columnNames = columns.map((col: any) => col.Field);
        
        const hasIsolationColumn = ISOLATION_COLUMNS.some(col => 
          columnNames.includes(col)
        );
        
        if (!hasIsolationColumn) {
          issues.push(`⚠️ جدول ${table} لا يحتوي على أعمدة العزل`);
          recommendations.push(`💡 أضف عمود company_id أو store_id إلى جدول ${table}`);
        }
      } catch (error) {
        // الجدول غير موجود
        console.log(`ℹ️ جدول ${table} غير موجود`);
      }
    }
    
    // تحديد حالة النظام
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.length > 0) {
      status = issues.length > 3 ? 'critical' : 'warning';
    }
    
    return { status, issues, recommendations };
    
  } catch (error) {
    return {
      status: 'critical',
      issues: ['خطأ في فحص حالة العزل'],
      recommendations: ['تحقق من اتصال قاعدة البيانات']
    };
  }
}

// إضافة أنواع TypeScript
declare global {
  namespace Express {
    interface Request {
      isolation?: {
        companyId: string;
        timestamp: string;
        path: string;
      };
    }
  }
}
