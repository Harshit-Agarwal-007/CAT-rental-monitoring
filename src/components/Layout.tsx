import React from 'react';
import { 
  Home, 
  Wrench, 
  MapPin, 
  TrendingUp, 
  BarChart3, 
  AlertTriangle,
  Truck
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'service', label: 'Service', icon: Wrench },
    { id: 'gps', label: 'GPS Tracking', icon: MapPin },
    { id: 'forecasting', label: 'Forecasting', icon: TrendingUp },
    { id: 'usage', label: 'Usage', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-yellow-400 shadow-lg border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Truck className="h-8 w-8 text-black" />
              <h1 className="text-2xl font-bold text-black">CAT Rental Monitor</h1>
            </div>
            <div className="text-black font-semibold">
              Equipment Management System
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-black shadow-lg min-h-screen">
          <div className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onPageChange(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        currentPage === item.id
                          ? 'bg-yellow-400 text-black font-semibold'
                          : 'text-white hover:bg-gray-800 hover:text-yellow-400'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;