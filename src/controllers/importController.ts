import { Request, Response } from 'express';
import path from 'path';
import { importService } from '../services/importService';
import { logger } from '../utils/logger';

export class ImportController {
  async uploadAndImport(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          error: 'No file uploaded',
          message: 'Please upload a CSV file',
        });
        return;
      }

      const file = req.file;

      if (path.extname(file.originalname).toLowerCase() !== '.csv') {
        res.status(400).json({
          error: 'Invalid file type',
          message: 'Only CSV files are allowed',
        });
        return;
      }

      logger.info(`Starting import for file: ${file.originalname}`);

      const importId = await importService.startImport(file.path);

      res.status(202).json({
        message: 'Import started successfully',
        importId,
        filename: file.originalname,
        status: 'in_progress',
      });
    } catch (error) {
      logger.error('Import upload error:', error);
      res.status(500).json({
        error: 'Import failed',
        message: 'Failed to start import process',
      });
    }
  }

  async getImportStatus(req: Request, res: Response): Promise<void> {
    try {
      const importId = parseInt(req.params.id, 10);

      if (isNaN(importId)) {
        res.status(400).json({
          error: 'Invalid import ID',
          message: 'Import ID must be a number',
        });
        return;
      }

      const status = await importService.getImportStatus(importId);

      if (!status) {
        res.status(404).json({
          error: 'Import not found',
          message: `Import with ID ${importId} not found`,
        });
        return;
      }

      res.json({
        importId: status.id,
        filename: status.filename,
        status: status.status,
        recordCount: status.recordCount,
        errorMessage: status.errorMessage,
        importDate: status.importDate,
      });
    } catch (error) {
      logger.error('Get import status error:', error);
      res.status(500).json({
        error: 'Failed to get import status',
        message: 'An error occurred while retrieving import status',
      });
    }
  }

  async getImportLogs(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const offset = parseInt(req.query.offset as string, 10) || 0;

      if (limit > 100) {
        res.status(400).json({
          error: 'Invalid limit',
          message: 'Limit cannot exceed 100',
        });
        return;
      }

      const logs = await importService.getImportLogs(limit, offset);

      res.json({
        logs,
        pagination: {
          limit,
          offset,
          total: logs.length,
        },
      });
    } catch (error) {
      logger.error('Get import logs error:', error);
      res.status(500).json({
        error: 'Failed to get import logs',
        message: 'An error occurred while retrieving import logs',
      });
    }
  }
}

export const importController = new ImportController();
