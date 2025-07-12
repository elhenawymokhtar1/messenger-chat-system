import { executeQuery } from './src/config/mysql.ts';

async function updateCompanyId() {
  try {
    console.log('🔄 تحديث معرف الشركة للصفحة 250528358137901...');
    
    // تحديث معرف الشركة للصفحة
    const result = await executeQuery(
      'UPDATE facebook_settings SET company_id = ? WHERE page_id = ?',
      ['c677b32f-fe1c-4c64-8362-a1c03406608d', '250528358137901']
    );
    
    console.log('✅ تم تحديث', result.affectedRows, 'صفحة');
    
    // تحديث معرف الشركة للمحادثات
    console.log('🔄 تحديث معرف الشركة للمحادثات...');
    const conversationResult = await executeQuery(
      'UPDATE conversations SET company_id = ? WHERE facebook_page_id = ?',
      ['c677b32f-fe1c-4c64-8362-a1c03406608d', '250528358137901']
    );
    
    console.log('✅ تم تحديث', conversationResult.affectedRows, 'محادثة');
    
    // التحقق من النتيجة
    const pages = await executeQuery(
      'SELECT page_id, page_name, company_id FROM facebook_settings WHERE page_id = ?',
      ['250528358137901']
    );
    
    console.log('📄 الصفحات المحدثة:');
    pages.forEach(page => {
      console.log(`   - ${page.page_name} (${page.page_id}) -> ${page.company_id}`);
    });
    
    const conversations = await executeQuery(
      'SELECT id, participant_name, company_id FROM conversations WHERE facebook_page_id = ? LIMIT 5',
      ['250528358137901']
    );
    
    console.log('💬 المحادثات المحدثة:');
    conversations.forEach(conv => {
      console.log(`   - ${conv.participant_name} (${conv.id}) -> ${conv.company_id}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

updateCompanyId();
