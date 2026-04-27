import { z } from 'zod';

export const SosTriggerBodySchema = z.object({
  lat: z.coerce.number().refine((n) => n >= -90 && n <= 90),
  lng: z.coerce.number().refine((n) => n >= -180 && n <= 180),
  message: z.string().max(500).optional(),
});

export type SosTriggerBody = z.infer<typeof SosTriggerBodySchema>;

export const CreateContactBodySchema = z.object({
  name: z.string().min(1).max(100),
  phone: z
    .string()
    .min(8)
    .max(20)
    .regex(/^[+0-9\s-]+$/, 'Use digits and optional + prefix'),
  relation: z.string().max(80).optional(),
});

export const UpdateContactBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z
    .string()
    .min(8)
    .max(20)
    .regex(/^[+0-9\s-]+$/)
    .optional(),
  relation: z.string().max(80).optional().nullable(),
});

export type CreateContactBody = z.infer<typeof CreateContactBodySchema>;
export type UpdateContactBody = z.infer<typeof UpdateContactBodySchema>;
