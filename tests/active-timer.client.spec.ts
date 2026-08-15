import { describe, expect, it } from 'vitest'
import { createActiveTimer } from '../src/client/runtime/active-timer.ts'

describe('whale arcade active timer', () => {
  it('excludes every paused interval from the reported duration', () => {
    let now = 100
    const timer = createActiveTimer(() => now)
    timer.start()
    now = 400; expect(timer.read()).toBe(300)
    now = 500; expect(timer.pause()).toBe(400)
    now = 8_000; expect(timer.read()).toBe(400)
    now = 10_000; timer.resume()
    now = 10_250; expect(timer.read()).toBe(650)
    now = 10_300; timer.pause()
    now = 20_000; expect(timer.read()).toBe(700)
  })

  it('starts each new round from zero', () => {
    let now = 0
    const timer = createActiveTimer(() => now)
    timer.start(); now = 900; timer.pause()
    now = 5_000; timer.start()
    now = 5_125; expect(timer.read()).toBe(125)
  })
})
