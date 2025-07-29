import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { importController } from '../controllers/importController';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${timestamp}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (path.extname(file.originalname).toLowerCase() === '.csv') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

router.post('/', upload.single('csvFile'), importController.uploadAndImport.bind(importController));

router.get('/status/:id', importController.getImportStatus.bind(importController));

router.get('/logs', importController.getImportLogs.bind(importController));

export { router as importRoute };
