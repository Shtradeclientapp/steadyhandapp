'use client'
import { useEffect } from 'react'

export default function QuotesPage() {
  useEffect(() => {
    window.location.replace('/compare')
  }, [])
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#C8D5D2' }}>
      <p style={{ color:'#4A5E64', fontFamily:'sans-serif' }}>Redirecting to Compare...</p>
    </div>
  )
}
