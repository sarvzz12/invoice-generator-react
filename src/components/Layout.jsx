import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user")) || {};

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/invoices", label: "Invoices" },
    { path: "/clients", label: "Clients" },
    { path: "/settings", label: "Settings" },
  ];

  return (
    <div className="layout-shell">
      <div className="mobile-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Open Menu"
        >
          ☰
        </button>
        <h2 className="mobile-brand">InvoiceEasy</h2>
      </div>

      {menuOpen && <div className="sidebar-backdrop" onClick={closeMenu}></div>}

      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">InvoiceEasy</div>
          <button className="sidebar-close" onClick={closeMenu}>
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? "active" : ""}
              onClick={closeMenu}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <div className="layout-main">
        <header className="topbar">
          <div className="topbar-right">
            <div className="user-badge">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="topbar-user-info">
              <span className="topbar-user-name">{user?.name || "User"}</span>
              <span className="topbar-user-sub">Notifications</span>
            </div>
          </div>

          <input className="topbar-search" type="text" placeholder="Search" />
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

export default Layout;