// Location/Add.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdAddLocationAlt } from "react-icons/md";
import { getData, postData } from "../../../Helpers/api.js";

const LocationAdd = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [selectedVendorCode, setSelectedVendorCode] = useState("");
  const [vendorForm, setVendorForm] = useState({ name: "", vendorCode: "" });
  const [vendorError, setVendorError] = useState("");
  const [isVendorFormOpen, setIsVendorFormOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    lat: "",
    long: "",
    radius: "",
  });
  const [error, setError] = useState("");

  const vendorOptions = useMemo(() => {
    return Array.isArray(vendors) ? vendors : [];
  }, [vendors]);

  const loadVendors = async () => {
    setVendorError("");
    try {
      const res = await getData("/vendors");
      setVendors(res?.vendors || []);
    } catch (_err) {
      setVendors([]);
      setVendorError("Failed to load vendors.");
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const createVendor = async () => {
    setVendorError("");
    try {
      const payload = {
        name: String(vendorForm.name || "").trim(),
        vendorCode: String(vendorForm.vendorCode || "").trim().toUpperCase(),
      };
      if (!payload.name) {
        setVendorError("Company name is required.");
        return;
      }
      if (!payload.vendorCode) {
        setVendorError("Vendor code is required.");
        return;
      }
      const res = await postData("/vendors", payload);
      if (!res?.status) {
        setVendorError(res?.message || "Failed to create vendor.");
        return;
      }
      await loadVendors();
      setSelectedVendorCode(payload.vendorCode);
      setVendorForm({ name: "", vendorCode: "" });
      setIsVendorFormOpen(false);
    } catch (_err) {
      setVendorError("Failed to create vendor.");
    }
  };

  const save = async () => {
    setError("");
    try {
      if (!selectedVendorCode) {
        setError("Vendor code is required.");
        return;
      }
      const payload = {
        name: form.name,
        vendorCode: selectedVendorCode,
        lat: form.lat,
        lng: form.long,
        radius: form.radius,
      };
      const res = await postData("/location/add", payload);
      if (res?.status) {
        navigate("/dashboard/users/location");
        return;
      }
      setError(res?.message || "Failed to save location.");
    } catch (err) {
      setError("Failed to save location.");
    }
  };

  return (
    <div className="p-4 sm:p-6 flex justify-center">
      <div className="bg-white shadow-xl rounded-lg p-4 sm:p-6 w-full border border-gray-200 Addnew-location-page">

        {/* ===== HEADER ===== */}
        <div className=" flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 updatelocation-heder-box">

          {/* Title */}
          <div className="flex items-center gap-3">
            <MdAddLocationAlt className="text-blue-600" size={28} />
            <h2 className="text-lg sm:text-xl font-semibold">
              Add New Location
            </h2>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              onClick={save}
              className="py-2 px-4 rounded-lg bg-[#018DD4] text-white hover:bg-blue-700 transition shadow-md min-w-[140px] w-full sm:w-auto"
            >
              Save Location
            </button>
            <button
              onClick={() => navigate("/dashboard/users/location")}
              className="py-2 px-4 rounded-lg border border-gray-400 hover:bg-gray-100 transition min-w-[140px] w-full sm:w-auto !m-0"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* ===== ERROR ===== */}
        {error && (
          <div className="text-red-600 mb-4 text-sm">{error}</div>
        )}

        {/* ===== VENDOR ===== */}
        <div className="mb-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <label className="block text-gray-600 mb-1 font-medium">
                Vendor / Company
              </label>
              <select
                value={selectedVendorCode}
                onChange={(e) => setSelectedVendorCode(e.target.value)}
                className="border rounded-lg p-3 w-full outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="">Select vendor</option>
                {vendorOptions.map((v) => (
                  <option key={v.id || v.vendorCode} value={v.vendorCode}>
                    {(v.vendorCode || "").toUpperCase()} - {v.name}
                  </option>
                ))}
              </select>
              {vendorError ? (
                <div className="text-red-600 mt-2 text-sm">{vendorError}</div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setIsVendorFormOpen(true)}
              className="py-2 px-4 rounded-lg border border-gray-400 hover:bg-gray-100 transition shadow-sm min-w-[140px] w-full sm:w-auto"
            >
              Create Vendor
            </button>
          </div>
        </div>

        {/* ===== CREATE VENDOR MODAL ===== */}
        {isVendorFormOpen ? (
          <div className="modal-overlay">
            <div className="modal-wrapper">
              <button
                type="button"
                onClick={() => setIsVendorFormOpen(false)}
                className="modal-close-btn"
              >
                ✕
              </button>
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Create Vendor
                  </h3>
                </div>

                {vendorError ? (
                  <div className="text-red-600 mb-3 text-sm">{vendorError}</div>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={vendorForm.name}
                      onChange={(e) =>
                        setVendorForm((p) => ({ ...p, name: e.target.value }))
                      }
                      className="border rounded-lg p-3 w-full outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g., Pidilite"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">
                      Vendor Code
                    </label>
                    <input
                      type="text"
                      value={vendorForm.vendorCode}
                      onChange={(e) =>
                        setVendorForm((p) => ({
                          ...p,
                          vendorCode: e.target.value.toUpperCase(),
                        }))
                      }
                      className="border rounded-lg p-3 w-full outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g., PIDILITE"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-5">
                  <button
                    type="button"
                    onClick={() => setIsVendorFormOpen(false)}
                    className="py-2 px-4 rounded-lg border border-gray-400 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={createVendor}
                    className="py-2 px-4 rounded-lg bg-[#018DD4] text-white hover:bg-blue-700 transition shadow-md"
                  >
                    Save Vendor
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* ===== FORM GRID ===== */}
        <div
          className="
        grid
        grid-cols-1
        sm:grid-cols-2
        md:grid-cols-3
        lg:grid-cols-5
        gap-4
        items-end
      "
        >
          {/* Location Name */}
          <div className="lg:col-span-2">
            <label className="block text-gray-600 mb-1 font-medium">
              Location Name
            </label>
            <input
              type="text"
              className="border rounded-lg p-3 w-full outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., Office Entry Gate"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Latitude */}
          <div>
            <label className="block text-gray-600 mb-1 font-medium">Lat</label>
            <input
              type="text"
              className="border rounded-lg p-3 w-full outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter Lat"
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
            />
          </div>

          {/* Longitude */}
          <div>
            <label className="block text-gray-600 mb-1 font-medium">Long</label>
            <input
              type="text"
              className="border rounded-lg p-3 w-full outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter Long"
              value={form.long}
              onChange={(e) => setForm({ ...form, long: e.target.value })}
            />
          </div>

          {/* Radius */}
          <div>
            <label className="block text-gray-600 mb-1 font-medium">
              Radius (in meters)
            </label>
            <input
              type="text"
              className="border rounded-lg p-3 w-full outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., 20"
              value={form.radius}
              onChange={(e) => setForm({ ...form, radius: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>

  );
};

export default LocationAdd;
