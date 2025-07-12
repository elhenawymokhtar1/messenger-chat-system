import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TestMessage {
  id: string;
  message_text: string;
  sender_type: 'admin' | 'customer';
  is_from_page: number;
  created_at: string;
}

const TestMessages: React.FC = () => {
  const [messages, setMessages] = useState<TestMessage[]>([
    {
      id: '1',
      message_text: 'مرحبا، كيف يمكنني مساعدتك؟',
      sender_type: 'admin',
      is_from_page: 1,
      created_at: '2025-07-09 08:00:00'
    },
    {
      id: '2',
      message_text: 'أريد معرفة أسعار المنتجات',
      sender_type: 'customer',
      is_from_page: 0,
      created_at: '2025-07-09 08:01:00'
    },
    {
      id: '3',
      message_text: 'بالطبع، يمكنني مساعدتك في ذلك',
      sender_type: 'admin',
      is_from_page: 1,
      created_at: '2025-07-09 08:02:00'
    },
    {
      id: '4',
      message_text: 'شكراً لك',
      sender_type: 'customer',
      is_from_page: 0,
      created_at: '2025-07-09 08:03:00'
    }
  ]);

  const [newMessage, setNewMessage] = useState('');

  const addTestMessage = (isFromPage: boolean) => {
    const message: TestMessage = {
      id: Date.now().toString(),
      message_text: newMessage || (isFromPage ? 'رسالة تجريبية من الإدارة' : 'رسالة تجريبية من العميل'),
      sender_type: isFromPage ? 'admin' : 'customer',
      is_from_page: isFromPage ? 1 : 0,
      created_at: new Date().toISOString()
    };

    console.log('🔍 [TEST] إضافة رسالة جديدة:', {
      id: message.id,
      sender_type: message.sender_type,
      is_from_page: message.is_from_page,
      message_text: message.message_text
    });

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🧪 صفحة اختبار الرسائل</CardTitle>
        </CardHeader>
        <CardContent>
          {/* منطقة إضافة رسائل تجريبية */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">إضافة رسالة تجريبية</h3>
            <div className="flex gap-2 mb-3">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="اكتب رسالة تجريبية..."
                className="flex-1"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => addTestMessage(true)}
                className="bg-blue-500 hover:bg-blue-600"
              >
                إضافة رسالة من الإدارة
              </Button>
              <Button 
                onClick={() => addTestMessage(false)}
                className="bg-gray-500 hover:bg-gray-600"
              >
                إضافة رسالة من العميل
              </Button>
            </div>
          </div>

          {/* منطقة عرض الرسائل */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">الرسائل:</h3>
            
            {messages.map((message, index) => {
              // نفس المنطق المستخدم في Conversations.tsx
              const isOutgoing = message.sender_type === 'admin';
              
              console.log('🎯 [TEST] عرض رسالة:', {
                id: message.id,
                sender_type: message.sender_type,
                is_from_page: message.is_from_page,
                isOutgoing: isOutgoing,
                message_text: message.message_text?.substring(0, 30)
              });

              return (
                <div
                  key={message.id}
                  className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} mb-4`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOutgoing
                        ? 'bg-blue-500 text-white' // رسائل الإدارة - أزرق على اليمين
                        : 'bg-gray-200 text-gray-800' // رسائل العملاء - رمادي على اليسار
                    }`}
                  >
                    <div className="text-sm">
                      {message.message_text}
                    </div>
                    <div className="text-xs mt-1 opacity-70">
                      {isOutgoing ? '👨‍💼 إدارة' : '👤 عميل'} | 
                      is_from_page: {message.is_from_page} | 
                      sender_type: {message.sender_type}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* معلومات تشخيصية */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold mb-2">📊 معلومات تشخيصية:</h4>
            <div className="text-sm space-y-1">
              <div>• <strong>رسائل الإدارة:</strong> is_from_page = 1, sender_type = 'admin' → أزرق على اليمين</div>
              <div>• <strong>رسائل العملاء:</strong> is_from_page = 0, sender_type = 'customer' → رمادي على اليسار</div>
              <div>• <strong>عدد الرسائل الحالي:</strong> {messages.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestMessages;
