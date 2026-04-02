// src/Modules/Notifications/NotificationsPage.js
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { deleteData, getData, postData } from "../../Helpers/api";
import { capitalizeFirstLetter } from "../../Helpers/CapitalizeFirstLetter.js";
import {
    FaCamera,
    FaCameraRetro,
    FaVideo,
    FaMobileAlt,
    FaTrashAlt,
} from "react-icons/fa";
import { useUser } from "../../Helpers/Context/UserContext";
import { normalizeRole, can } from "../../Helpers/acl";

const iconMap = {
    CAMERA_ON: <FaCamera />,
    TAKE_PICTURE: <FaCameraRetro />,
    VIDEO: <FaVideo />,
    APP_INSTALL: <FaMobileAlt />,
    APP_ACCESS: <FaMobileAlt />,
    APP_UNINSTALL: <FaTrashAlt />,
};

const knownApps = [
    { key: "instagram", label: "Instagram" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "facebook", label: "Facebook" },
    { key: "youtube", label: "YouTube" },
    { key: "snapchat", label: "Snapchat" },
    { key: "zoom", label: "Zoom" },
    { key: "meet", label: "Meet" },
    { key: "teams", label: "Teams" },
    { key: "camera", label: "Camera" },
];

const humanizeEventLabel = (value) => {
    const normalized = String(value || "")
        .replace(/[_-]+/g, " ")
        .replace(/[.]+/g, " ")
        .replace(/^\s*com\s+/i, "")
        .replace(/\bused\b/gi, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
    const humanized = capitalizeFirstLetter(normalized);
    // Brand normalization: show "PIL" instead of "Pidilite" in event/app labels
    return /\bpidilite\b/i.test(String(value || ""))
        ? humanized.replace(/\bPidilite\b/gi, "PIL")
        : humanized;
};

const resolveType = ({ activityType, category, description, narrative, rawEvent }) => {
    const value = String(activityType || category || description || "").toLowerCase();
    const narrativeText = String(narrative || rawEvent || "").toLowerCase();
    if (value.includes("app_install")) return "APP_INSTALL";
    if (value.includes("app_uninstall")) return "APP_UNINSTALL";
    if (value.includes("restricted app") || value.includes("app opened")) {
        return "APP_ACCESS";
    }
    if (["youtube", "whatsapp", "instagram", "facebook"].some((app) => value.includes(app))) {
        return "APP_ACCESS";
    }
    if (/\bopened\b/.test(value) || /\bopened\b/.test(narrativeText)) {
        return "APP_ACCESS";
    }
    if (value.includes("video")) return "VIDEO";
    if (value.includes("screenshot")) return "TAKE_PICTURE";
    if (value.includes("camera")) return "CAMERA_ON";
    return value.toUpperCase() || "CAMERA_ON";
};

const extractDurationSnippet = (value, baseMessage = "") => {
    if (!value) return "";
    if (/\bused for\s*\d+\s*(?:sec|secs|seconds|min|mins|minutes)\b/i.test(String(baseMessage || ""))) {
        return "";
    }
    const cleaned = String(value || "")
        .replace(/\s+/g, " ")
        .replace(/\bpermission controller\b/gi, "")
        .replace(/\bcamera\s*\d+\b/gi, "")
        .trim();
    if (!cleaned) return "";
    const directMatch = cleaned.match(
        /((?:camera|video call|video|microphone|screen)[^.,]*?\bused for\s*\d+\s*(?:sec|secs|seconds|min|mins|minutes))\b/i
    );
    if (directMatch) {
        let snippet = directMatch[1].replace(/\s+/g, " ").trim().toLowerCase();
        // Remove duplicate literal words like "camera camera" -> "camera"
        snippet = snippet.replace(/\b(\w+)\s+\1\b/gi, "$1");
        return ` (${snippet})`;
    }
    const usedForMatch = cleaned.match(
        /\bused for\s*\d+\s*(?:sec|secs|seconds|min|mins|minutes)\b/i
    );
    if (usedForMatch) {
        const labelMatch = String(baseMessage || "").match(
            /\b(camera|video call|video|microphone|screen)\b/i
        );
        const label = labelMatch ? labelMatch[0] : "activity";
        const usedStr = usedForMatch[0].toLowerCase();
        return ` (${usedStr.startsWith(label.toLowerCase()) ? usedStr : `${label} ${usedStr}`.toLowerCase()})`;
    }
    return "";
};

const normalizeMessage = (value) => {
    if (!value) return "";
    let message = String(value).replace(/\s+/g, " ").trim();
    const dupPhrase = /\b(camera usage ended)\b(?:\s+\1\b)+/gi;
    message = message.replace(dupPhrase, "Camera usage ended");
    message = message.replace(/\b(\w+)(?:\s+\1\b)+/gi, "$1");
    return message.trim();
};

const rewritePolicyOrAppEventMessage = (item, baseMessage) => {
    const raw = `${item?.description || ""} ${item?.activityType || ""} ${item?.rawEvent || ""} ${item?.narrative || ""} ${item?.metadata?.narrative || ""}`
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

    if (raw.includes("app install")) return "App Installed";
    if (raw.includes("app uninstall")) return "App Uninstalled";

    const isTurnedOff = raw.includes("disabled") || raw.includes("off") || raw.includes("turned off");
    const isTurnedOn = raw.includes("enabled") || raw.includes("on") || raw.includes("turned on");

    const formatPermission = (name) => {
        if (isTurnedOff) return `App ${name} Permission Turned off`;
        if (isTurnedOn) return `App ${name} Permission Turned on`;
        return `App ${name} Permission`;
    };

    if (raw.includes("overlay")) return formatPermission("Overlay");
    if (raw.includes("location permission") || raw.includes("gps")) return formatPermission("Location");
    if (raw.includes("notification permission")) return formatPermission("Notification");
    if (raw.includes("device admin")) return formatPermission("Device Admin");
    if (raw.includes("usage access")) return formatPermission("Usage Access");
    if (raw.includes("accessibility")) return formatPermission("Accessibility");

    return baseMessage;
};

const extractAppNameFromText = (value) => {
    if (!value) return "";
    const cleaned = String(value || "").replace(/\s+/g, " ").trim();
    if (!cleaned) return "";

    // Extract simple App name from strings like "WhatsApp camera opened", "Zoom video call camera used", or "WhatsApp camera used for"
    const eventMatch = cleaned.match(/^([a-z0-9_.\-]+(?:\s+[a-z0-9_.\-]+)*)\s+(?:camera opened|video call camera used|camera used for)/i);
    if (eventMatch && eventMatch[1]) {
        const candidate = eventMatch[1].trim();
        const lowerCand = candidate.toLowerCase();
        const invalidNames = ["system", "phone", "take_picture", "take-picture", "screenshot", "camera"];
        if (!invalidNames.includes(lowerCand)) {
            return candidate.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
    }

    const openedMatch = cleaned.match(/(?:^|\b)([^()]+?)\s*\(([^)]+)\)\s*opened\b/i);
    if (openedMatch?.[1]) return openedMatch[1].trim();
    const simpleOpenedMatch = cleaned.match(/^(.+?)\s+opened\b/i);
    if (simpleOpenedMatch?.[1]) return simpleOpenedMatch[1].trim();
    const lower = cleaned.toLowerCase();
    for (const app of knownApps) {
        if (lower.includes(app.key) && app.key !== "camera") return app.label; // Camera is too generic
    }
    const pkgMatch = cleaned.match(/\b([a-z0-9_]+)(?:\.[a-z0-9_]+)+\b/i);
    if (pkgMatch?.[0]) {
        const parts = pkgMatch[0].split(".");
        let candidate = parts[parts.length - 1] || "";
        if (["com", "org", "net", "in", "io", "co"].includes(parts[0]) && parts[1]) {
            candidate = parts[1];
            if (candidate === "android" && parts[2]) {
                candidate = parts[2];
            }
        } else if (parts.length >= 2 && parts[0].length <= 3) {
            candidate = parts[1];
        }
        return candidate
            ? candidate.charAt(0).toUpperCase() + candidate.slice(1)
            : "";
    }
    return "";
};

const resolveAppName = (item) => {
    const narrative = item.narrative || item.metadata?.narrative || "";
    if (String(narrative).toLowerCase().includes("system launcher")) {
        return "System Camera";
    }
    const fromNarrative = extractAppNameFromText(narrative);
    if (fromNarrative) return humanizeEventLabel(fromNarrative);
    const explicit =
        item.appName ||
        item.appLabel ||
        item.packageName ||
        item.package ||
        item.app ||
        item.appId ||
        item.metadata?.appName ||
        item.metadata?.appLabel ||
        item.metadata?.packageName ||
        item.metadata?.package ||
        item.metadata?.app ||
        item.metadata?.appId ||
        "";

    const invalidNames = ["system", "phone", "take_picture", "take-picture", "screenshot", "camera", "android"];
    const lowerExplicit = String(explicit).toLowerCase().trim();

    if (explicit && !invalidNames.includes(lowerExplicit)) {
        return humanizeEventLabel(explicit);
    }
    const combined = `${item.description || ""} ${item.activityType || ""} ${item.rawEvent || ""} ${narrative}`.trim();
    const fromCombined = extractAppNameFromText(combined);
    const normalized = fromCombined ? humanizeEventLabel(fromCombined) : "";
    if (normalized.toLowerCase() === "android") {
        const cameraHint = extractAppNameFromText(narrative);
        if (cameraHint) return humanizeEventLabel(cameraHint);
    }
    return normalized;
};

const toNotification = (item) => {
    const type = resolveType(item);
    const baseMessage =
        humanizeEventLabel(item.description || item.activityType || "Activity detected");
    const appLabel = humanizeEventLabel(item.activityType || item.description || "App");
    const appName = resolveAppName(item);
    const isCameraType = ["CAMERA_ON", "TAKE_PICTURE", "VIDEO"].includes(type);
    const fallbackCameraApp = "System Camera";

    // We already have a clean effectiveAppName if it successfully extracted "WhatsApp" etc.
    const effectiveAppName = appName || (isCameraType ? fallbackCameraApp : "");
    const shouldPrefixApp =
        isCameraType &&
        effectiveAppName &&
        !baseMessage.toLowerCase().includes(String(effectiveAppName).toLowerCase());
    const cameraUsageEnded = /camera usage ended/i.test(baseMessage);
    const isVideoCall = /video call/i.test(item.narrative || item.metadata?.narrative || item.rawEvent || "");
    const actionText = isVideoCall ? "video call" : "camera opened";

    let message = rewritePolicyOrAppEventMessage(item, baseMessage);

    if (type === "APP_ACCESS") {
        message = effectiveAppName
            ? `${humanizeEventLabel(effectiveAppName)} Opened`
            : (/\bopened\b/i.test(baseMessage) ? baseMessage : `${appLabel} Opened`);
    } else if (isCameraType) {
        if (shouldPrefixApp) {
            message = cameraUsageEnded
                ? `${humanizeEventLabel(effectiveAppName)} usage ended`
                : `${humanizeEventLabel(effectiveAppName)} ${actionText}`;
        } else {
            // If the baseMessage already contains the app name, just format it nicely
            message = baseMessage;
            if (message.toLowerCase() === "camera opened" && effectiveAppName && effectiveAppName !== "Camera") {
                message = `${humanizeEventLabel(effectiveAppName)} ${actionText}`;
            }
        }
    }
    const narrative = item.narrative || item.metadata?.narrative || "";
    const durationSnippet = extractDurationSnippet(narrative, message);
    return {
        _id: item.id || item._id,
        type,
        employeeName: capitalizeFirstLetter(item.name || ""),
        employeeId: item.employeeId || "",
        deviceId: item.deviceId || "",
        message: normalizeMessage(`${message}${durationSnippet}`),
        createdAt: item.occurredAt || item.createdAt || new Date(),
        policyVoilation: !!item.policyVoilation,
    };
};

const shouldHideNotification = (item) => {
    const text = `${item?.description || ""} ${item?.activityType || ""} ${item?.narrative || ""} ${item?.metadata?.narrative || ""}`
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
    return (
        text.includes("cameramanager callback") &&
        text.includes("camera unavailable")
    );
};

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);
    const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

    const { user } = useUser();
    const role = normalizeRole(user?.role);
    const canDeleteActivity = can(role, "activity", "delete");

    useEffect(() => {
        markNotificationsRead();
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [currentPage, rowsPerPage]);

    const markNotificationsRead = async () => {
        try {
            await postData("/activity/notifications/mark-read");
            window.dispatchEvent(new CustomEvent("notifications-read"));
        } catch (err) {
            console.error("Failed to mark notifications as read");
        }
    };

    const syncUnreadCount = async (maxRetries = 0) => {
        try {
            let count = 0;
            for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
                const res = await getData("/activity/notifications/unread-count");
                count = res?.status ? Number(res.count) || 0 : 0;
                if (count === 0 || attempt === maxRetries) break;
                await new Promise((resolve) => setTimeout(resolve, 250));
            }
            window.dispatchEvent(
                new CustomEvent("notifications-count-updated", {
                    detail: { count },
                })
            );
        } catch (err) {
            console.error("Failed to sync unread notification count");
        }
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await getData("/activity/notifications", {
                page: Math.max(currentPage - 1, 0),
                limit: rowsPerPage,
            });

            if (res?.status && Array.isArray(res.data)) {
                const filtered = res.data.filter((item) => !shouldHideNotification(item));
                setNotifications(filtered.map(toNotification));
                setTotalRows(res.pagination?.totalrecords || 0);
                setLastUpdatedAt(new Date());
            } else {
                setNotifications([]);
                setTotalRows(0);
            }
        } catch (err) {
            console.error("Failed to load notifications");
            setNotifications([]);
            setTotalRows(0);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteNotification = async (id) => {
        if (!id) return;
        if (!canDeleteActivity) {
            toast.error("You don't have permission to delete notifications.");
            return;
        }
        const confirmed = window.confirm("Delete this notification?");
        if (!confirmed) return;
        try {
            await deleteData(`/activity/notifications/${id}`);
            await fetchNotifications();
            await syncUnreadCount(1);
        } catch (err) {
            console.error("Failed to delete notification");
        }
    };

    const handleClearAll = async () => {
        if (notifications.length === 0) return;
        if (!canDeleteActivity) {
            toast.error("You don't have permission to clear notifications.");
            return;
        }
        const confirmed = window.confirm("Clear all notifications?");
        if (!confirmed) return;
        try {
            await deleteData("/activity/notifications");
            setCurrentPage(1);
            await fetchNotifications();
            await syncUnreadCount(1);
        } catch (err) {
            console.error("Failed to clear notifications");
        }
    };

    const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
    const startItem = Math.max((currentPage - 1) * rowsPerPage + 1, 1);
    const endItem = Math.min(currentPage * rowsPerPage, totalRows);

    const handleRowsPerPageChange = (e) => {
        const newRows = parseInt(e.target.value, 10);
        setRowsPerPage(newRows);
        setCurrentPage(1);
    };

    const renderPaginationButtons = () => {
        const btns = [];
        const start = Math.max(currentPage - 2, 1);
        const end = Math.min(currentPage + 2, totalPages);
        const baseBtn =
            "flex-shrink-0 flex items-center justify-center w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-[11px] xs:text-xs sm:text-sm font-semibold text-gray-700 rounded-full border border-gray-200 bg-white hover:bg-gray-50";
        const activeBtn =
            "bg-blue-600 text-white border-blue-600 shadow ring-2 ring-blue-200 hover:bg-blue-600";

        if (start > 1) {
            btns.push(
                <button
                    key={1}
                    onClick={() => setCurrentPage(1)}
                    className={baseBtn}
                >
                    1
                </button>
            );
            if (start > 2) btns.push(<span key="dots1" className="px-1 text-gray-400 font-bold">…</span>);
        }

        for (let i = start; i <= end; i++) {
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

        if (end < totalPages - 1) btns.push(<span key="dots2" className="px-1 text-gray-400 font-bold">…</span>);

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

    useEffect(() => {
        const pages = Math.ceil(totalRows / rowsPerPage) || 1;
        if (currentPage > pages) {
            setCurrentPage(pages);
        }
    }, [totalRows, rowsPerPage, currentPage]);

    const refreshLabel = lastUpdatedAt
        ? `Updated at ${lastUpdatedAt.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        })}`
        : "Waiting for first update";

    const handleRefresh = async () => {
        await markNotificationsRead();
        await fetchNotifications();
        await syncUnreadCount(2);
    };

    return (
        <div>
            <div className="notification-page">
                {/* <h2 className="notification-title flex items-center gap-2">
                    <svg
                        fill="#22374e"
                        width={28}
                        height={28}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 640 640"
                    >
                        <path d="M320 64C302.3 64 288 78.3 288 96L288 99.2C215 114 160 178.6 160 256L160 277.7C160 325.8 143.6 372.5 113.6 410.1L103.8 422.3C98.7 428.6 96 436.4 96 444.5C96 464.1 111.9 480 131.5 480L508.4 480C528 480 543.9 464.1 543.9 444.5C543.9 436.4 541.2 428.6 536.1 422.3L526.3 410.1C496.4 372.5 480 325.8 480 277.7L480 256C480 178.6 425 114 352 99.2L352 96C352 78.3 337.7 64 320 64zM258 528C265.1 555.6 290.2 576 320 576C349.8 576 374.9 555.6 382 528L258 528z" />
                    </svg>
                    Activity Notifications
                </h2> */}

                <div className="bg-white p-4 py-6 !mb-5 rounded-lg text-gray-700 font-semibold text-xl notification-heading-title-box notification-header-row">
                    <span className="mr-2 flex items-center gap-4 space-x-2 notification-titel">
                        <svg
                            fill="#22374e"
                            width={26}
                            height={26}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 640 640"
                        >
                            <path d="M320 64C302.3 64 288 78.3 288 96L288 99.2C215 114 160 178.6 160 256L160 277.7C160 325.8 143.6 372.5 113.6 410.1L103.8 422.3C98.7 428.6 96 436.4 96 444.5C96 464.1 111.9 480 131.5 480L508.4 480C528 480 543.9 464.1 543.9 444.5C543.9 436.4 541.2 428.6 536.1 422.3L526.3 410.1C496.4 372.5 480 325.8 480 277.7L480 256C480 178.6 425 114 352 99.2L352 96C352 78.3 337.7 64 320 64zM258 528C265.1 555.6 290.2 576 320 576C349.8 576 374.9 555.6 382 528L258 528z" />
                        </svg>{" "}
                        Activity Notifications
                    </span>
                    <div className="notification-header-actions">
                        <span className="notification-refresh-meta">{refreshLabel}</span>
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={loading}
                            className="notification-refresh-btn"
                            aria-label="Refresh notifications"
                            title="Refresh notifications"
                        >
                            <svg
                                width={16}
                                height={16}
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className={`notification-refresh-icon ${loading ? "is-loading" : ""}`}
                            >
                                <path
                                    d="M20 12A8 8 0 1 1 17.66 6.34"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M20 4V10H14"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            {loading ? "Refreshing..." : "Refresh"}
                        </button>
                        {canDeleteActivity && (
                            <button
                                type="button"
                                onClick={handleClearAll}
                                disabled={loading || notifications.length === 0}
                                className="notification-clear-btn"
                                aria-label="Clear all notifications"
                                title="Clear all"
                            >
                                <FaTrashAlt />
                                Clear all
                            </button>
                        )}
                    </div>
                </div>

                {loading && (
                    <p className="notification-loading">Loading notifications...</p>
                )}

                {!loading && notifications.length === 0 && (
                    <p className="notification-empty">No notifications found</p>
                )}

                <div className="notification-list">
                    {notifications.map((n) => (
                        <div
                            key={n._id}
                            className="notification-card"
                        >
                            <div className="notification-icon">
                                {iconMap[n.type] || "🔔"}
                            </div>

                            <div className="notification-content">
                                <p className="notification-message">
                                    <strong className="notification-employee-name">{n.employeeName}</strong>
                                    <span className={n.policyVoilation ? "notification-message-badge notification-message-badge--violation" : ""}>
                                        {" "}— {n.message.replace(`${n.employeeName} — `, "").replace(`${n.employeeName}— `, "")}
                                    </span>
                                </p>

                                <p className="notification-meta">
                                    Emp ID: {n.employeeId} | Device: {n.deviceId}
                                </p>

                                <p className="notification-time">
                                    {new Date(n.createdAt).toLocaleString()}
                                </p>
                            </div>

                            <div className="notification-actions">
                                {canDeleteActivity && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteNotification(n._id)}
                                        className="notification-delete-btn"
                                        title="Delete notification"
                                        aria-label="Delete notification"
                                    >
                                        <FaTrashAlt />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {!loading && totalRows > 0 && (
                    <div className="mt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-gray-600">Rows per page:</span>
                            <select
                                value={rowsPerPage}
                                onChange={handleRowsPerPageChange}
                                className="border rounded px-2 py-1 text-sm"
                            >
                                {[10, 20, 50, 100].map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                            <span className="text-gray-600">
                                {startItem}-{endItem} of {totalRows}
                            </span>
                        </div>

                        <div className="flex flex-nowrap items-center gap-1 sm:gap-2 justify-center w-full mt-2 lg:mt-0 overflow-x-auto hide-scrollbar pb-1">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="flex-shrink-0 flex items-center justify-center w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-base sm:text-xl rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                ‹
                            </button>

                            <div className="flex flex-nowrap items-center justify-center gap-1 sm:gap-2">
                                {renderPaginationButtons()}
                            </div>

                            <button
                                onClick={() =>
                                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                                }
                                disabled={currentPage === totalPages}
                                className="flex-shrink-0 flex items-center justify-center w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-base sm:text-xl rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                ›
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
