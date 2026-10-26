import nodemailer from "nodemailer"

// Outgoing mail via SMTP (Hostinger: smtp.hostinger.com, port 465, the
// mailbox address and its password). Configured with environment variables:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM (optional)
let transporter = null

const getTransporter = () => {
    if (transporter) return transporter

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        throw new Error("Email service is not configured")
    }

    const port = Number(SMTP_PORT) || 465
    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure: port === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
    return transporter
}

const sendMail = async ({ to, subject, text, html }) => {
    const from = process.env.MAIL_FROM || `Velariq Fashion <${process.env.SMTP_USER}>`
    await getTransporter().sendMail({ from, to, subject, text, html })
}

// Simple branded email carrying a 6-digit code
const codeEmail = ({ heading, intro, code, minutes }) => {
    const text = `${heading}\n\n${intro}\n\nYour code: ${code}\n\nIt expires in ${minutes} minutes. If you didn't ask for this, you can ignore this email.\n\nVelariq Fashion`
    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1f2937">
  <p style="font-size:20px;font-weight:bold;letter-spacing:2px;color:#b8860b;margin:0 0 24px">VELARIQ FASHION</p>
  <h1 style="font-size:20px;margin:0 0 12px">${heading}</h1>
  <p style="font-size:14px;line-height:1.6;margin:0 0 24px">${intro}</p>
  <p style="font-size:32px;font-weight:bold;letter-spacing:8px;background:#f3f4f6;border-radius:8px;padding:16px;text-align:center;margin:0 0 24px">${code}</p>
  <p style="font-size:12px;color:#6b7280;line-height:1.6;margin:0">This code expires in ${minutes} minutes. If you didn't ask for this, you can ignore this email.</p>
</div>`
    return { text, html }
}

export { sendMail, codeEmail }
