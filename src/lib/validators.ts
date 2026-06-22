import { z } from "zod";

export const pinSchema = z
  .string()
  .length(6, { message: "PIN must be exactly 6 digits" })
  .regex(/^\d{6}$/, { message: "PIN must contain only digits" });

export const profileNameSchema = z
  .string()
  .min(1, { message: "Name is required" })
  .max(50, { message: "Name must be 50 characters or fewer" })
  .transform((s) => s.trim())
  .pipe(
    z.string().regex(/^[\u0E01-\u0E3Ea-zA-Z0-9\s.\-]+$/, {
      message: "Name contains invalid characters",
    })
  );

export const amountSchema = z
  .number({ message: "Amount must be a number" })
  .int({ message: "Amount must be a whole number (no decimals)" })
  .positive({ message: "Amount must be greater than 0" })
  .max(99_999_999, {
    message: "Amount cannot exceed ฿99,999,999",
  });

export const recordTypeSchema = z.enum(["borrow", "lend"], {
  message: "Type must be 'borrow' or 'lend'",
});

export const descriptionSchema = z
  .string()
  .max(200, { message: "Description must be 200 characters or fewer" })
  .transform((s) => s.replace(/<[^>]*>/g, "").trim())
  .optional()
  .default("");

export const avatarTypeSchema = z.enum(["male", "female"], {
  message: "Avatar must be 'male' or 'female'",
});

export const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, {
    message: "Color must be a valid hex color",
  });

export type Pin = z.infer<typeof pinSchema>;
export type ProfileName = z.infer<typeof profileNameSchema>;
export type RecordType = z.infer<typeof recordTypeSchema>;
export type AvatarType = z.infer<typeof avatarTypeSchema>;