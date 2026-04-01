'use client'

import { useState, useCallback } from 'react'

interface UploadOptions {
  jobId?: string
  stage?: string
  caption?: string
  docType?: string
}

interface UploadResult {
  path: string
  url: string
}

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (file: File, options: UploadOptions = {}): Promise<UploadResult | null> => {
    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (options.jobId) formData.append('job_id', options.jobId)
      if (options.stage) formData.append('stage', options.stage)
      if (options.caption) formData.append('caption', options.caption)
      if (options.docType) formData.append('doc_type', options.docType)

      // Simulate progress since fetch doesn't expose upload progress
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 15, 85))
      }, 200)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      clearInterval(progressInterval)

      if (!res.ok) {
        const { error: e } = await res.json()
        throw new Error(e || 'Upload failed')
      }

      setProgress(100)
      return await res.json()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      return null
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }, [])

  const uploadMany = useCallback(async (files: File[], options: UploadOptions = {}) => {
    const results = await Promise.all(files.map(f => upload(f, options)))
    return results.filter(Boolean) as UploadResult[]
  }, [upload])

  return { upload, uploadMany, uploading, progress, error }
}
