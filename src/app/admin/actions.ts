"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";

import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { CUSTOMER_ID_TYPES, ROOM_CAPACITIES, ROOM_VIEWS } from "@/lib/admin-constants";

type PgError = {
  code?: string;
  detail?: string;
  constraint?: string;
};

function readString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function readRequiredString(value: FormDataEntryValue | null, fieldName: string): string {
  const parsed = readString(value);
  if (!parsed) {
    throw new Error(`${fieldName} is required.`);
  }
  return parsed;
}

function readPositiveInt(value: FormDataEntryValue | null, fieldName: string): number {
  const raw = readRequiredString(value, fieldName);
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

function readDecimal(value: FormDataEntryValue | null, fieldName: string): number {
  const raw = readRequiredString(value, fieldName);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative number.`);
  }
  return parsed;
}

function readBoolean(value: FormDataEntryValue | null): boolean {
  return readString(value) === "on";
}

function readDate(value: FormDataEntryValue | null, fieldName: string): string {
  const raw = readRequiredString(value, fieldName);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error(`${fieldName} must be a valid date.`);
  }
  return raw;
}

function readEmail(value: FormDataEntryValue | null): string {
  const email = readRequiredString(value, "Email");
  const looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!looksValid) {
    throw new Error("Email format is invalid.");
  }
  return email;
}

function readSsn(value: FormDataEntryValue | null, fieldName = "SSN"): string {
  const ssn = readRequiredString(value, fieldName);
  if (!/^\d{3}-\d{2}-\d{4}$/.test(ssn)) {
    throw new Error(`${fieldName} must match ###-##-####.`);
  }
  return ssn;
}

function readOptionalSsn(value: FormDataEntryValue | null): string | null {
  const raw = readString(value);
  if (!raw) {
    return null;
  }
  if (!/^\d{3}-\d{2}-\d{4}$/.test(raw)) {
    throw new Error("Manager SSN must match ###-##-####.");
  }
  return raw;
}

function withMessage(path: string, key: "notice" | "error", message: string): string {
  const [basePath, queryString] = path.split("?");
  const params = new URLSearchParams(queryString ?? "");
  params.set(key, message);
  return `${basePath}?${params.toString()}`;
}

function mapDbError(error: unknown, fallback = "Action failed."): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  const dbError = error as PgError;
  if (dbError?.code === "23503") {
    return "Operation blocked by related records (foreign key constraint).";
  }
  if (dbError?.code === "23505") {
    return "A record with this identifier already exists.";
  }
  if (dbError?.code === "23514") {
    return "Input violates a database check rule.";
  }

  return fallback;
}

function revalidateAdminCrud(): void {
  revalidatePath("/admin/customers");
  revalidatePath("/admin/employees");
  revalidatePath("/admin/hotels");
  revalidatePath("/admin/rooms");
  revalidatePath("/browse-hotels");
  revalidatePath("/bookings/new");
  revalidatePath("/employee/workflows");
}

async function hotelExists(hotelId: number): Promise<boolean> {
  const result = await db.execute(sql`SELECT 1 FROM hotel WHERE hotel_id = ${hotelId}`);
  return Boolean(result.rows[0]);
}

async function chainExists(chainAddress: string): Promise<boolean> {
  const result = await db.execute(sql`SELECT 1 FROM hotel_chain WHERE central_address = ${chainAddress}`);
  return Boolean(result.rows[0]);
}

async function employeeExists(ssn: string): Promise<boolean> {
  const result = await db.execute(sql`SELECT 1 FROM employee WHERE ssn = ${ssn}`);
  return Boolean(result.rows[0]);
}

async function customerExists(customerId: number): Promise<boolean> {
  const result = await db.execute(sql`SELECT 1 FROM customer WHERE customer_id = ${customerId}`);
  return Boolean(result.rows[0]);
}

async function roomHasLiveReferences(hotelId: number, roomNumber: number): Promise<boolean> {
  const bookings = await db.execute(sql`
    SELECT 1 FROM booking
    WHERE hotel_id = ${hotelId} AND room_number = ${roomNumber}
    LIMIT 1
  `);

  if (bookings.rows[0]) {
    return true;
  }

  const rentings = await db.execute(sql`
    SELECT 1 FROM renting
    WHERE hotel_id = ${hotelId} AND room_number = ${roomNumber}
    LIMIT 1
  `);

  return Boolean(rentings.rows[0]);
}

export async function createCustomerAction(formData: FormData): Promise<void> {
  // Admin role required
  const session = await requireRole("admin");
  if (!session) {
    redirect("/?unauthorized=true");
  }

  const returnPath = readString(formData.get("returnPath")) || "/admin/customers";
  let destination = returnPath;

  try {
    const fullName = readRequiredString(formData.get("fullName"), "Full name");
    const address = readRequiredString(formData.get("address"), "Address");
    const idType = readRequiredString(formData.get("idType"), "ID type");
    const registrationDate = readDate(formData.get("registrationDate"), "Registration date");

    if (!CUSTOMER_ID_TYPES.includes(idType as (typeof CUSTOMER_ID_TYPES)[number])) {
      throw new Error("ID type is invalid.");
    }

    await db.execute(sql`
      INSERT INTO customer (full_name, address, id_type, registration_date)
      VALUES (${fullName}, ${address}, ${idType}, ${registrationDate}::date)
    `);

    revalidateAdminCrud();
    destination = withMessage(returnPath, "notice", "Customer created.");
  } catch (error) {
    destination = withMessage(returnPath, "error", mapDbError(error, "Customer creation failed."));
  }

  redirect(destination);
}

export async function updateCustomerAction(formData: FormData): Promise<void> {
  // Admin role required
  const session = await requireRole("admin");
  if (!session) {
    redirect("/?unauthorized=true");
  }

  const returnPath = readString(formData.get("returnPath")) || "/admin/customers";
  let destination = returnPath;

  try {
    const customerId = readPositiveInt(formData.get("customerId"), "Customer ID");
    const fullName = readRequiredString(formData.get("fullName"), "Full name");
    const address = readRequiredString(formData.get("address"), "Address");
    const idType = readRequiredString(formData.get("idType"), "ID type");
    const registrationDate = readDate(formData.get("registrationDate"), "Registration date");

    if (!CUSTOMER_ID_TYPES.includes(idType as (typeof CUSTOMER_ID_TYPES)[number])) {
      throw new Error("ID type is invalid.");
    }
    if (!(await customerExists(customerId))) {
      throw new Error("Customer reference is invalid.");
    }

    await db.execute(sql`
      UPDATE customer
      SET full_name = ${fullName},
          address = ${address},
          id_type = ${idType},
          registration_date = ${registrationDate}::date
      WHERE customer_id = ${customerId}
    `);

    revalidateAdminCrud();
    destination = withMessage(returnPath, "notice", "Customer updated.");
  } catch (error) {
    destination = withMessage(returnPath, "error", mapDbError(error, "Customer update failed."));
  }

  redirect(destination);
}

export async function deleteCustomerAction(formData: FormData): Promise<void> {
  // Admin role required
  const session = await requireRole("admin");
  if (!session) {
    redirect("/?unauthorized=true");
  }

  const returnPath = readString(formData.get("returnPath")) || "/admin/customers";
  let destination = returnPath;

  try {
    const customerId = readPositiveInt(formData.get("customerId"), "Customer ID");
    if (!(await customerExists(customerId))) {
      throw new Error("Customer reference is invalid.");
    }

    await db.execute(sql`DELETE FROM customer WHERE customer_id = ${customerId}`);

    revalidateAdminCrud();
    destination = withMessage(returnPath, "notice", "Customer deleted.");
  } catch (error) {
    destination = withMessage(returnPath, "error", mapDbError(error, "Customer deletion failed."));
  }

  redirect(destination);
}

export async function createEmployeeAction(formData: FormData): Promise<void> {
  // Admin role required
  const session = await requireRole("admin");
  if (!session) {
    redirect("/?unauthorized=true");
  }

  const returnPath = readString(formData.get("returnPath")) || "/admin/employees";
  let destination = returnPath;

  try {
    const ssn = readSsn(formData.get("ssn"));
    const hotelId = readPositiveInt(formData.get("hotelId"), "Hotel ID");
    const fullName = readRequiredString(formData.get("fullName"), "Full name");
    const address = readRequiredString(formData.get("address"), "Address");
    const role = readRequiredString(formData.get("role"), "Role");

    if (!(await hotelExists(hotelId))) {
      throw new Error("Hotel reference is invalid.");
    }

    await db.execute(sql`
      INSERT INTO employee (ssn, hotel_id, full_name, address, role)
      VALUES (${ssn}, ${hotelId}, ${fullName}, ${address}, ${role})
    `);

    revalidateAdminCrud();
    destination = withMessage(returnPath, "notice", "Employee created.");
  } catch (error) {
    destination = withMessage(returnPath, "error", mapDbError(error, "Employee creation failed."));
  }

  redirect(destination);
}

export async function updateEmployeeAction(formData: FormData): Promise<void> {
  // Admin role required
  const session = await requireRole("admin");
  if (!session) {
    redirect("/?unauthorized=true");
  }

  const returnPath = readString(formData.get("returnPath")) || "/admin/employees";
  let destination = returnPath;

  try {
    const ssn = readSsn(formData.get("ssn"));
    const hotelId = readPositiveInt(formData.get("hotelId"), "Hotel ID");
    const fullName = readRequiredString(formData.get("fullName"), "Full name");
    const address = readRequiredString(formData.get("address"), "Address");
    const role = readRequiredString(formData.get("role"), "Role");

    if (!(await employeeExists(ssn))) {
      throw new Error("Employee reference is invalid.");
    }
    if (!(await hotelExists(hotelId))) {
      throw new Error("Hotel reference is invalid.");
    }

    await db.execute(sql`
      UPDATE employee
      SET hotel_id = ${hotelId},
          full_name = ${fullName},
          address = ${address},
          role = ${role}
      WHERE ssn = ${ssn}
    `);

    revalidateAdminCrud();
    destination = withMessage(returnPath, "notice", "Employee updated.");
  } catch (error) {
    destination = withMessage(returnPath, "error", mapDbError(error, "Employee update failed."));
  }

  redirect(destination);
}

export async function deleteEmployeeAction(formData: FormData): Promise<void> {
  // Admin role required
  const session = await requireRole("admin");
  if (!session) {
    redirect("/?unauthorized=true");
  }

  const returnPath = readString(formData.get("returnPath")) || "/admin/employees";
  let destination = returnPath;

  try {
    const ssn = readSsn(formData.get("ssn"));
    if (!(await employeeExists(ssn))) {
      throw new Error("Employee reference is invalid.");
    }

    await db.execute(sql`DELETE FROM employee WHERE ssn = ${ssn}`);

    revalidateAdminCrud();
    destination = withMessage(returnPath, "notice", "Employee deleted.");
  } catch (error) {
    destination = withMessage(returnPath, "error", mapDbError(error, "Employee deletion failed."));
  }

  redirect(destination);
}

export async function createHotelAction(formData: FormData): Promise<void> {
  // Admin role required
  const session = await requireRole("admin");
  if (!session) {
    redirect("/?unauthorized=true");
  }

  const returnPath = readString(formData.get("returnPath")) || "/admin/hotels";
  let destination = returnPath;

  try {
    const chainAddress = readRequiredString(formData.get("chainAddress"), "Chain central address");
    const address = readRequiredString(formData.get("address"), "Hotel address");
    const starRating = readPositiveInt(formData.get("starRating"), "Star rating");
    const email = readEmail(formData.get("email"));
    const managerSsn = readOptionalSsn(formData.get("managerSsn"));

    if (starRating < 1 || starRating > 5) {
      throw new Error("Star rating must be between 1 and 5.");
    }
    if (!(await chainExists(chainAddress))) {
      throw new Error("Hotel chain central address does not exist.");
    }
    if (managerSsn && !(await employeeExists(managerSsn))) {
      throw new Error("Manager SSN does not reference an employee.");
    }

    await db.execute(sql`
      INSERT INTO hotel (hotel_chain_central_address, address, star_rating, email, manager_ssn)
      VALUES (${chainAddress}, ${address}, ${starRating}, ${email}, ${managerSsn})
    `);

    revalidateAdminCrud();
    destination = withMessage(returnPath, "notice", "Hotel created.");
  } catch (error) {
    destination = withMessage(returnPath, "error", mapDbError(error, "Hotel creation failed."));
  }

  redirect(destination);
}

export async function updateHotelAction(formData: FormData): Promise<void> {
  // Admin role required
  const session = await requireRole("admin");
  if (!session) {
    redirect("/?unauthorized=true");
  }

  const returnPath = readString(formData.get("returnPath")) || "/admin/hotels";
  let destination = returnPath;

  try {
    const hotelId = readPositiveInt(formData.get("hotelId"), "Hotel ID");
    const chainAddress = readRequiredString(formData.get("chainAddress"), "Chain central address");
    const address = readRequiredString(formData.get("address"), "Hotel address");
    const starRating = readPositiveInt(formData.get("starRating"), "Star rating");
    const email = readEmail(formData.get("email"));
    const managerSsn = readOptionalSsn(formData.get("managerSsn"));

    if (starRating < 1 || starRating > 5) {
      throw new Error("Star rating must be between 1 and 5.");
    }
    if (!(await hotelExists(hotelId))) {
      throw new Error("Hotel reference is invalid.");
    }
    if (!(await chainExists(chainAddress))) {
      throw new Error("Hotel chain central address does not exist.");
    }
    if (managerSsn && !(await employeeExists(managerSsn))) {
      throw new Error("Manager SSN does not reference an employee.");
    }

    await db.execute(sql`
      UPDATE hotel
      SET hotel_chain_central_address = ${chainAddress},
          address = ${address},
          star_rating = ${starRating},
          email = ${email},
          manager_ssn = ${managerSsn}
      WHERE hotel_id = ${hotelId}
    `);

    revalidateAdminCrud();
    destination = withMessage(returnPath, "notice", "Hotel updated.");
  } catch (error) {
    destination = withMessage(returnPath, "error", mapDbError(error, "Hotel update failed."));
  }

  redirect(destination);
}

export async function deleteHotelAction(formData: FormData): Promise<void> {
  // Admin role required
  const session = await requireRole("admin");
  if (!session) {
    redirect("/?unauthorized=true");
  }

  const returnPath = readString(formData.get("returnPath")) || "/admin/hotels";
  let destination = returnPath;

  try {
    const hotelId = readPositiveInt(formData.get("hotelId"), "Hotel ID");
    if (!(await hotelExists(hotelId))) {
      throw new Error("Hotel reference is invalid.");
    }

    await db.execute(sql`DELETE FROM hotel WHERE hotel_id = ${hotelId}`);

    revalidateAdminCrud();
    destination = withMessage(returnPath, "notice", "Hotel deleted.");
  } catch (error) {
    destination = withMessage(returnPath, "error", mapDbError(error, "Hotel deletion failed."));
  }

  redirect(destination);
}

export async function createRoomAction(formData: FormData): Promise<void> {
  // Admin role required
  const session = await requireRole("admin");
  if (!session) {
    redirect("/?unauthorized=true");
  }

  const returnPath = readString(formData.get("returnPath")) || "/admin/rooms";
  let destination = returnPath;

  try {
    const roomNumber = readPositiveInt(formData.get("roomNumber"), "Room number");
    const hotelId = readPositiveInt(formData.get("hotelId"), "Hotel ID");
    const price = readDecimal(formData.get("price"), "Price");
    const capacity = readRequiredString(formData.get("capacity"), "Capacity");
    const viewTypeRaw = readString(formData.get("viewType"));
    const extendible = readBoolean(formData.get("extendible"));

    if (!ROOM_CAPACITIES.includes(capacity as (typeof ROOM_CAPACITIES)[number])) {
      throw new Error("Room capacity is invalid.");
    }

    const viewType = viewTypeRaw || null;
    if (viewType && !ROOM_VIEWS.includes(viewType as (typeof ROOM_VIEWS)[number])) {
      throw new Error("View type must be empty, sea, or mountain.");
    }

    if (!(await hotelExists(hotelId))) {
      throw new Error("Hotel reference is invalid.");
    }

    await db.execute(sql`
      INSERT INTO room (room_number, hotel_id, price, capacity, view_type, extendible)
      VALUES (${roomNumber}, ${hotelId}, ${price}, ${capacity}, ${viewType}, ${extendible})
    `);

    revalidateAdminCrud();
    destination = withMessage(returnPath, "notice", "Room created.");
  } catch (error) {
    destination = withMessage(returnPath, "error", mapDbError(error, "Room creation failed."));
  }

  redirect(destination);
}

export async function updateRoomAction(formData: FormData): Promise<void> {
  // Admin role required
  const session = await requireRole("admin");
  if (!session) {
    redirect("/?unauthorized=true");
  }

  const returnPath = readString(formData.get("returnPath")) || "/admin/rooms";
  let destination = returnPath;

  try {
    const roomNumber = readPositiveInt(formData.get("roomNumber"), "Room number");
    const hotelId = readPositiveInt(formData.get("hotelId"), "Hotel ID");
    const price = readDecimal(formData.get("price"), "Price");
    const capacity = readRequiredString(formData.get("capacity"), "Capacity");
    const viewTypeRaw = readString(formData.get("viewType"));
    const extendible = readBoolean(formData.get("extendible"));

    if (!ROOM_CAPACITIES.includes(capacity as (typeof ROOM_CAPACITIES)[number])) {
      throw new Error("Room capacity is invalid.");
    }

    const viewType = viewTypeRaw || null;
    if (viewType && !ROOM_VIEWS.includes(viewType as (typeof ROOM_VIEWS)[number])) {
      throw new Error("View type must be empty, sea, or mountain.");
    }

    if (!(await hotelExists(hotelId))) {
      throw new Error("Hotel reference is invalid.");
    }

    await db.execute(sql`
      UPDATE room
      SET price = ${price},
          capacity = ${capacity},
          view_type = ${viewType},
          extendible = ${extendible}
      WHERE room_number = ${roomNumber}
        AND hotel_id = ${hotelId}
    `);

    revalidateAdminCrud();
    destination = withMessage(returnPath, "notice", "Room updated.");
  } catch (error) {
    destination = withMessage(returnPath, "error", mapDbError(error, "Room update failed."));
  }

  redirect(destination);
}

export async function deleteRoomAction(formData: FormData): Promise<void> {
  // Admin role required
  const session = await requireRole("admin");
  if (!session) {
    redirect("/?unauthorized=true");
  }

  const returnPath = readString(formData.get("returnPath")) || "/admin/rooms";
  let destination = returnPath;

  try {
    const roomNumber = readPositiveInt(formData.get("roomNumber"), "Room number");
    const hotelId = readPositiveInt(formData.get("hotelId"), "Hotel ID");

    if (await roomHasLiveReferences(hotelId, roomNumber)) {
      throw new Error("Room cannot be deleted while bookings or rentings reference it.");
    }

    await db.execute(sql`
      DELETE FROM room
      WHERE room_number = ${roomNumber}
        AND hotel_id = ${hotelId}
    `);

    revalidateAdminCrud();
    destination = withMessage(returnPath, "notice", "Room deleted.");
  } catch (error) {
    destination = withMessage(returnPath, "error", mapDbError(error, "Room deletion failed."));
  }

  redirect(destination);
}


