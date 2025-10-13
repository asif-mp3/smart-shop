"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Button,
  Badge,
  Skeleton,
  Separator,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui";
import { Star, ShoppingCart, Sparkles, Info, TrendingUp } from "lucide-react";
import Image from "next/image";
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
import sampleRecommendations from "@/data/sample-recommendations.json";

// Toggle this to switch between local data and API
const USE_LOCAL_DATA = true;

export default function RecommendedProductsPage() {
  const [recommendations, setRecommendations] = useState<
    ProductRecommendation[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalFiltered: 0, totalProducts: 0 });

  // Filter states
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [price, setPrice] = useState<[number, number]>([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<SortOption>("relevance");

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
    if (search) {
      const searchLower = search.toLowerCase();
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
  }, [recommendations, search, category, price, minRating, sort]);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);

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
      } else {
        const response = await fetch("/api/recommendations", {
          method: "POST",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch recommendations");
        }

        const data = await response.json();
        console.log(data);
        setRecommendations(data.recommendations);
        setStats({
          totalFiltered: data.totalFiltered,
          totalProducts: data.totalProducts,
        });
      }
    } catch (err: any) {
      console.error("Error fetching recommendations:", err);
      setError(err.message);
      toast.error("Failed to load recommendations", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

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
                <Card key={i} className="overflow-hidden flex flex-col">
                  <Skeleton className="h-56 w-full" />
                  <CardContent className="pt-4 space-y-3 flex-1">
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
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
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
          <Button onClick={fetchRecommendations}>Try Again</Button>
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
        <div className="flex gap-4 mt-4">
          <Badge variant="secondary">
            <TrendingUp className="h-3 w-3 mr-1" />
            {filtered.length} of {recommendations.length} Products
          </Badge>
          <Badge variant="outline">
            AI Filtered from {stats.totalFiltered} matches
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 space-y-5 lg:sticky lg:top-24 self-start border-r pr-5">
          <SearchFilter value={search} onChange={setSearch} />
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
                <Card
                  key={rec.product.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col pt-0"
                >
                  <div className="relative">
                    <div className="absolute top-2 left-2 z-10 flex gap-2">
                      <Badge className="bg-primary/90 backdrop-blur-sm">
                        #{originalIndex + 1}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-secondary/90 backdrop-blur-sm"
                      >
                        {rec.relevanceScore}% Match
                      </Badge>
                    </div>
                    <div className="relative h-56 w-full">
                      <Image
                        src={rec.product.image}
                        alt={rec.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <CardContent className="pt-4 space-y-3 flex-1 px-0">
                    <div className="px-4">
                      <h3 className="font-semibold text-lg mb-1">
                        {rec.product.name}
                      </h3>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-primary">
                          ${rec.product.price}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {rec.product.rating}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="mb-2">
                        {rec.product.category}
                      </Badge>
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem
                          value="explanation"
                          className="border-none"
                        >
                          <AccordionTrigger className="py-2 hover:no-underline">
                            <div className="flex items-center gap-2 text-sm font-medium text-primary">
                              <Info className="h-4 w-4" />
                              Why we recommend this
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-3">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {rec.explanation}
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>

                    <div className="flex flex-wrap justify-start space-y-1">
                      {rec.matchReasons.map((reason, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs font-normal scale-90"
                        >
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button className="w-full">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
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
                  setSearch("");
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

          <div className="mt-8 text-center">
            <Button variant="outline" onClick={fetchRecommendations}>
              <Sparkles className="h-4 w-4 mr-2" />
              Refresh Recommendations
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
