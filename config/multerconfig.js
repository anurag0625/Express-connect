const multer  = require('multer');
const { randomBytes } = require('crypto');
const path = require('path');


// --- DISK STORAGE

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/uploads')
    },
    filename: function (req, file, cb) {
        randomBytes(12, function (err, name) {
            const fn = name.toString("hex") + path.extname(file.originalname);
            cb(null, fn);
        })
    }
})
  
const upload = multer({ storage: storage })



// --- EXPORT UPLOAD VARIABLES
module.exports = upload;
