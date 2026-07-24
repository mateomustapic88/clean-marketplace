import type { City } from '~/domains/shared/types'
import type { PublicCleanerSearch, SearchPage } from '~/domains/search/types'
import type {
  AdminProfile,
  CleanerProfile,
  OwnerProfile,
  User,
  UserProfile,
} from '~/domains/users/types'

export interface UserRepository {
  getUserById(id: string): Promise<User | null>
  getUserByEmail(email: string): Promise<User | null>
  listUsers(): Promise<User[]>
  updateUser(user: User): Promise<User>
  getProfile(userId: string): Promise<UserProfile | null>
  listOwners(): Promise<OwnerProfile[]>
  listCleaners(): Promise<CleanerProfile[]>
  searchCleaners(criteria: PublicCleanerSearch): Promise<SearchPage<CleanerProfile>>
  getOwnerById(id: string): Promise<OwnerProfile | null>
  getCleanerById(id: string): Promise<CleanerProfile | null>
  updateOwner(profile: OwnerProfile): Promise<OwnerProfile>
  updateCleaner(profile: CleanerProfile): Promise<CleanerProfile>
  updateAdmin(profile: AdminProfile): Promise<AdminProfile>
  listCities(): Promise<City[]>
}
