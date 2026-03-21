export interface UploadResult {
  url: string
  publicId: string
}

export async function uploadImage(file: File, folder = 'medimeet'): Promise<UploadResult> {
  const signRes = await fetch('/api/upload/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder }),
  })
  if (!signRes.ok) {
    const err = await signRes.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to get upload signature')
  }
  const { timestamp, signature, apiKey, cloudName } = await signRes.json()

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`
  const form = new FormData()
  form.append('file', file)
  form.append('api_key', apiKey)
  form.append('timestamp', String(timestamp))
  form.append('signature', signature)
  form.append('folder', folder)

  const uploadRes = await fetch(url, {
    method: 'POST',
    body: form,
  })
  if (!uploadRes.ok) {
    const errTxt = await uploadRes.text()
    throw new Error(errTxt || 'Cloudinary upload failed')
  }
  const json = await uploadRes.json()
  return { url: json.secure_url as string, publicId: json.public_id as string }
}

