import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pdf = readFileSync(
  resolve(process.cwd(), 'public/CV-Valentino-Mensio.pdf')
);

const version = createHash('sha256')
  .update(pdf)
  .digest('hex')
  .slice(0, 12);

export const CV_URL = `/CV-Valentino-Mensio.pdf?v=${version}`;
export const CV_DOWNLOAD_NAME = 'CV-Valentino-Mensio-2026.pdf';
