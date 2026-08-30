import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from '../src/config/env.js'

const outputDirectory = fileURLToPath(new URL('../test-data/generated', import.meta.url))
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
const jpeg = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/EH//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/EH//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/EH//2Q==', 'base64')

await mkdir(outputDirectory, { recursive: true })
await Promise.all([
  writeFile(path.join(outputDirectory, 'valid-small.png'), png),
  writeFile(path.join(outputDirectory, 'valid-small.jpg'), jpeg),
  writeFile(path.join(outputDirectory, 'invalid-content.png'), Buffer.from('not-an-image', 'utf8')),
  writeFile(path.join(outputDirectory, 'unsupported-format.gif'), Buffer.from('GIF89a', 'ascii')),
  writeFile(path.join(outputDirectory, 'oversize.jpg'), Buffer.concat([jpeg, Buffer.alloc(env.IMAGE_MAX_BYTES + 1 - jpeg.length)])),
])

console.log(`QA image files dibuat di ${outputDirectory}`)
console.log(`Batas aktif: ${env.IMAGE_MAX_BYTES} byte; oversize.jpg: ${env.IMAGE_MAX_BYTES + 1} byte`)

