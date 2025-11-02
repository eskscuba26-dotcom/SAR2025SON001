import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { shipmentApi, productionApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Trash2, Download, Filter, Edit2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export const Shipment = () => {
  const auth = useAuth();
  const [shipments, setShipments] = useState([]);
  const [productions, setProductions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    customer: '',
    type: 'Normal',
    thickness: '',
    width: '',
    length: '',
    size: '',
    m2: 0,
    quantity: '',
    color: 'Doğal',
    waybill: '',
    vehicle: '',
    driver: '',
    exitTime: '',
  });
  const { toast } = useToast();

  // Otomatik m² hesaplama
  useEffect(() => {
    const width = parseFloat(formData.width) || 0;
    const length = parseFloat(formData.length) || 0;
    const quantity = parseFloat(formData.quantity) || 0;
    
    if (width > 0 && length > 0 && quantity > 0) {
      // En (cm) x Metre (m) = m² per piece
      const m2PerPiece = (width * length) / 100;
      const totalM2 = m2PerPiece * quantity;
      
      // Size'ı otomatik oluştur
      const thickness = formData.thickness || '';
      const sizeStr = thickness ? `${thickness}mm x ${width}cm x ${length}m` : `${width}cm x ${length}m`;
      
      setFormData(prev => ({ 
        ...prev, 
        m2: parseFloat(totalM2.toFixed(2)),
        size: sizeStr
      }));
    }
  }, [formData.thickness, formData.width, formData.length, formData.quantity]);

  useEffect(() => {
    fetchShipments();
    fetchProductions();
  }, []);

  const fetchShipments = async () => {
    try {
      const response = await shipmentApi.getAll();
      setShipments(response.data);
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
      if (editingId) {
        // Güncelleme
        await shipmentApi.update(editingId, formData);
        toast({
          title: 'Başarılı',
          description: 'Sevkiyat kaydı güncellendi',
        });
        setEditingId(null);
      } else {
        // Yeni kayıt
        await shipmentApi.create(formData);
        toast({
          title: 'Başarılı',
          description: 'Sevkiyat kaydı eklendi',
        });
      }
      fetchShipments();
      resetForm();
    } catch (error) {
      toast({
        title: 'Hata',
        description: editingId ? 'Güncelleme başarısız' : 'Sevkiyat kaydı eklenirken hata oluştu',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      customer: '',
      type: 'Normal',
      thickness: '',
      width: '',
      length: '',
      size: '',
      m2: 0,
      quantity: '',
      color: 'Doğal',
      waybill: '',
      vehicle: '',
      driver: '',
      exitTime: '',
    });
    setEditingId(null);
  };

  const handleEdit = (shipment) => {
    setEditingId(shipment.id);
    
    // Size'dan thickness, width, length'i parse et
    const sizeParts = (shipment.size || '').split(' x ');
    let thickness = '', width = '', length = '';
    
    if (sizeParts.length >= 3) {
      thickness = sizeParts[0].replace('mm', '').trim();
      width = sizeParts[1].replace('cm', '').trim();
      length = sizeParts[2].replace('m', '').trim();
    } else if (sizeParts.length === 2) {
      width = sizeParts[0].replace('cm', '').trim();
      length = sizeParts[1].replace('m', '').trim();
    }
    
    setFormData({
      date: shipment.date || new Date().toISOString().split('T')[0],
      customer: shipment.customer || '',
      type: shipment.type || 'Normal',
      thickness: thickness,
      width: width,
      length: length,
      size: shipment.size || '',
      m2: shipment.m2 || 0,
      quantity: String(shipment.quantity || ''),
      color: shipment.color || 'Doğal',
      waybill: shipment.waybill || '',
      vehicle: shipment.vehicle || '',
      driver: shipment.driver || '',
      exitTime: shipment.exitTime || '',
    });
    
    // Formu görünür yap
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
      try {
        await shipmentApi.delete(id);
        toast({
          title: 'Başarılı',
          description: 'Sevkiyat kaydı silindi',
        });
        fetchShipments();
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
    const exportData = filteredShipments.map(item => ({
      'Tarih': item.date,
      'Müşteri': item.customer,
      'Tip': item.type,
      'Boyut': item.size,
      'M²': item.m2,
      'Adet': item.quantity,
      'Renk': item.color,
      'İrsaliye No': item.waybillNo
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sevkiyat');
    XLSX.writeFile(wb, `sevkiyat-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6" data-testid="shipment-page">
      <div>
        <h1 className="text-3xl font-bold text-white">Sevkiyat</h1>
        <p className="text-slate-400 mt-1">
          {auth.isViewer() ? 'Sevkiyat kayıtlarını görüntüleyin' : 'Yeni sevkiyat kaydı oluşturun'}
        </p>
      </div>

      {/* Form - Sadece Admin */}
      {auth.canAdd() && (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Sevkiyat Girişi</CardTitle>
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
                <Label className="text-slate-200">Alıcı Firma</Label>
                <Input
                  type="text"
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  placeholder="Firma adı"
                  className="bg-slate-800/50 border-slate-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Ürün Tipi</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal Ürün</SelectItem>
                    <SelectItem value="Kesilmiş">Kesilmiş Ürün</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Kalınlık (mm)</Label>
                <Input
                  type="text"
                  placeholder="Örn: 2mm"
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">En (cm)</Label>
                <Input
                  type="number"
                  placeholder="100"
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Metre</Label>
                <Input
                  type="number"
                  placeholder="300"
                  onChange={(e) => {
                    const metre = parseFloat(e.target.value) || 0;
                    const quantity = parseFloat(formData.quantity) || 0;
                    const en = 100; // Varsayılan
                    const m2 = ((en * metre * quantity) / 10000).toFixed(2);
                    setFormData({ ...formData, m2: parseFloat(m2) });
                  }}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Metrekare (Otomatik)</Label>
                <Input
                  type="number"
                  value={formData.m2}
                  readOnly
                  className="bg-slate-800/50 border-slate-700 text-emerald-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Adet</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
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

              <div className="space-y-2">
                <Label className="text-slate-200">İrsaliye Numarası</Label>
                <Input
                  type="text"
                  value={formData.waybill}
                  onChange={(e) => setFormData({ ...formData, waybill: e.target.value })}
                  placeholder="OZI2025000000XX"
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Araç Plakası</Label>
                <Input
                  type="text"
                  value={formData.vehicle}
                  onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                  placeholder="34 ABC 123"
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Şeför</Label>
                <Input
                  type="text"
                  value={formData.driver}
                  onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                  placeholder="Şeför adı"
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Çıkış Saati</Label>
                <Input
                  type="time"
                  value={formData.exitTime}
                  onChange={(e) => setFormData({ ...formData, exitTime: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              data-testid="submit-shipment-btn"
            >
              Sevkiyat Kaydı Ekle
            </Button>
          </form>
        </CardContent>
      </Card>
      )}

      {/* Shipment List */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Sevkiyat Kayıtları</CardTitle>
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
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-white"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtreleri Göster
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-slate-800/50">
                  <TableHead className="text-slate-300">Tarih</TableHead>
                  <TableHead className="text-slate-300">Alıcı</TableHead>
                  <TableHead className="text-slate-300">Tip</TableHead>
                  <TableHead className="text-slate-300">Ebat</TableHead>
                  <TableHead className="text-slate-300">m²</TableHead>
                  <TableHead className="text-slate-300">Adet</TableHead>
                  <TableHead className="text-slate-300">Renk</TableHead>
                  <TableHead className="text-slate-300">İrsaliye</TableHead>
                  {auth.canEdit() && <TableHead className="text-slate-300">İşlemler</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-slate-400 py-8">
                      Henüz sevkiyat kaydı bulunmuyor
                    </TableCell>
                  </TableRow>
                ) : (
                  shipments.map((ship) => (
                    <TableRow key={ship.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="text-slate-300">{ship.date}</TableCell>
                      <TableCell className="text-slate-300">{ship.customer}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          ship.type === 'Normal' 
                            ? 'bg-emerald-600/20 text-emerald-400' 
                            : 'bg-orange-600/20 text-orange-400'
                        }`}>
                          {ship.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-300">{ship.size}</TableCell>
                      <TableCell className="text-emerald-400 font-semibold">{ship.m2}</TableCell>
                      <TableCell className="text-slate-300">{ship.quantity}</TableCell>
                      <TableCell className="text-slate-300">{ship.color}</TableCell>
                      <TableCell className="text-blue-400">{ship.waybill}</TableCell>
                      {auth.canDelete() && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(ship.id)}
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
    </div>
  );
};