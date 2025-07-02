const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY3NjY4MDYsImV4cCI6MjAzMjM0MjgwNn0.Ej_gqZBbNgfiho_KQSxhLSALaLfKjjHjkWgxNjkwOQs';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📝 إنشاء جدول سجل أنشطة المدير الأساسي');
console.log('═══════════════════════════════════════════════════════════════');

async function createSuperAdminLogsTable() {
  try {
    console.log('\n1️⃣ إنشاء جدول super_admin_logs...');
    
    const createTableSQL = `
      -- ===================================
      -- 📝 جدول سجل أنشطة المدير الأساسي
      -- ===================================

      CREATE TABLE IF NOT EXISTS super_admin_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          
          -- 👤 معرف المدير الأساسي
          admin_id UUID NOT NULL REFERENCES system_admins(id) ON DELETE CASCADE,
          
          -- 🎯 نوع النشاط
          action VARCHAR(100) NOT NULL, -- login, login_as_company, view_company, etc.
          
          -- 📋 تفاصيل النشاط
          details JSONB DEFAULT '{}', -- تفاصيل إضافية عن النشاط
          
          -- 🌐 معلومات الشبكة
          ip_address INET, -- عنوان IP
          user_agent TEXT, -- معلومات المتصفح
          
          -- 📅 وقت النشاط
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (createError) {
      console.error('❌ خطأ في إنشاء الجدول:', createError.message);
      return;
    }

    console.log('✅ تم إنشاء جدول super_admin_logs بنجاح');

    // 2. إنشاء الفهارس
    console.log('\n2️⃣ إنشاء الفهارس...');
    
    const createIndexesSQL = `
      -- إنشاء فهارس للبحث السريع
      CREATE INDEX IF NOT EXISTS idx_super_admin_logs_admin_id ON super_admin_logs(admin_id);
      CREATE INDEX IF NOT EXISTS idx_super_admin_logs_action ON super_admin_logs(action);
      CREATE INDEX IF NOT EXISTS idx_super_admin_logs_created_at ON super_admin_logs(created_at);

      -- إنشاء فهرس مركب للبحث المتقدم
      CREATE INDEX IF NOT EXISTS idx_super_admin_logs_admin_action_date 
      ON super_admin_logs(admin_id, action, created_at DESC);
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: createIndexesSQL
    });

    if (indexError) {
      console.error('❌ خطأ في إنشاء الفهارس:', indexError.message);
    } else {
      console.log('✅ تم إنشاء الفهارس بنجاح');
    }

    // 3. إنشاء الدوال المساعدة
    console.log('\n3️⃣ إنشاء الدوال المساعدة...');
    
    const createFunctionsSQL = `
      -- دالة لتنظيف السجلات القديمة (أكثر من 6 أشهر)
      CREATE OR REPLACE FUNCTION cleanup_old_super_admin_logs()
      RETURNS INTEGER AS $$
      DECLARE
          deleted_count INTEGER;
      BEGIN
          DELETE FROM super_admin_logs 
          WHERE created_at < NOW() - INTERVAL '6 months';
          
          GET DIAGNOSTICS deleted_count = ROW_COUNT;
          
          RETURN deleted_count;
      END;
      $$ LANGUAGE plpgsql;

      -- دالة للحصول على إحصائيات أنشطة المدير الأساسي
      CREATE OR REPLACE FUNCTION get_super_admin_activity_stats(
          admin_id_param UUID DEFAULT NULL,
          days_back INTEGER DEFAULT 30
      )
      RETURNS TABLE (
          action VARCHAR(100),
          count BIGINT,
          last_activity TIMESTAMP WITH TIME ZONE
      ) AS $$
      BEGIN
          RETURN QUERY
          SELECT 
              sal.action,
              COUNT(*) as count,
              MAX(sal.created_at) as last_activity
          FROM super_admin_logs sal
          WHERE 
              (admin_id_param IS NULL OR sal.admin_id = admin_id_param)
              AND sal.created_at >= NOW() - (days_back || ' days')::INTERVAL
          GROUP BY sal.action
          ORDER BY count DESC;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error: functionsError } = await supabase.rpc('exec_sql', {
      sql: createFunctionsSQL
    });

    if (functionsError) {
      console.error('❌ خطأ في إنشاء الدوال:', functionsError.message);
    } else {
      console.log('✅ تم إنشاء الدوال المساعدة بنجاح');
    }

    // 4. التحقق من النتيجة
    console.log('\n4️⃣ التحقق من النتيجة...');
    
    const { data: tableInfo, error: checkError } = await supabase
      .from('super_admin_logs')
      .select('*')
      .limit(1);

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ خطأ في التحقق من الجدول:', checkError.message);
    } else {
      console.log('✅ الجدول جاهز للاستخدام');
    }

    // 5. إدراج سجل تجريبي
    console.log('\n5️⃣ إدراج سجل تجريبي...');
    
    // البحث عن المدير الأساسي
    const { data: superAdmin, error: adminError } = await supabase
      .from('system_admins')
      .select('id')
      .limit(1);

    if (adminError || !superAdmin || superAdmin.length === 0) {
      console.log('⚠️ لا يوجد مدير أساسي لإدراج سجل تجريبي');
    } else {
      const { error: insertError } = await supabase
        .from('super_admin_logs')
        .insert({
          admin_id: superAdmin[0].id,
          action: 'table_created',
          details: {
            message: 'تم إنشاء جدول سجل أنشطة المدير الأساسي',
            timestamp: new Date().toISOString()
          },
          ip_address: '127.0.0.1',
          user_agent: 'system'
        });

      if (insertError) {
        console.error('❌ خطأ في إدراج السجل التجريبي:', insertError.message);
      } else {
        console.log('✅ تم إدراج سجل تجريبي بنجاح');
      }
    }

    return { success: true };
    
  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    return { success: false, error: error.message };
  }
}

// تشغيل الإنشاء
createSuperAdminLogsTable().then((result) => {
  if (result && result.success) {
    console.log('\n🎉 تم إنشاء جدول سجل أنشطة المدير الأساسي بنجاح!');
    console.log('\n📋 الميزات المتاحة:');
    console.log('   ✅ تسجيل جميع أنشطة المدير الأساسي');
    console.log('   ✅ تتبع عمليات "دخول كـ"');
    console.log('   ✅ حفظ تفاصيل كل نشاط');
    console.log('   ✅ فهارس للبحث السريع');
    console.log('   ✅ دوال مساعدة للإحصائيات');
    console.log('\n💡 الآن يمكن للمدير الأساسي:');
    console.log('   👑 الدخول لأي شركة مباشرة');
    console.log('   📊 مراقبة جميع الأنشطة');
    console.log('   🔒 تتبع الأمان والوصول');
  } else {
    console.log('\n❌ فشل في إنشاء جدول سجل أنشطة المدير الأساسي');
  }
});
