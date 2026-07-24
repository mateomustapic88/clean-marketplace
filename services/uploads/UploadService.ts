export interface PreparedUpload {
  id: string
  name: string
  type: 'image/jpeg' | 'image/png' | 'image/webp'
  previewUrl: string
  storagePath: string
  isDemo: boolean
}

export interface UploadService {
  createJobDraft(file: File, userId: string): Promise<PreparedUpload>
  uploadAvatar(file: File, userId: string): Promise<PreparedUpload>
  removeAvatar(storagePath: string): Promise<void>
}

export const validateImageFile = async (file: File, maximumFileSize: number): Promise<void> => {
  const accepted = ['image/jpeg', 'image/png', 'image/webp'] as const
  if (!file.size || file.size > maximumFileSize || !accepted.includes(file.type as typeof accepted[number])) {
    throw new Error('unsupported_file_type')
  }
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const valid = file.type === 'image/jpeg'
    ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : file.type === 'image/png'
      ? bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
      : String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
        && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  if (!valid) throw new Error('invalid_file_signature')
}
