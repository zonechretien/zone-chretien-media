import { z } from "zod";

export const newsletterSchema = z.object({
  firstName: z.string().optional().or(z.literal("")),
  email: z.string().email("Adresse email invalide"),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
