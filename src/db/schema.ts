import {
  pgTable,
  varchar,
  integer,
  boolean,
  date,
  decimal,
  primaryKey,
  serial,
  timestamp,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ============================================
// HOTEL CHAIN
// ============================================
export const hotelChain = pgTable("hotel_chain", {
  centralAddress: varchar("central_address", { length: 255 }).primaryKey(),
  chainName: varchar("chain_name", { length: 100 }).notNull(),
});

export const hotelChainPhone = pgTable(
  "hotel_chain_phone",
  {
    centralAddress: varchar("central_address", { length: 255 })
      .notNull()
      .references(() => hotelChain.centralAddress, { onDelete: "cascade" }),
    phoneNumber: varchar("phone_number", { length: 15 }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.centralAddress, table.phoneNumber] }),
  ]
);

export const hotelChainEmail = pgTable(
  "hotel_chain_email",
  {
    centralAddress: varchar("central_address", { length: 255 })
      .notNull()
      .references(() => hotelChain.centralAddress, { onDelete: "cascade" }),
    emailAddress: varchar("email_address", { length: 100 }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.centralAddress, table.emailAddress] }),
  ]
);

// ============================================
// HOTEL
// ============================================
export const hotel = pgTable(
  "hotel",
  {
    hotelId: serial("hotel_id").notNull(),
    chainAddress: varchar("hotel_chain_central_address", { length: 255 })
      .notNull()
      .references(() => hotelChain.centralAddress, { onDelete: "cascade" }),
    address: varchar("address", { length: 255 }).notNull(),
    starRating: integer("star_rating").notNull(),
    email: varchar("email", { length: 100 }).notNull(),
    managerSsn: varchar("manager_ssn", { length: 11 }),
  },
  (table) => [
    primaryKey({ columns: [table.hotelId] }),
    check("star_rating_check", sql`${table.starRating} >= 1 AND ${table.starRating} <= 5`),
  ]
);

export const hotelPhone = pgTable(
  "hotel_phone",
  {
    hotelId: integer("hotel_id")
      .notNull()
      .references(() => hotel.hotelId, { onDelete: "cascade" }),
    phoneNumber: varchar("phone_number", { length: 15 }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.hotelId, table.phoneNumber] }),
  ]
);

// ============================================
// ROOM
// ============================================
export const room = pgTable(
  "room",
  {
    roomNumber: integer("room_number").notNull(),
    hotelId: integer("hotel_id")
      .notNull()
      .references(() => hotel.hotelId, { onDelete: "cascade" }),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    capacity: varchar("capacity", { length: 20 }).notNull(),
    viewType: varchar("view_type", { length: 20 }),
    extendible: boolean("extendible").notNull().default(false),
  },
  (table) => [
    primaryKey({ columns: [table.roomNumber, table.hotelId] }),
    check("price_check", sql`${table.price} >= 0`),
    check("capacity_check", sql`${table.capacity} IN ('single', 'double', 'suite', 'family')`),
    check("view_type_check", sql`${table.viewType} IS NULL OR ${table.viewType} IN ('sea', 'mountain')`),
  ]
);

export const roomAmenities = pgTable(
  "room_amenities",
  {
    roomNumber: integer("room_number").notNull(),
    hotelId: integer("hotel_id").notNull(),
    amenityType: varchar("amenity_type", { length: 50 }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.roomNumber, table.hotelId, table.amenityType] }),
  ]
);

export const roomProblems = pgTable(
  "room_problems",
  {
    roomNumber: integer("room_number").notNull(),
    hotelId: integer("hotel_id").notNull(),
    problemType: varchar("problem_type", { length: 100 }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.roomNumber, table.hotelId, table.problemType] }),
  ]
);

// ============================================
// EMPLOYEE
// ============================================
export const employee = pgTable("employee", {
  ssn: varchar("ssn", { length: 11 }).primaryKey(),
  hotelId: integer("hotel_id")
    .notNull()
    .references(() => hotel.hotelId, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
});

// ============================================
// CUSTOMER
// ============================================
export const customer = pgTable(
  "customer",
  {
    customerId: serial("customer_id").primaryKey(),
    fullName: varchar("full_name", { length: 100 }).notNull(),
    address: varchar("address", { length: 255 }).notNull(),
    idType: varchar("id_type", { length: 20 }).notNull(),
    registrationDate: date("registration_date").notNull().defaultNow(),
  },
  (table) => [
    check("id_type_check", sql`${table.idType} IN ('SSN', 'SIN', 'DriverLicense', 'Passport')`),
  ]
);

// ============================================
// BOOKING
// ============================================
export const booking = pgTable(
  "booking",
  {
    bookingId: serial("booking_id").primaryKey(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customer.customerId, { onDelete: "cascade" }),
    hotelId: integer("hotel_id")
      .notNull()
      .references(() => hotel.hotelId, { onDelete: "cascade" }),
    roomNumber: integer("room_number").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
  },
  (table) => [
    check("booking_date_check", sql`${table.endDate} > ${table.startDate}`),
  ]
);

// ============================================
// RENTING (with payment info - feedback fix)
// ============================================
export const renting = pgTable(
  "renting",
  {
    rentingId: serial("renting_id").primaryKey(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customer.customerId, { onDelete: "cascade" }),
    hotelId: integer("hotel_id")
      .notNull()
      .references(() => hotel.hotelId, { onDelete: "cascade" }),
    roomNumber: integer("room_number").notNull(),
    employeeSsn: varchar("employee_ssn", { length: 11 })
      .notNull()
      .references(() => employee.ssn, { onDelete: "restrict" }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    // Booking reference (feedback fix: show booking -> renting relationship)
    bookingId: integer("booking_id").references(() => booking.bookingId, { onDelete: "set null" }),
    // Payment info (feedback fix)
    paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }),
    paymentDate: date("payment_date"),
    paymentStatus: varchar("payment_status", { length: 20 }).default("pending"),
  },
  (table) => [
    check("renting_date_check", sql`${table.endDate} > ${table.startDate}`),
    check("payment_status_check", sql`${table.paymentStatus} IN ('pending', 'paid', 'refunded')`),
  ]
);

// ============================================
// ARCHIVE TABLES (feedback fix)
// These store historical data independently of live tables
// ============================================
export const bookingArchive = pgTable("booking_archive", {
  archiveId: serial("archive_id").primaryKey(),
  // Original booking data (denormalized for independence)
  originalBookingId: integer("original_booking_id").notNull(),
  customerId: integer("customer_id").notNull(),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  hotelId: integer("hotel_id").notNull(),
  hotelAddress: varchar("hotel_address", { length: 255 }).notNull(),
  chainName: varchar("chain_name", { length: 100 }).notNull(),
  roomNumber: integer("room_number").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  archivedAt: timestamp("archived_at").notNull().defaultNow(),
});

export const rentingArchive = pgTable("renting_archive", {
  archiveId: serial("archive_id").primaryKey(),
  // Original renting data (denormalized for independence)
  originalRentingId: integer("original_renting_id").notNull(),
  customerId: integer("customer_id").notNull(),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  hotelId: integer("hotel_id").notNull(),
  hotelAddress: varchar("hotel_address", { length: 255 }).notNull(),
  chainName: varchar("chain_name", { length: 100 }).notNull(),
  roomNumber: integer("room_number").notNull(),
  employeeSsn: varchar("employee_ssn", { length: 11 }).notNull(),
  employeeName: varchar("employee_name", { length: 100 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }),
  paymentStatus: varchar("payment_status", { length: 20 }),
  archivedAt: timestamp("archived_at").notNull().defaultNow(),
});

// ============================================
// RELATIONS (for Drizzle query builder)
// ============================================
export const hotelChainRelations = relations(hotelChain, ({ many }) => ({
  hotels: many(hotel),
  phones: many(hotelChainPhone),
  emails: many(hotelChainEmail),
}));

export const hotelRelations = relations(hotel, ({ one, many }) => ({
  chain: one(hotelChain, {
    fields: [hotel.chainAddress],
    references: [hotelChain.centralAddress],
  }),
  rooms: many(room),
  employees: many(employee),
  phones: many(hotelPhone),
  bookings: many(booking),
  rentings: many(renting),
}));

export const roomRelations = relations(room, ({ one, many }) => ({
  hotel: one(hotel, {
    fields: [room.hotelId],
    references: [hotel.hotelId],
  }),
  amenities: many(roomAmenities),
  problems: many(roomProblems),
}));

export const employeeRelations = relations(employee, ({ one, many }) => ({
  hotel: one(hotel, {
    fields: [employee.hotelId],
    references: [hotel.hotelId],
  }),
  rentings: many(renting),
}));

export const customerRelations = relations(customer, ({ many }) => ({
  bookings: many(booking),
  rentings: many(renting),
}));

export const bookingRelations = relations(booking, ({ one }) => ({
  customer: one(customer, {
    fields: [booking.customerId],
    references: [customer.customerId],
  }),
  hotel: one(hotel, {
    fields: [booking.hotelId],
    references: [hotel.hotelId],
  }),
  room: one(room, {
    fields: [booking.roomNumber, booking.hotelId],
    references: [room.roomNumber, room.hotelId],
  }),
}));

export const rentingRelations = relations(renting, ({ one }) => ({
  customer: one(customer, {
    fields: [renting.customerId],
    references: [customer.customerId],
  }),
  hotel: one(hotel, {
    fields: [renting.hotelId],
    references: [hotel.hotelId],
  }),
  room: one(room, {
    fields: [renting.roomNumber, renting.hotelId],
    references: [room.roomNumber, room.hotelId],
  }),
  employee: one(employee, {
    fields: [renting.employeeSsn],
    references: [employee.ssn],
  }),
  booking: one(booking, {
    fields: [renting.bookingId],
    references: [booking.bookingId],
  }),
}));

// ============================================
// SQL VIEWS (read-only report tables)
// ============================================
export const roomsPerArea = pgTable("rooms_per_area", {
  area: varchar("area", { length: 255 }).notNull(),
  availableRooms: integer("available_rooms").notNull(),
});

export const hotelCapacity = pgTable("hotel_capacity", {
  hotelId: integer("hotel_id").notNull(),
  hotelAddress: varchar("hotel_address", { length: 255 }).notNull(),
  chainName: varchar("chain_name", { length: 100 }).notNull(),
  starRating: integer("star_rating").notNull(),
  totalRooms: integer("total_rooms").notNull(),
  singleRooms: integer("single_rooms").notNull(),
  doubleRooms: integer("double_rooms").notNull(),
  suiteRooms: integer("suite_rooms").notNull(),
  familyRooms: integer("family_rooms").notNull(),
  totalGuestCapacity: integer("total_guest_capacity").notNull(),
});

// ============================================
// AUTHENTICATION (Role-based access control)
// ============================================
export const user = pgTable(
  "user",
  {
    userId: serial("user_id").primaryKey(),
    email: varchar("email", { length: 100 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    // Role enum: customer, employee, admin
    role: varchar("role", { length: 20 }).notNull(),
    // Link to customer (if role = customer)
    customerId: integer("customer_id").references(() => customer.customerId, { onDelete: "cascade" }),
    // Link to employee (if role = employee or admin)
    employeeSsn: varchar("employee_ssn", { length: 11 }).references(() => employee.ssn, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    check("role_check", sql`${table.role} IN ('customer', 'employee', 'admin')`),
  ]
);

// ============================================
// TYPE EXPORTS
// ============================================
export type HotelChain = typeof hotelChain.$inferSelect;
export type NewHotelChain = typeof hotelChain.$inferInsert;
export type Hotel = typeof hotel.$inferSelect;
export type NewHotel = typeof hotel.$inferInsert;
export type Room = typeof room.$inferSelect;
export type NewRoom = typeof room.$inferInsert;
export type Employee = typeof employee.$inferSelect;
export type NewEmployee = typeof employee.$inferInsert;
export type Customer = typeof customer.$inferSelect;
export type NewCustomer = typeof customer.$inferInsert;
export type Booking = typeof booking.$inferSelect;
export type NewBooking = typeof booking.$inferInsert;
export type Renting = typeof renting.$inferSelect;
export type NewRenting = typeof renting.$inferInsert;
export type RoomsPerArea = typeof roomsPerArea.$inferSelect;
export type HotelCapacity = typeof hotelCapacity.$inferSelect;
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
