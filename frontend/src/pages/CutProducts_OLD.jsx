import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cutProductApi, productionApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Trash2, Download, Scissors } from 'lucide-react';
import * as XLSX from 'xlsx';

export const CutProducts = () => {
  const auth = useAuth();
  const [cutProducts, setCutProducts] = useState([]);
  const [productions, setProductions] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    material: '',
    cutSize: '',
    quantity: '',
    usedMaterial: '',
    color: 'Doğal',
    cutWidth: '',
    cutLength: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCutProducts();
    fetchProductions();
  }, []);

  const fetchCutProducts = async () => {
    try {
      const response = await cutProductApi.getAll();
      setCutProducts(response.data);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const fetchProductions = async () => {
    try {
      const response = await productionApi.getAll();
      setProductions(response.data);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await cutProductApi.create(formData);
      toast({
        title: 'Başarılı',
        description: 'Kesilmiş ürün kaydı eklendi',
      });
      fetchCutProducts();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        material: '',
        cutSize: '',
        quantity: '',
        usedMaterial: '',
        color: 'Doğal',
        cutWidth: '',
        cutLength: '',
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
    if (window.confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
      try {
        await cutProductApi.delete(id);
        toast({
          title: 'Başarılı',
          description: 'Kesilmiş ürün kaydı silindi',
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
      'Orijinal Malzeme': item.originalMaterial || item.material,
      'Kesim Boyutu': item.cutSize,
      'Adet': item.quantity,
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
        <h1 className="text-3xl font-bold text-white">Kesilmiş Ürün</h1>
        <p className="text-slate-400 mt-1">
          {auth.isViewer() ? 'Ebatlama kayıtlarını görüntüleyin' : 'Ebatlama işlemlerini yönetin'}
        </p>
      </div>

      {/* Form - Sadece Admin */}
      {auth.canAdd() && (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Kesilmiş Ürün Kaydı Ekle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

              <div className="space-y-2">
                <Label className="text-slate-200">Ana Malzeme</Label>
                <Input
                  type="text"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  placeholder="Örn: 1.8mm x 100cm x 300m"
                  className="bg-slate-800/50 border-slate-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Kesilecek Ebat</Label>
                <Input
                  type="text"
                  value={formData.cutSize}
                  onChange={(e) => setFormData({ ...formData, cutSize: e.target.value })}
                  placeholder="Örn: 1.8mm x 50cm x 137.5cm"
                  className="bg-slate-800/50 border-slate-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Kesilen Adet</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="1744"
                  className="bg-slate-800/50 border-slate-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Kullanılan Malzeme</Label>
                <Input
                  type="text"
                  value={formData.usedMaterial}
                  onChange={(e) => setFormData({ ...formData, usedMaterial: e.target.value })}
                  placeholder="Örn: 4 adet"
                  className="bg-slate-800/50 border-slate-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Renk</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData({ ...formData, color: value })}
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

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              data-testid="submit-cut-product-btn"
            >
              <Scissors className="h-4 w-4 mr-2" />
              Kesilmiş Ürün Kaydı Ekle
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
                      Henüz kesilmiş ürün kaydı bulunmuyor
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
                            className="text-red-400 hover:text-red-300 hover:bg-slate-800"
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

      {/* Info Card */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <p className="text-slate-400 text-sm">
            💡 <strong>Bilgi:</strong> Ana malzemeden kesilmiş ürünler burada takip edilir. 
            Kesilen parça sayısı ve kullanılan ana malzeme miktarı otomatik olarak stoktan düşer.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};