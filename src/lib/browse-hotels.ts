import { sql, type SQL } from "drizzle-orm";

import { db } from "@/db";

const ROOM_CAPACITIES = ["single", "double", "suite", "family"] as const;

export type RoomCapacity = (typeof ROOM_CAPACITIES)[number];

type SearchParamValue = string | string[] | undefined;

export type BrowseHotelsSearchParams = Record<string, SearchParamValue>;

export type BrowseHotelsFilters = {
  startDate: string;
  endDate: string;
  roomCapacity: RoomCapacity | "";
  area: string;
  hotelChain: string;
  hotelCategory: number | null;
  minTotalRooms: number | null;
  minPrice: number | null;
  maxPrice: number | null;
};

export type BrowseHotelResult = {
  chainName: string;
  hotelCategory: number;
  area: string;
  hotelId: number;
  totalRoomsInHotel: number;
  roomNumber: number;
  roomCapacity: RoomCapacity;
  price: number;
  viewType: string;
  extendible: boolean;
};

export type BrowseHotelsOptions = {
  areas: string[];
  hotelChains: string[];
  hotelCategories: number[];
  totalRoomCounts: number[];
  minKnownPrice: number;
  maxKnownPrice: number;
};

function asString(value: SearchParamValue): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function isIsoDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultDates(): { start: string; end: string } {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return {
    start: formatDate(today),
    end: formatDate(tomorrow),
  };
}

function parseNumber(value: string): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function parsePositiveInteger(value: string): number | null {
  const parsed = parseNumber(value);
  if (parsed === null) {
    return null;
  }

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function readBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value === "true";
  }
  return false;
}

function normalizeDates(startDateRaw: string, endDateRaw: string): { startDate: string; endDate: string } {
  const defaults = defaultDates();
  const startDate = isIsoDate(startDateRaw) ? startDateRaw : defaults.start;
  const tentativeEnd = isIsoDate(endDateRaw) ? endDateRaw : defaults.end;

  if (tentativeEnd > startDate) {
    return { startDate, endDate: tentativeEnd };
  }

  const startDateObj = new Date(`${startDate}T00:00:00.000Z`);
  startDateObj.setUTCDate(startDateObj.getUTCDate() + 1);

  return {
    startDate,
    endDate: formatDate(startDateObj),
  };
}

export function parseBrowseHotelFilters(searchParams: BrowseHotelsSearchParams): BrowseHotelsFilters {
  const roomCapacityRaw = asString(searchParams.roomCapacity);
  const roomCapacity = ROOM_CAPACITIES.includes(roomCapacityRaw as RoomCapacity)
    ? (roomCapacityRaw as RoomCapacity)
    : "";

  const { startDate, endDate } = normalizeDates(
    asString(searchParams.startDate),
    asString(searchParams.endDate)
  );

  const hotelCategory = parsePositiveInteger(asString(searchParams.hotelCategory));
  const minTotalRooms = parsePositiveInteger(asString(searchParams.minTotalRooms));

  const minPrice = parseNumber(asString(searchParams.minPrice));
  const maxPrice = parseNumber(asString(searchParams.maxPrice));

  return {
    startDate,
    endDate,
    roomCapacity,
    area: asString(searchParams.area),
    hotelChain: asString(searchParams.hotelChain),
    hotelCategory,
    minTotalRooms,
    minPrice,
    maxPrice,
  };
}

export async function getBrowseHotelsOptions(): Promise<BrowseHotelsOptions> {
  const [areasResult, chainsResult, categoryResult, totalRoomCountsResult, priceBoundsResult] = await Promise.all([
    db.execute(sql<{ area: string }>`
      SELECT DISTINCT h.address AS area
      FROM hotel h
      ORDER BY area ASC
    `),
    db.execute(sql<{ chainName: string }>`
      SELECT hc.chain_name AS "chainName"
      FROM hotel_chain hc
      ORDER BY hc.chain_name ASC
    `),
    db.execute(sql<{ starRating: number }>`
      SELECT DISTINCT h.star_rating AS "starRating"
      FROM hotel h
      ORDER BY "starRating" ASC
    `),
    db.execute(sql<{ totalRooms: number }>`
      SELECT DISTINCT hc.total_rooms AS "totalRooms"
      FROM hotel_capacity hc
      ORDER BY "totalRooms" ASC
    `),
    db.execute(sql<{ minPrice: number | null; maxPrice: number | null }>`
      SELECT
        MIN(CAST(r.price AS DOUBLE PRECISION)) AS "minPrice",
        MAX(CAST(r.price AS DOUBLE PRECISION)) AS "maxPrice"
      FROM room r
    `),
  ]);

  const priceBounds = (priceBoundsResult.rows[0] ?? {}) as Record<string, unknown>;

  return {
    areas: areasResult.rows
      .map((row) => readString((row as Record<string, unknown>).area))
      .filter((value) => value.length > 0),
    hotelChains: chainsResult.rows
      .map((row) => readString((row as Record<string, unknown>).chainName))
      .filter((value) => value.length > 0),
    hotelCategories: categoryResult.rows
      .map((row) => readNumber((row as Record<string, unknown>).starRating, -1))
      .filter((value) => value > 0),
    totalRoomCounts: totalRoomCountsResult.rows
      .map((row) => readNumber((row as Record<string, unknown>).totalRooms, -1))
      .filter((value) => value > 0),
    minKnownPrice: readNumber(priceBounds.minPrice, 0),
    maxKnownPrice: readNumber(priceBounds.maxPrice, 1000),
  };
}

export async function searchAvailableRooms(filters: BrowseHotelsFilters): Promise<BrowseHotelResult[]> {
  const clauses: SQL[] = [
    sql`
      NOT EXISTS (
        SELECT 1
        FROM booking b
        WHERE b.hotel_id = r.hotel_id
          AND b.room_number = r.room_number
          AND (${filters.startDate}::date, ${filters.endDate}::date) OVERLAPS (b.start_date, b.end_date)
      )
    `,
    sql`
      NOT EXISTS (
        SELECT 1
        FROM renting rt
        WHERE rt.hotel_id = r.hotel_id
          AND rt.room_number = r.room_number
          AND (${filters.startDate}::date, ${filters.endDate}::date) OVERLAPS (rt.start_date, rt.end_date)
      )
    `,
  ];

  if (filters.roomCapacity) {
    clauses.push(sql`r.capacity = ${filters.roomCapacity}`);
  }

  if (filters.area) {
    clauses.push(sql`h.address = ${filters.area}`);
  }

  if (filters.hotelChain) {
    clauses.push(sql`hc.chain_name = ${filters.hotelChain}`);
  }

  if (filters.hotelCategory !== null) {
    clauses.push(sql`h.star_rating = ${filters.hotelCategory}`);
  }

  if (filters.minTotalRooms !== null) {
    clauses.push(sql`cap.total_rooms >= ${filters.minTotalRooms}`);
  }

  if (filters.minPrice !== null) {
    clauses.push(sql`CAST(r.price AS DOUBLE PRECISION) >= ${filters.minPrice}`);
  }

  if (filters.maxPrice !== null) {
    clauses.push(sql`CAST(r.price AS DOUBLE PRECISION) <= ${filters.maxPrice}`);
  }

  const whereClause = sql`WHERE ${sql.join(clauses, sql` AND `)}`;

  const result = await db.execute(sql<BrowseHotelResult>`
    SELECT
      hc.chain_name AS "chainName",
      h.star_rating AS "hotelCategory",
      h.address AS area,
      h.hotel_id AS "hotelId",
      cap.total_rooms AS "totalRoomsInHotel",
      r.room_number AS "roomNumber",
      r.capacity AS "roomCapacity",
      CAST(r.price AS DOUBLE PRECISION) AS price,
      COALESCE(r.view_type, 'none') AS "viewType",
      r.extendible AS extendible
    FROM room r
    INNER JOIN hotel h ON h.hotel_id = r.hotel_id
    INNER JOIN hotel_chain hc ON hc.central_address = h.hotel_chain_central_address
    INNER JOIN hotel_capacity cap ON cap.hotel_id = h.hotel_id
    ${whereClause}
    ORDER BY price ASC, "hotelCategory" DESC, "hotelId" ASC, "roomNumber" ASC
    LIMIT 250
  `);

  return result.rows.map((row) => {
    const raw = row as Record<string, unknown>;

    return {
      chainName: readString(raw.chainName),
      hotelCategory: readNumber(raw.hotelCategory),
      area: readString(raw.area),
      hotelId: readNumber(raw.hotelId),
      totalRoomsInHotel: readNumber(raw.totalRoomsInHotel),
      roomNumber: readNumber(raw.roomNumber),
      roomCapacity: readString(raw.roomCapacity) as RoomCapacity,
      price: readNumber(raw.price),
      viewType: readString(raw.viewType),
      extendible: readBoolean(raw.extendible),
    };
  });
}
