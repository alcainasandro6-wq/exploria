'use client'

import { createClient } from '@/lib/supabase/client'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024 // 100MB

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

async function uploadToBucket(
  bucket: 'activity-images' | 'provider-logos',
  providerId: string,
  scope: string,
  file: File,
  maxBytes: number
): Promise<UploadResult> {
  if (file.size > maxBytes) {
    return { success: false, error: `El archivo supera el tamaño máximo (${Math.round(maxBytes / 1024 / 1024)}MB)` }
  }

  const supabase = createClient()
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${providerId}/${scope}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) return { success: false, error: error.message }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return { success: true, url: data.publicUrl }
}

export function uploadActivityPhoto(providerId: string, activityId: string, file: File) {
  return uploadToBucket('activity-images', providerId, activityId, file, MAX_IMAGE_BYTES)
}

export function uploadActivityVideo(providerId: string, activityId: string, file: File) {
  return uploadToBucket('activity-images', providerId, `${activityId}/video`, file, MAX_VIDEO_BYTES)
}

export function uploadProviderLogo(providerId: string, file: File) {
  return uploadToBucket('provider-logos', providerId, 'logo', file, MAX_IMAGE_BYTES)
}
