import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join, resolve } from 'path';

export const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const IMAGE_FILENAME = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

@Injectable()
export class UploadStorageService {
  private readonly logger = new Logger(UploadStorageService.name);
  private readonly uploadDir = resolve(process.env.UPLOAD_DIR || join(process.cwd(), 'data', 'uploads'));

  async saveImage(buffer: Buffer, mimetype: string) {
    const extension = IMAGE_TYPES[mimetype];
    if (!extension) throw new Error(`Unsupported image type: ${mimetype}`);
    await mkdir(this.uploadDir, { recursive: true });
    const filename = `${randomUUID()}${extension}`;
    await writeFile(join(this.uploadDir, filename), buffer, { flag: 'wx' });
    return filename;
  }

  imagePath(filename: string) {
    return IMAGE_FILENAME.test(filename) ? join(this.uploadDir, filename) : null;
  }

  async deleteByUrl(url?: string | null) {
    const filename = this.localFilename(url);
    if (!filename) return;
    try {
      await unlink(join(this.uploadDir, filename));
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        this.logger.warn(`Failed to delete uploaded image ${filename}: ${error?.message || 'unknown error'}`);
      }
    }
  }

  async deleteManyByUrls(urls: Array<string | null | undefined>) {
    const uniqueUrls = [...new Set(urls.filter((url): url is string => Boolean(url)))];
    await Promise.all(uniqueUrls.map((url) => this.deleteByUrl(url)));
  }

  private localFilename(url?: string | null) {
    if (!url) return null;
    try {
      const isAbsolute = /^https?:\/\//i.test(url);
      const parsed = new URL(url, 'http://local');
      if (isAbsolute) {
        const publicBaseUrl = process.env.PUBLIC_BASE_URL;
        if (!publicBaseUrl || parsed.origin !== new URL(publicBaseUrl).origin) return null;
      }
      const pathname = parsed.pathname;
      const match = pathname.match(/\/api\/upload\/image\/([0-9a-f-]{36}\.(?:jpg|png|webp))$/);
      return match && IMAGE_FILENAME.test(match[1]) ? match[1] : null;
    } catch {
      return null;
    }
  }
}
