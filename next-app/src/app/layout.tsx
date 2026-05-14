"use client";

import { useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ShoppingCart, Search, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function MainNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    router.push(`/shop?q=${encodeURIComponent(searchQuery)}`);
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <nav className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      
      {/* TOP BAR */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl sm:text-2xl"
        >
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600" />
          Dealhaven
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/shop" className="hover:text-primary">
            Shop
          </Link>
          <Link href="/about" className="hover:text-primary">
            About
          </Link>
          <Link href="/contact" className="hover:text-primary">
            Contact
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Desktop Search */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex items-center relative"
          >
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-48 lg:w-64 px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            <button type="submit" className="absolute right-2">
              <Search className="w-4 h-4 text-muted-foreground" />
            </button>
          </form>

          {/* Cart */}
          <Link href="/cart" className="relative">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
              0
            </span>
          </Link>

          {/* Auth */}
          <SignedOut>
            <Link
              href="/sign-in"
              className="hidden sm:inline-flex px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90"
            >
              Sign In
            </Link>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-1"
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-4">
            
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 px-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
              >
                Search
              </button>
            </form>

            {/* Links */}
            <div className="flex flex-col gap-3 text-sm">
              <Link onClick={() => setIsOpen(false)} href="/shop">
                Shop
              </Link>
              <Link onClick={() => setIsOpen(false)} href="/about">
                About
              </Link>
              <Link onClick={() => setIsOpen(false)} href="/contact">
                Contact
              </Link>
            </div>

            {/* Auth (Mobile) */}
            <div className="pt-2">
              <SignedOut>
                <Link
                  onClick={() => setIsOpen(false)}
                  href="/sign-in"
                  className="block w-full text-center px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                >
                  Sign In
                </Link>
              </SignedOut>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}