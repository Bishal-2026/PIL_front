import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { domainpath, getData, putData } from "../../Helpers/api.js";
import { useUser } from "../../Helpers/Context/UserContext.js";
import { can, normalizeRole } from "../../Helpers/acl.js";

const Settings = () => {
    const { user } = useUser();
    const userRole = normalizeRole(user?.role);
    const assignedLocation = String(user?.location || "").trim();
    const canReadSettings = can(userRole, "settings", "read");
    const canUpdateSettings = can(userRole, "settings", "update");
    const viewOnly = canReadSettings && !canUpdateSettings;
    const canSelectLocation = userRole === "superadmin" && canUpdateSettings;
    const showAdvancedSettings = userRole === "superadmin";

    const defaultDevice = {
        cameraAccess: true,
        allowAppUninstall: false,
        locationAccess: true,
        allowScreenshots: false,
        blockUnknownApps: true,
        autoSyncEnable: true,
        whatsappCameraAccess: false,
        facebookCameraAccess: false,
    };

    const defaultAlerts = {
        appInstallAlert: true,
        appUninstallAlert: true,
        screenshotAlert: false,
        cameraActivityAlert: false,
    };

    const defaultSystem = {
        apiEndpointUrl: "",
        unitLocation: "",
        apkFile: null,
        logoFile: null,
        apkFileUrl: "",
        companyLogoUrl: "",
        otpEmail: "",
        otpExpirySeconds: "",
        workingHours: {
            enabled: false,
            startTime: "09:30",
            endTime: "18:30"
        }
    };

    const [deviceSettings, setDeviceSettings] = useState(defaultDevice);
    const [alerts, setAlerts] = useState(defaultAlerts);
    const [systemConfig, setSystemConfig] = useState(defaultSystem);
    const [initialDevice, setInitialDevice] = useState(defaultDevice);
    const [initialAlerts, setInitialAlerts] = useState(defaultAlerts);
    const [initialSystem, setInitialSystem] = useState(defaultSystem);
    const [isChanged, setIsChanged] = useState(false);
    const [loading, setLoading] = useState(true);
    const [locations, setLocations] = useState([]);

    const baseUrl = useMemo(() => domainpath.replace(/\/api\/?$/, ""), []);

    const toggle = (setter, key) => {
        if (viewOnly) return;
        setIsChanged(true);
        setter((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleConfigChange = (key, value) => {
        if (viewOnly) return;
        setIsChanged(true);
        setSystemConfig((prev) => ({ ...prev, [key]: value }));
    };

    const emailsArray = systemConfig.otpEmail
        ? systemConfig.otpEmail.split(",").map(e => e.trim())
        : [""];


    const loadSettings = async (locationName = "") => {
        setLoading(true);
        try {
            const targetLocation = canSelectLocation
                ? String(locationName || systemConfig.unitLocation || "").trim()
                : assignedLocation;
            const response = await getData("/settings", {
                unitLocation: targetLocation || undefined,
            });
            const data = response?.data || {};
            const scopedLocation = response?.scope?.unitLocation || "";
            const resolvedLocation = data.unitLocation || targetLocation || scopedLocation || "";
            const nextSystem = {
                apiEndpointUrl: data.apiEndpointUrl || "",
                unitLocation: resolvedLocation,
                apkFile: null,
                logoFile: null,
                apkFileUrl: data.apkFileUrl || "",
                companyLogoUrl: data.companyLogoUrl || "",
                otpEmail: data.otpEmail || "",
                otpExpirySeconds: data.qrExpirySeconds || "",
                workingHours: data.workingHours || { enabled: false, startTime: "09:30", endTime: "18:30" },
            };
            const nextDevice = data.deviceControls || defaultDevice;
            const nextAlerts = data.alerts || defaultAlerts;
            setSystemConfig(nextSystem);
            setDeviceSettings(nextDevice);
            setAlerts(nextAlerts);
            setInitialSystem(nextSystem);
            setInitialDevice(nextDevice);
            setInitialAlerts(nextAlerts);
            setIsChanged(false);

            if (!canSelectLocation && resolvedLocation) {
                setLocations([{ id: resolvedLocation, name: resolvedLocation }]);
            }
        } catch (error) {
            toast.error("Failed to load settings.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (!canUpdateSettings) {
                toast.error("You don't have permission to update settings.");
                return;
            }
            const targetLocation = canSelectLocation
                ? String(systemConfig.unitLocation || "").trim()
                : assignedLocation;
            if (!targetLocation) {
                toast.error("Unit location is required.");
                return;
            }

            const payload = new FormData();

            payload.append("apiEndpointUrl", systemConfig.apiEndpointUrl || "");
            payload.append("unitLocation", targetLocation);
            payload.append("deviceControls", JSON.stringify(deviceSettings));
            payload.append("alerts", JSON.stringify(alerts));

            // ✅ NEW
            payload.append("otpEmail", systemConfig.otpEmail || "");
            payload.append("qrExpirySeconds", systemConfig.otpExpirySeconds || 0);

            // ✅ Working Hours
            // Force enabled: true since we removed the toggle
            const workingHoursPayload = {
                ...(systemConfig.workingHours || {}),
                enabled: true
            };
            payload.append("workingHours", JSON.stringify(workingHoursPayload));

            if (systemConfig.apkFile) payload.append("apkFile", systemConfig.apkFile);
            if (systemConfig.logoFile) payload.append("companyLogo", systemConfig.logoFile);

            const response = await putData("/settings", payload);

            if (response?.status) {
                const data = response?.data || {};

                const nextSystem = {
                    apiEndpointUrl: data.apiEndpointUrl || "",
                    unitLocation: data.unitLocation || "",
                    apkFile: null,
                    logoFile: null,
                    apkFileUrl: data.apkFileUrl || "",
                    companyLogoUrl: data.companyLogoUrl || "",

                    otpEmail: data.otpEmail || "",
                    otpExpirySeconds: data.qrExpirySeconds || "",
                    workingHours: data.workingHours || { enabled: false, startTime: "09:30", endTime: "18:30" },
                };

                setSystemConfig(nextSystem);
                setInitialSystem(nextSystem);
                setInitialDevice(data.deviceControls || defaultDevice);
                setInitialAlerts(data.alerts || defaultAlerts);
                setDeviceSettings(data.deviceControls || defaultDevice);
                setAlerts(data.alerts || defaultAlerts);
                setIsChanged(false);

                toast.success(response.message || "Changes saved successfully!");
            } else {
                toast.error(response?.message || "Failed to save settings.");
            }
        } catch {
            toast.error("Failed to save settings.");
        }
    };

    const handleCancel = () => {
        setDeviceSettings(initialDevice);
        setAlerts(initialAlerts);
        setSystemConfig(initialSystem);
        setIsChanged(false);
    };

    useEffect(() => {
        const fetchLocations = async () => {
            if (!canSelectLocation) {
                setLocations(assignedLocation ? [{ id: assignedLocation, name: assignedLocation }] : []);
                return;
            }

            try {
                const response = await getData("/location", { page: 1, limit: 1000 });
                setLocations(response?.locations || []);
            } catch (error) {
                toast.error("Failed to load locations.");
            }
        };

        fetchLocations();
        loadSettings(canSelectLocation ? "" : assignedLocation);
    }, [canSelectLocation, assignedLocation]);

    return (
        <>
            <div className="p-4 System-Settings-main-page">
                <div className="bg-white p-4 rounded-lg shadow flex items-center gap-3 text-xl font-semibold text-gray-700 setting-list-heading">
                    <svg width="20"
                        fill="#22374e"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 448 512"><path d="M128 136c0-22.1-17.9-40-40-40L40 96C17.9 96 0 113.9 0 136l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm0 192c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm32-192l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM288 328c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm32-192l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM448 328c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48z">
                        </path>
                    </svg>System Settings</div>

                <div className="min-h-screen !m-0">

                    {/* ========= TOP SECTION ========= */}
                    <div className="bg-white p-4 sm:p-6 rounded-xl !mb-4 shadow-sm border border-gray-200 setting-page-System-Configuration overflow-hidden">
                        <h2 className="text-xl font-bold text-gray-800">System Configuration</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {showAdvancedSettings
                                ? "API, Logo, APK, Location settings"
                                : "Location, QR expiry, OTP email, Working hours"}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

                            {/* API URL (Superadmin dashboard only) */}
                            {showAdvancedSettings && (
                                <div>
                                    <label className="setting-System-Configuration text-gray-700 font-semibold">API Endpoint URL</label>
                                    <input
                                        type="text"
                                        value={systemConfig.apiEndpointUrl}
                                        placeholder="https://your-backend.com/api/"
                                        onChange={(e) => handleConfigChange("apiEndpointUrl", e.target.value)}
                                        disabled={viewOnly}
                                        className="w-full mt-2 border border-gray-400 p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 disabled:opacity-70"
                                    />
                                </div>
                            )}

                            {/* Unit Location */}
                            <div>
                                <label className="setting-System-Configuration text-gray-700 font-semibold">Unit Location</label>
                                {!canSelectLocation ? (
                                    <>
                                        <div className="w-full mt-2 border border-gray-300 p-3 rounded-lg bg-gray-100 text-gray-700">
                                            <span className="text-sm font-medium">
                                                {systemConfig.unitLocation || assignedLocation || "Assigned location"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Settings are available only for your assigned location.
                                        </p>
                                    </>
                                ) : (
                                    <select
                                        value={systemConfig.unitLocation}
                                        onChange={(e) => loadSettings(e.target.value)}
                                        disabled={viewOnly}
                                        className="w-full mt-2 border border-gray-400 p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400"
                                    >
                                        <option value="">Select Unit</option>
                                        {locations.map((loc) => (
                                            <option key={loc.id || loc.name} value={loc.name}>
                                                {loc.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>


                            {/* APK Upload (Superadmin dashboard only) */}
                            {showAdvancedSettings && (
                                <div>
                                    <label className="setting-System-Configuration text-gray-700 font-semibold">Upload APK File</label>
                                    <input
                                        type="file"
                                        accept=".apk"
                                        onChange={(e) => handleConfigChange("apkFile", e.target.files[0])}
                                        disabled={viewOnly}
                                        className="w-full mt-2 border border-gray-400 p-3 rounded-lg bg-gray-50 disabled:opacity-70"
                                    />
                                    {systemConfig.apkFileUrl && (
                                        <a
                                            className="text-sm text-blue-600 underline mt-2 inline-block"
                                            href={`${baseUrl}${systemConfig.apkFileUrl}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            View current APK
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Logo Upload (Superadmin dashboard only) */}
                            {showAdvancedSettings && (
                                <div>
                                    <label className="setting-System-Configuration text-gray-700 font-semibold">Company Logo</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleConfigChange("logoFile", e.target.files[0])}
                                        disabled={viewOnly}
                                        className="w-full mt-2 border p-3 border-gray-400  rounded-lg bg-gray-50 disabled:opacity-70"
                                    />

                                    {(systemConfig.logoFile || systemConfig.companyLogoUrl) && (
                                        <img
                                            src={
                                                systemConfig.logoFile
                                                    ? URL.createObjectURL(systemConfig.logoFile)
                                                    : `${baseUrl}${systemConfig.companyLogoUrl}`
                                            }
                                            className="mt-3 w-24 h-24 object-contain rounded-lg shadow border"
                                            alt="Preview"
                                        />
                                    )}
                                </div>
                            )}

                            {/* ✅ OTP Email */}
                            {/* <div>
                                <label className="setting-System-Configuration text-gray-700 font-semibold">
                                    OTP Email
                                </label>
                                <input
                                    type="email"
                                    value={systemConfig.otpEmail}
                                    onChange={(e) => handleConfigChange("otpEmail", e.target.value)}
                                    className="w-full mt-2 border border-gray-400 p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400"
                                />
                            
                            </div> */}

                            {/* ✅ QR Code Expiry */}
                            <div>
                                <label className="setting-System-Configuration text-gray-700 font-semibold">
                                    QR Code Expiry Time
                                </label>

                                <div className="mt-2">
                                    <select
                                        value={systemConfig.otpExpirySeconds}
                                        onChange={(e) => handleConfigChange("otpExpirySeconds", e.target.value)}
                                        disabled={viewOnly}
                                        className="w-full mt-2 border p-3 border-gray-400 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400"
                                    >
                                        <option value="">Select Seconds</option>
                                        <option value="30">30 seconds</option>
                                        <option value="45">45 seconds</option>
                                        <option value="60">60 seconds</option>
                                        <option value="90">90 seconds</option>
                                        <option value="120">120 seconds</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="setting-System-Configuration text-gray-700 font-semibold">
                                    OTP Email
                                </label>

                                {emailsArray.map((email, index) => (
                                    <div key={index} className="flex items-center gap-2 mt-2 w-full">
                                        <input
                                            type="email"
                                            value={email}
                                            placeholder="Enter email address"
                                            onChange={(e) => {
                                                const updatedEmails = [...emailsArray];
                                                updatedEmails[index] = e.target.value;

                                                handleConfigChange(
                                                    "otpEmail",
                                                    updatedEmails.filter(Boolean).join(",")
                                                );
                                            }}
                                            disabled={viewOnly}
                                            className="flex-1 w-full min-w-0 border border-gray-400 p-2 sm:p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400"
                                        />

                                        {/* Remove button (except first) */}
                                        {emailsArray.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updatedEmails = emailsArray.filter((_, i) => i !== index);
                                                    handleConfigChange("otpEmail", updatedEmails.join(","));
                                                }}
                                                disabled={viewOnly}
                                                className="px-2 sm:px-3 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex-shrink-0"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {/* Add button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleConfigChange(
                                            "otpEmail",
                                            [...emailsArray, ""].join(",")
                                        );
                                    }}
                                    disabled={viewOnly}
                                    className="mt-3 text-sm text-blue-600 font-semibold hover:underline flex items-center gap-1 disabled:opacity-60"
                                >
                                    ➕ Add Email
                                </button>
                            </div>

                            {/* ✅ Working Hours (Moved here) */}
                            <div className="md:col-span-2">
                                <label className="setting-System-Configuration text-gray-700 font-semibold block mb-2">
                                    Working Hours
                                </label>
                                <div className="flex flex-row gap-2 sm:gap-4 items-center bg-gray-50 p-3 rounded-lg border border-gray-400 w-full overflow-hidden">
                                    <div className="flex-1 min-w-0">
                                        <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                                        <input
                                            type="time"
                                            value={systemConfig.workingHours?.startTime || "09:30"}
                                            onChange={(e) => {
                                                if (viewOnly) return;
                                                setIsChanged(true);
                                                setSystemConfig((prev) => ({
                                                    ...prev,
                                                    workingHours: {
                                                        ...prev.workingHours,
                                                        enabled: true, // Always enable when editing
                                                        startTime: e.target.value
                                                    }
                                                }));
                                            }}
                                            disabled={viewOnly}
                                            className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm sm:text-base"
                                        />
                                    </div>
                                    <span className="text-gray-400 mt-3 flex-shrink-0">-</span>
                                    <div className="flex-1 min-w-0">
                                        <label className="block text-xs text-gray-500 mb-1">End Time</label>
                                        <input
                                            type="time"
                                            value={systemConfig.workingHours?.endTime || "18:30"}
                                            onChange={(e) => {
                                                if (viewOnly) return;
                                                setIsChanged(true);
                                                setSystemConfig((prev) => ({
                                                    ...prev,
                                                    workingHours: {
                                                        ...prev.workingHours,
                                                        enabled: true, // Always enable when editing
                                                        endTime: e.target.value
                                                    }
                                                }));
                                            }}
                                            disabled={viewOnly}
                                            className="w-full border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm sm:text-base"
                                        />
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>

                    {/* ========= FLEX BOTTOM CARDS ========= */}
                    {showAdvancedSettings && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 Setting-page-bottum-section">

                        {/* Device Controls */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 setting-page-Device-Controls">
                            <h2 className="text-xl font-bold text-gray-800">Devices Controls</h2>
                            <p className="text-sm text-gray-500 mt-1">Hardware access & restrictions</p>

                            <div className="mt-6 space-y-4 flex flex-col setting-page-device-control-inner">
                                {[
                                    ["Camera Access", "cameraAccess"],
                                    ["Allow App Uninstall", "allowAppUninstall"],
                                    ["Location Access", "locationAccess"],
                                    ["Allow Screenshots", "allowScreenshots"],
                                    ["Block Unknown Apps", "blockUnknownApps"],
                                    ["Auto Sync Enable", "autoSyncEnable"],
                                    ["Whatsapp Camera Access", "whatsappCameraAccess"],
                                    ["Facebook Camera Access", "facebookCameraAccess"],
                                ]
                                    .map(([label, key]) => (
                                        <div key={key} className="flex items-center justify-between p-3.5 bg-gray-10 border rounded-lg setting-rows ">
                                            <span className="text-gray-800">{label}</span>

                                            <label className="relative inline-flex items-center cursor-pointer setting-device-control">
                                                <input
                                                    type="checkbox"
                                                    checked={!!deviceSettings[key]}
                                                    onChange={() => toggle(setDeviceSettings, key)}
                                                    disabled={viewOnly}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-12 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-600 transition"></div>
                                                <div className="absolute w-4 h-4 bg-white rounded-full left-1 top-1 transition-all peer-checked:translate-x-6 shadow"></div>
                                            </label>
                                        </div>
                                    ))}
                            </div>
                        </div>



                        {/* Alerts */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 setting-page-Alert-Notifications">
                            <h2 className="text-xl font-bold text-gray-800">Alerts & Notifications</h2>
                            <p className="text-sm text-gray-500 mt-1">Activity alerts</p>

                            <div className="mt-6 space-y-4 flex flex-col ">
                                {[
                                    ["App Install Alert", "appInstallAlert"],
                                    ["App Uninstall Alert", "appUninstallAlert"],
                                    ["Screenshot Alert", "screenshotAlert"],
                                    ["Camera Activity Alert", "cameraActivityAlert"],
                                ].map(([label, key]) => (
                                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 border rounded-lg setting-rows">
                                        <span className="text-gray-800">{label}</span>

                                        <label className="relative inline-flex items-center cursor-pointer setting-Notification-aleart-control">
                                            <input
                                                type="checkbox"
                                                checked={!!alerts[key]}
                                                onChange={() => toggle(setAlerts, key)}
                                                disabled={viewOnly}
                                                className="sr-only peer"
                                            />
                                            <div className="w-12 h-6 bg-gray-300 rounded-full peer-checked:bg-green-600 transition"></div>
                                            <div className="absolute w-4 h-4 bg-white rounded-full left-1 top-1 transition-all peer-checked:translate-x-6 shadow"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        </div>
                    )}

                    {/* ========= SAVE / CANCEL BUTTONS ========= */}
                    {canUpdateSettings && isChanged && !loading && (
                        <div className="mt-8 flex gap-4 justify-end settingpage-save-cancel-button">
                            <button
                                onClick={handleCancel}
                                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-100 transition"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleSave}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                            >
                                Save Changes
                            </button>
                        </div>
                    )}

                </div>



            </div>
        </>
    );
};

export default Settings;
