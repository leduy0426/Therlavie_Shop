import React, { useState } from 'react';
import { authApi } from '../../api/authApi';
import { Lock, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export const SecurityView: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);
    try {
      const res: any = await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setSuccess(res.message || 'Mật khẩu đã được cập nhật thành công (UC-36)!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Không thể đổi mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-sm max-w-2xl">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-200">
        <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-stone-900 font-serif">Đổi Mật Khẩu Tài Khoản</h3>
          <p className="text-xs text-stone-500">
            Tất cả phiên đăng nhập trên các thiết bị khác sẽ tự động bị thu hồi sau khi đổi (BR-40).
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-sm text-emerald-800">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
            Mật khẩu hiện tại
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
            Mật khẩu mới (BR-11: ≥8 ký tự, có hoa, thường, số)
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
            Xác nhận mật khẩu mới
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg text-sm transition shadow-sm disabled:opacity-50"
        >
          {loading ? 'Đang cập nhật mật khẩu...' : 'Lưu Mật Khẩu Mới (UC-36)'}
        </button>
      </form>
    </div>
  );
};

