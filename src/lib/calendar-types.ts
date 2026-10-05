export type CalendarEventStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected' | 'no_show'

export interface CalendarEvent {
  id: string
  /** YYYY-MM-DD */
  date: string
  /** HH:MM or '' */
  time: string
  title: string
  subtitle?: string
  participants?: number
  status: CalendarEventStatus
}

/** Day availability coming from the provider's own TuriTop calendar. */
export interface CalendarAvailability {
  /** YYYY-MM-DD */
  date: string
  activityId: string
  activityTitle: string
  available: boolean
  vacancies: number | null
}
