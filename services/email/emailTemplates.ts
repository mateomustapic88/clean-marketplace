import type { EmailTemplate } from '~/services/email/EmailService'

export const emailTemplateKeys: Record<EmailTemplate, { subject: string, body: string }> = {
  welcome: { subject: 'email.welcome.subject', body: 'email.welcome.body' },
  trial_ending: { subject: 'email.trialEnding.subject', body: 'email.trialEnding.body' },
  payment_success: { subject: 'email.paymentSuccess.subject', body: 'email.paymentSuccess.body' },
  payment_failed: { subject: 'email.paymentFailed.subject', body: 'email.paymentFailed.body' },
  offer_received: { subject: 'email.offerReceived.subject', body: 'email.offerReceived.body' },
  offer_accepted: { subject: 'email.offerAccepted.subject', body: 'email.offerAccepted.body' },
  offer_rejected: { subject: 'email.offerRejected.subject', body: 'email.offerRejected.body' },
  job_assigned: { subject: 'email.jobAssigned.subject', body: 'email.jobAssigned.body' },
  review_reminder: { subject: 'email.reviewReminder.subject', body: 'email.reviewReminder.body' },
}
