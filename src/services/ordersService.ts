// خدمة الطلبات الموحدة لمنع تكرار الأخطاء

import { 
  API_ENDPOINTS, 
  apiRequest, 
  apiRequestWithRetry, 
  handleApiError 
} from '@/config/api';

// أنواع البيانات
export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  payment_status: string;
  total_amount: string;
  subtotal: string;
  shipping_cost: string;
  tax_amount: string;
  discount_amount: string;
  created_at: string;
  items_count: number;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  product_name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

// تم حذف البيانات التجريبية - سيتم الاعتماد على الخادم الخلفي

// خدمة الطلبات
export class OrdersService {
  // جلب جميع الطلبات
  static async getOrders(): Promise<OrdersResponse> {
    console.log('🔄 جاري تحميل الطلبات من الخادم...');

    const response = await apiRequestWithRetry<{ success: boolean; data: Order[]; total: number }>(
      API_ENDPOINTS.ORDERS.LIST
    );

    console.log('✅ تم تحميل الطلبات من الخادم:', response);
    return {
      orders: response.data || [],
      total: response.total || 0,
      page: 1,
      limit: 10
    };
  }

  // جلب طلب واحد
  static async getOrder(orderId: string): Promise<Order> {
    console.log(`🔄 جاري تحميل تفاصيل الطلب ${orderId}...`);

    const response = await apiRequest<{ success: boolean; data: Order }>(
      API_ENDPOINTS.ORDERS.DETAIL(orderId)
    );

    console.log('✅ تم تحميل تفاصيل الطلب:', response);
    return response.data;
  }

  // تحديث حالة الطلب
  static async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    console.log(`🔄 تحديث حالة الطلب ${orderId} إلى ${status}...`);

    const response = await apiRequest<{ success: boolean; data: Order }>(
      API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId),
      {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }
    );

    console.log('✅ تم تحديث حالة الطلب:', response);
    return response.data;
  }

  // تحديث حالة الدفع
  static async updatePaymentStatus(orderId: string, paymentStatus: string): Promise<Order> {
    console.log(`🔄 تحديث حالة الدفع للطلب ${orderId} إلى ${paymentStatus}...`);

    const response = await apiRequest<{ success: boolean; data: Order }>(
      API_ENDPOINTS.ORDERS.UPDATE_PAYMENT(orderId),
      {
        method: 'PATCH',
        body: JSON.stringify({ payment_status: paymentStatus })
      }
    );

    console.log('✅ تم تحديث حالة الدفع:', response);
    return response.data;
  }

  // إحصائيات الطلبات
  static getOrdersStats(orders: Order[]) {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      totalSales: orders.reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0)
    };
  }

  // فلترة الطلبات
  static filterOrders(
    orders: Order[],
    searchTerm: string,
    statusFilter: string,
    paymentFilter: string,
    dateRange: { from: string; to: string }
  ): Order[] {
    return orders.filter(order => {
      const matchesSearch = searchTerm === '' || 
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customer_email && order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter;
      
      const orderDate = new Date(order.created_at);
      const fromDate = dateRange.from ? new Date(dateRange.from) : null;
      const toDate = dateRange.to ? new Date(dateRange.to) : null;
      
      const matchesDate = (!fromDate || orderDate >= fromDate) && (!toDate || orderDate <= toDate);
      
      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }
}

export default OrdersService;
