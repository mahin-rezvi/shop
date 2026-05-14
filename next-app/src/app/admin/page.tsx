"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { Category, Order, Product } from "@/lib/types";

type Stats = {
  productCount: number;
  categoryCount: number;
  orderCount: number;
  userCount: number;
  revenue: number;
  lowStockCount: number;
};

type AdminCategory = Category & {
  _count?: {
    products: number;
  };
};

type ProductDraft = {
  name: string;
  description: string;
  price: string;
  image: string;
  stock: string;
  categoryId: string;
  featured: boolean;
};

const emptyProduct: ProductDraft = {
  name: "",
  description: "",
  price: "",
  image: "",
  stock: "0",
  categoryId: "",
  featured: false,
};

const orderStatuses = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

function dollarsToCents(value: string) {
  return Math.round(Number(value || 0) * 100);
}

function centsToDollars(value: number) {
  return (value / 100).toFixed(2);
}

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "categories">(
    "products"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [draft, setDraft] = useState<ProductDraft>(emptyProduct);
  const [categoryDraft, setCategoryDraft] = useState({ name: "", icon: "" });

  const defaultCategoryId = useMemo(
    () => categories[0]?.id ?? "",
    [categories]
  );

  async function loadAdminData() {
    setIsLoading(true);
    setMessage("");

    try {
      const [statsResponse, productsResponse, categoriesResponse, ordersResponse] =
        await Promise.all([
          fetch("/api/admin/stats", { cache: "no-store" }),
          fetch("/api/admin/products", { cache: "no-store" }),
          fetch("/api/admin/categories", { cache: "no-store" }),
          fetch("/api/admin/orders", { cache: "no-store" }),
        ]);

      if ([statsResponse, productsResponse, categoriesResponse, ordersResponse].some(
        (response) => response.status === 401 || response.status === 403
      )) {
        setMessage("You are not allowed to access admin tools.");
        return;
      }

      const [statsJson, productsJson, categoriesJson, ordersJson] =
        await Promise.all([
          statsResponse.json(),
          productsResponse.json(),
          categoriesResponse.json(),
          ordersResponse.json(),
        ]);

      setStats(statsJson.data);
      setProducts(productsJson.data ?? []);
      setCategories(categoriesJson.data ?? []);
      setOrders(ordersJson.data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isLoaded && user) void loadAdminData();
  }, [isLoaded, user]);

  useEffect(() => {
    if (!draft.categoryId && defaultCategoryId) {
      setDraft((current) => ({ ...current, categoryId: defaultCategoryId }));
    }
  }, [defaultCategoryId, draft.categoryId]);

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft,
        price: dollarsToCents(draft.price),
        stock: Number(draft.stock),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Failed to create product");
      return;
    }

    setDraft({ ...emptyProduct, categoryId: defaultCategoryId });
    setMessage("Product created.");
    await loadAdminData();
  }

  async function updateProduct(product: Product) {
    setMessage("");

    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: product.name,
        description: product.description ?? "",
        price: product.price,
        image: product.image ?? "",
        stock: product.stock,
        categoryId: product.category.id,
        featured: product.featured,
      }),
    });

    const data = await response.json();
    setMessage(response.ok ? "Product saved." : data.message || "Save failed");
    if (response.ok) await loadAdminData();
  }

  async function deleteProduct(productId: string) {
    setMessage("");

    const response = await fetch(`/api/admin/products/${productId}`, {
      method: "DELETE",
    });

    const data = await response.json();
    setMessage(response.ok ? "Product deleted." : data.message || "Delete failed");
    if (response.ok) await loadAdminData();
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryDraft),
    });

    const data = await response.json();
    setMessage(response.ok ? "Category created." : data.message || "Create failed");
    if (response.ok) {
      setCategoryDraft({ name: "", icon: "" });
      await loadAdminData();
    }
  }

  async function updateOrder(orderId: string, status: string) {
    setMessage("");

    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();
    setMessage(response.ok ? "Order updated." : data.message || "Update failed");
    if (response.ok) await loadAdminData();
  }

  if (!isLoaded) {
    return <div className="py-12 text-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="mb-3 text-2xl font-bold">Admin</h1>
        <p className="mb-6 text-muted-foreground">Sign in to manage the shop.</p>
        <Link
          href="/sign-in"
          className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin</h1>
          <p className="text-muted-foreground">Products, categories, and orders.</p>
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading
          </div>
        ) : null}
      </div>

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {[
            ["Products", stats.productCount],
            ["Categories", stats.categoryCount],
            ["Orders", stats.orderCount],
            ["Users", stats.userCount],
            ["Revenue", `$${centsToDollars(stats.revenue)}`],
            ["Low Stock", stats.lowStockCount],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border bg-card p-4">
              <p className="text-xs uppercase text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">
          {message}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-b">
        {(["products", "orders", "categories"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-2 text-sm font-semibold capitalize ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "products" ? (
        <section className="space-y-6">
          <form
            onSubmit={createProduct}
            className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-6"
          >
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Product name"
              className="input-base md:col-span-2"
              required
            />
            <input
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              placeholder="Price"
              className="input-base"
              inputMode="decimal"
              required
            />
            <input
              value={draft.stock}
              onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
              placeholder="Stock"
              className="input-base"
              inputMode="numeric"
              required
            />
            <select
              value={draft.categoryId}
              onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
              className="input-base"
              required
            >
              <option value="">Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
            <input
              value={draft.image}
              onChange={(e) => setDraft({ ...draft, image: e.target.value })}
              placeholder="Image URL"
              className="input-base md:col-span-2"
            />
            <input
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              placeholder="Description"
              className="input-base md:col-span-3"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) =>
                  setDraft({ ...draft, featured: e.target.checked })
                }
              />
              Featured
            </label>
          </form>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Featured</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t">
                    <td className="p-3">
                      <input
                        value={product.name}
                        onChange={(e) =>
                          setProducts((current) =>
                            current.map((item) =>
                              item.id === product.id
                                ? { ...item, name: e.target.value }
                                : item
                            )
                          )
                        }
                        className="input-base"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        value={centsToDollars(product.price)}
                        onChange={(e) =>
                          setProducts((current) =>
                            current.map((item) =>
                              item.id === product.id
                                ? {
                                    ...item,
                                    price: dollarsToCents(e.target.value),
                                  }
                                : item
                            )
                          )
                        }
                        className="input-base"
                        inputMode="decimal"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        value={product.stock}
                        onChange={(e) =>
                          setProducts((current) =>
                            current.map((item) =>
                              item.id === product.id
                                ? { ...item, stock: Number(e.target.value) }
                                : item
                            )
                          )
                        }
                        className="input-base"
                        inputMode="numeric"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={product.category.id}
                        onChange={(e) =>
                          setProducts((current) =>
                            current.map((item) => {
                              if (item.id !== product.id) return item;
                              const category = categories.find(
                                (option) => option.id === e.target.value
                              );
                              return category
                                ? { ...item, category }
                                : item;
                            })
                          )
                        }
                        className="input-base"
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={product.featured}
                        onChange={(e) =>
                          setProducts((current) =>
                            current.map((item) =>
                              item.id === product.id
                                ? { ...item, featured: e.target.checked }
                                : item
                            )
                          )
                        }
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateProduct(product)}
                          className="grid h-9 w-9 place-items-center rounded-md border hover:bg-muted"
                          aria-label="Save product"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProduct(product.id)}
                          className="grid h-9 w-9 place-items-center rounded-md border text-destructive hover:bg-destructive/10"
                          aria-label="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === "orders" ? (
        <section className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="p-3 font-medium">{order.orderNumber}</td>
                  <td className="p-3">{order.items.length} item(s)</td>
                  <td className="p-3">${centsToDollars(order.total)}</td>
                  <td className="p-3">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrder(order.id, e.target.value)}
                      className="input-base"
                    >
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {activeTab === "categories" ? (
        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <form
            onSubmit={createCategory}
            className="space-y-3 rounded-lg border bg-card p-4"
          >
            <input
              value={categoryDraft.name}
              onChange={(e) =>
                setCategoryDraft({ ...categoryDraft, name: e.target.value })
              }
              placeholder="Category name"
              className="input-base"
              required
            />
            <input
              value={categoryDraft.icon}
              onChange={(e) =>
                setCategoryDraft({ ...categoryDraft, icon: e.target.value })
              }
              placeholder="Icon"
              className="input-base"
            />
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </form>

          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map((category) => (
              <div key={category.id} className="rounded-lg border bg-card p-4">
                <p className="font-semibold">
                  {category.icon ? `${category.icon} ` : ""}
                  {category.name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {category._count?.products ?? 0} products
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
