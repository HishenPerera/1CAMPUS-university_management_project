const multer = require("multer");
const path = require("path");
const fs = require("fs");

const noticesDir = path.join(__dirname, "../../uploads/notices");
if (!fs.existsSync(noticesDir)) {
    fs.mkdirSync(noticesDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, noticesDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `notice-${unique}${ext}`);
    },
});

const fileFilter = (_req, file, cb) => {
    const allowedTypes = [
        "application/pdf", 
        "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
        "application/vnd.ms-powerpoint", // ppt
        "text/plain", // txt
        "application/msword", // doc
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF, PPT, Word, and TXT files are allowed"), false);
    }
};

const uploadNotice = multer({
    storage,
    fileFilter,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

module.exports = uploadNotice;
