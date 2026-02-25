'use client'

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#09090b',
          color: '#fafafa',
          textAlign: 'center',
          padding: '16px',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Something went wrong</h2>
        <p style={{ fontSize: '14px', color: '#a1a1aa' }}>
          A critical error occurred. Please try reloading the page.
        </p>
        <button
          onClick={() => reset()}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 500,
            backgroundColor: '#fafafa',
            color: '#09090b',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </body>
    </html>
  )
}
