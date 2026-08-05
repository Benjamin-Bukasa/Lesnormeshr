const env = require('./env');

const corsOptions = {
  origin(origin, callback) {
    if (!origin || env.appOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin non autorisee par CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = corsOptions;
