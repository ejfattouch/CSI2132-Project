import { NextResponse } from "next/server";
import { getHotelCapacity } from "@/lib/reports";

export async function GET() {
  try {
    const data = await getHotelCapacity();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in hotel-capacity API:", error);
    return NextResponse.json({ error: "Failed to fetch hotel capacity data" }, { status: 500 });
  }
}
