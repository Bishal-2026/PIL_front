import React, { useEffect, useState } from "react";
import CustomDataTable from "../../../Common/Customsdatatable.js";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API, deleteData, putData } from "../../../Helpers/api.js";
import { useUser } from "../../../Helpers/Context/UserContext.js";
import { capitalizeFirstLetter } from "../../../Helpers/CapitalizeFirstLetter.js";
import { can, normalizeRole } from "../../../Helpers/acl.js";

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
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = location.pathname.includes("/dashboard/employee")
    ? "/dashboard/employee"
    : "/dashboard/users";

  const fetchVisitors = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await API.getVisitors(searchTerm, currentPage, rowsPerPage, {
        sessionStatus: sessionFilter || undefined,
      });
      if (Array.isArray(response.visitors)) {
        setData(response.visitors);
        setTotalRows(
          response.total ??
          response.pagination?.totalrecords ??
          response.visitors.length
        );
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
    const normalized = String(status || "").toLowerCase();
    const isLoggedIn = normalized === "logged in";
    const label = isLoggedIn ? "Online" : "Offline";
    return (
      <span
        className={`px-3 py-0.5 rounded-lg font-medium text-sm ${isLoggedIn
          ? "bg-green-100 text-green-800 border border-green-300"
          : "bg-red-100 text-red-600 border border-red-300"
          }`}
      >
        {label}
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
      name: "Name",
      selector: (row) => {
        const name = capitalizeFirstLetter(row.name || "-");
        return (
          <button
            type="button"
            onClick={() => openUserOverview(row, "details")}
            className="font-bold text-[#22374E] hover:underline whitespace-nowrap"
          >
            {name}
          </button>
        );
      },
    },
    {
      name: "Employee ID",
      selector: (row) => row.employeeId || row._id || "-",
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
      name: "Name / Employee ID",
      selector: (row) => {
        const name = capitalizeFirstLetter(row.name || "-");
        const empId = row.employeeId || row._id || "-";
        return (
          <button
            type="button"
            onClick={() => openUserOverview(row, "details")}
            className="block text-left whitespace-normal leading-tight w-full p-0 m-0 border-none bg-transparent"
            title="View details"
            style={{ textAlign: "left" }}
          >
            <div
              className="flex flex-col items-start text-left p-0 m-0 w-full"
              style={{ textAlign: 'left' }}
            >
              <span className="font-bold text-[#22374e] text-base leading-tight hover:underline text-nowrap">
                {name}
              </span>
              <span className="text-xs text-gray-500 font-bold uppercase mt-1 leading-none">
                {empId}
              </span>
            </div>
          </button>
        );
      },
      width: "20%",
    },
    {
      name: "Location",
      selector: (row) => row.location || "-",
      width: "15%",
    },
    {
      name: "Device",
      selector: (row) => {
        const dId = row.deviceId || "-";
        const empId = row.employeeId || row._id || row.id;
        const isLoggedIn = String(row.sessionStatus || "").toLowerCase() === "logged in";
        return (
          <div className="flex flex-col items-start text-left">
            {dId !== "-" ? (
              <button
                onClick={() => navigate(`/dashboard/users/device?employeeId=${encodeURIComponent(String(empId))}`)}
                className="text-[#22374e] hover:underline font-bold text-sm leading-tight text-nowrap"
              >
                {dId}
              </button>
            ) : (
              <span className="text-gray-400 font-bold text-sm">-</span>
            )}
            <span className={`text-[10px] font-bold uppercase mt-1 leading-none ${isLoggedIn ? 'text-green-600' : 'text-red-500'}`}>
              {isLoggedIn ? "Online" : "Offline"}
            </span>
          </div>
        );
      },
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
    </div>
  );
};

export default VisitorsList;
