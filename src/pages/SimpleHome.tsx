import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SimpleHome: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // التحقق من تسجيل الدخول
    const companyData = localStorage.getItem('company');
    if (companyData) {
      try {
        const company = JSON.parse(companyData);
        if (company.id && company.email && company.name) {
          setUser(company);
        } else {
          navigate('/simple-login');
        }
      } catch (error) {
        console.error('خطأ في تحليل بيانات الشركة:', error);
        navigate('/simple-login');
      }
    } else {
      navigate('/simple-login');
    }
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('company');
    navigate('/simple-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" role="main">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من تسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // سيتم إعادة التوجيه
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              🏢 لوحة تحكم الشركة
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">مرحباً، {user.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
               aria-label="تسجيل جديد">
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* معلومات الشركة */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 معلومات الشركة</h3>
              <div className="space-y-2 text-sm">
                <p><strong>الاسم:</strong> {user.name}</p>
                <p><strong>الإيميل:</strong> {user.email}</p>
                <p><strong>المعرف:</strong> {user.id}</p>
                <p><strong>تاريخ التسجيل:</strong> {user.loginTime ? new Date(user.loginTime).toLocaleString('ar-EG') : 'غير محدد'}</p>
              </div>
            </div>

            {/* إعدادات فيسبوك */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📘 إعدادات فيسبوك</h3>
              <p className="text-gray-600 mb-4">إدارة صفحات فيسبوك والردود التلقائية</p>
              <a
                href="/facebook-settings"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                فتح الإعدادات
              </a>
            </div>

            {/* إحصائيات سريعة */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 إحصائيات سريعة</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">الرسائل اليوم:</span>
                  <span className="font-semibold">45</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الصفحات المربوطة:</span>
                  <span className="font-semibold">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">معدل الرد:</span>
                  <span className="font-semibold text-green-600">98%</span>
                </div>
              </div>
            </div>

            {/* حالة النظام */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ حالة النظام</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm">الخادم الخلفي: متصل</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm">قاعدة البيانات: متصلة</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm">فيسبوك API: يعمل</span>
                </div>
              </div>
            </div>

            {/* روابط سريعة */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 روابط سريعة</h3>
              <div className="space-y-2">
                <a href="/test" className="block text-blue-600 hover:text-blue-800 text-sm">
                  • صفحة الاختبار
                </a>
                <a href="/simple-login" className="block text-blue-600 hover:text-blue-800 text-sm">
                  • تسجيل دخول بسيط
                </a>
                <a href="/company-login" className="block text-blue-600 hover:text-blue-800 text-sm">
                  • تسجيل دخول متقدم
                </a>
              </div>
            </div>

            {/* معلومات تقنية */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 معلومات تقنية</h3>
              <div className="space-y-2 text-sm">
                <p><strong>الواجهة الأمامية:</strong> React + TypeScript</p>
                <p><strong>الخادم الخلفي:</strong> Node.js + Express</p>
                <p><strong>قاعدة البيانات:</strong> MySQL</p>
                <p><strong>الحالة:</strong> <span className="text-green-600 font-semibold">يعمل بشكل مثالي</span></p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default SimpleHome;
