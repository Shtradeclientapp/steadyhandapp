import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '80px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>STEADYHAND</h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>Request to warranty platform — Western Australia</p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Link href="/login">
          <button style={{ background: '#1C2B32', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
            Log in
          </button>
        </Link>
        <Link href="/signup">
          <button style={{ background: '#D4522A', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
            Sign up
          </button>
        </Link>
      </div>
    </div>
  )
}
