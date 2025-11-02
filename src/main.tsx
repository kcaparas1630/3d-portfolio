import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import './index.css'
import { routeTree } from './routeTree.gen'
import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals'

// Monitor Web Vitals
onCLS(console.log)
onFCP(console.log)
onLCP(console.log)
onTTFB(console.log)
onINP(console.log)

// Create a new router instance
const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
