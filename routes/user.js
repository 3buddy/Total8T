const express = require('express')
const router = express.Router();
const services = require('../services').user
const utils = require('../utils/common_function')
const multer              = require("multer");
const path                = require("path");


const DIR = './uploads';



let storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, DIR);
  },
  filename: (req, file, cb) => {
      cb(null, file.originalname);

  }
});

let upload = multer({ storage: storage });

// upload images

router.post('/upload', upload.any("photo"), services.upload);
router.post('/login', services.login)
router.post('/signup', services.signup)
router.post('/send-otp', services.forgetPassword)
router.post('/verify-otp', services.verfiyOTP)
router.post('/token',services.refreshToken);
router.post('/reset-password', services.resetPassword)
router.get('/user-detail', utils.verifyUser, services.userInfo )
//router.post("/update-profile", utils.verifyUser, services.updateUserProfile)
module.exports = router