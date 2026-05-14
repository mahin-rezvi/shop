"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import {
  Menu,
  Moon,
  Search,
  ShoppingCart,
  Sun,
  UserCircle,
  X,
} from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/admin", label: "Admin" },
];

export function MainNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [themeReady, setThemeReady] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    setThemeReady(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCartCount() {
      const response = await fetch("/api/cart", { cache: "no-store" }).catch(
        () => null
      );
      if (!response?.ok) return;

      const data = await response.json().catch(() => null);
      const count =
        data?.data?.items?.reduce(
          (sum: number, item: { quantity: number }) => sum + item.quantity,
          0
        ) ?? 0;

      if (isMounted) setCartCount(count);
    }

    void loadCartCount();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    router.push(`/shop?q=${encodeURIComponent(query)}`);
    setSearchQuery("");
    setIsOpen(false);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <nav className="w-full bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            D
          </span>
          <span className="truncate text-lg font-bold tracking-normal sm:text-xl">
            Dealhaven
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const isActive =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <form
          onSubmit={handleSearch}
          className="relative ml-auto hidden w-full max-w-xs items-center lg:flex"
        >
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products"
            className="h-10 w-full rounded-md border bg-background px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            className="absolute right-1 grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <button
            type="button"
            onClick={toggleTheme}
            className="grid h-10 w-10 place-items-center rounded-md border text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Toggle theme"
          >
            {themeReady && resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          <SignedIn>
            <Link
              href="/account"
              className="hidden h-10 w-10 place-items-center rounded-md border text-muted-foreground transition hover:bg-muted hover:text-foreground sm:grid"
              aria-label="Account"
            >
              <UserCircle className="h-4 w-4" />
            </Link>
          </SignedIn>

          <Link
            href="/cart"
            className="relative grid h-10 w-10 place-items-center rounded-md border text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Cart"
          >
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                {cartCount}
              </span>
            ) : null}
          </Link>

          <SignedOut>
            <Link
              href="/sign-in"
              className="hidden rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 sm:inline-flex"
            >
              Sign In
            </Link>
          </SignedOut>

          <SignedIn>
            <div className="hidden sm:block">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>

          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-md border text-muted-foreground transition hover:bg-muted hover:text-foreground md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="border-t bg-background md:hidden">
          <div className="mx-auto max-w-7xl space-y-4 px-4 py-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products"
                className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>

            <div className="grid gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  {link.label}
                </Link>
              ))}
              <SignedIn>
                <Link
                  href="/account"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  <UserCircle className="h-4 w-4" />
                  Account
                </Link>
                <div className="px-3 py-2">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
              <SignedOut>
                <Link
                  href="/sign-in"
                  className="rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground"
                >
                  Sign In
                </Link>
              </SignedOut>
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
