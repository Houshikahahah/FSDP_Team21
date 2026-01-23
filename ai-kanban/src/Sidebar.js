import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiGrid,
  FiLayout,
  FiUser,
  FiSettings,
  FiCalendar,
} from "react-icons/fi";
import "./Sidebar.css";

export default function Sidebar() {
  const { pathname } = useLocation();

  const links = [
    { to: "/organisations", label: "Organisation", icon: <FiHome /> },
    { to: "/kanban", label: "Kanban Board", icon: <FiGrid /> },
    { to: "/dashboard", label: "Dashboard", icon: <FiLayout /> },

    // ✅ NEW: Personal Timeline
    { to: "/timeline", label: "Timeline", icon: <FiCalendar /> },
  ];

  const isActive = (path) =>
    pathname === path || pathname.startsWith(path + "/");

  return (
    <div className="sidebar">
      <h3 className="side-title">KIRO</h3>

      <div className="side-links">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`side-link ${isActive(l.to) ? "active" : ""}`}
          >
            <span className="icon">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </div>

      <div className="side-bottom">
        <Link
          className={`side-link ${isActive("/profile") ? "active" : ""}`}
          to="/profile"
        >
          <span className="icon">
            <FiUser />
          </span>
          Profile
        </Link>

        <Link
          className={`side-link ${isActive("/settings") ? "active" : ""}`}
          to="/settings"
        >
          <span className="icon">
            <FiSettings />
          </span>
          Settings
        </Link>
      </div>
    </div>
  );
}
