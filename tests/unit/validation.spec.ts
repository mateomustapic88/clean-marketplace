import { describe, expect, it } from 'vitest'
import {
  createCleanerProfileSchema,
  createLoginSchema,
  createOwnerProfileSchema,
  createRegisterSchema,
} from '../../schemas/validation'

const translate = (key: string) => key

describe('validation schemas', () => {
  it('accepts valid login and registration inputs', () => {
    expect(createLoginSchema(translate).safeParse({
      email: 'ana@example.hr',
      password: 'Demo1234',
    }).success).toBe(true)

    expect(createRegisterSchema(translate).safeParse({
      firstName: 'Ana',
      lastName: 'Horvat',
      email: 'ana@example.hr',
      password: 'Demo1234',
      phone: '+385 91 234 5678',
      cityCode: 'split',
      role: 'owner',
    }).success).toBe(true)
  })

  it('rejects malformed authentication inputs', () => {
    expect(createLoginSchema(translate).safeParse({
      email: 'nije-adresa',
      password: '',
    }).success).toBe(false)

    expect(createRegisterSchema(translate).safeParse({
      firstName: '',
      lastName: '',
      email: 'nije-adresa',
      password: 'kratka',
      phone: '123',
      cityCode: '',
      role: 'admin',
    }).success).toBe(false)
  })

  it('validates owner and cleaner profile requirements', () => {
    expect(createOwnerProfileSchema(translate).safeParse({
      firstName: 'Iva',
      lastName: 'Kovač',
      phone: '+385 98 123 456',
      cityCode: 'zagreb',
      preferredContactMethod: 'email',
      companyName: null,
      agencyName: null,
    }).success).toBe(true)

    expect(createCleanerProfileSchema(translate).safeParse({
      firstName: 'Marta',
      lastName: 'Babić',
      phone: '+385 99 123 4567',
      cityCode: 'zadar',
      hourlyRate: 18,
      minimumJobPrice: 45,
      serviceRadiusKm: 30,
      yearsOfExperience: 4,
      biography: 'Pouzdana demo osoba za čišćenje s iskustvom u apartmanima.',
      companyName: null,
      oib: null,
      website: '',
      languages: ['hr'],
      ownTransportation: true,
      bringsSupplies: true,
      sameDayAvailable: false,
      weekendAvailable: true,
    }).success).toBe(true)
  })
})
