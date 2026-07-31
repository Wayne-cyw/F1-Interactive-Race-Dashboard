import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import Track3D from './Track3D'
import Cars3D from './Cars3D'
import CameraController from './CameraController'

export default function Track3DCanvas({
    year,
    race,
    sessionData,
    currentLap,
    progress,
    selectedDriver,
    onDriverSelect,
    cameraMode,
    prevPositions,
    onAlert,
}) {
    return (
        <Canvas
            camera={{ position: [0, 35, 45], fov: 55 }}
            shadows={false}
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: false }}
        >
            <color attach="background" args={['#000008']} />

            <Stars radius={200} depth={80} count={5000} factor={5} saturation={0.2} fade />

            <Suspense fallback={null}>
                {year && race && (
                    <Track3D year={year} race={race}>
                        {sessionData && (
                            <Cars3D
                                sessionData={sessionData}
                                currentLap={currentLap}
                                progress={progress}
                                selectedDriver={selectedDriver}
                                onDriverSelect={onDriverSelect}
                                prevPositions={prevPositions}
                                onAlert={onAlert}
                            />
                        )}
                        <CameraController
                            mode={cameraMode}
                            selectedDriver={selectedDriver}
                            sessionData={sessionData}
                            currentLap={currentLap}
                            progress={progress}
                        />
                    </Track3D>
                )}
            </Suspense>

            <EffectComposer>
                <Bloom
                    intensity={1.3}
                    luminanceThreshold={0.55}
                    luminanceSmoothing={0.4}
                    mipmapBlur
                />
                <Vignette offset={0.38} darkness={0.65} />
            </EffectComposer>
        </Canvas>
    )
}
