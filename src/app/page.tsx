"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { Button, Badge, Input, Separator, Textarea } from "@/components/ui";
import {
  Search,
  Star,
  Sparkles,
  TrendingUp,
  Filter,
  X,
  Download,
  TestTube,
} from "lucide-react";
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
import { ProductRecommendation } from "@/types/recommendation";
import { toast } from "sonner";
import Image from "next/image";
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

  // Test recommendations state
  const [showTestSection, setShowTestSection] = useState(true);
  const [testRecommendations, setTestRecommendations] = useState<
    ProductRecommendation[]
  >([]);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [isTestStreaming, setIsTestStreaming] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [testStats, setTestStats] = useState({
    totalFiltered: 0,
    totalProducts: 0,
  });
  const [productsJson, setProductsJson] = useState("");
  const [userPreferencesJson, setUserPreferencesJson] = useState("");

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

  const saveSearchTerm = useCallback(
    async (term: string) => {
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
          const updated = [
            term.trim(),
            ...prev.filter((s) => s !== term.trim()),
          ];
          return updated.slice(0, 5);
        });
      } catch (error) {
        console.error("Failed to save search term:", error);
      }
    },
    [session?.user]
  );

  // Save search term to history only after user stops typing
  useEffect(() => {
    if (debouncedSearch.trim() && session?.user) {
      saveSearchTerm(debouncedSearch);
    }
  }, [debouncedSearch, saveSearchTerm, session?.user]);

  const handleSearch = (term: string) => {
    setSearchInput(term);
  };

  // Test recommendations functions
  const loadSampleData = () => {
    setProductsJson(JSON.stringify(products, null, 2));

    const sampleUserProfile = {
      name: "Alex Johnson",
      gender: "male",
      dateOfBirth: "1990-05-15",
      favoriteCategories: ["Electronics", "Sports & Outdoors"],
      priceRange: "mid-range",
      shoppingFrequency: "weekly",
      interests: ["technology", "fitness", "gaming"],
      lifestyle: "active",
      address: {
        city: "San Francisco",
        country: "USA",
      },
      searchHistory: ["wireless headphones", "fitness tracker", "gaming mouse"],
    };

    setUserPreferencesJson(JSON.stringify(sampleUserProfile, null, 2));

    toast.success("Sample data loaded", {
      description: "Products and user preferences have been populated",
    });
  };

  const validateJson = (jsonString: string, fieldName: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (fieldName === "products" && !Array.isArray(parsed)) {
        toast.error(`Invalid ${fieldName}`, {
          description: "Products must be an array",
        });
        return false;
      }
      return true;
    } catch (error) {
      toast.error(`Invalid ${fieldName} JSON`, {
        description: error instanceof Error ? error.message : "Parse error",
      });
      return false;
    }
  };

  const generateTestRecommendations = async () => {
    if (!productsJson.trim() || !userPreferencesJson.trim()) {
      toast.error("Missing data", {
        description:
          "Please provide both products JSON and user preferences JSON",
      });
      return;
    }

    if (
      !validateJson(productsJson, "products") ||
      !validateJson(userPreferencesJson, "user preferences")
    ) {
      return;
    }

    setIsTestLoading(true);
    setIsTestStreaming(false);
    setTestError(null);
    setTestRecommendations([]);

    try {
      const response = await fetch("/api/test-recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productsJson,
          userPreferencesJson,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch recommendations");
      }

      setIsTestStreaming(true);
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

        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              setIsTestLoading(false);
              setIsTestStreaming(false);
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === "metadata") {
                currentStats = {
                  totalFiltered: parsed.totalFiltered,
                  totalProducts: parsed.totalProducts,
                };
                setTestStats(currentStats);
              } else if (parsed.type === "recommendation") {
                tempRecommendations.push(parsed.data);
                setTestRecommendations([...tempRecommendations]);
                setIsTestLoading(false);
              } else if (parsed.type === "error") {
                throw new Error(parsed.error);
              }
            } catch (parseError) {
              console.error("Parse error:", parseError);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error generating test recommendations:", err);
      setTestError(err instanceof Error ? err.message : String(err));
      toast.error("Failed to generate recommendations", {
        description: err instanceof Error ? err.message : String(err),
      });
      setIsTestLoading(false);
      setIsTestStreaming(false);
    }
  };

  const clearTestData = () => {
    setProductsJson("");
    setUserPreferencesJson("");
    setTestRecommendations([]);
    setTestStats({ totalFiltered: 0, totalProducts: 0 });
    setTestError(null);
    toast.info("Test data cleared");
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

        {/* Test Recommendations Section */}
        <section className="bg-muted/30 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TestTube className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">
                    Test LLM Recommendations
                  </h2>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowTestSection(!showTestSection)}
                >
                  {showTestSection ? "Hide" : "Show"} Test Panel
                </Button>
              </div>

              {showTestSection && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Input Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Input Data</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadSampleData}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Load Sample
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearTestData}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Products JSON
                        </label>
                        <Textarea
                          value={productsJson}
                          onChange={(e) => setProductsJson(e.target.value)}
                          placeholder="Paste your products JSON here..."
                          className="h-[150px] font-mono text-sm resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          User Preferences JSON
                        </label>
                        <Textarea
                          value={userPreferencesJson}
                          onChange={(e) =>
                            setUserPreferencesJson(e.target.value)
                          }
                          placeholder="Paste your user preferences JSON here..."
                          className="min-h-[150px] font-mono text-sm"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={generateTestRecommendations}
                      disabled={
                        isTestLoading ||
                        !productsJson.trim() ||
                        !userPreferencesJson.trim()
                      }
                      className="w-full"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {isTestLoading
                        ? "Generating..."
                        : "Generate Recommendations"}
                    </Button>
                  </div>

                  {/* Results Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Test Results</h3>
                      {testRecommendations.length > 0 && (
                        <div className="flex gap-2">
                          <Badge variant="secondary">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {testRecommendations.length} Recommendations
                          </Badge>
                          {testStats.totalFiltered > 0 && (
                            <Badge variant="outline">
                              From {testStats.totalFiltered} filtered
                            </Badge>
                          )}
                          {isTestStreaming && (
                            <Badge
                              variant="secondary"
                              className="bg-green-500/10 text-green-600 animate-pulse"
                            >
                              🔴 Live
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {isTestLoading && testRecommendations.length === 0 && (
                      <div className="text-center py-8">
                        <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
                        <p className="text-muted-foreground text-sm">
                          Generating recommendations...
                        </p>
                      </div>
                    )}

                    {testError && (
                      <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-1 text-sm">
                          Error
                        </h4>
                        <p className="text-red-700 text-xs">{testError}</p>
                      </div>
                    )}

                    {testRecommendations.length > 0 && (
                      <div className="space-y-3 h-[320px] overflow-y-auto">
                        {testRecommendations.map((rec, index) => (
                          <div
                            key={rec.product.id}
                            className="border rounded-lg p-3 bg-background"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <Badge variant="outline" className="text-xs">
                                  #{index + 1}
                                </Badge>
                              </div>
                              <div className="flex gap-3 flex-1 min-w-0">
                                {/* Product Image */}
                                <div className="flex-shrink-0">
                                  <div className="w-16 h-16 rounded-md overflow-hidden bg-muted relative">
                                    <Image
                                      src={rec.product.image}
                                      alt={rec.product.name}
                                      fill
                                      className="object-cover"
                                      onError={(e) => {
                                        const target =
                                          e.target as HTMLImageElement;
                                        target.src = "/placeholder-product.jpg";
                                      }}
                                    />
                                  </div>
                                </div>

                                {/* Product Details */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm truncate">
                                    {rec.product.name}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {rec.explanation}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Score: {rec.relevanceScore}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      ${rec.product.price}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      ⭐ {rec.product.rating}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!isTestLoading &&
                      testRecommendations.length === 0 &&
                      !testError && (
                        <div className="text-center py-8 text-muted-foreground">
                          <TestTube className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">
                            No test results yet. Generate some to see
                            recommendations here.
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              )}
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
