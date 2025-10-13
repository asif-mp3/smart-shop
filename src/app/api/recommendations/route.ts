import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAuth } from "@/lib/auth";
import { dbPromise } from "@/lib/db";
import { headers } from "next/headers";
import productsData from "@/data/products.json";
import { Product, RecommendationSchema } from "@/types/recommendation";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user profile
    const db = await dbPromise;
    const userProfile = await db.collection("userProfiles").findOne({ userId });

    if (!userProfile || !userProfile.onboardingCompleted) {
      return NextResponse.json(
        { error: "Please complete onboarding first" },
        { status: 400 }
      );
    }

    // Step 1: Filter products based on user preferences
    const filteredProducts = filterProductsByUserPreferences(
      productsData as Product[],
      userProfile
    );

    console.log(
      `Filtered ${productsData.length} products down to ${filteredProducts.length} based on user preferences`
    );

    // Step 2: Use Gemini to rank and explain recommendations
    const recommendations = await generateRecommendations(
      filteredProducts,
      userProfile,
      session.user
    );

    return NextResponse.json({
      recommendations,
      totalFiltered: filteredProducts.length,
      totalProducts: productsData.length,
    });
  } catch (error: any) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}

function filterProductsByUserPreferences(
  products: Product[],
  userProfile: any
): Product[] {
  let filtered = products;

  // Filter by favorite categories
  if (userProfile.favoriteCategories?.length > 0) {
    filtered = filtered.filter((p) =>
      userProfile.favoriteCategories.includes(p.category)
    );
  }

  // Filter by price range
  if (userProfile.priceRange) {
    const priceRanges: Record<string, [number, number]> = {
      budget: [0, 50],
      "mid-range": [50, 200],
      premium: [200, 500],
      luxury: [500, Infinity],
    };

    const [min, max] = priceRanges[userProfile.priceRange] || [0, Infinity];
    filtered = filtered.filter((p) => p.price >= min && p.price <= max);
  }

  // Filter by in-stock items only
  filtered = filtered.filter((p) => p.inStock);

  // If no products after filtering, return all in-stock products
  if (filtered.length === 0) {
    filtered = products.filter((p) => p.inStock);
  }

  // Limit to top 30 products for LLM processing
  return filtered.slice(0, 30);
}

async function generateRecommendations(
  products: Product[],
  userProfile: any,
  user: any
) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
    },
  });

  const prompt = `You are an expert e-commerce product recommendation assistant for ShopSmart.

**User Profile:**
- Name: ${user.name}
- Gender: ${userProfile.gender || "Not specified"}
- Age Group: ${calculateAgeGroup(userProfile.dateOfBirth)}
- Favorite Categories: ${userProfile.favoriteCategories?.join(", ") || "None"}
- Price Range Preference: ${userProfile.priceRange || "Not specified"}
- Shopping Frequency: ${userProfile.shoppingFrequency || "Not specified"}
- Interests: ${userProfile.interests?.join(", ") || "None"}
- Lifestyle: ${userProfile.lifestyle || "Not specified"}
- Location: ${userProfile.address?.city || "Not specified"}, ${
    userProfile.address?.country || "Not specified"
  }

**Available Products (${products.length} items):**
${products
  .map(
    (p, idx) =>
      `${idx + 1}. ID: ${p.id}
   Name: ${p.name}
   Category: ${p.category}
   Price: $${p.price}
   Rating: ${p.rating}/5 (${p.reviews} reviews)
   Description: ${p.description}`
  )
  .join("\n\n")}

**Task:**
Analyze the user's profile and recommend the TOP 10-15 most relevant products from the list above.

For each recommendation, provide:
1. Product ID
2. A personalized explanation (2-3 sentences) of WHY this product is perfect for THIS specific user
3. Relevance score (0-100) based on how well it matches the user's profile
4. 2-4 specific match reasons (e.g., "Matches fitness interest", "Within preferred price range")

**Important Guidelines:**
- Prioritize products that match the user's favorite categories
- Consider the user's lifestyle, interests, and shopping habits
- Ensure price recommendations align with their budget preference
- Provide genuine, personalized explanations - not generic descriptions
- Rank by relevance score (highest first)

Return your response in this exact JSON format:
{
  "recommendations": [
    {
      "productId": "string",
      "explanation": "string",
      "relevanceScore": number,
      "matchReasons": ["string", "string", "string"]
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse LLM response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const validated = RecommendationSchema.parse(parsed);

  // Map product IDs to full product objects
  const recommendations = validated.recommendations
    .map((rec) => {
      const product = products.find((p) => p.id === rec.productId);
      if (!product) return null;

      return {
        product,
        explanation: rec.explanation,
        relevanceScore: rec.relevanceScore,
        matchReasons: rec.matchReasons,
      };
    })
    .filter((rec) => rec !== null);

  return recommendations;
}

function calculateAgeGroup(dateOfBirth: string | Date | undefined): string {
  if (!dateOfBirth) return "Not specified";

  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();

  if (age < 18) return "Under 18";
  if (age < 25) return "18-24";
  if (age < 35) return "25-34";
  if (age < 45) return "35-44";
  if (age < 55) return "45-54";
  return "55+";
}
