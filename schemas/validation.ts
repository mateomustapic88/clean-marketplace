import { z } from 'zod'

export type ValidationTranslator = (
  key: string,
  parameters?: Record<string, string | number>,
) => string

const requiredString = (t: ValidationTranslator) => z
  .string()
  .trim()
  .min(1, t('validation.required'))

const email = (t: ValidationTranslator) => requiredString(t)
  .email(t('validation.email'))

const phone = (t: ValidationTranslator) => requiredString(t)
  .regex(/^\+?[0-9][0-9\s-]{7,18}$/, t('validation.phone'))

export const createLoginSchema = (t: ValidationTranslator) => z.object({
  email: email(t),
  password: requiredString(t),
})

export const createRegisterSchema = (t: ValidationTranslator) => z.object({
  firstName: requiredString(t).max(60, t('validation.maxLength', { count: 60 })),
  lastName: requiredString(t).max(60, t('validation.maxLength', { count: 60 })),
  email: email(t),
  password: requiredString(t)
    .min(8, t('validation.passwordLength', { count: 8 })),
  phone: phone(t),
  cityCode: requiredString(t),
  role: z.enum(['owner', 'cleaner']),
})

export const createOwnerProfileSchema = (t: ValidationTranslator) => z.object({
  firstName: requiredString(t).max(60, t('validation.maxLength', { count: 60 })),
  lastName: requiredString(t).max(60, t('validation.maxLength', { count: 60 })),
  phone: phone(t),
  cityCode: requiredString(t),
  preferredContactMethod: z.enum(['email', 'phone', 'sms']),
  companyName: z.string().trim().max(120, t('validation.maxLength', { count: 120 })).nullable(),
  agencyName: z.string().trim().max(120, t('validation.maxLength', { count: 120 })).nullable(),
  preferredLanguage: z.enum(['hr', 'en']).default('hr'),
  timeZone: requiredString(t).default('Europe/Zagreb'),
})

const requiredPositive = (t: ValidationTranslator) => z.coerce.number()
  .positive(t('validation.positiveNumber'))

export const createJobSchema = (t: ValidationTranslator) => z.object({
  title: requiredString(t).max(120, t('validation.maxLength', { count: 120 })),
  apartmentName: requiredString(t).max(120, t('validation.maxLength', { count: 120 })),
  cityCode: requiredString(t),
  approximateArea: requiredString(t),
  address: requiredString(t),
  hideExactAddress: z.boolean(),
  sizeSquareMeters: requiredPositive(t),
  bedrooms: z.coerce.number().int().nonnegative(),
  bathrooms: z.coerce.number().int().positive(),
  beds: z.coerce.number().int().positive(),
  guestCapacity: z.coerce.number().int().positive(),
  estimatedDurationHours: requiredPositive(t),
  preferredDate: requiredString(t),
  preferredStartTime: requiredString(t),
  flexibleTime: z.boolean(),
  proposedBudget: requiredPositive(t),
  budgetType: z.enum(['hourly', 'fixed']),
  offerDeadline: requiredString(t),
  additionalInstructions: z.string().max(2000, t('validation.maxLength', { count: 2000 })),
  isUrgent: z.boolean(),
  services: z.object({
    cleaningSuppliesProvided: z.boolean(),
    linenReplacement: z.boolean(),
    towelReplacement: z.boolean(),
    laundry: z.boolean(),
    balconyCleaning: z.boolean(),
    kitchenCleaning: z.boolean(),
    fridgeCleaning: z.boolean(),
    ovenCleaning: z.boolean(),
    windowCleaning: z.boolean(),
    sameDayTurnover: z.boolean(),
  }),
})

export const createOfferSchema = (t: ValidationTranslator) => z.object({
  proposedPrice: requiredPositive(t).max(5000, t('validation.maximumValue', { value: 5000 })),
  priceType: z.enum(['hourly', 'fixed']),
  estimatedDurationHours: requiredPositive(t).max(48, t('validation.maximumValue', { value: 48 })),
  availableArrivalTime: requiredString(t),
  message: requiredString(t)
    .min(20, t('validation.minLength', { count: 20 }))
    .max(1000, t('validation.maxLength', { count: 1000 })),
  suppliesIncluded: z.boolean(),
  expiresAt: requiredString(t),
})

export const createCleanerProfileSchema = (t: ValidationTranslator) => z.object({
  firstName: requiredString(t).max(60, t('validation.maxLength', { count: 60 })),
  lastName: requiredString(t).max(60, t('validation.maxLength', { count: 60 })),
  phone: phone(t),
  cityCode: requiredString(t),
  hourlyRate: z.coerce.number()
    .positive(t('validation.positiveNumber'))
    .max(250, t('validation.maximumValue', { value: 250 })),
  minimumJobPrice: z.coerce.number()
    .nonnegative(t('validation.nonNegativeNumber'))
    .max(1000, t('validation.maximumValue', { value: 1000 })),
  serviceRadiusKm: z.coerce.number()
    .int(t('validation.wholeNumber'))
    .min(1, t('validation.minimumValue', { value: 1 }))
    .max(200, t('validation.maximumValue', { value: 200 })),
  yearsOfExperience: z.coerce.number()
    .int(t('validation.wholeNumber'))
    .min(0, t('validation.nonNegativeNumber'))
    .max(60, t('validation.maximumValue', { value: 60 })),
  biography: requiredString(t)
    .min(30, t('validation.minLength', { count: 30 }))
    .max(600, t('validation.maxLength', { count: 600 })),
  companyName: z.string().trim().max(120, t('validation.maxLength', { count: 120 })).nullable(),
  oib: z.string().trim().regex(/^\d{11}$/, t('validation.oib')).nullable(),
  website: z.union([
    z.literal(''),
    z.url(t('validation.url')),
  ]).nullable(),
  languages: z.array(requiredString(t)).min(1, t('validation.languages')),
  ownTransportation: z.boolean(),
  bringsSupplies: z.boolean(),
  sameDayAvailable: z.boolean(),
  weekendAvailable: z.boolean(),
})

export const createContactSchema = (t: ValidationTranslator) => z.object({
  name: requiredString(t).max(120, t('validation.maxLength', { count: 120 })),
  email: email(t),
  userType: z.enum(['owner', 'cleaner', 'other']),
  subject: requiredString(t).max(160, t('validation.maxLength', { count: 160 })),
  message: requiredString(t)
    .min(20, t('validation.minLength', { count: 20 }))
    .max(2000, t('validation.maxLength', { count: 2000 })),
  consent: z.literal(true, { error: t('validation.consent') }),
})

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>
export type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>
export type OwnerProfileFormData = z.infer<ReturnType<typeof createOwnerProfileSchema>>
export type CleanerProfileFormData = z.infer<ReturnType<typeof createCleanerProfileSchema>>
export type ContactFormData = z.infer<ReturnType<typeof createContactSchema>>
export type JobFormData = z.infer<ReturnType<typeof createJobSchema>>
export type OfferFormData = z.infer<ReturnType<typeof createOfferSchema>>
