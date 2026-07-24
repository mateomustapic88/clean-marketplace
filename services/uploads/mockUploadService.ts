export interface MockUpload {
  id: string
  name: string
  type: 'image/jpeg' | 'image/png' | 'image/webp'
  previewUrl: string
  isDemo: true
}

const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'] as const
const maximumFileSize = 5 * 1024 * 1024

const fileSignatures: Record<MockUpload['type'], (bytes: Uint8Array) => boolean> = {
  'image/jpeg': (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  'image/png': (bytes) => bytes[0] === 0x89
    && bytes[1] === 0x50
    && bytes[2] === 0x4e
    && bytes[3] === 0x47,
  'image/webp': (bytes) => String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
    && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP',
}

export const mockUploadService = {
  accepts(file: File): boolean {
    return file.size > 0
      && file.size <= maximumFileSize
      && acceptedTypes.includes(file.type as typeof acceptedTypes[number])
  },
  async createPreview(file: File): Promise<MockUpload> {
    if (!this.accepts(file)) throw new Error('unsupported_file_type')
    const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer())
    const type = file.type as MockUpload['type']
    if (!fileSignatures[type](signature)) throw new Error('invalid_file_signature')
    const previewUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
    return {
      id: crypto.randomUUID(),
      name: file.name.replace(/[^\p{L}\p{N}._ -]/gu, '').slice(0, 120) || 'image',
      type,
      previewUrl,
      isDemo: true,
    }
  },
}
