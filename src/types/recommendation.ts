import { z } from "zod";

// Product type from products.json
export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  inStock: boolean;
  image: string;
}

// Recommendation with LLM explanation
export interface ProductRecommendation {
  product: Product;
  explanation: string;
  relevanceScore: number;
  matchReasons: string[];
}

// Zod schema for LLM structured output
export const RecommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      productId: z.string(),
      explanation: z.string(),
      relevanceScore: z.number().min(0).max(100),
      matchReasons: z.array(z.string()),
    })
  ),
});

export type RecommendationResponse = z.infer<typeof RecommendationSchema>;
