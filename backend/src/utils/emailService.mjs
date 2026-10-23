import nodemailer from "nodemailer";

let cachedTransporter = null;

const getTransporter = () => {
    if (cachedTransporter) {
        return cachedTransporter;
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return null;
    }

    cachedTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    return cachedTransporter;
};

export const isEmailConfigured = () => {
    return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
};

export const sendEmail = async ({ to, subject, text, html, attachments }) => {
    const transporter = getTransporter();

    if (!transporter) {
        console.warn(`[EmailService] Email sending skipped (SMTP not configured). To: ${to}, Subject: ${subject}`);
        return {
            success: false,
            skipped: true,
            message: "Email credentials not configured in environment",
        };
    }

    try {
        const info = await transporter.sendMail({
            from: `"SecureBank" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
            attachments,
        });

        return {
            success: true,
            messageId: info.messageId,
        };
    } catch (error) {
        console.error("[EmailService] Failed to send email:", error.message);
        return {
            success: false,
            error: error.message,
        };
    }
};
