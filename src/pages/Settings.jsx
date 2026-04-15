import { useEffect, useState } from "react";
import Layout from "../components/Layout";

function Settings() {
  const [business, setBusiness] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [preferences, setPreferences] = useState({
    currency: "INR",
    taxRate: 9,
    notes: "Thank you for your business! Payment is due within 30 days.",
  });

  // Load saved data
  useEffect(() => {
    const savedBusiness = localStorage.getItem("business");
    const savedPrefs = localStorage.getItem("preferences");

    if (savedBusiness) setBusiness(JSON.parse(savedBusiness));
    if (savedPrefs) setPreferences(JSON.parse(savedPrefs));
  }, []);

  // Save function
  const handleSave = () => {
    localStorage.setItem("business", JSON.stringify(business));
    localStorage.setItem("preferences", JSON.stringify(preferences));
    alert("Settings saved successfully!");
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Update invoice preferences</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* BUSINESS INFO */}
        <div className="dashboard-card">
          <h3 className="section-title">Business Info</h3>

          <div className="field-group">
            <label>Business Name</label>
            <input
              type="text"
              value={business.name}
              onChange={(e) =>
                setBusiness({ ...business, name: e.target.value })
              }
            />
          </div>

          <div className="field-group">
            <label>Email</label>
            <input
              type="email"
              value={business.email}
              onChange={(e) =>
                setBusiness({ ...business, email: e.target.value })
              }
            />
          </div>

          <div className="field-group">
            <label>Phone</label>
            <input
              type="text"
              value={business.phone}
              onChange={(e) =>
                setBusiness({ ...business, phone: e.target.value })
              }
            />
          </div>

          <div className="field-group">
            <label>Address</label>
            <textarea
              rows="4"
              value={business.address}
              onChange={(e) =>
                setBusiness({ ...business, address: e.target.value })
              }
            />
          </div>

          <button className="primary-btn" onClick={handleSave}>
            Save Changes
          </button>
        </div>

        {/* INVOICE SETTINGS */}
        <div className="dashboard-card">
          <h3 className="section-title">Invoice Preferences</h3>

          <div className="field-group">
            <label>Default Currency</label>
            <select
              value={preferences.currency}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  currency: e.target.value,
                })
              }
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          <div className="field-group">
            <label>Default Tax Rate</label>
            <input
              type="number"
              value={preferences.taxRate}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  taxRate: Number(e.target.value),
                })
              }
            />
          </div>

          <div className="field-group">
            <label>Default Notes</label>
            <textarea
              rows="4"
              value={preferences.notes}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  notes: e.target.value,
                })
              }
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Settings;