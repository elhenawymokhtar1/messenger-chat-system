import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useCurrentCompany } from '../hooks/useCurrentCompany';
import { messagesApi } from '../lib/mysql-api';

interface TestLog {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  data?: any;
}

const ImageTestPage: React.FC = () => {
  const { company } = useCurrentCompany();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // بيانات المحادثة المحددة - Mokhtar Elenawy
  const TEST_CONVERSATION_ID = '0a6962e4-a5d6-4663-ab0e-25f7ffa175db';
  const TEST_CUSTOMER_NAME = 'Mokhtar Elenawy';
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('🧪 اختبار رفع صورة من صفحة التشخيص');
  const [isUploading, setIsUploading] = useState(false);
  const [testLogs, setTestLogs] = useState<TestLog[]>([]);
  const [lastResponse, setLastResponse] = useState<any>(null);

  // إضافة سجل جديد
  const addLog = (level: TestLog['level'], message: string, data?: any) => {
    const newLog: TestLog = {
      timestamp: new Date().toLocaleTimeString('ar-EG'),
      level,
      message,
      data
    };
    setTestLogs(prev => [...prev, newLog]);
    console.log(`[${level.toUpperCase()}] ${message}`, data || '');

    // إظهار toast للأخطاء والنجاح
    if (level === 'error') {
      toast.error(message);
    } else if (level === 'success') {
      toast.success(message);
    }
  };

  // مسح السجلات
  const clearLogs = () => {
    setTestLogs([]);
    setLastResponse(null);
  };

  // اختيار صورة
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    addLog('info', 'تم اختيار صورة', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    setSelectedImage(file);

    // إنشاء معاينة للصورة
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      addLog('success', 'تم إنشاء معاينة الصورة');
    };
    reader.onerror = () => {
      addLog('error', 'فشل في قراءة الصورة');
    };
    reader.readAsDataURL(file);
  };

  // إرسال الصورة
  const handleSendImage = async () => {
    if (!selectedImage || !company) {
      addLog('error', 'لا توجد صورة مختارة أو بيانات الشركة');
      return;
    }

    setIsUploading(true);
    addLog('info', 'بدء عملية رفع الصورة...');

    try {
      // تحويل الصورة إلى base64
      addLog('info', 'تحويل الصورة إلى base64...');
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;
          addLog('success', 'تم تحويل الصورة إلى base64', {
            size: base64Data.length,
            preview: base64Data.substring(0, 100) + '...'
          });

          // إعداد بيانات الإرسال
          const messageData = {
            conversation_id: TEST_CONVERSATION_ID,
            company_id: company.id,
            message_text: messageText || '📷 صورة',
            message_type: 'image',
            image_data: base64Data,
            image_name: selectedImage.name
          };

          addLog('info', 'إرسال البيانات إلى API...', {
            conversation_id: messageData.conversation_id,
            company_id: messageData.company_id,
            message_text: messageData.message_text,
            message_type: messageData.message_type,
            image_name: messageData.image_name,
            image_data_size: base64Data.length
          });

          // إرسال الرسالة
          const response = await messagesApi.sendMessage(messageData);
          
          addLog('success', 'تم إرسال الصورة بنجاح!', response);
          setLastResponse(response);
          toast.success('تم إرسال الصورة بنجاح!');

          // مسح النموذج
          setSelectedImage(null);
          setImagePreview(null);
          setMessageText('🧪 اختبار رفع صورة من صفحة التشخيص');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }

        } catch (error: any) {
          addLog('error', 'فشل في إرسال الصورة', {
            error: error.message,
            stack: error.stack
          });
          toast.error('فشل في إرسال الصورة: ' + error.message);
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        addLog('error', 'فشل في قراءة الصورة');
        setIsUploading(false);
      };

      reader.readAsDataURL(selectedImage);

    } catch (error: any) {
      addLog('error', 'خطأ عام في معالجة الصورة', {
        error: error.message,
        stack: error.stack
      });
      toast.error('خطأ في معالجة الصورة');
      setIsUploading(false);
    }
  };

  // تنسيق عرض البيانات
  const formatData = (data: any) => {
    if (!data) return '';
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* العنوان */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            🧪 صفحة اختبار رفع الصور
          </h1>
          <p className="text-gray-600">
            اختبار رفع الصور مع المحادثة: <strong>{TEST_CUSTOMER_NAME}</strong>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            معرف المحادثة: {TEST_CONVERSATION_ID}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* نموذج رفع الصورة */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              📤 رفع صورة
            </h2>

            {/* اختيار الصورة */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختر صورة:
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {/* معاينة الصورة */}
            {imagePreview && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  معاينة الصورة:
                </label>
                <img
                  src={imagePreview}
                  alt="معاينة"
                  className="max-w-full h-48 object-contain border rounded-lg"
                />
              </div>
            )}

            {/* نص الرسالة */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نص الرسالة (اختياري):
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="اكتب نص مع الصورة..."
              />
            </div>

            {/* أزرار التحكم */}
            <div className="flex gap-3">
              <button
                onClick={handleSendImage}
                disabled={!selectedImage || isUploading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isUploading ? '🔄 جاري الإرسال...' : '📤 إرسال الصورة'}
              </button>
              
              <button
                onClick={clearLogs}
                className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
              >
                🗑️ مسح السجلات
              </button>
            </div>
          </div>

          {/* سجلات التشخيص */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              📋 سجلات التشخيص
            </h2>
            
            <div className="h-96 overflow-y-auto border rounded-lg p-3 bg-gray-50">
              {testLogs.length === 0 ? (
                <p className="text-gray-500 text-center">لا توجد سجلات بعد...</p>
              ) : (
                testLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`mb-2 p-2 rounded text-sm ${
                      log.level === 'error' ? 'bg-red-100 text-red-800' :
                      log.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      log.level === 'success' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <div className="font-medium">
                      [{log.timestamp}] {log.message}
                    </div>
                    {log.data && (
                      <pre className="mt-1 text-xs overflow-x-auto">
                        {formatData(log.data)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* آخر استجابة */}
        {lastResponse && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              📊 آخر استجابة من الخادم
            </h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              {formatData(lastResponse)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageTestPage;
