import { useEffect, useRef, useState } from 'react'
import type { SplashState } from '../../shared/Splash.tsx'
import css from '../../WhaleArcade.module.css'
import { RUNNER_OBSTACLES, type RunnerObstacleModel } from './physics.ts'

export interface RunnerObstacle extends RunnerObstacleModel {
  id: number
  gapAfter: number
}

export interface RunnerSceneProps {
  whaleY: number
  obstacles: RunnerObstacle[]
  splash: SplashState | null
}

export function RunnerScene({ whaleY, obstacles, splash }: RunnerSceneProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [sizeRevision, setSizeRevision] = useState(0)

  useEffect(() => {
    const element = canvas.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      setSizeRevision(value => value + 1)
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    const ratio = Math.min(2, window.devicePixelRatio || 1)
    const width = element.clientWidth
    const height = element.clientHeight
    if (element.width !== width * ratio || element.height !== height * ratio) {
      element.width = width * ratio
      element.height = height * ratio
    }
    const context = element.getContext('2d')
    if (!context) return
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.clearRect(0, 0, width, height)
    const styles = getComputedStyle(element)
    const blue = styles.getPropertyValue('--dsw-alias-state-business-primary').trim()
    const surface = styles.getPropertyValue('--dsw-alias-border-l3').trim()
    const water = styles.getPropertyValue('--dsw-alias-state-business-tertiary').trim()
    const background = styles.getPropertyValue('--dsw-alias-bg-layer-2').trim()
    const error = styles.getPropertyValue('--dsw-alias-state-error-secondary').trim()
    const now = performance.now()
    const seaY = height * .84
    context.fillStyle = background
    context.fillRect(0, 0, width, height)
    context.fillStyle = water
    context.globalAlpha = .2
    context.fillRect(0, 0, width, height)
    context.globalAlpha = 1
    context.strokeStyle = water
    context.globalAlpha = .42
    context.lineWidth = 8
    for (const offset of [0, width * .43]) {
      context.beginPath()
      context.moveTo(offset, 0)
      context.lineTo(offset + width * .24, height * .72)
      context.stroke()
    }
    context.globalAlpha = 1
    const wave = (base: number, amplitude: number, speed: number) => {
      context.beginPath()
      context.moveTo(0, base)
      for (let x = 0; x <= width + 12; x += 12) context.lineTo(x, base + Math.sin(x / 31 + now / speed) * amplitude)
      context.lineTo(width, height)
      context.lineTo(0, height)
      context.closePath()
    }
    wave(seaY + 4, 2.5, 620)
    context.fillStyle = surface
    context.globalAlpha = .3
    context.fill()
    wave(seaY, 1.5, 760)
    context.strokeStyle = blue
    context.lineWidth = 1
    context.globalAlpha = .3
    context.stroke()
    context.globalAlpha = 1
    const whaleX = width * .18
    const whaleTop = seaY - 18 - height * whaleY / 100
    context.save()
    context.translate(whaleX, whaleTop)
    context.scale(.43, .43)
    context.fillStyle = blue
    context.beginPath()
    context.moveTo(-25, -4)
    context.bezierCurveTo(-36, -7, -43, -16, -41, -27)
    context.lineTo(-31, -19)
    context.lineTo(-22, -26)
    context.bezierCurveTo(-18, -17, -19, -10, -25, -4)
    context.fill()
    context.beginPath()
    context.moveTo(-24, -8)
    context.bezierCurveTo(-10, -24, 19, -27, 41, -16)
    context.bezierCurveTo(59, -7, 64, 14, 50, 28)
    context.bezierCurveTo(34, 45, -7, 45, -27, 28)
    context.bezierCurveTo(-39, 17, -39, 2, -24, -8)
    context.fill()
    context.fillStyle = background
    context.beginPath()
    context.moveTo(-25, 19)
    context.bezierCurveTo(-4, 33, 27, 35, 52, 19)
    context.bezierCurveTo(45, 35, 25, 42, 4, 38)
    context.bezierCurveTo(-11, 35, -21, 28, -25, 19)
    context.fill()
    context.beginPath()
    context.arc(42, -7, 3.2, 0, Math.PI * 2)
    context.fill()
    context.strokeStyle = blue
    context.lineWidth = 2.8
    context.lineCap = 'round'
    context.beginPath()
    context.moveTo(17, -25)
    context.quadraticCurveTo(13, -35, 19, -42)
    context.moveTo(20, -27)
    context.quadraticCurveTo(27, -37, 33, -34)
    context.stroke()
    context.restore()
    for (const obstacle of obstacles) {
      const geometry = RUNNER_OBSTACLES[obstacle.kind]
      const left = width * obstacle.x / 100 - geometry.visualWidth / 2
      const top = seaY - geometry.visualHeight
      context.save()
      context.translate(left, top)
      context.lineCap = 'round'
      context.lineJoin = 'round'
      if (obstacle.kind === 'conch') {
        context.fillStyle = blue
        context.strokeStyle = blue
        context.globalAlpha = .36
        context.lineWidth = 1.4
        context.beginPath()
        context.moveTo(1, 16)
        context.bezierCurveTo(2, 5, 8, 1, 14, 2)
        context.bezierCurveTo(22, 3, 24, 10, 21, 16)
        context.closePath()
        context.fill()
        context.globalAlpha = .7
        context.stroke()
        context.beginPath()
        context.arc(13, 10, 5, -.5, Math.PI * 1.75)
        context.arc(13, 10, 2.2, Math.PI * 1.75, 0)
        context.stroke()
      } else if (obstacle.kind === 'urchin') {
        context.strokeStyle = blue
        context.fillStyle = blue
        context.globalAlpha = .55
        context.lineWidth = 1.6
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
          context.beginPath()
          context.moveTo(15 + Math.cos(angle) * 9, 15 + Math.sin(angle) * 9)
          context.lineTo(15 + Math.cos(angle) * 14, 15 + Math.sin(angle) * 14)
          context.stroke()
        }
        context.globalAlpha = .32
        context.beginPath()
        context.arc(15, 15, 10, 0, Math.PI * 2)
        context.fill()
        context.globalAlpha = .7
        context.stroke()
      } else if (obstacle.kind === 'coral') {
        context.strokeStyle = error
        context.globalAlpha = .62
        context.lineWidth = 6
        context.beginPath()
        context.moveTo(14, 37)
        context.lineTo(14, 5)
        context.moveTo(14, 21)
        context.quadraticCurveTo(4, 21, 5, 12)
        context.moveTo(14, 16)
        context.quadraticCurveTo(24, 16, 23, 7)
        context.moveTo(14, 29)
        context.quadraticCurveTo(24, 29, 24, 22)
        context.stroke()
      } else {
        context.fillStyle = blue
        context.strokeStyle = blue
        context.globalAlpha = .34
        context.lineWidth = 1.5
        context.beginPath()
        context.moveTo(2, 12)
        context.lineTo(44, 10)
        context.lineTo(38, 23)
        context.lineTo(9, 23)
        context.closePath()
        context.fill()
        context.globalAlpha = .7
        context.stroke()
        context.beginPath()
        context.moveTo(22, 11)
        context.lineTo(22, 2)
        context.lineTo(34, 9)
        context.closePath()
        context.stroke()
        context.moveTo(10, 16)
        context.lineTo(37, 15)
        context.stroke()
      }
      context.restore()
      context.globalAlpha = 1
    }
    if (splash) {
      const age = Math.min(1, (now - splash.id) / 560)
      context.strokeStyle = blue
      context.globalAlpha = 1 - age
      context.lineWidth = 1.5
      context.beginPath()
      context.ellipse(width * splash.x / 100, seaY, 8 + age * 28, 2 + age * 6, 0, 0, Math.PI * 2)
      context.stroke()
      for (const direction of [-1, -.4, .4, 1]) {
        context.beginPath()
        const dropX = width * splash.x / 100 + direction * age * 24
        const dropY = seaY - Math.sin(age * Math.PI) * (17 + Math.abs(direction) * 10)
        context.arc(dropX, dropY, 2.2, 0, Math.PI * 2)
        context.fillStyle = blue
        context.fill()
      }
      context.globalAlpha = 1
    }
  }, [obstacles, sizeRevision, splash, whaleY])

  return <canvas ref={canvas} className={css.runnerCanvas} aria-hidden="true"/>
}
