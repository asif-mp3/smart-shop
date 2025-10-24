"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { Button, Badge, Skeleton, Separator } from "@/components/ui";
import { Sparkles, TrendingUp } from "lucide-react";
import { ProductRecommendation } from "@/types/recommendation";
import { toast } from "sonner";
import {
  CategoryFilter,
  PriceFilter,
  RatingFilter,
  SearchFilter,
  SortFilter,
  SortOption,
} from "@/components/filters";
import { ProductCard } from "@/components/cards";
import { useDebounce } from "@/hooks";
import sampleRecommendations from "@/data/sample-recommendations.json";

// Toggle this to switch between local data and API
const USE_LOCAL_DATA = false;

// Cache settings
const CACHE_KEY = "ai-recommendations-cache";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

interface CachedRecommendations {
  recommendations: ProductRecommendation[];
  stats: { totalFiltered: number; totalProducts: number };
  timestamp: number;
  userId: string;
}

// Helper functions for cache management
const getCachedRecommendations = (
  userId: string
): CachedRecommendations | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedRecommendations = JSON.parse(cached);

    // Check if cache is expired or for different user
    const isExpired = Date.now() - data.timestamp > CACHE_DURATION;
    const isDifferentUser = data.userId !== userId;

    if (isExpired || isDifferentUser) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error reading cache:", error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

const setCachedRecommendations = (
  userId: string,
  recommendations: ProductRecommendation[],
  stats: { totalFiltered: number; totalProducts: number }
) => {
  try {
    const cacheData: CachedRecommendations = {
      recommendations,
      stats,
      timestamp: Date.now(),
      userId,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error writing cache:", error);
  }
};

const clearCachedRecommendations = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
};

export default function RecommendedProductsPage() {
  const { data: session } = useSession();
  const [recommendations, setRecommendations] = useState<
    ProductRecommendation[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalFiltered: 0, totalProducts: 0 });
  const [isCached, setIsCached] = useState(false);

  // Ref to prevent duplicate fetches in React 18 Strict Mode
  const hasFetchedRef = useRef(false);

  // Filter states
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("all");
  const [price, setPrice] = useState<[number, number]>([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<SortOption>("relevance");

  // Debounce search input
  const debouncedSearch = useDebounce(searchInput, 500);

  // Calculate available categories from recommendations
  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(recommendations.map((r) => r.product.category))
    ).sort();
    return cats;
  }, [recommendations]);

  // Calculate price range from recommendations
  const minPrice = useMemo(() => {
    if (recommendations.length === 0) return 0;
    return Math.floor(Math.min(...recommendations.map((r) => r.product.price)));
  }, [recommendations]);

  const maxPrice = useMemo(() => {
    if (recommendations.length === 0) return 1000;
    return Math.ceil(Math.max(...recommendations.map((r) => r.product.price)));
  }, [recommendations]);

  // Filter and sort recommendations
  const filtered = useMemo(() => {
    let list = recommendations;

    // Search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      list = list.filter(
        (rec) =>
          rec.product.name.toLowerCase().includes(searchLower) ||
          rec.product.description.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (category !== "all") {
      list = list.filter((rec) => rec.product.category === category);
    }

    // Price filter
    list = list.filter(
      (rec) => rec.product.price >= price[0] && rec.product.price <= price[1]
    );

    // Rating filter
    list = list.filter((rec) => rec.product.rating >= minRating);

    // Sort
    switch (sort) {
      case "relevance":
        list = [...list].sort((a, b) => b.relevanceScore - a.relevanceScore);
        break;
      case "price-asc":
        list = [...list].sort((a, b) => a.product.price - b.product.price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.product.price - a.product.price);
        break;
      case "rating-desc":
        list = [...list].sort((a, b) => b.product.rating - a.product.rating);
        break;
      case "name-asc":
        list = [...list].sort((a, b) =>
          a.product.name.localeCompare(b.product.name)
        );
        break;
      case "name-desc":
        list = [...list].sort((a, b) =>
          b.product.name.localeCompare(a.product.name)
        );
        break;
      default:
        break;
    }

    return list;
  }, [recommendations, debouncedSearch, category, price, minRating, sort]);

  const fetchRecommendations = useCallback(
    async (forceRefresh = false) => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = getCachedRecommendations(session.user.id);
        if (cached) {
          setRecommendations(cached.recommendations);
          setStats(cached.stats);
          setIsCached(true);
          setIsLoading(false);
          toast.success("Loaded cached recommendations", {
            description: "Showing previously generated recommendations",
          });
          return;
        }
      }

      setIsCached(false);
      setIsLoading(true);
      setError(null);
      setRecommendations([]); // Clear previous recommendations

      try {
        if (USE_LOCAL_DATA) {
          // Simulate API delay for realistic loading experience
          await new Promise((resolve) => setTimeout(resolve, 800));

          setRecommendations(
            sampleRecommendations.recommendations as ProductRecommendation[]
          );
          setStats({
            totalFiltered: sampleRecommendations.totalFiltered,
            totalProducts: sampleRecommendations.totalProducts,
          });
          setIsLoading(false);
        } else {
          const response = await fetch("/api/recommendations", {
            method: "POST",
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error || "Failed to fetch recommendations"
            );
          }

          // Handle streaming response
          setIsStreaming(true);
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            throw new Error("No response body");
          }

          let buffer = "";
          const tempRecommendations: ProductRecommendation[] = [];
          let currentStats = { totalFiltered: 0, totalProducts: 0 };

          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");

            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);

                if (data === "[DONE]") {
                  console.log("Streaming complete");
                  setIsLoading(false);
                  setIsStreaming(false);
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  console.log("Received message:", parsed.type);

                  if (parsed.type === "metadata") {
                    currentStats = {
                      totalFiltered: parsed.totalFiltered,
                      totalProducts: parsed.totalProducts,
                    };
                    setStats(currentStats);
                  } else if (parsed.type === "recommendation") {
                    console.log(
                      `Received recommendation #${
                        tempRecommendations.length + 1
                      }: ${parsed.data.product.name}`
                    );
                    tempRecommendations.push(parsed.data);
                    // Update recommendations incrementally
                    setRecommendations([...tempRecommendations]);
                    setIsLoading(false); // Show UI as soon as first recommendation arrives
                  } else if (parsed.type === "error") {
                    throw new Error(parsed.error);
                  }
                } catch (parseError) {
                  console.error("Parse error:", parseError);
                }
              }
            }
          }

          // Cache the final recommendations
          if (session?.user?.id && tempRecommendations.length > 0) {
            setCachedRecommendations(
              session.user.id,
              tempRecommendations,
              currentStats
            );
          }
        }
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError(err instanceof Error ? err.message : String(err));
        toast.error("Failed to load recommendations", {
          description: err instanceof Error ? err.message : String(err),
        });
        setIsLoading(false);
        setIsStreaming(false);
      }
    },
    [session?.user?.id]
  );

  useEffect(() => {
    // Prevent duplicate calls in React 18 Strict Mode
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    fetchRecommendations();
  }, [fetchRecommendations]);

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Recommended For You</h1>
          </div>
          <p className="text-muted-foreground">
            Loading personalized product recommendations...
          </p>
          <div className="flex gap-4 mt-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3 space-y-5 lg:sticky lg:top-24 self-start border-r pr-5">
            {/* Search Filter Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Category Filter Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Price Filter Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>

            {/* Rating Filter Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>

            <Separator />

            {/* Sort Filter Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          </aside>

          <section className="lg:col-span-9">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="border rounded-lg overflow-hidden flex flex-col"
                >
                  <Skeleton className="h-56 w-full" />
                  <div className="pt-4 pb-4 px-4 space-y-3 flex-1">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-5 w-24" />
                    </div>
                    {/* Accordion skeleton */}
                    <Skeleton className="h-10 w-full" />
                    <div className="flex flex-wrap gap-1.5">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            Unable to Load Recommendations
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => fetchRecommendations(true)}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            No Recommendations Available
          </h2>
          <p className="text-muted-foreground mb-6">
            We could not find any products matching your preferences.
          </p>
          <Button onClick={() => (window.location.href = "/products")}>
            Browse All Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Recommended For You</h1>
        </div>
        <p className="text-muted-foreground">
          Personalized product recommendations based on your preferences (
          {filtered.length} items)
        </p>
        <div className="flex gap-4 mt-4 items-center">
          <Badge variant="secondary">
            <TrendingUp className="h-3 w-3 mr-1" />
            {filtered.length} of {recommendations.length} Products
          </Badge>
          <Badge variant="outline">
            AI Filtered from {stats.totalFiltered} matches
          </Badge>
          {isCached && (
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
              Cached
            </Badge>
          )}
          {isStreaming && (
            <Badge
              variant="secondary"
              className="bg-green-500/10 text-green-600 animate-pulse"
            >
              🔴 Live Streaming
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 space-y-5 lg:sticky lg:top-24 self-start border-r pr-5">
          <SearchFilter value={searchInput} onChange={setSearchInput} />
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
        </aside>

        <section className="lg:col-span-9">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((rec, _index) => {
              // Find original index in recommendations for rank badge
              const originalIndex = recommendations.findIndex(
                (r) => r.product.id === rec.product.id
              );
              return (
                <ProductCard
                  key={rec.product.id}
                  product={rec.product}
                  rank={originalIndex + 1}
                  relevanceScore={rec.relevanceScore}
                  explanation={rec.explanation}
                  matchReasons={rec.matchReasons}
                  variant="recommendation"
                />
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Products Found</h2>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters to see more products.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput("");
                  setCategory("all");
                  setPrice([minPrice, maxPrice]);
                  setMinRating(0);
                  setSort("relevance");
                }}
              >
                Clear All Filters
              </Button>
            </div>
          )}

          <div className="mt-8 text-center flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => fetchRecommendations(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate New Recommendations
            </Button>
            {isCached && (
              <Button
                variant="ghost"
                onClick={() => {
                  clearCachedRecommendations();
                  setIsCached(false);
                  toast.info("Cache cleared");
                }}
                size="sm"
              >
                Clear Cache
              </Button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
