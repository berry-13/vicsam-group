import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Home, 
  FileText, 
  Database, 
  BarChart3, 
  LogOut, 
  Menu,
  Shield
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

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Gestione File', href: '/files', icon: FileText },
  { name: 'Salva Dati', href: '/save-data', icon: Database },
  { name: 'Statistiche', href: '/stats', icon: BarChart3 },
];

const NavContent: React.FC = () => {
  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navigation.map((item) => (
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
  const { logout } = useAuth();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full">
          <Avatar>
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Admin</DropdownMenuLabel>
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
  <div className="hidden border-r bg-muted/40 md:block">
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <NavLink to="/" className="flex items-center gap-2 font-semibold">
          <Shield className="h-6 w-6" />
          <span className="">Vicsam Group</span>
        </NavLink>
      </div>
      <div className="flex-1">
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
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <DesktopSidebar />
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <MobileSidebar />
          <div className="w-full flex-1">
            <h1 className="text-lg font-semibold md:text-xl">{pageTitle}</h1>
          </div>
          <UserMenu />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
