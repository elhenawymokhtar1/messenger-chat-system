import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export interface ShippingMethod {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  type: 'flat_rate' | 'weight_based' | 'distance_based' | 'express' | 'same_day';
  base_cost: number;
  cost_per_kg?: number;
  free_shipping_threshold?: number;
  estimated_days_min: number;
  estimated_days_max: number;
  zones?: string[];
  is_active: boolean;
  created_at: string;
}

export interface ShippingZone {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  cities: string[];
  additional_cost: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateShippingMethodData {
  name: string;
  description?: string;
  type: 'flat_rate' | 'weight_based' | 'distance_based' | 'express' | 'same_day';
  base_cost: number;
  cost_per_kg?: number;
  free_shipping_threshold?: number;
  estimated_days_min: number;
  estimated_days_max: number;
  zones?: string[];
  is_active?: boolean;
}

export interface CreateShippingZoneData {
  name: string;
  description?: string;
  cities: string[];
  additional_cost?: number;
  is_active?: boolean;
}

export const useShipping = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب طرق الشحن - بيانات وهمية مؤقتة
  const {
    data: shippingMethods = [],
    isLoading: methodsLoading,
    error: methodsError,
    refetch: refetchMethods
  } = useQuery({
    queryKey: ['shipping-methods'],
    queryFn: async () => {
      // TODO: Replace with MySQL API - جلب طرق الشحن
      console.log('⚠️ MySQL API غير متاح - استخدام بيانات وهمية');
      
      const mockShippingMethods: ShippingMethod[] = [
        {
          id: '1',
          store_id: 'store-1',
          name: 'شحن عادي',
          description: 'شحن عادي خلال 3-5 أيام',
          type: 'flat_rate',
          base_cost: 25,
          estimated_days_min: 3,
          estimated_days_max: 5,
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          store_id: 'store-1',
          name: 'شحن سريع',
          description: 'شحن سريع خلال 1-2 أيام',
          type: 'express',
          base_cost: 50,
          estimated_days_min: 1,
          estimated_days_max: 2,
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];
      
      return mockShippingMethods;
    },
    staleTime: 5 * 60 * 1000,
  });

  // جلب مناطق الشحن - بيانات وهمية مؤقتة
  const {
    data: shippingZones = [],
    isLoading: zonesLoading,
    error: zonesError,
    refetch: refetchZones
  } = useQuery({
    queryKey: ['shipping-zones'],
    queryFn: async () => {
      // TODO: Replace with MySQL API - جلب مناطق الشحن
      console.log('⚠️ MySQL API غير متاح - استخدام بيانات وهمية');
      
      const mockShippingZones: ShippingZone[] = [
        {
          id: '1',
          store_id: 'store-1',
          name: 'الرياض',
          description: 'منطقة الرياض',
          cities: ['الرياض', 'الخرج', 'الدرعية'],
          additional_cost: 0,
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          store_id: 'store-1',
          name: 'جدة',
          description: 'منطقة جدة',
          cities: ['جدة', 'مكة', 'الطائف'],
          additional_cost: 15,
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];
      
      return mockShippingZones;
    },
    staleTime: 5 * 60 * 1000,
  });

  // إضافة طريقة شحن جديدة
  const createShippingMethodMutation = useMutation({
    mutationFn: async (methodData: CreateShippingMethodData) => {
      // TODO: Replace with MySQL API - إضافة طريقة شحن
      console.log('⚠️ MySQL API غير متاح - محاكاة إضافة طريقة شحن');
      
      const newMethod: ShippingMethod = {
        id: `method_${Date.now()}`,
        store_id: 'store-1',
        ...methodData,
        is_active: methodData.is_active ?? true,
        created_at: new Date().toISOString()
      };

      return newMethod;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-methods'] });
      toast({
        title: "تم بنجاح",
        description: "تم إضافة طريقة الشحن بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة طريقة الشحن",
        variant: "destructive",
      });
    },
  });

  // إضافة منطقة شحن جديدة
  const createShippingZoneMutation = useMutation({
    mutationFn: async (zoneData: CreateShippingZoneData) => {
      // TODO: Replace with MySQL API - إضافة منطقة شحن
      console.log('⚠️ MySQL API غير متاح - محاكاة إضافة منطقة شحن');
      
      const newZone: ShippingZone = {
        id: `zone_${Date.now()}`,
        store_id: 'store-1',
        ...zoneData,
        additional_cost: zoneData.additional_cost || 0,
        is_active: zoneData.is_active ?? true,
        created_at: new Date().toISOString()
      };

      return newZone;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-zones'] });
      toast({
        title: "تم بنجاح",
        description: "تم إضافة منطقة الشحن بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة منطقة الشحن",
        variant: "destructive",
      });
    },
  });

  // تحديث طريقة شحن
  const updateShippingMethodMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateShippingMethodData> }) => {
      // TODO: Replace with MySQL API - تحديث طريقة شحن
      console.log('⚠️ MySQL API غير متاح - محاكاة تحديث طريقة شحن');
      return { id, ...updates };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-methods'] });
      toast({
        title: "تم بنجاح",
        description: "تم تحديث طريقة الشحن بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث طريقة الشحن",
        variant: "destructive",
      });
    },
  });

  // حذف طريقة شحن
  const deleteShippingMethodMutation = useMutation({
    mutationFn: async (id: string) => {
      // TODO: Replace with MySQL API - حذف طريقة شحن
      console.log('⚠️ MySQL API غير متاح - محاكاة حذف طريقة شحن');
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-methods'] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف طريقة الشحن بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف طريقة الشحن",
        variant: "destructive",
      });
    },
  });

  return {
    // البيانات
    shippingMethods,
    shippingZones,
    
    // حالات التحميل
    methodsLoading,
    zonesLoading,
    isLoading: methodsLoading || zonesLoading,
    
    // الأخطاء
    methodsError,
    zonesError,
    
    // العمليات
    createShippingMethod: createShippingMethodMutation.mutate,
    createShippingZone: createShippingZoneMutation.mutate,
    updateShippingMethod: updateShippingMethodMutation.mutate,
    deleteShippingMethod: deleteShippingMethodMutation.mutate,
    
    // حالات العمليات
    isCreatingMethod: createShippingMethodMutation.isPending,
    isCreatingZone: createShippingZoneMutation.isPending,
    isUpdatingMethod: updateShippingMethodMutation.isPending,
    isDeletingMethod: deleteShippingMethodMutation.isPending,
    
    // إعادة التحميل
    refetchMethods,
    refetchZones,
    refetch: () => {
      refetchMethods();
      refetchZones();
    }
  };
};
