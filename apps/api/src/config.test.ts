import { describe, expect, it } from 'vitest'

import { loadConfig } from './config.js'

describe('loadConfig', () => {
  it('uses safe local development defaults', () => {
    expect(loadConfig({})).toEqual({
      host: '127.0.0.1',
      nodeEnv: 'development',
      port: 8080,
    })
  })

  it('parses a valid environment', () => {
    expect(
      loadConfig({ HOST: '0.0.0.0', NODE_ENV: 'production', PORT: '3000' }),
    ).toEqual({
      host: '0.0.0.0',
      nodeEnv: 'production',
      port: 3000,
    })
  })

  it.each(['0', '65536', '3.5', 'not-a-port'])('rejects PORT=%s', (port) => {
    expect(() => loadConfig({ PORT: port })).toThrow(/PORT must be/)
  })

  it('rejects an unknown runtime environment', () => {
    expect(() => loadConfig({ NODE_ENV: 'staging' })).toThrow(
      /NODE_ENV must be/,
    )
  })
})
