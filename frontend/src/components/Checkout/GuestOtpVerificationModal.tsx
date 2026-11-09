import React, { useState, useEffect } from 'react';
import { guestApi } from '../../api/guestApi';
import { X, Smartphone, KeyRound, AlertCircle, CheckCircle2, RotateCw, ShieldCheck } from 'lucide-react';

interface GuestOtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessVerified?: (token: string) => void;
}

export const GuestOtpVerificationModal: React.FC<GuestOtpVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccessVerified,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'PHONE_INPUT' | 'OTP_INPUT'>('PHONE_INPUT');
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [guestToken, setGuestToken] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    if (countdown > 0 && step === 'OTP_INPUT') {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown, step]);

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await guestApi.requestOtp(phoneNumber, email || undefined);
      setSuccess('Mã OTP đã được gửi tới số điện thoại của bạn qua SMS (hạn 5 phút).');
      setStep('OTP_INPUT');
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Không thể gửi mã OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await guestApi.verifyOtp(phoneNumber, otpCode);
      setSuccess(res.message);
      setGuestToken(res.guestVerificationToken);

      if (onSuccessVerified) {
        onSuccessVerified(res.guestVerificationToken);
      }
    } catch (err: any) {
      setError(err.message || 'Xác thực mã OTP thất bại.');
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
          <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Smartphone className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 font-serif">Xác Thực Khách Vãng Lai</h2>
          <p className="text-xs text-stone-500 mt-1">
            Xác minh số điện thoại nhận hàng qua SMS OTP trước khi Đặt Hàng COD (UC-39 → UC-08)
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

        {guestToken ? (
          <div className="text-center py-4 space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-1">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
                Đã Xác Minh Danh Tính Khách Hàng!
              </div>
              <p className="text-xs text-stone-600 mb-2">
                Phiên đặt hàng vãng lai đã được mở khóa (có hiệu lực trong 15 phút):
              </p>
              <div className="bg-white p-2 rounded border border-amber-300 font-mono text-[11px] break-all text-stone-800">
                {guestToken}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg text-sm transition"
            >
              Tiến Hành Đặt Hàng (Mở Khóa UC-08)
            </button>
          </div>
        ) : step === 'PHONE_INPUT' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Số điện thoại người nhận (10 số)
              </label>
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0912345678"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Email nhận hàng (Dự phòng fallback SMS - NFR-06)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="guest@example.com (tùy chọn)"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg text-sm transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Đang gửi mã...' : 'Gửi Mã Xác Thực OTP (SMS)'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Nhập mã 6 chữ số nhận qua tin nhắn ({phoneNumber})
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg text-sm transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Đang xác thực...' : 'Xác Nhận OTP (UC-39)'}
            </button>

            <div className="text-center text-xs text-stone-600">
              {countdown > 0 ? (
                <span>Gửi lại mã sau {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  className="text-amber-800 font-semibold hover:underline flex items-center gap-1 mx-auto"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Gửi lại mã qua SMS
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

