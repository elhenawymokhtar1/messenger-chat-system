import React, { useState, useEffect } from 'react';

interface Category {
  id?: string;
  name: string;
  description: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  color?: string;
  created_at?: string;
}

const SimpleCategoriesTest: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    sort_order: '1',
    is_active: true,
    color: '#007bff'
  });

  const COMPANY_ID = '2d9b8887-0cca-430b-b61b-ca16cccfec63';

  // جلب الفئات
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 جلب الفئات...');
      
      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/categories`);
      
      if (!response.ok) {
        throw new Error(`خطأ HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setCategories(result.data || []);
        console.log('✅ تم جلب الفئات:', result.data?.length || 0);
      } else {
        throw new Error(result.message || 'فشل في جلب الفئات');
      }
    } catch (error) {
      console.error('❌ خطأ في جلب الفئات:', error);
      setError(`فشل في تحميل الفئات: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // إضافة فئة
  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('اسم الفئة مطلوب');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        slug: formData.slug.trim() || formData.name.trim().replace(/\s+/g, '-').toLowerCase(),
        sort_order: parseInt(formData.sort_order) || 1,
        is_active: formData.is_active,
        color: formData.color
      };

      console.log('🆕 إضافة فئة:', categoryData);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData)
      });

      if (!response.ok) {
        throw new Error(`خطأ HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setCategories(prev => [result.data, ...prev]);
        setFormData({
          name: '',
          description: '',
          slug: '',
          sort_order: '1',
          is_active: true,
          color: '#007bff'
        });
        setShowForm(false);
        setSuccess(`تم إضافة الفئة "${result.data.name}" بنجاح!`);
        console.log('✅ تم إضافة الفئة:', result.data.name);
      } else {
        throw new Error(result.message || 'فشل في إضافة الفئة');
      }
    } catch (error) {
      console.error('❌ خطأ في إضافة الفئة:', error);
      setError(`فشل في إضافة الفئة: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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
      padding: '12px 24px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '16px',
      margin: '10px'
    },
    buttonSuccess: {
      backgroundColor: '#28a745'
    },
    buttonDanger: {
      backgroundColor: '#dc3545'
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
    form: {
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '8px',
      margin: '20px 0',
      border: '1px solid #dee2e6'
    },
    input: {
      width: '100%',
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '16px',
      marginBottom: '15px'
    },
    textarea: {
      width: '100%',
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '16px',
      marginBottom: '15px',
      minHeight: '80px',
      resize: 'vertical' as const
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '20px',
      marginTop: '20px'
    },
    card: {
      backgroundColor: 'white',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
          ⏳ جاري تحميل الفئات...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🏷️ اختبار الفئات البسيط</h1>
        <p style={styles.subtitle}>صفحة اختبار مبسطة لإدارة الفئات</p>
      </div>

      {/* أزرار التحكم */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button 
          style={styles.button}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '❌ إلغاء' : '➕ إضافة فئة جديدة'}
        </button>
        <button 
          style={{...styles.button, ...styles.buttonSuccess}}
          onClick={fetchCategories}
        >
          🔄 إعادة تحميل
        </button>
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

      {/* نموذج الإضافة */}
      {showForm && (
        <form style={styles.form} onSubmit={addCategory}>
          <h3>إضافة فئة جديدة</h3>
          
          <div>
            <label>اسم الفئة *</label>
            <input
              style={styles.input}
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="أدخل اسم الفئة"
              required
            />
          </div>

          <div>
            <label>الوصف</label>
            <textarea
              style={styles.textarea}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="وصف الفئة (اختياري)"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label>الرابط المختصر</label>
              <input
                style={styles.input}
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="category-slug"
              />
            </div>
            <div>
              <label>ترتيب العرض</label>
              <input
                style={styles.input}
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
                min="1"
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                style={{ marginLeft: '8px' }}
              />
              فئة نشطة
            </label>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button 
              type="submit" 
              style={{...styles.button, ...styles.buttonSuccess}}
              disabled={isSaving}
            >
              {isSaving ? '⏳ جاري الحفظ...' : '💾 إضافة الفئة'}
            </button>
          </div>
        </form>
      )}

      {/* إحصائيات */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px',
        margin: '20px 0'
      }}>
        <div style={styles.card}>
          <h3 style={{ color: '#007bff', margin: '0 0 10px 0' }}>📊 إجمالي الفئات</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>{categories.length}</p>
        </div>
        <div style={styles.card}>
          <h3 style={{ color: '#28a745', margin: '0 0 10px 0' }}>✅ فئات نشطة</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>
            {categories.filter(c => c.is_active).length}
          </p>
        </div>
        <div style={styles.card}>
          <h3 style={{ color: '#dc3545', margin: '0 0 10px 0' }}>❌ فئات غير نشطة</h3>
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold' }}>
            {categories.filter(c => !c.is_active).length}
          </p>
        </div>
      </div>

      {/* قائمة الفئات */}
      {categories.length === 0 ? (
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h3>📂 لا توجد فئات</h3>
            <p>لم يتم إضافة أي فئات بعد</p>
            <button 
              style={styles.button}
              onClick={() => setShowForm(true)}
            >
              ➕ إضافة أول فئة
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.grid}>
          {categories.map((category) => (
            <div key={category.id} style={styles.card}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '15px'
              }}>
                <h3 style={{ margin: 0, color: '#333' }}>{category.name}</h3>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: category.is_active ? '#d4edda' : '#f8d7da',
                  color: category.is_active ? '#155724' : '#721c24'
                }}>
                  {category.is_active ? 'نشط' : 'غير نشط'}
                </span>
              </div>
              
              <p style={{ color: '#666', marginBottom: '15px' }}>
                {category.description || 'لا يوجد وصف'}
              </p>
              
              <div style={{ fontSize: '14px', color: '#888' }}>
                <div style={{ marginBottom: '5px' }}>
                  <strong>الرابط:</strong> /{category.slug}
                </div>
                <div style={{ marginBottom: '5px' }}>
                  <strong>الترتيب:</strong> {category.sort_order}
                </div>
                {category.color && (
                  <div style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                    <strong>اللون:</strong>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: category.color,
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      marginRight: '8px'
                    }}></div>
                    {category.color}
                  </div>
                )}
                <div>
                  <strong>تاريخ الإنشاء:</strong> {
                    category.created_at 
                      ? new Date(category.created_at).toLocaleDateString('ar-SA')
                      : 'غير محدد'
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleCategoriesTest;
