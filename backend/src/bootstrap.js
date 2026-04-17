const fs = require('fs');
const path = require('path');

const entryFile = 'server.js';
const indexPath = path.join(__dirname, entryFile);
const runId = `run-${Date.now()}`;

function sendLog(hypothesisId, location, message, data) {
  // #region agent log
  console.log('[agent-log]', JSON.stringify({ runId, hypothesisId, location, message, data }));
  // #endregion
  // #region agent log
  fetch('http://127.0.0.1:7835/ingest/c854d1bd-8ad2-406b-a27e-c72ccee328b1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5dc49e'},body:JSON.stringify({sessionId:'5dc49e',runId,hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  // #endregion
}

let raw = Buffer.alloc(0);
try {
  raw = fs.readFileSync(indexPath);
  sendLog('H1', 'src/bootstrap.js:16', 'Read entry file bytes', {
    indexPath,
    exists: fs.existsSync(indexPath),
    byteLength: raw.length,
    first16Hex: raw.subarray(0, 16).toString('hex'),
    firstCharCodes: raw.subarray(0, 3).toJSON().data
  });
} catch (err) {
  sendLog('H2', 'src/bootstrap.js:25', 'Failed reading entry file', {
    name: err.name,
    message: err.message
  });
  throw err;
}

sendLog('H3', 'src/bootstrap.js:32', 'About to require entry file', {
  requirePath: `./${entryFile}`
});

try {
  require(`./${entryFile}`);
} catch (err) {
  sendLog('H4', 'src/bootstrap.js:38', 'Require index.js failed', {
    name: err.name,
    message: err.message,
    stackTop: String(err.stack || '').split('\n').slice(0, 3)
  });
  throw err;
}
