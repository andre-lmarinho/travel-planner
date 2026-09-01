import { isUsernameAvailable } from "@/features/auth/lib/isUsernameAvailable";

import type { CheckUsernameAvailabilityInput } from "./availability.schema";

export async function checkUsernameAvailabilityHandler({ input }: { input: CheckUsernameAvailabilityInput }) {
  return { available: await isUsernameAvailable(input.username) };
}
