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
import superadminRoutes from './routes/superadminRoutes.js';
import errorMiddleware from './middleware/errorMiddleware.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured before starting the server');
}

const app = express();


const corsOptions = {
    // reflect request origin so dev server ports (5173/5174) work without changing env vars
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
// enable CORS with options and explicit preflight handler
app.use(cors(corsOptions));
// note: avoid app.options with '*' to prevent path parsing errors in this router

// Fallback headers middleware to ensure CORS headers are always present
app.use((req, res, next) => {
    const origin = req.headers.origin || process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    // echo the incoming origin when present so browsers accept credentialed responses
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Simple test route
app.get('/__ping', (req, res) => res.json({ ok: true }))

// Keep old activation emails usable when they point to the API server.
app.get('/activate-account', (req, res) => {
    const frontendUrl = process.env.FRONTEND_INVITE_URL || 'http://localhost:5173';
    const query = new URLSearchParams(req.query).toString();
    res.redirect(`${frontendUrl.replace(/\/$/, '')}/activate-account${query ? `?${query}` : ''}`);
});

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/medicals', medicalRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/employee-profiles', employeeProfileRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
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