export type EmailTemplate
  = | 'welcome'
    | 'trial_ending'
    | 'payment_success'
    | 'payment_failed'
    | 'offer_received'
    | 'offer_accepted'
    | 'offer_rejected'
    | 'job_assigned'
    | 'review_reminder'

export interface EmailMessage {
  to: string
  template: EmailTemplate
  locale: 'hr' | 'en'
  variables: Record<string, string | number>
}

export interface EmailService {
  send(message: EmailMessage): Promise<void>
}
