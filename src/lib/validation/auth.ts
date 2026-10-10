import { z } from "zod";

export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_.-]{1,30})[a-z0-9]$/;

/** Admin usernames are case-insensitive and stored lowercase. */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    USERNAME_PATTERN,
    "Username must be 3-32 characters: lowercase letters, digits, '.', '_' or '-', starting and ending with a letter or digit.",
  );

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 256;

/** Policy for new passwords (NIST SP 800-63B style: length over composition rules). */
export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`)
  .refine((value) => value.trim().length === value.length, "Password must not start or end with whitespace.")
  .refine((value) => new Set(value).size >= 4, "Password is too repetitive.");

export const displayNameSchema = z.string().trim().min(1).max(64);

/**
 * Login input. Deliberately looser than the creation rules: we only bound the
 * sizes so oversized payloads are rejected before hashing.
 */
export const loginInputSchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(64),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

export type LoginInput = z.infer<typeof loginInputSchema>;
