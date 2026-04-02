import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getData, putData } from "../../Helpers/api.js";
import { toast } from "react-toastify";
import { useUser } from "../../Helpers/Context/UserContext.js";
import { can, normalizeRole } from "../../Helpers/acl.js";

const TAG_OPTIONS = ["", "HR", "Manager", "Security Guard"];

const safeText = (value) => String(value || "").trim();

const isCameraEvent = (value) => /camera|screenshot|video/i.test(String(value || ""));
const isAppAccessEvent = (value) =>
  /youtube|whatsapp|instagram|facebook|restricted app opened/i.test(String(value || ""));
const isSecurityPermissionEvent = (value) =>
  /overlay|notification permission|location permission|device admin|accessibility|usage access/i.test(
    String(value || "")
  );

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
};

const toEventDate = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return null;
  const eventDate = new Date(`${dateValue}T${timeValue}`);
  if (!Number.isNaN(eventDate.getTime())) return eventDate;

  const fallback = new Date(timeValue);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const scrollToId = (id) => {
  const node = document.getElementById(id);
  if (!node) return;
  node.scrollIntoView({ behavior: "smooth", block: "start" });
};

export default function UserOverview() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const role = normalizeRole(user?.role);
  const canUpdateEmployees = can(role, "employees", "update");

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [attendancePage, setAttendancePage] = useState(1);
  const [selectedTag, setSelectedTag] = useState("");
  const [savingTag, setSavingTag] = useState(false);
  const ATTENDANCE_LIMIT = 10;

  useEffect(() => {
    setAttendancePage(1);
  }, [fromDate, toDate]);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      try {
        const res = await getData(`/employees/overview/${encodeURIComponent(employeeId)}`);
        if (res?.status && res?.data) {
          setOverview(res.data);
          setSelectedTag(String(res.data?.profile?.tag || "").trim());
        } else {
          setOverview(null);
          toast.error(res?.message || "Failed to load user overview");
        }
      } catch (error) {
        setOverview(null);
        toast.error("Failed to load user overview");
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [employeeId]);

  useEffect(() => {
    const hash = safeText(location.hash).replace("#", "");
    if (!hash) return;
    const t = setTimeout(() => scrollToId(hash), 50);
    return () => clearTimeout(t);
  }, [location.hash, loading]);

  const profile = overview?.profile || {};
  const counts = overview?.counts || {};
  const devices = Array.isArray(overview?.devices) ? overview.devices : [];
  const attendance = Array.isArray(overview?.attendance) ? overview.attendance : [];

  const normalizeSessionStatus = (value) => {
    const raw = String(value || "").trim();
    const lower = raw.toLowerCase();
    if (!raw) return { label: "Offline", isOnline: false };
    if (lower.includes("logged in") || lower === "login" || lower === "loggedin") {
      return { label: "Online", isOnline: true };
    }
    if (lower.includes("logged out") || lower === "logout" || lower === "loggedout") {
      return { label: "Offline", isOnline: false };
    }
    return { label: raw, isOnline: lower.includes("in") && !lower.includes("out") };
  };

  const displayAttendance = useMemo(() => {
    if (!fromDate && !toDate) {
      const todayAt = new Date();
      todayAt.setHours(0, 0, 0, 0);
      return attendance.filter((a) => {
        const d = new Date(a.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === todayAt.getTime();
      });
    }

    const start = fromDate ? new Date(fromDate + "T00:00:00") : null;
    const end = toDate ? new Date(toDate + "T23:59:59") : null;

    return attendance.filter((a) => {
      const d = new Date(a.date);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [attendance, fromDate, toDate]);

  const scanEvents = useMemo(() => {
    const events = [];
    displayAttendance.forEach((a) => {
      // Inward scans
      if (a.entryGateIn || a.workfloorIn) {
        events.push({
          date: a.date,
          time: a.entryGateIn || a.workfloorIn,
          type: "Entry",
          status: "Logged In",
        });
      }
      // Outward scans
      if (a.exitGateOut || a.workfloorOut) {
        events.push({
          date: a.date,
          time: a.exitGateOut || a.workfloorOut,
          type: "Exit",
          status: "Logged Out",
        });
      }
    });
    const allEvents = events.sort((a, b) => new Date(b.time) - new Date(a.time));
    return allEvents;
  }, [displayAttendance]);

  const totalAttendancePages = Math.ceil(scanEvents.length / ATTENDANCE_LIMIT) || 1;
  const paginatedScanEvents = useMemo(() => {
    const start = (attendancePage - 1) * ATTENDANCE_LIMIT;
    return scanEvents.slice(start, start + ATTENDANCE_LIMIT);
  }, [scanEvents, attendancePage]);

  const renderPaginationButtons = () => {
    const btns = [];
    const start = Math.max(attendancePage - 2, 1);
    const end = Math.min(attendancePage + 2, totalAttendancePages);

    const baseBtn = "w-10 h-10 text-sm font-semibold text-gray-700 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition-all";
    const activeBtn = "bg-blue-600 text-white border-blue-600 shadow ring-2 ring-blue-200 hover:bg-blue-600";

    if (start > 1) {
      btns.push(
        <button key={1} onClick={() => setAttendancePage(1)} className={baseBtn}>1</button>
      );
      if (start > 2) btns.push(<span key="dots1" className="px-1 text-gray-400 font-bold">…</span>);
    }

    for (let i = start; i <= end; i++) {
      btns.push(
        <button
          key={i}
          onClick={() => setAttendancePage(i)}
          className={`${baseBtn} ${i === attendancePage ? activeBtn : ""}`}
          style={i === attendancePage ? { backgroundColor: "#2563eb", color: "#ffffff", borderColor: "#2563eb", boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.3)" } : {}}
        >
          {i}
        </button>
      );
    }

    if (end < totalAttendancePages - 1) btns.push(<span key="dots2" className="px-1 text-gray-400 font-bold">…</span>);
    if (end < totalAttendancePages) {
      btns.push(
        <button key={totalAttendancePages} onClick={() => setAttendancePage(totalAttendancePages)} className={baseBtn}>{totalAttendancePages}</button>
      );
    }
    return btns;
  };

  const sessionUi = useMemo(() => {
    const attendanceEvents = [];

    attendance.forEach((a) => {
      const entryTime = a.entryGateIn || a.workfloorIn;
      const exitTime = a.exitGateOut || a.workfloorOut;
      const entryDate = toEventDate(a.date, entryTime);
      const exitDate = toEventDate(a.date, exitTime);

      if (entryDate) {
        attendanceEvents.push({
          status: "Logged In",
          timestamp: entryDate,
        });
      }

      if (exitDate) {
        attendanceEvents.push({
          status: "Logout",
          timestamp: exitDate,
        });
      }
    });

    attendanceEvents.sort((a, b) => b.timestamp - a.timestamp);
    const latestAttendanceEvent = attendanceEvents[0];
    const derivedSession = normalizeSessionStatus(latestAttendanceEvent?.status || profile.sessionStatus);

    return {
      ...derivedSession,
      source: latestAttendanceEvent ? "attendance" : "profile",
      timestamp: latestAttendanceEvent?.timestamp || null,
    };
  }, [attendance, profile.sessionStatus]);

  const violationEvents = Array.isArray(overview?.violationEvents) ? overview.violationEvents : [];
  const principalType = overview?.principalType || "user";
  const dashboardPrefix = (location.pathname || "").startsWith("/dashboard/employee")
    ? "/dashboard/employee"
    : "/dashboard/users";
  const backPath = principalType === "visitor"
    ? `${dashboardPrefix}/visitors`
    : `${dashboardPrefix}/employees`;

  const handleSaveTag = async () => {
    if (!canUpdateEmployees || !overview?.profile?.id) return;
    try {
      setSavingTag(true);
      const res = await putData(`/employees/${overview.profile.id}/tags`, {
        tag: selectedTag,
      });
      if (res?.status) {
        setOverview((prev) => prev ? ({
          ...prev,
          profile: {
            ...prev.profile,
            tag: selectedTag,
          },
        }) : prev);
        toast.success("Tag updated");
      } else {
        toast.error(res?.message || "Failed to update tag");
      }
    } catch (_error) {
      toast.error("Failed to update tag");
    } finally {
      setSavingTag(false);
    }
  };

  const categorized = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isToday = (ts) => {
      const d = new Date(ts);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    };

    const res = {
      camera: { all: [], today: 0 },
      appAccess: { all: [], today: 0 },
      security: { all: [], today: 0 },
      policyViolations: { all: violationEvents, today: 0 },
    };

    for (const item of violationEvents) {
      if (isToday(item.timestamp)) res.policyViolations.today++;

      const text = `${item?.event || ""} ${item?.narrative || ""} ${item?.metadata?.narrative || ""}`;
      if (isCameraEvent(text)) {
        res.camera.all.push(item);
        if (isToday(item.timestamp)) res.camera.today++;
      } else if (isAppAccessEvent(text)) {
        res.appAccess.all.push(item);
        if (isToday(item.timestamp)) res.appAccess.today++;
      } else if (isSecurityPermissionEvent(text)) {
        res.security.all.push(item);
        if (isToday(item.timestamp)) res.security.today++;
      }
    }
    return res;
  }, [violationEvents]);

  const infoItems = useMemo(() => {
    const items = [];
    if (profile.email) {
      items.push({
        label: "Email Address",
        value: profile.email,
        iconColor: "bg-blue-500",
        content: <p className="text-sm font-bold text-gray-800 break-all">{profile.email}</p>
      });
    }
    if (profile.phone) {
      items.push({
        label: "Phone Number",
        value: profile.phone,
        iconColor: "bg-green-500",
        content: <p className="text-sm font-bold text-gray-800">{profile.phone}</p>
      });
    }
    if (profile.rfid) {
      items.push({
        label: "RFID",
        value: profile.rfid,
        iconColor: "bg-indigo-500",
        content: (
          <div className="flex items-center gap-1 md:gap-2 text-sm font-bold text-gray-800 flex-wrap">
            {profile.rfid && profile.rfid !== "No RFID Tag" ? (
              <span className="text-[10px] md:text-xs text-gray-500 break-all">{profile.rfid}</span>
            ) : (
              <span>-</span>
            )}
          </div>
        )
      });
    }
    if (profile.designation) {
      items.push({
        label: "Designation",
        value: profile.designation,
        iconColor: "bg-orange-500",
        content: <p className="text-sm font-bold text-gray-800">{profile.designation}</p>
      });
    }
    if (sessionUi.label) {
      const sessionTimestampStr = sessionUi.timestamp
        ? ` (${sessionUi.isOnline ? "Last entry" : "Last exit"} ${formatDateTime(sessionUi.timestamp)})`
        : "";
      items.push({
        label: "Mobile Session",
        value: sessionUi.label,
        iconColor: sessionUi.isOnline ? "bg-green-500" : "bg-red-500",
        content: (
          <p className={`text-sm font-bold ${sessionUi.isOnline ? "text-green-600" : "text-red-600"}`}>
            {sessionUi.label}
            {sessionTimestampStr && <span className="text-[10px] text-gray-400 font-medium ml-1.5">{sessionTimestampStr}</span>}
          </p>
        )
      });
    }
    return items;
  }, [profile, sessionUi]);

  const activityItems = useMemo(() => {
    const items = [];
    const navigateTo = (type) => () => navigate(`/dashboard/users/activity?employeeId=${employeeId}&type=${type}`);

    items.push({
      label: "Cam Activity",
      onClick: navigateTo("camera_activity"),
      iconColor: "bg-blue-400"
    });

    items.push({
      label: "App Access",
      onClick: navigateTo("app_access"),
      iconColor: "bg-indigo-400"
    });

    items.push({
      label: "Security Events",
      onClick: navigateTo("security_permission"),
      iconColor: "bg-purple-400"
    });

    return items;
  }, [counts, categorized, employeeId, navigate]);



  return (
    <div className="m-0 pt-20 md:pt-0">
      <div className="relative p-4 md:p-4 !m-0">
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-bold italic">Gathering intelligence...</div>
        ) : !overview ? (
          <div className="p-12 text-center bg-red-50 border border-red-100 rounded-[2rem] text-red-600 font-bold">
            Target unidentified. Profile data incomplete.
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 mb-6 group transition-all hover:shadow-xl hover:shadow-blue-500/5">
            {/* Back Button */}
            <div className="pt-4 px-4 md:pt-6 md:px-8">
              <button
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all border border-gray-100 shadow-sm"
                onClick={() => navigate(backPath)}
                title="Go Back"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
            </div>

            <div className="px-4 pb-8 pt-4 md:px-8 relative">
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                {/* Avatar Area */}
                <div className="relative group">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-white p-2 shadow-2xl border border-white rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    <div className="w-full h-full rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-4xl font-black text-white uppercase shadow-inner">
                      {profile?.name?.charAt(0) || "U"}
                    </div>
                  </div>
                  <div
                    className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center ${sessionUi.isOnline ? "bg-green-500" : "bg-gray-400"}`}
                    title={sessionUi.isOnline ? "User Online" : "User Offline"}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full bg-white ${sessionUi.isOnline ? "animate-pulse" : ""}`}></div>
                  </div>
                </div>

                {/* Identity Section */}
                <div className="flex-1 mb-2">
                  <div className="flex flex-wrap items-center gap-4 mb-2">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">{profile?.name || "-"}</h1>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg tracking-widest border border-blue-100 flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                      {principalType}
                    </span>
                    {principalType === "employee" && (
                      <div className="min-w-[260px] rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                              Role Tag
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-600">
                              {profile?.tag ? `Current: ${profile.tag}` : "No tag assigned"}
                            </p>
                          </div>
                          <span
                            className={`inline-flex min-w-[84px] justify-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                              profile?.tag
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-white text-slate-400"
                            }`}
                          >
                            {profile?.tag || "No Tag"}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <div className="relative flex-1">
                            <select
                              value={selectedTag}
                              onChange={(e) => setSelectedTag(e.target.value)}
                              disabled={!canUpdateEmployees || savingTag}
                              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                            >
                              <option value="">No Tag</option>
                              {TAG_OPTIONS.filter(Boolean).map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                  fillRule="evenodd"
                                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.1 1.02l-4.25 4.5a.75.75 0 01-1.1 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          </div>
                          {canUpdateEmployees && (
                            <button
                              type="button"
                              onClick={handleSaveTag}
                              disabled={savingTag || selectedTag === String(profile?.tag || "").trim()}
                              className="inline-flex items-center justify-center rounded-xl bg-[#22374e] px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-white shadow-sm transition hover:bg-[#1a2d40] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {savingTag ? "Saving..." : "Save"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-gray-400">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-500/50" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                      </svg>
                      ID: <span className="text-gray-900">{profile?.employeeId || employeeId}</span>
                    </span>
                    <span className="flex items-center gap-2 md:border-l md:border-gray-100 md:pl-6">
                      <svg className="w-4 h-4 text-indigo-500/50" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                      SITE: <span className="text-gray-900 truncate max-w-[200px] md:max-w-[250px] font-black">{profile.location || "-"}</span>
                    </span>
                  </div>
                </div>

                {/* Header Profile Stats */}
                <div className="flex flex-wrap gap-3">
                  {profile.department && (
                    <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100 text-center min-w-[110px] transition-all hover:bg-white hover:shadow-md cursor-default">
                      <p className="text-[10px] text-black font-black uppercase tracking-widest mb-1">Department</p>
                      <p className="text-sm font-black text-gray-800">{profile.department}</p>
                    </div>
                  )}
                  {profile.designation && (
                    <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100 text-center min-w-[110px] transition-all hover:bg-white hover:shadow-md cursor-default">
                      <p className="text-[10px] text-black font-black uppercase tracking-widest mb-1">Designation</p>
                      <p className="text-sm font-black text-gray-800">{profile.designation}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Info Grid */}
              <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${Math.max(2, Math.min(4, infoItems.length))} gap-4 md:gap-8 mt-10 md:mt-12 border-t border-gray-50 pt-8 md:pt-10`}>
                {infoItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-3xl bg-gray-50 border border-gray-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-200 cursor-default group"
                  >
                    <p className="text-[10px] text-black font-extrabold uppercase tracking-widest mb-3 flex items-center gap-2 group-hover:text-black transition-colors">
                      <span className={`w-2 h-2 rounded-full ${item.iconColor} shadow-sm`}></span>
                      {item.label}
                    </p>
                    <div className="transform group-hover:translate-x-1 transition-transform duration-300">
                      {item.content}
                    </div>
                  </div>
                ))}
                {infoItems.length === 0 && (
                  <div className="col-span-full py-4 text-center text-gray-400 italic text-sm">
                    No additional profile information available.
                  </div>
                )}
              </div>

              {/* Activity Section */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 mt-8 md:mt-10 border-t border-gray-50 pt-8 md:pt-10">
                <div className="col-span-full -mb-4">
                  <p className="text-sm text-black font-black uppercase tracking-[0.2em]">Activity Highlights</p>
                </div>
                {activityItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-3xl bg-gray-50 border border-gray-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-200 cursor-pointer group flex flex-col justify-center items-center min-h-[100px] hover:scale-105 active:scale-95"
                    onClick={item.onClick}
                  >
                    <p className="text-sm text-black font-black uppercase tracking-widest flex items-center gap-3 transition-all duration-300 group-hover:scale-110 group-hover:text-black pointer-events-none">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.iconColor} shadow-sm group-hover:animate-pulse transition-all duration-300`}></span>
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Devices Section */}
              <div id="devices" className="mt-8 md:mt-10 border-t border-gray-50 pt-8 md:pt-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-900 font-black uppercase tracking-[0.2em]">Registered Devices</p>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-black rounded-md">{devices.length}</span>
                  </div>
                </div>
                {devices.length === 0 ? (
                  <div className="text-sm text-gray-500 italic">No devices found.</div>
                ) : (
                  <div className="overflow-auto rounded-xl border border-gray-100">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr className="text-left text-gray-900 uppercase text-[10px] font-black tracking-widest">
                          <th className="py-3 px-4">Device Id</th>
                          <th className="py-3 px-4">Device Name</th>
                          <th className="py-3 px-4">Platform</th>
                          <th className="py-3 px-4 text-right">Last Seen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {devices.map((d) => (
                          <tr key={d._id || d.deviceId} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 px-4 font-bold text-gray-900">
                              <span
                                className="cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => navigate(`/dashboard/users/device?employeeId=${employeeId}&openModal=true`)}
                              >
                                {d.deviceId || "-"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{d.deviceName || "-"}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase tracking-tighter">
                                {d.platform || "-"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-500 text-right font-medium">
                              {formatDateTime(d.lastSeen || d.lastOnline)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Attendance Section */}
              <div id="attendance" className="mt-8 md:mt-10 border-t border-gray-50 pt-8 md:pt-10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                  <div
                    className="flex items-center gap-3 cursor-pointer group/title"
                    onClick={() => navigate(`/dashboard/users/attendance?searchTerm=${employeeId}`)}
                  >
                    <p className="text-sm text-gray-900 font-black uppercase tracking-[0.2em] group-hover/title:text-blue-700">
                      Attendance Log
                    </p>
                    <svg
                      className="w-3 h-3 text-blue-400 group-hover/title:translate-x-0.5 transition-transform"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 md:gap-2 bg-gray-50 p-2 sm:p-1 rounded-xl border border-gray-100 w-full md:w-auto flex-1 md:flex-none">
                      <input
                        type="date"
                        className="text-[10px] font-bold bg-transparent border-none focus:ring-0 px-2 py-1 text-gray-600 outline-none w-full sm:w-auto text-center sm:text-left"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                      <span className="hidden sm:inline text-[10px] text-gray-300 font-black">-</span>
                      <input
                        type="date"
                        className="text-[10px] font-bold bg-transparent border-none focus:ring-0 px-2 py-1 text-gray-600 outline-none w-full sm:w-auto text-center sm:text-left"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                      />
                    </div>
                    {(fromDate || toDate) && (
                      <button
                        onClick={() => {
                          setFromDate("");
                          setToDate("");
                        }}
                        className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest"
                      >
                        Clear
                      </button>
                    )}
                    <div className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-black rounded-md">
                      {displayAttendance.length} Records
                    </div>
                  </div>
                </div>

                {scanEvents.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 font-medium italic">
                      {fromDate || toDate
                        ? "Search complete. No matching logs found."
                        : "No attendance activity detected for today."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden border border-gray-100 rounded-xl">
                    <table className="min-w-full text-sm text-left">
                      <thead className="bg-[#1e293b] text-white">
                        <tr className="text-[11px] uppercase font-black tracking-[0.15em]">
                          <th className="py-3 px-6">Entry/Exit</th>
                          <th className="py-3 px-6">System Status</th>
                          <th className="py-3 px-6">Date</th>
                          <th className="py-3 px-6 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 bg-white">
                        {paginatedScanEvents.map((event, idx) => {
                          const eventDate = new Date(event.time);
                          const timeString = eventDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                          });

                          return (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-4 px-6">
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${event.type === "Entry"
                                    ? "bg-green-50 text-green-700 border border-green-100"
                                    : "bg-orange-50 text-orange-700 border border-orange-100"
                                    }`}
                                >
                                  {event.type}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <span className="text-xs font-bold text-gray-600">{event.status}</span>
                              </td>
                              <td className="py-4 px-6 text-gray-500 font-medium">{formatDate(event.date)}</td>
                              <td className="py-4 px-6 text-right font-black text-gray-900 tabular-nums">
                                {timeString}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {totalAttendancePages > 1 && (
                      <div className="flex items-center justify-center py-6 px-6 bg-gray-50/10 border-t border-gray-50 relative min-h-[80px]">
                        {/* Record count on the left - Absolutely positioned so it doesn't push the buttons */}
                        <div className="hidden md:block absolute left-8 text-sm text-gray-600 font-medium">
                          {Math.max((attendancePage - 1) * ATTENDANCE_LIMIT + 1, 1)}-{Math.min(attendancePage * ATTENDANCE_LIMIT, scanEvents.length)} of {scanEvents.length}
                        </div>

                        {/* Centered Pagination Controls */}
                        <div className="flex items-center gap-2 overflow-x-auto sm:overflow-visible">
                          <button
                            disabled={attendancePage === 1}
                            onClick={() => setAttendancePage(p => Math.max(1, p - 1))}
                            className="w-12 h-12 text-2xl rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all flex items-center justify-center shadow-sm"
                          >
                            ‹
                          </button>

                          <div className="flex flex-nowrap gap-2 items-center px-2">
                            {renderPaginationButtons()}
                          </div>

                          <button
                            disabled={attendancePage === totalAttendancePages}
                            onClick={() => setAttendancePage(p => Math.min(totalAttendancePages, p + 1))}
                            className="w-12 h-12 text-2xl rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all flex items-center justify-center shadow-sm"
                          >
                            ›
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
