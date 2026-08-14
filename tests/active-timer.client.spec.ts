import { describe, expect, it } from 'vitest'
import { createActiveTimer } from '../src/client/active-timer.ts'

describe('whale arcade active timer', () => {
  it('excludes every paused interval from the reported duration', () => {
    const timer = createActiveTimer()
    timer.start(100)
    expect(timer.read(400)).toBe(300)
    expect(timer.pause(500)).toBe(400)
    expect(timer.read(8_000)).toBe(400)
    timer.resume(10_000)
    expect(timer.read(10_250)).toBe(650)
    timer.pause(10_300)
    expect(timer.read(20_000)).toBe(700)
  })

  it('starts each new round from zero', () => {
    const timer = createActiveTimer()
    timer.start(0); timer.pause(900)
    timer.start(5_000)
    expect(timer.read(5_125)).toBe(125)
  })
})
