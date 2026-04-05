import { db } from "@/db";
import { roomsPerArea, hotelCapacity } from "@/db/schema";
import { sql } from "drizzle-orm";

/**
 * Fetch all rooms per area from the database view.
 * Results are ordered by available_rooms DESC (most availability first).
 */
export async function getRoomsPerArea() {
  try {
    const results = await db.select().from(roomsPerArea);
    return results;
  } catch (error) {
    console.error("Error fetching rooms per area:", error);
    throw new Error("Failed to fetch rooms per area data");
  }
}

/**
 * Fetch hotel capacity details from the database view.
 * Shows total rooms and breakdown by capacity type per hotel.
 */
export async function getHotelCapacity() {
  try {
    const results = await db.select().from(hotelCapacity);
    return results;
  } catch (error) {
    console.error("Error fetching hotel capacity:", error);
    throw new Error("Failed to fetch hotel capacity data");
  }
}

/**
 * Search hotel capacity by chain name or hotel address.
 */
export async function searchHotelCapacity(searchQuery: string) {
  try {
    const results = await db
      .select()
      .from(hotelCapacity)
      .where(
        sql`${hotelCapacity.chainName} ILIKE ${"%" + searchQuery + "%"} OR ${hotelCapacity.hotelAddress} ILIKE ${
          "%" + searchQuery + "%"
        }`
      );
    return results;
  } catch (error) {
    console.error("Error searching hotel capacity:", error);
    throw new Error("Failed to search hotel capacity data");
  }
}

/**
 * Get hotel capacity filtered by star rating.
 */
export async function getHotelCapacityByRating(rating: number) {
  try {
    const results = await db.select().from(hotelCapacity).where(sql`${hotelCapacity.starRating} = ${rating}`);
    return results;
  } catch (error) {
    console.error("Error fetching hotel capacity by rating:", error);
    throw new Error("Failed to fetch hotel capacity by rating");
  }
}
