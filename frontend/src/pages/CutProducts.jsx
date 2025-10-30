import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cutProductApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Trash2, Download, Scissors, Calculator } from 'lucide-react';
import * as XLSX from 'xlsx';

export const CutProducts = () => {
  const auth = useAuth();
  const [cutProducts, setCutProducts] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    // Ana Malzeme Ölçüleri
    sourceMaterialThickness: '', // mm
    sourceMaterialWidth: '', // cm (En)
    sourceMaterialLength: '', // m (Boy/Metre)
    sourceMaterialColor: 'Doğal',
    
    // Kesilecek Ebat
    cutThickness: '', // mm (Kalınlık)
    cutWidth: '', // cm (En/Boy)
    cutLength: '', // cm (Santim)
    cutQuantity: '', // İstenen adet
    
    // Otomatik hesaplananlar
    requiredSourcePieces: 0, // Kaç adet ana üründen kesilecek
    totalCutPieces: 0, // Toplam kesilen adet
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCutProducts();
  }, []);

  useEffect(() => {
    // Otomatik hesaplama
    calculateRequiredPieces();
  }, [
    formData.sourceMaterialWidth,
    formData.sourceMaterialLength,
    formData.cutWidth,
    formData.cutLength,
    formData.cutQuantity
  ]);

  const fetchCutProducts = async () => {
    try {
      const response = await cutProductApi.getAll();
      setCutProducts(response.data);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const calculateRequiredPieces = () => {
    const sourceWidth = parseFloat(formData.sourceMaterialWidth) || 0;
    const sourceLength = parseFloat(formData.sourceMaterialLength) * 100 || 0; // m → cm
    const cutWidth = parseFloat(formData.cutWidth) || 0;
    const cutLength = parseFloat(formData.cutLength) || 0;
    const requestedQuantity = parseInt(formData.cutQuantity) || 0;

    if (sourceWidth === 0 || sourceLength === 0 || cutWidth === 0 || cutLength === 0 || requestedQuantity === 0) {
      return;
    }

    // Bir ana rulo/yaprağından kaç adet kesilebilir?
    const piecesPerWidth = Math.floor(sourceWidth / cutWidth);
    const piecesPerLength = Math.floor(sourceLength / cutLength);
    const totalPiecesPerSource = piecesPerWidth * piecesPerLength;

    if (totalPiecesPerSource === 0) {
      setFormData(prev => ({
        ...prev,
        requiredSourcePieces: 0,
        totalCutPieces: 0
      }));
      return;
    }

    // Kaç adet ana malzeme gerekli?
    const requiredSources = Math.ceil(requestedQuantity / totalPiecesPerSource);
    const totalCut = requiredSources * totalPiecesPerSource;

    setFormData(prev => ({
      ...prev,
      requiredSourcePieces: requiredSources,
      totalCutPieces: totalCut
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.requiredSourcePieces === 0) {
      toast({
        title: 'Hata',
        description: 'Hesaplama yapılamadı. Lütfen tüm ölçüleri doğru girin.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Backend'e gönderilecek veri formatı
      const cutProductData = {
        date: formData.date,
        material: `${formData.sourceMaterialThickness}mm x ${formData.sourceMaterialWidth}cm x ${formData.sourceMaterialLength}m`,
        cutSize: `${formData.cutThickness}mm x ${formData.cutWidth}cm x ${formData.cutLength}cm`,
        quantity: formData.totalCutPieces,
        usedMaterial: `${formData.requiredSourcePieces} adet`,
        color: formData.sourceMaterialColor,
        colorCategory: formData.sourceMaterialColor,
      };

      await cutProductApi.create(cutProductData);
      toast({
        title: 'Başarılı',
        description: `${formData.requiredSourcePieces} adet ana malzemeden ${formData.totalCutPieces} adet ürün kesildi ve stoktan düşüldü.`,
      });
      fetchCutProducts();
      
      // Form reset
      setFormData({
        date: new Date().toISOString().split('T')[0],
        sourceMaterialThickness: '',
        sourceMaterialWidth: '',
        sourceMaterialLength: '',
        sourceMaterialColor: 'Doğal',
        cutThickness: '',
        cutWidth: '',
        cutLength: '',
        cutQuantity: '',
        requiredSourcePieces: 0,
        totalCutPieces: 0,
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Kesilmiş ürün kaydı eklenirken hata oluştu',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu kaydı silmek istediğinizden emin misiniz? Ana malzeme stoku geri eklenecektir.')) {
      try {
        await cutProductApi.delete(id);
        toast({
          title: 'Başarılı',
          description: 'Kesilmiş ürün kaydı silindi ve ana malzeme stoku geri eklendi.',
        });
        fetchCutProducts();
      } catch (error) {
        toast({
          title: 'Hata',
          description: 'Silme işlemi başarısız',
          variant: 'destructive',
        });
      }
    }
  };

  const exportToExcel = () => {
    const exportData = cutProducts.map(item => ({
      'Tarih': item.date,
      'Ana Malzeme': item.material,
      'Kesim Boyutu': item.cutSize,
      'Kesilen Adet': item.quantity,
      'Kullanılan Malzeme': item.usedMaterial,
      'Renk': item.color
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kesilmiş Ürünler');
    XLSX.writeFile(wb, `kesilmis-urunler-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6" data-testid="cut-products-page">
      <div>
        <h1 className="text-3xl font-bold text-white">Kesilmiş Ürün (Ebatlama)</h1>
        <p className="text-slate-400 mt-1">
          {auth.isViewer() ? 'Ebatlama kayıtlarını görüntüleyin' : 'Otomatik hesaplama ile ebatlama işlemleri'}
        </p>
      </div>

      {/* Form - Sadece Admin */}
      {auth.canAdd() && (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Otomatik Ebatlama Hesaplama
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tarih */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Tarih</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  required
                />
              </div>
            </div>

            {/* ANA MALZEME ÖLÇÜLERİ */}
            <div className="border border-blue-500/30 rounded-lg p-4 bg-blue-500/5">
              <h3 className="text-blue-400 font-semibold mb-4 flex items-center gap-2">
                📦 Ana Malzeme Ölçüleri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Kalınlık (mm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.sourceMaterialThickness}
                    onChange={(e) => setFormData({ ...formData, sourceMaterialThickness: e.target.value })}
                    placeholder="1.8"
                    className="bg-slate-800/50 border-slate-700 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">En (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.sourceMaterialWidth}
                    onChange={(e) => setFormData({ ...formData, sourceMaterialWidth: e.target.value })}
                    placeholder="100"
                    className="bg-slate-800/50 border-slate-700 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Boy / Metre (m)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.sourceMaterialLength}
                    onChange={(e) => setFormData({ ...formData, sourceMaterialLength: e.target.value })}
                    placeholder="300"
                    className="bg-slate-800/50 border-slate-700 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Renk</Label>
                  <Select
                    value={formData.sourceMaterialColor}
                    onValueChange={(value) => setFormData({ ...formData, sourceMaterialColor: value })}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Doğal">Doğal</SelectItem>
                      <SelectItem value="Sarı">Sarı</SelectItem>
                      <SelectItem value="Siyah">Siyah</SelectItem>
                      <SelectItem value="Mavi">Mavi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* KESİLECEK EBAT */}
            <div className="border border-emerald-500/30 rounded-lg p-4 bg-emerald-500/5">
              <h3 className="text-emerald-400 font-semibold mb-4 flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Kesilecek Ebat Ölçüleri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Kalınlık (mm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.cutThickness}
                    onChange={(e) => setFormData({ ...formData, cutThickness: e.target.value })}
                    placeholder="1.8"
                    className="bg-slate-800/50 border-slate-700 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">En / Boy (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.cutWidth}
                    onChange={(e) => setFormData({ ...formData, cutWidth: e.target.value })}
                    placeholder="50"
                    className="bg-slate-800/50 border-slate-700 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Uzunluk (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.cutLength}
                    onChange={(e) => setFormData({ ...formData, cutLength: e.target.value })}
                    placeholder="137.5"
                    className="bg-slate-800/50 border-slate-700 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">İstenen Adet</Label>
                  <Input
                    type="number"
                    value={formData.cutQuantity}
                    onChange={(e) => setFormData({ ...formData, cutQuantity: e.target.value })}
                    placeholder="1744"
                    className="bg-slate-800/50 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* HESAPLAMA SONUÇLARI */}
            {formData.requiredSourcePieces > 0 && (
              <div className="border border-yellow-500/30 rounded-lg p-4 bg-yellow-500/5">
                <h3 className="text-yellow-400 font-semibold mb-4 flex items-center gap-2">
                  🧮 Hesaplama Sonuçları
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <div className="text-slate-400 text-sm">Kullanılacak Ana Malzeme</div>
                    <div className="text-3xl font-bold text-orange-400 mt-1">
                      {formData.requiredSourcePieces} <span className="text-sm text-slate-400">adet</span>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <div className="text-slate-400 text-sm">Toplam Kesilen Ürün</div>
                    <div className="text-3xl font-bold text-emerald-400 mt-1">
                      {formData.totalCutPieces} <span className="text-sm text-slate-400">adet</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-sm text-slate-400 bg-slate-800/30 p-3 rounded">
                  💡 <span className="font-semibold">{formData.requiredSourcePieces} adet</span> ana malzeme stoktan düşülecek, 
                  <span className="font-semibold"> {formData.totalCutPieces} adet</span> kesilmiş ürün stoğa eklenecek.
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6"
              data-testid="submit-cut-product-btn"
              disabled={formData.requiredSourcePieces === 0}
            >
              <Scissors className="h-5 w-5 mr-2" />
              Kesim İşlemini Kaydet ve Stoktan Düş
            </Button>
          </form>
        </CardContent>
      </Card>
      )}

      {/* Cut Products List */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Kesilmiş Ürün Kayıtları</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToExcel}
              className="bg-emerald-600 hover:bg-emerald-700 border-0 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Excel'e Aktar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-slate-800/50">
                  <TableHead className="text-slate-300">Tarih</TableHead>
                  <TableHead className="text-slate-300">Ana Malzeme</TableHead>
                  <TableHead className="text-slate-300">Kesilecek Ebat</TableHead>
                  <TableHead className="text-slate-300">Kesilen Adet</TableHead>
                  <TableHead className="text-slate-300">Kullanılan Malzeme</TableHead>
                  <TableHead className="text-slate-300">Renk</TableHead>
                  {auth.canDelete() && <TableHead className="text-slate-300">İşlemler</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cutProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                      Henüz kesilmiş ürün kaydı yok
                    </TableCell>
                  </TableRow>
                ) : (
                  cutProducts.map((cut) => (
                    <TableRow key={cut.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="text-slate-300">{cut.date}</TableCell>
                      <TableCell className="text-blue-400 font-semibold">{cut.material}</TableCell>
                      <TableCell className="text-slate-300">{cut.cutSize}</TableCell>
                      <TableCell className="text-emerald-400 font-semibold text-lg">{cut.quantity}</TableCell>
                      <TableCell className="text-orange-400">{cut.usedMaterial}</TableCell>
                      <TableCell className="text-slate-300">{cut.color}</TableCell>
                      {auth.canDelete() && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cut.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            data-testid={`delete-cut-${cut.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
