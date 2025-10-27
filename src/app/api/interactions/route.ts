import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { dbPromise } from "@/lib/db";

type InteractionType = "view" | "like" | "add_to_cart" | "purchase";

interface InteractionDoc {
  userId: string | null;
  productId: string;
  type: InteractionType;
  timestamp: Date;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id || null;

    const body = await req.json();
    const { productId, type } = body as {
      productId?: string;
      type?: InteractionType;
    };

    if (!productId || !type) {
      return NextResponse.json(
        { error: "productId and type are required" },
        { status: 400 }
      );
    }

    const db = await dbPromise;
    const doc: InteractionDoc = {
      userId,
      productId,
      type,
      timestamp: new Date(),
    };
    await db.collection<InteractionDoc>("interactions").insertOne(doc);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to record interaction", error);
    return NextResponse.json(
      { error: "Failed to record interaction" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const db = await dbPromise;
    const items = await db
      .collection("interactions")
      .find({ userId: session.user.id })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    return NextResponse.json({ data: items });
  } catch (error) {
    console.error("Failed to fetch interactions", error);
    return NextResponse.json(
      { error: "Failed to fetch interactions" },
      { status: 500 }
    );
  }
}
