"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  DateOfBirthPicker,
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui";
import { Sparkles, ArrowRight } from "lucide-react";
import { CATEGORIES, INTERESTS } from "@/types/user-profile";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  // Check if user has already completed onboarding
  useEffect(() => {
    if (session?.user) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.profile && data.profile.onboardingCompleted) {
            console.log("User already completed onboarding, redirecting...");
            router.push("/recommended");
          } else {
            setIsCheckingProfile(false);
          }
        })
        .catch((err) => {
          console.error("Error checking profile:", err);
          setIsCheckingProfile(false);
        });
    }
  }, [session, router]);

  const [formData, setFormData] = useState({
    gender: "",
    dateOfBirth: undefined as Date | undefined,
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    favoriteCategories: [] as string[],
    priceRange: "",
    shoppingFrequency: "",
    interests: [] as string[],
    lifestyle: "",
    clothingSize: "",
    shoeSize: "",
    subscribedToNewsletter: false,
  });

  const handleCategoriesChange = useCallback((values: string[]) => {
    setFormData((prev) => ({ ...prev, favoriteCategories: values }));
  }, []);

  const handleInterestsChange = useCallback((values: string[]) => {
    setFormData((prev) => ({ ...prev, interests: values }));
  }, []);

  const handleGenderChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, gender: value }));
  }, []);

  const handlePriceRangeChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, priceRange: value }));
  }, []);

  const handleShoppingFrequencyChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, shoppingFrequency: value }));
  }, []);

  const handleLifestyleChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, lifestyle: value }));
  }, []);

  const handleDateOfBirthChange = useCallback((date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, dateOfBirth: date }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Convert date to ISO string for API
      const dataToSend = {
        ...formData,
        dateOfBirth: formData.dateOfBirth?.toISOString().split("T")[0] || "",
      };

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      toast.success("Profile completed!", {
        description: "Let's find products you'll love",
      });

      router.push("/recommended");
    } catch (error) {
      toast.error("Failed to save profile");
      console.error("Onboarding error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push("/products");
  };

  // Show loading while checking if user already completed onboarding
  if (isCheckingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Checking your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">
            Welcome, {session?.user.name}!
          </h1>
          <p className="text-muted-foreground text-lg">
            Help us personalize your shopping experience with smarter
            recommendations
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Tell us a bit about yourself</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={handleGenderChange}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="prefer-not-to-say">
                          Prefer not to say
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <DateOfBirthPicker
                      date={formData.dateOfBirth}
                      onDateChange={handleDateOfBirthChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
                <CardDescription>
                  Where should we deliver your products?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={formData.address.street}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: {
                          ...formData.address,
                          street: e.target.value,
                        },
                      })
                    }
                    placeholder="123 Main Street"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.address.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            city: e.target.value,
                          },
                        })
                      }
                      placeholder="New York"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.address.state}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            state: e.target.value,
                          },
                        })
                      }
                      placeholder="NY"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.address.zipCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            zipCode: e.target.value,
                          },
                        })
                      }
                      placeholder="10001"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.address.country}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            country: e.target.value,
                          },
                        })
                      }
                      placeholder="United States"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shopping Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Shopping Preferences</CardTitle>
                <CardDescription>
                  What kind of products are you interested in?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Favorite Categories (Select all that apply)</Label>
                  <MultiSelect
                    values={formData.favoriteCategories}
                    onValuesChange={handleCategoriesChange}
                  >
                    <MultiSelectTrigger className="w-full">
                      <MultiSelectValue placeholder="Select your favorite categories..." />
                    </MultiSelectTrigger>
                    <MultiSelectContent>
                      <MultiSelectGroup>
                        {CATEGORIES.map((category) => (
                          <MultiSelectItem key={category} value={category}>
                            {category}
                          </MultiSelectItem>
                        ))}
                      </MultiSelectGroup>
                    </MultiSelectContent>
                  </MultiSelect>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priceRange">Price Range Preference</Label>
                    <Select
                      value={formData.priceRange}
                      onValueChange={handlePriceRangeChange}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select price range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="budget">Budget ($0-$50)</SelectItem>
                        <SelectItem value="mid-range">
                          Mid-range ($50-$200)
                        </SelectItem>
                        <SelectItem value="premium">
                          Premium ($200-$500)
                        </SelectItem>
                        <SelectItem value="luxury">Luxury ($500+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency">Shopping Frequency</Label>
                    <Select
                      value={formData.shoppingFrequency}
                      onValueChange={handleShoppingFrequencyChange}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="How often do you shop?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="occasionally">
                          Occasionally
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interests & Lifestyle */}
            <Card>
              <CardHeader>
                <CardTitle>Interests & Lifestyle</CardTitle>
                <CardDescription>
                  What are your hobbies and interests?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Interests (Select all that apply)</Label>
                  <MultiSelect
                    values={formData.interests}
                    onValuesChange={handleInterestsChange}
                  >
                    <MultiSelectTrigger className="w-full">
                      <MultiSelectValue placeholder="Select your interests..." />
                    </MultiSelectTrigger>
                    <MultiSelectContent>
                      <MultiSelectGroup>
                        {INTERESTS.map((interest) => (
                          <MultiSelectItem key={interest} value={interest}>
                            {interest}
                          </MultiSelectItem>
                        ))}
                      </MultiSelectGroup>
                    </MultiSelectContent>
                  </MultiSelect>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lifestyle">Lifestyle</Label>
                  <Select
                    value={formData.lifestyle}
                    onValueChange={handleLifestyleChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your lifestyle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        Active - Fitness & Sports
                      </SelectItem>
                      <SelectItem value="professional">
                        Professional - Business & Career
                      </SelectItem>
                      <SelectItem value="casual">
                        Casual - Relaxed & Comfortable
                      </SelectItem>
                      <SelectItem value="outdoor">
                        Outdoor - Adventure & Nature
                      </SelectItem>
                      <SelectItem value="luxury">
                        Luxury - Premium & Exclusive
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clothingSize">
                      Clothing Size (Optional)
                    </Label>
                    <Input
                      id="clothingSize"
                      value={formData.clothingSize}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          clothingSize: e.target.value,
                        })
                      }
                      placeholder="e.g., M, L, XL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shoeSize">Shoe Size (Optional)</Label>
                    <Input
                      id="shoeSize"
                      value={formData.shoeSize}
                      onChange={(e) =>
                        setFormData({ ...formData, shoeSize: e.target.value })
                      }
                      placeholder="e.g., 9, 10, 11"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Newsletter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="newsletter"
                    checked={formData.subscribedToNewsletter}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        subscribedToNewsletter: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="newsletter" className="cursor-pointer">
                    Subscribe to our newsletter for personalized deals and
                    recommendations
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={isLoading}
              >
                Skip for now
              </Button>
              <Button type="submit" disabled={isLoading} size="lg">
                {isLoading ? "Saving..." : "Complete Profile"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
