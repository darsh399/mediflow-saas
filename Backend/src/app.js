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
import targetRoutes from './routes/targetRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import holidayRoutes from './routes/holidayRoutes.js';
import leavePolicyRoutes from './routes/leavePolicyRoutes.js';
import errorMiddleware from './middleware/errorMiddleware.js';
import salaryRoutes from './routes/salaryRoutes.js';
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


const corsOptions = {
    
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  console.log(
    `➡️ ${req.method} ${req.originalUrl}`
  );

  next();
});

app.use((req, res, next) => {
    const origin = req.headers.origin || process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
   
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
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

connectDB().then(() => startBirthdayScheduler()).catch((error) => console.error('Database startup failed:', error.message));

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
app.use('/api/targets', targetRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/calendar/holidays', holidayRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/company-products', companyProductRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/billing', subscriptionSelfServiceRoutes);
app.use('/api/demo-requests', demoRequestRoutes);
// Keep legacy /superadmin route
app.use('/superadmin', superadminRoutes);
// Also expose superadmin API under /api/superadmin so frontend dev proxy can forward API calls
app.use('/api/superadmin', superadminRoutes);

// Debug: list registered routes (temporary)
app.get('/__routes', (req, res) => {
    try {
        const routes = []
        app._router.stack.forEach((middleware) => {
            if (middleware.route) {
                // routes registered directly on the app
                const methods = Object.keys(middleware.route.methods).join(',')
                routes.push({ path: middleware.route.path, methods })
            } else if (middleware.name === 'router' && middleware.handle && middleware.handle.stack) {
                // router middleware
                middleware.handle.stack.forEach((handler) => {
                    if (handler.route) {
                        const methods = Object.keys(handler.route.methods).join(',')
                        routes.push({ path: handler.route.path, methods })
                    }
                })
            }
        })
        res.json({ routes })
    } catch (err) { res.status(500).json({ error: err.message }) }
})

// error handler (should be last)
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
