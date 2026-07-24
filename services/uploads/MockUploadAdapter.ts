import { mockUploadService } from './mockUploadService'
import type { PreparedUpload, UploadService } from './UploadService'

export class MockUploadAdapter implements UploadService {
  async createJobDraft(file: File, _userId: string): Promise<PreparedUpload> {
    const upload = await mockUploadService.createPreview(file)
    return { ...upload, storagePath: upload.previewUrl }
  }

  async uploadAvatar(file: File, _userId: string): Promise<PreparedUpload> {
    const upload = await mockUploadService.createPreview(file)
    return { ...upload, storagePath: upload.previewUrl }
  }

  async removeAvatar(_storagePath: string): Promise<void> {
    await Promise.resolve()
  }
}
