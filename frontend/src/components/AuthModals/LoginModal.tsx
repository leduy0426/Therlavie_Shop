import React, { useState } from 'react';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: () => void;
  onOpenForgotPassword: () => void;
  onOpenVerifyEmail: (email: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onOpenRegister,
  onOpenForgotPassword,
  onOpenVerifyEmail,
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await authApi.login({
        email,
        password,
        rememberMe,
      });

      login(res.accessToken, res.user);
      onClose();
    } catch (err: any) {
      const msg = err.message || 'Đăng nhập thất bại';
      setError(msg);
      // If user account is pending verification, guide them to OTP verification (UC-32)
      if (msg.includes('pending verification')) {
        onClose();
        onOpenVerifyEmail(email);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative border border-stone-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-stone-900 font-serif">Đăng Nhập</h2>
          <p className="text-sm text-stone-500 mt-1">Hệ Thống Thời Trang Thierlavier (UC-33)</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tenban@example.com"
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center text-stone-600 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-stone-300 text-amber-700 focus:ring-amber-700 mr-2"
              />
              Ghi nhớ đăng nhập 30 ngày (BR-13)
            </label>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenForgotPassword();
              }}
              className="text-amber-800 hover:underline font-medium"
            >
              Quên mật khẩu? (UC-35)
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg text-sm transition shadow-sm disabled:opacity-50"
          >
            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-stone-600">
          Chưa có tài khoản?{' '}
          <button
            onClick={() => {
              onClose();
              onOpenRegister();
            }}
            className="text-amber-800 font-semibold hover:underline"
          >
            Đăng ký ngay (UC-31)
          </button>
        </div>
      </div>
    </div>
  );
};

