import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { stockApi } from '@/services/api';
import { Package, Scissors, FileText, Activity, Truck, Smartphone, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStock: 0,
    cutProducts: 0,
    productions: 0,
    materials: {
      gaz: 0,
      petkim: 0,
      estol: 0,
      talk: 0,
      masura100: 0,
      masura120: 0,
      masura150: 0,
      masura200: 0,
      sari: 0,
    },
  });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
    
    // PWA kurulum olayını yakala
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    
    // Zaten kurulmuş mu kontrol et
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBanner(false);
    }
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast({
        title: 'Bilgi',
        description: 'Uygulama zaten kurulu veya tarayıcınız desteklemiyor',
      });
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast({
        title: 'Başarılı',
        description: 'Uygulama ana ekrana eklendi!',
      });
    }
    
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await stockApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Stats fetch error:', error);
      toast({
        title: 'Hata',
        description: 'Veriler yüklenirken hata oluştu',
        variant: 'destructive',
      });
    }
  };

  const materialCards = [
    { name: 'Gaz', value: stats.materials.gaz, unit: 'kg', color: 'from-purple-500 to-purple-700' },
    { name: 'Petkim', value: stats.materials.petkim, unit: 'kg', color: 'from-blue-500 to-blue-700' },
    { name: 'Estol', value: stats.materials.estol, unit: 'kg', color: 'from-teal-500 to-teal-700' },
    { name: 'Talk', value: stats.materials.talk, unit: 'kg', color: 'from-cyan-500 to-cyan-700' },
    { name: 'Masura 100', value: stats.materials.masura100, unit: 'adet', color: 'from-green-500 to-green-700' },
    { name: 'Masura 120', value: stats.materials.masura120, unit: 'adet', color: 'from-yellow-600 to-yellow-800' },
    { name: 'Masura 150', value: stats.materials.masura150, unit: 'adet', color: 'from-orange-600 to-orange-800' },
    { name: 'Masura 200', value: stats.materials.masura200, unit: 'adet', color: 'from-red-600 to-red-800' },
    { name: 'Sarı', value: stats.materials.sari, unit: 'kg', color: 'from-amber-600 to-amber-800' },
  ];

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* PWA Kurulum Banner */}
      {showInstallBanner && (
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0 relative">
          <CardContent className="p-4">
            <button
              onClick={() => setShowInstallBanner(false)}
              className="absolute top-2 right-2 text-white/80 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-4">
              <Smartphone className="h-12 w-12 text-white" />
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg">📱 Telefonunuza Kurun!</h3>
                <p className="text-white/90 text-sm mt-1">
                  Uygulamayı ana ekranınıza ekleyin ve her yerden hızlıca erişin
                </p>
              </div>
              <Button
                onClick={handleInstallClick}
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold"
              >
                Kur
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Hoş Geldiniz</h1>
        <p className="text-slate-400 mt-1">SAR Ambalaj Üretim Yönetim Sistemi</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Toplam Normal Ürün Stoğu
            </CardTitle>
            <Package className="h-6 w-6 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.totalStock}</div>
            <p className="text-xs text-white/80 mt-1">Rulo/Adet</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600 to-orange-800 border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Toplam Kesilmiş Ürün Stoğu
            </CardTitle>
            <Scissors className="h-6 w-6 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.cutProducts}</div>
            <p className="text-xs text-white/80 mt-1">Parça/Adet</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Toplam Üretim Kaydı
            </CardTitle>
            <FileText className="h-6 w-6 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.productions}</div>
            <p className="text-xs text-white/80 mt-1">Kayıt</p>
          </CardContent>
        </Card>
      </div>

      {/* Materials Section */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Hammadde Stokları</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {materialCards.map((material) => (
            <Card key={material.name} className={`bg-gradient-to-br ${material.color} border-0`}>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-white/90 mb-2">{material.name}</div>
                <div className="text-2xl font-bold text-white">{material.value}</div>
                <div className="text-xs text-white/80 mt-1">{material.unit}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* System Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Sistem Özeti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Normal Ürün Stoğu</span>
              <span className="text-emerald-400 font-semibold">{stats.totalStock} adet</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Kesilmiş Ürün Stoğu</span>
              <span className="text-orange-400 font-semibold">{stats.cutProducts} adet</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Toplam Sevkiyat</span>
              <span className="text-blue-400 font-semibold">0 kayıt</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Hızlı Erişim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <Activity className="h-4 w-4 text-emerald-400 mt-0.5" />
              <span className="text-slate-300">Üretim Girişi - Yeni üretim kaydı ekleyin</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Scissors className="h-4 w-4 text-orange-400 mt-0.5" />
              <span className="text-slate-300">Kesilmiş Ürün - Ebatlama işlemleri</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Truck className="h-4 w-4 text-blue-400 mt-0.5" />
              <span className="text-slate-300">Sevkiyat - Çıkış kayıtları</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Package className="h-4 w-4 text-purple-400 mt-0.5" />
              <span className="text-slate-300">Stok Görünümü - Anlık stok durumu</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};