import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const app = express();
const PORT = 3003; // منفذ مختلف لتجنب التعارض

// إعداد CORS
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// إعداد multer لرفع الصور
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// خدمة الملفات الثابتة
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// endpoint بسيط لاختبار الخادم
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Simple Image Server is running!' });
});

// endpoint رفع الصور المبسط
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    console.log('📥 [UPLOAD] تم استقبال طلب رفع صورة');
    console.log('📋 [UPLOAD] req.body:', req.body);
    console.log('📋 [UPLOAD] req.file:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'غير موجود');
    
    const { conversation_id, company_id, message_text } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        error: 'No image file provided',
        details: 'Please upload an image file'
      });
    }

    console.log('📸 [UPLOAD] معالجة الصورة:', {
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      conversationId: conversation_id,
      companyId: company_id,
      messageText: message_text
    });

    // إنشاء مجلد uploads إذا لم يكن موجود
    const uploadsDir = path.join(process.cwd(), 'uploads', 'images');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 [UPLOAD] تم إنشاء مجلد:', uploadsDir);
    }

    // حفظ الصورة مع اسم فريد
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname);
    const fileName = `${timestamp}_${crypto.randomUUID().substr(0, 8)}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    // إنشاء URL للصورة
    const imageUrl = `http://localhost:${PORT}/uploads/images/${fileName}`;

    console.log('✅ [UPLOAD] تم حفظ الصورة بنجاح:', {
      filePath,
      imageUrl,
      fileSize: file.size
    });

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        image_url: imageUrl,
        file_name: fileName,
        file_size: file.size,
        conversation_id,
        company_id,
        message_text
      }
    });

  } catch (error) {
    console.error('❌ [UPLOAD] خطأ في رفع الصورة:', error);
    res.status(500).json({
      error: 'Failed to upload image',
      details: error.message
    });
  }
});

// بدء الخادم
app.listen(PORT, () => {
  console.log(`🚀 Simple Image Server started on port ${PORT}`);
  console.log(`📡 Available at: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📸 Upload endpoint: http://localhost:${PORT}/api/upload-image`);
});

export default app;
