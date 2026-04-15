import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [userRes, clientsRes, invoicesRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/clients"),
          api.get("/invoices"),
        ]);

        setUser(userRes.data);
        setClients(clientsRes.data);
        setInvoices(invoicesRes.data);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      }
    };

    fetchDashboardData();
  }, []);

  const paidInvoices = invoices.filter((inv) => inv.status === "paid");
  const pendingInvoices = invoices.filter(
    (inv) => inv.status === "draft" || inv.status === "sent"
  );

  const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back{user ? `, ${user.name}` : ""}
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total Invoices</p>
          <h2 className="stat-value">{invoices.length}</h2>
          <span className="stat-note">All created invoices</span>
        </div>

        <div className="stat-card">
          <p className="stat-label">Paid</p>
          <h2 className="stat-value">₹{totalPaid.toFixed(2)}</h2>
          <span className="stat-note">Completed payments</span>
        </div>

        <div className="stat-card">
          <p className="stat-label">Pending</p>
          <h2 className="stat-value">₹{totalPending.toFixed(2)}</h2>
          <span className="stat-note">Awaiting payment</span>
        </div>

        <div className="stat-card">
          <p className="stat-label">Clients</p>
          <h2 className="stat-value">{clients.length}</h2>
          <span className="stat-note">Active client records</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-head">
            <h3>Recent Invoices</h3>
          </div>

          <div className="simple-table">
            <div className="simple-table-head">
              <div>Invoice</div>
              <div>Client</div>
              <div>Status</div>
              <div>Amount</div>
            </div>

            {invoices.length === 0 ? (
              <p>No invoices found</p>
            ) : (
              invoices.slice(0, 5).map((invoice) => (
                <div className="simple-table-row" key={invoice._id}>
                  <div>{invoice.invoiceNumber}</div>
                  <div>{invoice.clientSnapshot?.companyName || "Client"}</div>
                  <div>
                    <span className={`mini-badge ${invoice.status}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div>₹{Number(invoice.total || 0).toFixed(2)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-head">
            <h3>Quick Summary</h3>
          </div>

          <div className="summary-list">
            <div className="summary-item">
              <span>Total Clients</span>
              <strong>{clients.length}</strong>
            </div>
            <div className="summary-item">
              <span>Draft Invoices</span>
              <strong>
                {invoices.filter((inv) => inv.status === "draft").length}
              </strong>
            </div>
            <div className="summary-item">
              <span>Paid Invoices</span>
              <strong>{paidInvoices.length}</strong>
            </div>
            <div className="summary-item">
              <span>Total Revenue</span>
              <strong>₹{totalPaid.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;