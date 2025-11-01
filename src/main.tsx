import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals'

// Monitor Web Vitals
onCLS(console.log)
onFCP(console.log)
onLCP(console.log)
onTTFB(console.log)
onINP(console.log)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
