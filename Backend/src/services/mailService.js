// import nodemailer from 'nodemailer';

// let transporter = null;

// const initTransporter = async () => {
//   if (transporter) return transporter;
//   if (!process.env.SMTP_HOST) return null;
//   transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: Number(process.env.SMTP_PORT) || 587,
//     secure: process.env.SMTP_SECURE === 'true',
//     auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
//   });
//   try {
//     await transporter.verify();
//     console.log('SMTP transporter verified')
//   } catch (err) {
//     console.error('SMTP verify failed:', err && err.message ? err.message : err)
//   }
//   return transporter;
// }

// export const sendMail = async (opts = {}) => {
//   const t = await initTransporter();
//   if (!t) {
//     console.log('SMTP not configured — skipping sendMail, opts:', opts);
//     throw new Error('SMTP is not configured. Set SMTP_HOST and SMTP_FROM before sending email.');
//   }
//   try {
//     const info = await t.sendMail({
//       from: process.env.SMTP_FROM || `no-reply@${process.env.SMTP_HOST}`,
//       to: opts.to,
//       subject: opts.subject || '(no subject)',
//       text: opts.text || '',
//       html: opts.html || undefined,
//       attachments: opts.attachments || undefined,
//     });
//     console.log('Mail sent:', info && info.messageId ? info.messageId : '')
//     return info;
//   } catch (err) {
//     console.error('sendMail error:', err && err.message ? err.message : err)
//     throw err
//   }
// }

// export default { sendMail };


// import nodemailer from "nodemailer";

// let transporter = null;

// const initTransporter = () => {
//   if (transporter) {
//     return transporter;
//   }

//   if (!process.env.SMTP_HOST) {
//     console.error("❌ SMTP_HOST is not configured");
//     return null;
//   }

//   transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: Number(process.env.SMTP_PORT || 587),

//     secure: process.env.SMTP_SECURE === "true",

//     auth: process.env.SMTP_USER
//       ? {
//           user: process.env.SMTP_USER,
//           pass: process.env.SMTP_PASS,
//         }
//       : undefined,

//     // Prevent SMTP from keeping the API waiting for too long
//     connectionTimeout: 10000,
//     greetingTimeout: 10000,
//     socketTimeout: 20000,

//     // Reuse SMTP connections
//     pool: true,
//     maxConnections: 5,
//     maxMessages: 100,
//   });

//   return transporter;
// };

// export const sendMail = async (opts = {}) => {
//   const t = initTransporter();

//   if (!t) {
//     throw new Error(
//       "SMTP is not configured. Please configure SMTP_HOST."
//     );
//   }

//   if (!opts.to) {
//     throw new Error("Recipient email is required.");
//   }

//   try {
//     const info = await t.sendMail({
//       from:
//         process.env.SMTP_FROM ||
//         process.env.SMTP_USER,

//       to: opts.to,

//       subject: opts.subject || "(no subject)",

//       text: opts.text || "",

//       html: opts.html || undefined,

//       attachments: opts.attachments || undefined,
//     });

//     console.log(
//       "✅ Mail sent:",
//       info?.messageId || "No message ID"
//     );

//     return info;
//   } catch (err) {
//     console.error("❌ sendMail error:", {
//       message: err?.message,
//       code: err?.code,
//       response: err?.response,
//       command: err?.command,
//     });

//     throw err;
//   }
// };

// export const verifyMail = async () => {
//   const t = initTransporter();

//   if (!t) {
//     console.error("❌ SMTP is not configured");
//     return false;
//   }

//   try {
//     await t.verify();

//     console.log("✅ SMTP transporter verified");

//     return true;
//   } catch (err) {
//     console.error("❌ SMTP verify failed:", {
//       message: err?.message,
//       code: err?.code,
//       response: err?.response,
//     });

//     return false;
//   }
// };

// export default {
//   sendMail,
//   verifyMail,
// };



import nodemailer from "nodemailer";
import { lookup } from "node:dns/promises";
import net from "node:net";
import tls from "node:tls";

let transporter = null;

const createSystemResolvedSocket = async (options, callback) => {
  try {
    // Nodemailer's c-ares DNS lookup fails on this Windows DNS setup
    // (queryA ETIMEOUT/ECONNREFUSED), while the system resolver works.
    const { address } = await lookup(process.env.SMTP_HOST, { family: 4 });
    const secure = process.env.SMTP_SECURE === "true";
    const socket = secure
      ? tls.connect({ host: address, port: options.port, servername: process.env.SMTP_HOST })
      : net.connect({ host: address, port: options.port });

    const onError = (error) => callback(error);
    socket.once("error", onError);
    socket.once(secure ? "secureConnect" : "connect", () => {
      socket.removeListener("error", onError);
      callback(null, { connection: socket, secured: secure });
    });
  } catch (error) {
    callback(error);
  }
};

const createTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.error("❌ SMTP configuration is missing");
    console.error("SMTP_HOST:", process.env.SMTP_HOST);
    console.error("SMTP_USER:", process.env.SMTP_USER ? "Configured" : "Missing");
    console.error("SMTP_PASS:", process.env.SMTP_PASS ? "Configured" : "Missing");

    return null;
  }

  console.log("📧 Creating SMTP transporter...");
  console.log("SMTP_HOST:", process.env.SMTP_HOST);
  console.log("SMTP_PORT:", process.env.SMTP_PORT);
  console.log("SMTP_USER:", process.env.SMTP_USER);
  console.log("SMTP_FROM:", process.env.SMTP_FROM);

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),

    secure: process.env.SMTP_SECURE === "true",

    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },

    // Gmail DNS/network calls can occasionally take longer than 10 seconds.
    // Keep this asynchronous, but allow a real connection enough time to finish.
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,

    pool: true,
    maxConnections: 3,
    maxMessages: 100,

    getSocket: createSystemResolvedSocket,
  });

  return transporter;
};

export const verifySMTP = async () => {
  try {
    const t = createTransporter();

    if (!t) {
      console.error("❌ SMTP transporter could not be created");
      return false;
    }

    console.log("📧 Verifying Gmail SMTP connection...");

    await t.verify();

    console.log("✅ Gmail SMTP connection verified successfully");

    return true;
  } catch (err) {
    console.error("❌ Gmail SMTP verification failed");
    console.error("Message:", err?.message);
    console.error("Code:", err?.code);
    console.error("Response:", err?.response);

    return false;
  }
};

export const sendMail = async (opts = {}) => {
  try {
    const t = createTransporter();

    if (!t) {
      throw new Error(
        "SMTP is not configured. Check SMTP_HOST, SMTP_USER and SMTP_PASS."
      );
    }

    if (!opts.to) {
      throw new Error("Recipient email is required");
    }

    console.log("----------------------------------------");
    console.log("📧 STARTING EMAIL SEND");
    console.log("To:", opts.to);
    console.log("Subject:", opts.subject);
    console.log("----------------------------------------");

    const info = await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,

      to: opts.to,

      subject: opts.subject || "(no subject)",

      text: opts.text || "",

      html: opts.html || undefined,

      attachments: opts.attachments || undefined,
    });

    console.log("----------------------------------------");
    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log("To:", opts.to);
    console.log("Message ID:", info?.messageId || "N/A");
    console.log("----------------------------------------");

    return info;
  } catch (err) {
    console.error("----------------------------------------");
    console.error("❌ EMAIL SEND FAILED");
    console.error("Message:", err?.message);
    console.error("Code:", err?.code);
    console.error("Command:", err?.command);
    console.error("Response:", err?.response);
    console.error("----------------------------------------");

    throw err;
  }
};

export default {
  sendMail,
  verifySMTP,
};
