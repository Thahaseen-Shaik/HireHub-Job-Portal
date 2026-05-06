const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const logRoutes = require('./routes/logRoutes');
const managerRoutes = require('./routes/managerRoutes');
const userPortalRoutes = require('./routes/userPortalRoutes');
const contactRoutes = require('./routes/contactRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const pool = require('./config/database');

const User = require('./models/User');
const { hashPassword } = require('./utils/authUtils');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = String(process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : true
}));
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/user-portal', userPortalRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/settings', settingsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error Handler Middleware
app.use(errorHandler);

const ensureDemoUsers = async () => {
  const defaults = [
    { name: 'Irfan Demo User', email: 'irfanshaikmohammad1@gmail.com', password: 'User@123', role: 'user' },
    { name: 'Super Admin', email: 'admin@hirehub.com', password: 'Admin@123', role: 'admin' },
    { name: 'Hiring Manager', email: 'manager@hirehub.com', password: 'Manager12', role: 'manager' }
  ];

  for (const item of defaults) {
    try {
      const existing = await User.findByEmail(item.email);
      const hashedPassword = await hashPassword(item.password);

      if (existing) {
        await pool.query(
          'UPDATE users SET name = $1, email = $2, password = $3, role = $4, is_blocked = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
          [item.name, item.email.toLowerCase(), hashedPassword, item.role, existing.id]
        );
        console.log(`Demo user synced: ${item.email} / ${item.password}`);
        continue;
      }

      try {
        await User.create(item.name, item.email, hashedPassword, item.role);
      } catch (createError) {
        if (item.role === 'manager' && /users_role_check/i.test(createError.message || '')) {
          await User.create(item.name, item.email, hashedPassword, 'company_manager');
        } else {
          throw createError;
        }
      }
      console.log(`Demo user created: ${item.email} / ${item.password}`);
    } catch (error) {
      console.error(`Unable to prepare demo user ${item.email}:`, error.message);
    }
  }
};

const ensureSupportedUserRolesConstraint = async () => {
  // Drop old restrictive role constraint first.
  await pool.query(`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  `);

  // Normalize historical/invalid role values before re-adding the app constraint.
  await pool.query(`
    UPDATE users
    SET role = CASE
      WHEN role IS NULL OR BTRIM(role) = '' THEN 'user'
      WHEN LOWER(BTRIM(role)) IN ('admin', 'superadmin', 'manager', 'company_manager', 'user') THEN LOWER(BTRIM(role))
      WHEN LOWER(BTRIM(role)) IN ('employee', 'candidate', 'jobseeker') THEN 'user'
      WHEN LOWER(BTRIM(role)) IN ('employer', 'recruiter', 'hr') THEN 'manager'
      ELSE 'user'
    END
    WHERE role IS DISTINCT FROM CASE
      WHEN role IS NULL OR BTRIM(role) = '' THEN 'user'
      WHEN LOWER(BTRIM(role)) IN ('admin', 'superadmin', 'manager', 'company_manager', 'user') THEN LOWER(BTRIM(role))
      WHEN LOWER(BTRIM(role)) IN ('employee', 'candidate', 'jobseeker') THEN 'user'
      WHEN LOWER(BTRIM(role)) IN ('employer', 'recruiter', 'hr') THEN 'manager'
      ELSE 'user'
    END;
  `);

  // Keep local/dev schema compatible with all app roles used by auth/routes.
  await pool.query(`
    ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('admin', 'superadmin', 'manager', 'company_manager', 'user'));
  `);
};

// Start Server
app.listen(PORT, async () => {
  console.log(`\nServer is running on http://localhost:${PORT}\n`);

  try {
    await ensureSupportedUserRolesConstraint();
  } catch (error) {
    console.error('Skipping role-constraint bootstrap due to DB compatibility issue:', error.message);
  }

  try {
    await ensureDemoUsers();
  } catch (error) {
    console.error('Skipping demo user bootstrap due to startup error:', error.message);
  }
});
