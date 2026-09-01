import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import connectDB from './config/dbConnection.js';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import visitRoutes from './routes/visitRoutes.js';
import medicalRoutes from './routes/medicalRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import userRoutes from './routes/userRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import employeeProfileRoutes from './routes/employeeProfileRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import productRoutes from './routes/productRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import superadminRoutes from './routes/superadminRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import territoryRoutes from './routes/territoryRoutes.js';
import tourPlanRoutes from './routes/tourPlanRoutes.js';
import dcrRoutes from './routes/dcrRoutes.js';
import sampleRoutes from './routes/sampleRoutes.js';
import targetRoutes from './routes/targetRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import holidayRoutes from './routes/holidayRoutes.js';
import leavePolicyRoutes from './routes/leavePolicyRoutes.js';
import errorMiddleware from './middleware/errorMiddleware.js';
import salaryRoutes from './routes/salaryRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import companyProductRoutes from './routes/companyProductRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import subscriptionSelfServiceRoutes from './routes/subscriptionSelfServiceRoutes.js';
import demoRequestRoutes from './routes/demoRequestRoutes.js';
import { startBirthdayScheduler } from './services/birthdayNotificationService.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured before starting the server');
}

const app = express();


const allowedOrigins = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...(process.env.CLIENT_URL || process.env.FRONTEND_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean),
]);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) return callback(null, true);
        return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
    if(req.path === '/favicon.ico' || req.path === '/favicon.png') {
        res.status(204).end();
    } else {
        next();
    }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));


app.get('/__ping', (req, res) => res.json({ ok: true }))

// Keep old activation emails usable when they point to the API server.
app.get('/activate-account', (req, res) => {
    const frontendUrl = process.env.FRONTEND_INVITE_URL || 'http://localhost:5173';
    const query = new URLSearchParams(req.query).toString();
    res.redirect(`${frontendUrl.replace(/\/$/, '')}/activate-account${query ? `?${query}` : ''}`);
});

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/medicals', medicalRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/leaves', leavePolicyRoutes);
app.use('/api', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/employee-profiles', employeeProfileRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/territories', territoryRoutes);
app.use('/api/tour-plans', tourPlanRoutes);
app.use('/api/dcr', dcrRoutes);
app.use('/api/samples', sampleRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/calendar/holidays', holidayRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/company-products', companyProductRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/billing', subscriptionSelfServiceRoutes);
app.use('/api/demo-requests', demoRequestRoutes);
// Keep legacy /superadmin route
app.use('/superadmin', superadminRoutes);
// Also expose superadmin API under /api/superadmin so frontend dev proxy can forward API calls
app.use('/api/superadmin', superadminRoutes);

// error handler (should be last)
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
connectDB()
    .then(() => {
        startBirthdayScheduler();
        app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    })
    .catch((error) => {
        console.error('Database startup failed:', error.message);
        process.exitCode = 1;
    });
