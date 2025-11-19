import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiGrid,
  FiLayout,
  FiUser,
  FiSettings,
} from "react-icons/fi";
import "./Sidebar.css";

export default function Sidebar() {
  const { pathname } = useLocation();

  // ----------------------------------------
  // 1️⃣ Extract orgId from current URL
  // ----------------------------------------
  let orgId = null;
  const match = pathname.match(/^\/org\/([^/]+)/);
  if (match) {
    orgId = match[1];
    // Save last visited org
    localStorage.setItem("lastOrgId", orgId);
  }

  // ----------------------------------------
  // 2️⃣ Use fallback if you're on Dashboard or WorkItems
  // ----------------------------------------
  if (!orgId) {
    const saved = localStorage.getItem("lastOrgId");
    if (saved) orgId = saved;
  }

  // ----------------------------------------
  // 3️⃣ Build sidebar links
  // ----------------------------------------
  const links = [
    { to: "/organisations", label: "Organisation", icon: <FiHome /> },

    {
      to: orgId ? `/org/${orgId}` : "/organisations",
      label: "Kanban Board",
      icon: <FiGrid />,
    },

    { to: "/dashboard", label: "Dashboard", icon: <FiLayout /> },
  ];

  return (
    <div className="sidebar">
      <h3 className="side-title">KIRO</h3>

      <div className="side-links">
        {links.map((l) => (
          <Link
            key={l.to}
            className={`side-link ${pathname === l.to ? "active" : ""}`}
            to={l.to}
          >
            <span className="icon">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </div>

      <div className="side-bottom">
        <Link className="side-link" to="/profile">
          <span className="icon"><FiUser /></span>
          Profile
        </Link>
        <Link className="side-link" to="/settings">
          <span className="icon"><FiSettings /></span>
          Settings
        </Link>
      </div>
    </div>
  );
}
