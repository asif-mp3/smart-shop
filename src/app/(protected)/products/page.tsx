"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Separator,
} from "@/components/ui";
import { Star, ShoppingCart } from "lucide-react";
import productsData from "@/data/products.json";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  CategoryFilter,
  PriceFilter,
  RatingFilter,
  SearchFilter,
  SortFilter,
  StockFilter,
} from "@/components/filters";

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

export default function ProductsPage() {
  const products: Product[] = productsData;

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products]
  );
  const minPrice = useMemo(
    () => Math.min(...products.map((p) => p.price)),
    [products]
  );
  const maxPrice = useMemo(
    () => Math.max(...products.map((p) => p.price)),
    [products]
  );

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState<[number, number]>([minPrice, maxPrice]);
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sort, setSort] = useState<
    | "relevance"
    | "price-asc"
    | "price-desc"
    | "rating-desc"
    | "name-asc"
    | "name-desc"
  >("relevance");

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    let list = products.filter((p) => {
      const matchesSearch = normalizedSearch
        ? [p.name, p.description, p.category]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch)
        : true;
      const matchesCategory = category ? p.category === category : true;
      const matchesPrice = p.price >= price[0] && p.price <= price[1];
      const matchesRating = p.rating >= minRating;
      const matchesStock = inStockOnly ? p.inStock : true;
      return (
        matchesSearch &&
        matchesCategory &&
        matchesPrice &&
        matchesRating &&
        matchesStock
      );
    });

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
  }, [products, search, category, price, minRating, inStockOnly, sort]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">All Products</h1>
        <p className="text-muted-foreground">
          Discover our wide range of products ({filtered.length} items)
        </p>
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
          <StockFilter value={inStockOnly} onChange={setInStockOnly} />
          <Separator />
          <SortFilter value={sort} onChange={setSort} />
        </aside>

        <section className="lg:col-span-9">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
            {filtered.map((product) => (
              <Card
                key={product.id}
                className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                  />
                  <Badge className="absolute top-2 right-2 bg-background/90 text-foreground">
                    {product.category}
                  </Badge>
                </div>

                <CardHeader className="flex-grow">
                  <CardTitle className="line-clamp-1 text-base">
                    {product.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {product.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      ${product.price.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {product.rating}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button className="w-full" disabled={!product.inStock}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {product.inStock ? "Add to Cart" : "Out of Stock"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
