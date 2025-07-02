import React from 'react';

const TestSimple: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center" role="main">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4">🧪 صفحة اختبار</h1>
        <p className="text-gray-600 text-center mb-6">
          إذا رأيت هذه الرسالة، فإن React يعمل بشكل صحيح
        </p>
        <div className="space-y-4">
          <div className="bg-green-100 p-4 rounded border border-green-200">
            <h3 className="font-semibold text-green-800">✅ React يعمل</h3>
            <p className="text-green-700 text-sm">التطبيق يحمل المكونات بنجاح</p>
          </div>
          <div className="bg-blue-100 p-4 rounded border border-blue-200">
            <h3 className="font-semibold text-blue-800">🎯 الخطوة التالية</h3>
            <p className="text-blue-700 text-sm">انتقل لصفحة تسجيل الدخول</p>
          </div>
          <a 
            href="/company-login" 
            className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            انتقل لتسجيل الدخول
          </a>
        </div>
      </div>
    </div>
  );
};

export default TestSimple;
