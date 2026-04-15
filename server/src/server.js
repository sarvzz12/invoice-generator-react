import dotenv from "dotenv";
import dns from "dns";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();
dns.setDefaultResultOrder("ipv4first");

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});