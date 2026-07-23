import type { CleaningJob, CreateCleaningJobInput } from '~/domains/jobs/types'
import type { JobFormData } from '~/schemas/validation'

export type EditableJobForm = JobFormData & { photoUrls: string[] }

export const emptyJobForm = (cityCode = ''): EditableJobForm => ({
  title: '',
  apartmentName: '',
  cityCode,
  approximateArea: '',
  address: '',
  hideExactAddress: true,
  sizeSquareMeters: 40,
  bedrooms: 1,
  bathrooms: 1,
  beds: 1,
  guestCapacity: 2,
  estimatedDurationHours: 2,
  preferredDate: '',
  preferredStartTime: '10:00',
  flexibleTime: false,
  proposedBudget: 60,
  budgetType: 'fixed',
  offerDeadline: '',
  additionalInstructions: '',
  isUrgent: false,
  photoUrls: [],
  services: {
    cleaningSuppliesProvided: false,
    linenReplacement: false,
    towelReplacement: false,
    laundry: false,
    balconyCleaning: false,
    kitchenCleaning: true,
    fridgeCleaning: false,
    ovenCleaning: false,
    windowCleaning: false,
    sameDayTurnover: false,
  },
})

export const jobToForm = (job: CleaningJob): EditableJobForm => ({
  ...emptyJobForm(job.cityCode),
  ...job,
  guestCapacity: job.guestCapacity ?? Math.max(job.beds, 1) * 2,
  photoUrls: [...job.photoUrls],
  services: {
    ...emptyJobForm().services,
    ...job.services,
  },
})

export const formToJobInput = (
  form: EditableJobForm,
  ownerId: string,
  status: CreateCleaningJobInput['status'],
): CreateCleaningJobInput => ({
  ...form,
  photoUrls: [...form.photoUrls],
  services: { ...form.services },
  ownerId,
  assignedCleanerId: null,
  acceptedOfferId: null,
  status,
})

export const invalidJobSteps = (form: EditableJobForm): number[] => {
  const invalid: number[] = []
  if (!form.title || !form.apartmentName || !form.cityCode || !form.approximateArea || !form.address) invalid.push(0)
  if (form.sizeSquareMeters <= 0 || form.bathrooms <= 0 || form.beds <= 0 || form.guestCapacity <= 0 || form.estimatedDurationHours <= 0) invalid.push(1)
  if (form.proposedBudget <= 0) invalid.push(3)
  if (!form.preferredDate || !form.preferredStartTime || !form.offerDeadline) invalid.push(4)
  return invalid
}
