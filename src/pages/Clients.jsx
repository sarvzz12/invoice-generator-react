import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

function Clients() {
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);

  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    country: "",
    notes: "",
  });

  const fetchClients = async () => {
    try {
      const res = await api.get("/clients");
      setClients(res.data);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setEditingClientId(null);
    setFormData({
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      addressLine1: "",
      city: "",
      state: "",
      country: "",
      notes: "",
    });
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingClientId) {
        await api.put(`/clients/${editingClientId}`, formData);
        alert("Client updated successfully");
      } else {
        await api.post("/clients", formData);
        alert("Client added successfully");
      }

      resetForm();
      fetchClients();
    } catch (error) {
      console.error("Failed to save client:", error);
      alert(error.response?.data?.message || "Failed to save client");
    }
  };

  const handleEdit = (client) => {
    setEditingClientId(client._id);
    setFormData({
      companyName: client.companyName || "",
      contactPerson: client.contactPerson || "",
      email: client.email || "",
      phone: client.phone || "",
      addressLine1: client.addressLine1 || "",
      city: client.city || "",
      state: client.state || "",
      country: client.country || "",
      notes: client.notes || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this client?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/clients/${id}`);
      alert("Client deleted successfully");

      if (editingClientId === id) {
        resetForm();
      }

      fetchClients();
    } catch (error) {
      console.error("Failed to delete client:", error);
      alert(error.response?.data?.message || "Failed to delete client");
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Manage all your client records</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => {
            if (showForm && !editingClientId) {
              setShowForm(false);
            } else {
              resetForm();
              setShowForm(true);
            }
          }}
        >
          {showForm ? "Close Form" : "+ Add Client"}
        </button>
      </div>

      {showForm && (
        <div className="dashboard-card client-form-card">
          <h3 className="section-title">
            {editingClientId ? "Edit Client" : "Add New Client"}
          </h3>

          <form onSubmit={handleSubmit} className="client-form-grid">
            <div className="field-group">
              <label>Company Name</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field-group">
              <label>Contact Person</label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field-group">
              <label>Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="field-group">
              <label>Address</label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
              />
            </div>

            <div className="field-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div className="field-group">
              <label>State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
            </div>

            <div className="field-group">
              <label>Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
              />
            </div>

            <div className="field-group full-width">
              <label>Notes</label>
              <textarea
                name="notes"
                rows="4"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            <div className="full-width client-form-actions">
              <button type="submit" className="primary-btn">
                {editingClientId ? "Update Client" : "Save Client"}
              </button>

              <button
                type="button"
                className="outline-btn"
                onClick={resetForm}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="dashboard-card">
        <div className="simple-table">
          <div className="simple-table-head clients-table-grid">
            <div>Company</div>
            <div>Contact</div>
            <div>Email</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {clients.length === 0 ? (
            <p className="empty-text">No clients found</p>
          ) : (
            clients.map((client) => (
              <div
                className="simple-table-row clients-table-grid"
                key={client._id}
              >
                <div>{client.companyName}</div>
                <div>{client.contactPerson}</div>
                <div>{client.email}</div>
                <div>
                  <span className="mini-badge paid">Active</span>
                </div>
                <div className="table-actions">
                  <button
                    className="table-btn edit-btn"
                    type="button"
                    onClick={() => handleEdit(client)}
                  >
                    Edit
                  </button>

                  <button
                    className="table-btn delete-btn"
                    type="button"
                    onClick={() => handleDelete(client._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Clients;