import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getData, postData, putData } from "../../Helpers/api.js";

const SystemUserForm = ({ user, onSuccess, onClose }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "employee",
        location: "",
        password: "",
    });
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);

    const isEdit = !!user;

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                email: user.email || "",
                role: user.role || "employee",
                location: user.location || "",
                password: "", // Keep empty for edit unless changing
            });
        }
    }, [user]);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await getData("/location");
                setLocations((res?.locations || []).map((loc) => loc.name).filter(Boolean));
            } catch (_err) {
                setLocations([]);
            }
        };
        fetchLocations();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = { ...formData };
            if (isEdit && !payload.password) {
                delete payload.password;
            }

            let res;
            if (isEdit) {
                const userId = user?.id || user?._id;
                res = await putData(`/user/${userId}`, payload);
            } else {
                res = await postData("/user/register", payload);
            }

            if (res?.success || res?.status) {
                toast.success(isEdit ? "User updated successfully" : "User created successfully");
                if (onSuccess) onSuccess();
            } else {
                toast.error(res.message || "Operation failed");
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/20 backdrop-blur-sm flex items-center justify-center !m-auto p-4">
            <div className="modal-wrapper">
                {/* CLOSE BUTTON */}
                <button
                    type="button"
                    onClick={onClose}
                    className="modal-close-btn"
                >
                    ✕
                </button>

                <div className="modal-container" style={{ width: '550px', maxWidth: '95vw' }}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">{isEdit ? "Edit System User" : "Add System User"}</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Email Address *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">System Role *</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                                >
                                    <option value="superadmin">Super Admin</option>
                                    <option value="admin">Admin</option>
                                    <option value="hr">HR</option>
                                    <option value="manager">Manager</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="employee">Employee</option>
                                    <option value="contractor">Contractor</option>
                                    <option value="visitor">Visitor</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Assigned Location</label>
                                <select
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                                >
                                    <option value="">Select Location</option>
                                    {locations.map((loc) => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">
                                    Password {isEdit ? "(Leave blank to keep current)" : "*"}
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required={!isEdit}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder={isEdit ? "••••••••" : "Enter password"}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8 pt-4 border-t">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-[#22374e] text-white rounded-lg p-3 font-semibold hover:bg-[#1a2b3d] transition-colors disabled:bg-gray-400"
                            >
                                {loading ? "Processing..." : isEdit ? "Update System User" : "Create System User"}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-gray-100 text-gray-700 rounded-lg p-3 font-semibold hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SystemUserForm;
