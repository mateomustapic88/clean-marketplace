export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'premium'
export type AlertVariant = 'info' | 'success' | 'warning' | 'error'

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface TabItem {
  id: string
  label: string
  disabled?: boolean
}
