"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import productsData from "@/data/products.json";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Separator,
} from "@/components/ui";
import { Star, ArrowLeft, ShoppingCart, Tag } from "lucide-react";
import { ProductCard } from "@/components/cards";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  rating: number;
  inStock: boolean;
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const product: Product | undefined = (productsData as Product[]).find(
    (p) => p.id === params.id
  );

  if (!product) {
    notFound();
  }

  const [recommendations, setRecommendations] = useState<Product[]>([]);

  useEffect(() => {
    async function fetchRecs() {
      try {
        const res = await fetch(`/api/recommendations/product`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: params.id, limit: 8 }),
        });
        const json = await res.json();
        setRecommendations(json.data || []);
      } catch (e) {
        console.error("Failed to load recommendations", e);
      }
    }
    fetchRecs();
    // Log view interaction (non-blocking)
    fetch(`/api/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: params.id, type: "view" }),
    }).catch(() => {});
  }, [params.id]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <Card className="overflow-hidden">
            <div className="relative aspect-square bg-muted">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl md:text-3xl">
                    {product.name}
                  </CardTitle>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Tag className="h-3.5 w-3.5" /> {product.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{product.rating}</span>
                    </div>
                  </div>
                </div>
                <Badge
                  className={product.inStock ? "bg-green-500" : "bg-red-500"}
                >
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-3xl font-bold">
                  ${product.price.toFixed(2)}
                </div>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  disabled={!product.inStock}
                  className="sm:w-auto w-full"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {product.inStock ? "Add to Cart" : "Out of Stock"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">You may also like</h2>
            <span className="text-sm text-muted-foreground">
              Based on <pre>{product.name}</pre>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {recommendations.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                showStock
                variant="recommendation"
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
