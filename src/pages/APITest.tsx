/**
 * 🧪 صفحة اختبار API
 * لاختبار الاتصال بـ API والتأكد من عمل المحادثات
 */

import React, { useState, useEffect } from 'react';
import { conversationsApi } from '@/lib/mysql-api';

interface TestConversation {
  id: string;
  customer_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

const APITest: React.FC = () => {
  const [conversations, setConversations] = useState<TestConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);

  const companyId = '2d9b8887-0cca-430b-b61b-ca16cccfec63';

  const testDirectAPI = async () => {
    console.log('🧪 [DIRECT] اختبار مباشر للـ API...');
    setLoading(true);
    setError(null);
    setRawResponse(null);

    try {
      const url = `http://localhost:3002/api/companies/${companyId}/conversations?limit=50&recent_only=true`;
      console.log('📡 [DIRECT] URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 [DIRECT] Response:', response);
      console.log('📊 [DIRECT] Status:', response.status);
      console.log('📊 [DIRECT] OK:', response.ok);

      const data = await response.json();
      console.log('📊 [DIRECT] Data:', data);

      setRawResponse(data);

      if (data.success && data.data) {
        setConversations(data.data);
        setError(null);
      } else {
        setError(data.error || 'خطأ في البيانات');
        setConversations([]);
      }
    } catch (err) {
      console.error('❌ [DIRECT] خطأ:', err);
      setError(err instanceof Error ? err.message : 'خطأ غير معروف');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const testAPI = async () => {
    console.log('🧪 [TEST] بدء اختبار API...');
    setLoading(true);
    setError(null);
    setRawResponse(null);

    try {
      console.log('📡 [TEST] استدعاء conversationsApi.getConversations...');
      console.log('🔍 [TEST] Company ID:', companyId);
      console.log('🔍 [TEST] API Base URL:', import.meta.env.VITE_API_URL);

      const result = await conversationsApi.getConversations(companyId);
      
      console.log('📊 [TEST] النتيجة الخام:', result);
      setRawResponse(result);

      if (result.error) {
        setError(result.error);
        setConversations([]);
      } else if (result.data && Array.isArray(result.data)) {
        console.log('✅ [TEST] تم جلب المحادثات:', result.data.length);
        setConversations(result.data);
        setError(null);
      } else {
        setError('تنسيق البيانات غير صحيح');
        setConversations([]);
      }
    } catch (err) {
      console.error('❌ [TEST] خطأ في API:', err);
      setError(err instanceof Error ? err.message : 'خطأ غير معروف');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  // اختبار تلقائي عند تحميل الصفحة
  useEffect(() => {
    testAPI();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          🧪 صفحة اختبار API
        </h1>

        {/* معلومات الاختبار */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-800 mb-2">معلومات الاختبار:</h2>
          <p><strong>Company ID:</strong> {companyId}</p>
          <p><strong>API Endpoint:</strong> /api/companies/{companyId}/conversations</p>
          <p><strong>الحالة:</strong> {loading ? '⏳ جاري التحميل...' : '✅ جاهز'}</p>
        </div>

        {/* أزرار الاختبار */}
        <div className="text-center mb-6 space-x-4">
          <button
            onClick={testAPI}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? '⏳ جاري الاختبار...' : '🔄 اختبار عبر API Library'}
          </button>
          <button
            onClick={testDirectAPI}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? '⏳ جاري الاختبار...' : '🔗 اختبار مباشر'}
          </button>
        </div>

        {/* النتائج */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">❌ خطأ:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {rawResponse && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">📊 الاستجابة الخام:</h3>
            <pre className="text-sm text-gray-600 overflow-auto">
              {JSON.stringify(rawResponse, null, 2)}
            </pre>
          </div>
        )}

        {/* المحادثات */}
        {conversations.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-4">
              ✅ المحادثات ({conversations.length}):
            </h3>
            <div className="space-y-3">
              {conversations.map((conv, index) => (
                <div key={conv.id} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-800">
                      {index + 1}. {conv.customer_name || 'بدون اسم'}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {conv.unread_count > 0 && (
                        <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs mr-2">
                          {conv.unread_count}
                        </span>
                      )}
                      {new Date(conv.last_message_at).toLocaleString('ar-EG')}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    <strong>آخر رسالة:</strong> {conv.last_message || 'لا توجد رسائل'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    <strong>ID:</strong> {conv.id}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && conversations.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ لا توجد محادثات</h3>
            <p className="text-yellow-700">لم يتم العثور على محادثات لهذه الشركة.</p>
          </div>
        )}

        {/* معلومات إضافية */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>افتح Developer Tools (F12) لرؤية تفاصيل أكثر في Console</p>
        </div>
      </div>
    </div>
  );
};

export default APITest;
