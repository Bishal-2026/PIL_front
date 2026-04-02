import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getData } from "../../Helpers/api";
import CustomDataTable from "../../Common/Customsdatatable";

const DEFAULT_ROWS_PER_PAGE = 10;
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];
const VIEW_OPTIONS = [
    { value: "not_logged_in", label: "Not Logged In" },
    { value: "login", label: "Login Records" },
    { value: "logout", label: "Logout Records" },
    { value: "normal", label: "Normal Warnings" },
];

const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getStatusBadgeClass = (statusLabel) => {
    const normalized = String(statusLabel || "").toLowerCase();
    if (normalized.includes("not logged")) {
        return "bg-red-50 text-red-600 border-red-100";
    }
    if (normalized.includes("logged in")) {
        return "bg-green-50 text-green-600 border-green-100";
    }
    return "bg-red-50 text-red-600 border-red-100";
};

const WarningsPage = () => {
    const [viewMode, setViewMode] = useState("not_logged_in");
    const [rows, setRows] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [date, setDate] = useState(getTodayDate());
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
    const navigate = useNavigate();
    const location = useLocation();

    const openUserOverview = (id, hash = "") => {
        if (!id) return;
        const prefix = (location.pathname || "").startsWith("/dashboard/employee")
            ? "/dashboard/employee"
            : "/dashboard/users";
        navigate(`${prefix}/employees/user/${encodeURIComponent(String(id))}${hash}`);
    };

    const openDeviceModal = (id) => {
        if (!id) return;
        navigate(`/dashboard/users/device?employeeId=${encodeURIComponent(String(id))}&openModal=1`);
    };

    const selectedView = useMemo(
        () => VIEW_OPTIONS.find((option) => option.value === viewMode) || VIEW_OPTIONS[0],
        [viewMode]
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [viewMode, search, date, rowsPerPage]);

    useEffect(() => {
        const fetchRows = async () => {
            setLoading(true);
            try {
                if (viewMode === "not_logged_in") {
                    const res = await getData("/attendance/not-logged-in", {
                        page: currentPage,
                        limit: rowsPerPage,
                        date,
                        search,
                    });

                    const normalized = Array.isArray(res?.data)
                        ? res.data.map((item) => ({
                            id: item.id,
                            name: item.userName || "Unknown",
                            employeeId: item.employeeId || "-",
                            location: item.location || "-",
                            deviceId: item.deviceId || "-",
                            statusLabel: item.statusLabel || "Not Logged In",
                            actionTime: item.actionTime || null,
                        }))
                        : [];

                    setRows(normalized);
                    setTotalRecords(res?.pagination?.totalrecords || normalized.length);
                    return;
                }

                if (viewMode === "normal") {
                    const res = await getData("/activity/notifications", {
                        search: "Working Hours Violation",
                        page: currentPage - 1,
                        limit: rowsPerPage,
                    });

                    const filtered = Array.isArray(res?.data)
                        ? res.data.filter((item) => item.activityType === "Working Hours Violation")
                        : [];

                    const normalized = filtered.map((item) => ({
                        id: item.id,
                        name: item.name || "Unknown",
                        employeeId: item.employeeId || "-",
                        location: item.location || "-",
                        deviceId: item.deviceId || "-",
                        statusLabel: "Warning",
                        actionTime: item.occurredAt,
                    }));

                    setRows(normalized);
                    setTotalRecords(res?.pagination?.totalrecords || normalized.length);
                    return;
                }

                const res = await getData("/attendance/all", {
                    page: currentPage,
                    limit: rowsPerPage,
                    action: viewMode,
                    date,
                    search,
                });

                const normalized = Array.isArray(res?.data)
                    ? res.data.map((item) => ({
                        id: item.id,
                        name: item.userName || "Unknown",
                        employeeId: item.employeeId || "-",
                        location: item.location || "-",
                        deviceId: item.deviceId || "-",
                        statusLabel: item.statusLabel || (viewMode === "logout" ? "Logged Out" : "Logged In"),
                        actionTime: item.actionTime || item.createdAt,
                    }))
                    : [];

                setRows(normalized);
                setTotalRecords(res?.pagination?.totalrecords || normalized.length);
            } catch (error) {
                console.error("Failed to fetch warning records", error);
                setRows([]);
                setTotalRecords(0);
            } finally {
                setLoading(false);
            }
        };

        fetchRows();
    }, [viewMode, currentPage, search, date, rowsPerPage]);

    const columns = [
        {
            name: "Name / Employee ID",
            selector: (row) => (
                <div className="flex flex-col items-start gap-1.5 text-left !p-0 !m-0 !px-1 w-full">
                    <span
                        className="font-bold text-[#22374e] text-base leading-tight cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => openUserOverview(row.employeeId || row.id, "#details")}
                    >
                        {row.name || "-"}
                    </span>
                    <span className="text-xs text-gray-500 font-bold uppercase mt-1 leading-none">
                        {row.employeeId || "-"}
                    </span>
                </div>
            ),
            width: "18%",
        },
        {
            name: "Location",
            selector: (row) => row.location || "-",
            width: "15%",
        },
        {
            name: "Device",
            selector: (row) => (
                <div className="flex flex-col items-start text-left">
                    <span
                        className="text-[#22374e] font-bold text-sm leading-tight whitespace-nowrap cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => openDeviceModal(row.employeeId || row.id)}
                    >
                        {row.deviceId || "-"}
                    </span>
                </div>
            ),
            width: "25%",
        },
        {
            name: "Status",
            selector: (row) => (
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(row.statusLabel)}`}>
                    {row.statusLabel}
                </span>
            ),
            width: "12%",
        },
        {
            name: "Time",
            selector: (row) => (
                <span className="text-[#22374e] font-semibold text-sm whitespace-nowrap">
                    {row.actionTime ? new Date(row.actionTime).toLocaleString() : "No login today"}
                </span>
            ),
            width: "18%",
        },
    ];

    const mobileColumns = [
        {
            name: "Name",
            selector: (row) => (
                <span
                    className="font-bold text-[#22374E] whitespace-nowrap cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => openUserOverview(row.employeeId || row.id, "#details")}
                >
                    {row.name || "-"}
                </span>
            ),
        },
        {
            name: "Employee ID",
            selector: (row) => row.employeeId || "-",
        },
        {
            name: "Location",
            selector: (row) => row.location || "-",
        },
        {
            name: "Device",
            selector: (row) => (
                <span
                    className="text-gray-800 font-bold whitespace-nowrap cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => openDeviceModal(row.employeeId || row.id)}
                >
                    {row.deviceId || "-"}
                </span>
            ),
        },
        {
            name: "Status",
            selector: (row) => (
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStatusBadgeClass(row.statusLabel)}`}>
                    {row.statusLabel}
                </span>
            ),
        },
        {
            name: "Time",
            selector: (row) => (
                <span className="text-xs text-gray-600 whitespace-nowrap">
                    {row.actionTime ? new Date(row.actionTime).toLocaleString() : "No login today"}
                </span>
            ),
        },
    ];

    return (
        <div className="layout-section-dashboard p-4">
            <div className="bg-white p-4 rounded-lg font-semibold text-xl flex items-center justify-between gap-3 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2">
                    <span className="text-red-500 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                        {selectedView.label}
                    </span>
                    <span className="text-gray-500 text-base">({totalRecords})</span>
                </div>

                <div className="w-full max-w-[240px]">
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
                    >
                        {VIEW_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white p-4 mt-5 rounded-lg flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between shadow-sm border border-gray-100">
                <div className="w-full lg:max-w-[420px]">
                    <input
                        type="text"
                        placeholder="Search name / employee ID / device..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border rounded py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full lg:w-auto">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="border rounded p-2 w-full sm:w-auto"
                        disabled={viewMode === "normal"}
                    />
                    {(viewMode === "not_logged_in" || viewMode === "login" || viewMode === "logout") && (
                        <button
                            onClick={() => {
                                setSearch("");
                                setDate(getTodayDate());
                            }}
                            className="px-4 py-2 border rounded bg-gray-100 hover:bg-gray-200 w-full sm:w-auto text-sm"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-5 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-4">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading records...</div>
                ) : (
                    <CustomDataTable
                        columns={columns}
                        mobileColumns={mobileColumns}
                        data={rows}
                        totalRows={totalRecords}
                        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                        defaultRowsPerPage={DEFAULT_ROWS_PER_PAGE}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        onRowsPerPageChange={setRowsPerPage}
                    />
                )}
            </div>
        </div>
    );
};

export default WarningsPage;
