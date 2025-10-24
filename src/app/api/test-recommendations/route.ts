import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Product, RecommendationSchema } from "@/types/recommendation";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productsJson, userPreferencesJson } = body;

    if (!productsJson || !userPreferencesJson) {
      return NextResponse.json(
        { error: "Both products JSON and user preferences JSON are required" },
        { status: 400 }
      );
    }

    let products: Product[];
    let userProfile: Record<string, unknown>;

    try {
      products = JSON.parse(productsJson);
    } catch {
      return NextResponse.json(
        { error: "Invalid products JSON format" },
        { status: 400 }
      );
    }

    try {
      userProfile = JSON.parse(userPreferencesJson);
    } catch {
      return NextResponse.json(
        { error: "Invalid user preferences JSON format" },
        { status: 400 }
      );
    }

    // Validate products structure
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "Products must be a non-empty array" },
        { status: 400 }
      );
    }

    // Filter products based on user preferences (similar to main route)
    const filteredProducts = filterProductsByUserPreferences(
      products,
      userProfile
    );

    console.log(
      `Filtered ${products.length} products down to ${filteredProducts.length} based on user preferences`
    );

    // Stream recommendations from Gemini
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial metadata
          const metadata = {
            type: "metadata",
            totalFiltered: filteredProducts.length,
            totalProducts: products.length,
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`)
          );

          // Stream recommendations
          await streamRecommendations(
            filteredProducts,
            userProfile,
            controller,
            encoder
          );

          // Send completion signal
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          const errorData = {
            type: "error",
            error: error instanceof Error ? error.message : String(error),
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error generating test recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}

function filterProductsByUserPreferences(
  products: Product[],
  userProfile: Record<string, unknown>
): Product[] {
  let filtered = products;

  // Filter by favorite categories
  if (
    Array.isArray(userProfile.favoriteCategories) &&
    userProfile.favoriteCategories.length > 0
  ) {
    filtered = filtered.filter((p) =>
      (userProfile.favoriteCategories as string[]).includes(p.category)
    );
  }

  // Filter by price range
  if (typeof userProfile.priceRange === "string") {
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

async function streamRecommendations(
  products: Product[],
  userProfile: Record<string, unknown>,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
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
- Name: ${(userProfile.name as string) || "Test User"}
- Gender: ${(userProfile.gender as string) || "Not specified"}
- Age Group: ${calculateAgeGroup(userProfile.dateOfBirth as string)}
- Favorite Categories: ${
    Array.isArray(userProfile.favoriteCategories)
      ? userProfile.favoriteCategories.join(", ")
      : "None"
  }
- Price Range Preference: ${
    (userProfile.priceRange as string) || "Not specified"
  }
- Shopping Frequency: ${
    (userProfile.shoppingFrequency as string) || "Not specified"
  }
- Interests: ${
    Array.isArray(userProfile.interests)
      ? userProfile.interests.join(", ")
      : "None"
  }
- Lifestyle: ${(userProfile.lifestyle as string) || "Not specified"}
- Location: ${
    (userProfile.address as Record<string, unknown>)?.city || "Not specified"
  }, ${
    (userProfile.address as Record<string, unknown>)?.country || "Not specified"
  }
- Recent Search History: ${
    Array.isArray(userProfile.searchHistory) && userProfile.searchHistory.length
      ? userProfile.searchHistory.join(", ")
      : "None"
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
- Pay attention to their recent search history - recommend products related to what they've been searching for
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

  const result = await model.generateContentStream(prompt);
  let accumulatedText = "";
  let sentRecommendations = 0;

  console.log("Starting to stream test recommendations...");

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    accumulatedText += chunkText;

    console.log(
      `Received chunk (${chunkText.length} chars), total: ${accumulatedText.length}`
    );

    // Try to extract individual recommendation objects as they become complete
    const arrayStartMatch = accumulatedText.match(/"recommendations"\s*:\s*\[/);

    if (arrayStartMatch) {
      const afterArrayStart = accumulatedText.slice(
        arrayStartMatch.index! + arrayStartMatch[0].length
      );

      const objectRegex = /\{(?:[^{}]|\{[^{}]*\})*\}/g;
      const matches = [...afterArrayStart.matchAll(objectRegex)];

      if (matches.length > sentRecommendations) {
        console.log(
          `Found ${matches.length} complete objects, already sent ${sentRecommendations}`
        );

        for (let i = sentRecommendations; i < matches.length; i++) {
          try {
            const recJson = matches[i][0];
            const rec = JSON.parse(recJson);

            if (
              rec.productId &&
              rec.explanation &&
              typeof rec.relevanceScore === "number" &&
              Array.isArray(rec.matchReasons)
            ) {
              const product = products.find((p) => p.id === rec.productId);

              if (product) {
                console.log(
                  `✅ Streaming test recommendation #${
                    sentRecommendations + 1
                  }: ${product.name}`
                );
                const recommendation = {
                  type: "recommendation",
                  data: {
                    product,
                    explanation: rec.explanation,
                    relevanceScore: rec.relevanceScore,
                    matchReasons: rec.matchReasons,
                  },
                };

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(recommendation)}\n\n`)
                );
                sentRecommendations++;
              }
            }
          } catch (parseError) {
            console.log(
              `⏩ Skipping incomplete object at index ${i}: ${
                parseError instanceof Error ? parseError.message : "Parse error"
              }`
            );
          }
        }
      }
    }
  }

  // Final parsing attempt for any remaining recommendations
  console.log(
    `Stream complete. Sent ${sentRecommendations} recommendations. Checking for missed ones...`
  );

  try {
    const finalJsonMatch = accumulatedText.match(/\{[\s\S]*\}/);
    if (finalJsonMatch) {
      const parsed = JSON.parse(finalJsonMatch[0]);
      const validated = RecommendationSchema.parse(parsed);

      if (validated.recommendations.length > sentRecommendations) {
        console.log(
          `Found ${
            validated.recommendations.length - sentRecommendations
          } missed recommendations, sending now...`
        );
      }

      for (
        let i = sentRecommendations;
        i < validated.recommendations.length;
        i++
      ) {
        const rec = validated.recommendations[i];
        const product = products.find((p) => p.id === rec.productId);

        if (product) {
          console.log(
            `Final pass - sending test recommendation #${i + 1}: ${
              product.name
            }`
          );
          const recommendation = {
            type: "recommendation",
            data: {
              product,
              explanation: rec.explanation,
              relevanceScore: rec.relevanceScore,
              matchReasons: rec.matchReasons,
            },
          };

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(recommendation)}\n\n`)
          );
          sentRecommendations++;
        }
      }
    }
  } catch (error) {
    console.error("Final parsing error:", error);
  }

  console.log(
    `Test streaming finished. Total recommendations sent: ${sentRecommendations}`
  );
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
