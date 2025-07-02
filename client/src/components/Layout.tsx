import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DiffusedLight } from './DiffusedLight';
import { 
  Home, 
  FileText, 
  Database, 
  BarChart3, 
  LogOut, 
  Menu,
  Shield,
  Users,
  Settings
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Gestione File', href: '/files', icon: FileText },
  { name: 'Salva Dati', href: '/save-data', icon: Database },
  { name: 'Statistiche', href: '/stats', icon: BarChart3 },
  { 
    name: 'Gestione Utenti', 
    href: '/users', 
    icon: Users,
    requiredRoles: ['admin'],
    requiredPermissions: ['user_management']
  },
  { 
    name: 'Pannello Admin', 
    href: '/admin', 
    icon: Shield,
    requiredRoles: ['admin']
  },
  { name: 'Impostazioni', href: '/settings', icon: Settings },
];

const NavContent: React.FC = () => {
  const { hasRole, hasPermission } = useAuth();
  
  const isNavItemVisible = (item: NavigationItem) => {
    // If no role or permission requirements, show to all authenticated users
    if (!item.requiredRoles && !item.requiredPermissions) {
      return true;
    }
    
    // Check role requirements
    if (item.requiredRoles) {
      const hasRequiredRole = item.requiredRoles.some((role: string) => hasRole(role));
      if (!hasRequiredRole) return false;
    }
    
    // Check permission requirements
    if (item.requiredPermissions) {
      const hasRequiredPermission = item.requiredPermissions.some((permission: string) => hasPermission(permission));
      if (!hasRequiredPermission) return false;
    }
    
    return true;
  };

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navigation.filter(isNavItemVisible).map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              isActive && "bg-muted text-primary"
            )
          }
        >
          <item.icon className="h-4 w-4" />
          {item.name}
        </NavLink>
      ))}
    </nav>
  );
};

const UserMenu: React.FC = () => {
  const { logout, user } = useAuth();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full">
          <Avatar>
            <AvatarFallback>
              {(() => {
                if (typeof user?.name === 'string' && user.name.length > 0) {
                  return user.name.charAt(0).toUpperCase();
                }
                if (user?.firstName && typeof user.firstName === 'string') {
                  return user.firstName.charAt(0).toUpperCase();
                }
                return 'U';
              })()}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {typeof user?.name === 'string' ? user.name : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Utente'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const DesktopSidebar: React.FC = () => (
  <div className="hidden md:block glass-nav">
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center px-4 lg:h-[60px] lg:px-6">
        <NavLink to="/" className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors">
          <img src="/logo.png" alt="Vicsam Group Logo" className="h-6 w-6" />
          <span className="text-xl">Vicsam Group</span>
        </NavLink>
      </div>
      <div className="flex-1 custom-scrollbar">
        <NavContent />
      </div>
    </div>
  </div>
);

const MobileSidebar: React.FC = () => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="outline" size="icon" className="shrink-0 md:hidden">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation menu</span>
      </Button>
    </SheetTrigger>
    <SheetContent side="left" className="flex flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <NavLink to="/" className="flex items-center gap-2 font-semibold">
          <Shield className="h-6 w-6" />
          <span>Vicsam Group</span>
        </NavLink>
      </div>
      <NavContent />
    </SheetContent>
  </Sheet>
);

export const Layout: React.FC = () => {
  const location = useLocation();
  const pageTitle = navigation.find(item => item.href === location.pathname)?.name || 'Dashboard';

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] relative overflow-hidden">
      {/* Background diffused light for entire layout */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 diffused-light-enhanced"
          style={{
            background: `radial-gradient(
              ellipse 300% 200% at 30% 40%,
              hsl(var(--primary) / 0.01) 0%,
              hsl(var(--primary) / 0.008) 20%,
              hsl(var(--accent) / 0.006) 40%,
              hsl(var(--secondary) / 0.004) 60%,
              transparent 80%
            )`
          }}
        />
      </div>
      
      <DesktopSidebar />
      <div className="flex flex-col relative z-10 min-h-0">
        <header className="flex h-14 items-center gap-4 glass-header px-4 lg:h-[60px] lg:px-6 flex-shrink-0">
          <MobileSidebar />
          <div className="w-full flex-1 min-w-0">
            <h1 className="text-lg font-semibold md:text-xl text-foreground truncate">{pageTitle}</h1>
          </div>
          <UserMenu />
        </header>
        <main className="flex flex-1 flex-col relative min-h-0">
          <DiffusedLight intensity={3}>
            <Outlet />
          </DiffusedLight>
        </main>
      </div>
    </div>
  );
};
