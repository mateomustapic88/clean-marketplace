import { DomainError } from '~/domains/shared/errors'
import type { UserRepository } from '~/repositories/users/UserRepository'
import type { MockDatabase } from '~/repositories/mock/MockDatabase'
import { clone, nowIso } from '~/repositories/mock/helpers'
import type {
  AdminProfile,
  CleanerProfile,
  OwnerProfile,
  User,
  UserProfile,
} from '~/domains/users/types'

export class MockUserRepository implements UserRepository {
  constructor(private readonly database: MockDatabase) {}

  async getUserById(id: string): Promise<User | null> {
    return clone(this.database.read().users.find((user) => user.id === id) ?? null)
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase()
    return clone(
      this.database.read().users.find(
        (user) => user.email.toLowerCase() === normalizedEmail,
      ) ?? null,
    )
  }

  async listUsers(): Promise<User[]> {
    return clone(this.database.read().users)
  }

  async updateUser(user: User): Promise<User> {
    return this.updateEntity('users', user)
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const snapshot = this.database.read()
    return clone(
      snapshot.owners.find((profile) => profile.userId === userId)
      ?? snapshot.cleaners.find((profile) => profile.userId === userId)
      ?? snapshot.admins.find((profile) => profile.userId === userId)
      ?? null,
    )
  }

  async listOwners(): Promise<OwnerProfile[]> {
    return clone(this.database.read().owners)
  }

  async listCleaners(): Promise<CleanerProfile[]> {
    return clone(this.database.read().cleaners)
  }

  async getOwnerById(id: string): Promise<OwnerProfile | null> {
    return clone(
      this.database.read().owners.find(
        (profile) => profile.id === id || profile.userId === id,
      ) ?? null,
    )
  }

  async getCleanerById(id: string): Promise<CleanerProfile | null> {
    return clone(
      this.database.read().cleaners.find(
        (profile) => profile.id === id || profile.userId === id,
      ) ?? null,
    )
  }

  async updateOwner(profile: OwnerProfile): Promise<OwnerProfile> {
    return this.updateEntity('owners', profile)
  }

  async updateCleaner(profile: CleanerProfile): Promise<CleanerProfile> {
    return this.updateEntity('cleaners', profile)
  }

  async updateAdmin(profile: AdminProfile): Promise<AdminProfile> {
    return this.updateEntity('admins', profile)
  }

  async listCities() {
    return clone(this.database.read().cities)
  }

  private updateEntity<
    TEntity extends User | OwnerProfile | CleanerProfile | AdminProfile,
  >(
    key: 'users' | 'owners' | 'cleaners' | 'admins',
    entity: TEntity,
  ): TEntity {
    return this.database.transaction((snapshot) => {
      const collection = snapshot[key] as unknown as TEntity[]
      const index = collection.findIndex((item) => item.id === entity.id)
      if (index < 0) {
        throw new DomainError('entity_not_found')
      }
      const updatedEntity = {
        ...clone(entity),
        updatedAt: nowIso(),
      }
      collection[index] = updatedEntity
      return updatedEntity
    })
  }
}
