import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(_request: NextRequest) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await dbPromise;
    const userProfile = await db
      .collection("userProfiles")
      .findOne({ userId: session.user.id });

    return NextResponse.json({ profile: userProfile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const db = await dbPromise;

    const profileData = {
      userId: session.user.id,
      gender: body.gender,
      dateOfBirth: new Date(body.dateOfBirth),
      address: {
        street: body.address.street || "",
        city: body.address.city || "",
        state: body.address.state || "",
        zipCode: body.address.zipCode || "",
        country: body.address.country || "",
      },
      favoriteCategories: body.favoriteCategories || [],
      priceRange: body.priceRange,
      shoppingFrequency: body.shoppingFrequency,
      interests: body.interests || [],
      lifestyle: body.lifestyle,
      clothingSize: body.clothingSize || "",
      shoeSize: body.shoeSize || "",
      subscribedToNewsletter: body.subscribedToNewsletter || false,
      onboardingCompleted: true,
      completedAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if profile exists
    const existingProfile = await db
      .collection("userProfiles")
      .findOne({ userId: session.user.id });

    if (existingProfile) {
      // Update existing profile
      await db.collection("userProfiles").updateOne(
        { userId: session.user.id },
        {
          $set: {
            ...profileData,
            updatedAt: new Date(),
          },
        }
      );
    } else {
      // Create new profile
      await db.collection("userProfiles").insertOne({
        ...profileData,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Profile saved successfully",
    });
  } catch (error) {
    console.error("Error saving user profile:", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const db = await dbPromise;

    // Handle different PATCH actions
    if (body.action === "addSearchHistory") {
      const searchTerm = body.searchTerm;
      if (!searchTerm) {
        return NextResponse.json(
          { error: "Search term is required" },
          { status: 400 }
        );
      }

      // First remove the term if it exists, then add it at position 0
      // This ensures uniqueness and maintains order in a single atomic operation
      await db.collection("userProfiles").updateOne(
        { userId: session.user.id },
        [
          {
            $set: {
              searchHistory: {
                $concatArrays: [
                  [searchTerm],
                  {
                    $slice: [
                      {
                        $filter: {
                          input: { $ifNull: ["$searchHistory", []] },
                          cond: { $ne: ["$$this", searchTerm] },
                        },
                      },
                      9, // Keep 9 old terms + 1 new = 10 total
                    ],
                  },
                ],
              },
              updatedAt: new Date(),
            },
          },
        ],
        { upsert: true }
      );

      return NextResponse.json({
        success: true,
        message: "Search history updated",
      });
    }

    // Handle profile update (edit preferences)
    const profileData = {
      gender: body.gender,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      address: body.address || {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
      favoriteCategories: body.favoriteCategories || [],
      priceRange: body.priceRange,
      shoppingFrequency: body.shoppingFrequency,
      interests: body.interests || [],
      lifestyle: body.lifestyle,
      clothingSize: body.clothingSize || "",
      shoeSize: body.shoeSize || "",
      subscribedToNewsletter: body.subscribedToNewsletter || false,
      updatedAt: new Date(),
    };

    const result = await db
      .collection("userProfiles")
      .updateOne({ userId: session.user.id }, { $set: profileData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Fetch updated profile
    const updatedProfile = await db
      .collection("userProfiles")
      .findOne({ userId: session.user.id });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
