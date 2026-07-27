import type { SupabaseClient } from '@supabase/supabase-js'
import type { City } from '~/domains/shared/types'
import type { PublicCleanerSearch, SearchPage } from '~/domains/search/types'
import type { AdminProfile, CleanerProfile, OwnerProfile, User, UserProfile } from '~/domains/users/types'
import type { UserRepository } from '~/repositories/users/UserRepository'
import { throwIfSupabaseError } from './helpers'
import type { DbRow } from './mappers'

const text = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback
const number = (value: unknown) => typeof value === 'number' ? value : 0
const bool = (value: unknown) => value === true
type RatingStats = { averageRating: number | null, ratingCount: number }

const ratingStats = (records: DbRow[]) => {
  const stats = new Map<string, { total: number, count: number }>()
  for (const record of records) {
    const cleanerId = text(record.reviewee_id)
    const current = stats.get(cleanerId) ?? { total: 0, count: 0 }
    stats.set(cleanerId, {
      total: current.total + number(record.overall_score),
      count: current.count + 1,
    })
  }
  return new Map([...stats].map(([cleanerId, value]) => [cleanerId, {
    averageRating: value.count ? Number((value.total / value.count).toFixed(1)) : null,
    ratingCount: value.count,
  }]))
}
const base = (row: DbRow) => ({
  id: text(row.id ?? row.user_id), isDemo: bool(row.is_demo),
  createdAt: text(row.created_at), updatedAt: text(row.updated_at),
})

export class SupabaseUserRepository implements UserRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await this.client.from('profiles').select('*').eq('id', id).maybeSingle()
    throwIfSupabaseError(error)
    if (!data) return null
    const { data: auth } = await this.client.auth.getUser()
    return this.mapUser(data as DbRow, auth.user?.id === id ? auth.user.email ?? '' : '')
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data } = await this.client.auth.getUser()
    if (!data.user || data.user.email?.toLowerCase() !== email.toLowerCase()) return null
    return this.getUserById(data.user.id)
  }

  async listUsers(): Promise<User[]> {
    const { data, error } = await this.client.from('profiles').select('*').order('created_at')
    throwIfSupabaseError(error)
    return (data as DbRow[]).map((row) => this.mapUser(row, ''))
  }

  async updateUser(user: User): Promise<User> {
    const names = user.displayName.trim().split(/\s+/)
    const { error } = await this.client.from('profiles').update({
      first_name: names[0] ?? '',
      last_name: names.slice(1).join(' '),
      avatar_path: user.avatarSeed === user.id ? null : user.avatarSeed,
    }).eq('id', user.id)
    throwIfSupabaseError(error)
    if (user.email) {
      const { error: authError } = await this.client.auth.updateUser({ email: user.email })
      if (authError) throw new Error(authError.message)
    }
    return (await this.getUserById(user.id))!
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const user = await this.getUserById(userId)
    if (!user) return null
    if (user.role === 'owner') return this.getOwnerById(userId)
    if (user.role === 'cleaner') return this.getCleanerById(userId)
    const { data } = await this.client.from('profiles').select('*').eq('id', userId).single()
    return {
      ...base(data as DbRow), userId, firstName: data.first_name, lastName: data.last_name,
    } as AdminProfile
  }

  async listOwners(): Promise<OwnerProfile[]> {
    const { data, error } = await this.client.from('owner_profiles').select('*, profiles(*)')
    throwIfSupabaseError(error)
    return Promise.all((data as DbRow[]).map((item) => this.mapOwner(item)))
  }

  async listCleaners(): Promise<CleanerProfile[]> {
    const [{ data, error }, { data: reviews, error: reviewsError }] = await Promise.all([
      this.client.from('cleaner_profiles').select('*, profiles(*)'),
      this.client.from('reviews').select('reviewee_id, overall_score').eq('verified_completed_job', true),
    ])
    throwIfSupabaseError(error ?? reviewsError)
    const stats = ratingStats(reviews as DbRow[] ?? [])
    return Promise.all((data as DbRow[]).map((item) => this.mapCleaner(
      item,
      stats.get(text(item.user_id)),
    )))
  }

  async searchCleaners(
    criteria: PublicCleanerSearch,
  ): Promise<SearchPage<CleanerProfile>> {
    const { data, error } = await this.client.rpc('search_marketplace_cleaners', {
      p_search: criteria.search,
      p_city_code: criteria.cityCode ?? null,
      p_maximum_hourly_rate_cents: criteria.maximumHourlyRate === undefined
        ? null
        : Math.round(criteria.maximumHourlyRate * 100),
      p_maximum_minimum_price_cents: criteria.maximumMinimumPrice === undefined
        ? null
        : Math.round(criteria.maximumMinimumPrice * 100),
      p_minimum_rating: criteria.minimumRating ?? null,
      p_weekend_available: criteria.weekendAvailable ?? false,
      p_same_day_available: criteria.sameDayAvailable ?? false,
      p_brings_supplies: criteria.bringsSupplies ?? false,
      p_own_transportation: criteria.ownTransportation ?? false,
      p_language: criteria.language ?? null,
      p_sort: criteria.sort,
      p_page_size: criteria.pageSize,
      p_page_offset: Math.max(criteria.page - 1, 0) * criteria.pageSize,
    })
    throwIfSupabaseError(error)
    const matches = data as Array<{ entity_id: string, total_count: number | string }> ?? []
    if (!matches.length) return { items: [], total: 0 }

    const ids = matches.map((match) => match.entity_id)
    const [{ data: cleaners, error: cleanersError }, { data: reviews, error: reviewsError }]
      = await Promise.all([
        this.client.from('cleaner_profiles').select('*, profiles(*)').in('user_id', ids),
        this.client.from('reviews')
          .select('reviewee_id, overall_score')
          .in('reviewee_id', ids)
          .eq('verified_completed_job', true),
      ])
    throwIfSupabaseError(cleanersError ?? reviewsError)
    const stats = ratingStats(reviews as DbRow[] ?? [])
    const mapped = await Promise.all((cleaners as DbRow[]).map((item) =>
      this.mapCleaner(item, stats.get(text(item.user_id)))))
    const byId = new Map(mapped.map((cleaner) => [cleaner.userId, cleaner]))
    return {
      items: ids.flatMap((id) => byId.get(id) ?? []),
      total: Number(matches[0]?.total_count ?? 0),
    }
  }

  async getOwnerById(id: string): Promise<OwnerProfile | null> {
    const { data, error } = await this.client.from('owner_profiles').select('*, profiles(*)').eq('user_id', id).maybeSingle()
    throwIfSupabaseError(error)
    return data ? this.mapOwner(data as DbRow) : null
  }

  async getCleanerById(id: string): Promise<CleanerProfile | null> {
    const [{ data, error }, { data: reviews, error: reviewsError }] = await Promise.all([
      this.client.from('cleaner_profiles').select('*, profiles(*)').eq('user_id', id).maybeSingle(),
      this.client.from('reviews').select('reviewee_id, overall_score').eq('reviewee_id', id).eq('verified_completed_job', true),
    ])
    throwIfSupabaseError(error ?? reviewsError)
    const stats = ratingStats(reviews as DbRow[] ?? []).get(id)
    return data ? this.mapCleaner(data as DbRow, stats) : null
  }

  async updateOwner(profile: OwnerProfile): Promise<OwnerProfile> {
    await this.updateCommonProfile(profile)
    const [{ error: ownerError }, { error: privateError }, { error: preferenceError }] = await Promise.all([
      this.client.from('owner_profiles').update({
        company_name: profile.companyName, agency_name: profile.agencyName,
        apartment_name: profile.apartmentName, apartment_city_code: profile.apartmentCityCode,
      }).eq('user_id', profile.userId),
      this.client.from('owner_private_details').update({ apartment_address: profile.apartmentAddress }).eq('user_id', profile.userId),
      this.updatePreferences(profile.userId, profile.notificationPreferences),
    ])
    throwIfSupabaseError(ownerError ?? privateError ?? preferenceError)
    return (await this.getOwnerById(profile.userId))!
  }

  async updateCleaner(profile: CleanerProfile): Promise<CleanerProfile> {
    const [{ error: cleanerError }, { error: privateError }] = await Promise.all([
      this.client.from('cleaner_profiles').update({
        hourly_rate_cents: Math.round(profile.hourlyRate * 100),
        minimum_job_price_cents: Math.round(profile.minimumJobPrice * 100),
        service_radius_km: profile.serviceRadiusKm, years_of_experience: profile.yearsOfExperience,
        biography: profile.biography, company_name: profile.companyName, website: profile.website,
        own_transportation: profile.ownTransportation, brings_supplies: profile.bringsSupplies,
        same_day_available: profile.sameDayAvailable, weekend_available: profile.weekendAvailable,
        vacation_mode: profile.vacationMode,
      }).eq('user_id', profile.userId),
      this.client.from('cleaner_private_details').update({
        oib: profile.oib,
      }).eq('user_id', profile.userId),
    ])
    throwIfSupabaseError(cleanerError ?? privateError)
    await Promise.all([
      this.replaceRows('cleaner_service_areas', 'cleaner_id', profile.userId,
        profile.serviceAreas.map((area) => ({ cleaner_id: profile.userId, city_code: area.cityCode, radius_km: area.radiusKm }))),
      this.replaceRows('cleaner_languages', 'cleaner_id', profile.userId,
        profile.languages.map((language) => ({ cleaner_id: profile.userId, language_code: language }))),
      this.replaceFavourites(profile.userId, profile.favouriteJobIds),
      this.replaceAvailability(profile.userId, profile.availability),
    ])
    await this.updateCommonProfile(profile)
    return (await this.getCleanerById(profile.userId))!
  }

  async updateAdmin(profile: AdminProfile): Promise<AdminProfile> {
    const { error } = await this.client.from('profiles').update({
      first_name: profile.firstName, last_name: profile.lastName,
    }).eq('id', profile.userId)
    throwIfSupabaseError(error)
    return profile
  }

  async listCities(): Promise<City[]> {
    const { data, error } = await this.client.from('cities').select('*').order('name')
    throwIfSupabaseError(error)
    return (data as DbRow[]).map((item) => ({
      ...base(item), code: text(item.code), name: text(item.name), county: text(item.county),
    }))
  }

  private mapUser(row: DbRow, email: string): User {
    return {
      ...base(row), email, displayName: text(row.display_name), role: row.role as User['role'],
      status: row.status as User['status'], avatarSeed: text(row.avatar_path, text(row.id)),
    }
  }

  private async mapOwner(row: DbRow): Promise<OwnerProfile> {
    const profile = (row.profiles as DbRow) ?? {}
    const [{ data: privateData }, { data: preferences }] = await Promise.all([
      this.client.from('owner_private_details').select('*').eq('user_id', row.user_id).maybeSingle(),
      this.client.from('notification_preferences').select('*').eq('user_id', row.user_id).maybeSingle(),
    ])
    const contact = await this.privateProfile(text(row.user_id))
    return {
      ...base(profile), userId: text(row.user_id), firstName: text(profile.first_name), lastName: text(profile.last_name),
      phone: text(contact?.phone), cityCode: text(profile.city_code), preferredContactMethod: (contact?.preferred_contact_method ?? 'email') as OwnerProfile['preferredContactMethod'],
      companyName: text(row.company_name) || null, agencyName: text(row.agency_name) || null,
      notificationPreferences: this.preferences(preferences as DbRow | null),
      preferredLanguage: (contact?.preferred_language ?? 'hr') as 'hr' | 'en' | 'sl', timeZone: text(contact?.time_zone, 'Europe/Zagreb'),
      avatarUrl: await this.signedAvatar(text(profile.avatar_path)), onboardingCompleted: bool(profile.onboarding_completed),
      apartmentName: text(row.apartment_name) || null, apartmentCityCode: text(row.apartment_city_code) || null,
      apartmentAddress: text(privateData?.apartment_address) || null, averageRating: null, ratingCount: 0,
    }
  }

  private async mapCleaner(row: DbRow, stats?: RatingStats): Promise<CleanerProfile> {
    const profile = (row.profiles as DbRow) ?? {}
    const id = text(row.user_id)
    const [contact, privateResult, areasResult, languagesResult, favouritesResult, availabilityResult] = await Promise.all([
      this.privateProfile(id),
      this.client.from('cleaner_private_details').select('*').eq('user_id', id).maybeSingle(),
      this.client.from('cleaner_service_areas').select('*').eq('cleaner_id', id),
      this.client.from('cleaner_languages').select('*').eq('cleaner_id', id),
      this.client.from('cleaner_favourite_jobs').select('job_id').eq('cleaner_id', id),
      this.client.from('cleaner_availability').select('*, cleaner_availability_ranges(*)').eq('cleaner_id', id).order('weekday'),
    ])
    return {
      ...base(profile), userId: id, firstName: text(profile.first_name), lastName: text(profile.last_name),
      phone: text(contact?.phone), cityCode: text(profile.city_code), hourlyRate: number(row.hourly_rate_cents) / 100,
      minimumJobPrice: number(row.minimum_job_price_cents) / 100, serviceRadiusKm: number(row.service_radius_km),
      serviceAreas: (areasResult.data as DbRow[] ?? []).map((area) => ({ cityCode: text(area.city_code), radiusKm: number(area.radius_km) })),
      availability: (availabilityResult.data as DbRow[] ?? []).map((item) => ({
        weekday: number(item.weekday), enabled: bool(item.enabled),
        ranges: ((item.cleaner_availability_ranges as DbRow[]) ?? []).map((range) => ({ start: text(range.start_time).slice(0, 5), end: text(range.end_time).slice(0, 5) })),
      })),
      yearsOfExperience: number(row.years_of_experience), biography: text(row.biography), companyName: text(row.company_name) || null,
      oib: text(privateResult.data?.oib) || null, website: text(row.website) || null,
      languages: (languagesResult.data as DbRow[] ?? []).map((item) => text(item.language_code)),
      ownTransportation: bool(row.own_transportation), bringsSupplies: bool(row.brings_supplies),
      sameDayAvailable: bool(row.same_day_available), weekendAvailable: bool(row.weekend_available),
      averageRating: stats?.averageRating ?? null, ratingCount: stats?.ratingCount ?? 0, completedJobs: 0,
      favouriteJobIds: (favouritesResult.data as DbRow[] ?? []).map((item) => text(item.job_id)),
      vacationMode: bool(row.vacation_mode), avatarUrl: await this.signedAvatar(text(profile.avatar_path)),
      onboardingCompleted: bool(profile.onboarding_completed),
    }
  }

  private async privateProfile(userId: string): Promise<DbRow | null> {
    const { data } = await this.client.from('profile_private').select('*').eq('user_id', userId).maybeSingle()
    return data as DbRow | null
  }

  private preferences(row: DbRow | null) {
    return {
      email: bool(row?.email), inApp: bool(row?.in_app), jobUpdates: bool(row?.job_updates),
      offers: bool(row?.offers), marketing: bool(row?.marketing),
    }
  }

  private async updateCommonProfile(profile: OwnerProfile | CleanerProfile) {
    const newAvatarPath = profile.avatarUrl && !profile.avatarUrl.startsWith('http')
      ? profile.avatarUrl
      : null
    const { data: previousProfile } = await this.client.from('profiles').select('avatar_path').eq('id', profile.userId).single()
    const [{ error: profileError }, { error: privateError }] = await Promise.all([
      this.client.from('profiles').update({
        first_name: profile.firstName, last_name: profile.lastName, city_code: profile.cityCode,
        ...(newAvatarPath && { avatar_path: newAvatarPath }),
        onboarding_completed: profile.onboardingCompleted,
      }).eq('id', profile.userId),
      this.client.from('profile_private').update({ phone: profile.phone }).eq('user_id', profile.userId),
    ])
    throwIfSupabaseError(profileError ?? privateError)
    if (newAvatarPath && previousProfile?.avatar_path && previousProfile.avatar_path !== newAvatarPath) {
      const { error } = await this.client.storage.from('avatars').remove([previousProfile.avatar_path])
      if (error) throw new Error(error.message)
    }
  }

  private updatePreferences(userId: string, preferences: OwnerProfile['notificationPreferences']) {
    return this.client.from('notification_preferences').update({
      email: preferences.email, in_app: preferences.inApp, job_updates: preferences.jobUpdates,
      offers: preferences.offers, marketing: preferences.marketing,
    }).eq('user_id', userId)
  }

  private async replaceRows(table: string, key: string, userId: string, values: object[]) {
    const { error: deleteError } = await this.client.from(table).delete().eq(key, userId)
    throwIfSupabaseError(deleteError)
    if (values.length) {
      const { error } = await this.client.from(table).insert(values)
      throwIfSupabaseError(error)
    }
  }

  private async replaceFavourites(userId: string, jobIds: string[]) {
    await this.replaceRows('cleaner_favourite_jobs', 'cleaner_id', userId,
      jobIds.map((jobId) => ({ cleaner_id: userId, job_id: jobId })))
  }

  private async replaceAvailability(userId: string, availability: CleanerProfile['availability']) {
    const { data: existing, error: existingError } = await this.client
      .from('cleaner_availability')
      .select('id')
      .eq('cleaner_id', userId)
    throwIfSupabaseError(existingError)

    const availabilityIds = (existing as DbRow[] ?? []).map((item) => text(item.id))
    if (availabilityIds.length) {
      const { error: rangeDeleteError } = await this.client
        .from('cleaner_availability_ranges')
        .delete()
        .in('availability_id', availabilityIds)
      throwIfSupabaseError(rangeDeleteError)
    }

    const { error: availabilityDeleteError } = await this.client
      .from('cleaner_availability')
      .delete()
      .eq('cleaner_id', userId)
    throwIfSupabaseError(availabilityDeleteError)
    if (!availability.length) return

    const { data: inserted, error: availabilityInsertError } = await this.client
      .from('cleaner_availability')
      .insert(availability.map((day) => ({
        cleaner_id: userId,
        weekday: day.weekday,
        enabled: day.enabled,
      })))
      .select('id, weekday')
    throwIfSupabaseError(availabilityInsertError)

    const idsByWeekday = new Map(
      (inserted as DbRow[] ?? []).map((item) => [number(item.weekday), text(item.id)]),
    )
    const ranges = availability.flatMap((day) => day.ranges.map((range) => ({
      availability_id: idsByWeekday.get(day.weekday),
      start_time: range.start,
      end_time: range.end,
    }))).filter((range) => range.availability_id)
    if (!ranges.length) return

    const { error: rangeInsertError } = await this.client
      .from('cleaner_availability_ranges')
      .insert(ranges)
    throwIfSupabaseError(rangeInsertError)
  }

  private async signedAvatar(path: string): Promise<string | null> {
    if (!path) return null
    const { data, error } = await this.client.storage.from('avatars').createSignedUrl(path, 15 * 60)
    return error ? null : data.signedUrl
  }
}
