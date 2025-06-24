import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Home, 
  FileText, 
  Database, 
  BarChart3, 
  LogOut, 
  Menu, 
  X,
  Shield
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Gestione File', href: '/files', icon: FileText },
  { name: 'Salva Dati', href: '/save-data', icon: Database },
  { name: 'Statistiche', href: '/stats', icon: BarChart3 },
];

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, user } = useAuth();
  const location = useLocation();

  const getCurrentPageName = () => {
    const currentNav = navigation.find(item => item.href === location.pathname);
    return currentNav?.name || 'Dashboard';
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <MobileSidebar navigation={navigation} logout={logout} user={user} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <DesktopSidebar navigation={navigation} logout={logout} user={user} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white shadow">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-medium text-gray-900">{getCurrentPageName()}</h1>
            <div></div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

interface SidebarProps {
  navigation: typeof navigation;
  logout: () => void;
  user: { bearerToken: string } | null;
}

const DesktopSidebar: React.FC<SidebarProps> = ({ navigation, logout, user }) => (
  <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
    <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center flex-shrink-0 px-4 mb-6">
        <div className="flex items-center">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div className="ml-3">
            <h2 className="text-lg font-semibold text-gray-900">VicSam Group</h2>
            <p className="text-sm text-gray-500">API Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-5 flex-1 px-2 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>

    {/* User section */}
    <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
      <div className="flex items-center w-full">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            Autenticato
          </p>
          <p className="text-xs text-gray-500 truncate">
            Token: {user?.bearerToken.substring(0, 12)}...
          </p>
        </div>
        <button
          onClick={logout}
          className="ml-3 flex-shrink-0 inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <LogOut className="h-3 w-3 mr-1" />
          Logout
        </button>
      </div>
    </div>
  </div>
);

const MobileSidebar: React.FC<SidebarProps> = ({ navigation, logout, user }) => (
  <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
    {/* Logo */}
    <div className="flex items-center flex-shrink-0 px-4 mb-6">
      <div className="flex items-center">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div className="ml-3">
          <h2 className="text-lg font-semibold text-gray-900">VicSam Group</h2>
          <p className="text-sm text-gray-500">API Management</p>
        </div>
      </div>
    </div>

    {/* Navigation */}
    <nav className="mt-5 px-2 space-y-1">
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            `group flex items-center px-2 py-2 text-base font-medium rounded-md ${
              isActive
                ? 'bg-blue-100 text-blue-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <item.icon className="mr-4 h-6 w-6" />
          {item.name}
        </NavLink>
      ))}
    </nav>

    {/* User section */}
    <div className="mt-6 pt-6 border-t border-gray-200 px-4">
      <div className="flex items-center">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            Autenticato
          </p>
          <p className="text-xs text-gray-500 truncate">
            Token: {user?.bearerToken.substring(0, 12)}...
          </p>
        </div>
        <button
          onClick={logout}
          className="ml-3 inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
        >
          <LogOut className="h-3 w-3 mr-1" />
          Logout
        </button>
      </div>
    </div>
  </div>
);
