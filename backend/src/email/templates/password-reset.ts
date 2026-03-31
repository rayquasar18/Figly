/**
 * Password reset email template for Figly.
 * Returns branded HTML with reset button.
 */
export function renderPasswordResetEmail(name: string, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dat lai mat khau - Figly</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;margin-top:32px;margin-bottom:32px;">
    <!-- Header -->
    <tr>
      <td style="background-color:#6366f1;padding:32px 24px;text-align:center;">
        <h1 style="color:#ffffff;font-size:28px;margin:0;font-weight:700;">Figly</h1>
        <p style="color:#e0e7ff;font-size:14px;margin:8px 0 0;">Cong dong suu tap cua ban</p>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:32px 24px;">
        <h2 style="color:#1f2937;font-size:20px;margin:0 0 16px;">Xin chao ${escapeHtml(name)}!</h2>
        <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">
          Chung toi nhan duoc yeu cau dat lai mat khau cho tai khoan cua ban. Nhan nut ben duoi de tao mat khau moi.
        </p>
        <!-- CTA Button -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align:center;padding:8px 0 24px;">
              <a href="${escapeHtml(resetUrl)}"
                 style="display:inline-block;background-color:#6366f1;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:600;">
                Dat lai mat khau
              </a>
            </td>
          </tr>
        </table>
        <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0 0 8px;">
          Lien ket nay se het han sau <strong>1 gio</strong>.
        </p>
        <p style="color:#ef4444;font-size:14px;line-height:1.5;margin:16px 0 0;padding:12px;background-color:#fef2f2;border-radius:4px;">
          Neu ban khong yeu cau dat lai mat khau, vui long bo qua email nay. Mat khau cua ban se khong thay doi.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">&copy; Figly. Moi quyen duoc bao luu.</p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
