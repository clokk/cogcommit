"use server";

import { revalidatePath } from "next/cache";

/**
 * Revalidate the dashboard page after mutations.
 * This clears the Next.js router cache for the dashboard route.
 *
 * Note: Primary cache invalidation is handled by React Query on the client.
 * This server action is for cases where we need to force a full page refresh.
 */
export async function revalidateDashboard() {
  revalidatePath("/dashboard");
}
