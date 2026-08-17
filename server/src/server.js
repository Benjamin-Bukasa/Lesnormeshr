const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');

const env = require('./config/env');
const prisma = require('./lib/prisma');
const corsOptions = require('./config/cors');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const employeeRoutes = require('./routes/employee.routes');
const performanceRoutes = require('./routes/performance.routes');
const talentAcquisitionRoutes = require('./routes/talent-acquisition.routes');
const workspaceRoutes = require('./routes/workspace.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();

if (env.trustProxy) {
  app.set('trust proxy', 1);
}

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'lesnormes-auth-api',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/talent-acquisition', talentAcquisitionRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap() {
  await prisma.$connect();

  app.listen(env.port, () => {
    console.log(`LesNormes RH API listening on port ${env.port}`);
  });
}

bootstrap().catch(async (error) => {
  console.error('Unable to start server:', error);
  await prisma.$disconnect();
  process.exit(1);
});
