import type {
  CheckoutRequest,
  StripeGateway,
  StripeRedirect,
} from '~/services/billing/StripeGateway'

export class MockStripeGateway implements StripeGateway {
  async createCheckout(request: CheckoutRequest): Promise<StripeRedirect> {
    return {
      id: `mock-checkout-${request.userId}`,
      url: `${request.successUrl}?checkout=success&plan=${request.plan}`,
    }
  }

  async createCustomerPortal(customerId: string, returnUrl: string): Promise<StripeRedirect> {
    return {
      id: `mock-portal-${customerId}`,
      url: `${returnUrl}?portal=returned`,
    }
  }
}
