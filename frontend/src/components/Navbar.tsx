import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Shield, MapPin, ShoppingBag } from 'lucide-react';

interface NavbarProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenGuestOtp: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLogin,
  onOpenRegister,
  onOpenGuestOtp,
  activeTab,
  setActiveTab,
}) => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-8">
          <button
            onClick={() => setActiveTab('home')}
            className="text-2xl font-bold tracking-wider text-stone-900 font-serif"
          >
            THIERLAVIER
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-6 text-sm font-medium text-stone-600">
            <button
              onClick={() => setActiveTab('home')}
              className={`hover:text-amber-800 transition ${activeTab === 'home' ? 'text-amber-800 font-semibold border-b-2 border-amber-800 pb-1' : ''}`}
            >
              Cửa Hàng
            </button>

            {isAuthenticated && (
              <>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-1 hover:text-amber-800 transition ${activeTab === 'profile' ? 'text-amber-800 font-semibold border-b-2 border-amber-800 pb-1' : ''}`}
                >
                  <UserIcon className="w-4 h-4" />
                  Hồ Sơ (UC-36, 37)
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`flex items-center gap-1 hover:text-amber-800 transition ${activeTab === 'addresses' ? 'text-amber-800 font-semibold border-b-2 border-amber-800 pb-1' : ''}`}
                >
                  <MapPin className="w-4 h-4" />
                  Sổ Địa Chỉ (UC-38)
                </button>
              </>
            )}

            {user?.role === 'ROLE_ADMIN' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1 text-amber-700 hover:text-amber-900 transition ${activeTab === 'admin' ? 'font-bold border-b-2 border-amber-800 pb-1' : ''}`}
              >
                <Shield className="w-4 h-4" />
                Quản Trị Users & Roles (UC-40)
              </button>
            )}

            <button
              onClick={onOpenGuestOtp}
              className="text-stone-500 hover:text-amber-800 flex items-center gap-1"
            >
              <ShoppingBag className="w-4 h-4" />
              Demo Guest Checkout OTP (UC-39)
            </button>
          </nav>
        </div>

        {/* Right Auth controls */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded font-medium">
                {user?.role}
              </span>
              <span className="text-sm font-medium text-stone-700">
                {user?.fullName}
              </span>
              <button
                onClick={() => logout()}
                className="flex items-center gap-1 text-sm text-stone-500 hover:text-red-600 px-3 py-1.5 rounded-lg border border-stone-300 hover:border-red-300 transition"
                title="Đăng xuất (UC-34)"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng Xuất</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={onOpenLogin}
                className="text-sm font-medium text-stone-700 hover:text-amber-800 px-3 py-1.5"
              >
                Đăng Nhập (UC-33)
              </button>
              <button
                onClick={onOpenRegister}
                className="text-sm font-medium bg-stone-900 text-white hover:bg-stone-800 px-4 py-1.5 rounded-lg transition"
              >
                Đăng Ký (UC-31)
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

