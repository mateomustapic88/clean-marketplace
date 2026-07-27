export interface ContactEmailInput {
  type: 'bug' | 'improvement' | 'support'
  name: string
  email: string
  subject: string
  message: string
}

interface ResendContactEmailConfig {
  apiKey: string
  from: string
  to: string
}

const typeLabels: Record<ContactEmailInput['type'], string> = {
  bug: 'Prijava greške',
  improvement: 'Prijedlog poboljšanja',
  support: 'Zahtjev za podršku',
}

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll('\'', '&#039;')

export const sendContactEmail = async (
  input: ContactEmailInput,
  config: ResendContactEmailConfig,
  idempotencyKey: string,
) => {
  const text = [
    `Vrsta: ${typeLabels[input.type]}`,
    `Ime i prezime: ${input.name}`,
    `E-pošta: ${input.email}`,
    '',
    input.message,
  ].join('\n')
  const html = `
    <h2>${escapeHtml(typeLabels[input.type])}</h2>
    <p><strong>Ime i prezime:</strong> ${escapeHtml(input.name)}</p>
    <p><strong>E-pošta:</strong> ${escapeHtml(input.email)}</p>
    <hr>
    <p>${escapeHtml(input.message).replaceAll('\n', '<br>')}</p>
  `.trim()
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      from: config.from,
      to: [config.to],
      reply_to: input.email,
      subject: `[Clean Marketplace] ${input.subject}`,
      text,
      html,
    }),
  })

  if (!response.ok) {
    throw new Error(`Resend delivery failed with status ${response.status}`)
  }
}
