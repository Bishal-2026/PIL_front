import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useSearchParams, useNavigate } from "react-router-dom";
import { API } from "../../../Helpers/api.js";
import CustomDataTable from "../../../Common/Customsdatatable.js";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

const AttendanceList = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialSearch = searchParams.get("searchTerm") || searchParams.get("employeeId") || "";

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewingDate, setViewingDate] = useState(null);

  const fetchAttendance = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch a large filtered set and group by user on frontend
      const response = await API.attendance.getAll({
        search: searchTerm,
        status: statusFilter || undefined,
        date: dateFilter || undefined,
        page: 1,
        limit: 5000,
      });

      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      setEntries(list);
    } catch (_err) {
      setError("Failed to load attendance");
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [searchTerm, statusFilter, dateFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter, rowsPerPage]);

  const formatDateTime = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  };

  const formatDateOnly = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
  };

  const formatTimeOnly = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString();
  };

  const resolveActivity = (row) => {
    const inTime = row?.entryGateIn ? new Date(row.entryGateIn).getTime() : 0;
    const outTime = row?.exitGateOut ? new Date(row.exitGateOut).getTime() : 0;
    if (inTime && outTime) return outTime >= inTime ? "Out" : "In";
    if (outTime) return "Out";
    if (inTime) return "In";
    const action = String(row?.metadata?.action || "").toLowerCase();
    if (action === "logout") return "Out";
    if (action === "login") return "In";
    return "-";
  };

  const resolveTime = (row) => {
    if (row?.exitGateOut) return row.exitGateOut;
    if (row?.entryGateIn) return row.entryGateIn;
    if (row?.updatedAt) return row.updatedAt;
    return null;
  };

  const groupedUsers = useMemo(() => {
    const map = new Map();

    entries.forEach((entry) => {
      const key =
        entry?.userId ||
        entry?.employeeId ||
        `${entry?.userName || "unknown"}-${entry?.deviceId || "device"}`;

      if (!map.has(key)) {
        map.set(key, {
          userKey: key,
          userName: entry?.userName || "-",
          employeeId: entry?.employeeId || "-",
          deviceId: entry?.deviceId || "-",
          entries: [],
        });
      }

      const group = map.get(key);
      group.entries.push(entry);

      if (!group.userName || group.userName === "-") {
        group.userName = entry?.userName || "-";
      }
      if (!group.employeeId || group.employeeId === "-") {
        group.employeeId = entry?.employeeId || "-";
      }
      if (!group.deviceId || group.deviceId === "-") {
        group.deviceId = entry?.deviceId || "-";
      }
    });

    return Array.from(map.values())
      .map((group) => {
        const sortedEntries = [...group.entries].sort((a, b) => {
          const ta = new Date(resolveTime(a) || 0).getTime();
          const tb = new Date(resolveTime(b) || 0).getTime();
          return tb - ta;
        });
        return {
          ...group,
          entries: sortedEntries,
          latestEntry: sortedEntries[0] || null,
        };
      })
      .sort((a, b) => {
        const ta = new Date(resolveTime(a.latestEntry) || 0).getTime();
        const tb = new Date(resolveTime(b.latestEntry) || 0).getTime();
        return tb - ta;
      });
  }, [entries]);

  const totalRows = groupedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return groupedUsers.slice(start, start + rowsPerPage);
  }, [groupedUsers, currentPage, rowsPerPage]);

  const selectedUserEvents = useMemo(() => {
    if (!selectedUser?.entries) return [];

    const events = [];
    selectedUser.entries.forEach((entry) => {
      if (entry?.entryGateIn) {
        events.push({ kind: "In", time: entry.entryGateIn, entry });
      }
      if (entry?.exitGateOut) {
        events.push({ kind: "Out", time: entry.exitGateOut, entry });
      }
      if (!entry?.entryGateIn && !entry?.exitGateOut) {
        events.push({ kind: resolveActivity(entry), time: resolveTime(entry), entry });
      }
    });

    return events.sort((a, b) => {
      const ta = new Date(a.time || 0).getTime();
      const tb = new Date(b.time || 0).getTime();
      return tb - ta;
    });
  }, [selectedUser]);

  const selectedUserStats = useMemo(() => {
    let inCount = 0;
    let outCount = 0;
    selectedUserEvents.forEach((event) => {
      if (event.kind === "In") inCount += 1;
      if (event.kind === "Out") outCount += 1;
    });
    return { inCount, outCount, total: selectedUserEvents.length };
  }, [selectedUserEvents]);

  const groupedByDate = useMemo(() => {
    const map = new Map();
    selectedUserEvents.forEach((event) => {
      const date = formatDateOnly(event.time);
      if (!map.has(date)) {
        map.set(date, { date, events: [], inCount: 0, outCount: 0 });
      }
      const group = map.get(date);
      group.events.push(event);
      if (event.kind === "In") group.inCount += 1;
      if (event.kind === "Out") group.outCount += 1;
    });
    return Array.from(map.values()).sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [selectedUserEvents]);

  const renderPaginationButtons = (current, total, onChange) => {
    const btns = [];
    const start = Math.max(current - 2, 1);
    const end = Math.min(current + 2, total);
    const baseBtn =
      "w-10 h-10 text-sm font-semibold text-gray-700 rounded-full border border-gray-200 bg-white hover:bg-gray-50";
    const activeBtn =
      "bg-blue-600 text-white border-blue-600 shadow ring-2 ring-blue-200 hover:bg-blue-600";

    if (start > 1) {
      btns.push(
        <button key={1} onClick={() => onChange(1)} className={baseBtn}>
          1
        </button>
      );
      if (start > 2) btns.push(<span key="dots1">...</span>);
    }

    for (let i = start; i <= end; i += 1) {
      btns.push(
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`${baseBtn} ${i === current ? activeBtn : ""}`}
          style={
            i === current
              ? {
                backgroundColor: "#2563eb",
                color: "#ffffff",
                borderColor: "#2563eb",
                boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.3)",
              }
              : { backgroundColor: "#ffffff", color: "#374151" }
          }
        >
          {i}
        </button>
      );
    }

    if (end < total - 1) btns.push(<span key="dots2">...</span>);

    if (end < total) {
      btns.push(
        <button key={total} onClick={() => onChange(total)} className={baseBtn}>
          {total}
        </button>
      );
    }

    return btns;
  };

  const startItem = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalRows);

  const columns = [
    {
      name: "Sr.No",
      selector: (row) => (currentPage - 1) * rowsPerPage + paginatedUsers.indexOf(row) + 1,
      width: "5%",
    },
    {
      name: "Name / Employee ID",
      selector: (row) => (
        <div className="flex flex-col text-left">
          <button
            onClick={() => navigate(`/dashboard/users/employees/user/${encodeURIComponent(String(row.employeeId || row.userKey || ""))}#details`)}
            className="text-left font-bold text-gray-900 hover:text-blue-600 hover:underline bg-transparent border-none p-0 m-0 inline-block focus:outline-none"
            style={{ width: "fit-content" }}
          >
            {row.userName || "-"}
          </button>
          <span className="text-xs text-gray-500 font-medium">{row.employeeId || "-"}</span>
        </div>
      ),
      width: "20%",
    },
    {
      name: "Activity",
      selector: (row) => (row.latestEntry ? resolveActivity(row.latestEntry) : "-"),
      width: "12%",
    },
    {
      name: "Device ID",
      selector: (row) => 
        row.deviceId && row.deviceId !== "-" ? (
          <button
            onClick={() => navigate(`/dashboard/users/device?employeeId=${encodeURIComponent(String(row.employeeId || ""))}`)}
            className="text-left text-gray-900 hover:text-blue-600 hover:underline bg-transparent border-none p-0 m-0 inline-block focus:outline-none"
          >
            {row.deviceId}
          </button>
        ) : (
          <span className="text-gray-900">-</span>
        ),
      width: "18%",
    },
    {
      name: "Time",
      selector: (row) => formatDateTime(resolveTime(row.latestEntry)),
      width: "20%",
    },
    {
      name: "Action",
      selector: (row) => (
        <button
          onClick={() => setSelectedUser(row)}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200"
          title="View Details"
        >
          <svg width={22} height={22} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
            <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6-46.8 43.5-78.1 95.4-93 131.1-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64-11.5 0-22.3-3-31.7-8.4-1 10.9-.1 22.1 2.9 33.2 13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-12.2-45.7-55.5-74.8-101.1-70.8 5.3 9.3 8.4 20.1 8.4 31.7z" />
          </svg>
        </button>
      ),
      width: "10%",
    },
  ];

  const mobileColumns = [
    {
      name: "Name",
      selector: (row) => (
        <button
          onClick={() => navigate(`/dashboard/users/employees/user/${encodeURIComponent(String(row.employeeId || row.userKey || ""))}#details`)}
          className="font-bold text-[#22374E] whitespace-nowrap hover:text-blue-600 hover:underline bg-transparent border-none p-0 m-0 inline-block focus:outline-none"
        >
          {row.userName || "-"}
        </button>
      ),
    },
    {
      name: "Employee ID",
      selector: (row) => (
        <span className="text-gray-600 whitespace-nowrap">{row.employeeId || "-"}</span>
      ),
    },
    {
      name: "Activity",
      selector: (row) => (
        <span className="whitespace-nowrap">{row.latestEntry ? resolveActivity(row.latestEntry) : "-"}</span>
      ),
    },
    {
      name: "Device ID",
      selector: (row) => (
        <div className="w-full overflow-hidden text-right">
          {row.deviceId && row.deviceId !== "-" ? (
            <button
              onClick={() => navigate(`/dashboard/users/device?employeeId=${encodeURIComponent(String(row.employeeId || ""))}`)}
              className="text-gray-800 font-bold whitespace-nowrap hover:text-blue-600 hover:underline bg-transparent border-none p-0 m-0 inline-block focus:outline-none"
            >
              {row.deviceId}
            </button>
          ) : (
            <span className="text-gray-800 font-bold whitespace-nowrap">-</span>
          )}
        </div>
      ),
    },
    {
      name: "Time",
      selector: (row) => (
        <span className="text-xs text-gray-600 whitespace-nowrap">
          {formatDateTime(resolveTime(row.latestEntry))}
        </span>
      ),
    },
    {
      name: "Action",
      selector: (row) => (
        <div className="flex justify-end">
          <button
            onClick={() => setSelectedUser(row)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200"
            title="View Details"
          >
            <svg width={18} height={18} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
              <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6-46.8 43.5-78.1 95.4-93 131.1-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64-11.5 0-22.3-3-31.7-8.4-1 10.9-.1 22.1 2.9 33.2 13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-12.2-45.7-55.5-74.8-101.1-70.8 5.3 9.3 8.4 20.1 8.4 31.7z" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="button-crm mb-4">
        <div className="status-dropdown-section flex gap-4 flex-wrap">
          <div className="input-search-bar flex">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search"
              className="border rounded p-2"
            />
          </div>

          <div className="status-select-option-dropdown first-left form-item">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="HalfDay">Half Day</option>
              <option value="Leave">Leave</option>
            </select>
          </div>

          <div className="status-select-option-dropdown first-left form-item">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border rounded p-2"
            />
          </div>
        </div>
      </div>

      {error && <div className="text-red-500 mb-3">{error}</div>}

      <div className="mt-2 bg-white p-5 rounded-xl shadow activity-table-wrapper">
        <h2 className="text-xl font-bold mb-4">User Activity - ALL ATTENDANCE</h2>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <CustomDataTable
            columns={columns}
            mobileColumns={mobileColumns}
            data={paginatedUsers}
            totalRows={totalRows}
            rowsPerPageOptions={[10, 20, 50, 100]}
            defaultRowsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={setRowsPerPage}
            currentPage={currentPage}
          />
        )}
      </div>

      {selectedUser && (
        <div className="modal-overlay">
          <div className="modal-wrapper">
            <button onClick={() => { setSelectedUser(null); setViewingDate(null); }} className="modal-close-btn">
              ✕
            </button>
            <div className="modal-container">

              <div className="modal-header modal-header--compact">
                <h2 className="modal-user-name">Name: {selectedUser.userName || "-"}</h2>
                <p className="modal-meta">Employee ID: {selectedUser.employeeId || "-"}</p>
                <p className="modal-meta">Device ID: {selectedUser.deviceId || "-"}</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  Total: {selectedUserStats.total}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  In: {selectedUserStats.inCount}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                  Out: {selectedUserStats.outCount}
                </span>
              </div>

              {viewingDate ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setViewingDate(null)}
                      className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      ← Back to Dates
                    </button>
                    <h3 className="text-lg font-bold">Entries for {viewingDate}</h3>
                  </div>
                  <div className="activity-table-scroll max-h-[420px] overflow-auto border rounded-lg">
                    <table className="w-full border-collapse activity-table">
                      <thead>
                        <tr className="bg-[#1e293b] text-white text-left sticky top-0 z-10">
                          <th className="p-3">Activity</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedByDate
                          .find((g) => g.date === viewingDate)
                          ?.events.map((event, idx) => (
                            <tr
                              key={`${event.entry?.id || event.entry?._id || idx}-${event.kind}`}
                              className="odd:bg-white even:bg-slate-50"
                            >
                              <td className="p-3">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${event.kind === "In"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : event.kind === "Out"
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-gray-100 text-gray-700"
                                    }`}
                                >
                                  {event.kind}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                                  {event.kind === "In"
                                    ? "Logged In"
                                    : event.kind === "Out"
                                      ? "Logged Out"
                                      : event.entry?.status || "-"}
                                </span>
                              </td>
                              <td className="p-3">{formatTimeOnly(event.time)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="activity-table-scroll max-h-[420px] overflow-auto border rounded-lg">
                  <table className="w-full border-collapse activity-table">
                    <thead>
                      <tr className="bg-[#1e293b] text-white text-left sticky top-0 z-10">
                        <th className="p-3">Date</th>
                        <th className="p-3">In / Out</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedByDate.map((group, idx) => (
                        <tr key={group.date || idx} className="odd:bg-white even:bg-slate-50">
                          <td className="p-3 font-semibold">{group.date}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                In: {group.inCount}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                                Out: {group.outCount}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => setViewingDate(group.date)}
                              className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200"
                              title="View Details"
                            >
                              <svg width={22} height={22} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                                <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6-46.8 43.5-78.1 95.4-93 131.1-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64-11.5 0-22.3-3-31.7-8.4-1 10.9-.1 22.1 2.9 33.2 13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-12.2-45.7-55.5-74.8-101.1-70.8 5.3 9.3 8.4 20.1 8.4 31.7z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {groupedByDate.length === 0 && (
                        <tr>
                          <td className="p-4 text-center text-gray-500" colSpan={3}>
                            No attendance records found for this user.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceList;
