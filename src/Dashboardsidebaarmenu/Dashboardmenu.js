import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import logo from "../Images/PIL.png";

const Sidebar = ({ isCollapsed, setIsCollapsed, userRole = "superadmin" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [activeLink, setActiveLink] = useState("");

  // ✅ Handle logout
  const handleLogout = () => {
    localStorage.removeItem("accesstoken");
    Cookies.remove("accesstoken");
    Cookies.remove("userdetail");
    navigate("/login");
  };

  // ✅ Collapse automatically on tablet & mobile
  useEffect(() => {
    if (window.innerWidth <= 1024) setIsCollapsed(true);
  }, [setIsCollapsed]);

  // ✅ Track active route
  useEffect(() => {
    const normalizedPath = location.pathname.endsWith("/")
      ? location.pathname.slice(0, -1)
      : location.pathname;
    setActiveLink(normalizedPath);
  }, [location.pathname]);

  // ✅ Base path by role
  const basePath =
    userRole === "superadmin" ||
      userRole === "admin" ||
      userRole === "hr" ||
      userRole === "manager" ||
      userRole === "supervisor"
      ? "/dashboard/users"
      : "/dashboard/employee";

  // ✅ All menu items
  const allNavItems = [
    { label: "Dashboard", icon: "dashboard", path: "/dashboard" },
    { label: "Employees", icon: "group", path: `${basePath}/employees` },
    { label: "Visitors", icon: "badge", path: `${basePath}/visitors` },
    { label: "Users", icon: "person", path: `/dashboard/users` },
    { label: "Attendance", icon: "event", path: `${basePath}/attendance` },
    // { label: "Contractors", icon: "badge", path: `${basePath}/contractor` },
    // { label: "Rfid", icon: "qr_code", path: `${basePath}/rfid` },
    // { label: "Zones", icon: "map", path: `${basePath}/zones` },
    { label: "Location", icon: "my_location", path: `${basePath}/location` },
    { label: "Activity", icon: "timeline", path: `${basePath}/activity` },
    { label: "Settings", icon: "settings", path: `${basePath}/settings` },
    { label: "Device", icon: "devices", path: `${basePath}/device` },
    { label: "Notifications", icon: "notifications", path: `${basePath}/notifications` },
    { label: "Enquiries", icon: "mail", path: "/dashboard/enquiries" },
    { label: "Warnings", icon: "warning", path: "/dashboard/warnings" },
    { label: "Maintenance", icon: "build_circle", path: "/dashboard/maintenance" }

  ];

  // ✅ Role access
  const roleAccess = {
    superadmin: [
      "Dashboard",
      "Employees",
      "Visitors",
      "Users",
      "Attendance",
      // "Contractors",
      // "Rfid",
      // "Zones",
      "Device",
      "Settings",
      "Location",
      "Activity",
      "Enquiries",
      "Warnings",
      "Maintenance",
    ],
    admin: [
      "Dashboard",
      "Employees",
      "Visitors",
      "Attendance",
      // "Contractors",
      // "Rfid",
      "Device",
      "Settings",
      "Activity",
      "Enquiries",
      "Warnings",
      "Maintenance",
    ],
    hr: [
      "Dashboard",
      "Employees",
      "Visitors",
      "Attendance",
      // "Contractors",
      // "Rfid",
      "Device",
      "Settings",
      "Activity",
      "Enquiries",
      "Warnings",
      "Maintenance",
    ],
    manager: [
      "Dashboard",
      "Employees",
      "Visitors",
      "Attendance",
      "Settings",
      "Location",
      "Activity",
    ],
    supervisor: ["Dashboard", "Employees", "Visitors", "Attendance"],
    employee: ["Dashboard"],
    contractor: ["Dashboard"],
  };

  // ✅ Filter items
  const visibleNavItems = allNavItems.filter((item) =>
    roleAccess[userRole?.toLowerCase()]?.includes(item.label)
  );

  // ✅ Dropdown toggle
  const toggleDropdown = (label) => {
    setOpenDropdown((prev) => (prev === label ? null : label));
  };

  return (
    <>
      {/* ================= MOBILE / TABLET TOGGLE BUTTON ================= */}
      <button
        className="mobile-sidebar-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="material-symbols-rounded">
          {isCollapsed ? "menu" : "close"}
        </span>
      </button>

      {/* ================= SIDEBAR ================= */}
      <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
        {/* Header */}
        <header className="sidebar-header">
          <img src={logo} alt="Pidilite" style={{ backgroundColor: "white", padding: "2px", borderRadius: "8px", maxHeight: 70, maxWidth: "100%", width: "120px", objectFit: "contain" }} />
          <button
            className="sidebar-toggler"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <span className="material-symbols-rounded">chevron_left</span>
          </button>
        </header>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <ul className="nav-list primary-nav">
            {(() => {
              const currentPath = (location.pathname || "").toLowerCase();

              // Find the item with the longest matching path
              let activeItemLabel = "";
              let longestMatchLength = -1;

              visibleNavItems.forEach((item) => {
                const itemPath = (item.path || "").toLowerCase();
                let isMatch = false;

                if (itemPath === "/dashboard") {
                  isMatch = currentPath === "/dashboard";
                } else {
                  isMatch = currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
                }

                if (isMatch && itemPath.length > longestMatchLength) {
                  longestMatchLength = itemPath.length;
                  activeItemLabel = item.label;
                }
              });

              return visibleNavItems.map((item) => {
                const isActive = item.label === activeItemLabel;

                return (
                  <li
                    key={item.label}
                    className={`nav-item ${isActive ? "active" : ""}`}
                  >
                    <div
                      className="nav-link"
                      onClick={() =>
                        item.sublinks
                          ? toggleDropdown(item.label)
                          : navigate(item.path)
                      }
                      role="button"
                      tabIndex={0}
                    >
                      {item.icon && (
                        <span className="material-symbols-rounded">
                          {item.icon}
                        </span>
                      )}
                      <span className="nav-label">{item.label}</span>

                      {item.sublinks && (
                        <span className="dropdown-icon material-symbols-rounded">
                          {openDropdown === item.label
                            ? "keyboard_arrow_up"
                            : "keyboard_arrow_down"}
                        </span>
                      )}
                    </div>

                    {/* Dropdown */}
                    {item.sublinks && (
                      <ul
                        className="dropdown-menu"
                        style={{
                          height:
                            openDropdown === item.label
                              ? `${item.sublinks.length * 40}px`
                              : "0",
                        }}
                      >
                        {item.sublinks.map((link) => (
                          <li
                            key={link.path}
                            className={`nav-subitem ${location.pathname === link.path ? "active" : ""}`}
                            onClick={() => navigate(link.path)}
                          >
                            {link.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              });
            })()}
          </ul>

          {/* Footer */}
          <ul className="nav-list secondary-nav">
            <li className="nav-item">
              <div onClick={handleLogout} className="nav-link cursor-pointer">
                <span className="material-symbols-rounded">logout</span>
                <span className="nav-label">Sign Out</span>
              </div>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
