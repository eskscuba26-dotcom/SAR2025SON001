import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Reporting = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [pdfBlob, setPdfBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generatePDF = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${BACKEND_URL}/api/generate-pdf-report?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`,
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      );
      
      if (!response.ok) throw new Error('PDF oluşturulamadı');
      
      const blob = await response.blob();
      setPdfBlob(URL.createObjectURL(blob));
      
      toast({
        title: '✅ PDF Hazır!',
        description: 'PDF asagida gorunuyor. Sag tikla-Farkli Kaydet ile bilgisayariniza indirebilirsiniz.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'PDF oluşturulamadı: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const setCurrentMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setDateRange({
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    });
  };

  const setLastMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    
    setDateRange({
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">📊 Raporlama</h1>
        <p className="text-slate-400 mt-1">Aylik uretim, sevkiyat ve tuketim raporlari</p>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={setCurrentMonth}
          variant="outline"
          className="bg-blue-600 hover:bg-blue-700 border-0 text-white"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Bu Ay
        </Button>
        <Button
          onClick={setLastMonth}
          variant="outline"
          className="bg-purple-600 hover:bg-purple-700 border-0 text-white"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Gecen Ay
        </Button>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Rapor Tarih Araligi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Baslangic Tarihi</Label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Bitis Tarihi</Label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="mt-6">
            <Button
              onClick={generatePDF}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg py-6"
            >
              {loading ? (
                <>⏳ PDF Hazirlaniyor...</>
              ) : (
                <>📄 PDF Raporunu Olustur ve Goster</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PDF Önizleme */}
      {pdfBlob && (
        <Card className="bg-slate-900/50 border-emerald-600">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">✅ PDF RAPOR HAZIR</CardTitle>
              <Button
                onClick={() => setPdfBlob(null)}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                Kapat
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 border-4 border-green-500 rounded-lg p-6 text-center">
                <p className="text-green-200 font-bold text-2xl mb-4">
                  📥 BILGISAYARINIZA KAYDETMEK ICIN:
                </p>
                <div className="text-green-100 text-lg space-y-3 text-left max-w-2xl mx-auto">
                  <p>1️⃣ Asagidaki PDF <strong className="text-yellow-300">UZERINE SAG TIKLAYIN</strong></p>
                  <p>2️⃣ <strong className="text-yellow-300">"FARKLI KAYDET"</strong> veya <strong className="text-yellow-300">"SAVE AS"</strong> secenegini tiklayin</p>
                  <p>3️⃣ Bilgisayarinizda kaydetmek istediginiz yeri secin</p>
                  <p>4️⃣ <strong className="text-yellow-300">KAYDET</strong> butonuna basin - BITTI! ✅</p>
                </div>
              </div>

              <div className="border-8 border-emerald-500 rounded-lg overflow-hidden bg-white">
                <iframe
                  src={pdfBlob}
                  className="w-full"
                  style={{ height: '900px' }}
                  title="PDF Rapor - Sag Tikla Farkli Kaydet"
                />
              </div>

              <div className="bg-yellow-900/50 border-2 border-yellow-500 rounded p-4 text-center">
                <p className="text-yellow-200 font-semibold">
                  ⚠️ PDF gorunmuyorsa tarayicinizin sol ustundeki INDIR butonunu kullanin
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-700">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <FileText className="h-8 w-8 text-blue-400 flex-shrink-0" />
            <div>
              <h3 className="text-white font-semibold mb-2">📋 Rapor Icerigi</h3>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>✅ Kapak sayfasi (SAR AMBALAJ + Ay + FABRIKA RAPORU)</li>
                <li>✅ Hammadde tuketim detaylari (PETKiM, ESTOL, TALK, GAZ, FiRE)</li>
                <li>✅ Makine bazinda uretim analizi ve detayli liste</li>
                <li>✅ Musteri bazinda sevkiyat ozeti ve irsaliye detaylari</li>
                <li>✅ PDF backend tarafindan olusturulur (tarayici engeli yok)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
