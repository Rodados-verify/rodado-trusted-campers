import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Building2, Users, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { label: "Solicitudes", path: "/admin", icon: FileText },
  { label: "Talleres", path: "/admin/talleres", icon: Building2 },
  { label: "Usuarios", path: "/admin/usuarios", icon: Users },
  { label: "Mi cuenta", path: "/admin/cuenta", icon: User },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin" || location.pathname.startsWith("/admin/solicitud/");
    return location.pathname.startsWith(path);
  };

  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur">
          <Link to="/" className="font-display text-xl font-bold text-forest">Rodado</Link>
          <button onClick={signOut} className="text-muted-foreground"><LogOut className="h-5 w-5" /></button>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">{children}</main>
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-border bg-background/95 backdrop-blur">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} className={cn("flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors", active ? "text-forest" : "text-muted-foreground")}>
                <item.icon className={cn("h-5 w-5", active && "stroke-[2.5px]")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-forest text-white">
        <div className="flex h-16 items-center px-6">
          <Link to="/" className="font-display text-xl font-bold text-white">Rodado</Link>
          <span className="ml-2 rounded bg-white/20 px-2 py-0.5 text-xs font-medium">Admin</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white")}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-4 py-4">
          <p className="truncate text-sm text-white/70">{user?.email}</p>
          <button onClick={signOut} className="mt-2 flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white">
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="ml-64 flex-1 p-8 lg:p-12">{children}</main>
    </div>
  );
};

export default AdminLayout;
