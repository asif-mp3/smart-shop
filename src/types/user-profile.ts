export interface UserProfile {
  _id?: string;
  userId: string;

  // Demographics
  gender: "male" | "female" | "non-binary" | "prefer-not-to-say";
  dateOfBirth: Date;

  // Location
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  // Shopping Preferences
  favoriteCategories: string[];
  priceRange: "budget" | "mid-range" | "premium" | "luxury";
  shoppingFrequency: "daily" | "weekly" | "monthly" | "occasionally";

  // Interests & Lifestyle
  interests: string[];
  lifestyle: "active" | "professional" | "casual" | "outdoor" | "luxury";

  // Sizes (optional)
  clothingSize?: string;
  shoeSize?: string;

  // Preferences
  subscribedToNewsletter: boolean;

  // Search History
  searchHistory?: string[];

  // Metadata
  onboardingCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Sports",
  "Home",
  "Accessories",
  "Personal Care",
] as const;

export const INTERESTS = [
  "Technology",
  "Fitness & Health",
  "Fashion & Style",
  "Home & Garden",
  "Sports & Outdoors",
  "Gaming",
  "Reading",
  "Cooking",
  "Travel",
  "Music",
  "Art & Crafts",
  "Photography",
] as const;
