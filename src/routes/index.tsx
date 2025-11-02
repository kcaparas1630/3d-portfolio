import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: MainPage,
})
// TODO: REMOVE THIS AND USE A LANDING SCREEN 
function MainPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyPress = () => {
      navigate({ to: '/app' })
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [navigate])

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#ADD1F5'
    }}>
      <h1>Press any key to start</h1>
    </div>
  )
}
