import { z } from 'zod';

const addressSchema = z.object({
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional()
});

const emergencyContactSchema = z.object({
  name: z.string().optional(),
  relation: z.string().optional(),
  phone: z.string().optional()
});

const educationSchema = z.object({
  institute: z.string().optional(),
  degree: z.string().optional(),
  year: z.string().optional()
});

const jobDetailsSchema = z.object({
  designation: z.string().optional(),
  department: z.string().optional(),
  startDate: z.string().optional()
});

export const profileSchema = z.object({
  fatherName: z.string().optional(),
  bloodGroup: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  mobileAlternate: z.string().optional(),
  emergencyContact: emergencyContactSchema.optional(),
  currentAddress: addressSchema.optional(),
  permanentAddress: addressSchema.optional(),
  education: z.array(educationSchema).optional(),
  jobDetails: jobDetailsSchema.optional(),
  documents: z.array(z.object({ name: z.string().optional(), url: z.string().optional() })).optional(),
  completedSteps: z.array(z.string()).optional()
});

export function validateProfile(payload) {
  const result = profileSchema.safeParse(payload);
  if (!result.success) {
    return { ok: false, errors: result.error.format() };
  }
  return { ok: true, data: result.data };
}

export default { validateProfile };
