import React, { useEffect, useState } from "react";
import CustomDataTable from "../../../Common/Customsdatatable.js";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API, deleteData, putData } from "../../../Helpers/api.js";
import { useUser } from "../../../Helpers/Context/UserContext.js";
import { capitalizeFirstLetter } from "../../../Helpers/CapitalizeFirstLetter.js";
import { can, normalizeRole } from "../../../Helpers/acl.js";
import { User, Clock, MapPin, CheckCircle, UserCheck, MessageSquare, Mail, Phone, Calendar, X } from "lucide-react";

const normalizeSessionStatus = (value) => String(value || "").trim().toLowerCase();
const isLoggedOutStatus = (value) => {
  const normalized = normalizeSessionStatus(value);
  return !normalized || ["logout", "logged out", "out"].includes(normalized);
};

const VisitorsList = () => {
  const { user } = useUser();
  const role = normalizeRole(user?.role);
  const canCreateVisitors = role === "superadmin";
  const canUpdateVisitors = can(role, "visitors", "update");
  const canDeleteVisitors = can(role, "visitors", "delete");
  const canForceLogoutVisitors = role === "superadmin" || role === "admin" || role === "hr";
  const canManageDevices = role === "superadmin" || role === "admin";
  const canManageVisitors = canUpdateVisitors || canDeleteVisitors;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = location.pathname.includes("/dashboard/employee")
    ? "/dashboard/employee"
    : "/dashboard/users";

  const fetchVisitors = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await API.visitorlog.getAll({
        search: searchTerm,
        page: currentPage,
        limit: rowsPerPage,
        status: ["Approved", "CheckedIn", "CheckedOut"] 
      });
      if (Array.isArray(response.data)) {
        setData(response.data);
        setTotalRows(response.total || response.data.length);
      } else {
        setError("No visitor data found");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [currentPage, rowsPerPage, searchTerm, sessionFilter]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  };

  const statusBadge = (status) => {
    const s = String(status || "Approved").toLowerCase();
    
    if (s === "pending") {
      return (
        <span className="px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-widest border-2 bg-amber-100 text-amber-700 border-amber-200">
          Pending
        </span>
      );
    }
    
    if (s === "declined") {
      return (
        <span className="px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-widest border-2 bg-rose-100 text-rose-700 border-rose-200">
          Declined
        </span>
      );
    }

    let config = { label: "Authorized", className: "bg-blue-100 text-blue-700 border-blue-200" };
    
    if (s === "checkedin" || s === "checked in") {
      config = { label: "Checked In", className: "bg-green-100 text-green-700 border-green-200" };
    } else if (s === "checkedout" || s === "checked out") {
      config = { label: "Checked Out", className: "bg-gray-100 text-gray-700 border-gray-200" };
    } else if (s === "approved") {
      config = { label: "Approved", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    }
    
    return (
      <span className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-widest border-2 ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const handleDelete = async (row) => {
    if (!canDeleteVisitors) {
      toast.error("You don't have permission to delete visitors.");
      return;
    }
    if (!row?._id && !row?.id) return;
    if (!window.confirm("Are you sure you want to delete this visitor?")) return;
    try {
      const res = await deleteData(`/visitors/${row._id || row.id}`);
      if (res?.status === true || res?.success === true) {
        toast.success("Visitor deleted successfully");
        fetchVisitors();
      } else {
        toast.error(res?.message || "Delete failed");
      }
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleForceLogout = async (row) => {
    if (!canForceLogoutVisitors) {
      toast.error("You don't have permission to force logout visitors.");
      return;
    }
    if (!row?._id && !row?.id) return;
    if (isLoggedOutStatus(row.sessionStatus)) {
      toast.info("Visitor is already logged out");
      return;
    }
    if (!window.confirm("Force logout this visitor?")) return;
    try {
      const res = await putData(
        `/visitors/${row._id || row.id}/session-status`,
        { sessionStatus: "Logout" }
      );
      if (res?.status) {
        toast.success("Visitor logged out");
        fetchVisitors();
      } else {
        toast.error(res?.message || "Failed to logout");
      }
    } catch (err) {
      toast.error("Failed to logout");
    }
  };

  const openVisitorDetails = (row) => {
    setSelectedVisitor(row);
    setShowModal(true);
  };

  const openUserOverview = (row, sectionId = "") => {
    const id = row?.employeeId || row?.id || row?._id;
    if (!id) return;
    const hash = sectionId ? `#${sectionId}` : "";
    const prefix = (location.pathname || "").startsWith("/dashboard/employee")
      ? "/dashboard/employee"
      : "/dashboard/users";
    navigate(`${prefix}/visitors/user/${encodeURIComponent(String(id))}${hash}`);
  };

  const openDeviceModalFromList = (row) => {
    const empId = row?.employeeId || row?.id || row?._id;
    if (!empId) return;
    navigate(
      `/dashboard/users/device?employeeId=${encodeURIComponent(
        String(empId)
      )}&openModal=1`
    );
  };

  const mobileColumns = [
    {
      name: "Visitor",
      selector: (row) => {
        const name = capitalizeFirstLetter(row.name || row.visitorName || "-");
        const vid = row.visitorId || "Pending";
        return (
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => openVisitorDetails(row)}
              className="font-bold text-[#22374E] hover:underline whitespace-nowrap text-left"
            >
              {name}
            </button>
            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter leading-none mt-1">
              ID: {vid}
            </span>
          </div>
        );
      },
    },
    {
      name: "Location",
      selector: (row) => row.location || "-",
    },
    {
      name: "Device",
      selector: (row) => {
        const dId = row.deviceId || "-";
        const empId = row.employeeId || row._id || row.id;
        const isLoggedIn = String(row.sessionStatus || "").toLowerCase() === "logged in";
        return (
          <div className="flex flex-col items-end text-right w-full overflow-hidden">
            {dId !== "-" ? (
              <button
                onClick={() => navigate(`/dashboard/users/device?employeeId=${encodeURIComponent(String(empId))}`)}
                className="text-[#22374E] hover:underline font-bold text-sm whitespace-nowrap block w-full text-right"
              >
                {dId}
              </button>
            ) : (
              <span className="text-gray-400 font-bold whitespace-nowrap">-</span>
            )}
            <span className={`text-[10px] font-bold uppercase mt-1 whitespace-nowrap ${isLoggedIn ? 'text-green-600' : 'text-red-500'}`}>
              {isLoggedIn ? "Online" : "Offline"}
            </span>
          </div>
        );
      },
    },
    {
      name: "Actions",
      selector: (row) => (
        <div className="flex space-x-3 justify-end">
          {canUpdateVisitors && (
            <button onClick={() => navigate(`${basePath}/visitors/edit/${row.id || row._id}`)}>
              <svg fill="#22374e" width={18} height={18} viewBox="0 0 640 512"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l293.1 0c-3.1-8.8-3.7-18.4-1.4-27.8l15-60.1c2.8-11.3 8.6-21.5 16.8-29.7l40.3-40.3c-32.1-31-75.7-50.1-123.9-50.1l-91.4 0zm435.5-68.3c-15.6-15.6-40.9-15.6-56.6 0l-29.4 29.4 71 71 29.4-29.4c15.6-15.6 15.6-40.9 0-56.6l-14.4-14.4zM375.9 417c-4.1 4.1-7 9.2-8.4 14.9l-15 60.1c-1.4 5.5 .2 11.2 4.2 15.2s9.7 5.6 15.2 4.2l60.1-15c5.6-1.4 10.8-4.3 14.9-8.4L576.1 358.7l-71-71L375.9 417z" /></svg>
            </button>
          )}
          {canDeleteVisitors && (
            <button onClick={() => handleDelete(row)}>
              <svg fill="red" width={16} height={16} viewBox="0 0 448 512"><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
            </button>
          )}
          {canForceLogoutVisitors && (
            <button onClick={() => handleForceLogout(row)}>
              <svg fill="#374151" width={16} height={16} viewBox="0 0 512 512"><path d="M502.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-96-96c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 224H192c-17.7 0-32 14.3-32 32s14.3 32 32 32H402.7l-41.4 41.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l96-96zM320 112c0-17.7-14.3-32-32-32H128C57.3 80 0 137.3 0 208V304c0 70.7 57.3 128 128 128H288c17.7 0 32-14.3 32-32s-14.3-32-32-32H128c-35.3 0-64-28.7-64-64V208c0-35.3 28.7-64 64-64H288c17.7 0 32-14.3 32-32z" /></svg>
            </button>
          )}
        </div>
      )
    }
  ];

  const columns = [
    {
      name: "Visitor ID",
      selector: (row) => (
        <span className="font-black text-indigo-600 text-xs tracking-tighter uppercase">
          {row.visitorId || "Pending"}
        </span>
      ),
      width: "15%",
    },
    {
      name: "Visit Details",
      selector: (row) => {
        const name = capitalizeFirstLetter(row.name || row.visitorName || "-");
        const hostName = row.employeeName || "Unknown Host";
        const hostId = row.employeeId || "-";
        const time = row.timeSlot || "Not specified";
        const remark = row.remark || row.reason || "";
        
        return (
          <div className="py-1 flex flex-col min-w-[180px]">
            <span className="font-bold text-[#1e293b] text-sm leading-none mb-1">
              {name}
            </span>
            <div className="flex items-center gap-2 text-[9px] uppercase font-black text-indigo-600/70 tracking-tighter">
                <span>HOST: {hostName}</span>
                <span className="text-gray-300">|</span>
                <span className="text-orange-500 flex items-center gap-1"><Clock size={10} /> {time}</span>
            </div>
            {remark && (
              <p className="text-[10px] text-gray-400 font-medium italic truncate mt-0.5 line-clamp-1">
                "{remark}"
              </p>
            )}
          </div>
        );
      },
      width: "40%",
    },
    {
      name: "Status",
      selector: (row) => (
        <div className="flex flex-col items-start scale-90 -ml-2">
            {statusBadge(row.status)}
            <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-1">
                {formatDate(row.visitDate).split(',')[0]}
            </span>
        </div>
      ),
      width: "12%",
    },
    {
      name: "Location",
      selector: (row) => (
        <div className="flex flex-col">
            <span className="font-bold text-gray-700 text-xs">{row.location || "-"}</span>
        </div>
      ),
      width: "15%",
    },
    ...(canManageVisitors || canForceLogoutVisitors
      ? [
        {
          name: "Actions",
          width: "20%",
          selector: (row) => (
            <div className="flex space-x-2 justify-center">
              <div className="flex space-x-2">
                {canUpdateVisitors && (
                  <button
                    className="text-blue-500"
                    onClick={() =>
                      navigate(`${basePath}/visitors/edit/${row.id || row._id}`)
                    }
                  >
                    <svg
                      fill="#22374e"
                      width={20}
                      height={20}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 640 512"
                    >
                      <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l293.1 0c-3.1-8.8-3.7-18.4-1.4-27.8l15-60.1c2.8-11.3 8.6-21.5 16.8-29.7l40.3-40.3c-32.1-31-75.7-50.1-123.9-50.1l-91.4 0zm435.5-68.3c-15.6-15.6-40.9-15.6-56.6 0l-29.4 29.4 71 71 29.4-29.4c15.6-15.6 15.6-40.9 0-56.6l-14.4-14.4zM375.9 417c-4.1 4.1-7 9.2-8.4 14.9l-15 60.1c-1.4 5.5 .2 11.2 4.2 15.2s9.7 5.6 15.2 4.2l60.1-15c5.6-1.4 10.8-4.3 14.9-8.4L576.1 358.7l-71-71L375.9 417z" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex space-x-2">
                {canDeleteVisitors && (
                  <button
                    className="text-red-500"
                    onClick={() => handleDelete(row)}
                  >
                    <svg
                      fill="red"
                      width={16}
                      height={16}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 448 512"
                    >
                      <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex space-x-2">
                {canForceLogoutVisitors && (
                  <button
                    className="text-gray-700"
                    onClick={() => handleForceLogout(row)}
                    title="Force logout"
                  >
                    <svg
                      fill="#374151"
                      width={16}
                      height={16}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                    >
                      <path d="M502.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-96-96c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 224H192c-17.7 0-32 14.3-32 32s14.3 32 32 32H402.7l-41.4 41.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l96-96zM320 112c0-17.7-14.3-32-32-32H128C57.3 80 0 137.3 0 208V304c0 70.7 57.3 128 128 128H288c17.7 0 32-14.3 32-32s-14.3-32-32-32H128c-35.3 0-64-28.7-64-64V208c0-35.3 28.7-64 64-64H288c17.7 0 32-14.3 32-32z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ),
        },
      ]
      : []),
  ];


  return (
    <div className="m-0">
      <div className="relative p-4 !m-0">
        <div className="bg-white p-4 rounded-lg text-gray-700 font-semibold text-xl flex gap-4 list-user-title">
          <svg
            width="20"
            fill="#22374e"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
          >
            <path d="M128 136c0-22.1-17.9-40-40-40L40 96C17.9 96 0 113.9 0 136l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm0 192c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm32-192l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM288 328c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm32-192l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM448 328c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48z"></path>
          </svg>
          List of Visitors
        </div>

        <div className="button-crm">
          <div className="status-dropdown-section flex gap-4">
            <div className="input-search-bar flex">
              <input
                type="text"
                id="search"
                name="search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search"
                className="border rounded p-2"
              />
              <div className="searching-log flex items-center">
                <svg
                  fill="#22374e"
                  width={16}
                  height={16}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
                </svg>
              </div>
            </div>

            <div className="status-select-option-dropdown first-left form-item">
              <select
                name="sessionStatus"
                value={sessionFilter}
                onChange={(e) => {
                  setSessionFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Sessions</option>
                <option value="Logged In">Online</option>
                <option value="Logout">Offline</option>
              </select>
            </div>
          </div>
          {canCreateVisitors && (
            <div className="add-new-employee-button">
              <button
                className="crm-buttonsection"
                onClick={() => navigate(`${basePath}/visitors/add`)}
              >
                <svg
                  fill="white"
                  width={20}
                  height={20}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 512"
                >
                  <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3zM504 312l0-64-64 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l64 0 0-64c0-13.3 10.7-24 24-24s24 10.7 24 24l0 64 64 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-64 0 0 64c0 13.3-10.7 24-24 24s-24-10.7-24-24z" />
                </svg>
                Add Visitors
              </button>
            </div>
          )}
        </div>

        {error && <div className="text-red-500">{error}</div>}

        {loading ? (
          <div>Loading...</div>
        ) : (
          <CustomDataTable
            columns={columns}
            mobileColumns={mobileColumns}
            data={data}
            totalRows={totalRows}
            rowsPerPageOptions={[10, 20, 50, 100]}
            defaultRowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            currentPage={currentPage}
          />
        )}
      </div>

      {/* 🟢 Visitor Details Modal */}
      {showModal && selectedVisitor && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#22374e] to-[#123b5d] p-8 text-white relative">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg">
                  {selectedVisitor.visitorImage ? (
                    <img 
                      src={selectedVisitor.visitorImage} 
                      alt="Visitor" 
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-[#22374e] rounded-xl font-bold text-3xl">
                      {selectedVisitor.visitorName?.charAt(0) || "V"}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">{selectedVisitor.visitorName}</h2>
                  <div className="flex items-center gap-2 mt-2 opacity-90">
                    <span className="px-3 py-1 bg-white/20 rounded-lg text-xs font-black uppercase tracking-widest">
                      {selectedVisitor.visitorId}
                    </span>
                    <span className="px-3 py-1 bg-green-500/30 border border-green-500/50 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle size={12} /> Approved
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50/50">
              {/* Visit Details */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100 pb-2">Visit Intelligence</h3>
                
                <div className="flex items-start gap-4 grow">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Visit Time</p>
                    <p className="text-sm font-bold text-gray-800">{selectedVisitor.timeSlot || "Not specified"}</p>
                    <p className="text-[10px] text-gray-500 font-medium">Date: {formatDate(selectedVisitor.visitDate)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Host Employee</p>
                    <p className="text-sm font-bold text-gray-800">{selectedVisitor.employeeName || "Not assigned"}</p>
                    <p className="text-[10px] text-gray-500 font-medium">Dept: Maintenance / Operations</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Approved By</p>
                    <p className="text-sm font-bold text-[#1e293b]">{selectedVisitor.approvedBy || "Administrator"}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Authorized Site Admin</p>
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100 pb-2">Identification</h3>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</p>
                    <p className="text-sm font-bold text-gray-800 break-all">{selectedVisitor.visitorEmail || "No email"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phone Contact</p>
                    <p className="text-sm font-bold text-gray-800">{selectedVisitor.visitorPhone || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Visit Remark</p>
                    <p className="text-sm font-bold text-gray-600 italic">"{selectedVisitor.remark || "Regular Visit"}"</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="px-6 py-2 rounded-xl bg-gray-100 text-gray-700 font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
              >
                Close Profile
              </button>
              <button 
                onClick={() => window.print()}
                className="px-6 py-2 rounded-xl bg-[#22374e] text-white font-black uppercase tracking-widest text-xs hover:shadow-lg transition-all"
              >
                Print Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorsList;
