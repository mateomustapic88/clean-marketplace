import { defineStore } from 'pinia'
import type {
  CreateOfferInput,
  JobOffer,
  UpdateOfferInput,
} from '~/domains/offers/types'

export const useOffersStore = defineStore('offers', () => {
  const offers = ref<JobOffer[]>([])
  const isLoading = ref(false)

  const repositories = () => useNuxtApp().$repositories

  const loadForJob = async (jobId: string) => {
    isLoading.value = true
    try {
      offers.value = await repositories().offers.listByJob(jobId)
    }
    finally {
      isLoading.value = false
    }
  }

  const loadForCleaner = async (cleanerId: string) => {
    isLoading.value = true
    try {
      offers.value = await repositories().offers.listByCleaner(cleanerId)
    }
    finally {
      isLoading.value = false
    }
  }

  const createOffer = async (input: CreateOfferInput) => {
    const offer = await repositories().offers.create(input)
    offers.value.unshift(offer)
    return offer
  }

  const updateOffer = async (input: UpdateOfferInput, cleanerId: string) => {
    const offer = await repositories().offers.update(input, cleanerId)
    replaceOffer(offer)
    return offer
  }

  const withdrawOffer = async (id: string, cleanerId: string) => {
    const offer = await repositories().offers.withdraw(id, cleanerId)
    replaceOffer(offer)
    return offer
  }

  const acceptOffer = async (id: string, ownerId: string) => {
    const acceptedOffer = await repositories().offers.accept(id, ownerId)
    offers.value = await repositories().offers.listByJob(acceptedOffer.jobId)
    return acceptedOffer
  }

  const rejectOffer = async (id: string, ownerId: string) => {
    const rejectedOffer = await repositories().offers.reject(id, ownerId)
    replaceOffer(rejectedOffer)
    return rejectedOffer
  }

  const replaceOffer = (offer: JobOffer) => {
    const index = offers.value.findIndex((item) => item.id === offer.id)
    if (index >= 0) offers.value[index] = offer
  }

  return {
    offers,
    isLoading,
    loadForJob,
    loadForCleaner,
    createOffer,
    updateOffer,
    withdrawOffer,
    acceptOffer,
    rejectOffer,
  }
})
