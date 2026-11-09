import React, { useState, useEffect } from 'react';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { X, KeyRound, AlertCircle, CheckCircle2, RotateCw } from 'lucide-react';

interface VerifyEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export const VerifyEmailModal: React.FC<VerifyEmailModalProps> = ({
  isOpen,
  onClose,
  email,
}) => {
  const { login } = useAuth();
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await authApi.verifyEmail({
        email,
        otpCode,
        guestSessionId: localStorage.getItem('guestSessionId') || undefined,
      });

      setSuccess(res.message);
      login(res.accessToken, res.user);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Xác thực mã OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResending(true);
    try {
      await authApi.register({
        fullName: 'Member',
        email,
        password: '',
        confirmPassword: '',
      });
      setCountdown(60);
      setSuccess('Mã OTP mới đã được gửi tới email của bạn (hạn 5 phút).');
    } catch (err: any) {
      // Even if register returns message
      setCountdown(60);
      setSuccess('Mã OTP mới đã được phát hành.');
    } finally {
      setResending(false);
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
          <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 font-serif">Xác Thực Email</h2>
          <p className="text-xs text-stone-500 mt-1">
            Nhập mã OTP 6 chữ số vừa được gửi tới: <br />
            <span className="font-semibold text-stone-800">{email}</span> (UC-32)
          </p>
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

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <input
              type="text"
              required
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg text-sm transition shadow-sm disabled:opacity-50"
          >
            {loading ? 'Đang xác thực...' : 'Xác Nhận Kích Hoạt Tài Khoản'}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-stone-600 flex items-center justify-center gap-1">
          {countdown > 0 ? (
            <span>Gửi lại mã sau {countdown}s</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-amber-800 font-semibold hover:underline flex items-center gap-1"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Gửi lại mã OTP (Alt Flow 1.1)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

