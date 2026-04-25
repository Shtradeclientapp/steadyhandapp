'use client'
import { useEffect } from 'react'

export default function LegacyTradieJob() {
  useEffect(() => {
    window.location.replace('/tradie/dashboard')
  }, [])
  return null
}
