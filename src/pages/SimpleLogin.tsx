import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SimpleLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:3004/api/companies/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password })});

      const data = await response.json();

      if (data.success) {
        // حفظ بيانات الشركة
        localStorage.setItem('company', JSON.stringify(data.data));
        setMessage('✅ تم تسجيل الدخول بنجاح!');
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setMessage('❌ ' + (data.message || 'خطأ في تسجيل الدخول'));
      }
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      setMessage('❌ خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center" role="main">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">🔐 تسجيل الدخول</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="أدخل البريد الإلكتروني"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="أدخل كلمة المرور"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
           aria-label="تسجيل الدخول">
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded ${
            message.includes('✅') 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">🧪 بيانات اختبار:</h3>
          <p className="text-blue-700 text-sm">
            📧 الإيميل: test-auth-1751219188441@example.com<br/>
            🔑 كلمة المرور: 123456
          </p>
        </div>

        <div className="mt-4 text-center">
          <a href="/test" className="text-blue-600 hover:text-blue-800 text-sm">
            ← العودة للصفحة الاختبار
          </a>
        </div>
      </div>
    </div>
  );
};

export default SimpleLogin;
