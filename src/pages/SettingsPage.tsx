import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Settings,
  Clock,
  Globe,
  Bell,
  Palette,
  Save,
  RefreshCw,
  Check,
  AlertCircle,
  Monitor,
  Moon,
  Sun,
  Languages,
  MapPin,
  Download,
  Upload,
  RotateCcw
} from 'lucide-react';
import { formatTime, getCurrentTime } from "@/utils/timeUtils";
import { useSettings } from "@/hooks/useSettings";

const SettingsPage: React.FC = () => {
  const {
    settings,
    isLoading,
    isSaving,
    hasChanges,
    updateSetting,
    saveSettings,
    resetSettings,
    exportSettings,
    importSettings
  } = useSettings();

  const [currentTime, setCurrentTime] = useState('');

  // قائمة المناطق الزمنية
  const timezones = [
    { value: 'Africa/Cairo', label: 'القاهرة (GMT+2/+3)', country: 'مصر' },
    { value: 'Asia/Riyadh', label: 'الرياض (GMT+3)', country: 'السعودية' },
    { value: 'Asia/Dubai', label: 'دبي (GMT+4)', country: 'الإمارات' },
    { value: 'Asia/Kuwait', label: 'الكويت (GMT+3)', country: 'الكويت' },
    { value: 'Asia/Qatar', label: 'الدوحة (GMT+3)', country: 'قطر' },
    { value: 'Asia/Bahrain', label: 'المنامة (GMT+3)', country: 'البحرين' },
    { value: 'Asia/Baghdad', label: 'بغداد (GMT+3)', country: 'العراق' },
    { value: 'Asia/Damascus', label: 'دمشق (GMT+2/+3)', country: 'سوريا' },
    { value: 'Asia/Beirut', label: 'بيروت (GMT+2/+3)', country: 'لبنان' },
    { value: 'Africa/Tunis', label: 'تونس (GMT+1)', country: 'تونس' },
    { value: 'Africa/Algiers', label: 'الجزائر (GMT+1)', country: 'الجزائر' },
    { value: 'Africa/Casablanca', label: 'الدار البيضاء (GMT+0/+1)', country: 'المغرب' },
    { value: 'UTC', label: 'UTC (GMT+0)', country: 'عالمي' }
  ];

  // تحديث الوقت الحالي كل ثانية
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getCurrentTime(settings.timezone));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, [settings.timezone]);

  // معالج استيراد الملفات
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importSettings(file);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إعدادات النظام</h1>
            <p className="text-gray-600">إدارة إعدادات التطبيق والتخصيص</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              تغييرات غير محفوظة
            </Badge>
          )}

          {/* أزرار إضافية */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportSettings}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              تصدير
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('import-file')?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              استيراد
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={resetSettings}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <RotateCcw className="h-4 w-4" />
              إعادة تعيين
            </Button>
          </div>

          <Button
            onClick={() => saveSettings()}
            disabled={!hasChanges || isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            حفظ الإعدادات
          </Button>
        </div>

        {/* مدخل مخفي لاستيراد الملفات */}
        <input
          id="import-file"
          type="file"
          accept=".json"
          onChange={handleFileImport}
          className="hidden"
        />
      </div>

      {/* التبويبات */}
      <Tabs defaultValue="timezone" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timezone" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            التوقيت
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            المنطقة
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            المظهر
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            الإشعارات
          </TabsTrigger>
        </TabsList>

        {/* تبويب إعدادات التوقيت */}
        <TabsContent value="timezone">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                إعدادات التوقيت والتاريخ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* المنطقة الزمنية */}
              <div className="space-y-2">
                <Label>المنطقة الزمنية</Label>
                <Select value={settings.timezone} onValueChange={(value) => updateSetting('timezone', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{tz.label}</span>
                          <Badge variant="secondary" className="mr-2">{tz.country}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* الوقت الحالي */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">الوقت الحالي:</span>
                  </div>
                  <div className="text-2xl font-mono font-bold text-blue-600">
                    {currentTime}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  المنطقة الزمنية: {settings.timezone}
                </p>
              </div>

              {/* تنسيق التاريخ */}
              <div className="space-y-2">
                <Label>تنسيق التاريخ</Label>
                <Select value={settings.dateFormat} onValueChange={(value) => updateSetting('dateFormat', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/mm/yyyy">يوم/شهر/سنة (31/12/2024)</SelectItem>
                    <SelectItem value="mm/dd/yyyy">شهر/يوم/سنة (12/31/2024)</SelectItem>
                    <SelectItem value="yyyy-mm-dd">سنة-شهر-يوم (2024-12-31)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* تنسيق الوقت */}
              <div className="space-y-2">
                <Label>تنسيق الوقت</Label>
                <Select value={settings.timeFormat} onValueChange={(value) => updateSetting('timeFormat', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24 ساعة (15:30)</SelectItem>
                    <SelectItem value="12h">12 ساعة (3:30 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* معلومات إضافية */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-2">معلومات مهمة حول التوقيت</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• قاعدة البيانات تحفظ الأوقات بتوقيت UTC (GMT+0)</li>
                      <li>• الواجهة الأمامية تحول الأوقات تلقائياً للمنطقة الزمنية المحددة</li>
                      <li>• تغيير المنطقة الزمنية يؤثر على عرض جميع الأوقات في النظام</li>
                      <li>• يُنصح بحفظ الإعدادات بعد التغيير</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب إعدادات المنطقة */}
        <TabsContent value="regional">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                إعدادات المنطقة واللغة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* اللغة */}
              <div className="space-y-2">
                <Label>اللغة</Label>
                <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* البلد */}
              <div className="space-y-2">
                <Label>البلد</Label>
                <Select value={settings.country} onValueChange={(value) => updateSetting('country', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EG">🇪🇬 مصر</SelectItem>
                    <SelectItem value="SA">🇸🇦 السعودية</SelectItem>
                    <SelectItem value="AE">🇦🇪 الإمارات</SelectItem>
                    <SelectItem value="KW">🇰🇼 الكويت</SelectItem>
                    <SelectItem value="QA">🇶🇦 قطر</SelectItem>
                    <SelectItem value="BH">🇧🇭 البحرين</SelectItem>
                    <SelectItem value="IQ">🇮🇶 العراق</SelectItem>
                    <SelectItem value="SY">🇸🇾 سوريا</SelectItem>
                    <SelectItem value="LB">🇱🇧 لبنان</SelectItem>
                    <SelectItem value="JO">🇯🇴 الأردن</SelectItem>
                    <SelectItem value="TN">🇹🇳 تونس</SelectItem>
                    <SelectItem value="DZ">🇩🇿 الجزائر</SelectItem>
                    <SelectItem value="MA">🇲🇦 المغرب</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* العملة */}
              <div className="space-y-2">
                <Label>العملة</Label>
                <Select value={settings.currency} onValueChange={(value) => updateSetting('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                    <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                    <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                    <SelectItem value="KWD">دينار كويتي (KWD)</SelectItem>
                    <SelectItem value="QAR">ريال قطري (QAR)</SelectItem>
                    <SelectItem value="BHD">دينار بحريني (BHD)</SelectItem>
                    <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                    <SelectItem value="EUR">يورو (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب إعدادات المظهر */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                إعدادات المظهر
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* المظهر */}
              <div className="space-y-2">
                <Label>المظهر</Label>
                <Select value={settings.theme} onValueChange={(value) => updateSetting('theme', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        فاتح
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        داكن
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        تلقائي (حسب النظام)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* حجم الخط */}
              <div className="space-y-2">
                <Label>حجم الخط</Label>
                <Select value={settings.fontSize} onValueChange={(value) => updateSetting('fontSize', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">صغير</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="large">كبير</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* اللون الأساسي */}
              <div className="space-y-2">
                <Label>اللون الأساسي</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => updateSetting('primaryColor', e.target.value)}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <span className="text-sm text-gray-600">{settings.primaryColor}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب إعدادات الإشعارات */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                إعدادات الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* إشعارات البريد الإلكتروني */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>إشعارات البريد الإلكتروني</Label>
                  <p className="text-sm text-gray-600">تلقي إشعارات عبر البريد الإلكتروني</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                />
              </div>

              {/* الإشعارات المنبثقة */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>الإشعارات المنبثقة</Label>
                  <p className="text-sm text-gray-600">إشعارات فورية في المتصفح</p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                />
              </div>

              {/* الأصوات */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>أصوات الإشعارات</Label>
                  <p className="text-sm text-gray-600">تشغيل أصوات عند وصول الرسائل</p>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
                />
              </div>

              {/* الحفظ التلقائي */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>الحفظ التلقائي</Label>
                  <p className="text-sm text-gray-600">حفظ التغييرات تلقائياً</p>
                </div>
                <Switch
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => updateSetting('autoSave', checked)}
                />
              </div>

              {/* وضع التطوير */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>وضع التطوير</Label>
                  <p className="text-sm text-gray-600">إظهار معلومات إضافية للمطورين</p>
                </div>
                <Switch
                  checked={settings.debugMode}
                  onCheckedChange={(checked) => updateSetting('debugMode', checked)}
                />
              </div>

              {/* التحليلات */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>التحليلات</Label>
                  <p className="text-sm text-gray-600">مساعدة في تحسين التطبيق</p>
                </div>
                <Switch
                  checked={settings.analyticsEnabled}
                  onCheckedChange={(checked) => updateSetting('analyticsEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
