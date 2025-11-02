import { useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Production } from "@/pages/Production";
import { CutProducts } from "@/pages/CutProducts";
import { Shipment } from "@/pages/Shipment";
import { StockView } from "@/pages/StockView";
import { Materials } from "@/pages/Materials";
import { DailyConsumption } from "@/pages/DailyConsumption";
import { CostAnalysis } from "@/pages/CostAnalysis";
import { ExchangeRates } from "@/pages/ExchangeRates";
import { Users } from "@/pages/Users";
import { ManualCostCalculator } from "@/pages/ManualCostCalculator";
import { ExcelViewer } from "@/pages/ExcelViewer";
import { Reporting } from "@/pages/Reporting";
import { useToast } from "@/hooks/use-toast";
import logoImage from "./logo.png";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(username, password);
    if (result.success) {
      toast({
        title: "Başarılı",
        description: "Giriş yapıldı, yönlendiriliyorsunuz...",
      });
    } else {
      toast({
        title: "Hata",
        description: result.error || "Giriş başarısız",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="flex flex-col p-6 space-y-4">
          <div className="flex justify-center">
            <img
              alt="SAR Ambalaj"
              className="h-24 w-24 object-contain"
              src={logoImage}
            />
          </div>
          <div className="text-center">
            <div
              className="font-semibold tracking-tight text-2xl text-white"
              style={{ fontFamily: '"Space Grotesk", sans-serif' }}
            >
              SAR Ambalaj
            </div>
            <div className="text-sm text-slate-400 mt-2">
              Üretim Yönetim Sistemine Giriş
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-sm font-medium leading-none text-slate-200"
              >
                Kullanıcı Adı
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Kullanıcı adınızı girin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-slate-800/50 border-slate-700 text-white"
                data-testid="username-input"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium leading-none text-slate-200"
              >
                Şifre
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifrenizi girin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-800/50 border-slate-700 text-white pr-10"
                  data-testid="password-input"
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="toggle-password-btn"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              data-testid="login-submit-btn"
            >
              Giriş Yap
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Yükleniyor...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/production" element={<ProtectedRoute><Production /></ProtectedRoute>} />
      <Route path="/cut-products" element={<ProtectedRoute><CutProducts /></ProtectedRoute>} />
      <Route path="/shipment" element={<ProtectedRoute><Shipment /></ProtectedRoute>} />
      <Route path="/stock" element={<ProtectedRoute><StockView /></ProtectedRoute>} />
      <Route path="/materials" element={<ProtectedRoute><Materials /></ProtectedRoute>} />
      <Route path="/daily-consumption" element={<ProtectedRoute><DailyConsumption /></ProtectedRoute>} />
      <Route path="/cost-analysis" element={<ProtectedRoute><CostAnalysis /></ProtectedRoute>} />
      <Route path="/manual-cost-calculator" element={<ProtectedRoute><ManualCostCalculator /></ProtectedRoute>} />
      <Route path="/exchange-rates" element={<ProtectedRoute><ExchangeRates /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/reporting" element={<ProtectedRoute><Reporting /></ProtectedRoute>} />
      <Route path="/excel-viewer" element={<ProtectedRoute><ExcelViewer /></ProtectedRoute>} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;
