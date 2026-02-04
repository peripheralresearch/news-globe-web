'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Phase = 'idle' | 'wipe-in' | 'wipe-out'

export default function GlobeWipeOverlay() {
  const [phase, setPhase] = useState<Phase>('idle')
  const router = useRouter()
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleStart = () => setPhase('wipe-in')
    const handleArrived = () => setPhase('wipe-out')

    window.addEventListener('globe-wipe-start', handleStart)
    window.addEventListener('globe-wipe-arrived', handleArrived)
    return () => {
      window.removeEventListener('globe-wipe-start', handleStart)
      window.removeEventListener('globe-wipe-arrived', handleArrived)
    }
  }, [])

  useEffect(() => {
    const el = overlayRef.current
    if (!el) return

    const onEnd = () => {
      if (phase === 'wipe-in') {
        router.push('/globe')
      } else if (phase === 'wipe-out') {
        setPhase('idle')
      }
    }

    el.addEventListener('animationend', onEnd)
    return () => el.removeEventListener('animationend', onEnd)
  }, [phase, router])

  if (phase === 'idle') return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] bg-brand-yellow"
      style={{
        animation:
          phase === 'wipe-in'
            ? 'wipeIn 500ms ease-in-out forwards'
            : 'wipeOut 500ms ease-in-out forwards',
      }}
    />
  )
}
