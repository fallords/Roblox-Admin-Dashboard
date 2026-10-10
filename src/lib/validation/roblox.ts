import { z } from "zod";

const INT64_MAX = BigInt("9223372036854775807");
const POSITIVE_ID = /^[1-9]\d{0,18}$/;

/**
 * A Roblox UserId that can be targeted by live commands: a positive integer in
 * canonical decimal form. Negative ids (used by DEMO players and Studio test
 * players) are rejected.
 */
export const liveRobloxUserIdSchema = z
  .string()
  .trim()
  .regex(POSITIVE_ID, "Roblox UserId must be a positive whole number.")
  // Zod 4 runs refinements even after a failed regex, so re-check the format
  // before BigInt() (which throws on input like "1e9").
  .refine((value) => !POSITIVE_ID.test(value) || BigInt(value) <= INT64_MAX, "Roblox UserId is out of range.");

/** Any player id stored in the database, including negative DEMO ids. */
export const storedRobloxUserIdSchema = z
  .string()
  .trim()
  .regex(/^-?[1-9]\d{0,18}$/, "Invalid Roblox UserId.");

export function isDemoRobloxUserId(value: string): boolean {
  return value.startsWith("-");
}
