import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function Layout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-section">
        <Topbar />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}

export default Layout;