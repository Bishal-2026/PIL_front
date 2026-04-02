// import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { deleteData, getData, postData, putData } from "../../../Helpers/api.js";

// const Device = () => {
//   const [selectedDevice, setSelectedDevice] = useState(null);
//   const [showModal, setShowModal] = useState(false);
//   const [deviceList, setDeviceList] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const ITEMS_PER_PAGE = 15;
//   const [currentPage, setCurrentPage] = useState(1);

//   // 🔥 NEW: Sorting state
//   const [sortOrder, setSortOrder] = useState("new"); // new | old

//   // ========================= LOAD DEVICES ========================= //
//   const loadDevices = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const res = await getData("/device");
//       setDeviceList(res?.devices || []);
//     } catch (err) {
//       setError("Failed to load devices.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadDevices();
//   }, []);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [deviceList, sortOrder]);

//   // ========================= HELPERS ========================= //
//   const getDeviceDate = (device) => {
//     return new Date(
//       device?.createdAt ||
//         device?.enrollmentDate ||
//         device?.lastOnline ||
//         device?.lastSeen ||
//         0
//     ).getTime();
//   };

//   const statusBadge = (status) => {
//     const normalized = String(status || "").toUpperCase();
//     const isOnline =
//       normalized === "ONLINE" ||
//       normalized === "ACTIVE" ||
//       normalized === "TRUE" ||
//       normalized === "ON";

//     return isOnline ? (
//       <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
//         Online
//       </span>
//     ) : (
//       <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-semibold">
//         Offline
//       </span>
//     );
//   };

//   const cameraBadge = (blocked) =>
//     blocked ? (
//       <span className="px-2 py-1 bg-red-200 text-red-700 rounded text-xs">
//         Blocked
//       </span>
//     ) : (
//       <span className="px-2 py-1 bg-green-200 text-green-700 rounded text-xs">
//         Allowed
//       </span>
//     );

//   const locationBadge = (on) =>
//     on ? (
//       <span className="px-2 py-1 bg-green-200 text-green-700 rounded text-xs">
//         ON
//       </span>
//     ) : (
//       <span className="px-2 py-1 bg-red-200 text-red-700 rounded text-xs">
//         OFF
//       </span>
//     );

//   const formatDate = (value) => {
//     if (!value) return "-";
//     const d = new Date(value);
//     if (Number.isNaN(d.getTime())) return String(value);
//     return d.toLocaleString();
//   };

//   const getPolicyValue = (device, field) => {
//     if (!device) return false;
//     if (typeof device[field] === "boolean") return device[field];
//     if (typeof device?.devicePolicyState?.[field] === "boolean") {
//       return device.devicePolicyState[field];
//     }
//     return false;
//   };

//   // ========================= SORT + PAGINATION ========================= //
//   const sortedDeviceList = [...deviceList].sort((a, b) => {
//     const dateA = getDeviceDate(a);
//     const dateB = getDeviceDate(b);
//     return sortOrder === "new" ? dateB - dateA : dateA - dateB;
//   });

//   const totalPages = Math.ceil(sortedDeviceList.length / ITEMS_PER_PAGE) || 1;

//   const paginatedDeviceList = sortedDeviceList.slice(
//     (currentPage - 1) * ITEMS_PER_PAGE,
//     currentPage * ITEMS_PER_PAGE
//   );

//   // ========================= MODAL ACTIONS ========================= //
//   const openDeviceModal = (device) => {
//     setSelectedDevice(device);
//     setShowModal(true);
//   };

//   const togglePolicy = async (field) => {
//     if (!selectedDevice?.id) return;
//     try {
//       const res = await putData(`/device/${selectedDevice.id}/policy/toggle`, {
//         field,
//       });
//       if (res?.status && res?.data) {
//         setDeviceList((prev) =>
//           prev.map((d) => (d.id === res.data.id ? res.data : d))
//         );
//         setSelectedDevice(res.data);
//       }
//     } catch {}
//   };

//   const resolveUserId = (device) =>
//     typeof device?.userId === "string"
//       ? device.userId
//       : device?.userId?._id || device?.userId?.id || null;

//   const removeDevice = async () => {
//     if (!selectedDevice) return;
//     const userId = resolveUserId(selectedDevice);
//     const deviceId =
//       selectedDevice.deviceId || selectedDevice.id || selectedDevice._id;

//     if (!window.confirm("Remove this device?")) return;

//     try {
//       const res = userId
//         ? await postData("/device/uninstall", {
//             deviceId,
//             userId,
//             action: "uninstall",
//           })
//         : await deleteData(`/device/${deviceId}`);

//       if (res?.status) {
//         await loadDevices();
//         setShowModal(false);
//       }
//     } catch {}
//   };

//   // ========================= RENDER ========================= //
//   return (
//     <div className="p-4">
//       {/* HEADER */}
//       <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
//         <h2 className="text-xl font-semibold text-gray-700">
//           Device Management
//         </h2>

//         {/* 🔥 SORT DROPDOWN */}
//         <select
//           value={sortOrder}
//           onChange={(e) => setSortOrder(e.target.value)}
//           className="border rounded-lg px-3 py-2 text-sm"
//         >
//           <option value="new">Newest First</option>
//           <option value="old">Oldest First</option>
//         </select>
//       </div>

//       {/* TABLE */}
//       <div className="mt-6 bg-white rounded-xl shadow p-5">
//         {loading && <p>Loading devices...</p>}
//         {!loading && error && <p className="text-red-600">{error}</p>}

//         {!loading && (
//           <table className="w-full hidden lg:table">
//             <thead>
//               <tr className="bg-gray-100 text-gray-700">
//                 <th className="p-3">Device</th>
//                 <th className="p-3">User</th>
//                 <th className="p-3">Employee</th>
//                 <th className="p-3">Status</th>
//                 <th className="p-3">Android</th>
//                 <th className="p-3">App</th>
//                 <th className="p-3">Last Online</th>
//                 <th className="p-3 text-center">Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {paginatedDeviceList.map((device) => (
//                 <tr key={device.id} className="border-b hover:bg-gray-50">
//                   <td className="p-3 font-semibold">
//                     {device.deviceName || device.deviceId || "-"}
//                   </td>
//                   <td className="p-3">{device.userName || "-"}</td>
//                   <td className="p-3">{device.employeeId || "-"}</td>
//                   <td className="p-3">
//                     {statusBadge(device.statusLabel || device.status)}
//                   </td>
//                   <td className="p-3">
//                     {device.osVersion || device.androidVersion || "-"}
//                   </td>
//                   <td className="p-3">{device.appVersion || "-"}</td>
//                   <td className="p-3 text-sm">
//                     {formatDate(device.lastOnline || device.lastSeen)}
//                   </td>
//                   <td className="p-3 text-center">
//                     <button
//                       onClick={() => openDeviceModal(device)}
//                       className="px-3 py-1 bg-gray-100 rounded-lg"
//                     >
//                       View
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}

//         {/* MOBILE LIST (FIXED PAGINATION ✅) */}
//         <div className="lg:hidden space-y-3">
//           {paginatedDeviceList.map((device) => (
//             <div key={device.id} className="border rounded-lg p-3">
//               <div className="font-semibold">
//                 {device.deviceName || device.deviceId}
//               </div>
//               <div className="text-sm text-gray-600">
//                 {formatDate(device.createdAt)}
//               </div>
//               <div className="mt-2">
//                 <button
//                   onClick={() => openDeviceModal(device)}
//                   className="text-blue-600 text-sm"
//                 >
//                   View Details
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* PAGINATION */}
//         <div className="flex justify-between items-center mt-4">
//           <p className="text-sm text-gray-600">
//             Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} –
//             {Math.min(currentPage * ITEMS_PER_PAGE, deviceList.length)} of{" "}
//             {deviceList.length}
//           </p>

//           <div className="flex gap-2">
//             <button
//               onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
//               disabled={currentPage === 1}
//               className="px-3 py-1 border rounded disabled:opacity-50"
//             >
//               Prev
//             </button>
//             <button
//               onClick={() =>
//                 setCurrentPage((p) => Math.min(p + 1, totalPages))
//               }
//               disabled={currentPage === totalPages}
//               className="px-3 py-1 border rounded disabled:opacity-50"
//             >
//               Next
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* MODAL (UNCHANGED CORE LOGIC) */}
//       {showModal && selectedDevice && (
//         <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
//           <div className="bg-white p-6 rounded-xl w-full max-w-xl relative">
//             <button
//               onClick={() => setShowModal(false)}
//               className="absolute top-3 right-4"
//             >
//               ✕
//             </button>

//             <h2 className="text-xl font-bold mb-4">
//               {selectedDevice.deviceName}
//             </h2>

//             <div className="grid grid-cols-2 gap-3">
//               <div>
//                 <strong>Camera</strong>
//                 {cameraBadge(getPolicyValue(selectedDevice, "cameraDisabled"))}
//               </div>
//               <div>
//                 <strong>Location</strong>
//                 {locationBadge(selectedDevice.locationAllowed)}
//               </div>
//             </div>

//             <div className="mt-4 grid grid-cols-2 gap-3">
//               <button
//                 onClick={() => togglePolicy("cameraDisabled")}
//                 className="py-2 bg-blue-600 text-white rounded"
//               >
//                 Toggle Camera
//               </button>

//               <button
//                 onClick={removeDevice}
//                 className="py-2 bg-red-500 text-white rounded"
//               >
//                 Remove Device
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Device;


// import React, { useEffect, useState } from "react";
// import { deleteData, getData, postData, putData } from "../../../Helpers/api.js";

// const Device = () => {
//   const [selectedDevice, setSelectedDevice] = useState(null);
//   const [showModal, setShowModal] = useState(false);
//   const [deviceList, setDeviceList] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const ITEMS_PER_PAGE = 15;
//   const [currentPage, setCurrentPage] = useState(1);

//   const loadDevices = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const res = await getData("/device");
//       setDeviceList(res?.devices || []);
//     } catch (err) {
//       setError("Failed to load devices.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ========================= COLORS & BADGES ========================= //
//   const statusBadge = (status) => {
//     const normalized = String(status || "").toUpperCase();
//     const isOnline =
//       normalized === "ONLINE" ||
//       normalized === "ACTIVE" ||
//       normalized === "TRUE" ||
//       normalized === "ONLINE" ||
//       normalized === "ON";
//     return isOnline ? (
//       <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Online</span>
//     ) : (
//       <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-semibold">Offline</span>
//     );
//   };

//   const cameraBadge = (blocked) => {
//     return blocked ? (
//       <span className="px-2 py-1 bg-red-200 text-red-700 rounded text-xs">Blocked</span>
//     ) : (
//       <span className="px-2 py-1 bg-green-200 text-green-700 rounded text-xs">Allowed</span>
//     );
//   };

//   const locationBadge = (on) => {
//     return on ? (
//       <span className="px-2 py-1 bg-green-200 text-green-700 rounded text-xs">ON</span>
//     ) : (
//       <span className="px-2 py-1 bg-red-200 text-red-700 rounded text-xs">OFF</span>
//     );
//   };

//   const formatDate = (value) => {
//     if (!value) return "-";
//     const d = new Date(value);
//     if (Number.isNaN(d.getTime())) return String(value);
//     return d.toLocaleString();
//   };

//   const getPolicyValue = (device, field) => {
//     if (!device) return false;
//     if (typeof device[field] === "boolean") return device[field];
//     if (typeof device?.devicePolicyState?.[field] === "boolean") {
//       return device.devicePolicyState[field];
//     }
//     return false;
//   };

//   useEffect(() => {
//     loadDevices();
//   }, []);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [deviceList]);

//   const totalPages = Math.ceil(deviceList.length / ITEMS_PER_PAGE) || 1;
//   const paginatedDeviceList = deviceList.slice(
//     (currentPage - 1) * ITEMS_PER_PAGE,
//     currentPage * ITEMS_PER_PAGE
//   );

//   const renderPaginationButtons = () => {
//     const btns = [];
//     const start = Math.max(currentPage - 2, 1);
//     const end = Math.min(currentPage + 2, totalPages);
//     const baseBtn =
//       "w-10 h-10 text-sm font-semibold text-gray-700 rounded-full border border-gray-200 bg-white hover:bg-gray-50";
//     const activeBtn =
//       "bg-blue-600 text-white border-blue-600 shadow ring-2 ring-blue-200 hover:bg-blue-600";

//     if (start > 1) {
//       btns.push(
//         <button
//           key={1}
//           onClick={() => setCurrentPage(1)}
//           className={baseBtn}
//         >
//           1
//         </button>
//       );
//       if (start > 2) btns.push(<span key="dots1">…</span>);
//     }

//     for (let i = start; i <= end; i += 1) {
//       btns.push(
//         <button
//           key={i}
//           onClick={() => setCurrentPage(i)}
//           className={`${baseBtn} ${i === currentPage ? activeBtn : ""}`}
//           style={
//             i === currentPage
//               ? {
//                   backgroundColor: "#2563eb",
//                   color: "#ffffff",
//                   borderColor: "#2563eb",
//                   boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.3)",
//                 }
//               : { backgroundColor: "#ffffff", color: "#374151" }
//           }
//         >
//           {i}
//         </button>
//       );
//     }

//     if (end < totalPages - 1) btns.push(<span key="dots2">…</span>);

//     if (end < totalPages) {
//       btns.push(
//         <button
//           key={totalPages}
//           onClick={() => setCurrentPage(totalPages)}
//           className={baseBtn}
//         >
//           {totalPages}
//         </button>
//       );
//     }

//     return btns;
//   };

//   // ========================= OPEN MODAL ========================= //
//   const openDeviceModal = (device) => {
//     setSelectedDevice(device);
//     setShowModal(true);
//     fetchLatestScreenshot(device);
//   };

//   const fetchLatestScreenshot = async (device) => {
//     const deviceId = device?.id || device?.deviceId || device?._id;
//     if (!deviceId) return;
//     try {
//       const res = await getData("/device/device-event/latest-screenshot", {
//         deviceId,
//       });
//       if (res?.status && res?.data?.timestamp) {
//         setSelectedDevice((prev) =>
//           prev ? { ...prev, lastScreenshotAt: res.data.timestamp } : prev
//         );
//       }
//     } catch (_err) {
//       // ignore screenshot lookup errors
//     }
//   };

//   const applyDeviceUpdate = (updated) => {
//     if (!updated?.id) return;
//     setDeviceList((prev) =>
//       prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
//     );
//     setSelectedDevice((prev) => (prev ? { ...prev, ...updated } : prev));
//   };

//   const togglePolicy = async (field) => {
//     if (!selectedDevice?.id) return;
//     try {
//       const res = await putData(`/device/${selectedDevice.id}/policy/toggle`, {
//         field,
//       });
//       if (res?.status && res?.data) {
//         applyDeviceUpdate(res.data);
//       }
//     } catch (err) {
//       // api helper already toasts
//     }
//   };

//   const resolveUserId = (device) => {
//     if (!device) return null;
//     if (typeof device.userId === "string") return device.userId;
//     return device.userId?._id || device.userId?.id || null;
//   };

//   const removeDevice = async () => {
//     if (!selectedDevice) return;
//     const userId = resolveUserId(selectedDevice);
//     const deviceId = selectedDevice.deviceId || selectedDevice.id || selectedDevice._id;
//     if (!deviceId) return;
//     const confirmed = window.confirm(
//       "Remove this device? The user will need to register again."
//     );
//     if (!confirmed) return;
//     try {
//       const res = userId
//         ? await postData("/device/uninstall", {
//             deviceId,
//             userId,
//             employeeId: selectedDevice.employeeId || undefined,
//             action: "uninstall",
//           })
//         : await deleteData(`/device/${deviceId}`);
//           if (res?.status) {
//         await loadDevices();
//         setShowModal(false);
//         setSelectedDevice(null);
//       }
//     } catch (_err) {
//       // api helper already toasts
//     }
//   };

//   return (
//     <div className="p-4">

//       {/* PAGE HEADING */}
//       <div className="bg-white p-4 rounded-lg shadow flex items-center gap-3 text-xl font-semibold text-gray-700 device-list-heading">
//         <svg width="20"
//           fill="#22374e"
//           xmlns="http://www.w3.org/2000/svg"
//           viewBox="0 0 448 512">
//           <path d="M128 136c0-22.1-17.9-40-40-40L40 96C17.9 96 0 113.9 0 136l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm0 192c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm32-192l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM288 328c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm32-192l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM448 328c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48z"></path>
//         </svg>
//         Device Management
//       </div>

//       {/* ========================= DEVICE TABLE ========================= */}
//       <div className="mt-6 m-0">
//         {loading ? (
//           <div className="bg-white p-5 rounded-xl shadow text-gray-600">
//             Loading devices...
//           </div>
//         ) : null}
//         {!loading && error ? (
//           <div className="bg-white p-5 rounded-xl shadow text-red-600">
//             {error}
//           </div>
//         ) : null}

//         {/* ================= DESKTOP TABLE ================= */}
//         <div className="hidden lg:block bg-white p-5 rounded-xl shadow">
//           <table className="w-full border-collapse">
//             <thead>
//               <tr className="bg-gray-100 text-left text-gray-700">
//                 <th className="p-3">Device</th>
//                 <th className="p-3">User</th>
//                 <th className="p-3">Employee ID</th>
//                 <th className="p-3">Status</th>
//                 <th className="p-3">Android</th>
//                 <th className="p-3">App Ver.</th>
//                 <th className="p-3">Last Online</th>
//                 <th className="p-3 text-center">Actions</th>
//               </tr>
//             </thead>

//             <tbody>
//               {paginatedDeviceList.map((device) => (
//                 <tr key={device.id} className="border-b hover:bg-gray-50">
//                   <td className="p-3 font-semibold">
//                     {device.deviceName || device.deviceId || device.name || "-"}
//                   </td>
//                   <td className="p-3">{device.userName || device.name || "-"}</td>
//                   <td className="p-3">{device.employeeId}</td>
//                   <td className="p-3">
//                     {statusBadge(device.statusLabel || device.status)}
//                   </td>
//                   <td className="p-3">
//                     {device.deviceInfo?.version?.release ||
//                       device.osVersion ||
//                       device.androidVersion ||
//                       "-"}
//                   </td>
//                   <td className="p-3">
//                     {device.appVersion || device.appVer || "-"}
//                   </td>
//                   <td className="p-3 text-sm text-gray-600">
//                     {formatDate(device.lastOnline || device.lastSeen)}
//                   </td>
//                   <td className="p-3 text-center">
//                     <button
//                       onClick={() => openDeviceModal(device)}
//                       className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200"
//                       title="View Details"
//                     >
//                       <svg
//                         width={20}
//                         height={20}
//                         xmlns="http://www.w3.org/2000/svg"
//                         viewBox="0 0 576 512"
//                       >
//                         <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6-46.8 43.5-78.1 95.4-93 131.1-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64-11.5 0-22.3-3-31.7-8.4-1 10.9-.1 22.1 2.9 33.2 13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-12.2-45.7-55.5-74.8-101.1-70.8 5.3 9.3 8.4 20.1 8.4 31.7z" />
//                       </svg>
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* ================= MOBILE + TABLET STACKED TABLE ================= */}
//         <div className="block lg:hidden space-y-5 md:flex md:flex-col md:gap-2 sm:flex sm:flex-col sm:gap-2">
//           {deviceList.map((device) => (
//             <div
//               key={device.id}
//               className="bg-white rounded-xl border shadow p-2 !mt-2 !mb-2 !mr-0 !ml-0"
//             >
//               {/* CHECKBOX ROW */}
//               {/* <div className="flex justify-between items-center mb-3">
//                 <input type="checkbox" />
//                 <input type="checkbox" />
//               </div> */}

//               {/* LABEL / VALUE TABLE */}
//               <div className="grid grid-cols-2 gap-y-1 text-sm">
//                 <div className="text-gray-500 font-medium">Device</div>
//                 <div className="text-right font-semibold">
//                   {device.deviceName || device.deviceId || device.name || "-"}
//                 </div>

//                 <div className="text-gray-500 font-medium">User</div>
//                 <div className="text-right">{device.userName || device.name || "-"}</div>

//                 <div className="text-gray-500 font-medium">Employee ID</div>
//                 <div className="text-right">{device.employeeId}</div>

//                 <div className="text-gray-500 font-medium">Status</div>
//                 <div className="text-right">
//                   {statusBadge(device.statusLabel || device.status)}
//                 </div>

//                 <div className="text-gray-500 font-medium">Android</div>
//                 <div className="text-right">
//                   {device.deviceInfo?.version?.release ||
//                     device.osVersion ||
//                     device.androidVersion ||
//                     "-"}
//                 </div>

//                 <div className="text-gray-500 font-medium">App Ver.</div>
//                 <div className="text-right">
//                   {device.appVersion || device.appVer || "-"}
//                 </div>

//                 <div className="text-gray-500 font-medium">Last Online</div>
//                 <div className="text-right text-xs text-gray-600">
//                   {formatDate(device.lastOnline || device.lastSeen)}
//         </div>

//         {!loading && deviceList.length > 0 ? (
//           <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
//             <p className="text-sm text-gray-600">
//               Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} –{" "}
//               {Math.min(currentPage * ITEMS_PER_PAGE, deviceList.length)} of{" "}
//               {deviceList.length}
//             </p>

//             <div className="flex items-center gap-2 justify-center w-full overflow-x-auto sm:overflow-visible">
//               <button
//                 onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
//                 disabled={currentPage === 1}
//                 className="w-12 h-12 text-2xl rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
//                 aria-label="Previous page"
//               >
//                 ‹
//               </button>
//               <div className="flex flex-nowrap gap-2">
//                 {renderPaginationButtons()}
//               </div>
//               <button
//                 onClick={() =>
//                   setCurrentPage((p) => Math.min(p + 1, totalPages))
//                 }
//                 disabled={currentPage === totalPages}
//                 className="w-12 h-12 text-2xl rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
//                 aria-label="Next page"
//               >
//                 ›
//               </button>
//             </div>
//           </div>
//         ) : null}
//       </div>

//               {/* ACTIONS */}
//               <div className="flex justify-end gap-4 mt-4">
//                 <button
//                   onClick={() => openDeviceModal(device)}
//                   className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200"
//                   title="View Details"
//                 >
//                   <svg
//                     width={20}
//                     height={20}
//                     xmlns="http://www.w3.org/2000/svg"
//                     viewBox="0 0 576 512"
//                   >
//                     <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6-46.8 43.5-78.1 95.4-93 131.1-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64-11.5 0-22.3-3-31.7-8.4-1 10.9-.1 22.1 2.9 33.2 13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-12.2-45.7-55.5-74.8-101.1-70.8 5.3 9.3 8.4 20.1 8.4 31.7z" />
//                   </svg>
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>

//       </div>


//       {/* ========================= DEVICE DETAILS MODAL ========================= */}
//       {showModal && selectedDevice && (
//         <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center !m-0">

//           {/* MODAL CONTAINER */}
//           <div
//             className=" bg-white w-full sm:max-w-[800px] max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl p-4 sm:p-6 relative !m-5 device-page-popup-container"
//           >
//             {/* DRAG INDICATOR (Mobile UX) */}
//             <div className="sm:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3"></div>

//             {/* CLOSE BUTTON */}
//             <button
//               onClick={() => setShowModal(false)}
//               className="absolute top-3 right-4 text-xl text-gray-600 !m-0 device-page-popup-cut-button"
//             >
//               ✕
//             </button>

//             {/* HEADER */}
//             <h2 className="text-lg sm:text-2xl font-bold">
//               {selectedDevice.deviceName || selectedDevice.deviceId || selectedDevice.name || "-"}
//             </h2>
//             <p className="text-gray-500 text-sm">
//               Android ID: {selectedDevice.deviceInfo?.androidId || selectedDevice.deviceId || "-"}
//             </p>

//             {/* ================= DEVICE STATUS (STACKED ON MOBILE) ================= */}
//             <div className="mt-5 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 md:grid-cols-3 sm:gap-4">

//               <div className="p-4 bg-blue-50 rounded-lg">
//                 <h4 className="font-semibold text-sm">Device Owner</h4>
//                 <p className="text-sm">
//                   {selectedDevice.userName || selectedDevice.userId?.name || selectedDevice.name || "-"}
//                 </p>
//               </div>

//               <div className="p-4 bg-green-50 rounded-lg">
//                 <h4 className="font-semibold text-sm">Camera</h4>
//                 {cameraBadge(getPolicyValue(selectedDevice, "cameraDisabled"))}
//               </div>

//               <div className="p-4 bg-yellow-50 rounded-lg">
//                 <h4 className="font-semibold text-sm">Location</h4>
//                 {locationBadge(
//                   selectedDevice.locationAllowed !== undefined
//                     ? selectedDevice.locationAllowed
//                     : true
//                 )}
//               </div>

//               <div className="p-4 bg-purple-50 rounded-lg">
//                 <h4 className="font-semibold text-sm">Last Screenshot</h4>
//                 <p className="text-xs">
//                   {formatDate(selectedDevice.lastScreenshotAt)}
//                 </p>
//               </div>

//               <div className="p-4 bg-red-50 rounded-lg">
//                 <h4 className="font-semibold text-sm">Uninstall</h4>
//                 {cameraBadge(getPolicyValue(selectedDevice, "uninstallBlocked"))}
//               </div>

//               <div className="p-4 bg-gray-100 rounded-lg">
//                 <h4 className="font-semibold text-sm">Enrollment Date</h4>
//                 <p className="text-sm">
//                   {formatDate(selectedDevice.enrollmentDate || selectedDevice.createdAt)}
//                 </p>
//               </div>
//             </div>

//             {/* ================= DEVICE CONTROLS ================= */}
//             <h3 className="mt-6 text-base sm:text-xl font-semibold">
//               Device Controls
//             </h3>

//             <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
//               {[
//                 {
//                   field: "cameraDisabled",
//                   label: "Camera",
//                   blockLabel: "Disable Camera",
//                   allowLabel: "Allow Camera",
//                   allowClass: "bg-sky-600 text-white",
//                   blockClass: "bg-sky-100 text-sky-800",
//                 },
//                 {
//                   field: "uninstallBlocked",
//                   label: "Uninstall",
//                   blockLabel: "Disable Uninstall",
//                   allowLabel: "Allow Uninstall",
//                   allowClass: "bg-sky-600 text-white",
//                   blockClass: "bg-sky-100 text-sky-800",
//                 },
//                 {
//                   field: "facebookBlocked",
//                   label: "Facebook",
//                   allowClass: "bg-blue-600 text-white",
//                   blockClass: "bg-blue-100 text-blue-800",
//                 },
//                 {
//                   field: "instagramBlocked",
//                   label: "Instagram",
//                   allowClass: "bg-purple-600 text-white",
//                   blockClass: "bg-purple-100 text-purple-800",
//                 },
//                 {
//                   field: "youtubeBlocked",
//                   label: "YouTube",
//                   allowClass: "bg-rose-600 text-white",
//                   blockClass: "bg-rose-100 text-rose-800",
//                 },
//                 {
//                   field: "whatsappBlocked",
//                   label: "WhatsApp",
//                   allowClass: "bg-green-600 text-white",
//                   blockClass: "bg-green-100 text-green-800",
//                 },
//               ].map(({ field, label, blockLabel, allowLabel, allowClass, blockClass }) => {
//                 const isBlocked = getPolicyValue(selectedDevice, field);
//                 const buttonLabel = isBlocked
//                   ? allowLabel || `Allow ${label}`
//                   : blockLabel || `Block ${label}`;
//                 const buttonClass = isBlocked ? allowClass : blockClass;
//                 return (
//                   <button
//                     key={field}
//                     onClick={() => togglePolicy(field)}
//                     className={`w-full py-3 rounded-lg ${buttonClass}`}
//                   >
//                     {buttonLabel}
//                   </button>
//                 );
//               })}
//             </div>

//             {/* ================= MORE ACTIONS ================= */}
//             <h3 className="mt-6 text-base sm:text-xl font-semibold">
//               More Actions
//             </h3>

//             <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
//               <button className="w-full py-3 bg-gray-200 rounded-lg">
//                 View Activity Logs
//               </button>

//               <button className="w-full py-3 bg-gray-200 rounded-lg">
//                 View Installed Apps
//               </button>

//               <button className="w-full py-3 bg-gray-200 rounded-lg">
//                 View Location Timeline
//               </button>

//               <button
//                 onClick={removeDevice}
//                 className="w-full py-3 bg-red-300 text-red-800 rounded-lg"
//               >
//                 Remove Device
//               </button>
//             </div>
//           </div>
//         </div>
//       )}



//     </div>
//   );
// };

// export default Device;
import React, { useEffect, useMemo, useRef, useState } from "react";
import { deleteData, getData, postData, putData } from "../../../Helpers/api.js";
import CustomDataTable from "../../../Common/Customsdatatable.js";
import { useUser } from "../../../Helpers/Context/UserContext.js";
import { can, normalizeRole } from "../../../Helpers/acl.js";
import { useLocation } from "react-router-dom";

const Device = () => {
  const { user } = useUser();
  const role = normalizeRole(user?.role);
  const canUpdateDevice = can(role, "device", "update");
  const canDeleteDevice = can(role, "device", "delete");

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deviceList, setDeviceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();

  const query = useMemo(() => new URLSearchParams(location.search || ""), [location.search]);
  const employeeIdFilter = String(query.get("employeeId") || "").trim();
  const shouldOpenModal = String(query.get("openModal") || "").toLowerCase() === "1" || String(query.get("openModal") || "").toLowerCase() === "true";
  const openOnceRef = useRef(false);
  const initialSearch = query.get("search") || "";
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  // ✅ ADDED: More Actions state
  const [actionView, setActionView] = useState(null); // "logs" | "apps" | "location" | null
  const [actionData, setActionData] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDevices = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getData("/device", {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        ...(employeeIdFilter ? { employeeId: employeeIdFilter } : {}),
        ...(searchTerm ? { search: searchTerm } : {}),
      });
      setDeviceList(res?.devices || []);
      const total =
        res?.total ??
        res?.pagination?.totalrecords ??
        res?.pagination?.totalRecords ??
        res?.pagination?.total ??
        (Array.isArray(res?.devices) ? res.devices.length : 0);
      setTotalRecords(total);
    } catch (err) {
      setError("Failed to load devices.");
    } finally {
      setLoading(false);
    }
  };

  // ========================= COLORS & BADGES ========================= //
  const statusBadge = (status) => {
    const normalized = String(status || "").toUpperCase();
    const isOnline =
      normalized === "ONLINE" ||
      normalized === "ACTIVE" ||
      normalized === "TRUE" ||
      normalized === "ONLINE" ||
      normalized === "ON";
    return isOnline ? (
      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
        Online
      </span>
    ) : (
      <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-semibold">
        Offline
      </span>
    );
  };

  const cameraBadge = (blocked) => {
    return blocked ? (
      <span className="px-2 py-1 bg-red-200 text-red-700 rounded text-xs">
        Blocked
      </span>
    ) : (
      <span className="px-2 py-1 bg-green-200 text-green-700 rounded text-xs">
        Allowed
      </span>
    );
  };

  const locationBadge = (on) => {
    return on ? (
      <span className="px-2 py-1 bg-green-200 text-green-700 rounded text-xs">
        ON
      </span>
    ) : (
      <span className="px-2 py-1 bg-red-200 text-red-700 rounded text-xs">
        OFF
      </span>
    );
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  };

  const getPolicyValue = (device, field) => {
    if (!device) return false;
    if (typeof device[field] === "boolean") return device[field];
    if (typeof device?.devicePolicyState?.[field] === "boolean") {
      return device.devicePolicyState[field];
    }
    return false;
  };

  useEffect(() => {
    setCurrentPage(1);
    // reset one-time open flag when filter changes
    openOnceRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeIdFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(String(searchInput || "").trim());
      setCurrentPage(1);
      openOnceRef.current = false;
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    loadDevices();
  }, [currentPage, employeeIdFilter, searchTerm]);

  useEffect(() => {
    if (!shouldOpenModal) return;
    if (openOnceRef.current) return;
    if (loading) return;
    if (!Array.isArray(deviceList) || deviceList.length === 0) return;
    openOnceRef.current = true;
    openDeviceModal(deviceList[0]);
  }, [shouldOpenModal, loading, deviceList]);

  const sortedDeviceList = deviceList;

  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE) || 1;
  const paginatedDeviceList = sortedDeviceList;

  const renderPaginationButtons = () => {
    const btns = [];
    const start = Math.max(currentPage - 2, 1);
    const end = Math.min(currentPage + 2, totalPages);
    const baseBtn =
      "w-10 h-10 text-sm font-semibold text-gray-700 rounded-full border border-gray-200 bg-white hover:bg-gray-50";
    const activeBtn =
      "bg-blue-600 text-white border-blue-600 shadow ring-2 ring-blue-200 hover:bg-blue-600";

    if (start > 1) {
      btns.push(
        <button key={1} onClick={() => setCurrentPage(1)} className={baseBtn}>
          1
        </button>
      );
      if (start > 2) btns.push(<span key="dots1">…</span>);
    }

    for (let i = start; i <= end; i += 1) {
      btns.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`${baseBtn} ${i === currentPage ? activeBtn : ""}`}
          style={
            i === currentPage
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

    if (end < totalPages - 1) btns.push(<span key="dots2">…</span>);

    if (end < totalPages) {
      btns.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className={baseBtn}
        >
          {totalPages}
        </button>
      );
    }

    return btns;
  };

  // ========================= OPEN MODAL ========================= //
  const openDeviceModal = (device) => {
    setSelectedDevice(device);
    setShowModal(true);

    // ✅ reset "More Actions" panel when opening a new device
    setActionView(null);
    setActionData([]);
    setActionLoading(false);

    fetchLatestScreenshot(device);
  };

  const fetchLatestScreenshot = async (device) => {
    const deviceId = device?.id || device?.deviceId || device?._id;
    if (!deviceId) return;
    try {
      const res = await getData("/device/device-event/latest-screenshot", {
        deviceId,
      });
      if (res?.status && res?.data?.timestamp) {
        setSelectedDevice((prev) =>
          prev ? { ...prev, lastScreenshotAt: res.data.timestamp } : prev
        );
      }
    } catch (_err) {
      // ignore screenshot lookup errors
    }
  };

  const applyDeviceUpdate = (updated) => {
    if (!updated?.id) return;
    setDeviceList((prev) =>
      prev.map((item) =>
        item.id === updated.id ? { ...item, ...updated } : item
      )
    );
    setSelectedDevice((prev) => (prev ? { ...prev, ...updated } : prev));
  };

  const togglePolicy = async (field) => {
    if (!canUpdateDevice) return;
    if (!selectedDevice?.id) return;
    try {
      const res = await putData(`/device/${selectedDevice.id}/policy/toggle`, {
        field,
      });
      if (res?.status && res?.data) {
        applyDeviceUpdate(res.data);
      }
    } catch (err) {
      // api helper already toasts
    }
  };

  const resolveUserId = (device) => {
    if (!device) return null;
    if (typeof device.userId === "string") return device.userId;
    return device.userId?._id || device.userId?.id || null;
  };

  const removeDevice = async () => {
    if (!canDeleteDevice) return;
    if (!selectedDevice) return;

    // We only need the ID to delete from DB
    const deviceId =
      selectedDevice.deviceId || selectedDevice.id || selectedDevice._id;
    if (!deviceId) return;

    const confirmed = window.confirm(
      "Remove this device? The user will need to register again."
    );
    if (!confirmed) return;

    try {
      // Changed to ALWAYS delete from DB, never trigger "uninstall" action
      const res = await deleteData(`/device/${deviceId}`);

      if (res?.status) {
        await loadDevices();
        setShowModal(false);
        setSelectedDevice(null);
        setActionView(null);
        setActionData([]);
        setActionLoading(false);

        // Navigate to the route as requested (client-side redirect)
        navigate("/dashboard/users/device");
      }
    } catch (_err) {
      // api helper already toasts
    }
  };

  // ========================= MORE ACTIONS (FEATURE) ========================= //
  const resolveSelectedDeviceId = () => {
    return selectedDevice?.id || selectedDevice?.deviceId || selectedDevice?._id;
  };

  const fetchActivityLogs = async () => {
    const deviceId = resolveSelectedDeviceId();
    if (!deviceId) return;
    setActionLoading(true);
    setActionView("logs");
    setActionData([]);
    try {
      const res = await getData(`/device/${deviceId}/activity-logs`);
      setActionData(res?.data || res?.logs || []);
    } catch (_err) {
      setActionData([]);
    } finally {
      setActionLoading(false);
    }
  };

  const fetchInstalledApps = async () => {
    const deviceId = resolveSelectedDeviceId();
    if (!deviceId) return;
    setActionLoading(true);
    setActionView("apps");
    setActionData([]);
    try {
      const res = await getData(`/device/${deviceId}/installed-apps`);
      setActionData(res?.data || res?.apps || []);
    } catch (_err) {
      setActionData([]);
    } finally {
      setActionLoading(false);
    }
  };

  const fetchLocationTimeline = async () => {
    const deviceId = resolveSelectedDeviceId();
    if (!deviceId) return;
    setActionLoading(true);
    setActionView("location");
    setActionData([]);
    try {
      const res = await getData(`/device/${deviceId}/location-timeline`);
      setActionData(res?.data || res?.locations || []);
    } catch (_err) {
      setActionData([]);
    } finally {
      setActionLoading(false);
    }
  };

  const closeMoreActions = () => {
    setActionView(null);
    setActionData([]);
    setActionLoading(false);
  };

  const columns = [
    {
      name: "Name / Employee ID",
      selector: (row) => (
        <div className="flex flex-col text-left">
          <button
            onClick={() => navigate(`/dashboard/users/employees/user/${encodeURIComponent(String(row.employeeId || row.userKey || ""))}#details`)}
            className="text-left font-bold text-gray-900 hover:text-blue-600 hover:underline bg-transparent border-none p-0 m-0 inline-block focus:outline-none w-fit"
          >
            {row.userName || row.name || "-"}
          </button>
          <span className="text-xs text-gray-500 font-medium">{row.employeeId || "-"}</span>
        </div>
      ),
      width: "20%",
    },
    {
      name: "Device",
      selector: (row) => row.deviceName || row.deviceId || row.name || "-",
      width: "18%",
    },
    {
      name: "Status",
      selector: (row) => statusBadge(row.statusLabel || row.status),
      width: "12%",
    },
    {
      name: "Android",
      selector: (row) =>
        row.deviceInfo?.version?.release ||
        row.osVersion ||
        row.androidVersion ||
        "-",
      width: "12%",
    },
    {
      name: "App Ver.",
      selector: (row) => row.appVersion || row.appVer || "-",
      width: "12%",
    },
    {
      name: "Last Online",
      selector: (row) => formatDate(row.lastOnline || row.lastSeen),
      width: "18%",
    },
    {
      name: "Actions",
      selector: (row) => (
        <div className="flex justify-center">
          <button
            onClick={() => openDeviceModal(row)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200"
            title="View Details"
          >
            <svg
              width={20}
              height={20}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 576 512"
            >
              <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6-46.8 43.5-78.1 95.4-93 131.1-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64-11.5 0-22.3-3-31.7-8.4-1 10.9-.1 22.1 2.9 33.2 13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-12.2-45.7-55.5-74.8-101.1-70.8 5.3 9.3 8.4 20.1 8.4 31.7z" />
            </svg>
          </button>
        </div>
      ),
      width: "8%",
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
          {row.userName || row.name || "-"}
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
      name: "Device",
      selector: (row) => (
        <div className="w-full overflow-hidden text-right">
          <span className="font-bold whitespace-nowrap text-gray-800">
            {row.deviceName || row.deviceId || row.name || "-"}
          </span>
        </div>
      ),
    },
    {
      name: "Status",
      selector: (row) => (
        <div className="flex justify-end">
          {statusBadge(row.statusLabel || row.status)}
        </div>
      ),
    },
    {
      name: "Android",
      selector: (row) => (
        <span className="whitespace-nowrap">
          {row.deviceInfo?.version?.release || row.osVersion || row.androidVersion || "-"}
        </span>
      ),
    },
    {
      name: "Last Online",
      selector: (row) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {formatDate(row.lastOnline || row.lastSeen)}
        </span>
      ),
    },
    {
      name: "Actions",
      selector: (row) => (
        <div className="flex justify-end">
          <button
            onClick={() => openDeviceModal(row)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200"
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
      {/* PAGE HEADING */}
      <div className="bg-white p-4 rounded-lg shadow flex items-center gap-3 text-xl font-semibold text-gray-700 device-list-heading">
        <svg
          width="20"
          fill="#22374e"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
        >
          <path d="M128 136c0-22.1-17.9-40-40-40L40 96C17.9 96 0 113.9 0 136l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm0 192c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm32-192l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM288 328c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm32-192l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM448 328c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48z"></path>
        </svg>
        Device Management

      </div>

      {/* ========================= DEVICE TABLE ========================= */}
      <div className="mt-6 m-0">
        <div className="bg-white p-4 rounded-xl shadow mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-sm">
            <div className="relative">
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setSearchInput("");
                }}
                placeholder="Search"
                className="w-full border rounded-xl px-4 py-2 pr-10 text-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 512 512"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
                </svg>
              </div>
            </div>
          </div>

          {employeeIdFilter ? (
            <div className="text-xs text-gray-600 font-semibold">
              Filter: <span className="text-gray-900">{employeeIdFilter}</span>{" "}
              <button
                type="button"
                onClick={() => navigate("/dashboard/users/device")}
                className="ml-2 text-blue-700 hover:underline"
              >
                Clear filter
              </button>
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="bg-white p-5 rounded-xl shadow text-gray-600">
            Loading devices...
          </div>
        ) : (
          <CustomDataTable
            columns={columns}
            mobileColumns={mobileColumns}
            data={paginatedDeviceList}
            totalRows={totalRecords}
            rowsPerPageOptions={[10, 20, 50, 100]}
            defaultRowsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={() => {}} // Rows per page is fixed at 10 in this file
            currentPage={currentPage}
          />
        )}
      </div>

      {/* ========================= DEVICE DETAILS MODAL ========================= */}
      {showModal && selectedDevice && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center !m-0">
          {/* MODAL CONTAINER */}
          <div className=" bg-white w-full sm:max-w-[800px] max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl p-4 sm:p-6 relative !m-5 device-page-popup-container">
            {/* DRAG INDICATOR (Mobile UX) */}
            <div className="sm:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3"></div>

            {/* CLOSE BUTTON */}
            <button
              onClick={() => {
                setShowModal(false);
                closeMoreActions();
              }}
              className="absolute top-3 right-4 text-xl text-gray-600 !m-0 device-page-popup-cut-button"
            >
              ✕
            </button>

            {/* HEADER */}
            <h2 className="text-lg sm:text-2xl font-bold">
              {selectedDevice.deviceName ||
                selectedDevice.deviceId ||
                selectedDevice.name ||
                "-"}
            </h2>
            <p className="text-gray-500 text-sm">
              Android ID:{" "}
              {selectedDevice.deviceInfo?.androidId ||
                selectedDevice.deviceId ||
                "-"}
            </p>

            {/* ================= DEVICE STATUS (STACKED ON MOBILE) ================= */}
            <div className="mt-5 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 md:grid-cols-3 sm:gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-sm">Device Owner</h4>
                <p className="text-sm">
                  {selectedDevice.userName ||
                    selectedDevice.userId?.name ||
                    selectedDevice.name ||
                    "-"}
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-sm">Camera</h4>
                {cameraBadge(getPolicyValue(selectedDevice, "cameraDisabled"))}
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-sm">Location</h4>
                {locationBadge(
                  selectedDevice.locationAllowed !== undefined
                    ? selectedDevice.locationAllowed
                    : true
                )}
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-sm">Last Screenshot</h4>
                <p className="text-xs">{formatDate(selectedDevice.lastScreenshotAt)}</p>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-semibold text-sm">Uninstall</h4>
                {cameraBadge(getPolicyValue(selectedDevice, "uninstallBlocked"))}
              </div>

              <div className="p-4 bg-gray-100 rounded-lg">
                <h4 className="font-semibold text-sm">Enrollment Date</h4>
                <p className="text-sm">
                  {formatDate(selectedDevice.enrollmentDate || selectedDevice.createdAt)}
                </p>
              </div>
            </div>

            {/* ================= DEVICE CONTROLS (ADMIN ONLY) ================= */}
            {canUpdateDevice ? (
              <>
                <h3 className="mt-6 text-base sm:text-xl font-semibold">
                  Device Controls
                </h3>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    {
                      field: "cameraDisabled",
                      label: "Camera",
                      blockLabel: "Disable Camera",
                      allowLabel: "Allow Camera",
                      allowClass: "bg-sky-600 text-white",
                      blockClass: "bg-sky-100 text-sky-800",
                    },
                    {
                      field: "uninstallBlocked",
                      label: "Uninstall",
                      blockLabel: "Disable Uninstall",
                      allowLabel: "Allow Uninstall",
                      allowClass: "bg-sky-600 text-white",
                      blockClass: "bg-sky-100 text-sky-800",
                    },
                    {
                      field: "facebookBlocked",
                      label: "Facebook",
                      allowClass: "bg-blue-600 text-white",
                      blockClass: "bg-blue-100 text-blue-800",
                    },
                    {
                      field: "instagramBlocked",
                      label: "Instagram",
                      allowClass: "bg-purple-600 text-white",
                      blockClass: "bg-purple-100 text-purple-800",
                    },
                    {
                      field: "youtubeBlocked",
                      label: "YouTube",
                      allowClass: "bg-rose-600 text-white",
                      blockClass: "bg-rose-100 text-rose-800",
                    },
                    {
                      field: "whatsappBlocked",
                      label: "WhatsApp",
                      allowClass: "bg-green-600 text-white",
                      blockClass: "bg-green-100 text-green-800",
                    },
                  ].map(
                    ({
                      field,
                      label,
                      blockLabel,
                      allowLabel,
                      allowClass,
                      blockClass,
                    }) => {
                      const isBlocked = getPolicyValue(selectedDevice, field);
                      const buttonLabel = isBlocked
                        ? allowLabel || `Allow ${label}`
                        : blockLabel || `Block ${label}`;
                      const buttonClass = isBlocked ? allowClass : blockClass;
                      return (
                        <button
                          key={field}
                          onClick={() => togglePolicy(field)}
                          className={`w-full py-3 rounded-lg ${buttonClass}`}
                        >
                          {buttonLabel}
                        </button>
                      );
                    }
                  )}
                </div>
              </>
            ) : null}

            {/* ================= MORE ACTIONS (ADMIN ONLY) ================= */}
            {canUpdateDevice || canDeleteDevice ? (
              <>
                <h3 className="mt-6 text-base sm:text-xl font-semibold">
                  More Actions
                </h3>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Actions removed */}

                  {canDeleteDevice ? (
                    <button
                      onClick={removeDevice}
                      className="w-full py-3 bg-red-300 text-red-800 rounded-lg"
                    >
                      Remove Device
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}

            {/* ✅ RESULTS PANEL (inside same modal) */}
            {actionView ? (
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-sm uppercase">
                    {actionView === "logs" ? "Activity Logs" : null}
                    {actionView === "apps" ? "Installed Apps" : null}
                    {actionView === "location" ? "Location Timeline" : null}
                  </h4>

                  <button
                    onClick={closeMoreActions}
                    className="text-xs text-gray-500"
                  >
                    ✕ Close
                  </button>
                </div>

                {actionLoading ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : actionData.length === 0 ? (
                  <p className="text-sm text-gray-500">No data available</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {actionView === "logs" &&
                      actionData.map((log, idx) => (
                        <div key={idx} className="text-sm border-b pb-2">
                          <div className="font-semibold">
                            {log?.type || log?.event || log?.action || "Log"}
                          </div>
                          <div className="text-xs text-gray-600">
                            {formatDate(log?.createdAt || log?.timestamp || log?.time)}
                          </div>
                          {log?.message ? (
                            <div className="text-sm text-gray-700 mt-1">
                              {log.message}
                            </div>
                          ) : null}
                        </div>
                      ))}

                    {actionView === "apps" &&
                      actionData.map((app, idx) => (
                        <div key={idx} className="text-sm border-b pb-2">
                          <div className="font-semibold">
                            {app?.appName || app?.name || "App"}
                          </div>
                          <div className="text-xs text-gray-600">
                            {app?.packageName || app?.package || "-"}
                          </div>
                          {app?.version ? (
                            <div className="text-xs text-gray-600">
                              Version: {app.version}
                            </div>
                          ) : null}
                        </div>
                      ))}

                    {actionView === "location" &&
                      actionData.map((loc, idx) => (
                        <div key={idx} className="text-sm border-b pb-2">
                          <div className="font-semibold">
                            Lat: {loc?.lat ?? loc?.latitude ?? "-"}, Lng:{" "}
                            {loc?.lng ?? loc?.longitude ?? "-"}
                          </div>
                          <div className="text-xs text-gray-600">
                            {formatDate(loc?.timestamp || loc?.createdAt || loc?.time)}
                          </div>
                          {loc?.address ? (
                            <div className="text-sm text-gray-700 mt-1">
                              {loc.address}
                            </div>
                          ) : null}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Device;
