import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getHotelCapacity } from "@/lib/reports";

export async function GET() {
  // Require authentication - customer, employee, or admin can view reports
  const session = await requireRole("customer", "employee", "admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getHotelCapacity();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in hotel-capacity API:", error);
    return NextResponse.json({ error: "Failed to fetch hotel capacity data" }, { status: 500 });
  }
}
