// @vitest-environment jsdom
/** Browser registration, local leaderboard, node half, and invariant ownership. */
import { Context } from '@deepseek-ai/cordis'
import { beforeEach, describe, expect, it } from 'vitest'
import InvariantRegistry from '@deepseek-ai/dsh-invariants'
import { SlotRegistry } from '@deepseek-ai/dsh-client-runtime/client'
import { apply, inject } from '../src/client/index.ts'
import { apply as applyNode } from '../src/index.ts'
import * as ArcadeInvariant from '../src/invariant.ts'
import { readScores, recordScore } from '../src/client/leaderboard.ts'

describe('ui-whale-arcade browser half', () => {
  beforeEach(() =>{  localStorage.clear() })

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
    for (let i = 0; i < 12; i += 1) recordScore('jump', { score: i % 3, durationMs: 100 - i, achievedAt: i })
    const scores = readScores('jump')
    expect(scores).toHaveLength(10)
    expect(scores[0]).toMatchObject({ score: 2, durationMs: 89 })
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
