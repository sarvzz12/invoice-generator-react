const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
const Invoice = require("../models/Invoice");
const Client = require("../models/Client");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");

// ================= CALCULATE =================
const calculateTotals = (items = [], taxRate = 0) => {
  const normalizedItems = items.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const amount = quantity * rate;

    return {
      description: item.description,
      quantity,
      rate,
      amount,
    };
  });

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = (subtotal * Number(taxRate || 0)) / 100;
  const total = subtotal + taxAmount;

  return {
    items: normalizedItems,
    subtotal,
    taxAmount,
    total,
    amountDue: total,
  };
};

const numberToWords = (amount) => {
  const ones = [
    "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen"
  ];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

  const convert = (num) => {
    if (num < 20) return ones[num];
    if (num < 100) return `${tens[Math.floor(num / 10)]} ${ones[num % 10]}`.trim();
    if (num < 1000) return `${ones[Math.floor(num / 100)]} hundred ${convert(num % 100)}`.trim();
    if (num < 100000) return `${convert(Math.floor(num / 1000))} thousand ${convert(num % 1000)}`.trim();
    if (num < 10000000) return `${convert(Math.floor(num / 100000))} lakh ${convert(num % 100000)}`.trim();
    return String(num);
  };

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let text = `${convert(rupees)} rupees`;
  if (paise > 0) {
    text += ` and ${convert(paise)} paise`;
  }

  return text.charAt(0).toUpperCase() + text.slice(1) + ".";
};

const formatDate = (dateValue) => {
  const date = new Date(dateValue);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// ================= PDF BUFFER =================
const generateInvoicePDFBuffer = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const green = "#0a8f2a";
      const lightGray = "#f2f2f2";
      const midGray = "#777777";
      const dark = "#222222";

      const companyName = invoice.sender?.businessName || "Your Company";
      const companyEmail = invoice.sender?.email || "";
      const companyPhone = invoice.sender?.phone || "";
      const companyAddress = invoice.sender?.addressLine1 || "";

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const left = 55;
      const right = pageWidth - 55;

      // Top and bottom bars
      doc.rect(0, 0, pageWidth, 26).fill(green);
      doc.rect(0, pageHeight - 18, pageWidth, 18).fill(green);

      // Header logo blocks
      const logoX = left;
      const logoY = 70;
      const box = 22;
      const gap = 8;

      doc.fillColor(green).rect(logoX, logoY, box, box).fill();
      doc.fillColor(green).rect(logoX + box + gap, logoY, 16, 16).fill();
      doc.fillColor(green).rect(logoX, logoY + box + gap, box, box).fill();
      doc.fillColor(green).rect(logoX + box + gap, logoY + box + gap, 16, 16).fill();

      // Company block
      doc.fillColor(green)
        .font("Helvetica-Bold")
        .fontSize(25)
        .text(companyName, logoX + 78, 80);

      doc.fillColor("#666666")
        .font("Helvetica")
        .fontSize(11)
        .text(companyEmail, logoX + 78, 116)
        .text(companyPhone, logoX + 78, 134)
        .text(companyAddress, logoX + 78, 152);

      // Right title
      doc.fillColor(dark)
        .font("Helvetica-Bold")
        .fontSize(38)
        .text("INVOICE", 330, 78, {
          width: 170,
          align: "right",
        });

      doc.fillColor("#8a8a8a")
        .font("Helvetica-Bold")
        .fontSize(15)
        .text(`#${invoice.invoiceNumber}`, 330, 126, {
          width: 170,
          align: "right",
        });

      // Divider
      doc.moveTo(left, 195).lineTo(right, 195).strokeColor("#d9d9d9").lineWidth(1).stroke();

      // Bill to / date
      doc.fillColor(midGray)
        .font("Helvetica")
        .fontSize(12)
        .text("BILL TO", left, 230);

      doc.fillColor(dark)
        .font("Helvetica-Bold")
        .fontSize(16)
        .text((invoice.clientSnapshot?.companyName || "CLIENT NAME").toUpperCase(), left, 256);

      let billY = 286;
      if (invoice.clientSnapshot?.contactPerson) {
        doc.text(invoice.clientSnapshot.contactPerson, left, billY);
        billY += 30;
      }

      doc.fillColor(midGray)
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("Project:", left, billY);

      doc.fillColor("#8a8a8a")
        .font("Helvetica")
        .fontSize(14)
        .text(invoice.items?.[0]?.description || "Service", left + 62, billY);

      doc.fillColor(midGray)
        .font("Helvetica")
        .fontSize(12)
        .text("INVOICE DATE", 390, 230, {
          width: 110,
          align: "right",
        });

      doc.fillColor(dark)
        .font("Helvetica-Bold")
        .fontSize(16)
        .text(formatDate(invoice.invoiceDate), 360, 258, {
          width: 140,
          align: "right",
        });

      // Table header
      const tableX = left;
      const tableW = right - left;
      const tableY = 350;
      const rowH = 34;

      doc.rect(tableX, tableY, tableW, rowH).fill(green);

      doc.fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("S.No.", tableX + 24, tableY + 11);

      doc.text("Description of Service", tableX + 120, tableY + 11);

      doc.text("Amount (₹)", tableX + tableW - 120, tableY + 11, {
        width: 90,
        align: "right",
      });

      // Items rows
      let y = tableY + rowH + 18;

      invoice.items.forEach((item, index) => {
        doc.fillColor(dark).font("Helvetica").fontSize(12);
        doc.text(`${index + 1}.`, tableX + 26, y);
        doc.text(item.description || "Service", tableX + 120, y);
        doc.font("Helvetica-Bold").text(
          Number(item.amount || 0).toFixed(2),
          tableX + tableW - 120,
          y,
          {
            width: 90,
            align: "right",
          }
        );
        y += 34;
      });

      // Decorative rows
      doc.rect(tableX, y, tableW, 40).fill(lightGray);
      y += 60;
      doc.rect(tableX, y, tableW, 40).fill(lightGray);
      y += 52;

      // Total bar
      doc.rect(tableX, y, tableW, 42).fill(green);

      doc.fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(17)
        .text("TOTAL", tableX + 24, y + 12);

      doc.text(Number(invoice.total || 0).toFixed(2), tableX + tableW - 130, y + 12, {
        width: 100,
        align: "right",
      });

      // Amount in words
      const wordsY = y + 72;

      doc.fillColor(midGray)
        .font("Helvetica-Oblique")
        .fontSize(12)
        .text("Amount in words:", tableX, wordsY);

      doc.fillColor(dark)
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(numberToWords(Number(invoice.total || 0)), tableX + 126, wordsY, {
          width: 360,
        });

      // Payment box
      const payBoxX = tableX;
      const payBoxY = wordsY + 42;
      const payBoxW = 210;
      const payBoxH = 110;

      doc.roundedRect(payBoxX, payBoxY, payBoxW, payBoxH, 10).fill(lightGray);

      doc.fillColor(green)
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("PAYMENT DETAILS", payBoxX, payBoxY + 14, {
          width: payBoxW,
          align: "center",
        });

      doc.fillColor("#777")
        .font("Helvetica")
        .fontSize(24)
        .text(invoice.status?.toUpperCase() === "PAID" ? "PAID" : "PAID", payBoxX, payBoxY + 58, {
          width: payBoxW,
          align: "center",
        });

      // Signatory
      const signX = 390;
      const signY = wordsY + 46;

      doc.fillColor("#9a9a9a")
        .font("Helvetica")
        .fontSize(12)
        .text("AUTHORIZED SIGNATORY", signX, signY, {
          width: 140,
          align: "center",
        });

      doc.moveTo(signX + 20, signY + 78)
        .lineTo(signX + 130, signY + 78)
        .strokeColor("#333")
        .lineWidth(1)
        .stroke();

      doc.fillColor(dark)
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(`(${companyName})`, signX, signY + 88, {
          width: 140,
          align: "center",
        });

      // Footer
      doc.fillColor("#7a7a7a")
        .font("Helvetica-Oblique")
        .fontSize(11)
        .text(
          `Thank you for your business! For queries: ${companyEmail || "your@email.com"}`,
          left,
          pageHeight - 48,
          {
            width: right - left,
            align: "center",
          }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// ================= SEND INVOICE =================
const sendInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const clientEmail = invoice.clientSnapshot?.email || process.env.EMAIL_USER;
    const pdfBuffer = await generateInvoicePDFBuffer(invoice);

    const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    family: 4,
  },
});
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: clientEmail,
      subject: `Invoice ${invoice.invoiceNumber}`,
      html: `
        <h2>Invoice ${invoice.invoiceNumber}</h2>
        <p>Please find your invoice attached as PDF.</p>
        <p>Total: ₹${invoice.total}</p>
        <p>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
      `,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    res.json({ message: "Invoice PDF sent successfully" });
  } catch (error) {
    console.error("SEND ERROR:", error);
    res.status(500).json({
      message: "Failed to send invoice",
      error: error.message,
    });
  }
};

// ================= CREATE =================
const createInvoice = async (req, res) => {
  try {
    const {
      clientId,
      invoiceNumber,
      status,
      sender,
      invoiceDate,
      dueDate,
      currency,
      taxRate,
      items,
      notes,
    } = req.body;

    const client = await Client.findOne({
      _id: clientId,
      userId: req.user.userId,
    });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    const totals = calculateTotals(items, taxRate);

    const invoice = await Invoice.create({
      userId: req.user.userId,
      clientId,
      invoiceNumber,
      status: status || "draft",
      sender,
      clientSnapshot: {
        companyName: client.companyName,
        contactPerson: client.contactPerson,
        email: client.email,
        phone: client.phone,
        addressLine1: client.addressLine1,
        city: client.city,
        state: client.state,
        country: client.country,
      },
      invoiceDate,
      dueDate,
      currency: currency || "INR",
      taxRate: Number(taxRate || 0),
      items: totals.items,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      total: totals.total,
      amountDue: totals.amountDue,
      notes: notes || "",
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create invoice",
      error: error.message,
    });
  }
};

// ================= GET ALL =================
const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch invoices",
      error: error.message,
    });
  }
};

// ================= GET ONE =================
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch invoice",
      error: error.message,
    });
  }
};

// ================= UPDATE =================
const updateInvoice = async (req, res) => {
  try {
    const existingInvoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!existingInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const finalItems = req.body.items || existingInvoice.items;
    const finalTaxRate =
      req.body.taxRate !== undefined
        ? Number(req.body.taxRate)
        : existingInvoice.taxRate;

    const totals = calculateTotals(finalItems, finalTaxRate);

    const updatedInvoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      {
        ...req.body,
        taxRate: finalTaxRate,
        items: totals.items,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        amountDue: totals.amountDue,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedInvoice);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update invoice",
      error: error.message,
    });
  }
};

// ================= DELETE =================
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete invoice",
      error: error.message,
    });
  }
};

export {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  sendInvoice,
};