// import { Canvas } from '@react-three/fiber'
// import { OrbitControls } from '@react-three/drei'
// import { Suspense } from 'react'
// import Model from './Models/Character/Model'
import LoadingScreen from './Common/View/LoadingScreen'

const App = () => {
  return (
    <LoadingScreen />
    // <div style={{ width: '100vw', height: '100vh' }}>
    //   <Canvas camera={{ position: [0, 1, 5], fov: 50 }}>
    //     <ambientLight intensity={0.5} />
    //     <directionalLight position={[5, 5, 5]} intensity={0.8} />
    //     <Suspense fallback={null}>
    //       <Model />
    //     </Suspense>
    //     <OrbitControls />
    //     <gridHelper args={[10, 10]} />
    //   </Canvas>
    // </div>
  )
}

export default App
