import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function configuredAdminIds() {
  return (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export async function getAuthenticatedDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser().catch(() => null);
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    `${userId}@users.dealhaven.local`;
  const name = clerkUser?.fullName ?? clerkUser?.username ?? "Dealhaven User";
  const image = clerkUser?.imageUrl ?? null;

  return prisma.user.upsert({
    where: { id: userId },
    update: { email, name, image },
    create: { id: userId, email, name, image },
  });
}

export async function requireDbUser() {
  const user = await getAuthenticatedDbUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return { user, response: null };
}

export async function requireAdminUser() {
  const { user, response } = await requireDbUser();
  if (!user) return { user: null, response };

  const adminIds = configuredAdminIds();
  if (adminIds.length > 0 && !adminIds.includes(user.id)) {
    return {
      user: null,
      response: NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return { user, response: null };
}
