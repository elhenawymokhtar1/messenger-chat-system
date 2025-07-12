/**
 * 🔄 صفحة تبديل الشركات - استبدال localStorage بـ React Query
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCompanyState, Company } from '@/hooks/useCompanyState';
import { toast } from 'sonner';
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Calendar,
  CheckCircle,
  AlertCircle,
  LogOut,
  RefreshCw
} from 'lucide-react';

const CompanySwitcher: React.FC = () => {
  const navigate = useNavigate();
  const { 
    company: currentCompany, 
    setCompanyById, 
    clearCompany, 
    loading: companyLoading 
  } = useCompanyState();

  // جلب جميع الشركات
  const { 
    data: companies = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['all-companies'],
    queryFn: async () => {
      console.log('🔍 جلب جميع الشركات...');
      
      const response = await fetch('http://localhost:3002/api/companies');
      if (!response.ok) {
        throw new Error('فشل في جلب قائمة الشركات');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'فشل في جلب قائمة الشركات');
      }
      
      console.log('✅ تم جلب الشركات:', result.data.length);
      return result.data as Company[];
    },
    staleTime: 1000 * 60 * 2, // البيانات صالحة لمدة دقيقتين
  });

  const handleSwitchCompany = async (companyId: string) => {
    try {
      await setCompanyById(companyId);
      navigate('/dashboard');
    } catch (error) {
      console.error('❌ خطأ في تبديل الشركة:', error);
    }
  };

  const handleLogout = () => {
    clearCompany();
    navigate('/company-login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'inactive': return <AlertCircle className="w-4 h-4" />;
      case 'suspended': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-lg text-gray-600">جاري تحميل الشركات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                خطأ في تحميل الشركات
              </CardTitle>
              <CardDescription>
                {(error as Error).message}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔄 تبديل الشركات
          </h1>
          <p className="text-gray-600">
            اختر الشركة التي تريد تسجيل الدخول إليها
          </p>
        </div>

        {/* الشركة الحالية */}
        {currentCompany && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                الشركة الحالية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{currentCompany.name}</h3>
                  <p className="text-gray-600">{currentCompany.email}</p>
                </div>
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  تسجيل الخروج
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator className="my-6" />

        {/* قائمة الشركات */}
        <div className="grid gap-4 md:grid-cols-2">
          {companies.map((company) => (
            <Card 
              key={company.id} 
              className={`transition-all hover:shadow-lg ${
                currentCompany?.id === company.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'hover:border-gray-300'
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                  </div>
                  <Badge 
                    className={`${getStatusColor(company.status)} flex items-center gap-1`}
                  >
                    {getStatusIcon(company.status)}
                    {company.status === 'active' ? 'نشط' : 
                     company.status === 'inactive' ? 'غير نشط' : 'معلق'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  {company.email}
                </div>
                
                {company.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    {company.phone}
                  </div>
                )}
                
                {company.website && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe className="w-4 h-4" />
                    {company.website}
                  </div>
                )}
                
                {company.city && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {company.city}
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {new Date(company.created_at).toLocaleDateString('ar-EG')}
                </div>
                
                <div className="pt-3">
                  {currentCompany?.id === company.id ? (
                    <Badge variant="secondary" className="w-full justify-center">
                      الشركة الحالية
                    </Badge>
                  ) : (
                    <Button 
                      onClick={() => handleSwitchCompany(company.id)}
                      className="w-full"
                      disabled={companyLoading || company.status !== 'active'}
                    >
                      {companyLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Building2 className="w-4 h-4 mr-2" />
                      )}
                      تسجيل الدخول
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {companies.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                لا توجد شركات
              </h3>
              <p className="text-gray-600">
                لم يتم العثور على أي شركات في النظام
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CompanySwitcher;
