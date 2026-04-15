import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">📄</div>
        <h2>InvoiceEasy</h2>
      </div>

      <nav className="nav-menu">
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          Dashboard
        </NavLink>

        <NavLink
          to="/invoices"
          className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
        >
          Invoices
        </NavLink>

        <NavLink
          to="/clients"
          className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
        >
          Clients
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
        >
          Settings
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;