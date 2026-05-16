const nodemailer = require('nodemailer');
const dns = require('dns');

// Cache the resolved IPv4 address so we only do one DNS lookup
let cachedIPv4 = null;

/**
 * Resolve smtp.gmail.com to a pure IPv4 address.
 * dns.resolve4() ONLY returns A-records (IPv4), never AAAA (IPv6).
 * This completely bypasses the broken IPv6 routing on Render.
 */
async function getSmtpIPv4() {
  if (cachedIPv4) return cachedIPv4;
  return new Promise((resolve) => {
    dns.resolve4('smtp.gmail.com', (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        console.error('⚠️ dns.resolve4 failed, falling back to hostname:', err?.message);
        resolve('smtp.gmail.com'); // fallback – let nodemailer try normally
      } else {
        cachedIPv4 = addresses[0];
        console.log(`✅ Resolved smtp.gmail.com → IPv4: ${cachedIPv4}`);
        resolve(cachedIPv4);
      }
    });
  });
}

const sendEmail = async ({ to, subject, html }) => {
  try {
    const host = await getSmtpIPv4();

    // Create a fresh transporter with the resolved IPv4 address
    const transporter = nodemailer.createTransport({
      host: host,
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        // Required when host is an IP – tells TLS to validate the cert
        // against the real hostname, not the raw IP address
        servername: 'smtp.gmail.com',
      },
    });

    await transporter.sendMail({
      from: `"Invexis Inventory" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Email failed to ${to}:`, error.message);
  }
};

module.exports = sendEmail;

