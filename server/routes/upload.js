const express = require('express');
const router = express.Router();
const multer = require('multer');
const File = require('../models/File');

// Configure Multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(file.originalname.toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: File upload only supports the following filetypes - ' + filetypes));
    }
}).single('file'); // Generic field name 'file'

// Upload Endpoint
router.post('/', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file selected!' });
        }

        try {
            // Create new File document
            const newFile = new File({
                filename: req.file.originalname,
                contentType: req.file.mimetype,
                data: req.file.buffer
            });

            await newFile.save();

            // Return URL to access the file
            // The URL structure will be /api/files/:id
            res.json({
                message: 'File uploaded!',
                filePath: `/api/files/${newFile._id}`, // Frontend expects this format
                fileName: newFile.filename
            });

        } catch (dbErr) {
            console.error('Database upload error:', dbErr);
            res.status(500).json({ message: 'Error saving file to database' });
        }
    });
});

module.exports = router;
