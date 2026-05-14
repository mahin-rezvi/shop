"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchProducts() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="mx-auto flex max-w-md flex-col gap-2 sm:flex-row"
    >
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="Search for products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
        />
        <Search className="absolute right-3 top-3 w-5 h-5 text-gray-500" />
      </div>
      <button
        type="submit"
        className="rounded-md bg-white px-6 py-3 font-semibold text-blue-700 transition hover:bg-gray-100"
      >
        Search
      </button>
    </form>
  );
}
