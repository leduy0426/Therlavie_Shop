import React, { useEffect, useState } from 'react';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, Mail, Camera, Trash2, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { SecurityView } from './SecurityView';

export const ProfileView: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [preferredFit, setPreferredFit] = useState('Oversize');
  const [favoriteColor, setFavoriteColor] = useState('Monochrome');
  const [heightCm, setHeightCm] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data: any = await userApi.getProfile();
      setFullName(data.fullName || '');
      setPhoneNumber(data.phoneNumber || '');
      setAvatarUrl(data.profile?.avatarUrl || null);
      setPreferredFit(data.profile?.preferredFit || 'Oversize');
      setFavoriteColor(data.profile?.favoriteColor || 'Monochrome');
      setHeightCm(data.profile?.heightCm || '');
      setWeightKg(data.profile?.weightKg || '');
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const res: any = await userApi.updateProfile({
        fullName,
        phoneNumber,
        preferredFit,
        favoriteColor,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
      });

      updateUser({ fullName, email: res.email });
      setSuccess('Hồ sơ đã được cập nhật thành công (UC-37)!');
    } catch (err: any) {
      setError(err.message || 'Cập nhật hồ sơ thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setError('Ảnh vượt quá dung lượng tối đa 3MB (NFR-05).');
      return;
    }

    try {
      setSaving(true);
      const res: any = await userApi.uploadAvatar(file);
      setAvatarUrl(res.avatarUrl);
      setSuccess('Ảnh đại diện đã được cập nhật.');
    } catch (err: any) {
      setError(err.message || 'Lỗi tải ảnh đại diện.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setSaving(true);
      await userApi.removeAvatar();
      setAvatarUrl(null);
      setSuccess('Đã gỡ bỏ ảnh đại diện (Alt Flow 1.1).');
    } catch (err: any) {
      setError(err.message || 'Không thể gỡ ảnh đại diện.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-stone-500">
        Đang tải thông tin hồ sơ...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Sub tabs */}
      <div className="flex border-b border-stone-200 mb-8 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`pb-3 ${activeSubTab === 'profile' ? 'border-b-2 border-amber-800 text-amber-900 font-bold' : 'text-stone-500 hover:text-stone-900'}`}
        >
          Thông Tin Cá Nhân & Sở Thích (UC-37)
        </button>
        <button
          onClick={() => setActiveSubTab('security')}
          className={`pb-3 ${activeSubTab === 'security' ? 'border-b-2 border-amber-800 text-amber-900 font-bold' : 'text-stone-500 hover:text-stone-900'}`}
        >
          Bảo Mật & Đổi Mật Khẩu (UC-36)
        </button>
      </div>

      {activeSubTab === 'security' ? (
        <SecurityView />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar section */}
            <div className="flex flex-col items-center space-y-3 w-full md:w-48 flex-shrink-0">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-amber-200 bg-stone-100 flex items-center justify-center shadow-inner">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-stone-400" />
                )}
                <label className="absolute bottom-1 right-1 bg-amber-800 hover:bg-amber-900 text-white p-2 rounded-full cursor-pointer shadow transition">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-xs text-red-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Gỡ ảnh đại diện
                </button>
              )}
              <span className="text-[11px] text-stone-400 text-center">JPEG/PNG/WebP, tối đa 3MB</span>
            </div>

            {/* Profile fields */}
            <form onSubmit={handleSaveProfile} className="flex-1 space-y-5 w-full">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                  <span>{success}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Email đăng ký (Read-only - NFR-05)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      disabled
                      value={user?.email || ''}
                      className="w-full pl-9 pr-3 py-2 bg-stone-100 border border-stone-200 rounded-lg text-sm text-stone-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Số điện thoại (10 chữ số chuẩn VN)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0912345678"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:bg-white"
                  />
                </div>
              </div>

              <div className="border-t border-stone-200 pt-4">
                <h4 className="text-sm font-bold text-stone-900 mb-3">Sở Thích Cá Nhân & Thông Số Hình Thể (BR-19)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-stone-600 mb-1">Phong cách form áo ưa thích</label>
                    <select
                      value={preferredFit}
                      onChange={(e) => setPreferredFit(e.target.value)}
                      className="w-full py-2 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-700"
                    >
                      <option value="Oversize">Oversize (Rộng rãi, Streetwear)</option>
                      <option value="Regular">Regular (Vừa vặn tiêu chuẩn)</option>
                      <option value="Slim-fit">Slim-fit (Ôm dáng)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-stone-600 mb-1">Gam màu yêu thích</label>
                    <select
                      value={favoriteColor}
                      onChange={(e) => setFavoriteColor(e.target.value)}
                      className="w-full py-2 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-700"
                    >
                      <option value="Monochrome">Monochrome (Đen, Trắng, Xám)</option>
                      <option value="Pastel">Pastel (Nhẹ nhàng, Hàn Quốc)</option>
                      <option value="Earth-tone">Earth-tone (Nâu, Be, Xanh rêu)</option>
                      <option value="Vibrant">Vibrant (Nổi bật, Năng động)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-stone-600 mb-1">Chiều cao (cm)</label>
                    <input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : '')}
                      placeholder="175"
                      className="w-full py-2 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-stone-600 mb-1">Cân nặng (kg)</label>
                    <input
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : '')}
                      placeholder="68"
                      className="w-full py-2 px-3 bg-stone-50 border border-stone-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Đang lưu...' : 'Lưu Thay Đổi (UC-37)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

