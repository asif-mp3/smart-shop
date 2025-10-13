import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
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
  } catch (error: any) {
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
  } catch (error: any) {
    console.error("Error saving user profile:", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
