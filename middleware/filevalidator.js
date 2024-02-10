const checkFileUpload = (req, res, next) => {
    // Check if files are present in the request
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ error: 'No files were uploaded.' });
    }

    // Iterate over each file and perform validation
    for (const fileKey in req.files) {
        const file = req.files[fileKey];

        // Check file size
        const maxSizeInBytes = 10 * 1024 * 1024; // Example: 10 MB
        if (file.size > maxSizeInBytes) {
            return res.status(400).json({ error: `File ${fileKey} is too large. Max size allowed is 10MB.` });
        }

        // Check file type
        const allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf']; // Example allowed types
        if (!allowedFileTypes.includes(file.mimetype)) {
            return res.status(400).json({ error: `File ${fileKey} is of invalid type. Allowed types are: ${allowedFileTypes.join(', ')}` });
        }
    }

    // If all files are valid, proceed to the next middleware or route handler
    next();
};
module.exports= checkFileUpload;