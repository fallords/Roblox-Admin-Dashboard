import { hash, verify, type Options } from "@node-rs/argon2";

/**
 * argon2id with the OWASP Password Storage Cheat Sheet baseline
 * (m=19 MiB, t=2, p=1). Parameters are embedded in each PHC hash string, so
 * they can be raised later without breaking existing hashes.
 */
const ARGON2_OPTIONS: Options = {
  algorithm: 2, // Algorithm.Argon2id (const enum; inlined for isolatedModules)
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    // Malformed hash: treat as a failed verification, never as success.
    return false;
  }
}

let dummyHash: Promise<string> | undefined;

/**
 * Spend the same time as a real verification when the username does not exist,
 * so response timing does not reveal which usernames are valid.
 */
export async function burnPasswordVerification(password: string): Promise<false> {
  dummyHash ??= hashPassword("timing-equalization-placeholder");
  await verifyPassword(await dummyHash, password);
  return false;
}
