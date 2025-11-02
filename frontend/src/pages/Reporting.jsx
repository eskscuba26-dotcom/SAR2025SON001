import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Reporting = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const generatePDFReport = async () => {
    try {
      setLoading(true);
      
      // Token'ı al
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Tüm verileri çek
      const [productions, materials, consumptions, shipments, stockStats] = await Promise.all([
        axios.get(`${API}/production`, { headers }),
        axios.get(`${API}/materials`, { headers }),
        axios.get(`${API}/daily-consumption`, { headers }),
        axios.get(`${API}/shipments`, { headers }),
        axios.get(`${API}/stock-stats`, { headers })
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
      doc.setFont('helvetica');

      // ===== KAPAK SAYFASI =====
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 210, 297, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.text('SAR AMBALAJ', 105, 100, { align: 'center' });
      
      const startDate = new Date(dateRange.startDate);
      const monthName = startDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
      
      doc.setFontSize(24);
      doc.setTextColor(96, 165, 250);
      doc.text(monthName.toUpperCase() + ' AYI', 105, 120, { align: 'center' });
      
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.text('FABRIKA RAPORU', 105, 140, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(203, 213, 225);
      doc.text(`Rapor Tarihi: ${formatDate(new Date().toISOString().split('T')[0])}`, 105, 260, { align: 'center' });
      doc.text(`Tarih Araligi: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`, 105, 270, { align: 'center' });

      // ===== SAYFA 1: HAMMADDE TÜKETİMİ =====
      doc.addPage();
      let yPos = 20;
      
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, 'F');
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('1. HAMMADDE TUKETIM RAPORU', 14, yPos);
      
      yPos += 3;
      doc.setLineWidth(0.5);
      doc.setDrawColor(59, 130, 246);
      doc.line(14, yPos, 196, yPos);
      yPos += 10;

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

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${monthName} ayinda toplam ${filteredConsumptions.length} gun hammadde tuketimi kaydedilmistir.`, 14, yPos);
      yPos += 15;

      const materialData = [
        ['PETKiM LDPE', `${materialTotals.petkim.toFixed(2)} kg`, `${(materialTotals.petkim / (filteredConsumptions.length || 1)).toFixed(2)} kg/gun`],
        ['ESTOL', `${materialTotals.estol.toFixed(2)} kg`, `${(materialTotals.estol / (filteredConsumptions.length || 1)).toFixed(2)} kg/gun`],
        ['TALK', `${materialTotals.talk.toFixed(2)} kg`, `${(materialTotals.talk / (filteredConsumptions.length || 1)).toFixed(2)} kg/gun`],
        ['GAZ (N2)', `${materialTotals.gaz.toFixed(2)} kg`, `${(materialTotals.gaz / (filteredConsumptions.length || 1)).toFixed(2)} kg/gun`],
        ['FiRE', `${materialTotals.fire.toFixed(2)} kg`, `${(materialTotals.fire / (filteredConsumptions.length || 1)).toFixed(2)} kg/gun`]
      ];

      const grandTotal = Object.values(materialTotals).reduce((sum, val) => sum + val, 0);

      autoTable(doc, {
        startY: yPos,
        head: [['Hammadde Adi', 'Toplam Tuketim', 'Ortalama Gunluk']],
        body: materialData,
        foot: [[{ content: 'TOPLAM', colSpan: 1, styles: { halign: 'right', fontStyle: 'bold' } }, { content: `${grandTotal.toFixed(2)} kg`, styles: { fontStyle: 'bold' } }, '']],
        theme: 'striped',
        headStyles: { 
          fillColor: [59, 130, 246], 
          textColor: 255, 
          fontSize: 11,
          fontStyle: 'bold',
          halign: 'center'
        },
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [30, 41, 59],
          fontSize: 11
        },
        styles: { 
          fontSize: 10, 
          cellPadding: 4,
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 60, halign: 'right' },
          2: { cellWidth: 60, halign: 'right' }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = doc.lastAutoTable.finalY + 15;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Gunluk Tuketim Detaylari', 14, yPos);
      yPos += 7;

      const consumptionDetailData = filteredConsumptions.map(c => [
        c.date || '',
        `${parseFloat(c.petkim || 0).toFixed(1)} kg`,
        `${parseFloat(c.estol || 0).toFixed(1)} kg`,
        `${parseFloat(c.talk || 0).toFixed(1)} kg`,
        `${parseFloat(c.gaz || 0).toFixed(1)} kg`,
        `${parseFloat(c.fire || 0).toFixed(1)} kg`
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Tarih', 'PETKiM', 'ESTOL', 'TALK', 'GAZ', 'FiRE']],
        body: consumptionDetailData,
        theme: 'grid',
        headStyles: { 
          fillColor: [34, 197, 94],
          textColor: 255,
          fontSize: 9,
          halign: 'center'
        },
        styles: { 
          fontSize: 8, 
          cellPadding: 2.5,
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 28, halign: 'left' }
        },
        margin: { left: 14, right: 14 }
      });

      // ===== SAYFA 2: ÜRETİM RAPORU =====
      doc.addPage();
      yPos = 20;
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('2. URETIM RAPORU', 14, yPos);
      
      yPos += 3;
      doc.setDrawColor(34, 197, 94);
      doc.line(14, yPos, 196, yPos);
      yPos += 10;

      const totalProduction = filteredProductions.reduce((sum, p) => sum + (p.quantity || 0), 0);
      const totalM2 = filteredProductions.reduce((sum, p) => sum + (p.m2 || 0), 0);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${monthName} ayinda toplam ${filteredProductions.length} uretim islemi gerceklestirilmistir.`, 14, yPos);
      yPos += 6;
      doc.text(`Toplam Uretim: ${totalProduction} adet | Toplam M2: ${totalM2.toFixed(2)} m2`, 14, yPos);
      yPos += 12;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Makine Bazinda Ozet', 14, yPos);
      yPos += 7;

      const productionByMachine = {};
      filteredProductions.forEach(p => {
        const machine = p.machine || 'Bilinmiyor';
        if (!productionByMachine[machine]) {
          productionByMachine[machine] = { count: 0, totalQty: 0, totalM2: 0 };
        }
        productionByMachine[machine].count++;
        productionByMachine[machine].totalQty += (p.quantity || 0);
        productionByMachine[machine].totalM2 += (p.m2 || 0);
      });

      const machineData = Object.keys(productionByMachine).map(machine => [
        machine,
        productionByMachine[machine].count.toString(),
        productionByMachine[machine].totalQty.toString(),
        productionByMachine[machine].totalM2.toFixed(2)
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Makine Adi', 'Islem Sayisi', 'Toplam Adet', 'Toplam M2']],
        body: machineData,
        theme: 'grid',
        headStyles: { 
          fillColor: [34, 197, 94],
          textColor: 255,
          fontSize: 10,
          halign: 'center'
        },
        styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
        columnStyles: {
          0: { halign: 'left' }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = doc.lastAutoTable.finalY + 12;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Detayli Uretim Listesi', 14, yPos);
      yPos += 7;

      const productionDetailData = filteredProductions.map(p => [
        p.date || '',
        p.machine || '',
        `${p.thickness} x ${p.width}cm x ${p.length}m`,
        p.quantity?.toString() || '0',
        p.m2?.toFixed(2) || '0',
        p.color || '',
        p.masuraType || ''
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Tarih', 'Makine', 'Ebat', 'Adet', 'M2', 'Renk', 'Masura']],
        body: productionDetailData,
        theme: 'striped',
        headStyles: { 
          fillColor: [100, 116, 139],
          fontSize: 8,
          halign: 'center'
        },
        styles: { fontSize: 7, cellPadding: 2, halign: 'center' },
        columnStyles: {
          0: { cellWidth: 22, halign: 'left' },
          1: { cellWidth: 24 },
          2: { cellWidth: 42 },
          3: { cellWidth: 18 },
          4: { cellWidth: 18 },
          5: { cellWidth: 22 },
          6: { cellWidth: 22 }
        },
        margin: { left: 14, right: 14 }
      });

      // ===== SAYFA 3: SEVKİYAT RAPORU =====
      doc.addPage();
      yPos = 20;
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('3. SEVKIYAT RAPORU', 14, yPos);
      
      yPos += 3;
      doc.setDrawColor(251, 146, 60);
      doc.line(14, yPos, 196, yPos);
      yPos += 10;

      const totalShipment = filteredShipments.reduce((sum, s) => sum + parseInt(s.quantity || 0), 0);
      const totalShipmentM2 = filteredShipments.reduce((sum, s) => sum + parseFloat(s.m2 || 0), 0);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${monthName} ayinda toplam ${filteredShipments.length} sevkiyat gerceklestirilmistir.`, 14, yPos);
      yPos += 6;
      doc.text(`Toplam Sevkiyat: ${totalShipment} adet | Toplam M2: ${totalShipmentM2.toFixed(2)} m2`, 14, yPos);
      yPos += 12;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Musteri Bazinda Ozet', 14, yPos);
      yPos += 7;

      const shipmentByCustomer = {};
      filteredShipments.forEach(s => {
        const customer = s.customer || 'Bilinmiyor';
        if (!shipmentByCustomer[customer]) {
          shipmentByCustomer[customer] = { count: 0, totalQty: 0, totalM2: 0 };
        }
        shipmentByCustomer[customer].count++;
        shipmentByCustomer[customer].totalQty += parseInt(s.quantity || 0);
        shipmentByCustomer[customer].totalM2 += parseFloat(s.m2 || 0);
      });

      const customerData = Object.keys(shipmentByCustomer).map(customer => [
        customer,
        shipmentByCustomer[customer].count.toString(),
        shipmentByCustomer[customer].totalQty.toString(),
        shipmentByCustomer[customer].totalM2.toFixed(2)
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Musteri Adi', 'Sevkiyat Sayisi', 'Toplam Adet', 'Toplam M2']],
        body: customerData,
        theme: 'grid',
        headStyles: { 
          fillColor: [251, 146, 60],
          textColor: 255,
          fontSize: 10,
          halign: 'center'
        },
        styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
        columnStyles: {
          0: { halign: 'left', cellWidth: 80 }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = doc.lastAutoTable.finalY + 12;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Detayli Sevkiyat Listesi', 14, yPos);
      yPos += 7;

      const shipmentDetailData = filteredShipments.map(s => [
        s.date || '',
        s.customer || '',
        s.type || '',
        s.size || '',
        s.quantity?.toString() || '0',
        s.m2?.toFixed(2) || '0',
        s.waybill || '-',
        s.vehicle || '-'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Tarih', 'Musteri', 'Tip', 'Ebat', 'Adet', 'M2', 'Irsaliye', 'Arac']],
        body: shipmentDetailData,
        theme: 'striped',
        headStyles: { 
          fillColor: [100, 116, 139],
          fontSize: 8,
          halign: 'center'
        },
        styles: { fontSize: 7, cellPadding: 2, halign: 'center' },
        columnStyles: {
          0: { cellWidth: 20, halign: 'left' },
          1: { cellWidth: 32 },
          2: { cellWidth: 18 },
          3: { cellWidth: 35 },
          4: { cellWidth: 15 },
          5: { cellWidth: 15 },
          6: { cellWidth: 25 },
          7: { cellWidth: 22 }
        },
        margin: { left: 14, right: 14 }
      });

      // ===== SAYFA 4: GÜNCEL STOK DURUMU =====
      doc.addPage();
      yPos = 20;
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('4. GUNCEL STOK DURUMU', 14, yPos);
      
      yPos += 3;
      doc.setDrawColor(168, 85, 247);
      doc.line(14, yPos, 196, yPos);
      yPos += 10;

      const remainingStock = totalProduction - totalShipment;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${monthName} sonu itibariyle depodaki guncel stok durumu:`, 14, yPos);
      yPos += 15;

      const stockSummaryData = [
        ['Toplam Uretim', `${totalProduction} adet`, `${totalM2.toFixed(2)} m2`],
        ['Toplam Sevkiyat', `${totalShipment} adet`, `${totalShipmentM2.toFixed(2)} m2`],
        ['Kalan Stok', `${remainingStock} adet`, `${(totalM2 - totalShipmentM2).toFixed(2)} m2`]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Durum', 'Adet', 'M2']],
        body: stockSummaryData,
        theme: 'grid',
        headStyles: { 
          fillColor: [168, 85, 247],
          textColor: 255,
          fontSize: 11,
          halign: 'center'
        },
        styles: { fontSize: 10, cellPadding: 4, halign: 'center' },
        columnStyles: {
          0: { halign: 'left', cellWidth: 80, fontStyle: 'bold' },
          1: { cellWidth: 50 },
          2: { cellWidth: 50 }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = doc.lastAutoTable.finalY + 15;

      if (stockStats.data && Array.isArray(stockStats.data) && stockStats.data.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Stok Detaylari (Ebat Bazinda)', 14, yPos);
        yPos += 7;

        const stockDetailData = stockStats.data.slice(0, 30).map(stock => [
          stock.size || '',
          stock.color || '',
          stock.totalQuantity?.toString() || '0',
          stock.totalM2?.toFixed(2) || '0'
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Ebat', 'Renk', 'Adet', 'M2']],
          body: stockDetailData,
          theme: 'striped',
          headStyles: { 
            fillColor: [100, 116, 139],
            fontSize: 9,
            halign: 'center'
          },
          styles: { fontSize: 8, cellPadding: 2.5, halign: 'center' },
          columnStyles: {
            0: { cellWidth: 70, halign: 'left' },
            1: { cellWidth: 40 },
            2: { cellWidth: 35 },
            3: { cellWidth: 35 }
          },
          margin: { left: 14, right: 14 }
        });
      }

      // ===== SAYFA 5: DÖNEM SONU HAMMADDE DURUMU =====
      doc.addPage();
      yPos = 20;
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('5. DONEM SONU HAMMADDE DURUMU', 14, yPos);
      
      yPos += 3;
      doc.setDrawColor(234, 179, 8);
      doc.line(14, yPos, 196, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${monthName} sonu itibariyle hammadde stok durumu:`, 14, yPos);
      yPos += 15;

      const endMaterials = materials.data && materials.data.length > 0 ? materials.data[materials.data.length - 1] : null;
      
      if (endMaterials) {
        const endMaterialData = [
          ['PETKiM LDPE', `${parseFloat(endMaterials.petkim || 0).toFixed(2)} kg`],
          ['ESTOL', `${parseFloat(endMaterials.estol || 0).toFixed(2)} kg`],
          ['TALK', `${parseFloat(endMaterials.talk || 0).toFixed(2)} kg`],
          ['GAZ (N2)', `${parseFloat(endMaterials.gaz || 0).toFixed(2)} kg`],
          ['FiRE', `${parseFloat(endMaterials.fire || 0).toFixed(2)} kg`]
        ];

        autoTable(doc, {
          startY: yPos,
          head: [['Hammadde Adi', 'Kalan Miktar']],
          body: endMaterialData,
          theme: 'grid',
          headStyles: { 
            fillColor: [234, 179, 8],
            textColor: [30, 41, 59],
            fontSize: 11,
            halign: 'center',
            fontStyle: 'bold'
          },
          styles: { fontSize: 10, cellPadding: 4 },
          columnStyles: {
            0: { cellWidth: 100, halign: 'left' },
            1: { cellWidth: 80, halign: 'right', fontStyle: 'bold' }
          },
          margin: { left: 14, right: 14 }
        });

        yPos = doc.lastAutoTable.finalY + 15;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Donem Ozeti', 14, yPos);
      yPos += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const summaryLines = [
        `• Toplam ${filteredConsumptions.length} gun boyunca ${grandTotal.toFixed(2)} kg hammadde tuketilmistir.`,
        `• ${filteredProductions.length} uretim islemi ile ${totalProduction} adet urun (${totalM2.toFixed(2)} m2) uretilmistir.`,
        `• ${filteredShipments.length} sevkiyat ile ${totalShipment} adet urun (${totalShipmentM2.toFixed(2)} m2) musterilere gonderilmistir.`,
        `• Donem sonu depoda ${remainingStock} adet urun bulunmaktadir.`
      ];

      summaryLines.forEach(line => {
        doc.text(line, 14, yPos, { maxWidth: 180 });
        yPos += 7;
      });

      // Sayfa numaraları ekle
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        
        if (i === 1) {
          continue;
        }
        
        doc.text(
          `Sayfa ${i - 1} / ${pageCount - 1}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // PDF'i indir - jsPDF'in kendi metodunu kullan
      const monthNameFile = startDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }).replace(' ', '_');
      const fileName = `SAR_Ambalaj_${monthNameFile}_Raporu.pdf`;
      
      // Direkt indirme
      doc.save(fileName);

      toast({
        title: '✅ PDF Hazirlandi!',
        description: (
          <div className="space-y-2">
            <p className="font-semibold">{fileName}</p>
            <p className="text-sm">Tarayicinizin indirmeler klasorune kaydedildi.</p>
            <p className="text-xs">👉 Ctrl+J tusuna basarak indirmeler sayfasini acin.</p>
          </div>
        ),
        duration: 8000,
      });

    } catch (error) {
      console.error('PDF olusturma hatasi:', error);
      toast({
        title: 'Hata',
        description: error.message || 'Rapor olusturulamadi',
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
