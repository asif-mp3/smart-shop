"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Button, Badge, Input, Separator } from "@/components/ui";
import { Search, Star, Sparkles, TrendingUp, Filter, X } from "lucide-react";
import {
  CategoryFilter,
  PriceFilter,
  RatingFilter,
  SortFilter,
  SortOption,
} from "@/components/filters";
import { ProductCard } from "@/components/cards";
import { useDebounce } from "@/hooks";
import { Navbar } from "@/components/layout";
import products from "@/data/products.json";

export default function HomePage() {
  const { data: session } = useSession();
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("all");
  const [price, setPrice] = useState<[number, number]>([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<SortOption>("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Debounce search input
  const debouncedSearch = useDebounce(searchInput, 500);

  // Load search history for logged-in users
  useEffect(() => {
    if (session?.user) {
      loadSearchHistory();
    }
  }, [session]);

  const loadSearchHistory = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const profile = await response.json();
        if (profile.searchHistory) {
          setRecentSearches(profile.searchHistory.slice(0, 5));
        }
      }
    } catch (error) {
      console.error("Failed to load search history:", error);
    }
  };

  const saveSearchTerm = async (term: string) => {
    if (!term.trim() || !session?.user) return;

    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addSearchHistory",
          searchTerm: term.trim(),
        }),
      });

      // Update local state
      setRecentSearches((prev) => {
        const updated = [term.trim(), ...prev.filter((s) => s !== term.trim())];
        return updated.slice(0, 5);
      });
    } catch (error) {
      console.error("Failed to save search term:", error);
    }
  };

  // Save search term to history only after user stops typing
  useEffect(() => {
    if (debouncedSearch.trim() && session?.user) {
      saveSearchTerm(debouncedSearch);
    }
  }, [debouncedSearch]);

  const handleSearch = (term: string) => {
    setSearchInput(term);
  };

  // Calculate categories and price range
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category))).sort();
    return cats;
  }, []);

  const minPrice = Math.floor(Math.min(...products.map((p) => p.price)));
  const maxPrice = Math.ceil(Math.max(...products.map((p) => p.price)));

  // Filter products using debounced search
  const filtered = useMemo(() => {
    let list = products;

    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
      );
    }

    if (category !== "all") {
      list = list.filter((p) => p.category === category);
    }

    list = list.filter((p) => p.price >= price[0] && p.price <= price[1]);
    list = list.filter((p) => p.rating >= minRating);

    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "rating-desc":
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
      case "name-asc":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        list = [...list].sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    return list;
  }, [debouncedSearch, category, price, minRating, sort]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero Section with Search */}
        <section className="">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                <h1 className="text-5xl font-bold">ShopSmart</h1>
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Discover amazing products tailored to your style. Search from
                our collection of {products.length} premium items.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for products..."
                  value={searchInput}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-12 pr-4 h-14 text-lg shadow-lg border-2 focus:border-primary"
                />
                {searchInput && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setSearchInput("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Recent Searches */}
              {session?.user && recentSearches.length > 0 && !searchInput && (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Recent:</span>
                  {recentSearches.map((term, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => setSearchInput(term)}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Quick Stats */}
              <div className="flex items-center justify-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {filtered.length} Products
                  </span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium">Top Rated</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                {debouncedSearch ? "Search Results" : "All Products"}
              </h2>
              <p className="text-muted-foreground">
                Showing {filtered.length} of {products.length} products
              </p>
            </div>

            {/* Mobile Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Collapsible Sidebar */}
            <aside
              className={`lg:col-span-3 space-y-5 lg:sticky lg:top-24 self-start transition-all ${
                showFilters
                  ? "fixed inset-0 z-50 bg-background p-6 overflow-y-auto lg:relative lg:inset-auto lg:z-auto lg:p-0"
                  : "hidden lg:block"
              }`}
            >
              {/* Mobile Close Button */}
              {showFilters && (
                <div className="flex items-center justify-between mb-4 lg:hidden">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              )}

              <CategoryFilter
                categories={categories}
                value={category}
                onChange={setCategory}
              />
              <PriceFilter
                min={minPrice}
                max={maxPrice}
                value={price}
                onChange={setPrice}
              />
              <RatingFilter value={minRating} onChange={setMinRating} />
              <Separator />
              <SortFilter value={sort} onChange={setSort} />

              {/* Apply Button for Mobile */}
              {showFilters && (
                <Button
                  className="w-full lg:hidden"
                  onClick={() => setShowFilters(false)}
                >
                  Apply Filters
                </Button>
              )}
            </aside>

            {/* Product Grid */}
            <section className="lg:col-span-9">
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search or filters
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchInput("");
                      setCategory("all");
                      setPrice([minPrice, maxPrice]);
                      setMinRating(0);
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filtered.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      showStock={true}
                      variant="default"
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </>
  );
}
