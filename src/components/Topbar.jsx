function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-right">
        <div className="profile-badge">JD</div>
        <span className="profile-name">Jane Doe</span>
        <span className="notification">Notifications</span>
        <input className="search-box" type="text" placeholder="Search" />
      </div>
    </header>
  );
}

export default Topbar;