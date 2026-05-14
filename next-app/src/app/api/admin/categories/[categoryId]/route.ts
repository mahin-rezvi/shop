import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";

type RouteContext = {
  params: {
    categoryId: string;
  };
};

type CategoryUpdateBody = {
  name?: string;
  icon?: string;
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { user, response } = await requireAdminUser();
    if (!user) return response;

    const body = (await request.json()) as CategoryUpdateBody;
    const data: CategoryUpdateBody = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json(
          { success: false, message: "Name cannot be empty" },
          { status: 400 }
        );
      }
      data.name = name;
    }

    if (body.icon !== undefined) {
      data.icon = body.icon.trim();
    }

    const category = await prisma.category.update({
      where: { id: params.categoryId },
      data,
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "Category",
        entityId: category.id,
        userId: user.id,
        changes: data,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Failed to update category:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { user, response } = await requireAdminUser();
    if (!user) return response;

    const productCount = await prisma.product.count({
      where: { categoryId: params.categoryId },
    });

    if (productCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Move or delete products before deleting this category",
        },
        { status: 409 }
      );
    }

    await prisma.category.delete({
      where: { id: params.categoryId },
    });

    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        entity: "Category",
        entityId: params.categoryId,
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted",
    });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete category" },
      { status: 500 }
    );
  }
}
