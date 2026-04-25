const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary (It will automatically use CLOUDINARY_URL if it exists in the environment)
if (!process.env.CLOUDINARY_URL) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

// Configure Multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 2000000 }, // 2MB limit
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
            console.error('Multer upload error:', err);
            return res.status(400).json({ message: err.message });
        }
        if (!req.file) {
            console.error('No file received in request');
            return res.status(400).json({ message: 'No file selected!' });
        }

        console.log('File received in memory:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        try {
            // Determine resource type for Cloudinary
            const resourceType = req.file.mimetype === 'application/pdf' ? 'raw' : 'image';

            // Upload to Cloudinary using stream
            const streamUpload = (req) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { 
                            folder: 'bourseconnect',
                            resource_type: resourceType,
                            public_id: req.file.originalname.split('.')[0] + '-' + Date.now()
                        },
                        (error, result) => {
                            if (result) {
                                resolve(result);
                            } else {
                                reject(error);
                            }
                        }
                    );

                    streamifier.createReadStream(req.file.buffer).pipe(stream);
                });
            };

            const result = await streamUpload(req);

            res.json({
                message: 'File uploaded successfully!',
                filePath: result.secure_url, // Return Cloudinary URL directly
                fileName: req.file.originalname
            });

        } catch (uploadErr) {
            console.error('Cloudinary upload error:', uploadErr);
            res.status(500).json({ message: 'Error uploading file to secure storage' });
        }
    });
});

module.exports = router;
