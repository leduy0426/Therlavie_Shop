import React, { useState } from 'react';
import { authApi } from '../../api/authApi';
import { X, Mail, Lock, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
}) => {
  const [step, setStep] = useState<'REQUEST' | 'RESET'>('REQUEST');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await authApi.forgotPassword(email);
      setSuccess(res.message);
      setStep('RESET');
    } catch (err: any) {
      setError(err.message || 'Không thể gửi mã đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);
    try {
      const res: any = await authApi.resetPassword({
        email,
        otpCode,
        newPassword,
        confirmPassword,
      });

      setSuccess(res.message);
      setTimeout(() => {
        onClose();
        onOpenLogin();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Đặt lại mật khẩu thất bại');
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
          <h2 className="text-2xl font-bold text-stone-900 font-serif">Quên Mật Khẩu</h2>
          <p className="text-xs text-stone-500 mt-1">Khôi phục quyền truy cập an toàn (UC-35)</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-sm text-emerald-800">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {step === 'REQUEST' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Email tài khoản đã đăng ký
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg text-sm transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Đang kiểm tra...' : 'Gửi Mã Xác Nhận OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Mã OTP 6 số (gửi tới {email})
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Mật khẩu mới (BR-11)
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg text-sm transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Đang cập nhật...' : 'Xác Nhận Đổi Mật Khẩu (UC-35)'}
            </button>
          </form>
        )}

        <div className="mt-5 text-center text-xs text-stone-600">
          Nhớ lại mật khẩu?{' '}
          <button
            onClick={() => {
              onClose();
              onOpenLogin();
            }}
            className="text-amber-800 font-semibold hover:underline"
          >
            Quay lại Đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};

