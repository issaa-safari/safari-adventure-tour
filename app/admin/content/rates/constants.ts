export const ENTITY_TYPES = [
  'accommodation', 'activity', 'vehicle', 'staff', 'destination',
  'park_fee', 'meal', 'flight', 'transfer', 'other',
] as const

export const COST_CATEGORIES = [
  'accommodation', 'activities', 'park_fees', 'transport',
  'staff', 'meals', 'flights', 'other',
] as const

export const PRICING_UNITS = ['person', 'room', 'vehicle', 'group', 'day', 'night', 'trip'] as const
export const RESIDENCIES = ['all', 'resident', 'non_resident', 'citizen'] as const

export function label(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, character => character.toUpperCase())
}
