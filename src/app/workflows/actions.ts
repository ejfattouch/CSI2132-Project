"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";

import { db } from "@/db";

type DbRow = Record<string, unknown>;

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: FormDataEntryValue | null, fieldName: string): number {
  const rawValue = asString(value);
  if (!rawValue) {
    throw new Error(`${fieldName} is required.`);
  }

  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }

  return parsed;
}

function asOptionalNumber(value: FormDataEntryValue | null): number | null {
  const rawValue = asString(value);
  if (!rawValue) {
    return null;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Payment amount must be a non-negative number.");
  }

  return parsed;
}

function asDate(value: FormDataEntryValue | null, fieldName: string): string {
  const rawValue = asString(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    throw new Error(`${fieldName} must be a valid date.`);
  }
  return rawValue;
}

function asOptionalDate(value: FormDataEntryValue | null): string | null {
  const rawValue = asString(value);
  if (!rawValue) {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    throw new Error("Payment date must be a valid date.");
  }
  return rawValue;
}

function ensureDateOrder(startDate: string, endDate: string): void {
  if (endDate <= startDate) {
    throw new Error("End date must be after start date.");
  }
}

function asPaymentStatus(value: FormDataEntryValue | null): "pending" | "paid" | "refunded" {
  const status = asString(value).toLowerCase();
  if (status === "pending" || status === "paid" || status === "refunded") {
    return status;
  }
  throw new Error("Payment status is invalid.");
}

function pickMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Unable to complete workflow.";
}

function withMessage(path: string, key: "notice" | "error", message: string): string {
  const [basePath, queryString] = path.split("?");
  const params = new URLSearchParams(queryString ?? "");
  params.set(key, message);
  return `${basePath}?${params.toString()}`;
}

async function ensureCustomerExists(customerId: number): Promise<void> {
  const result = await db.execute(sql`
    SELECT c.customer_id
    FROM customer c
    WHERE c.customer_id = ${customerId}
  `);

  if (!result.rows[0]) {
    throw new Error("Customer reference is invalid.");
  }
}

async function ensureEmployeeAtHotel(employeeSsn: string, hotelId: number): Promise<void> {
  const result = await db.execute(sql`
    SELECT e.ssn
    FROM employee e
    WHERE e.ssn = ${employeeSsn}
      AND e.hotel_id = ${hotelId}
  `);

  if (!result.rows[0]) {
    throw new Error("Employee reference is invalid for this hotel.");
  }
}

async function ensureRoomAtHotel(hotelId: number, roomNumber: number): Promise<void> {
  const result = await db.execute(sql`
    SELECT r.room_number
    FROM room r
    WHERE r.hotel_id = ${hotelId}
      AND r.room_number = ${roomNumber}
  `);

  if (!result.rows[0]) {
    throw new Error("Room reference is invalid for this hotel.");
  }
}

async function ensureNoOverlaps(params: {
  hotelId: number;
  roomNumber: number;
  startDate: string;
  endDate: string;
  ignoreBookingId?: number;
  ignoreRentingId?: number;
}): Promise<void> {
  const bookingRows = await db.execute(sql`
    SELECT b.booking_id
    FROM booking b
    WHERE b.hotel_id = ${params.hotelId}
      AND b.room_number = ${params.roomNumber}
      AND (${params.startDate}::date, ${params.endDate}::date) OVERLAPS (b.start_date, b.end_date)
      AND (${params.ignoreBookingId ?? -1} = -1 OR b.booking_id <> ${params.ignoreBookingId ?? -1})
    LIMIT 1
  `);

  if (bookingRows.rows[0]) {
    throw new Error("Room is already booked in the selected date range.");
  }

  const rentingRows = await db.execute(sql`
    SELECT r.renting_id
    FROM renting r
    WHERE r.hotel_id = ${params.hotelId}
      AND r.room_number = ${params.roomNumber}
      AND (${params.startDate}::date, ${params.endDate}::date) OVERLAPS (r.start_date, r.end_date)
      AND (${params.ignoreRentingId ?? -1} = -1 OR r.renting_id <> ${params.ignoreRentingId ?? -1})
    LIMIT 1
  `);

  if (rentingRows.rows[0]) {
    throw new Error("Room is already rented in the selected date range.");
  }
}

export async function createBookingAction(formData: FormData): Promise<void> {
  const returnPath = asString(formData.get("returnPath")) || "/bookings/new";
  const successPath = asString(formData.get("successPath")) || "/browse-hotels";
  let destinationPath = returnPath;

  try {
    const customerId = asNumber(formData.get("customerId"), "Customer ID");
    const hotelId = asNumber(formData.get("hotelId"), "Hotel ID");
    const roomNumber = asNumber(formData.get("roomNumber"), "Room number");
    const startDate = asDate(formData.get("startDate"), "Start date");
    const endDate = asDate(formData.get("endDate"), "End date");

    ensureDateOrder(startDate, endDate);

    await ensureCustomerExists(customerId);
    await ensureRoomAtHotel(hotelId, roomNumber);
    await ensureNoOverlaps({ hotelId, roomNumber, startDate, endDate });

    await db.execute(sql`
      INSERT INTO booking (customer_id, hotel_id, room_number, start_date, end_date)
      VALUES (${customerId}, ${hotelId}, ${roomNumber}, ${startDate}::date, ${endDate}::date)
    `);

    revalidatePath("/browse-hotels");
    revalidatePath("/bookings/new");
    revalidatePath("/employee/workflows");

    destinationPath = withMessage(successPath, "notice", "Booking created successfully.");
  } catch (error) {
    destinationPath = withMessage(returnPath, "error", pickMessage(error));
  }

  redirect(destinationPath);
}

export async function convertBookingToRentingAction(formData: FormData): Promise<void> {
  const returnPath = asString(formData.get("returnPath")) || "/employee/workflows";
  let destinationPath = returnPath;

  try {
    const bookingId = asNumber(formData.get("bookingId"), "Booking ID");
    const employeeSsn = asString(formData.get("employeeSsn"));
    if (!employeeSsn) {
      throw new Error("Employee SSN is required.");
    }

    const paymentAmount = asOptionalNumber(formData.get("paymentAmount"));
    const paymentDate = asOptionalDate(formData.get("paymentDate"));
    const paymentStatus = asPaymentStatus(formData.get("paymentStatus"));

    await db.transaction(async (tx) => {
      const bookingResult = await tx.execute(sql`
        SELECT b.booking_id AS "bookingId", b.customer_id AS "customerId", b.hotel_id AS "hotelId",
               b.room_number AS "roomNumber", b.start_date AS "startDate", b.end_date AS "endDate"
        FROM booking b
        WHERE b.booking_id = ${bookingId}
        FOR UPDATE
      `);

      const booking = bookingResult.rows[0] as DbRow | undefined;
      if (!booking) {
        throw new Error("Booking could not be found.");
      }

      const hotelId = Number(booking.hotelId);
      const roomNumber = Number(booking.roomNumber);
      const startDate = String(booking.startDate);
      const endDate = String(booking.endDate);
      const customerId = Number(booking.customerId);

      await ensureEmployeeAtHotel(employeeSsn, hotelId);
      await ensureNoOverlaps({
        hotelId,
        roomNumber,
        startDate,
        endDate,
        ignoreBookingId: bookingId,
      });

      await tx.execute(sql`
        INSERT INTO renting (
          customer_id,
          hotel_id,
          room_number,
          employee_ssn,
          start_date,
          end_date,
          booking_id,
          payment_amount,
          payment_date,
          payment_status
        )
        VALUES (
          ${customerId},
          ${hotelId},
          ${roomNumber},
          ${employeeSsn},
          ${startDate}::date,
          ${endDate}::date,
          ${bookingId},
          ${paymentAmount},
          ${paymentDate}::date,
          ${paymentStatus}
        )
      `);

      await tx.execute(sql`
        DELETE FROM booking
        WHERE booking_id = ${bookingId}
      `);
    });

    revalidatePath("/browse-hotels");
    revalidatePath("/bookings/new");
    revalidatePath("/employee/workflows");

    destinationPath = withMessage(returnPath, "notice", "Booking converted to renting.");
  } catch (error) {
    destinationPath = withMessage(returnPath, "error", pickMessage(error));
  }

  redirect(destinationPath);
}

export async function createDirectRentingAction(formData: FormData): Promise<void> {
  const returnPath = asString(formData.get("returnPath")) || "/employee/workflows";
  let destinationPath = returnPath;

  try {
    const customerId = asNumber(formData.get("customerId"), "Customer ID");
    const hotelId = asNumber(formData.get("hotelId"), "Hotel ID");
    const roomNumber = asNumber(formData.get("roomNumber"), "Room number");
    const employeeSsn = asString(formData.get("employeeSsn"));
    const startDate = asDate(formData.get("startDate"), "Start date");
    const endDate = asDate(formData.get("endDate"), "End date");

    if (!employeeSsn) {
      throw new Error("Employee SSN is required.");
    }

    ensureDateOrder(startDate, endDate);

    const paymentAmount = asOptionalNumber(formData.get("paymentAmount"));
    const paymentDate = asOptionalDate(formData.get("paymentDate"));
    const paymentStatus = asPaymentStatus(formData.get("paymentStatus"));

    await ensureCustomerExists(customerId);
    await ensureRoomAtHotel(hotelId, roomNumber);
    await ensureEmployeeAtHotel(employeeSsn, hotelId);
    await ensureNoOverlaps({ hotelId, roomNumber, startDate, endDate });

    await db.execute(sql`
      INSERT INTO renting (
        customer_id,
        hotel_id,
        room_number,
        employee_ssn,
        start_date,
        end_date,
        payment_amount,
        payment_date,
        payment_status
      )
      VALUES (
        ${customerId},
        ${hotelId},
        ${roomNumber},
        ${employeeSsn},
        ${startDate}::date,
        ${endDate}::date,
        ${paymentAmount},
        ${paymentDate}::date,
        ${paymentStatus}
      )
    `);

    revalidatePath("/browse-hotels");
    revalidatePath("/employee/workflows");

    destinationPath = withMessage(returnPath, "notice", "Direct renting created successfully.");
  } catch (error) {
    destinationPath = withMessage(returnPath, "error", pickMessage(error));
  }

  redirect(destinationPath);
}

export async function recordRentingPaymentAction(formData: FormData): Promise<void> {
  const returnPath = asString(formData.get("returnPath")) || "/employee/workflows";
  let destinationPath = returnPath;

  try {
    const rentingId = asNumber(formData.get("rentingId"), "Renting ID");
    const paymentAmount = asOptionalNumber(formData.get("paymentAmount"));
    const paymentDate = asOptionalDate(formData.get("paymentDate"));
    const paymentStatus = asPaymentStatus(formData.get("paymentStatus"));

    if (paymentAmount === null) {
      throw new Error("Payment amount is required.");
    }
    if (paymentDate === null) {
      throw new Error("Payment date is required.");
    }

    const exists = await db.execute(sql`
      SELECT r.renting_id
      FROM renting r
      WHERE r.renting_id = ${rentingId}
    `);

    if (!exists.rows[0]) {
      throw new Error("Renting reference is invalid.");
    }

    await db.execute(sql`
      UPDATE renting
      SET payment_amount = ${paymentAmount},
          payment_date = ${paymentDate}::date,
          payment_status = ${paymentStatus}
      WHERE renting_id = ${rentingId}
    `);

    revalidatePath("/employee/workflows");

    destinationPath = withMessage(returnPath, "notice", "Payment recorded successfully.");
  } catch (error) {
    destinationPath = withMessage(returnPath, "error", pickMessage(error));
  }

  redirect(destinationPath);
}
