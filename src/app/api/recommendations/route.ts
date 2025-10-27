import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAuth } from "@/lib/auth";
import { dbPromise } from "@/lib/db";
import { headers } from "next/headers";
import productsData from "@/data/products.json";
import { Product, RecommendationSchema } from "@/types/recommendation";
import { UserProfile } from "@/types/user-profile";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(_req: NextRequest) {
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
      userProfile as unknown as UserProfile
    );

    console.log(
      `Filtered ${productsData.length} products down to ${filteredProducts.length} based on user preferences`
    );

    // Step 2: Stream recommendations from Gemini
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial metadata
          const metadata = {
            type: "metadata",
            totalFiltered: filteredProducts.length,
            totalProducts: productsData.length,
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`)
          );

          // Stream recommendations
          await streamRecommendations(
            filteredProducts,
            userProfile as unknown as UserProfile,
            session.user,
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
    console.error("Error generating recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}

function filterProductsByUserPreferences(
  products: Product[],
  userProfile: UserProfile
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

async function streamRecommendations(
  products: Product[],
  userProfile: UserProfile,
  user: { name?: string; email?: string },
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
- Recent Search History: ${
    userProfile.searchHistory?.length
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

  console.log("Starting to stream recommendations...");

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    accumulatedText += chunkText;

    console.log(
      `Received chunk (${chunkText.length} chars), total: ${accumulatedText.length}`
    );

    // Try to extract individual recommendation objects as they become complete
    // Look for the recommendations array
    const arrayStartMatch = accumulatedText.match(/"recommendations"\s*:\s*\[/);

    if (arrayStartMatch) {
      // Get content after the array start
      const afterArrayStart = accumulatedText.slice(
        arrayStartMatch.index! + arrayStartMatch[0].length
      );

      // Try to extract complete recommendation objects
      // This regex matches complete JSON objects with proper nesting
      const objectRegex = /\{(?:[^{}]|\{[^{}]*\})*\}/g;
      const matches = [...afterArrayStart.matchAll(objectRegex)];

      if (matches.length > sentRecommendations) {
        console.log(
          `Found ${matches.length} complete objects, already sent ${sentRecommendations}`
        );

        // Process only new recommendations
        for (let i = sentRecommendations; i < matches.length; i++) {
          try {
            const recJson = matches[i][0];
            const rec = JSON.parse(recJson);

            // Validate the recommendation has required fields
            if (
              rec.productId &&
              rec.explanation &&
              typeof rec.relevanceScore === "number" &&
              Array.isArray(rec.matchReasons)
            ) {
              const product = products.find((p) => p.id === rec.productId);

              if (product) {
                console.log(
                  `✅ Streaming recommendation #${sentRecommendations + 1}: ${
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
          } catch (parseError) {
            // Individual recommendation not yet complete, skip
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

  // Final parsing attempt for any remaining recommendations that weren't caught
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
            `Final pass - sending recommendation #${i + 1}: ${product.name}`
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
    `Streaming finished. Total recommendations sent: ${sentRecommendations}`
  );
}

// async function generateRecommendations(
//   products: Product[],
//   userProfile: UserProfile,
//   user: { name?: string; email?: string }
// ) {
//   const model = genAI.getGenerativeModel({
//     model: "gemini-2.5-flash",
//     generationConfig: {
//       temperature: 0.7,
//       topP: 0.9,
//       topK: 40,
//     },
//   });

//   const prompt = `You are an expert e-commerce product recommendation assistant for ShopSmart.

// **User Profile:**
// - Name: ${user.name}
// - Gender: ${userProfile.gender || "Not specified"}
// - Age Group: ${calculateAgeGroup(userProfile.dateOfBirth)}
// - Favorite Categories: ${userProfile.favoriteCategories?.join(", ") || "None"}
// - Price Range Preference: ${userProfile.priceRange || "Not specified"}
// - Shopping Frequency: ${userProfile.shoppingFrequency || "Not specified"}
// - Interests: ${userProfile.interests?.join(", ") || "None"}
// - Lifestyle: ${userProfile.lifestyle || "Not specified"}
// - Location: ${userProfile.address?.city || "Not specified"}, ${
//     userProfile.address?.country || "Not specified"
//   }
// - Recent Search History: ${
//     userProfile.searchHistory?.length
//       ? userProfile.searchHistory.join(", ")
//       : "None"
//   }

// **Available Products (${products.length} items):**
// ${products
//   .map(
//     (p, idx) =>
//       `${idx + 1}. ID: ${p.id}
//    Name: ${p.name}
//    Category: ${p.category}
//    Price: $${p.price}
//    Rating: ${p.rating}/5 (${p.reviews} reviews)
//    Description: ${p.description}`
//   )
//   .join("\n\n")}

// **Task:**
// Analyze the user's profile and recommend the TOP 10-15 most relevant products from the list above.

// For each recommendation, provide:
// 1. Product ID
// 2. A personalized explanation (2-3 sentences) of WHY this product is perfect for THIS specific user
// 3. Relevance score (0-100) based on how well it matches the user's profile
// 4. 2-4 specific match reasons (e.g., "Matches fitness interest", "Within preferred price range")

// **Important Guidelines:**
// - Prioritize products that match the user's favorite categories
// - Consider the user's lifestyle, interests, and shopping habits
// - Pay attention to their recent search history - recommend products related to what they've been searching for
// - Ensure price recommendations align with their budget preference
// - Provide genuine, personalized explanations - not generic descriptions
// - Rank by relevance score (highest first)

// Return your response in this exact JSON format:
// {
//   "recommendations": [
//     {
//       "productId": "string",
//       "explanation": "string",
//       "relevanceScore": number,
//       "matchReasons": ["string", "string", "string"]
//     }
//   ]
// }`;

//   const result = await model.generateContent(prompt);
//   const response = result.response;
//   const text = response.text();

//   // Parse JSON from response
//   const jsonMatch = text.match(/\{[\s\S]*\}/);
//   if (!jsonMatch) {
//     throw new Error("Failed to parse LLM response");
//   }

//   const parsed = JSON.parse(jsonMatch[0]);
//   const validated = RecommendationSchema.parse(parsed);

//   // Map product IDs to full product objects
//   const recommendations = validated.recommendations
//     .map((rec) => {
//       const product = products.find((p) => p.id === rec.productId);
//       if (!product) return null;

//       return {
//         product,
//         explanation: rec.explanation,
//         relevanceScore: rec.relevanceScore,
//         matchReasons: rec.matchReasons,
//       };
//     })
//     .filter((rec) => rec !== null);

//   return recommendations;
// }

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
