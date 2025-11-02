import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Reporting = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generatePDFReport = async () => {
    try {
      setLoading(true);
      
      // Tüm verileri çek
      const [productions, materials, consumptions, shipments] = await Promise.all([
        axios.get(`${API}/production`),
        axios.get(`${API}/materials`),
        axios.get(`${API}/daily-consumption`),
        axios.get(`${API}/shipments`)
      ]);

      // Tarihe göre filtrele
      const filterByDate = (items, dateField = 'date') => {
        return items.filter(item => {
          const itemDate = item[dateField];
          return itemDate >= dateRange.startDate && itemDate <= dateRange.endDate;
        });
      };

      const filteredProductions = filterByDate(productions.data);
      const filteredMaterials = filterByDate(materials.data);
      const filteredConsumptions = filterByDate(consumptions.data);
      const filteredShipments = filterByDate(shipments.data);

      // PDF oluştur
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Türkçe karakter desteği için font ayarı
      doc.setFont('helvetica');
      
      let yPosition = 20;

      // Başlık
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text('SAR AMBALAJ', 105, yPosition, { align: 'center' });
      
      yPosition += 8;
      doc.setFontSize(14);
      doc.text('AYLIK URETIM RAPORU', 105, yPosition, { align: 'center' });
      
      yPosition += 10;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Tarih Araligi: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`, 105, yPosition, { align: 'center' });
      
      yPosition += 3;
      doc.text(`Rapor Tarihi: ${formatDate(new Date().toISOString().split('T')[0])}`, 105, yPosition, { align: 'center' });
      
      yPosition += 10;

      // ÖZET İSTATİSTİKLER
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text('GENEL OZET', 14, yPosition);
      yPosition += 7;

      const totalProduction = filteredProductions.reduce((sum, p) => sum + (p.quantity || 0), 0);
      const totalShipment = filteredShipments.reduce((sum, s) => sum + parseInt(s.quantity || 0), 0);
      const totalM2 = filteredProductions.reduce((sum, p) => sum + (p.m2 || 0), 0);

      doc.setFontSize(10);
      doc.text(`Toplam Uretim: ${totalProduction} adet`, 14, yPosition);
      yPosition += 5;
      doc.text(`Toplam Sevkiyat: ${totalShipment} adet`, 14, yPosition);
      yPosition += 5;
      doc.text(`Toplam Uretim M2: ${totalM2.toFixed(2)} m2`, 14, yPosition);
      yPosition += 5;
      doc.text(`Kalan Stok: ${totalProduction - totalShipment} adet`, 14, yPosition);
      yPosition += 10;

      // 1. HAMMADDE TUKETIMI
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text('1. HAMMADDE TUKETIMI', 14, yPosition);
      yPosition += 7;

      // Hammadde toplamları hesapla
      const materialTotals = {
        petkim: 0,
        estol: 0,
        talk: 0,
        gaz: 0,
        fire: 0
      };

      filteredConsumptions.forEach(c => {
        materialTotals.petkim += parseFloat(c.petkim || 0);
        materialTotals.estol += parseFloat(c.estol || 0);
        materialTotals.talk += parseFloat(c.talk || 0);
        materialTotals.gaz += parseFloat(c.gaz || 0);
        materialTotals.fire += parseFloat(c.fire || 0);
      });

      const materialData = [
        ['PETKiM LDPE', `${materialTotals.petkim.toFixed(2)} kg`],
        ['ESTOL', `${materialTotals.estol.toFixed(2)} kg`],
        ['TALK', `${materialTotals.talk.toFixed(2)} kg`],
        ['GAZ (N2)', `${materialTotals.gaz.toFixed(2)} kg`],
        ['FiRE', `${materialTotals.fire.toFixed(2)} kg`]
      ];

      doc.autoTable({
        startY: yPosition,
        head: [['Hammadde', 'Toplam Tuketim']],
        body: materialData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 10 },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 14, right: 14 }
      });

      yPosition = doc.lastAutoTable.finalY + 10;

      // 2. ÜRETIM DETAYLARI
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.text('2. URETIM DETAYLARI', 14, yPosition);
      yPosition += 7;

      // Makineye göre grupla
      const productionByMachine = {};
      filteredProductions.forEach(p => {
        const machine = p.machine || 'Bilinmiyor';
        if (!productionByMachine[machine]) {
          productionByMachine[machine] = [];
        }
        productionByMachine[machine].push(p);
      });

      const productionData = [];
      Object.keys(productionByMachine).forEach(machine => {
        const items = productionByMachine[machine];
        const totalQty = items.reduce((sum, p) => sum + (p.quantity || 0), 0);
        const totalM2 = items.reduce((sum, p) => sum + (p.m2 || 0), 0);
        
        productionData.push([
          machine,
          items.length.toString(),
          totalQty.toString(),
          totalM2.toFixed(2)
        ]);
      });

      doc.autoTable({
        startY: yPosition,
        head: [['Makine', 'Islem Sayisi', 'Toplam Adet', 'Toplam M2']],
        body: productionData,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94], textColor: 255, fontSize: 10 },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 14, right: 14 }
      });

      yPosition = doc.lastAutoTable.finalY + 10;

      // Üretim detay tablosu
      if (yPosition > 230) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(10);
      doc.text('Uretim Detay Listesi:', 14, yPosition);
      yPosition += 5;

      const productionDetailData = filteredProductions.slice(0, 50).map(p => [
        p.date || '',
        p.machine || '',
        `${p.thickness} x ${p.width}cm x ${p.length}m`,
        p.quantity?.toString() || '0',
        p.m2?.toFixed(2) || '0',
        p.color || ''
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Tarih', 'Makine', 'Olcu', 'Adet', 'M2', 'Renk']],
        body: productionDetailData,
        theme: 'striped',
        headStyles: { fillColor: [100, 116, 139], fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 2 },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 25 },
          2: { cellWidth: 40 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 25 }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 10;

      // 3. SEVKİYAT DETAYLARI
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.text('3. SEVKIYAT DETAYLARI', 14, yPosition);
      yPosition += 7;

      // Müşteriye göre özet
      const shipmentByCustomer = {};
      filteredShipments.forEach(s => {
        const customer = s.customer || 'Bilinmiyor';
        if (!shipmentByCustomer[customer]) {
          shipmentByCustomer[customer] = { count: 0, totalQty: 0 };
        }
        shipmentByCustomer[customer].count++;
        shipmentByCustomer[customer].totalQty += parseInt(s.quantity || 0);
      });

      const shipmentSummaryData = Object.keys(shipmentByCustomer).map(customer => [
        customer,
        shipmentByCustomer[customer].count.toString(),
        shipmentByCustomer[customer].totalQty.toString()
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Musteri', 'Sevkiyat Sayisi', 'Toplam Adet']],
        body: shipmentSummaryData,
        theme: 'grid',
        headStyles: { fillColor: [251, 146, 60], textColor: 255, fontSize: 10 },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 14, right: 14 }
      });

      yPosition = doc.lastAutoTable.finalY + 10;

      // Sevkiyat detay tablosu
      if (yPosition > 230) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(10);
      doc.text('Sevkiyat Detay Listesi:', 14, yPosition);
      yPosition += 5;

      const shipmentDetailData = filteredShipments.slice(0, 50).map(s => [
        s.date || '',
        s.customer || '',
        s.type || '',
        s.size || '',
        s.quantity?.toString() || '0',
        s.m2?.toFixed(2) || '0'
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Tarih', 'Musteri', 'Tip', 'Ebat', 'Adet', 'M2']],
        body: shipmentDetailData,
        theme: 'striped',
        headStyles: { fillColor: [100, 116, 139], fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 2 },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 40 },
          2: { cellWidth: 20 },
          3: { cellWidth: 45 },
          4: { cellWidth: 18 },
          5: { cellWidth: 18 }
        }
      });

      // Sayfa numaraları ekle
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Sayfa ${i} / ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // PDF'i indir
      const fileName = `SAR_Ambalaj_Rapor_${dateRange.startDate}_${dateRange.endDate}.pdf`;
      doc.save(fileName);

      toast({
        title: 'Basarili',
        description: 'Rapor PDF olarak indirildi',
      });

    } catch (error) {
      console.error('PDF olusturma hatasi:', error);
      toast({
        title: 'Hata',
        description: 'Rapor olusturulamadi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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

      {/* Hızlı Tarih Seçimi */}
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

      {/* Tarih Aralığı Seçimi */}
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
              onClick={generatePDFReport}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg py-6"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Rapor Hazirlaniyor...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  PDF Rapor Olustur ve Indir
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bilgi Kartı */}
      <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-700">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <FileText className="h-8 w-8 text-blue-400 flex-shrink-0" />
            <div>
              <h3 className="text-white font-semibold mb-2">📋 Rapor Icerigi</h3>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>✅ Genel ozet istatistikler</li>
                <li>✅ Hammadde tuketim detaylari (PETKiM, ESTOL, TALK, GAZ, FiRE)</li>
                <li>✅ Makine bazinda uretim analizi</li>
                <li>✅ Uretim detay listesi (Tarih, makine, olcu, adet, m2)</li>
                <li>✅ Musteri bazinda sevkiyat ozeti</li>
                <li>✅ Sevkiyat detay listesi</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
