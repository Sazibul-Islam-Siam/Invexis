const verificationEmail = (name, verifyUrl) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
  <div style="max-width:500px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
    <div style="padding:32px 24px;text-align:center;background:linear-gradient(135deg,#4f46e5,#7c3aed);">
      <h1 style="color:#fff;margin:0;font-size:24px;">Welcome to Invexis</h1>
      <p style="color:#c7d2fe;margin:8px 0 0;font-size:14px;">Smart Inventory Management System</p>
    </div>
    <div style="padding:32px 24px;">
      <p style="color:#e2e8f0;font-size:16px;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Your account has been created. Please verify your email address by clicking the button below:
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px;">
          Verify Email
        </a>
      </div>
      <p style="color:#64748b;font-size:12px;text-align:center;margin:24px 0 0;">
        This link expires in 24 hours. If you didn't request this, ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`;

const restockNotifySupplier = (supplierName, productName, quantity, requestedBy) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
  <div style="max-width:500px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
    <div style="padding:24px;text-align:center;background:linear-gradient(135deg,#0ea5e9,#4f46e5);">
      <h1 style="color:#fff;margin:0;font-size:20px;">📦 New Restock Request</h1>
    </div>
    <div style="padding:24px;">
      <p style="color:#e2e8f0;font-size:15px;">Hi <strong>${supplierName}</strong>,</p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;">You have a new restock request:</p>
      <div style="background:#0f172a;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="color:#e2e8f0;margin:4px 0;font-size:14px;"><strong>Product:</strong> ${productName}</p>
        <p style="color:#e2e8f0;margin:4px 0;font-size:14px;"><strong>Quantity:</strong> ${quantity}</p>
        <p style="color:#e2e8f0;margin:4px 0;font-size:14px;"><strong>Requested by:</strong> ${requestedBy}</p>
      </div>
      <p style="color:#64748b;font-size:12px;">Log in to your Invexis dashboard to respond.</p>
    </div>
  </div>
</body>
</html>`;

const shipmentNotifyAdmin = (adminName, productName, quantity, supplierName) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
  <div style="max-width:500px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
    <div style="padding:24px;text-align:center;background:linear-gradient(135deg,#a855f7,#4f46e5);">
      <h1 style="color:#fff;margin:0;font-size:20px;">🚚 Shipment Shipped</h1>
    </div>
    <div style="padding:24px;">
      <p style="color:#e2e8f0;font-size:15px;">Hi <strong>${adminName}</strong>,</p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;">A supplier has marked a shipment as shipped:</p>
      <div style="background:#0f172a;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="color:#e2e8f0;margin:4px 0;font-size:14px;"><strong>Product:</strong> ${productName}</p>
        <p style="color:#e2e8f0;margin:4px 0;font-size:14px;"><strong>Quantity:</strong> ${quantity}</p>
        <p style="color:#e2e8f0;margin:4px 0;font-size:14px;"><strong>Supplier:</strong> ${supplierName}</p>
      </div>
      <p style="color:#64748b;font-size:12px;">Log in to confirm receipt when the items arrive.</p>
    </div>
  </div>
</body>
</html>`;

const deliveryNotifySupplier = (supplierName, productName, quantity) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
  <div style="max-width:500px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
    <div style="padding:24px;text-align:center;background:linear-gradient(135deg,#10b981,#059669);">
      <h1 style="color:#fff;margin:0;font-size:20px;">✅ Delivery Confirmed</h1>
    </div>
    <div style="padding:24px;">
      <p style="color:#e2e8f0;font-size:15px;">Hi <strong>${supplierName}</strong>,</p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;">Your delivery has been confirmed by the admin:</p>
      <div style="background:#0f172a;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="color:#e2e8f0;margin:4px 0;font-size:14px;"><strong>Product:</strong> ${productName}</p>
        <p style="color:#e2e8f0;margin:4px 0;font-size:14px;"><strong>Quantity:</strong> ${quantity}</p>
        <p style="color:#e2e8f0;margin:4px 0;font-size:14px;"><strong>Status:</strong> <span style="color:#10b981;">Delivered ✓</span></p>
      </div>
    </div>
  </div>
</body>
</html>`;

module.exports = {
  verificationEmail,
  restockNotifySupplier,
  shipmentNotifyAdmin,
  deliveryNotifySupplier,
};
