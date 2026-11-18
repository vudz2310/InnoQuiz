import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/Dashboard";
import type { RootState } from "../../../store";
import { setUser, clearUser } from "../../../store/slices/auth.slice";
import { getProfile } from "../../../services/api/User.api";
import { useNotification } from "../../../components/Notification";

import ProfileBanner from "./ProfileBanner";
import ProfileStats from "./ProfileStats";
import ProfileTabsNav from "./ProfileTabsNav";
import type { ProfileTabType } from "./ProfileTabsNav";
import ProfileInfoTab from "./ProfileInfoTab";
import ProfileHistoryTab from "./ProfileHistoryTab";
import ProfileProgressTab from "./ProfileProgressTab";
import ProfileSecurityTab from "./ProfileSecurityTab";

export default function ProfilePage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();

  const [activeTab, setActiveTab] = useState<ProfileTabType>("info");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Call API to fetch user profile when accessing protected profile page
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");

      if (!token) {
        dispatch(clearUser());
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const profileData = await getProfile(token, user?.id);
        if (profileData) {
          dispatch(setUser(profileData));
        }
      } catch (error: unknown) {
        console.error("Lỗi khi tải thông tin người dùng:", error);
        showError(
          "Phiên đăng nhập hết hạn",
          "Vui lòng đăng nhập lại để tiếp tục.",
        );
        dispatch(clearUser());
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [dispatch, navigate, showError]);

  const displayUser = user || {
    id: "guest",
    name: "Sinh viên HUBT",
    email: "student@hubt.edu.vn",
    role: "user",
    avatar: "",
    createdAt: new Date().toISOString(),
  };

  const handleLogout = () => {
    dispatch(clearUser());
    showSuccess("Đã đăng xuất", "Hẹn gặp lại bạn lần sau!");
    navigate("/login");
  };


  return (
    <DashboardLayout>
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-semibold text-[#64748B]">
                Đang tải thông tin cá nhân...
              </span>
            </div>
          </div>
        ) : (
          <>
            <ProfileBanner
              user={displayUser}
              isEditing={isEditing}
              onToggleEdit={() => setIsEditing(!isEditing)}
              onLogout={handleLogout}
            />

            <ProfileStats />

            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
              <ProfileTabsNav
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab)}
              />

              <div className="p-6 sm:p-8">
                {activeTab === "info" && (
                  <ProfileInfoTab
                    user={displayUser}
                    isEditing={isEditing}
                    onSave={(_updatedUser) => {
                      setIsEditing(false);
                    }}
                    onCancel={() => setIsEditing(false)}
                  />
                )}

                {activeTab === "history" && (
                  <ProfileHistoryTab />
                )}

                {activeTab === "stats" && <ProfileProgressTab />}

                {activeTab === "security" && <ProfileSecurityTab />}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
