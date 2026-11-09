import React, { useEffect, useState } from 'react';
import { addressApi } from '../../api/addressApi';
import { MapPin, Plus, CheckCircle, Trash2, Edit3, AlertCircle } from 'lucide-react';

interface Address {
  id: number;
  recipientName: string;
  phoneNumber: string;
  provinceCity: string;
  district: string;
  ward: string;
  detailedAddress: string;
  isDefault: boolean;
}

export const AddressBookView: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provinceCity, setProvinceCity] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [detailedAddress, setDetailedAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data: any = await addressApi.getAddresses();
      setAddresses(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải sổ địa chỉ.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingAddress(null);
    setRecipientName('');
    setPhoneNumber('');
    setProvinceCity('TP. Hồ Chí Minh');
    setDistrict('Quận 1');
    setWard('Phường Bến Nghé');
    setDetailedAddress('');
    setIsDefault(addresses.length === 0);
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (addr: Address) => {
    setEditingAddress(addr);
    setRecipientName(addr.recipientName);
    setPhoneNumber(addr.phoneNumber);
    setProvinceCity(addr.provinceCity);
    setDistrict(addr.district);
    setWard(addr.ward);
    setDetailedAddress(addr.detailedAddress);
    setIsDefault(addr.isDefault);
    setError(null);
    setModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingAddress) {
        await addressApi.updateAddress(editingAddress.id, {
          recipientName,
          phoneNumber,
          provinceCity,
          district,
          ward,
          detailedAddress,
          isDefault,
        });
        setSuccess('Cập nhật địa chỉ thành công.');
      } else {
        await addressApi.createAddress({
          recipientName,
          phoneNumber,
          provinceCity,
          district,
          ward,
          detailedAddress,
          isDefault,
        });
        setSuccess('Thêm địa chỉ mới thành công (BR-14).');
      }

      setModalOpen(false);
      await loadAddresses();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lưu địa chỉ.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await addressApi.setDefault(id);
      setSuccess('Đã đổi địa chỉ mặc định (Alt Flow 1.2).');
      await loadAddresses();
    } catch (err: any) {
      setError(err.message || 'Không thể đặt làm mặc định.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;

    try {
      await addressApi.deleteAddress(id);
      setSuccess('Đã xóa địa chỉ thành công.');
      await loadAddresses();
    } catch (err: any) {
      setError(err.message || 'Không thể xóa địa chỉ.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 font-serif">Sổ Địa Chỉ Giao Hàng (UC-38)</h2>
          <p className="text-xs text-stone-500 mt-1">
            Quản lý tối đa <span className="font-semibold text-amber-900">05 địa chỉ nhận hàng</span> theo quy định hệ thống (<span className="font-mono">BR-14</span>).
            Hiện có: <span className="font-bold">{addresses.length}/5</span> địa chỉ.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          disabled={addresses.length >= 5}
          className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Thêm Địa Chỉ Mới
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-sm text-emerald-800">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-stone-500">Đang tải danh sách địa chỉ...</div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8">
          <MapPin className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-600 font-medium">Bạn chưa lưu địa chỉ nhận hàng nào.</p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 text-sm text-amber-800 font-semibold hover:underline"
          >
            + Thêm địa chỉ đầu tiên ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white rounded-xl p-5 border relative shadow-sm transition flex flex-col justify-between ${
                addr.isDefault ? 'border-amber-700 ring-1 ring-amber-700' : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-stone-900">{addr.recipientName}</span>
                  {addr.isDefault && (
                    <span className="text-[11px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                      Mặc định
                    </span>
                  )}
                </div>

                <p className="text-sm text-stone-600 mb-1">{addr.phoneNumber}</p>
                <p className="text-sm text-stone-700 leading-relaxed">
                  {addr.detailedAddress}, {addr.ward}, {addr.district}, {addr.provinceCity}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                {!addr.isDefault ? (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-stone-500 hover:text-amber-800 font-medium"
                  >
                    Đặt làm mặc định
                  </button>
                ) : (
                  <span className="text-amber-800 text-[11px] italic">Địa chỉ giao mặc định</span>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenEdit(addr)}
                    className="text-stone-600 hover:text-stone-900 flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Address */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative border border-stone-200">
            <h3 className="text-lg font-bold text-stone-900 font-serif mb-4">
              {editingAddress ? 'Chỉnh Sửa Địa Chỉ' : 'Thêm Địa Chỉ Giao Hàng Mới'}
            </h3>

            <form onSubmit={handleSaveAddress} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Người nhận</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Số điện thoại (10 số)</label>
                  <input
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0912345678"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Tỉnh / Thành phố</label>
                  <input
                    type="text"
                    required
                    value={provinceCity}
                    onChange={(e) => setProvinceCity(e.target.value)}
                    placeholder="TP. Hồ Chí Minh"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Quận / Huyện</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Quận 1"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Phường / Xã</label>
                  <input
                    type="text"
                    required
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    placeholder="Phường Bến Nghé"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Địa chỉ chi tiết (Số nhà, đường)</label>
                <input
                  type="text"
                  required
                  value={detailedAddress}
                  onChange={(e) => setDetailedAddress(e.target.value)}
                  placeholder="123 Lê Lợi, Chung cư A, Phòng 402"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center text-xs text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded border-stone-300 text-amber-800 focus:ring-amber-800 mr-2"
                  />
                  Đặt làm địa chỉ nhận hàng mặc định
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu Địa Chỉ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

