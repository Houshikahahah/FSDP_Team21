import { Link, useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const getOrgIdFromPath = () => {
    const match = pathname.match(/^\/org\/([^/]+)/);
    return match ? match[1] : null;
  };

  const goKanban = () => {
    const orgIdFromUrl = getOrgIdFromPath();
    const savedOrgId = localStorage.getItem("activeOrgId");
    const orgId = orgIdFromUrl || savedOrgId;

    navigate(orgId ? `/org/${orgId}/kanban` : "/kanban");
  };

  // ✅ Kanban is active ONLY on /kanban or /org/:id/kanban
  const isKanbanActive =
    pathname === "/kanban" || /^\/org\/[^/]+\/kanban$/.test(pathname);

  const links = [
    { to: "/organisations", label: "Organisation", icon: <FiHome /> },
    { to: "/dashboard", label: "Dashboard", icon: <FiLayout /> },
    { to: "/timeline", label: "Timeline", icon: <FiCalendar /> },
  ];

  const isActive = (path) => pathname === path || pathname.startsWith(path + "/");

  return (
    <div className="sidebar">
      <h3 className="side-title">KIRO</h3>

      <div className="side-links">
        {/* ✅ Organisation FIRST */}
        <Link
          to="/organisations"
          className={`side-link ${isActive("/organisations") ? "active" : ""}`}
        >
          <span className="icon">
            <FiHome />
          </span>
          Organisation
        </Link>

        {/* ✅ Kanban SECOND (org-aware redirect) */}
        <button
          type="button"
          onClick={goKanban}
          className={`side-link ${isKanbanActive ? "active" : ""}`}
        >
          <span className="icon">
            <FiGrid />
          </span>
          Kanban Board
        </button>

        {/* ✅ Rest */}
        {links
          .filter((l) => l.to !== "/organisations")
          .map((l) => (
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
