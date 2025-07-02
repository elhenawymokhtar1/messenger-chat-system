/**
 * 🤖 زر AI بسيط
 * بديل مؤقت للـ GeminiTestButton
 */

import React from 'react';
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { toast } from "sonner";

interface SimpleAIButtonProps {
  conversationId?: string;
  senderId?: string;
  lastMessage?: string;
}

export const SimpleAIButton: React.FC<SimpleAIButtonProps> = ({
  conversationId,
  senderId,
  lastMessage
}) => {
  const handleAIResponse = () => {
    toast.info('ميزة الذكاء الاصطناعي قيد التطوير');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAIResponse}
      className="flex items-center gap-2"
    >
      <Bot className="h-4 w-4" />
      رد تلقائي
    </Button>
  );
};

export default SimpleAIButton;