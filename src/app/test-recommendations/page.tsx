"use client";

import { useState } from "react";
import { Button, Badge, Textarea } from "@/components/ui";
import { Sparkles, TrendingUp, Download } from "lucide-react";
import { ProductRecommendation } from "@/types/recommendation";
import { toast } from "sonner";
import { ProductCard } from "@/components/cards";
import productsData from "@/data/products.json";

export default function TestRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<
    ProductRecommendation[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalFiltered: 0, totalProducts: 0 });

  const [productsJson, setProductsJson] = useState("");
  const [userPreferencesJson, setUserPreferencesJson] = useState("");

  const loadSampleData = () => {
    // Load sample products
    setProductsJson(JSON.stringify(productsData, null, 2));

    // Load sample user preferences
    const sampleUserProfile = {
      name: "Alex Johnson",
      gender: "male",
      dateOfBirth: "1990-05-15",
      favoriteCategories: ["Electronics", "Sports & Outdoors"],
      priceRange: "mid-range",
      shoppingFrequency: "weekly",
      interests: ["technology", "fitness", "gaming"],
      lifestyle: "active",
      address: {
        city: "San Francisco",
        country: "USA",
      },
      searchHistory: ["wireless headphones", "fitness tracker", "gaming mouse"],
    };

    setUserPreferencesJson(JSON.stringify(sampleUserProfile, null, 2));

    toast.success("Sample data loaded", {
      description: "Products and user preferences have been populated",
    });
  };

  const validateJson = (jsonString: string, fieldName: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (fieldName === "products" && !Array.isArray(parsed)) {
        toast.error(`Invalid ${fieldName}`, {
          description: "Products must be an array",
        });
        return false;
      }
      return true;
    } catch (error) {
      toast.error(`Invalid ${fieldName} JSON`, {
        description: error instanceof Error ? error.message : "Parse error",
      });
      return false;
    }
  };

  const generateRecommendations = async () => {
    if (!productsJson.trim() || !userPreferencesJson.trim()) {
      toast.error("Missing data", {
        description:
          "Please provide both products JSON and user preferences JSON",
      });
      return;
    }

    if (
      !validateJson(productsJson, "products") ||
      !validateJson(userPreferencesJson, "user preferences")
    ) {
      return;
    }

    setIsLoading(true);
    setIsStreaming(false);
    setError(null);
    setRecommendations([]);

    try {
      const response = await fetch("/api/test-recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productsJson,
          userPreferencesJson,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch recommendations");
      }

      // Handle streaming response
      setIsStreaming(true);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let buffer = "";
      const tempRecommendations: ProductRecommendation[] = [];
      let currentStats = { totalFiltered: 0, totalProducts: 0 };

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              console.log("Streaming complete");
              setIsLoading(false);
              setIsStreaming(false);
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              console.log("Received message:", parsed.type);

              if (parsed.type === "metadata") {
                currentStats = {
                  totalFiltered: parsed.totalFiltered,
                  totalProducts: parsed.totalProducts,
                };
                setStats(currentStats);
              } else if (parsed.type === "recommendation") {
                console.log(
                  `Received recommendation #${
                    tempRecommendations.length + 1
                  }: ${parsed.data.product.name}`
                );
                tempRecommendations.push(parsed.data);
                // Update recommendations incrementally
                setRecommendations([...tempRecommendations]);
                setIsLoading(false); // Show UI as soon as first recommendation arrives
              } else if (parsed.type === "error") {
                throw new Error(parsed.error);
              }
            } catch (parseError) {
              console.error("Parse error:", parseError);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error generating recommendations:", err);
      setError(err instanceof Error ? err.message : String(err));
      toast.error("Failed to generate recommendations", {
        description: err instanceof Error ? err.message : String(err),
      });
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const clearData = () => {
    setProductsJson("");
    setUserPreferencesJson("");
    setRecommendations([]);
    setStats({ totalFiltered: 0, totalProducts: 0 });
    setError(null);
    toast.info("Data cleared");
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Test LLM Recommendations</h1>
        </div>
        <p className="text-muted-foreground">
          Test the recommendation engine with custom products and user
          preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Input Data</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSampleData}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Load Sample Data
                </Button>
                <Button variant="ghost" size="sm" onClick={clearData}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Products JSON
                </label>
                <Textarea
                  value={productsJson}
                  onChange={(e) => setProductsJson(e.target.value)}
                  placeholder="Paste your products JSON here..."
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  User Preferences JSON
                </label>
                <Textarea
                  value={userPreferencesJson}
                  onChange={(e) => setUserPreferencesJson(e.target.value)}
                  placeholder="Paste your user preferences JSON here..."
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
            </div>

            <Button
              onClick={generateRecommendations}
              disabled={
                isLoading || !productsJson.trim() || !userPreferencesJson.trim()
              }
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isLoading ? "Generating..." : "Generate Recommendations"}
            </Button>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Results</h2>
            {recommendations.length > 0 && (
              <div className="flex gap-2">
                <Badge variant="secondary">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {recommendations.length} Recommendations
                </Badge>
                {stats.totalFiltered > 0 && (
                  <Badge variant="outline">
                    From {stats.totalFiltered} filtered products
                  </Badge>
                )}
                {isStreaming && (
                  <Badge
                    variant="secondary"
                    className="bg-green-500/10 text-green-600 animate-pulse"
                  >
                    🔴 Live Streaming
                  </Badge>
                )}
              </div>
            )}
          </div>

          {isLoading && recommendations.length === 0 && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
                <p className="text-muted-foreground">
                  Generating recommendations...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <h3 className="font-medium text-red-800 mb-2">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="space-y-4 ">
              <div className="grid grid-cols-1 gap-4 h-[40vh] overflow-y-auto">
                {recommendations.map((rec, index) => (
                  <ProductCard
                    key={rec.product.id}
                    product={rec.product}
                    rank={index + 1}
                    relevanceScore={rec.relevanceScore}
                    explanation={rec.explanation}
                    matchReasons={rec.matchReasons}
                    variant="recommendation"
                  />
                ))}
              </div>
            </div>
          )}

          {!isLoading && recommendations.length === 0 && !error && (
            <div className="text-center py-16 text-muted-foreground">
              <Sparkles className="h-16 w-16 mx-auto mb-4" />
              <p>No recommendations yet. Generate some to see results here.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
