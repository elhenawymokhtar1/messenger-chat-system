import React, { useState, useEffect } from 'react';

interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  product_image?: string;
  quantity: number;
  variant_id?: string;
  variant_name?: string;
  variant_price?: number;
  total_price: number;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  description?: string;
}

const FullCartTest: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const COMPANY_ID = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
  
  // إنشاء أو جلب SESSION_ID من localStorage
  const getSessionId = () => {
    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cart_session_id', sessionId);
      console.log('🆕 تم إنشاء جلسة جديدة:', sessionId);
    } else {
      console.log('🔄 استخدام الجلسة الموجودة:', sessionId);
    }
    return sessionId;
  };
  
  const SESSION_ID = getSessionId();

  // جلب المنتجات
  const fetchProducts = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/products`);
      if (!response.ok) throw new Error(`خطأ HTTP: ${response.status}`);
      
      const result = await response.json();
      if (result.success) {
        setProducts(result.data || []);
        console.log('✅ تم جلب المنتجات:', result.data?.length || 0);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب المنتجات:', error);
      setError(`فشل في جلب المنتجات: ${error.message}`);
    }
  };

  // جلب عناصر السلة
  const fetchCartItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/cart/${SESSION_ID}`);
      if (!response.ok) throw new Error(`خطأ HTTP: ${response.status}`);
      
      const result = await response.json();
      if (result.success) {
        setCartItems(result.data || []);
        console.log('✅ تم جلب عناصر السلة:', result.data?.length || 0);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب السلة:', error);
      setError(`فشل في جلب السلة: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // إضافة منتج للسلة
  const addToCart = async (product: Product) => {
    try {
      setError(null);
      setSuccess(null);

      const cartData = {
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        product_image: product.image_url,
        quantity: 1
      };

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/cart/${SESSION_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartData)
      });

      if (!response.ok) throw new Error(`خطأ HTTP: ${response.status}`);
      
      const result = await response.json();
      if (result.success) {
        setSuccess(`تم إضافة "${product.name}" للسلة بنجاح!`);
        fetchCartItems(); // إعادة جلب السلة
      }
    } catch (error) {
      console.error('❌ خطأ في إضافة المنتج للسلة:', error);
      setError(`فشل في إضافة المنتج: ${error.message}`);
    }
  };

  // تحديث كمية منتج
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      setError(null);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/cart/${SESSION_ID}/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity })
      });

      if (!response.ok) throw new Error(`خطأ HTTP: ${response.status}`);
      
      const result = await response.json();
      if (result.success) {
        fetchCartItems(); // إعادة جلب السلة
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث الكمية:', error);
      setError(`فشل في تحديث الكمية: ${error.message}`);
    }
  };

  // حذف منتج من السلة
  const removeFromCart = async (itemId: string) => {
    try {
      setError(null);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/cart/${SESSION_ID}/${itemId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error(`خطأ HTTP: ${response.status}`);
      
      const result = await response.json();
      if (result.success) {
        setSuccess('تم حذف المنتج من السلة');
        fetchCartItems(); // إعادة جلب السلة
      }
    } catch (error) {
      console.error('❌ خطأ في حذف المنتج:', error);
      setError(`فشل في حذف المنتج: ${error.message}`);
    }
  };

  // إتمام الطلب
  const checkout = async () => {
    if (cartItems.length === 0) {
      setError('السلة فارغة! أضف منتجات أولاً');
      return;
    }

    try {
      setIsCheckingOut(true);
      setError(null);
      setSuccess(null);

      // حساب الملخص
      const subtotal = cartItems.reduce((total, item) => {
        const itemTotal = typeof item.total_price === 'string' ? parseFloat(item.total_price) : item.total_price;
        return total + (isNaN(itemTotal) ? 0 : itemTotal);
      }, 0);

      const tax = subtotal * 0.14; // ضريبة 14%
      const shipping = subtotal > 100 ? 0 : 20; // شحن مجاني فوق 100 جنيه
      const total = subtotal + tax + shipping;

      const orderData = {
        session_id: SESSION_ID,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_price: item.product_price,
          quantity: item.quantity,
          total_price: item.total_price,
          variant_id: item.variant_id,
          variant_name: item.variant_name,
          variant_price: item.variant_price
        })),
        summary: {
          subtotal: subtotal,
          tax: tax,
          shipping: shipping,
          total: total
        },
        customer: {
          name: 'عميل تجريبي',
          phone: '01234567890',
          email: 'test@example.com',
          address: 'عنوان تجريبي'
        }
      };

      console.log('📦 إرسال الطلب:', orderData);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) throw new Error(`خطأ HTTP: ${response.status}`);
      
      const result = await response.json();
      if (result.success) {
        setSuccess(`✅ تم إنشاء الطلب بنجاح! رقم الطلب: ${result.data.order_id}`);
        setCartItems([]); // مسح السلة محلياً
        setTimeout(() => {
          fetchCartItems(); // إعادة جلب السلة للتأكد
        }, 1000);
      }
    } catch (error) {
      console.error('❌ خطأ في إتمام الطلب:', error);
      setError(`فشل في إتمام الطلب: ${error.message}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCartItems();
  }, []);

  // حساب إجمالي السلة
  const cartTotal = cartItems.reduce((total, item) => {
    const itemTotal = typeof item.total_price === 'string' ? parseFloat(item.total_price) : item.total_price;
    return total + (isNaN(itemTotal) ? 0 : itemTotal);
  }, 0);

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      direction: 'rtl' as const
    },
    header: {
      marginBottom: '30px',
      textAlign: 'center' as const
    },
    title: {
      fontSize: '2.5rem',
      color: '#333',
      marginBottom: '10px'
    },
    subtitle: {
      fontSize: '1.1rem',
      color: '#666'
    },
    button: {
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      margin: '5px'
    },
    buttonSuccess: {
      backgroundColor: '#28a745'
    },
    buttonDanger: {
      backgroundColor: '#dc3545'
    },
    buttonCheckout: {
      backgroundColor: '#17a2b8',
      fontSize: '18px',
      padding: '15px 30px'
    },
    alert: {
      padding: '15px',
      borderRadius: '6px',
      margin: '20px 0',
      fontSize: '16px'
    },
    alertError: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
      border: '1px solid #f5c6cb'
    },
    alertSuccess: {
      backgroundColor: '#d4edda',
      color: '#155724',
      border: '1px solid #c3e6cb'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    card: {
      backgroundColor: 'white',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '15px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    cartItem: {
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '15px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    loading: {
      textAlign: 'center' as const,
      padding: '50px',
      fontSize: '18px',
      color: '#666'
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          ⏳ جاري تحميل السلة...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🛒 اختبار السلة الكامل</h1>
        <p style={styles.subtitle}>صفحة اختبار شاملة للسلة مع إتمام الطلبات</p>
        <p style={{ fontSize: '14px', color: '#888' }}>معرف الجلسة: {SESSION_ID}</p>
      </div>

      {/* رسائل النجاح والخطأ */}
      {error && (
        <div style={{...styles.alert, ...styles.alertError}}>
          <strong>❌ خطأ:</strong> {error}
        </div>
      )}

      {success && (
        <div style={{...styles.alert, ...styles.alertSuccess}}>
          <strong>✅ نجح:</strong> {success}
        </div>
      )}

      {/* إحصائيات السلة */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px',
        margin: '20px 0'
      }}>
        <div style={styles.card}>
          <h3 style={{ color: '#007bff', margin: '0 0 10px 0' }}>📦 عدد المنتجات</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{cartItems.length}</p>
        </div>
        <div style={styles.card}>
          <h3 style={{ color: '#28a745', margin: '0 0 10px 0' }}>💰 إجمالي السعر</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{cartTotal.toFixed(2)} جنيه</p>
        </div>
        <div style={styles.card}>
          <h3 style={{ color: '#dc3545', margin: '0 0 10px 0' }}>🔢 إجمالي الكمية</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>
            {cartItems.reduce((total, item) => {
              const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
              return total + (isNaN(quantity) ? 0 : quantity);
            }, 0)}
          </p>
        </div>
      </div>

      {/* المنتجات المتاحة */}
      <h2>🛍️ المنتجات المتاحة</h2>
      <div style={styles.grid}>
        {products.map((product) => (
          <div key={product.id} style={styles.card}>
            <h3 style={{ margin: '0 0 10px 0' }}>{product.name}</h3>
            <p style={{ color: '#666', marginBottom: '10px' }}>
              {product.description || 'لا يوجد وصف'}
            </p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745', marginBottom: '15px' }}>
              {typeof product.price === 'string' ? parseFloat(product.price).toFixed(2) : product.price.toFixed(2)} جنيه
            </p>
            <button 
              style={{...styles.button, ...styles.buttonSuccess}}
              onClick={() => addToCart(product)}
            >
              ➕ إضافة للسلة
            </button>
          </div>
        ))}
      </div>

      {/* عناصر السلة */}
      <h2>🛒 عناصر السلة ({cartItems.length})</h2>
      {cartItems.length === 0 ? (
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h3>🛒 السلة فارغة</h3>
            <p>أضف منتجات من القائمة أعلاه لبدء التسوق</p>
          </div>
        </div>
      ) : (
        <div>
          {cartItems.map((item) => (
            <div key={item.id} style={styles.cartItem}>
              <div>
                <h4 style={{ margin: '0 0 5px 0' }}>{item.product_name}</h4>
                <p style={{ margin: '0 0 5px 0', color: '#666' }}>
                  السعر: {typeof item.product_price === 'string' ? parseFloat(item.product_price).toFixed(2) : item.product_price.toFixed(2)} جنيه
                </p>
                <p style={{ margin: 0, fontWeight: 'bold' }}>
                  الإجمالي: {typeof item.total_price === 'string' ? parseFloat(item.total_price).toFixed(2) : item.total_price.toFixed(2)} جنيه
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button 
                  style={styles.button}
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  ➖
                </button>
                <span style={{ fontSize: '18px', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>
                  {item.quantity}
                </span>
                <button 
                  style={styles.button}
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  ➕
                </button>
                <button 
                  style={{...styles.button, ...styles.buttonDanger}}
                  onClick={() => removeFromCart(item.id)}
                >
                  🗑️ حذف
                </button>
              </div>
            </div>
          ))}
          
          {/* إجمالي السلة وإتمام الطلب */}
          <div style={{
            ...styles.card,
            backgroundColor: '#e8f5e8',
            border: '2px solid #28a745',
            marginTop: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#28a745', margin: '0 0 10px 0' }}>💰 إجمالي السلة</h3>
              <p style={{ fontSize: '2.5rem', margin: '0 0 20px 0', fontWeight: 'bold', color: '#28a745' }}>
                {cartTotal.toFixed(2)} جنيه
              </p>
              <button 
                style={{...styles.button, ...styles.buttonCheckout}}
                onClick={checkout}
                disabled={isCheckingOut || cartItems.length === 0}
              >
                {isCheckingOut ? '⏳ جاري إتمام الطلب...' : '🛒 إتمام الطلب'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullCartTest;
