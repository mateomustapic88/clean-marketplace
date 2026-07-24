import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { createEvent } from 'h3'
import { describe, expect, it } from 'vitest'
import { createSupabaseCookieAdapter } from '~/infrastructure/supabase/serverClient'

describe('Supabase SSR server cookie adapter', () => {
  it('reads request cookies and writes secure auth cookies and response headers', () => {
    const socket = new Socket()
    const request = new IncomingMessage(socket)
    request.headers.cookie = 'sb-access-token=access-token; locale=hr'
    const response = new ServerResponse(request)
    const event = createEvent(request, response)
    const adapter = createSupabaseCookieAdapter(event)

    expect(adapter.getAll()).toEqual([
      { name: 'sb-access-token', value: 'access-token' },
      { name: 'locale', value: 'hr' },
    ])

    adapter.setAll?.([{
      name: 'sb-refresh-token',
      value: 'refresh-token',
      options: {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: true,
      },
    }], {
      'Cache-Control': 'private, no-store',
      'X-Supabase-Auth': 'refreshed',
    })

    expect(response.getHeader('cache-control')).toBe('private, no-store')
    expect(response.getHeader('x-supabase-auth')).toBe('refreshed')
    const setCookieHeader = String(response.getHeader('set-cookie'))
    expect(setCookieHeader).toContain('sb-refresh-token=refresh-token')
    expect(setCookieHeader).toContain('HttpOnly')
    expect(setCookieHeader).toContain('Secure')
    expect(setCookieHeader).toContain('SameSite=Lax')
    socket.destroy()
  })
})
