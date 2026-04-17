const { Sequelize } = require('sequelize');
require('dotenv').config();
const runId = `run-${Date.now()}`;

function debugLog(hypothesisId, location, message, data) {
  // #region agent log
  console.log('[agent-log]', JSON.stringify({ runId, hypothesisId, location, message, data }));
  // #endregion
  // #region agent log
  return fetch('http://127.0.0.1:7835/ingest/c854d1bd-8ad2-406b-a27e-c72ccee328b1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5dc49e'},body:JSON.stringify({sessionId:'5dc49e',runId,hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  // #endregion
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDB = async () => {
  let phase = 'init';
  // #region agent log
  void debugLog('H1', 'src/config/database.js:28', 'DB config presence check', {
    hasDbName: Boolean(process.env.DB_NAME),
    hasDbUser: Boolean(process.env.DB_USER),
    hasDbPassword: Boolean(process.env.DB_PASSWORD),
    hasDbHost: Boolean(process.env.DB_HOST),
    hasDbPort: Boolean(process.env.DB_PORT),
    nodeEnv: process.env.NODE_ENV || 'development'
  });
  // #endregion
  try {
    phase = 'authenticate';
    // #region agent log
    void debugLog('H2', 'src/config/database.js:40', 'Starting sequelize authenticate', {
      host: process.env.DB_HOST || null,
      port: process.env.DB_PORT || null,
      dialect: 'postgres'
    });
    // #endregion
    await sequelize.authenticate();
    // #region agent log
    void debugLog('H2', 'src/config/database.js:47', 'Sequelize authenticate succeeded', { phase });
    // #endregion
    console.log('✅ PostgreSQL connected successfully');
    
    // Auto-sync models in development
    if (process.env.NODE_ENV === 'development') {
      phase = 'sync';
      // #region agent log
      void debugLog('H3', 'src/config/database.js:55', 'Starting sequelize sync alter', { alter: true });
      // #endregion
      await sequelize.sync({ alter: true });
      // #region agent log
      void debugLog('H3', 'src/config/database.js:59', 'Sequelize sync completed', { phase });
      // #endregion
      console.log('✅ Database models synced');
    }
  } catch (error) {
    // #region agent log
    await debugLog('H4', 'src/config/database.js:64', 'Database connectDB catch executed', {
      phase,
      name: error?.name || null,
      message: error?.message || null,
      code: error?.code || null,
      parentCode: error?.parent?.code || null,
      parentMessage: error?.parent?.message || null,
      stackTop: String(error?.stack || '').split('\n').slice(0, 4)
    });
    // #endregion
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };