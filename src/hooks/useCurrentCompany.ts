import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

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

// مفتاح ثابت للشركة الحالية
const CURRENT_COMPANY_KEY = 'current-company';

// تعطيل التخزين - استخدام React state فقط
const saveCompanyToStorage = (company: CurrentCompany | null) => {
  // معطل - لا نحفظ في sessionStorage
  console.log('💾 [COMPANY] تم تعطيل حفظ الشركة في sessionStorage');
};

// دالة لجلب الشركة الثابتة (بدون sessionStorage)
const getCompanyFromStorage = (): CurrentCompany | null => {
  // إرجاع شركة kok@kok.com الثابتة دائماً
  return {
    id: '2d9b8887-0cca-430b-b61b-ca16cccfec63',
    name: 'kok',
    email: 'kok@kok.com',
    status: 'active',
    created_at: '2025-07-12T21:00:00.000Z'
  };
};

export const useCurrentCompany = () => {
  const queryClient = useQueryClient();

  // جلب بيانات الشركة الحالية
  const { data: company, isLoading: loading } = useQuery({
    queryKey: ['current-company'],
    queryFn: getCompanyFromStorage,
    staleTime: Infinity, // البيانات لا تنتهي صلاحيتها
    gcTime: Infinity, // لا تحذف من الذاكرة
  });

  // تحديث بيانات الشركة
  const updateCompanyMutation = useMutation({
    mutationFn: async (newCompany: CurrentCompany) => {
      saveCompanyToStorage(newCompany);
      return newCompany;
    },
    onSuccess: (newCompany) => {
      queryClient.setQueryData(['current-company'], newCompany);
    },
  });

  // مسح بيانات الشركة
  const clearCompanyMutation = useMutation({
    mutationFn: async () => {
      saveCompanyToStorage(null);
      return null;
    },
    onSuccess: () => {
      queryClient.setQueryData(['current-company'], null);
    },
  });

  // تعيين شركة جديدة
  const setCompany = (newCompany: CurrentCompany | null) => {
    if (newCompany) {
      updateCompanyMutation.mutate(newCompany);
    } else {
      clearCompanyMutation.mutate();
    }
  };

  const updateCompany = (updatedCompany: CurrentCompany) => {
    updateCompanyMutation.mutate(updatedCompany);
  };

  const clearCompany = () => {
    clearCompanyMutation.mutate();
  };

  const reloadCompany = () => {
    queryClient.invalidateQueries({ queryKey: ['current-company'] });
  };

  return {
    company,
    loading,
    updateCompany,
    clearCompany,
    reloadCompany,
    setCompany,
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
