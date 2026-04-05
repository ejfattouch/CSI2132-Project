CREATE TABLE "booking" (
	"booking_id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"hotel_id" integer NOT NULL,
	"room_number" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	CONSTRAINT "booking_date_check" CHECK ("booking"."end_date" > "booking"."start_date")
);
--> statement-breakpoint
CREATE TABLE "booking_archive" (
	"archive_id" serial PRIMARY KEY NOT NULL,
	"original_booking_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"customer_name" varchar(100) NOT NULL,
	"hotel_id" integer NOT NULL,
	"hotel_address" varchar(255) NOT NULL,
	"chain_name" varchar(100) NOT NULL,
	"room_number" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"archived_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer" (
	"customer_id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"address" varchar(255) NOT NULL,
	"id_type" varchar(20) NOT NULL,
	"registration_date" date DEFAULT now() NOT NULL,
	CONSTRAINT "id_type_check" CHECK ("customer"."id_type" IN ('SSN', 'SIN', 'DriverLicense', 'Passport'))
);
--> statement-breakpoint
CREATE TABLE "employee" (
	"ssn" varchar(11) PRIMARY KEY NOT NULL,
	"hotel_id" integer NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"address" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotel" (
	"hotel_id" serial NOT NULL,
	"hotel_chain_central_address" varchar(255) NOT NULL,
	"address" varchar(255) NOT NULL,
	"star_rating" integer NOT NULL,
	"email" varchar(100) NOT NULL,
	"manager_ssn" varchar(11),
	CONSTRAINT "hotel_hotel_id_pk" PRIMARY KEY("hotel_id"),
	CONSTRAINT "star_rating_check" CHECK ("hotel"."star_rating" >= 1 AND "hotel"."star_rating" <= 5)
);
--> statement-breakpoint
CREATE TABLE "hotel_chain" (
	"central_address" varchar(255) PRIMARY KEY NOT NULL,
	"chain_name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotel_chain_email" (
	"central_address" varchar(255) NOT NULL,
	"email_address" varchar(100) NOT NULL,
	CONSTRAINT "hotel_chain_email_central_address_email_address_pk" PRIMARY KEY("central_address","email_address")
);
--> statement-breakpoint
CREATE TABLE "hotel_chain_phone" (
	"central_address" varchar(255) NOT NULL,
	"phone_number" varchar(15) NOT NULL,
	CONSTRAINT "hotel_chain_phone_central_address_phone_number_pk" PRIMARY KEY("central_address","phone_number")
);
--> statement-breakpoint
CREATE TABLE "hotel_phone" (
	"hotel_id" integer NOT NULL,
	"phone_number" varchar(15) NOT NULL,
	CONSTRAINT "hotel_phone_hotel_id_phone_number_pk" PRIMARY KEY("hotel_id","phone_number")
);
--> statement-breakpoint
CREATE TABLE "renting" (
	"renting_id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"hotel_id" integer NOT NULL,
	"room_number" integer NOT NULL,
	"employee_ssn" varchar(11) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"booking_id" integer,
	"payment_amount" numeric(10, 2),
	"payment_date" date,
	"payment_status" varchar(20) DEFAULT 'pending',
	CONSTRAINT "renting_date_check" CHECK ("renting"."end_date" > "renting"."start_date"),
	CONSTRAINT "payment_status_check" CHECK ("renting"."payment_status" IN ('pending', 'paid', 'refunded'))
);
--> statement-breakpoint
CREATE TABLE "renting_archive" (
	"archive_id" serial PRIMARY KEY NOT NULL,
	"original_renting_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"customer_name" varchar(100) NOT NULL,
	"hotel_id" integer NOT NULL,
	"hotel_address" varchar(255) NOT NULL,
	"chain_name" varchar(100) NOT NULL,
	"room_number" integer NOT NULL,
	"employee_ssn" varchar(11) NOT NULL,
	"employee_name" varchar(100) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"payment_amount" numeric(10, 2),
	"payment_status" varchar(20),
	"archived_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room" (
	"room_number" integer NOT NULL,
	"hotel_id" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"capacity" varchar(20) NOT NULL,
	"view_type" varchar(20),
	"extendible" boolean DEFAULT false NOT NULL,
	CONSTRAINT "room_room_number_hotel_id_pk" PRIMARY KEY("room_number","hotel_id"),
	CONSTRAINT "price_check" CHECK ("room"."price" >= 0),
	CONSTRAINT "capacity_check" CHECK ("room"."capacity" IN ('single', 'double', 'suite', 'family')),
	CONSTRAINT "view_type_check" CHECK ("room"."view_type" IS NULL OR "room"."view_type" IN ('sea', 'mountain'))
);
--> statement-breakpoint
CREATE TABLE "room_amenities" (
	"room_number" integer NOT NULL,
	"hotel_id" integer NOT NULL,
	"amenity_type" varchar(50) NOT NULL,
	CONSTRAINT "room_amenities_room_number_hotel_id_amenity_type_pk" PRIMARY KEY("room_number","hotel_id","amenity_type")
);
--> statement-breakpoint
CREATE TABLE "room_problems" (
	"room_number" integer NOT NULL,
	"hotel_id" integer NOT NULL,
	"problem_type" varchar(100) NOT NULL,
	CONSTRAINT "room_problems_room_number_hotel_id_problem_type_pk" PRIMARY KEY("room_number","hotel_id","problem_type")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"email" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(20) NOT NULL,
	"customer_id" integer,
	"employee_ssn" varchar(11),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "role_check" CHECK ("user"."role" IN ('customer', 'employee', 'admin'))
);
--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_customer_id_customer_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("customer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_hotel_id_hotel_hotel_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotel"("hotel_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee" ADD CONSTRAINT "employee_hotel_id_hotel_hotel_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotel"("hotel_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel" ADD CONSTRAINT "hotel_hotel_chain_central_address_hotel_chain_central_address_fk" FOREIGN KEY ("hotel_chain_central_address") REFERENCES "public"."hotel_chain"("central_address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_chain_email" ADD CONSTRAINT "hotel_chain_email_central_address_hotel_chain_central_address_fk" FOREIGN KEY ("central_address") REFERENCES "public"."hotel_chain"("central_address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_chain_phone" ADD CONSTRAINT "hotel_chain_phone_central_address_hotel_chain_central_address_fk" FOREIGN KEY ("central_address") REFERENCES "public"."hotel_chain"("central_address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_phone" ADD CONSTRAINT "hotel_phone_hotel_id_hotel_hotel_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotel"("hotel_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "renting" ADD CONSTRAINT "renting_customer_id_customer_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("customer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "renting" ADD CONSTRAINT "renting_hotel_id_hotel_hotel_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotel"("hotel_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "renting" ADD CONSTRAINT "renting_employee_ssn_employee_ssn_fk" FOREIGN KEY ("employee_ssn") REFERENCES "public"."employee"("ssn") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "renting" ADD CONSTRAINT "renting_booking_id_booking_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("booking_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_hotel_id_hotel_hotel_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotel"("hotel_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_customer_id_customer_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("customer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_employee_ssn_employee_ssn_fk" FOREIGN KEY ("employee_ssn") REFERENCES "public"."employee"("ssn") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE VIEW "public"."hotel_capacity" AS (
  SELECT
    h.hotel_id,
    h.address AS hotel_address,
    hc.chain_name,
    h.star_rating,
    COUNT(r.room_number) AS total_rooms,
    COUNT(CASE WHEN r.capacity = 'single' THEN 1 END) AS single_rooms,
    COUNT(CASE WHEN r.capacity = 'double' THEN 1 END) AS double_rooms,
    COUNT(CASE WHEN r.capacity = 'suite' THEN 1 END) AS suite_rooms,
    COUNT(CASE WHEN r.capacity = 'family' THEN 1 END) AS family_rooms,
    SUM(CASE
      WHEN r.capacity = 'single' THEN 1
      WHEN r.capacity = 'double' THEN 2
      WHEN r.capacity = 'suite' THEN 2
      WHEN r.capacity = 'family' THEN 4
      ELSE 0
    END) AS total_guest_capacity
  FROM hotel h
  JOIN hotel_chain hc ON h.hotel_chain_central_address = hc.central_address
  LEFT JOIN room r ON h.hotel_id = r.hotel_id
  GROUP BY h.hotel_id, h.address, hc.chain_name, h.star_rating
);--> statement-breakpoint
CREATE VIEW "public"."rooms_per_area" AS (
  SELECT
    h.address AS area,
    COUNT(r.room_number) AS available_rooms
  FROM hotel h
  JOIN room r ON h.hotel_id = r.hotel_id
  WHERE NOT EXISTS (
    SELECT 1 FROM booking b
    WHERE b.hotel_id = r.hotel_id
      AND b.room_number = r.room_number
      AND CURRENT_DATE BETWEEN b.start_date AND b.end_date
  )
  AND NOT EXISTS (
    SELECT 1 FROM renting rt
    WHERE rt.hotel_id = r.hotel_id
      AND rt.room_number = r.room_number
      AND CURRENT_DATE BETWEEN rt.start_date AND rt.end_date
  )
  GROUP BY h.address
);