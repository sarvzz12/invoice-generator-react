import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="app-shell">
      {/* Mobile Topbar */}
      <div className="mobile-topbar">
        <button
          className="menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open Menu"
        >
          ☰
        </button>
        <h2 className="brand-title">InvoiceEasy</h2>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <h2>InvoiceEasy</h2>
          <button className="close-btn" onClick={closeMenu}>
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/"
            className={location.pathname === "/" ? "active" : ""}
            onClick={closeMenu}
          >
            Dashboard
          </Link>

          <Link
            to="/invoices"
            className={location.pathname === "/invoices" ? "active" : ""}
            onClick={closeMenu}
          >
            Invoices
          </Link>

          <Link
            to="/clients"
            className={location.pathname === "/clients" ? "active" : ""}
            onClick={closeMenu}
          >
            Clients
          </Link>

          <Link
            to="/settings"
            className={location.pathname === "/settings" ? "active" : ""}
            onClick={closeMenu}
          >
            Settings
          </Link>
        </nav>
      </aside>

      {/* Overlay */}
      {menuOpen && <div className="sidebar-overlay" onClick={closeMenu}></div>}

      {/* Main */}
      <main className="main-content">{children}</main>
    </div>
  );
}

export default Layout;