import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer, { MulterError } from 'multer'
import type { RequestHandler } from 'express'
import { env } from '../../config/env.js'
import { ApiError } from '../../utils/api-error.js'

export type SupportedImage = 'jpeg' | 'png'

export function defaultUploadPath(moduleUrl: string) {
  const moduleRoot = fileURLToPath(new URL('../../../', moduleUrl))
  // TypeScript emits this module into dist/src/modules/media; uploads must
  // survive switching between tsx development and the compiled server.
  const backendRoot = path.basename(moduleRoot) === 'dist' ? path.dirname(moduleRoot) : moduleRoot
  return path.join(backendRoot, 'uploads')
}
export const uploadDirectory = env.UPLOAD_DIRECTORY
  ? path.resolve(env.UPLOAD_DIRECTORY)
  : defaultUploadPath(import.meta.url)

export function detectImageFormat(buffer: Buffer): SupportedImage | null {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'png'
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg'
  }
  return null
}

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.IMAGE_MAX_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    callback(null, ['image/jpeg', 'image/png'].includes(file.mimetype))
  },
})

export const acceptSingleImage: RequestHandler = (req, res, next) => {
  uploader.single('image')(req, res, (error) => {
    if (error instanceof MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next(new ApiError(413, 'IMAGE_TOO_LARGE', `Ukuran gambar maksimal ${env.IMAGE_MAX_BYTES} byte.`))
      return
    }
    if (error) {
      next(new ApiError(422, 'IMAGE_UPLOAD_ERROR', 'Gambar tidak dapat diproses.'))
      return
    }
    if (!req.file) {
      next(new ApiError(422, 'IMAGE_REQUIRED', 'Kirim satu file JPG, JPEG, atau PNG pada field image.'))
      return
    }
    next()
  })
}

export async function storeImage(file: Express.Multer.File) {
  const format = detectImageFormat(file.buffer)
  if (!format) throw new ApiError(422, 'INVALID_IMAGE_CONTENT', 'Isi file bukan gambar JPG, JPEG, atau PNG yang valid.')

  await mkdir(uploadDirectory, { recursive: true })
  const fileName = `${randomUUID()}.${format === 'jpeg' ? 'jpg' : 'png'}`
  await writeFile(path.join(uploadDirectory, fileName), file.buffer, { flag: 'wx' })
  return {
    fileName,
    mimeType: format === 'jpeg' ? 'image/jpeg' : 'image/png',
    size: file.size,
    url: new URL(`/uploads/${fileName}`, env.PUBLIC_API_ORIGIN).toString(),
  }
}

