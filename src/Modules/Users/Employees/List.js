import React, { useState, useEffect, useRef } from "react";
import CustomDataTable from "../../../Common/Customsdatatable.js";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AddUserForm from "../Add.js";
import EditUserForm from "./Edit.js";
import { API, getData, deleteData, putData } from "../../../Helpers/api.js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../../../Helpers/Context/UserContext.js";
import { can, normalizeRole } from "../../../Helpers/acl.js";

const normalizeSessionStatus = (value) => String(value || "").trim().toLowerCase();
const isLoggedOutStatus = (value) => {
  const normalized = normalizeSessionStatus(value);
  return !normalized || ["logout", "logged out", "out"].includes(normalized);
};

const Employeepage = () => {
  const { user } = useUser();
  const role = normalizeRole(user?.role);
  const canCreateEmployees = role === "superadmin";
  const canUpdateEmployees = can(role, "employees", "update");
  const canDeleteEmployees = can(role, "employees", "delete");
  const canForceLogoutEmployees = role === "superadmin" || role === "admin" || role === "hr";
  const canManageDevices = role === "superadmin" || role === "admin";
  const canManageEmployees = canUpdateEmployees || canDeleteEmployees;
  const [data, setData] = useState([]);
  // const [selectedUsers, setselectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [isAddUserFormVisible, setIsAddUserFormVisible] = useState(false);
  const [isEditUserFormVisible, setIsEditUserFormVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const [allEmployees, setAllEmployees] = useState([]);




  const [searchTerm, setSearchTerm] = useState("");
  const fetchemployees = async () => {
    setLoading(true);
    try {
      const response = await API.getEmployees(searchTerm, currentPage, rowsPerPage);

      if (Array.isArray(response.employees)) {
        setAllEmployees(response.employees);
        setData(response.employees);
        setTotalRows(
          response.total ??
          response.pagination?.totalrecords ??
          response.employees.length
        );
      } else {
        setError("No employee data found");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchemployees();
  }, [currentPage, rowsPerPage, searchTerm]);


  const getRowId = (row) => row?.id || row?._id;

  const handleCheckboxChange = (id) => {
    if (!id) return;
    setSelectedUsers((prev) =>
      prev.includes(id)
        ? prev.filter((uid) => uid !== id)
        : [...prev, id]
    );
  };


  const handleSelectAllChange = () => {
    if (selectedUsers.length === data.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(data.map((row) => row.id || row._id).filter(Boolean));
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await putData(`/employees/${id}`, {
        teachers: [id],
        status,
      });

      if (res.status) {
        toast.success("Status updated");
        fetchemployees();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const sessionBadge = (status) => {
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

  const handleForceLogout = async (row) => {
    if (!canForceLogoutEmployees) {
      toast.error("You don't have permission to force logout employees.");
      return;
    }
    if (!row?._id && !row?.id) return;
    if (isLoggedOutStatus(row.sessionStatus)) {
      toast.info("Employee is already logged out");
      return;
    }
    if (!window.confirm("Force logout this employee?")) return;
    try {
      const res = await putData(
        `/employees/${row._id || row.id}/session-status`,
        { sessionStatus: "Logout" }
      );
      if (res?.status) {
        toast.success("Employee logged out");
        fetchemployees();
      } else {
        toast.error(res?.message || "Failed to logout");
      }
    } catch (err) {
      toast.error("Failed to logout");
    }
  };

  const handleDelete = async (id) => {
    if (!canDeleteEmployees) {
      toast.error("You don't have permission to delete employees.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this employee?")) return;

    try {
      const res = await deleteData(`/employee/${id}`);

      if (res?.status === true || res?.success === true) {
        toast.success("Employee deleted successfully");
        fetchemployees();
      } else {
        toast.error(res?.message || "Delete failed");
      }
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const openUserOverview = (row, sectionId = "") => {
    const id = row?.employeeId || row?.id || row?._id;
    if (!id) return;
    const hash = sectionId ? `#${sectionId}` : "";
    const prefix = (location.pathname || "").startsWith("/dashboard/employee")
      ? "/dashboard/employee"
      : "/dashboard/users";
    navigate(`${prefix}/employees/user/${encodeURIComponent(String(id))}${hash}`);
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


  const columns = [
    {
      name: "Name / Employee ID",
      selector: (row) => {
        const name = row.name || row.firstName || "";
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
              <span className="font-bold text-[#22374e] text-base leading-tight hover:underline">
                {name || "-"}
              </span>
              <span className="text-xs text-gray-500 font-bold uppercase mt-1 leading-none">
                {empId}
              </span>
            </div>
          </button>
        );
      },
      width: "18%",
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
                className="text-[#22374e] hover:underline font-bold text-sm leading-tight whitespace-nowrap"
              >
                {dId}
              </button>
            ) : (
              <span className="text-gray-400 font-bold text-sm whitespace-nowrap">-</span>
            )}
            <span className={`text-[10px] font-bold uppercase mt-1 leading-none ${isLoggedIn ? 'text-green-600' : 'text-red-500'}`}>
              {isLoggedIn ? "Online" : "Offline"}
            </span>
          </div>
        );
      },
      width: "auto",
    },

    ...(canManageEmployees || canForceLogoutEmployees
      ? [
        {
          name: "Actions",
          width: "14%",
          selector: (row) => (
            <div className="flex space-x-2 justify-center">
              <div className="flex space-x-2  ">
                {/* {canUpdateEmployees && (
                  <button
                    className="text-blue-500"
                    onClick={() => handleEdit(row._id)}// ✅ updated
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
                )} */}
              </div>
              <div className="flex space-x-2 ">
                {canDeleteEmployees && (
                  <button
                    className="text-red-500"
                    onClick={() => handleDelete(row._id)}
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
              <div className="flex space-x-2 ">
                {canForceLogoutEmployees && (
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

  const mobileColumns = [
    {
      name: "Name",
      selector: (row) => {
        const name = row.name || row.firstName || "-";
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
          {/* {canUpdateEmployees && (
            <button onClick={() => handleEdit(row._id)}>
              <svg fill="#22374e" width={18} height={18} viewBox="0 0 640 512"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l293.1 0c-3.1-8.8-3.7-18.4-1.4-27.8l15-60.1c2.8-11.3 8.6-21.5 16.8-29.7l40.3-40.3c-32.1-31-75.7-50.1-123.9-50.1l-91.4 0zm435.5-68.3c-15.6-15.6-40.9-15.6-56.6 0l-29.4 29.4 71 71 29.4-29.4c15.6-15.6 15.6-40.9 0-56.6l-14.4-14.4zM375.9 417c-4.1 4.1-7 9.2-8.4 14.9l-15 60.1c-1.4 5.5 .2 11.2 4.2 15.2s9.7 5.6 15.2 4.2l60.1-15c5.6-1.4 10.8-4.3 14.9-8.4L576.1 358.7l-71-71L375.9 417z" /></svg>
            </button>
          )} */}
          {canDeleteEmployees && (
            <button onClick={() => handleDelete(row._id)}>
              <svg fill="red" width={16} height={16} viewBox="0 0 448 512"><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
            </button>
          )}
          {canForceLogoutEmployees && (
            <button onClick={() => handleForceLogout(row)}>
              <svg fill="#374151" width={16} height={16} viewBox="0 0 512 512"><path d="M502.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-96-96c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 224H192c-17.7 0-32 14.3-32 32s14.3 32 32 32H402.7l-41.4 41.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l96-96zM320 112c0-17.7-14.3-32-32-32H128C57.3 80 0 137.3 0 208V304c0 70.7 57.3 128 128 128H288c17.7 0 32-14.3 32-32s-14.3-32-32-32H128c-35.3 0-64-28.7-64-64V208c0-35.3 28.7-64 64-64H288c17.7 0 32-14.3 32-32z" /></svg>
            </button>
          )}
        </div>
      )
    }
  ];
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value); // Update the search term
  };

  const handleEdit = async (userId) => {
    if (!canUpdateEmployees) {
      toast.error("You don't have permission to edit employees.");
      return;
    }
    try {
      setLoading(true);

      const res = await getData(`/employee/${userId}`);

      if (res?.employee) {
        setSelectedUser(res.employee);
        setIsEditUserFormVisible(true);
      } else {
        toast.error("Employee not found");
      }
    } catch (error) {
      toast.error("Failed to load employee");
    } finally {
      setLoading(false);
    }
  };



  // selected userlist delete
  const handleDeleteUser = async () => {
    if (!canDeleteEmployees) {
      toast.error("You don't have permission to delete employees.");
      return;
    }
    if (selectedUsers.length === 0) {
      toast.error("Select at least one row");
      return;
    }

    const validUsers = selectedUsers.filter(
      (id) => /^[0-9a-fA-F]{24}$/.test(id) // Validate MongoDB ObjectId
    );

    if (validUsers.length === 0) {
      alert("Invalid user IDs provided.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${validUsers.length} employee(s)?`
    );
    if (!confirmDelete) return;

    try {
      // Delete each selected employee one by one
      for (const id of validUsers) {
        await deleteData(`/employee/${id}`);
      }

      toast.success("✅ Employees deleted successfully!");
      fetchemployees(); // Refresh the list
    } catch (error) {
      console.error("❌ Error deleting employees:", error);
      toast.error("Failed to delete employees. Please try again.");
    }
  };

  const toggleAddUserForm = () => {
    setIsAddUserFormVisible((prev) => !prev); // Toggle form visibility
  };

  const toggleEditUserForm = () => {
    setIsEditUserFormVisible(false);
    setSelectedUser(null);
  };
  return (
    <div className="m-0">
      {/* <!-- Employee list Departments  Card --> */}
      <div className="relative p-4 !m-0 ">

        <div class="bg-white p-4 rounded-lg text-gray-700 font-semibold text-xl flex gap-4 list-user-title">
          <svg width="20"
            fill="#22374e"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512">
            <path d="M128 136c0-22.1-17.9-40-40-40L40 96C17.9 96 0 113.9 0 136l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm0 192c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm32-192l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM288 328c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm32-192l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM448 328c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48z">
            </path>
          </svg>List of Employees</div>
        <div className="button-crm">
          <div className="status-dropdown-section flex gap-4">

            {/* -----Search bar---  */}

            <div className="input-search-bar flex ">
              <input
                type="text"
                id="search"
                name="search"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search"
                className="border rounded p-2 "
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

            {/* <div className="outer-delete-section">
            <button
              className="apply-section"
            // onClick={() => handleDeleteClick(user)}
            >
              <svg
                fill="#fff"
                width={20}
                height={20}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 512"
              >
                <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3zM472 200l144 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-144 0c-13.3 0-24-10.7-24-24s10.7-24 24-24z" />
              </svg>
              <div onClick={handleDeleteUser}>Delete</div>
            </button>
          </div> */}
          </div>

          <div className="combine-export-section">


            {/* <div className="add-new-employee-button">
              {canCreateEmployees && (
                <button
                  className="crm-buttonsection"
                  onClick={toggleAddUserForm}
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
                  Add Employees
                </button>
              )}
            </div> */}
          </div>
        </div>
        {/* Toast Notifications */}
        {/* Error message */}
        {error && <div className="text-red-500">{error}</div>}

        {/* Loading state */}
        {loading ? (
          <div>Loading...</div>
        ) : (
          <CustomDataTable
            columns={columns}
            mobileColumns={mobileColumns}
            data={data}
            totalRows={totalRows}
            rowsPerPageOptions={[10, 20, 50, 100, 500, 1000]}
            defaultRowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            currentPage={currentPage}
          />
        )}
        {/* Add User Form Center Modal */}
        {isAddUserFormVisible && (
          <AddUserForm
            onSuccess={() => {
              toggleAddUserForm();
              fetchemployees();
            }}
            onClose={() => {
              toggleAddUserForm();
            }}
          />
        )}


        {/* Edit User Form Center Modal */}
        {isEditUserFormVisible && selectedUser && (
          <EditUserForm
            user={selectedUser}
            onClose={() => {
              setIsEditUserFormVisible(false);
              setSelectedUser(null);
            }}
            onSuccess={() => {
              setIsEditUserFormVisible(false);
              setSelectedUser(null);
              fetchemployees();
            }}
          />
        )}

      </div>
    </div>

  );
};

export default Employeepage;
