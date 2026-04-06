'use client'
import { useEffect } from 'react'

// Compare stage redirects to quotes page which has full comparison functionality
export default function ComparePage() {
  useEffect(() => {
    window.location.replace('/quotes')
  }, [])
  return null
}
