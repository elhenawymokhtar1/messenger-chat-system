// 🗄️ إعداد الاتصال بقاعدة بيانات MySQL للواجهة الأمامية
// هذا الملف للخادم فقط - الواجهة الأمامية تستخدم HTTP APIs
import mysql from 'mysql2/promise';

// إعدادات قاعدة البيانات
export const DB_CONFIG = {
  host: process.env.MYSQL_HOST || '193.203.168.103',
  user: process.env.MYSQL_USER || 'u384034873_conversations',
  password: process.env.MYSQL_PASSWORD || '0165676135Aa@A',
  database: process.env.MYSQL_DATABASE || 'u384034873_conversations',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  charset: 'utf8mb4',
  timezone: '+00:00',
  connectTimeout: 10000,
  // إعدادات pool للاتصالات المتعددة
  connectionLimit: 10,
  queueLimit: 0,
  // إعدادات إضافية للأداء
  dateStrings: true,
  supportBigNumbers: true,
  bigNumberStrings: true
};

// إنشاء pool للاتصالات
let pool: any | null = null;

/**
 * الحصول على pool الاتصالات
 */
export function getPool(): any {
  if (!pool) {
    pool = mysql.createPool(DB_CONFIG);
    console.log('🔌 تم إنشاء pool اتصالات MySQL');
  }
  return pool;
}

/**
 * الحصول على اتصال واحد
 */
export async function getConnection(): Promise<mysql.PoolConnection> {
  const pool = getPool();
  return await pool.getConnection();
}

/**
 * تنفيذ استعلام مع معاملات
 */
export async function executeQuery<T = any>(
  query: string, 
  params: any[] = []
): Promise<T[]> {
  const connection = await getConnection();
  
  try {
    const [rows] = await connection.execute(query, params);
    return rows as T[];
  } finally {
    connection.release();
  }
}

/**
 * تنفيذ استعلام إدراج والحصول على ID
 */
export async function executeInsert(
  query: string, 
  params: any[] = []
): Promise<{ insertId: string; affectedRows: number }> {
  const connection = await getConnection();
  
  try {
    const [result] = await connection.execute(query, params);
    const insertResult = result as mysql.ResultSetHeader;
    
    return {
      insertId: insertResult.insertId?.toString() || '',
      affectedRows: insertResult.affectedRows
    };
  } finally {
    connection.release();
  }
}

/**
 * تنفيذ استعلام تحديث أو حذف
 */
export async function executeUpdate(
  query: string, 
  params: any[] = []
): Promise<{ affectedRows: number; changedRows: number }> {
  const connection = await getConnection();
  
  try {
    const [result] = await connection.execute(query, params);
    const updateResult = result as mysql.ResultSetHeader;
    
    return {
      affectedRows: updateResult.affectedRows,
      changedRows: updateResult.changedRows || 0
    };
  } finally {
    connection.release();
  }
}

/**
 * تنفيذ معاملة (transaction)
 */
export async function executeTransaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * اختبار الاتصال
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await executeQuery('SELECT 1 as test');
    return result.length > 0;
  } catch (error) {
    console.error('❌ خطأ في اختبار الاتصال:', error);
    return false;
  }
}

/**
 * إغلاق pool الاتصالات
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('🔌 تم إغلاق pool اتصالات MySQL');
  }
}

/**
 * معلومات حالة قاعدة البيانات
 */
export async function getDatabaseInfo(): Promise<{
  version: string;
  charset: string;
  collation: string;
  tablesCount: number;
}> {
  try {
    const [versionResult] = await executeQuery('SELECT VERSION() as version');
    const [charsetResult] = await executeQuery(`
      SELECT 
        @@character_set_database as charset,
        @@collation_database as collation
    `);
    const [tablesResult] = await executeQuery('SHOW TABLES');
    
    return {
      version: versionResult.version,
      charset: charsetResult.charset,
      collation: charsetResult.collation,
      tablesCount: tablesResult.length
    };
  } catch (error) {
    console.error('❌ خطأ في الحصول على معلومات قاعدة البيانات:', error);
    throw error;
  }
}

// تصدير الأنواع المفيدة
export type { PoolConnection, ResultSetHeader } from 'mysql2/promise';

// تهيئة pool عند تحميل الملف
getPool();
