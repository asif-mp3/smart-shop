"use client";

import { useSession } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { DateOfBirthPicker } from "@/components/ui/date-picker";
import {
  User,
  Mail,
  Calendar,
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  Edit,
  MapPin,
  ShoppingBag,
  Heart,
  DollarSign,
  TrendingUp,
  Search,
} from "lucide-react";
import { UserProfile, CATEGORIES, INTERESTS } from "@/types/user-profile";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editFormData, setEditFormData] = useState({
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

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data.profile);

          // Initialize edit form with current data
          setEditFormData({
            gender: data.profile.gender || "",
            dateOfBirth: data.profile.dateOfBirth
              ? new Date(data.profile.dateOfBirth)
              : undefined,
            address: data.profile.address || {
              street: "",
              city: "",
              state: "",
              zipCode: "",
              country: "",
            },
            favoriteCategories: data.profile.favoriteCategories || [],
            priceRange: data.profile.priceRange || "",
            shoppingFrequency: data.profile.shoppingFrequency || "",
            interests: data.profile.interests || [],
            lifestyle: data.profile.lifestyle || "",
            clothingSize: data.profile.clothingSize || "",
            shoeSize: data.profile.shoeSize || "",
            subscribedToNewsletter:
              data.profile.subscribedToNewsletter || false,
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const dataToSend = {
        ...editFormData,
        dateOfBirth:
          editFormData.dateOfBirth?.toISOString().split("T")[0] || "",
      };

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      setUserProfile(data.profile);
      setIsEditDialogOpen(false);
      toast.success("Profile updated successfully!");

      // Clear recommendations cache to regenerate with new preferences
      if (typeof window !== "undefined") {
        localStorage.removeItem("ai-recommendations-cache");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!session?.user) {
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(session.user.name || "User")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">
                  {session.user.name}
                </CardTitle>
                <CardDescription className="text-base">
                  {session.user.email}
                </CardDescription>
                <div className="flex gap-2 mt-3">
                  <Badge
                    variant={
                      session.user.emailVerified ? "default" : "secondary"
                    }
                  >
                    {session.user.emailVerified ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Verified
                      </>
                    )}
                  </Badge>
                  <Badge variant="outline">
                    <Shield className="h-3 w-3 mr-1" />
                    Member
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details and settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Full Name</p>
                <p className="text-sm text-muted-foreground">
                  {session.user.name || "Not provided"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Email Address</p>
                <p className="text-sm text-muted-foreground">
                  {session.user.email}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">User ID</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {session.user.id}
                </p>
              </div>
            </div>

            {session.user.image && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Profile Image</p>
                    <p className="text-sm text-muted-foreground">
                      {session.user.image}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Account Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Account Activity</CardTitle>
            <CardDescription>
              Your account timeline and important dates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Account Created</p>
                <p className="text-sm text-muted-foreground">
                  {session.user.createdAt
                    ? formatDate(session.user.createdAt)
                    : "Not available"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">
                  {session.user.updatedAt
                    ? formatDate(session.user.updatedAt)
                    : "Not available"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Preferences */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>User Preferences</CardTitle>
              <CardDescription>
                Your shopping preferences and interests
              </CardDescription>
            </div>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Preferences
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Your Preferences</DialogTitle>
                  <DialogDescription>
                    Update your shopping preferences and interests to get better
                    recommendations
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  {/* Demographics */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Demographics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select
                          value={editFormData.gender}
                          onValueChange={(value) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              gender: value,
                            }))
                          }
                        >
                          <SelectTrigger id="gender">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="non-binary">
                              Non-binary
                            </SelectItem>
                            <SelectItem value="prefer-not-to-say">
                              Prefer not to say
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <DateOfBirthPicker
                          date={editFormData.dateOfBirth}
                          onDateChange={(date: Date | undefined) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              dateOfBirth: date,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Address</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="street">Street Address</Label>
                        <Input
                          id="street"
                          value={editFormData.address.street}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              address: {
                                ...prev.address,
                                street: e.target.value,
                              },
                            }))
                          }
                          placeholder="123 Main St"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={editFormData.address.city}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              address: {
                                ...prev.address,
                                city: e.target.value,
                              },
                            }))
                          }
                          placeholder="New York"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={editFormData.address.state}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              address: {
                                ...prev.address,
                                state: e.target.value,
                              },
                            }))
                          }
                          placeholder="NY"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">Zip Code</Label>
                        <Input
                          id="zipCode"
                          value={editFormData.address.zipCode}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              address: {
                                ...prev.address,
                                zipCode: e.target.value,
                              },
                            }))
                          }
                          placeholder="10001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={editFormData.address.country}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              address: {
                                ...prev.address,
                                country: e.target.value,
                              },
                            }))
                          }
                          placeholder="USA"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shopping Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">
                      Shopping Preferences
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Favorite Categories</Label>
                        <MultiSelect
                          values={editFormData.favoriteCategories}
                          onValuesChange={(values: string[]) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              favoriteCategories: values,
                            }))
                          }
                        >
                          <MultiSelectTrigger>
                            <MultiSelectValue placeholder="Select categories" />
                          </MultiSelectTrigger>
                          <MultiSelectContent>
                            <MultiSelectGroup>
                              {CATEGORIES.map((category) => (
                                <MultiSelectItem
                                  key={category}
                                  value={category}
                                >
                                  {category}
                                </MultiSelectItem>
                              ))}
                            </MultiSelectGroup>
                          </MultiSelectContent>
                        </MultiSelect>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="priceRange">Price Range</Label>
                          <Select
                            value={editFormData.priceRange}
                            onValueChange={(value) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                priceRange: value,
                              }))
                            }
                          >
                            <SelectTrigger id="priceRange">
                              <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="budget">
                                Budget ($0-$50)
                              </SelectItem>
                              <SelectItem value="mid-range">
                                Mid-range ($50-$200)
                              </SelectItem>
                              <SelectItem value="premium">
                                Premium ($200-$500)
                              </SelectItem>
                              <SelectItem value="luxury">
                                Luxury ($500+)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shoppingFrequency">
                            Shopping Frequency
                          </Label>
                          <Select
                            value={editFormData.shoppingFrequency}
                            onValueChange={(value) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                shoppingFrequency: value,
                              }))
                            }
                          >
                            <SelectTrigger id="shoppingFrequency">
                              <SelectValue placeholder="Select frequency" />
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
                    </div>
                  </div>

                  {/* Interests & Lifestyle */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">
                      Interests & Lifestyle
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Interests</Label>
                        <MultiSelect
                          values={editFormData.interests}
                          onValuesChange={(values: string[]) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              interests: values,
                            }))
                          }
                        >
                          <MultiSelectTrigger>
                            <MultiSelectValue placeholder="Select interests" />
                          </MultiSelectTrigger>
                          <MultiSelectContent>
                            <MultiSelectGroup>
                              {INTERESTS.map((interest) => (
                                <MultiSelectItem
                                  key={interest}
                                  value={interest}
                                >
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
                          value={editFormData.lifestyle}
                          onValueChange={(value) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              lifestyle: value,
                            }))
                          }
                        >
                          <SelectTrigger id="lifestyle">
                            <SelectValue placeholder="Select lifestyle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="professional">
                              Professional
                            </SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="outdoor">Outdoor</SelectItem>
                            <SelectItem value="luxury">Luxury</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Optional Sizes */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Optional Sizes</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="clothingSize">Clothing Size</Label>
                        <Input
                          id="clothingSize"
                          value={editFormData.clothingSize}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              clothingSize: e.target.value,
                            }))
                          }
                          placeholder="e.g., M, L, XL"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shoeSize">Shoe Size</Label>
                        <Input
                          id="shoeSize"
                          value={editFormData.shoeSize}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              shoeSize: e.target.value,
                            }))
                          }
                          placeholder="e.g., 9, 10, 11"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingProfile ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Loading profile...
                </p>
              </div>
            ) : !userProfile ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No profile data available
                </p>
              </div>
            ) : (
              <>
                {/* Shopping Preferences Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">
                      Shopping Preferences
                    </h3>
                  </div>
                  <div className="space-y-3 pl-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">
                        Favorite Categories
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {userProfile.favoriteCategories?.length > 0 ? (
                          userProfile.favoriteCategories.map((category) => (
                            <Badge key={category} variant="secondary">
                              {category}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Not specified
                          </span>
                        )}
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Price Range
                        </p>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-green-600" />
                          <Badge variant="outline" className="capitalize">
                            {userProfile.priceRange || "Not specified"}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Shopping Frequency
                        </p>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-sm capitalize">
                            {userProfile.shoppingFrequency || "Not specified"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Interests & Lifestyle Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">
                      Interests & Lifestyle
                    </h3>
                  </div>
                  <div className="space-y-3 pl-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">
                        Interests
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {userProfile.interests?.length > 0 ? (
                          userProfile.interests.map((interest) => (
                            <Badge key={interest} variant="secondary">
                              {interest}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Not specified
                          </span>
                        )}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Lifestyle
                      </p>
                      <Badge variant="outline" className="capitalize">
                        {userProfile.lifestyle || "Not specified"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Personal Information Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">
                      Personal Information
                    </h3>
                  </div>
                  <div className="space-y-2 pl-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Gender</p>
                        <p className="text-sm capitalize">
                          {userProfile.gender || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Date of Birth
                        </p>
                        <p className="text-sm">
                          {userProfile.dateOfBirth
                            ? new Date(
                                userProfile.dateOfBirth
                              ).toLocaleDateString()
                            : "Not specified"}
                        </p>
                      </div>
                    </div>
                    {(userProfile.clothingSize || userProfile.shoeSize) && (
                      <>
                        <Separator />
                        <div className="grid grid-cols-2 gap-3">
                          {userProfile.clothingSize && (
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Clothing Size
                              </p>
                              <p className="text-sm">
                                {userProfile.clothingSize}
                              </p>
                            </div>
                          )}
                          {userProfile.shoeSize && (
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Shoe Size
                              </p>
                              <p className="text-sm">{userProfile.shoeSize}</p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Address Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Address</h3>
                  </div>
                  <div className="pl-6">
                    {userProfile.address ? (
                      <div className="text-sm space-y-0.5">
                        {userProfile.address.street && (
                          <p>{userProfile.address.street}</p>
                        )}
                        <p>
                          {[
                            userProfile.address.city,
                            userProfile.address.state,
                            userProfile.address.zipCode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        {userProfile.address.country && (
                          <p>{userProfile.address.country}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Address not provided
                      </p>
                    )}
                  </div>
                </div>

                {/* Search History Section */}
                {userProfile.searchHistory &&
                  userProfile.searchHistory.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-semibold">
                            Recent Searches
                          </h3>
                        </div>
                        <div className="pl-6">
                          <div className="flex flex-wrap gap-1.5">
                            {userProfile.searchHistory
                              .slice(0, 10)
                              .map((term, idx) => (
                                <Badge key={idx} variant="outline">
                                  {term}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Session Information */}
        {process.env.NODE_ENV === "development" && (
          <Card>
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
              <CardDescription>Current session details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Session ID</p>
                  <p className="text-sm text-muted-foreground font-mono break-all">
                    {session.session?.id || "Active session"}
                  </p>
                </div>
              </div>

              {session.session?.expiresAt && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Session Expires</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(session.session.expiresAt)}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {session.session?.ipAddress && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                      <Shield className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">IP Address</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {session.session.ipAddress}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {session.session?.userAgent && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10">
                      <User className="h-5 w-5 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Browser</p>
                      <p className="text-sm text-muted-foreground break-all">
                        {session.session.userAgent}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Raw Data (for debugging) */}
        {process.env.NODE_ENV === "development" && (
          <Card>
            <CardHeader>
              <CardTitle>Raw Session Data</CardTitle>
              <CardDescription>
                Complete session object (for development)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(session, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
