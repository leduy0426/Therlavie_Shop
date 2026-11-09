import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/AuthModals/LoginModal';
import { RegisterModal } from './components/AuthModals/RegisterModal';
import { VerifyEmailModal } from './components/AuthModals/VerifyEmailModal';
import { ForgotPasswordModal } from './components/AuthModals/ForgotPasswordModal';
import { GuestOtpVerificationModal } from './components/Checkout/GuestOtpVerificationModal';
import { ProfileView } from './components/Profile/ProfileView';
import { AddressBookView } from './components/AddressBook/AddressBookView';
import { UserManagementView } from './components/Admin/UserManagementView';
import { useAuth } from './context/AuthContext';
import { ShieldCheck, User, MapPin, KeyRound, Smartphone, CheckCircle, ArrowRight } from 'lucide-react';

export const App: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'addresses' | 'admin'>('home');

  // Modal open states
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [verifyEmailModalOpen, setVerifyEmailModalOpen] = useState(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const [guestOtpModalOpen, setGuestOtpModalOpen] = useState(false);
  const [verifyTargetEmail, setVerifyTargetEmail] = useState('');

  const openVerifyEmail = (email: string) => {
    setVerifyTargetEmail(email);
    setVerifyEmailModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans text-stone-900">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setLoginModalOpen(true)}
        onOpenRegister={() => setRegisterModalOpen(true)}
        onOpenGuestOtp={() => setGuestOtpModalOpen(true)}
      />

      <main className="flex-1">
        {activeTab === 'profile' && isAuthenticated && <ProfileView />}
        {activeTab === 'addresses' && isAuthenticated && <AddressBookView />}
        {activeTab === 'admin' && user?.role === 'ROLE_ADMIN' && <UserManagementView />}

        {activeTab === 'home' && (
          <div>
            {/* Hero Section */}
            <section className="bg-stone-900 text-stone-100 py-16 px-4 sm:px-6 lg:px-8 text-center border-b border-stone-800">
              <div className="max-w-4xl mx-auto space-y-4">
                <span className="inline-block text-xs uppercase tracking-widest text-amber-500 font-semibold bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800/40">
                  SWD392 Group 5 • Multi-tier Architecture
                </span>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-serif text-white">
                  THIERLAVIER FASHION SHOP
                </h1>
                <p className="text-stone-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                  Hệ thống quản lý thời trang cao cấp với kiến trúc Multi-tier Client-Server phân tầng nghiêm ngặt,
                  bảo vệ an toàn thông tin theo chuẩn OWASP và kiểm soát phân quyền chặt chẽ.
                </p>

                <div className="pt-4 flex flex-wrap justify-center gap-3">
                  {!isAuthenticated ? (
                    <>
                      <button
                        onClick={() => setLoginModalOpen(true)}
                        className="px-6 py-2.5 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-medium text-sm transition shadow"
                      >
                        Đăng Nhập Ngay (UC-33)
                      </button>
                      <button
                        onClick={() => setRegisterModalOpen(true)}
                        className="px-6 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg font-medium text-sm transition border border-stone-700"
                      >
                        Đăng Ký Tài Khoản (UC-31)
                      </button>
                    </>
                  ) : (
                    <div className="text-amber-400 font-medium text-sm">
                      Đang đăng nhập dưới quyền: <span className="font-bold underline">{user?.fullName}</span> ({user?.role})
                    </div>
                  )}
                  <button
                    onClick={() => setGuestOtpModalOpen(true)}
                    className="px-6 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg font-medium text-sm transition border border-stone-700 flex items-center gap-1.5"
                  >
                    <Smartphone className="w-4 h-4 text-amber-500" />
                    Thử Xác Thực Guest OTP (UC-39)
                  </button>
                </div>
              </div>
            </section>

            {/* UC 31-40 Feature Showcase Matrix */}
            <section className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-stone-900 font-serif">
                  10 Use Cases Đã Hiện Thực Hóa (UC-31 đến UC-40)
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Đã giải quyết toàn bộ 10 điểm mâu thuẫn giữa Đặc tả Use Case và Biểu đồ UML
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* UC-31 & 32 */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow transition">
                  <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center mb-4">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-stone-900 text-base mb-1">
                    UC-31 & UC-32: Đăng Ký & Xác Thực Email OTP
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed mb-3">
                    Đăng ký kiểm tra email duy nhất, băm mật khẩu BCrypt, sinh OTP 6 số (hạn 5 phút, cooldown 60s). Tự động gộp giỏ hàng vãng lai khi kích hoạt tài khoản thành công (BR-15).
                  </p>
                  <button
                    onClick={() => setRegisterModalOpen(true)}
                    className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1"
                  >
                    Trải nghiệm Đăng Ký <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* UC-33 & 34 */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow transition">
                  <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-stone-900 text-base mb-1">
                    UC-33 & UC-34: Đăng Nhập & Đăng Xuất An Toàn
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed mb-3">
                    Bảo vệ chống Brute-force: tự động khóa tài khoản 15 phút sau 5 lần sai (BR-13). Đăng xuất thu hồi Refresh Token trong DB và Blacklist Access Token JTI đến khi hết hạn.
                  </p>
                  <button
                    onClick={() => setLoginModalOpen(true)}
                    className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1"
                  >
                    Trải nghiệm Đăng Nhập <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* UC-35 & 36 */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow transition">
                  <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center mb-4">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-stone-900 text-base mb-1">
                    UC-35 & UC-36: Quên Mật Khẩu & Đổi Mật Khẩu
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed mb-3">
                    Xác minh OTP đặt lại mật khẩu và kiểm tra mật khẩu hiện tại. Tự động thu hồi phiên đăng nhập trên toàn bộ thiết bị khác (BR-40) và gửi email cảnh báo bảo mật.
                  </p>
                  <button
                    onClick={() => setForgotPasswordModalOpen(true)}
                    className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1"
                  >
                    Thử Quên Mật Khẩu <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* UC-37 */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow transition">
                  <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center mb-4">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-stone-900 text-base mb-1">
                    UC-37: Cập Nhật Hồ Sơ & Sở Thích Cá Nhân
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed mb-3">
                    Đồng bộ cả hai thực thể User (Họ tên, SĐT 10 số) và CustomerProfile (Form dáng, Gam màu, Avatar max 3MB). Hỗ trợ gỡ avatar trở về hình đại diện mặc định.
                  </p>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1"
                  >
                    Xem Màn Hình Hồ Sơ <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* UC-38 */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow transition">
                  <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center mb-4">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-stone-900 text-base mb-1">
                    UC-38: Sổ Địa Chỉ Giao Hàng (Max 5)
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed mb-3">
                    Quản lý tối đa 5 địa chỉ theo đúng quy tắc BR-14 (chặn khi count &gt;= 5). Quản lý duy nhất 1 địa chỉ mặc định, hỗ trợ chỉnh sửa, đặt nhanh mặc định và xóa an toàn.
                  </p>
                  <button
                    onClick={() => setActiveTab('addresses')}
                    className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1"
                  >
                    Xem Sổ Địa Chỉ <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* UC-39 & 40 */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow transition">
                  <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center mb-4">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-stone-900 text-base mb-1">
                    UC-39 & UC-40: Guest OTP & Quản Trị RBAC
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed mb-3">
                    Xác minh SĐT khách vãng lai qua SMS OTP để mở khóa Place Order (UC-08). Phân quyền Admin quản lý danh sách tài khoản, ngăn chặn tự khóa tài khoản chính mình (BR-11), ghi Audit Log (NFR-11).
                  </p>
                  <button
                    onClick={() => setActiveTab('admin')}
                    className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1"
                  >
                    Xem Màn Quản Trị RBAC <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Global Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onOpenRegister={() => setRegisterModalOpen(true)}
        onOpenForgotPassword={() => setForgotPasswordModalOpen(true)}
        onOpenVerifyEmail={(email) => openVerifyEmail(email)}
      />

      <RegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onOpenLogin={() => setLoginModalOpen(true)}
        onOpenVerifyEmail={(email) => openVerifyEmail(email)}
      />

      <VerifyEmailModal
        isOpen={verifyEmailModalOpen}
        onClose={() => setVerifyEmailModalOpen(false)}
        email={verifyTargetEmail}
      />

      <ForgotPasswordModal
        isOpen={forgotPasswordModalOpen}
        onClose={() => setForgotPasswordModalOpen(false)}
        onOpenLogin={() => setLoginModalOpen(true)}
      />

      <GuestOtpVerificationModal
        isOpen={guestOtpModalOpen}
        onClose={() => setGuestOtpModalOpen(false)}
      />

      <footer className="bg-white border-t border-stone-200 py-6 text-center text-xs text-stone-500">
        © 2026 Thierlavier Shop. Đồ án SWD392 (Software Architecture & Design) - Group 5.
      </footer>
    </div>
  );
};

