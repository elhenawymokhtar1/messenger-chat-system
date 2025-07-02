import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useSimpleProperAuth';

export interface CurrentCompany {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  status?: string;
  is_verified?: boolean;
  created_at?: string;
  last_login_at?: string;
}

export const useCurrentCompany = () => {
  const { user, loading } = useAuth();

  // تحويل user من نظام المصادقة إلى CurrentCompany
  const company: CurrentCompany | null = user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
    created_at: user.created_at
  } : null;

  const updateCompany = async (updatedCompany: CurrentCompany) => {
    console.log('⚠️ updateCompany غير مدعوم في النظام الجديد');
  };

  const clearCompany = () => {
    console.log('⚠️ clearCompany غير مدعوم في النظام الجديد');
  };

  return {
    company,
    loading,
    updateCompany,
    clearCompany,
    isNewCompany: company ? isCompanyNew(company.created_at) : false
  };
};



// دالة للتحقق من كون الشركة جديدة (أقل من 7 أيام)
const isCompanyNew = (createdAt?: string): boolean => {
  if (!createdAt) return false;

  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffInDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

  return diffInDays <= 7; // شركة جديدة إذا كانت أقل من 7 أيام
};
