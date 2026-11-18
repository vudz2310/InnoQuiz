import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  Lock,
  Sliders,
  ShieldCheck,
} from "lucide-react";
import {
  securityApi,
  type SecurityOverviewResponse,
  type SecurityEventItem,
  type SecurityAlertItem,
  type BlockedIdentifierItem,
} from "../../../services/api/Security.api";
import { useNotification } from "../../../components/Notification";
import {
  SecurityOverviewTab,
  SecurityEventsTab,
  SecurityEventDetailModal,
  SecurityAlertsTab,
  SecurityBlockedTab,
  SecuritySettingsTab,
} from "../components/security";

type SecurityTabKey = "overview" | "events" | "alerts" | "identifiers" | "settings";

interface AdminSecurityPageProps {
  defaultTab?: SecurityTabKey;
}

export const AdminSecurityPage: React.FC<AdminSecurityPageProps> = ({
  defaultTab = "overview",
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab") as SecurityTabKey;

  const [activeTab, setActiveTab] = useState<SecurityTabKey>(urlTab || defaultTab);
  const [timeRange, setTimeRange] = useState("7d");
  const { showSuccess, showError, showWarning } = useNotification();

  // 1. Overview State
  const [overview, setOverview] = useState<SecurityOverviewResponse | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // 2. Events State
  const [events, setEvents] = useState<SecurityEventItem[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsLimit, setEventsLimit] = useState(15);
  const [eventsSearch, setEventsSearch] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEventDetail, setSelectedEventDetail] = useState<SecurityEventItem | null>(null);

  // 3. Alerts State
  const [alerts, setAlerts] = useState<SecurityAlertItem[]>([]);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [alertsPage, setAlertsPage] = useState(1);
  const [alertsLimit, setAlertsLimit] = useState(10);
  const [alertStatusFilter, setAlertStatusFilter] = useState("");
  const [alertSeverityFilter, setAlertSeverityFilter] = useState("");
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // 4. Blocked Identifiers State
  const [blockedItems, setBlockedItems] = useState<BlockedIdentifierItem[]>([]);
  const [totalBlocked, setTotalBlocked] = useState(0);
  const [blockedPage, setBlockedPage] = useState(1);
  const [blockedLimit, setBlockedLimit] = useState(10);
  const [blockedSearch, setBlockedSearch] = useState("");
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  // 5. Settings State
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Sync tab with URL
  const handleTabChange = (tab: SecurityTabKey) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Load Overview Data
  const loadOverviewData = async () => {
    try {
      setLoadingOverview(true);
      const data = await securityApi.getOverview(timeRange);
      setOverview(data);
    } catch {
      showError("Lỗi", "Không thể tải số liệu tổng quan bảo mật.");
    } finally {
      setLoadingOverview(false);
    }
  };

  // Load Events Data
  const loadEventsData = async (
    page = eventsPage,
    limit = eventsLimit,
    search = eventsSearch,
    type = selectedEventType,
    risk = selectedRiskLevel
  ) => {
    try {
      setLoadingEvents(true);
      const data = await securityApi.getEvents({
        page,
        limit,
        search: search || undefined,
        eventType: type || undefined,
        riskLevel: risk || undefined,
      });
      setEvents(data.items);
      setTotalEvents(data.total);
    } catch {
      showError("Lỗi", "Không thể tải nhật ký sự kiện bảo mật.");
    } finally {
      setLoadingEvents(false);
    }
  };

  // Load Alerts Data
  const loadAlertsData = async (
    page = alertsPage,
    limit = alertsLimit,
    status = alertStatusFilter,
    sev = alertSeverityFilter
  ) => {
    try {
      setLoadingAlerts(true);
      const data = await securityApi.getAlerts({
        page,
        limit,
        status: status || undefined,
        severity: sev || undefined,
      });
      setAlerts(data.items);
      setTotalAlerts(data.total);
    } catch {
      showError("Lỗi", "Không thể tải danh sách cảnh báo bảo mật.");
    } finally {
      setLoadingAlerts(false);
    }
  };

  // Load Blocked Identifiers
  const loadBlockedData = async (
    page = blockedPage,
    limit = blockedLimit,
    search = blockedSearch
  ) => {
    try {
      setLoadingBlocked(true);
      const data = await securityApi.getBlockedIdentifiers({
        page,
        limit,
        search: search || undefined,
      });
      setBlockedItems(data.items);
      setTotalBlocked(data.total);
    } catch {
      showError("Lỗi", "Không thể tải danh sách thực thể bị chặn.");
    } finally {
      setLoadingBlocked(false);
    }
  };

  // Load Settings
  const loadSettingsData = async () => {
    try {
      setLoadingSettings(true);
      const data = await securityApi.getSettings();
      setSettings(data);
    } catch {
      showError("Lỗi", "Không thể tải cấu hình bảo mật hệ thống.");
    } finally {
      setLoadingSettings(false);
    }
  };

  // Trigger loads based on active tab
  useEffect(() => {
    if (activeTab === "overview") {
      loadOverviewData();
    } else if (activeTab === "events") {
      loadEventsData();
    } else if (activeTab === "alerts") {
      loadAlertsData();
    } else if (activeTab === "identifiers") {
      loadBlockedData();
    } else if (activeTab === "settings") {
      loadSettingsData();
    }
  }, [activeTab, timeRange]);

  // Handle Update Alert
  const handleUpdateAlert = async (id: string, status: string, resolutionNote?: string) => {
    try {
      await securityApi.updateAlert(id, { status, resolutionNote });
      showSuccess("Thành công", "Đã cập nhật trạng thái cảnh báo.");
      loadAlertsData();
      if (overview) loadOverviewData();
    } catch {
      showError("Lỗi", "Không thể cập nhật cảnh báo.");
      throw new Error();
    }
  };

  // Handle Add Block
  const handleAddBlock = async (payload: {
    type: "IP" | "USER" | "STUDENT_CODE";
    value: string;
    reason: string;
    riskScore?: number;
    blockedUntil?: string | null;
    notes?: string;
  }) => {
    try {
      await securityApi.blockIdentifier(payload);
      showSuccess("Đã thêm vào danh sách chặn", `Đã chặn ${payload.type}: ${payload.value}`);
      loadBlockedData();
      if (overview) loadOverviewData();
    } catch {
      showError("Lỗi", "Không thể thêm vào danh sách chặn.");
      throw new Error();
    }
  };

  // Handle Unblock
  const handleUnblock = async (id: string, reason?: string) => {
    try {
      await securityApi.unblockIdentifier(id, { reason });
      showSuccess("Đã mở khóa", "Đã gỡ chặn thực thể thành công.");
      loadBlockedData();
      if (overview) loadOverviewData();
    } catch {
      showError("Lỗi", "Không thể gỡ chặn.");
      throw new Error();
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (newSettings: Record<string, string>) => {
    try {
      const data = await securityApi.updateSettings(newSettings);
      setSettings(data);
      showSuccess("Đã lưu", "Đã cập nhật chính sách bảo mật động.");
    } catch {
      showError("Lỗi", "Không thể lưu cài đặt bảo mật.");
      throw new Error();
    }
  };

  const tabNavItems: Array<{
    key: SecurityTabKey;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }> = [
    { key: "overview", label: "Tổng quan an ninh", icon: ShieldCheck },
    {
      key: "events",
      label: "Nhật ký sự kiện",
      icon: Activity,
      badge: totalEvents > 0 ? totalEvents : undefined,
    },
    {
      key: "alerts",
      label: "Cảnh báo nguy cơ",
      icon: AlertTriangle,
      badge: overview?.stats?.activeAlertsCount,
    },
    {
      key: "identifiers",
      label: "Danh sách chặn",
      icon: Lock,
      badge: overview?.stats?.blockedCount,
    },
    { key: "settings", label: "Cấu hình bảo mật", icon: Sliders },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Trung tâm Bảo mật & Giám sát An ninh
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Giám sát thời gian thực, phát hiện xâm nhập trái phép và quản lý phiên đăng nhập HUBT.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Header */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
        {tabNavItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-white text-indigo-700"
                      : "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                  }`}
                >
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <SecurityOverviewTab
          overview={overview}
          loading={loadingOverview}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onRefresh={loadOverviewData}
          onNavigateTab={handleTabChange}
          onSelectEventDetail={setSelectedEventDetail}
        />
      )}

      {activeTab === "events" && (
        <SecurityEventsTab
          events={events}
          total={totalEvents}
          page={eventsPage}
          limit={eventsLimit}
          search={eventsSearch}
          selectedEventType={selectedEventType}
          selectedRiskLevel={selectedRiskLevel}
          loading={loadingEvents}
          onPageChange={(p) => {
            setEventsPage(p);
            loadEventsData(p, eventsLimit, eventsSearch, selectedEventType, selectedRiskLevel);
          }}
          onLimitChange={(l) => {
            setEventsLimit(l);
            setEventsPage(1);
            loadEventsData(1, l, eventsSearch, selectedEventType, selectedRiskLevel);
          }}
          onSearchChange={(s) => {
            setEventsSearch(s);
            setEventsPage(1);
            loadEventsData(1, eventsLimit, s, selectedEventType, selectedRiskLevel);
          }}
          onEventTypeChange={(t) => {
            setSelectedEventType(t);
            setEventsPage(1);
            loadEventsData(1, eventsLimit, eventsSearch, t, selectedRiskLevel);
          }}
          onRiskLevelChange={(r) => {
            setSelectedRiskLevel(r);
            setEventsPage(1);
            loadEventsData(1, eventsLimit, eventsSearch, selectedEventType, r);
          }}
          onRefresh={() =>
            loadEventsData(
              eventsPage,
              eventsLimit,
              eventsSearch,
              selectedEventType,
              selectedRiskLevel
            )
          }
          onSelectEventDetail={setSelectedEventDetail}
        />
      )}

      {activeTab === "alerts" && (
        <SecurityAlertsTab
          alerts={alerts}
          total={totalAlerts}
          page={alertsPage}
          limit={alertsLimit}
          statusFilter={alertStatusFilter}
          severityFilter={alertSeverityFilter}
          loading={loadingAlerts}
          onPageChange={(p) => {
            setAlertsPage(p);
            loadAlertsData(p, alertsLimit, alertStatusFilter, alertSeverityFilter);
          }}
          onLimitChange={(l) => {
            setAlertsLimit(l);
            setAlertsPage(1);
            loadAlertsData(1, l, alertStatusFilter, alertSeverityFilter);
          }}
          onStatusFilterChange={(s) => {
            setAlertStatusFilter(s);
            setAlertsPage(1);
            loadAlertsData(1, alertsLimit, s, alertSeverityFilter);
          }}
          onSeverityFilterChange={(sev) => {
            setAlertSeverityFilter(sev);
            setAlertsPage(1);
            loadAlertsData(1, alertsLimit, alertStatusFilter, sev);
          }}
          onRefresh={() =>
            loadAlertsData(alertsPage, alertsLimit, alertStatusFilter, alertSeverityFilter)
          }
          onUpdateAlert={handleUpdateAlert}
        />
      )}

      {activeTab === "identifiers" && (
        <SecurityBlockedTab
          blockedItems={blockedItems}
          total={totalBlocked}
          page={blockedPage}
          limit={blockedLimit}
          search={blockedSearch}
          loading={loadingBlocked}
          onPageChange={(p) => {
            setBlockedPage(p);
            loadBlockedData(p, blockedLimit, blockedSearch);
          }}
          onLimitChange={(l) => {
            setBlockedLimit(l);
            setBlockedPage(1);
            loadBlockedData(1, l, blockedSearch);
          }}
          onSearchChange={(s) => {
            setBlockedSearch(s);
            setBlockedPage(1);
            loadBlockedData(1, blockedLimit, s);
          }}
          onRefresh={() => loadBlockedData(blockedPage, blockedLimit, blockedSearch)}
          onAddBlock={handleAddBlock}
          onUnblock={handleUnblock}
        />
      )}

      {activeTab === "settings" && (
        <SecuritySettingsTab
          settings={settings}
          loading={loadingSettings}
          onRefresh={loadSettingsData}
          onSaveSettings={handleSaveSettings}
        />
      )}

      {/* Event Detail Modal */}
      {selectedEventDetail && (
        <SecurityEventDetailModal
          event={selectedEventDetail}
          onClose={() => setSelectedEventDetail(null)}
          onQuickBlock={(type, value, reason) =>
            handleAddBlock({
              type,
              value,
              reason,
              riskScore: 90,
              blockedUntil: null,
            })
          }
        />
      )}
    </div>
  );
};

export default AdminSecurityPage;
