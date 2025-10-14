import { NextRequest, NextResponse } from "next/server";
import productsData from "@/data/products.json";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, limit = 8 } = body as {
      productId?: string;
      limit?: number;
    };

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    const products: Product[] = productsData as Product[];
    const current = products.find((p) => p.id === productId);
    if (!current) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Simple content-based recommendation: category match, price proximity, text similarity
    const candidates = products.filter((p) => p.id !== current.id && p.inStock);

    const scored = candidates.map((p) => {
      let score = 0;
      // Category match weight
      if (p.category === current.category) score += 5;
      // Price proximity (closer is better)
      const priceDiff = Math.abs(p.price - current.price);
      score += Math.max(0, 3 - priceDiff / Math.max(1, current.price * 0.25)); // up to ~3 points
      // Rating influence
      score += (p.rating / 5) * 1.5; // up to 1.5
      // Textual overlap (name + description)
      const overlap = jaccardSimilarity(
        tokenize(current.name + " " + current.description),
        tokenize(p.name + " " + p.description)
      );
      score += overlap * 2; // up to 2
      return { product: p, score };
    });

    const recommendations = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(1, Math.min(20, Number(limit))))
      .map((s) => s.product);

    return NextResponse.json({ data: recommendations });
  } catch (error) {
    console.error("product recommendations error", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}

function tokenize(text: string): Set<string> {
  return new Set(
    (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
