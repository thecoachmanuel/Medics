import { supabase } from '@/lib/supabase/client'

export interface UploadResult {
  url: string
  publicId: string
}

const BUCKET = 'medicsonline'

/**
 * Upload a file to Supabase Storage.
 *
 * @param file   - The File object to upload.
 * @param folder - A logical sub-folder path inside the bucket (e.g. 'profile-images').
 * @returns      An object with `url` (public HTTPS URL) and `publicId` (storage path for deletion).
 */
export async function uploadImage(file: File, folder = 'general'): Promise<UploadResult> {
  const ext = file.name.split('.').pop() ?? 'bin'
  const uuid = typeof crypto.randomUUID === 'function' 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2) + Date.now().toString(36);
  const path = `${folder}/${uuid}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    })

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`)
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return {
    url: publicUrlData.publicUrl,
    publicId: path,
  }
}

/**
 * Delete a previously uploaded file from Supabase Storage.
 *
 * @param publicId - The storage path returned by `uploadImage` (i.e. `folder/uuid.ext`).
 */
export async function deleteFile(publicId: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([publicId])
  if (error) {
    throw new Error(`Supabase Storage delete failed: ${error.message}`)
  }
}
