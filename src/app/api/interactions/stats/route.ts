import { NextRequest, NextResponse } from "next/server";
import { dbPromise } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    const db = await dbPromise;
    const collection = db.collection("interactions");

    if (productId) {
      const count = await collection.countDocuments({
        productId,
        type: "add_to_cart",
      });
      return NextResponse.json({ productId, addToCartCount: count });
    }

    // Aggregate top products by add_to_cart if no productId provided
    const top = await collection
      .aggregate([
        { $match: { type: "add_to_cart" } },
        { $group: { _id: "$productId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ])
      .toArray();

    return NextResponse.json({ top });
  } catch (error) {
    console.error("Failed to get interaction stats", error);
    return NextResponse.json(
      { error: "Failed to get interaction stats" },
      { status: 500 }
    );
  }
}
