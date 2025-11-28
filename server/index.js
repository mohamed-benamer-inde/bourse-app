const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log('Created uploads directory');
}

// Security Middleware
app.use(helmet()); // Secure HTTP headers

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
});
app.use(limiter);

// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173', // Local development
    process.env.FRONTEND_URL // Production URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Fallback: If FRONTEND_URL is not set in env, allow all origins (to avoid breaking prod if config is missing)
        if (!process.env.FRONTEND_URL) {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    credentials: true
}));

app.use(express.json());

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Database Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bourse_app');
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        console.log('Could not connect to local MongoDB, attempting to start in-memory database...');
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            const uri = mongod.getUri();
            await mongoose.connect(uri);
            console.log('Connected to In-Memory MongoDB');
        } catch (memoryErr) {
            console.error('Could not start in-memory database:', memoryErr);
            console.error('Original error:', err);
        }
    }
};
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/admin', require('./routes/admin'));

// Serve files from MongoDB (Protected)
const File = require('./models/File');
const auth = require('./middleware/auth'); // Import auth middleware

app.get('/api/files/:id', auth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ message: 'Fichier non trouvé' });
        }

        // Check if user has access to this file (Optional but recommended: check if file belongs to a request the user can see)
        // For now, basic auth is a huge improvement over public access.

        res.set('Content-Type', file.contentType);
        res.send(file.data);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur serveur');
    }
});

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
