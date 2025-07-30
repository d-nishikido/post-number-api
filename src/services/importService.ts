import fs from 'fs';
import csv from 'csv-parser';
import { database } from '../utils/database';
import { logger } from '../utils/logger';

export interface ImportStatus {
  id: number;
  filename: string;
  status: 'in_progress' | 'success' | 'failed';
  recordCount: number;
  errorMessage?: string;
  importDate: Date;
}

export interface CsvRow {
  jis_code: string;
  old_zipcode: string;
  zipcode: string;
  prefecture_kana: string;
  city_kana: string;
  town_kana: string;
  prefecture: string;
  city: string;
  town: string;
  partial_match: string;
  koaza_exist: string;
  chome_exist: string;
  multiple_town: string;
  update_status: string;
  update_reason: string;
}

export class ImportService {
  async startImport(filePath: string): Promise<number> {
    const filename = filePath.split('/').pop() || filePath;

    try {
      const logResult = await database.query(
        'INSERT INTO import_logs (filename, import_date, record_count, status) VALUES ($1, CURRENT_TIMESTAMP, 0, $2) RETURNING id',
        [filename, 'in_progress'],
      );

      const importId = logResult.rows[0].id;

      this.processImport(filePath, importId).catch((error) => {
        logger.error(`Import ${importId} failed:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.updateImportStatus(importId, 'failed', 0, errorMessage);
      });

      return importId;
    } catch (error) {
      logger.error('Failed to start import:', error);
      throw new Error('Failed to start import process');
    }
  }

  private async processImport(filePath: string, importId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const rows: CsvRow[] = [];
      let processedCount = 0;

      fs.createReadStream(filePath)
        .pipe(
          csv({
            headers: [
              'jis_code',
              'old_zipcode',
              'zipcode',
              'prefecture_kana',
              'city_kana',
              'town_kana',
              'prefecture',
              'city',
              'town',
              'partial_match',
              'koaza_exist',
              'chome_exist',
              'multiple_town',
              'update_status',
              'update_reason',
            ],
          }),
        )
        .on('data', (row: CsvRow) => {
          if (this.isValidRow(row)) {
            rows.push(row);
          }
        })
        .on('end', async () => {
          try {
            processedCount = await this.insertAddresses(rows);
            await this.updateImportStatus(importId, 'success', processedCount);
            logger.info(
              `Import ${importId} completed successfully. Processed ${processedCount} records.`,
            );
            resolve();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await this.updateImportStatus(importId, 'failed', 0, errorMessage);
            reject(error);
          }
        })
        .on('error', async (error) => {
          await this.updateImportStatus(importId, 'failed', 0, error.message);
          reject(error);
        });
    });
  }

  private isValidRow(row: CsvRow): boolean {
    return !!row.zipcode && !!row.prefecture && !!row.city && row.zipcode.length === 7;
  }

  private async insertAddresses(rows: CsvRow[]): Promise<number> {
    const client = await database.getClient();
    let insertedCount = 0;

    try {
      await client.query('BEGIN');

      for (const row of rows) {
        const town = this.normalizeTown(row.town);

        try {
          await client.query(
            `INSERT INTO addresses (zipcode, prefecture, city, town) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (zipcode, prefecture, city, COALESCE(town, '')) DO NOTHING`,
            [row.zipcode, row.prefecture, row.city, town],
          );
          insertedCount++;
        } catch (error) {
          logger.warn(`Failed to insert row: ${JSON.stringify(row)}`, error);
        }
      }

      await client.query('COMMIT');
      return insertedCount;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private normalizeTown(town: string): string | null {
    if (!town || town === '以下に掲載がない場合' || town.trim() === '') {
      return null;
    }
    return town;
  }

  private async updateImportStatus(
    importId: number,
    status: 'success' | 'failed',
    recordCount: number,
    errorMessage?: string,
  ): Promise<void> {
    try {
      await database.query(
        'UPDATE import_logs SET status = $1, record_count = $2, error_message = $3 WHERE id = $4',
        [status, recordCount, errorMessage, importId],
      );
    } catch (error) {
      logger.error(`Failed to update import status for import ${importId}:`, error);
    }
  }

  async getImportStatus(importId: number): Promise<ImportStatus | null> {
    try {
      const result = await database.query(
        'SELECT id, filename, status, record_count, error_message, import_date FROM import_logs WHERE id = $1',
        [importId],
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        filename: row.filename,
        status: row.status,
        recordCount: row.record_count,
        errorMessage: row.error_message,
        importDate: row.import_date,
      };
    } catch (error) {
      logger.error(`Failed to get import status for import ${importId}:`, error);
      throw new Error('Failed to retrieve import status');
    }
  }

  async getImportLogs(limit: number = 50, offset: number = 0): Promise<ImportStatus[]> {
    try {
      const result = await database.query(
        'SELECT id, filename, status, record_count, error_message, import_date FROM import_logs ORDER BY import_date DESC LIMIT $1 OFFSET $2',
        [limit, offset],
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        filename: row.filename,
        status: row.status,
        recordCount: row.record_count,
        errorMessage: row.error_message,
        importDate: row.import_date,
      }));
    } catch (error) {
      logger.error('Failed to get import logs:', error);
      throw new Error('Failed to retrieve import logs');
    }
  }
}

export const importService = new ImportService();
