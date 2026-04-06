import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getRoomsPerArea } from "@/lib/reports";

export async function GET() {
    // Require authentication - customer, employee, or admin can view reports
    const session = await requireRole("customer", "employee", "admin");
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await getRoomsPerArea();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in rooms-per-area API:", error);
        return NextResponse.json({ error: "Failed to fetch rooms per area data" }, { status: 500 });
    }
}
