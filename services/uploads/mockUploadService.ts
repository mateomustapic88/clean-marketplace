export interface MockUpload {
  id: string
  name: string
  type: 'image/jpeg' | 'image/png' | 'image/webp'
  previewUrl: string
  isDemo: true
}

const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'] as const

export const mockUploadService = {
  accepts(file: File): boolean {
    return acceptedTypes.includes(file.type as typeof acceptedTypes[number])
  },
  async createPreview(file: File): Promise<MockUpload> {
    if (!this.accepts(file)) throw new Error('unsupported_file_type')
    const previewUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
    return {
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type as MockUpload['type'],
      previewUrl,
      isDemo: true,
    }
  },
}
