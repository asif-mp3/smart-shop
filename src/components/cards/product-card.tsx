"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Star, ShoppingCart, Info, Link2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  Button,
  Badge,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  rating: number;
  inStock: boolean;
}

export interface ProductCardProps {
  product: Product;
  rank?: number;
  relevanceScore?: number;
  explanation?: string;
  matchReasons?: string[];
  showStock?: boolean;
  variant?: "default" | "recommendation";
}

export function ProductCard({
  product,
  rank,
  relevanceScore,
  explanation,
  matchReasons,
  showStock = true,
  variant = "default",
}: ProductCardProps) {
  const isRecommendation = variant === "recommendation";
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [addToCartCount, setAddToCartCount] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/interactions/stats?productId=${product.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!ignore && data && typeof data.addToCartCount === "number") {
          setAddToCartCount(data.addToCartCount);
        }
      })
      .catch(() => {})
      .finally(() => {});
    return () => {
      ignore = true;
    };
  }, [product.id]);

  return (
    <Card
      className="relative overflow-hidden hover:shadow-lg transition-shadow flex flex-col group pt-0 cursor-pointer"
      onClick={() => router.push(`/products/${product.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ")
          router.push(`/products/${product.id}`);
      }}
    >
      <div className="relative">
        {/* Badges on top of image */}
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          {rank && (
            <Badge className="bg-primary/90 backdrop-blur-sm">#{rank}</Badge>
          )}
          {relevanceScore && (
            <Badge
              variant="secondary"
              className="bg-secondary/90 backdrop-blur-sm"
            >
              {relevanceScore}% Match
            </Badge>
          )}
          {showStock && !isRecommendation && (
            <Badge
              className={`absolute top-0 right-0 ${
                product.inStock ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {product.inStock ? "In Stock" : "Out of Stock"}
            </Badge>
          )}
        </div>

        {/* Product Image */}
        <div className="relative h-56 w-full overflow-hidden block">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>

      <CardContent className="pt-4 space-y-3 flex-1 flex flex-col relative z-10">
        <div className="flex-1">
          {/* Product Name */}
          <div className="font-semibold text-lg mb-1 line-clamp-2">
            {product.name}
          </div>

          {/* Description (only for non-recommendation cards) */}
          {!isRecommendation && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {product.description}
            </p>
          )}

          {/* Price and Rating */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold text-primary">
              ${product.price.toFixed(2)}
            </span>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{product.rating}</span>
            </div>
          </div>

          {/* Category Badge */}
          <Badge variant="outline" className="mb-2">
            {product.category}
          </Badge>

          {addToCartCount !== null && addToCartCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Added to cart by {addToCartCount}{" "}
              {addToCartCount === 1 ? "person" : "people"}
            </p>
          )}
        </div>

        {/* AI Explanation (only for recommendation cards) */}
        {isRecommendation && explanation && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="explanation" className="border-none">
              <AccordionTrigger className="py-2 hover:no-underline">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Info className="h-4 w-4" />
                  Why we recommend this
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {explanation}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Match Reasons (only for recommendation cards) */}
        {isRecommendation && matchReasons && matchReasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {matchReasons.map((reason, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="text-xs font-normal"
              >
                {reason}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="relative z-10 flex gap-2">
        <Button
          className="w-1/2"
          disabled={!product.inStock || isAdding}
          onClick={(e) => {
            e.stopPropagation();
            if (isAdded) return;
            setIsAdding(true);
            // Log add_to_cart interaction (best-effort)
            fetch(`/api/interactions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId: product.id,
                type: "add_to_cart",
              }),
            })
              .then(() => {
                setIsAdded(true);
                toast.success("Added to cart", {
                  description: product.name,
                });
              })
              .catch(() => {
                toast.error("Failed to add to cart");
              })
              .finally(() => setIsAdding(false));
          }}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {!product.inStock
            ? "Out of Stock"
            : isAdding
            ? "Adding..."
            : isAdded
            ? "Added"
            : "Add to Cart"}
        </Button>
        <Button
          variant="secondary"
          className="w-1/2"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/products/${product.id}`);
          }}
        >
          <Link2 className="h-4 w-4 mr-2" />
          Visit
        </Button>
      </CardFooter>
    </Card>
  );
}
