import React, { useState, useEffect } from "react";
import CustomDataTable from "../../Common/Customsdatatable.js";
import { API } from "../../Helpers/api.js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import debounce from "lodash.debounce";
import SystemUserForm from "./SystemUserForm.js";

const GetUsers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddUserFormVisible, setIsAddUserFormVisible] = useState(false);
  const [isEditUserFormVisible, setIsEditUserFormVisible] = useState(false);

  // ✅ Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage > 0 ? currentPage - 1 : 0,
        limit: rowsPerPage,
      };

      const responseData = await API.getAll("user", params);

      if (responseData?.status || responseData?.success) {
        setData(responseData.data || []);
        setTotalRows(responseData.pagination?.totalrecords || responseData.data?.length || 0);
      } else {
        setData([]);
        setTotalRows(0);
        setError("Failed to fetch users");
      }
    } catch (error) {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, rowsPerPage]);

  // ✅ Debounced search
  const fetchSearchResults = async (term) => {
    try {
      const response = await API.search("user", term, 0, rowsPerPage);
      if (response?.status || response?.success) {
        setData(response.data || []);
        setTotalRows(response.pagination?.totalrecords || response.data?.length || 0);
      } else {
        setData([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const debouncedSearch = debounce(fetchSearchResults, 300);
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term.trim());
  };

  // ✅ Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await API.remove("user", id);
      if (res?.status || res?.success) {
        toast.success("User deleted successfully");
        fetchUsers();
      } else {
        toast.error("Failed to delete user");
      }
    } catch (error) {
      toast.error("Server error while deleting user");
    }
  };

  // ✅ Handle Edit click
  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsEditUserFormVisible(true);
  };

  // ✅ Handle Add click
  const toggleAddUserForm = () => {
    setIsAddUserFormVisible((prev) => !prev);
  };

  const toggleEditUserForm = () => {
    setIsEditUserFormVisible((prev) => !prev);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  const columns = [
    {
      name: "Name / Employee ID",
      selector: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900">{row.name || "-"}</span>
          <span className="text-xs text-gray-500 font-medium">{row.employeeId || row._id || "-"}</span>
        </div>
      ),
      width: "20%",
    },
    {
      name: "Email",
      selector: (row) => row.email || "-",
      width: "25%",
    },
    {
      name: "Role",
      selector: (row) => String(row.role).toUpperCase(),
      width: "10%",
    },
    {
      name: "Location",
      selector: (row) => row.location || "-",
      width: "15%",
    },
    {
      name: "Actions",
      width: "15%",
      selector: (row) => (
        <div className="flex gap-4">
          <button
            className="text-blue-500"
            onClick={() => handleEdit(row)}
            title="Edit User"
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
          <button
            className="text-red-500"
            onClick={() => handleDelete(row.id || row._id)}
            title="Delete User"
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
        </div>
      ),
    },
  ];

  return (
    <div className="relative p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">System Users List</h2>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="border rounded p-2"
          />
          <button
            onClick={toggleAddUserForm}
            className="crm-buttonsection flex items-center gap-2"
          >
            + Add User
          </button>
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <CustomDataTable
          columns={columns}
          data={data}
          totalRows={totalRows}
          rowsPerPageOptions={[10, 20, 50]}
          defaultRowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          currentPage={currentPage}
        />
      )}

      {/* Add User Modal */}
      {isAddUserFormVisible && (
        <SystemUserForm
          onClose={toggleAddUserForm}
          onSuccess={() => {
            fetchUsers();
            toggleAddUserForm();
          }}
        />
      )}

      {/* Edit User Modal */}
      {isEditUserFormVisible && selectedUser && (
        <SystemUserForm
          user={selectedUser}
          onClose={toggleEditUserForm}
          onSuccess={() => {
            fetchUsers();
            toggleEditUserForm();
          }}
        />
      )}
    </div>
  );
};

export default GetUsers;

