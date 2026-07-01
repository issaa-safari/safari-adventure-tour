import { z } from 'zod'

export const bookingTravellerSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    first_name: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    last_name: z.string().trim().min(1).max(100).optional(),
    email: z.string().trim().email().max(320),
    phone: z.string().trim().min(3).max(30),
    dateOfBirth: z.string().trim().max(30).optional().nullable(),
    date_of_birth: z.string().trim().max(30).optional().nullable(),
    nationality: z.string().trim().max(100).optional().nullable(),
    passportNumber: z.string().trim().max(50).optional().nullable(),
    passport_number: z.string().trim().max(50).optional().nullable(),
  })
  .refine((t) => Boolean(t.firstName || t.first_name), { message: 'Traveller first name is required' })
  .refine((t) => Boolean(t.lastName || t.last_name), { message: 'Traveller last name is required' })

export const bookingRequestSchema = z.object({
  travellers: z.array(bookingTravellerSchema).min(1).max(20),
  totalPrice: z.number().nonnegative(),
  currency: z.string().trim().length(3).optional(),
})

export const quoteRequestSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(3).max(30),
  country: z.string().trim().max(100).optional().nullable(),
  tourType: z.string().trim().max(100).optional().nullable(),
  startDate: z.string().trim().max(30).optional().nullable(),
  duration: z.union([z.string(), z.number()]).optional().nullable(),
  groupSize: z.union([z.string(), z.number()]).optional().nullable(),
  budget: z.union([z.string(), z.number()]).optional().nullable(),
  preferences: z.string().trim().max(2000).optional().nullable(),
  heardAboutUs: z.string().trim().max(200).optional().nullable(),
})

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(30).optional().nullable(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
})

// Meta's webhook payload is a deeply nested, loosely-typed shape — we only
// assert the top-level envelope here and keep defensive optional-chaining
// for the rest, since the real trust boundary is the signature check.
export const whatsappWebhookEnvelopeSchema = z.object({
  object: z.string().optional(),
  entry: z.array(z.unknown()).optional().default([]),
})
