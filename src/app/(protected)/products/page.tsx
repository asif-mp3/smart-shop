"use client";

import { Separator } from "@/components/ui";
import productsData from "@/data/products.json";
import { useMemo, useState } from "react";
import {
  CategoryFilter,
  PriceFilter,
  RatingFilter,
  SearchFilter,
  SortFilter,
  StockFilter,
  SortOption,
} from "@/components/filters";
import { ProductCard } from "@/components/cards";
import { useDebounce } from "@/hooks";

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

  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState<[number, number]>([minPrice, maxPrice]);
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sort, setSort] = useState<SortOption>("relevance");

  // Debounce search input
  const debouncedSearch = useDebounce(searchInput, 500);

  const filtered = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase();

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
  }, [
    products,
    debouncedSearch,
    category,
    price,
    minRating,
    inStockOnly,
    sort,
  ]);

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
          <StockFilter value={inStockOnly} onChange={setInStockOnly} />
          <Separator />
          <SortFilter value={sort} onChange={setSort} />
        </aside>

        <section className="lg:col-span-9">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showStock={true}
                variant="default"
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
