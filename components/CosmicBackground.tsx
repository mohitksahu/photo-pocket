'use client'

import { useEffect } from 'react'

export default function CosmicBackground() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (document.getElementById('cosmic-bg-canvas')) return

    const canvas = document.createElement('canvas')
    canvas.id = 'cosmic-bg-canvas'
    canvas.style.position = 'fixed'
    canvas.style.top = '0px'
    canvas.style.left = '0px'
    canvas.style.width = '100vw'
    canvas.style.height = '100vh'
    canvas.style.zIndex = '0'
    canvas.style.pointerEvents = 'none'
    document.getElementById('cosmic-bg')?.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = window.innerWidth, h = window.innerHeight
    canvas.width = w
    canvas.height = h

    window.addEventListener('resize', () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w
      canvas.height = h
    })

    const stars = Array.from({length: 120}, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2 + 0.3,
      o: Math.random() * 0.7 + 0.3,
      dx: (Math.random() - 0.5) * 0.08,
      dy: (Math.random() - 0.5) * 0.08
    }))

    function draw() {
      if (!ctx) return
      ctx.clearRect(0, 0, w, h)
      for (const s of stars) {
        ctx.save()
        ctx.globalAlpha = s.o
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI)
        ctx.fillStyle = '#fff'
        ctx.shadowColor = '#FF9A00'
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.restore()
        s.x += s.dx
        s.y += s.dy
        if (s.x < 0) s.x = w
        if (s.x > w) s.x = 0
        if (s.y < 0) s.y = h
        if (s.y > h) s.y = 0
      }
      requestAnimationFrame(draw)
    }
    draw()
  }, [])

  return null
}