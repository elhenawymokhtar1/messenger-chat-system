/**
 * 🚀 صفحة ترقية خطة الاشتراك
 * تاريخ الإنشاء: 11 يوليو 2025
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  ArrowRight, 
  Crown, 
  Zap, 
  Shield, 
  Star,
  CreditCard,
  Calendar,
  TrendingUp,
  Users,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

// 📋 أنواع البيانات
interface SubscriptionPlan {
  id: string;
  nameAr: string;
  descriptionAr: string;
  price: {
    monthly: number;
    yearly: number;
  };
  featuresAr: string[];
  popular?: boolean;
  recommended?: boolean;
  color: string;
  icon: React.ReactNode;
}

// 📊 خطط الاشتراك
const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    nameAr: 'الأساسية',
    descriptionAr: 'مثالية للشركات الصغيرة',
    price: { monthly: 19, yearly: 190 },
    featuresAr: [
      '1,000 رسالة شهرياً',
      'حتى 3 صفحات فيسبوك',
      'ميزات متجر أساسية',
      'دعم عبر البريد الإلكتروني',
      'تحليلات أساسية'
    ],
    color: 'blue',
    icon: <Users className="h-6 w-6" />
  },
  {
    id: 'professional',
    nameAr: 'المتقدمة',
    descriptionAr: 'الأفضل للشركات النامية',
    price: { monthly: 49, yearly: 490 },
    featuresAr: [
      '5,000 رسالة شهرياً',
      'حتى 10 صفحات فيسبوك',
      'ميزات متجر متقدمة',
      'دعم أولوية',
      'تحليلات متقدمة',
      'ردود ذكية بالذكاء الاصطناعي',
      'تكاملات مخصصة'
    ],
    popular: true,
    color: 'purple',
    icon: <Zap className="h-6 w-6" />
  },
  {
    id: 'business',
    nameAr: 'الأعمال',
    descriptionAr: 'للمؤسسات الكبيرة',
    price: { monthly: 199, yearly: 1990 },
    featuresAr: [
      'رسائل غير محدودة',
      'صفحات فيسبوك غير محدودة',
      'جميع ميزات المتجر',
      'دعم هاتفي 24/7',
      'تحليلات مخصصة',
      'ميزات ذكاء اصطناعي متقدمة',
      'خيارات العلامة البيضاء',
      'وصول API',
      'تدريب مخصص'
    ],
    recommended: true,
    color: 'gold',
    icon: <Crown className="h-6 w-6" />
  }
];

const UpgradePlan: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  // 🔄 تحديد الخطة المحددة من URL
  useEffect(() => {
    const planFromUrl = searchParams.get('plan');
    if (planFromUrl && subscriptionPlans.find(p => p.id === planFromUrl)) {
      setSelectedPlan(planFromUrl);
    } else {
      setSelectedPlan('professional'); // الخطة الافتراضية
    }
  }, [searchParams]);

  // 💰 حساب الوفورات للاشتراك السنوي
  const calculateSavings = (plan: SubscriptionPlan) => {
    const monthlyTotal = plan.price.monthly * 12;
    const yearlyPrice = plan.price.yearly;
    const savings = monthlyTotal - yearlyPrice;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return { amount: savings, percentage };
  };

  // 🎯 معالجة ترقية الخطة
  const handleUpgrade = async (planId: string) => {
    setIsLoading(true);
    try {
      console.log('Upgrading to plan:', planId, 'Billing:', billingCycle);
      await new Promise(resolve => setTimeout(resolve, 2000));
      navigate('/subscription-plans?upgraded=true');
    } catch (error) {
      console.error('Error upgrading plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎨 الحصول على لون الخطة
  const getPlanColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      gold: 'bg-gradient-to-r from-yellow-400 to-orange-500'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-500';
  };

  const selectedPlanData = subscriptionPlans.find(p => p.id === selectedPlan);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 🎯 العنوان الرئيسي */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              ترقية خطة الاشتراك
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            اختر الخطة المناسبة لاحتياجات عملك واستمتع بميزات متقدمة
          </p>
        </div>

        {/* 🔄 مفتاح الفوترة */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <div className="flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="h-4 w-4 inline mr-2" />
                شهري
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all relative ${
                  billingCycle === 'yearly'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="h-4 w-4 inline mr-2" />
                سنوي
                <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs">
                  وفر 17%
                </Badge>
              </button>
            </div>
          </div>
        </div>

        {/* 📊 بطاقات الخطط */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {subscriptionPlans.map((plan) => {
            const savings = calculateSavings(plan);
            const isSelected = selectedPlan === plan.id;
            const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
            const priceLabel = billingCycle === 'monthly' ? 'شهر' : 'سنة';

            return (
              <Card 
                key={plan.id}
                className={`relative transition-all duration-300 cursor-pointer ${
                  isSelected 
                    ? 'ring-2 ring-purple-500 shadow-xl scale-105' 
                    : 'hover:shadow-lg hover:scale-102'
                } ${plan.popular ? 'border-purple-200' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    الأكثر شعبية
                  </Badge>
                )}
                
                {plan.recommended && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    <Crown className="h-3 w-3 mr-1" />
                    موصى به
                  </Badge>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`w-12 h-12 rounded-full ${getPlanColor(plan.color)} flex items-center justify-center text-white mx-auto mb-4`}>
                    {plan.icon}
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.nameAr}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {plan.descriptionAr}
                  </CardDescription>
                  
                  <div className="mt-4">
                    <div className="text-4xl font-bold text-gray-900">
                      ${price}
                      <span className="text-lg font-normal text-gray-600">/{priceLabel}</span>
                    </div>
                    
                    {billingCycle === 'yearly' && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        وفر ${savings.amount} سنوياً ({savings.percentage}%)
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.featuresAr.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isSelected && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 text-purple-700 font-medium">
                        <Sparkles className="h-4 w-4" />
                        خطة محددة
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 📋 ملخص الترقية */}
        {selectedPlanData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                ملخص الترقية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="text-lg">
                  <span className="font-semibold">{selectedPlanData.nameAr}</span> - 
                  <span className="text-purple-600 font-bold">
                    ${billingCycle === 'monthly' ? selectedPlanData.price.monthly : selectedPlanData.price.yearly}
                    /{billingCycle === 'monthly' ? 'شهر' : 'سنة'}
                  </span>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/subscription-plans')}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    العودة للخطط
                  </Button>
                  <Button 
                    onClick={() => handleUpgrade(selectedPlan)}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isLoading ? (
                      'جاري المعالجة...'
                    ) : (
                      <>
                        ترقية الآن
                        <ArrowRight className="h-4 w-4 mr-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 🔒 ضمانات الأمان */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              دفع آمن
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              ضمان استرداد 30 يوم
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              دعم 24/7
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePlan;
