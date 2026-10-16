
import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

try {
  await transporter.verify();
  console.log("Gmail SMTP connection successful ✅");
} catch (error) {
  console.error("Gmail SMTP connection failed ❌");
  console.error(error.message);
}
