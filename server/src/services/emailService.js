import nodemailer from 'nodemailer';

export class EmailService {
  constructor() {
    this.sentEmailKeys = new Set();
    this.sentEmailsLog = []; // In-memory history for audit/testing
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: process.env.SMTP_SECURE === 'true' || port === 465,
          auth: { user, pass }
        });
      } catch (err) {
        console.error('Failed to initialize SMTP transporter:', err.message);
        this.transporter = null;
      }
    }
  }

  getOwnerEmail() {
    return process.env.OWNER_EMAIL || 'owner@gamingcenter.com';
  }

  getFromAddress() {
    return process.env.EMAIL_FROM || '"GameDashboard Gaming Center" <notifications@gamingcenter.com>';
  }

  /**
   * Sends 5-minute warning notification email to owner.
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {string} params.customerName
   * @param {string} params.stationName
   * @param {Date|string} [params.startTime]
   * @param {Date|string} params.scheduledEndTime
   * @param {number} [params.remainingMinutes=5]
   * @returns {Promise<{ success: boolean, deduplicated?: boolean, error?: string }>}
   */
  async sendFiveMinuteWarningEmail({
    sessionId,
    customerName = 'Guest',
    stationName = 'PC Station',
    startTime = null,
    scheduledEndTime,
    remainingMinutes = 5
  }) {
    const dedupeKey = `warn_email_${sessionId}`;
    if (this.sentEmailKeys.has(dedupeKey)) {
      return { success: true, deduplicated: true };
    }

    const ownerEmail = this.getOwnerEmail();
    const subject = `Gaming Session Ending Soon - PC ${stationName}`;

    const formattedStart = startTime
      ? new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'N/A';
    const formattedEnd = scheduledEndTime
      ? new Date(scheduledEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'N/A';

    const textContent = [
      `GAMING SESSION EXPIRING SOON`,
      `---------------------------------------`,
      `PC / Station: ${stationName}`,
      `Customer Name: ${customerName}`,
      `Remaining Time: ${remainingMinutes} minutes`,
      `Start Time: ${formattedStart}`,
      `Scheduled End Time: ${formattedEnd}`,
      `---------------------------------------`,
      `Notification sent automatically by GameDashboard Gaming Management System.`
    ].join('\n');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 550px;">
        <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 20px;">
          <h2 style="color: #f59e0b; margin-top: 0; font-size: 20px;">
            ⚠️ Gaming Session Ending Soon
          </h2>
          <p style="font-size: 14px; color: #94a3b8; margin-bottom: 20px;">
            Only <strong>${remainingMinutes} minutes remaining</strong> for customer <strong>${customerName}</strong> on <strong>${stationName}</strong>.
          </p>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
            <tr style="border-bottom: 1px solid #334155;">
              <td style="padding: 8px 0; color: #94a3b8;">Station / PC:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #38bdf8;">${stationName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #334155;">
              <td style="padding: 8px 0; color: #94a3b8;">Customer:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right;">${customerName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #334155;">
              <td style="padding: 8px 0; color: #94a3b8;">Start Time:</td>
              <td style="padding: 8px 0; text-align: right;">${formattedStart}</td>
            </tr>
            <tr style="border-bottom: 1px solid #334155;">
              <td style="padding: 8px 0; color: #94a3b8;">Scheduled End:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #fbbf24;">${formattedEnd}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8;">Remaining Time:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #f87171;">${remainingMinutes} minutes</td>
            </tr>
          </table>

          <div style="margin-top: 20px; padding: 12px; background-color: #0f172a; border-radius: 6px; font-size: 12px; color: #94a3b8; text-align: center;">
            Staff have been alerted on the counter dashboard to check for extension or checkout.
          </div>
        </div>
      </div>
    `;

    const emailRecord = {
      to: ownerEmail,
      subject,
      customerName,
      stationName,
      remainingMinutes,
      timestamp: new Date()
    };

    // Mark as sent before sending to guarantee single-dispatch even under concurrency
    this.sentEmailKeys.add(dedupeKey);
    this.sentEmailsLog.push(emailRecord);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.getFromAddress(),
          to: ownerEmail,
          subject,
          text: textContent,
          html: htmlContent
        });
        console.log(`[EMAIL] 5-minute alert delivered to ${ownerEmail} for ${stationName} (${customerName})`);
        return { success: true };
      } catch (err) {
        console.error(`[EMAIL ERROR] Failed to send email via SMTP to ${ownerEmail}:`, err.message);
        // Do not crash, popup still functions
        return { success: false, error: err.message };
      }
    } else {
      // Mock / Logged delivery when SMTP credentials are not configured in environment
      console.log(`[EMAIL MOCK] Notification logged for Owner (${ownerEmail}): "${subject}" [Customer: ${customerName}]`);
      return { success: true, mock: true };
    }
  }

  getSentEmails() {
    return [...this.sentEmailsLog];
  }

  reset() {
    this.sentEmailKeys.clear();
    this.sentEmailsLog = [];
  }
}

export const emailService = new EmailService();
