const express = require('express');
const router = express.Router();
const upload = require('../utils/upload');
const { success, error } = require('../utils/response');
const { auth } = require('../middleware/auth');

router.post('/image', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return error(res, '请选择要上传的图片', 400);
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    return success(res, {
      url: fileUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
    }, '上传成功');
  } catch (err) {
    return error(res, err.message || '上传失败', 500);
  }
});

router.post('/images', auth, upload.array('images', 9), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return error(res, '请选择要上传的图片', 400);
    }

    const files = req.files.map((file) => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
    }));

    return success(res, files, '上传成功');
  } catch (err) {
    return error(res, err.message || '上传失败', 500);
  }
});

module.exports = router;
