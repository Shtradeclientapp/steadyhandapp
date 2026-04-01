'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useUpload } from '@/lib/hooks/useUpload'
import clsx from 'clsx'

interface DropzoneProps {
  jobId?: string
  stage?: string
  docType?: string
  onUploaded?: (url: string, path: string) => void
  label?: string
  accept?: Record<string, string[]>
}

export function Dropzone({ jobId, stage = 'request', docType, onUploaded, label, accept }: DropzoneProps) {
  const { upload, uploading, progress, error } = useUpload()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const result = await upload(file, { jobId, stage, docType })
      if (result) onUploaded?.(result.url, result.path)
    }
  }, [jobId, stage, docType, upload, onUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ?? { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'], 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className={clsx(
          'border-[1.5px] border-dashed rounded-lg p-6 text-center cursor-pointer transition-all',
          isDragActive
            ? 'border-terra bg-terra/5'
            : 'border-ink/20 bg-off hover:border-terra/50 hover:bg-terra/3'
        )}
      >
        <input {...getInputProps()} />
        <div className="text-3xl mb-2 opacity-60">📸</div>
        <div className="text-[13px] text-muted">
          {isDragActive ? 'Drop files here...' : label ?? 'Drop files or click to browse'}
        </div>
        <div className="text-[11px] text-muted-l mt-1">JPG, PNG, PDF · max 10MB</div>
      </div>

      {uploading && (
        <div className="mt-2">
          <div className="flex justify-between text-[11px] text-muted-l mb-1">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 bg-ink/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-terra rounded-full transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-[11px] text-terra mt-1.5">{error}</p>
      )}
    </div>
  )
}
