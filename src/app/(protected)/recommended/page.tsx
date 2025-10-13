"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Button,
  Badge,
  Skeleton,
} from "@/components/ui";
import { Star, ShoppingCart, Sparkles, Info, TrendingUp } from "lucide-react";
import Image from "next/image";
import { ProductRecommendation } from "@/types/recommendation";
import { toast } from "sonner";

export default function CustomizedProductsPage() {
  const [recommendations, setRecommendations] = useState<
    ProductRecommendation[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalFiltered: 0, totalProducts: 0 });

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recommendations", { method: "POST" });

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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-48 w-full rounded-lg" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Recommended For You</h1>
        </div>
        <p className="text-muted-foreground">
          Personalized product recommendations based on your preferences
        </p>
        <div className="flex gap-4 mt-4">
          <Badge variant="secondary">
            <TrendingUp className="h-3 w-3 mr-1" />
            {recommendations.length} Products
          </Badge>
          <Badge variant="outline">
            Filtered from {stats.totalFiltered} matches
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((rec, index) => (
          <Card
            key={rec.product.id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <CardHeader className="p-0 relative">
              <div className="absolute top-2 left-2 z-10 flex gap-2">
                <Badge className="bg-primary/90 backdrop-blur-sm">
                  #{index + 1}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-secondary/90 backdrop-blur-sm"
                >
                  {rec.relevanceScore}% Match
                </Badge>
              </div>
              <div className="relative h-48 w-full">
                <Image
                  src={rec.product.image}
                  alt={rec.product.name}
                  fill
                  className="object-cover"
                />
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-3">
              <div>
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
              </div>

              <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary mb-1">
                      Why we recommend this:
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {rec.explanation}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {rec.matchReasons.map((reason, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs font-normal"
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
        ))}
      </div>

      <div className="mt-8 text-center">
        <Button variant="outline" onClick={fetchRecommendations}>
          <Sparkles className="h-4 w-4 mr-2" />
          Refresh Recommendations
        </Button>
      </div>
    </div>
  );
}
