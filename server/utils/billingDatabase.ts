import { MockDatabase } from '~/repositories/mock/MockDatabase'

const billingDatabase = new MockDatabase()

export const useBillingDatabase = (): MockDatabase => billingDatabase
