const multer = require('multer');
const crypto = require('crypto');
const path = require('path');


// DISK STORAGE SETUP

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './public/images/uploads');
    },
    filename: function(req, file, cb){
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 10) + path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix);
    }
});


// UOLOAD VARIABLE 
const upload = multer({ storage: storage });

// EXPORT IPLOAD VARIABLE
module.exports = upload;