import multer  from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Helper function to ensure directories exist
const ensureDirectoryExistence = (filePath) => {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }
};

// Function to create multer upload middleware with dynamic path
const createUploadMiddleware = (uploadPath, uploadType = false) => {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            ensureDirectoryExistence(uploadPath);
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            const uniqueId = uuidv4();
            const uniqueSuffix = Date.now();
            const extension = path.extname(file.originalname);
            const baseName = path.basename(file.originalname, extension).replace(/\s+/g, '_'); // Remove spaces
            const uniqueFilename = `${baseName}_${uniqueId}_${uniqueSuffix}${extension}`;
            file.uniqueFilename = uniqueFilename;
            cb(null, uniqueFilename);
        },
    });

    // File filter to allow only PNG, JPEG, and JPG files
    const fileFilter = (req, file, cb) => {
        const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        const videoMimeTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime']
        if (uploadType) {
            videoMimeTypes.map((video) => allowedMimeTypes.push(video))
        }
        
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true); // Accept the file
        } else {
            cb(new Error(`Only ${allowedMimeTypes.join(", ")} formats are allowed!`), false); // Reject the file
        }
    };

    return multer({ 
        storage: storage, 
        fileFilter: fileFilter 
    });
};

export default createUploadMiddleware;