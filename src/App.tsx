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
import TallerDashboard from "./pages/TallerDashboard";
import TallerPendiente from "./pages/TallerPendiente";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

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
            <Route
              path="/vendedor"
              element={
                <ProtectedRoute allowedRoles={["vendedor"]}>
                  <VendedorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/taller"
              element={
                <ProtectedRoute allowedRoles={["taller"]}>
                  <TallerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
