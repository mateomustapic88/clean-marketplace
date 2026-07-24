import type {
  Availability,
  DemoEntity,
  PreferredContactMethod,
  ServiceArea,
} from '~/domains/shared/types'

export type UserRole = 'owner' | 'cleaner' | 'admin'
export type UserStatus = 'active' | 'suspended'

export interface User extends DemoEntity {
  email: string
  displayName: string
  role: UserRole
  status: UserStatus
  avatarSeed: string
}

export interface NotificationPreferences {
  email: boolean
  inApp: boolean
  jobUpdates: boolean
  offers: boolean
  marketing: boolean
}

export interface OwnerProfile extends DemoEntity {
  userId: string
  firstName: string
  lastName: string
  phone: string
  cityCode: string
  preferredContactMethod: PreferredContactMethod
  companyName: string | null
  agencyName: string | null
  notificationPreferences: NotificationPreferences
  preferredLanguage: 'hr' | 'en' | 'sl'
  timeZone: string
  avatarUrl: string | null
  onboardingCompleted: boolean
  apartmentName: string | null
  apartmentCityCode: string | null
  apartmentAddress: string | null
  averageRating: number | null
  ratingCount: number
}

export interface CleanerProfile extends DemoEntity {
  userId: string
  firstName: string
  lastName: string
  phone: string
  cityCode: string
  hourlyRate: number
  minimumJobPrice: number
  serviceRadiusKm: number
  serviceAreas: ServiceArea[]
  availability: Availability[]
  yearsOfExperience: number
  biography: string
  companyName: string | null
  oib: string | null
  website: string | null
  languages: string[]
  ownTransportation: boolean
  bringsSupplies: boolean
  sameDayAvailable: boolean
  weekendAvailable: boolean
  averageRating: number | null
  ratingCount: number
  completedJobs: number
  favouriteJobIds: string[]
  vacationMode: boolean
  avatarUrl: string | null
  onboardingCompleted: boolean
}

export interface AdminProfile extends DemoEntity {
  userId: string
  firstName: string
  lastName: string
}

export type UserProfile = OwnerProfile | CleanerProfile | AdminProfile
