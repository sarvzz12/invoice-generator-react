import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function Invoices() {
  const [showPreview, setShowPreview] = useState(false);
  const [invoiceId, setInvoiceId] = useState(null);

  const [businessInfo, setBusinessInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("2026-04-13");
  const [dueDate, setDueDate] = useState("2026-04-20");
  const [currency, setCurrency] = useState("INR");
  const [taxRate, setTaxRate] = useState(18);
  const [notes, setNotes] = useState(
    "Thank you for your business! Payment is due within 30 days."
  );

  const [items, setItems] = useState([
  { description: "", quantity: 1, rate: 0 }
]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [invoices, setInvoices] = useState([]);

  const generateInvoiceNumber = (list = []) => {
    const year = new Date().getFullYear();
    const count = (Array.isArray(list) ? list.length : 0) + 1;
    return `INV-${year}-${String(count).padStart(3, "0")}`;
  };

  const fetchData = async () => {
    try {
      const [clientsRes, invoicesRes] = await Promise.all([
        api.get("/clients"),
        api.get("/invoices"),
      ]);

      setClients(clientsRes.data || []);
      setInvoices(invoicesRes.data || []);
    } catch (error) {
      console.error("Failed to fetch invoice data:", error);
    }
  };

  useEffect(() => {
    fetchData();

    const savedBusiness = localStorage.getItem("business");
    const savedPrefs = localStorage.getItem("preferences");

    if (savedBusiness) {
      try {
        setBusinessInfo(JSON.parse(savedBusiness));
      } catch (error) {
        console.error("Invalid business data:", error);
      }
    }

    if (savedPrefs) {
      try {
        const parsedPrefs = JSON.parse(savedPrefs);
        setCurrency(parsedPrefs.currency || "INR");
        setTaxRate(Number(parsedPrefs.taxRate || 18));
        setNotes(
          parsedPrefs.notes ||
            "Thank you for your business! Payment is due within 30 days."
        );
      } catch (error) {
        console.error("Invalid preferences data:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!invoiceId) {
      setInvoiceNumber(generateInvoiceNumber(invoices));
    }
  }, [invoices, invoiceId]);

  const selectedClientData = clients.find(
    (client) => client._id === selectedClient
  );

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      return sum + quantity * rate;
    }, 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return (subtotal * Number(taxRate || 0)) / 100;
  }, [subtotal, taxRate]);

  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  const formatCurrency = (value) => {
    const symbols = {
      INR: "₹",
      USD: "$",
      EUR: "€",
    };
    return `${symbols[currency] || "₹"}${Number(value || 0).toFixed(2)}`;
  };

  const numberToWords = (amount) => {
    const ones = [
      "",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
    ];
    const tens = [
      "",
      "",
      "twenty",
      "thirty",
      "forty",
      "fifty",
      "sixty",
      "seventy",
      "eighty",
      "ninety",
    ];

    const convert = (num) => {
      if (num < 20) return ones[num];
      if (num < 100) {
        return `${tens[Math.floor(num / 10)]} ${ones[num % 10]}`.trim();
      }
      if (num < 1000) {
        return `${ones[Math.floor(num / 100)]} hundred ${convert(
          num % 100
        )}`.trim();
      }
      if (num < 100000) {
        return `${convert(Math.floor(num / 1000))} thousand ${convert(
          num % 1000
        )}`.trim();
      }
      if (num < 10000000) {
        return `${convert(Math.floor(num / 100000))} lakh ${convert(
          num % 100000
        )}`.trim();
      }
      return String(num);
    };

    const rupees = Math.floor(Number(amount || 0));
    const paise = Math.round((Number(amount || 0) - rupees) * 100);

    let text = `${convert(rupees)} rupees`;
    if (paise > 0) {
      text += ` and ${convert(paise)} paise`;
    }

    return text.charAt(0).toUpperCase() + text.slice(1) + ".";
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: field === "description" ? value : Number(value),
            }
          : item
      )
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { description: "", quantity: 1, rate: 0 },
    ]);
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setInvoiceId(null);
    setInvoiceNumber(generateInvoiceNumber(invoices));
    setInvoiceDate("2026-04-13");
    setDueDate("2026-04-20");
    setCurrency("INR");
    setTaxRate(18);
    setNotes("Thank you for your business! Payment is due within 30 days.");
    setItems([]);
    setSelectedClient("");
  };

  const handleCreateOrUpdateInvoice = async () => {
    try {
      if (!selectedClient) {
        alert("Please select a client");
        return;
      }

      if (items.length === 0) {
        alert("Please add at least one item");
        return;
      }

      const payload = {
        clientId: selectedClient,
        invoiceNumber,
        status: "draft",
        sender: {
          businessName: businessInfo.name || "Your Business",
          email: businessInfo.email || "",
          phone: businessInfo.phone || "",
          addressLine1: businessInfo.address || "",
          city: "",
          state: "",
          country: "",
          logoUrl: "",
        },
        invoiceDate,
        dueDate,
        currency,
        taxRate,
        items,
        notes,
      };

      let res;
      if (invoiceId) {
        res = await api.put(`/invoices/${invoiceId}`, payload);
        alert("Invoice updated successfully");
      } else {
        res = await api.post("/invoices", payload);
        alert("Invoice created successfully");
      }

      setInvoiceId(res.data._id);
      await fetchData();
    } catch (error) {
      console.error("Failed to save invoice:", error);
      alert(error.response?.data?.message || "Error saving invoice");
    }
  };

  const handleEditInvoice = (inv) => {
    setInvoiceId(inv._id);
    setInvoiceNumber(inv.invoiceNumber || "");
    setInvoiceDate(
      inv.invoiceDate
        ? new Date(inv.invoiceDate).toISOString().split("T")[0]
        : ""
    );
    setDueDate(
      inv.dueDate ? new Date(inv.dueDate).toISOString().split("T")[0] : ""
    );
    setCurrency(inv.currency || "INR");
    setTaxRate(Number(inv.taxRate || 0));
    setNotes(inv.notes || "");
    setSelectedClient(inv.clientId?._id || inv.clientId || "");
    setItems(
      Array.isArray(inv.items)
        ? inv.items.map((item) => ({
            description: item.description || "",
            quantity: Number(item.quantity || 0),
            rate: Number(item.rate || 0),
          }))
        : []
    );

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteInvoice = async (id) => {
    try {
      const confirmDelete = window.confirm("Delete this invoice?");
      if (!confirmDelete) return;

      await api.delete(`/invoices/${id}`);
      alert("Invoice deleted successfully");
      await fetchData();

      if (invoiceId === id) {
        resetForm();
      }
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      alert(error.response?.data?.message || "Delete failed");
    }
  };

  const handleSendInvoice = async () => {
    try {
      if (!invoiceId) {
        alert("Please save or update invoice first");
        return;
      }

      const res = await api.post(`/invoices/${invoiceId}/send`);
      alert(res.data.message || "Invoice sent successfully");
    } catch (error) {
      console.error("Send invoice error:", error);
      alert(error.response?.data?.message || "Failed to send invoice");
    }
  };

  const handleMarkPaid = async (inv) => {
    try {
      await api.put(`/invoices/${inv._id}`, {
        clientId: inv.clientId?._id || inv.clientId,
        invoiceNumber: inv.invoiceNumber,
        status: "paid",
        sender: inv.sender,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        currency: inv.currency,
        taxRate: inv.taxRate,
        items: (inv.items || []).map((item) => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
        })),
        notes: inv.notes,
      });

      alert("Invoice marked as paid");
      await fetchData();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert(error.response?.data?.message || "Status update failed");
    }
  };

  const renderInvoiceTemplate = () => (
    <div className="invoice-template-preview">
      <div className="template-top-bar" />

      <div className="template-header">
        <div className="template-brand-block">
          <div className="template-logo-grid">
            <span />
            <span />
            <span />
            <span />
          </div>

          <div>
            <h2>{businessInfo.name || "Your Company"}</h2>
            <p>{businessInfo.email || ""}</p>
            <p>{businessInfo.phone || ""}</p>
            <p>{businessInfo.address || ""}</p>
          </div>
        </div>

        <div className="template-right">
          <h1>INVOICE</h1>
          <p>#{invoiceNumber}</p>
        </div>
      </div>

      <div className="template-divider" />

      <div className="template-meta">
        <div>
          <p className="template-label">BILL TO</p>
          <h3>{selectedClientData?.companyName || "CLIENT NAME"}</h3>
          <h3>{selectedClientData?.contactPerson || ""}</h3>
          <p>
            <strong>Project:</strong> {items[0]?.description || "Service"}
          </p>
        </div>

        <div className="template-date-block">
          <p className="template-label">INVOICE DATE</p>
          <h3>{invoiceDate}</h3>
        </div>
      </div>

      <div className="template-table-header">
        <span>S.No.</span>
        <span>Description of Service</span>
        <span>Amount (₹)</span>
      </div>

      {items.map((item, index) => (
        <div className="template-table-row" key={index}>
          <span>{index + 1}.</span>
          <span>{item.description || "Service"}</span>
          <span>
            {Number(
              Number(item.quantity || 0) * Number(item.rate || 0)
            ).toFixed(2)}
          </span>
        </div>
      ))}

      <div className="template-empty-row" />
      <div className="template-empty-row" />

      <div className="template-total-bar">
        <span>TOTAL</span>
        <span>{Number(total || 0).toFixed(2)}</span>
      </div>

      <div className="template-words-row">
        <span className="template-words-label">Amount in words:</span>
        <span className="template-words-text">{numberToWords(total)}</span>
      </div>

      <div className="template-bottom">
        <div className="template-payment-box">
          <h4>PAYMENT DETAILS</h4>
          <div className="template-paid-text">PAID</div>
        </div>

        <div className="template-signatory">
          <p>AUTHORIZED SIGNATORY</p>
          <div className="template-sign-line" />
          <strong>({businessInfo.name || "Your Company"})</strong>
        </div>
      </div>

      <div className="template-footer">
        Thank you for your business! For queries:{" "}
        {businessInfo.email || ""}
      </div>

      <div className="template-bottom-bar" />
    </div>
  );

  const handleDownloadPDF = async () => {
    try {
      const element = document.querySelector("#invoice-pdf-template");

      if (!element) {
        alert("Invoice preview not found");
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const finalHeight = Math.min(imgHeight, pdfHeight - 4);

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, finalHeight);
      pdf.save(`${invoiceNumber}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to download PDF");
    }
  };

  return (
    <Layout>
      <div className="invoice-page">
        <div className="invoice-main">
          <div className="invoice-card">
            <div className="invoice-header">
              <div>
                <h1 className="invoice-title">
                  {invoiceId
                    ? `Edit Invoice: ${invoiceNumber}`
                    : `Invoice: ${invoiceNumber}`}
                </h1>
                <span className="status-badge">
                  {invoiceId ? "Editing" : "Draft"}
                </span>
              </div>
            </div>

            <div className="invoice-top-grid">
              <div className="info-box">
                <p className="label">From</p>
                <h3>{businessInfo.name || "Your Business"}</h3>
                <p>{businessInfo.address || ""}</p>
                <p>{businessInfo.email || ""}</p>
                <p>{businessInfo.phone || ""}</p>
              </div>

              <div className="info-box">
                <p className="label">Bill To</p>
                {selectedClient ? (
                  <>
                    <h3>{selectedClientData?.companyName || "Selected Client"}</h3>
                    <p>{selectedClientData?.contactPerson || ""}</p>
                    <p>{selectedClientData?.email || ""}</p>
                    <p>{selectedClientData?.phone || ""}</p>
                    <p>{selectedClientData?.addressLine1 || ""}</p>
                  </>
                ) : (
                  <p>Select a client below</p>
                )}
              </div>
            </div>

            <div className="invoice-meta-grid">
              <div className="field-group">
                <label>Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label>Invoice Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label>Select Client</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                >
                  <option value="">-- Select Client --</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.companyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="items-section">
              <div className="table-head">
                <h3>Line Items</h3>
                <button className="light-btn" type="button" onClick={addItem}>
                  + Add Item
                </button>
              </div>

              <div className="items-table">
                <div className="items-row items-header-row">
                  <div>Description</div>
                  <div>Qty</div>
                  <div>Rate</div>
                  <div>Amount</div>
                </div>

                {items.map((item, index) => {
                  const amount =
                    Number(item.quantity || 0) * Number(item.rate || 0);

                  return (
                    <div className="items-row" key={index}>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, "description", e.target.value)
                        }
                      />

                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                      />

                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) =>
                          handleItemChange(index, "rate", e.target.value)
                        }
                      />

                      <div className="amount-cell-wrap">
                        <input
                          type="text"
                          value={formatCurrency(amount)}
                          readOnly
                        />
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeItem(index)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}

                {items.length === 0 && (
                  <p style={{ padding: "16px 0" }}>No items added yet</p>
                )}
              </div>
            </div>

            <div className="bottom-section">
              <div className="notes-box">
                <label>Notes</label>
                <textarea
                  rows="5"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="summary-box">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>

                <div className="summary-row">
                  <span>Tax ({taxRate}%)</span>
                  <strong>{formatCurrency(taxAmount)}</strong>
                </div>

                <div className="summary-row total-row">
                  <span>Total</span>
                  <strong>{formatCurrency(total)}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-card invoice-list-card">
            <h3 className="section-title">All Invoices</h3>

            {invoices.length === 0 ? (
              <p className="empty-text">No invoices yet</p>
            ) : (
              <div className="simple-table">
                <div className="simple-table-head invoice-table-grid">
                  <div>Invoice</div>
                  <div>Client</div>
                  <div>Status</div>
                  <div>Amount</div>
                  <div>Actions</div>
                </div>

                {invoices.map((inv) => (
                  <div
                    className="simple-table-row invoice-table-grid"
                    key={inv._id}
                  >
                    <div>{inv.invoiceNumber}</div>
                    <div>{inv.clientSnapshot?.companyName || "Client"}</div>
                    <div>
                      <span className={`mini-badge ${inv.status}`}>
                        {inv.status}
                      </span>
                    </div>
                    <div>₹{Number(inv.total || 0).toFixed(2)}</div>
                    <div className="table-actions">
                      <button
                        className="table-btn edit-btn"
                        type="button"
                        onClick={() => handleEditInvoice(inv)}
                      >
                        Edit
                      </button>

                      <button
                        className="table-btn paid-btn"
                        type="button"
                        onClick={() => handleMarkPaid(inv)}
                      >
                        Paid
                      </button>

                      <button
                        className="table-btn delete-btn"
                        type="button"
                        onClick={() => handleDeleteInvoice(inv._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="invoice-side">
          <div className="side-card action-card">
            <button
              className="primary-btn full"
              type="button"
              onClick={handleCreateOrUpdateInvoice}
            >
              {invoiceId ? "Update Invoice" : "Save Draft"}
            </button>

            <button
              className="outline-btn full"
              type="button"
              onClick={() => setShowPreview(true)}
            >
              Preview
            </button>

            <button
              className="outline-btn full"
              type="button"
              onClick={handleDownloadPDF}
            >
              Download PDF
            </button>

            <button
              className="outline-btn full"
              type="button"
              onClick={resetForm}
            >
              Clear Form
            </button>

            <button
              className="dark-btn full"
              type="button"
              onClick={handleSendInvoice}
            >
              Send Invoice
            </button>
          </div>

          <div className="side-card">
            <h3>Invoice Settings</h3>

            <div className="field-group">
              <label>Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            <div className="field-group">
              <label>Tax Rate</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="side-card preview-card">
            <p className="mini-label">Preview</p>
            <h4>{invoiceNumber}</h4>
            <p>{selectedClientData?.companyName || "Select client"}</p>
            <p>Due: {dueDate}</p>
            <div className="mini-total">{formatCurrency(total)}</div>
          </div>
        </div>
      </div>

      <div className="pdf-hidden-template">
        <div id="invoice-pdf-template">{renderInvoiceTemplate()}</div>
      </div>

      {showPreview && (
        <div className="preview-modal">
          <div className="preview-content preview-content-large">
            <div className="preview-inside-modal">{renderInvoiceTemplate()}</div>

            <div className="preview-modal-actions">
              <button
                type="button"
                className="primary-btn"
                onClick={() => setShowPreview(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
export default Invoices;