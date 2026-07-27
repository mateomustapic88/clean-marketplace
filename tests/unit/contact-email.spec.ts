import { afterEach, describe, expect, it, vi } from 'vitest'
import { sendContactEmail } from '~/server/utils/contactEmail'

const input = {
  type: 'support' as const,
  name: 'Ana <script>',
  email: 'ana@example.com',
  subject: 'Pomoć s profilom',
  message: 'Molim pomoć.\nHvala.',
}

describe('contact email delivery', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends feedback to the configured mailbox with a safe reply-to address', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await sendContactEmail(input, {
      apiKey: 'resend-test-key',
      from: 'Clean Marketplace <support@clean-marketplace.com>',
      to: 'cleanmarketplace.2026@gmail.com',
    }, 'contact-feedback-123')

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(String(request.body))
    expect(url).toBe('https://api.resend.com/emails')
    expect(request.headers).toMatchObject({
      'Authorization': 'Bearer resend-test-key',
      'Idempotency-Key': 'contact-feedback-123',
    })
    expect(body.to).toEqual(['cleanmarketplace.2026@gmail.com'])
    expect(body.reply_to).toBe('ana@example.com')
    expect(body.html).toContain('Ana &lt;script&gt;')
    expect(body.html).not.toContain('Ana <script>')
  })

  it('fails when Resend rejects the delivery request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 422 })))

    await expect(sendContactEmail(input, {
      apiKey: 'resend-test-key',
      from: 'Clean Marketplace <support@clean-marketplace.com>',
      to: 'cleanmarketplace.2026@gmail.com',
    }, 'contact-feedback-456')).rejects.toThrow('status 422')
  })
})
