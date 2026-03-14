import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import RegistroVendedor from "./pages/RegistroVendedor";
import RegistroTaller from "./pages/RegistroTaller";
import ResetPassword from "./pages/ResetPassword";
import VendedorDashboard from "./pages/VendedorDashboard";
import VendedorFichaPage from "./pages/VendedorFichaPage";
import VendedorCuentaPage from "./pages/VendedorCuentaPage";
import VendedorAnalisisPrecioPage from "./pages/VendedorAnalisisPrecioPage";
import TallerDashboard from "./pages/TallerDashboard";
import TallerPendiente from "./pages/TallerPendiente";
import AdminDashboard from "./pages/AdminDashboard";
import VehiculoPublico from "./pages/VehiculoPublico";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLayout from "@/components/admin/AdminLayout";
import AdminSolicitudDetalle from "./pages/admin/AdminSolicitudDetalle";
import AdminTalleres from "./pages/admin/AdminTalleres";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminCuenta from "./pages/admin/AdminCuenta";

// Taller pages
import TallerLayout from "@/components/taller/TallerLayout";
import TallerEncargoDetalle from "./pages/taller/TallerEncargoDetalle";
import TallerPerfil from "./pages/taller/TallerPerfil";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro/vendedor" element={<RegistroVendedor />} />
            <Route path="/registro/taller" element={<RegistroTaller />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/taller/pendiente" element={<TallerPendiente />} />
            <Route path="/vehiculo/:slug" element={<VehiculoPublico />} />

            {/* Vendedor */}
            <Route path="/vendedor" element={<ProtectedRoute allowedRoles={["vendedor"]}><VendedorDashboard /></ProtectedRoute>} />
            <Route path="/vendedor/ficha" element={<ProtectedRoute allowedRoles={["vendedor"]}><VendedorFichaPage /></ProtectedRoute>} />
            <Route path="/vendedor/precio" element={<ProtectedRoute allowedRoles={["vendedor"]}><VendedorAnalisisPrecioPage /></ProtectedRoute>} />
            <Route path="/vendedor/cuenta" element={<ProtectedRoute allowedRoles={["vendedor"]}><VendedorCuentaPage /></ProtectedRoute>} />

            {/* Taller */}
            <Route path="/taller" element={<ProtectedRoute allowedRoles={["taller"]}><TallerDashboard /></ProtectedRoute>} />
            <Route path="/taller/encargo/:id" element={<ProtectedRoute allowedRoles={["taller"]}><TallerLayout><TallerEncargoDetalle /></TallerLayout></ProtectedRoute>} />
            <Route path="/taller/perfil" element={<ProtectedRoute allowedRoles={["taller"]}><TallerLayout><TallerPerfil /></TallerLayout></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/solicitud/:id" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout><AdminSolicitudDetalle /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/talleres" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout><AdminTalleres /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/usuarios" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout><AdminUsuarios /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/cuenta" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout><AdminCuenta /></AdminLayout></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
