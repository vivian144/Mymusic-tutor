const https = require('https');

const isDev = process.env.NODE_ENV !== 'production';

// MSG91 expects "91XXXXXXXXXX" (country code + 10-digit number)
const formatMobile = (phone) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

// Minimal Promise wrapper around https.request — no external deps needed
const httpsPost = (url, body, headers = {}) =>
  new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const parsed  = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });

const httpsGet = (url, headers = {}) =>
  new Promise((resolve, reject) => {
    const parsed  = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      method:   'GET',
      headers
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.end();
  });

// ─── sendOTP ──────────────────────────────────────────────────────────────────
// Sends a 6-digit OTP via MSG91 SMS using the DLT-approved OTP template.
// Throws on API failure so callers can surface the error to the user.
// In dev mode: logs to console and returns without hitting the API.

const sendOTP = async (phone, otp) => {
  const mobile = formatMobile(phone);

  if (isDev) {
    console.log(`[SMS DEV] to=+${mobile} | OTP=${otp}`);
    return;
  }

  const { status, body } = await httpsPost(
    'https://api.msg91.com/api/v5/otp',
    {
      template_id: process.env.MSG91_OTP_TEMPLATE_ID,
      mobile,
      sender:      process.env.MSG91_SENDER_ID || 'MMTUTR',
      otp:         String(otp)
    },
    { authkey: process.env.MSG91_API_KEY }
  );

  let parsed = {};
  try { parsed = JSON.parse(body); } catch { /* non-JSON body */ }

  if (status !== 200 || parsed.type === 'error') {
    const reason = parsed.message || `HTTP ${status}`;
    console.error(`[SMS] MSG91 OTP send failed for +${mobile}: ${reason}`);
    throw new Error('Failed to send OTP via SMS. Please try again.');
  }
};

// ─── verifySMS ────────────────────────────────────────────────────────────────
// Optional: delegates OTP verification to MSG91 instead of Redis.
// Primary verification still happens through Redis in each service function;
// this is exposed for cases where you want MSG91 to be the authority.

const verifySMS = async (phone, otp) => {
  const mobile = formatMobile(phone);

  if (isDev) {
    console.log(`[SMS DEV] verify +${mobile} otp=${otp}`);
    return true;
  }

  const url = `https://api.msg91.com/api/v5/otp/verify?authkey=${process.env.MSG91_API_KEY}&mobile=${mobile}&otp=${otp}`;
  const { body } = await httpsGet(url, { authkey: process.env.MSG91_API_KEY });

  let parsed = {};
  try { parsed = JSON.parse(body); } catch { /* non-JSON body */ }

  return parsed.type === 'success';
};

module.exports = { sendOTP, verifySMS };
