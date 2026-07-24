import type { SupabaseClient } from '@supabase/supabase-js'
import type { PreparedUpload, UploadService } from './UploadService'
import { validateImageFile } from './UploadService'

const extension = (file: File) => ({
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
}[file.type] ?? 'bin')

export class SupabaseUploadService implements UploadService {
  constructor(private readonly client: SupabaseClient) {}
  createJobDraft(file: File, userId: string) {
    return this.upload('job-images', `${userId}/drafts/${crypto.randomUUID()}.${extension(file)}`, file, 10 * 1024 * 1024)
  }

  uploadAvatar(file: File, userId: string) {
    return this.upload('avatars', `${userId}/${crypto.randomUUID()}.${extension(file)}`, file, 5 * 1024 * 1024)
  }

  async removeAvatar(storagePath: string): Promise<void> {
    const { error } = await this.client.storage.from('avatars').remove([storagePath])
    if (error) throw new Error(error.message)
  }

  private async upload(bucket: string, path: string, file: File, limit: number): Promise<PreparedUpload> {
    await validateImageFile(file, limit)
    const { error } = await this.client.storage.from(bucket).upload(path, file, {
      cacheControl: '3600', contentType: file.type, upsert: false,
    })
    if (error) throw new Error(error.message)
    const { data, error: signedError } = await this.client.storage.from(bucket).createSignedUrl(path, 15 * 60)
    if (signedError) throw new Error(signedError.message)
    return {
      id: crypto.randomUUID(), name: file.name.slice(0, 120),
      type: file.type as PreparedUpload['type'], previewUrl: data.signedUrl,
      storagePath: path, isDemo: false,
    }
  }
}
