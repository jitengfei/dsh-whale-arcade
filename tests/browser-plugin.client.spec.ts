// @vitest-environment jsdom
/** Browser registration, local leaderboard, node half, and invariant ownership. */
import { Context } from '@deepseek-ai/cordis'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import InvariantRegistry from '@deepseek-ai/dsh-invariants'
import { SlotRegistry } from '@deepseek-ai/dsh-client-runtime/client'
import { apply, inject } from '../src/client/index.ts'
import { apply as applyNode } from '../src/index.ts'
import * as ArcadeInvariant from '../src/invariant.ts'
import { readHighScores, recordHighScore } from '../src/client/runtime/records.ts'

describe('ui-whale-arcade browser half', () => {
  beforeEach(() =>{  localStorage.clear() })
  afterEach(() =>{  vi.restoreAllMocks() })

  it('registers the overlay entry and removes it with its fiber', async () => {
    const ctx = new Context()
    await ctx.plugin(SlotRegistry).await()
    ctx.slots.register({ name: 'root', children: { 'shell.overlay': { kind: 'list', scope: 'root' } } } as never, () => null)
    ctx.provide('locale', { register: () => () => {} } as never)
    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    expect(ctx.slots.entries('shell.overlay').map(entry => entry.options.id)).toContain('whale-arcade')
    await fiber.dispose()
    expect(ctx.slots.entries('shell.overlay').map(entry => entry.options.id)).not.toContain('whale-arcade')
  })

  it('orders scores by value, duration, then achievement time and caps ten', () => {
    for (let i = 0; i < 12; i += 1) recordHighScore('jump', { score: i % 3, durationMs: 100 - i, achievedAt: i })
    const scores = readHighScores('jump')
    expect(scores).toHaveLength(10)
    expect(scores[0]).toMatchObject({ score: 2, durationMs: 89 })
  })

  it('normalizes unsorted, oversized, and malformed browser data', () => {
    const values = Array.from({ length: 12 }, (_, index) => ({ score: index, durationMs: 100 + index, achievedAt: index }))
    localStorage.setItem('dsh.whale-arcade.scores.v1', JSON.stringify({ jump: [null, { score: 99 }, ...values.reverse()] }))
    const scores = readHighScores('jump')
    expect(scores).toHaveLength(10)
    expect(scores.map(entry => entry.score)).toEqual([11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
  })

  it('returns the completed table when browser storage rejects a write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() =>{  throw new DOMException('quota exceeded', 'QuotaExceededError') })
    expect(() => recordHighScore('catch', { score: 8, durationMs: 1200, achievedAt: 1 })).not.toThrow()
    expect(recordHighScore('catch', { score: 8, durationMs: 1200, achievedAt: 1 })).toEqual([{ score: 8, durationMs: 1200, achievedAt: 1 }])
  })
})

describe('ui-whale-arcade package halves', () => {
  it('keeps the node half inert', () => { expect(applyNode).not.toThrow() })
  it('reserves invariant ownership', async () => {
    const ctx = new Context(); await ctx.plugin(InvariantRegistry, { enabled: true })
    const fiber = ctx.plugin(ArcadeInvariant); await fiber.await()
    expect(ArcadeInvariant.name).toBe('client-ui-whale-arcade-invariant')
    await fiber.dispose()
  })
})
