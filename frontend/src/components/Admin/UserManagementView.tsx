import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { useAuth } from '../../context/AuthContext';
import { Shield, Search, Lock, Unlock, UserCheck, AlertCircle, CheckCircle2, History } from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit / Action Modal
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [newRole, setNewRole] = useState<string>('ROLE_CUSTOMER');
  const [newStatus, setNewStatus] = useState<string>('ACTIVE');
  const [justificationReason, setJustificationReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Audit Logs Modal
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await adminApi.getUsers({
        page,
        limit: 10,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });

      setUsers(res.content);
      setTotalPages(res.meta.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleOpenAction = (u: any) => {
    setSelectedUser(u);
    setNewRole(u.role);
    setNewStatus(u.status);
    setJustificationReason('');
    setError(null);
    setActionModalOpen(true);
  };

  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Client-side self modification check
    if (currentAdmin?.id === selectedUser.id) {
      if (newStatus === 'LOCKED' || (newRole && newRole !== 'ROLE_ADMIN')) {
        setError('Quy tắc an toàn (BR-11): Quản trị viên không được phép tự khóa hoặc tự tước quyền Admin của chính mình.');
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      await adminApi.updateUser(selectedUser.id, {
        newRole,
        newStatus,
        justificationReason,
      });

      setSuccess(`Cập nhật tài khoản ${selectedUser.email} thành công và đã ghi Audit Log (NFR-11).`);
      setActionModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cập nhật tài khoản.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewAuditLogs = async () => {
    try {
      const res: any = await adminApi.getAuditLogs();
      setAuditLogs(res.content);
      setAuditModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Không thể tải lịch sử kiểm toán.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-800" />
            <h2 className="text-2xl font-bold text-stone-900 font-serif">
              Quản Trị Người Dùng & Phân Quyền (UC-40)
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Chỉ dành cho Quản trị viên (BR-33). Quản lý vai trò (RBAC), khóa tài khoản vi phạm và lưu vết kiểm toán bất biến (NFR-11).
          </p>
        </div>

        <button
          onClick={handleViewAuditLogs}
          className="flex items-center gap-2 px-4 py-2 border border-stone-300 hover:border-amber-700 bg-white text-stone-700 hover:text-amber-900 rounded-lg text-sm font-medium transition shadow-sm"
        >
          <History className="w-4 h-4 text-amber-700" />
          Nhật Ký Kiểm Toán (Audit Logs)
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
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Filter and search bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo email, họ tên, số điện thoại..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-700"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-medium"
          >
            Tìm Kiếm
          </button>
        </form>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
          >
            <option value="">Tất cả Vai Trò</option>
            <option value="ROLE_CUSTOMER">Khách Hàng (Customer)</option>
            <option value="ROLE_STAFF">Nhân Viên (Staff)</option>
            <option value="ROLE_ADMIN">Quản Trị Viên (Admin)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
          >
            <option value="">Tất cả Trạng Thái</option>
            <option value="ACTIVE">Hoạt Động (Active)</option>
            <option value="PENDING_VERIFICATION">Chờ Xác Thực (Pending)</option>
            <option value="LOCKED">Bị Khóa (Locked)</option>
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50 text-stone-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5 text-left">ID</th>
                <th className="px-6 py-3.5 text-left">Họ Tên & Email</th>
                <th className="px-6 py-3.5 text-left">Số Điện Thoại</th>
                <th className="px-6 py-3.5 text-left">Vai Trò (Role)</th>
                <th className="px-6 py-3.5 text-left">Trạng Thái (Status)</th>
                <th className="px-6 py-3.5 text-left">Ngày Tạo</th>
                <th className="px-6 py-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-stone-400">
                    Đang tải danh sách tài khoản...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-stone-400">
                    Không tìm thấy tài khoản phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/70 transition">
                    <td className="px-6 py-4 font-mono text-xs text-stone-400">{u.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-stone-900">{u.fullName}</div>
                      <div className="text-xs text-stone-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">{u.phoneNumber || '—'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          u.role === 'ROLE_ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'ROLE_STAFF'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {u.role.replace('ROLE_', '')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.status === 'LOCKED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-500">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenAction(u)}
                        className="text-xs font-medium text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition"
                      >
                        Cập Nhật
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>Trang {page} / {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border border-stone-300 rounded hover:bg-stone-50 disabled:opacity-40"
            >
              Trước
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border border-stone-300 rounded hover:bg-stone-50 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Action Dialog (Modify Role / Toggle Status) */}
      {actionModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-stone-200">
            <h3 className="text-lg font-bold text-stone-900 font-serif mb-1">
              Cập Nhật Quyền & Trạng Thái Tài Khoản
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Người dùng: <span className="font-semibold text-stone-800">{selectedUser.fullName}</span> ({selectedUser.email})
            </p>

            <form onSubmit={handleSaveAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Vai trò (Role)
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
                >
                  <option value="ROLE_CUSTOMER">Khách Hàng (Customer)</option>
                  <option value="ROLE_STAFF">Nhân Viên (Staff)</option>
                  <option value="ROLE_ADMIN">Quản Trị Viên (Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Trạng thái tài khoản (Status)
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
                >
                  <option value="ACTIVE">Hoạt Động (Active)</option>
                  <option value="PENDING_VERIFICATION">Chờ Xác Thực (Pending)</option>
                  <option value="LOCKED">Khóa Tài Khoản (Locked)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Lý do thay đổi / Lý do khóa (Bắt buộc lưu Audit Log - NFR-11)
                </label>
                <textarea
                  required
                  rows={3}
                  value={justificationReason}
                  onChange={(e) => setJustificationReason(e.target.value)}
                  placeholder="Nhập lý do nâng quyền hoặc khóa tài khoản..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setActionModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Xác Nhận Cập Nhật (UC-40)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Logs History Modal */}
      {auditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 border border-stone-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
                <History className="w-5 h-5 text-amber-800" />
                Lịch Sử Kiểm Toán Hệ Thống (NFR-11 Immutable Audit Log)
              </h3>
              <button
                onClick={() => setAuditModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                Đóng
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-stone-400">Chưa có bản ghi nhật ký kiểm toán nào.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs">
                    <div className="flex items-center justify-between font-semibold text-stone-900 mb-1">
                      <span>Hành động: {log.action}</span>
                      <span className="text-stone-400 font-mono">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <div className="text-stone-600">
                      Thực hiện bởi: <span className="font-semibold">{log.actor?.email || 'System'}</span> (ID: {log.actorId})
                    </div>
                    {log.target && (
                      <div className="text-stone-600">
                        Đối tượng can thiệp: <span className="font-semibold">{log.target.email}</span> (ID: {log.targetId})
                      </div>
                    )}
                    <div className="mt-1 text-amber-900 bg-amber-50/80 p-2 rounded border border-amber-200/50">
                      Lý do: {log.justificationReason || 'N/A'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

