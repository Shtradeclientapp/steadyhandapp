'use client'
import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div style={{ minHeight:'100vh', background:'#C8D5D2', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', padding:'24px' }}>
          <div style={{ maxWidth:'480px', width:'100%', background:'#E8F0EE', border:'1px solid rgba(28,43,50,0.1)', borderRadius:'14px', padding:'32px', textAlign:'center' as const }}>
            <p style={{ fontSize:'32px', marginBottom:'16px' }}>⚠️</p>
            <p style={{ fontFamily:'var(--font-aboreto), sans-serif', fontSize:'16px', color:'#0A0A0A', letterSpacing:'1px', marginBottom:'8px' }}>SOMETHING WENT WRONG</p>
            <p style={{ fontSize:'14px', color:'#4A5E64', lineHeight:'1.6', marginBottom:'24px' }}>
              An unexpected error occurred. Your data is safe — please refresh the page or go back to the dashboard.
            </p>
            {this.state.error && (
              <p style={{ fontSize:'11px', color:'#9AA5AA', background:'rgba(28,43,50,0.04)', border:'1px solid rgba(28,43,50,0.08)', borderRadius:'6px', padding:'8px 12px', marginBottom:'20px', textAlign:'left' as const, fontFamily:'monospace' }}>
                {this.state.error.message}
              </p>
            )}
            <div style={{ display:'flex', gap:'10px', justifyContent:'center' }}>
              <button type="button" onClick={() => window.location.reload()}
                style={{ background:'#0A0A0A', color:'white', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', fontWeight:500, border:'none', cursor:'pointer' }}>
                Refresh page
              </button>
              <a href="/dashboard"
                style={{ background:'transparent', color:'#2E6A8F', padding:'10px 20px', borderRadius:'8px', fontSize:'13px', border:'1px solid rgba(46,106,143,0.3)', textDecoration:'none', display:'inline-block' }}>
                Dashboard
              </a>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
