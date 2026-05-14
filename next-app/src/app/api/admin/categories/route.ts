import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { createUniqueSlug } from "@/lib/slug";

type CategoryBody = {
  name?: string;
  icon?: string;
};

export async function GET() {
  try {
    const { user, response } = await requireAdminUser();
    if (!user) return response;

    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Failed to load admin categories:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireAdminUser();
    if (!user) return response;

    const body = (await request.json()) as CategoryBody;
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Category name is required" },
        { status: 400 }
      );
    }

    const slug = await createUniqueSlug(name, async (candidate) => {
      const existing = await prisma.category.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      return Boolean(existing);
    });

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        icon: body.icon?.trim() || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Category",
        entityId: category.id,
        userId: user.id,
        changes: { name: category.name, icon: category.icon },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: category,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create category" },
      { status: 500 }
    );
  }
}
