/**
 * 🚀 Simple API Server للـ Store Management فقط
 * يحتوي على Store endpoints فقط لاختبار صفحة إدارة المتاجر
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// ===================================
// 🏪 Store APIs
// ===================================

// الحصول على متجر الشركة
app.get('/api/companies/:companyId/store', async (req, res) => {
  try {
    const { companyId } = req.params;
    
    console.log('🔍 جلب متجر الشركة:', companyId);
    
    // إرجاع بيانات تجريبية للمتجر
    const mockStore = {
      id: `store_${companyId}`,
      company_id: companyId,
      name: `متجر الشركة ${companyId}`,
      description: 'متجر إلكتروني متميز',
      phone: '+966501234567',
      email: 'store@company.com',
      address: 'الرياض، المملكة العربية السعودية',
      website: 'https://store.company.com',
      logo_url: 'https://via.placeholder.com/200x200',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: mockStore
    });
  } catch (error) {
    console.error('❌ Error fetching store:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// إنشاء متجر جديد للشركة
app.post('/api/companies/:companyId/store', async (req, res) => {
  try {
    const { companyId } = req.params;
    const storeData = req.body;
    
    console.log('🏪 إنشاء متجر جديد:', { companyId, storeData });
    
    // إرجاع بيانات المتجر الجديد
    const newStore = {
      id: `store_${companyId}_${Date.now()}`,
      company_id: companyId,
      ...storeData,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: newStore
    });
  } catch (error) {
    console.error('❌ Error creating store:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// تحديث متجر الشركة
app.put('/api/companies/:companyId/store', async (req, res) => {
  try {
    const { companyId } = req.params;
    const updateData = req.body;
    
    console.log('📝 تحديث متجر الشركة:', { companyId, updateData });
    
    // إرجاع بيانات المتجر المحدثة
    const updatedStore = {
      id: `store_${companyId}`,
      company_id: companyId,
      name: updateData.name || `متجر الشركة ${companyId}`,
      description: updateData.description || 'متجر إلكتروني متميز',
      phone: updateData.phone || '+966501234567',
      email: updateData.email || 'store@company.com',
      address: updateData.address || 'الرياض، المملكة العربية السعودية',
      website: updateData.website || 'https://store.company.com',
      logo_url: updateData.logo_url || 'https://via.placeholder.com/200x200',
      is_active: updateData.is_active !== undefined ? updateData.is_active : true,
      created_at: new Date(Date.now() - 86400000).toISOString(), // يوم واحد مضى
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: updatedStore
    });
  } catch (error) {
    console.error('❌ Error updating store:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// تفعيل/إلغاء تفعيل المتجر
app.patch('/api/companies/:companyId/store/status', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { is_active } = req.body;
    
    console.log('🔄 تغيير حالة المتجر:', { companyId, is_active });
    
    // إرجاع بيانات المتجر مع الحالة الجديدة
    const updatedStore = {
      id: `store_${companyId}`,
      company_id: companyId,
      name: `متجر الشركة ${companyId}`,
      description: 'متجر إلكتروني متميز',
      phone: '+966501234567',
      email: 'store@company.com',
      address: 'الرياض، المملكة العربية السعودية',
      website: 'https://store.company.com',
      logo_url: 'https://via.placeholder.com/200x200',
      is_active: is_active,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: updatedStore
    });
  } catch (error) {
    console.error('❌ Error toggling store status:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ===================================
// 🔧 Basic endpoints للاختبار
// ===================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Simple Store API Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// بدء الخادم
const server = app.listen(PORT, () => {
  console.log('🚀 ===================================');
  console.log('🏪 Simple Store API Server Started');
  console.log('🚀 ===================================');
  console.log(`🌐 Server running on: http://localhost:${PORT}`);
  console.log(`🏪 Store endpoints: http://localhost:${PORT}/api/companies/{companyId}/store`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  console.log('🚀 ===================================');
});

// معالجة إغلاق الخادم
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;
