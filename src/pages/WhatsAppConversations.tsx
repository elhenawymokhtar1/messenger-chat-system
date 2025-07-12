import React, { useState, useEffect } from "react";
import WhatsAppConversationsList from "@/components/WhatsAppConversationsList";
import WhatsAppChatWindow from "@/components/WhatsAppChatWindow";

const WhatsAppConversations = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');

  // فحص حالة الاتصال بالواتساب
  useEffect(() => {
    checkConnectionStatus();
    
    // فحص دوري لحالة الاتصال
    const interval = setInterval(checkConnectionStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/whatsapp-baileys/status');
      const data = await response.json();
      
      setIsConnected(data.isConnected || false);
      setConnectionStatus(data.isConnected ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('خطأ في فحص حالة الاتصال:', error);
      setIsConnected(false);
      setConnectionStatus('error');
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100" dir="rtl">
      <div className="container mx-auto px-6 py-8 h-full flex flex-col overflow-hidden" role="main">
        <div className="mb-8 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-green-800 mb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">💬</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-green-800">محادثات الواتساب</span>
                  <span className="text-sm text-green-600 font-normal">WhatsApp Business</span>
                </div>
              </h1>
              <p className="text-gray-600">
                إدارة المحادثات والرد على رسائل الواتساب
              </p>

              {/* تحذير توضيحي */}
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 text-green-800 mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="font-bold text-lg">نظام WhatsApp Business منفصل</span>
                </div>
                <div className="bg-white/50 p-3 rounded-lg border border-green-200">
                  <p className="text-green-800 text-sm font-medium">
                    📱 <strong>هذه صفحة WhatsApp فقط</strong> - تعرض رسائل WhatsApp من جدول منفصل (whatsapp_messages)
                  </p>
                  <p className="text-green-700 text-xs mt-1">
                    🔄 مختلف تماماً عن صفحة Facebook Messenger التي تستخدم جداول (conversations & messages)
                  </p>
                </div>
              </div>
            </div>
            
            {/* مؤشر حالة الاتصال */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className={`text-sm font-medium ${
                isConnected ? 'text-green-600' : 'text-red-600'
              }`}>
                {isConnected ? 'متصل' : 'غير متصل'}
              </span>
              {!isConnected && (
                <a 
                  href="/whatsapp" 
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  إعداد الاتصال
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* قائمة المحادثات */}
          <div className="lg:col-span-1">
            <WhatsAppConversationsList
              selectedConversation={selectedConversation}
              onSelectConversation={setSelectedConversation}
              isConnected={isConnected}
            />
          </div>

          {/* نافذة الدردشة */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <WhatsAppChatWindow 
                conversationId={selectedConversation} 
                isConnected={isConnected}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-lg font-medium mb-2">اختر محادثة واتساب</h3>
                  <p>اختر محادثة من القائمة لبدء الرد على رسائل الواتساب</p>
                  {!isConnected && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 text-sm">
                        ⚠️ الواتساب غير متصل. يرجى الاتصال أولاً لعرض المحادثات.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppConversations;
