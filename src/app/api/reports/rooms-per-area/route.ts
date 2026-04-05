import { NextResponse } from "next/server";
import { getRoomsPerArea } from "@/lib/reports";

export async function GET() {
    try {
        const data = await getRoomsPerArea();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in rooms-per-area API:", error);
        return NextResponse.json({ error: "Failed to fetch rooms per area data" }, { status: 500 });
    }
}
