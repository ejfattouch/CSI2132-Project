-- ============================================
-- e-Hotels Database Migrations
-- Views, Triggers, and Indexes
-- Run after schema creation: psql -d ehotels -f migrations.sql
-- ============================================

-- ============================================
-- VIEWS (Requirement 2f - 5%)
-- ============================================

-- View 1: Number of available rooms per area
CREATE OR REPLACE VIEW rooms_per_area AS
SELECT
    h.address AS area,
    COUNT(r.room_number) AS available_rooms
FROM hotel h
JOIN room r ON h.hotel_id = r.hotel_id
WHERE NOT EXISTS (
    SELECT 1 FROM booking b
    WHERE b.room_number = r.room_number
      AND b.hotel_id = r.hotel_id
      AND CURRENT_DATE BETWEEN b.start_date AND b.end_date
)
AND NOT EXISTS (
    SELECT 1 FROM renting rt
    WHERE rt.room_number = r.room_number
      AND rt.hotel_id = r.hotel_id
      AND CURRENT_DATE BETWEEN rt.start_date AND rt.end_date
)
GROUP BY h.address
ORDER BY available_rooms DESC;

-- View 2: Aggregated capacity of all rooms per hotel
CREATE OR REPLACE VIEW hotel_capacity AS
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
    SUM(
        CASE
            WHEN r.capacity = 'single' THEN 1
            WHEN r.capacity = 'double' THEN 2
            WHEN r.capacity = 'suite' THEN 3
            WHEN r.capacity = 'family' THEN 4
            ELSE 0
        END
    ) AS total_guest_capacity
FROM hotel h
JOIN hotel_chain hc ON h.hotel_chain_central_address = hc.central_address
LEFT JOIN room r ON h.hotel_id = r.hotel_id
GROUP BY h.hotel_id, h.address, hc.chain_name, h.star_rating
ORDER BY hc.chain_name, h.hotel_id;

-- ============================================
-- TRIGGERS (Requirement 2d - 10%)
-- ============================================

-- Trigger 1: Archive booking before deletion
-- Preserves historical booking data even when the booking is deleted
CREATE OR REPLACE FUNCTION archive_booking_func()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO booking_archive (
        original_booking_id, customer_id, customer_name,
        hotel_id, hotel_address, chain_name,
        room_number, start_date, end_date
    )
    SELECT
        OLD.booking_id, OLD.customer_id, c.full_name,
        OLD.hotel_id, h.address, hc.chain_name,
        OLD.room_number, OLD.start_date, OLD.end_date
    FROM customer c, hotel h, hotel_chain hc
    WHERE c.customer_id = OLD.customer_id
      AND h.hotel_id = OLD.hotel_id
      AND h.hotel_chain_central_address = hc.central_address;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS archive_booking_trigger ON booking;
CREATE TRIGGER archive_booking_trigger
    BEFORE DELETE ON booking
    FOR EACH ROW EXECUTE FUNCTION archive_booking_func();

-- Trigger 2: Archive renting before deletion
-- Preserves historical renting data including payment info
CREATE OR REPLACE FUNCTION archive_renting_func()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO renting_archive (
        original_renting_id, customer_id, customer_name,
        hotel_id, hotel_address, chain_name,
        room_number, employee_ssn, employee_name,
        start_date, end_date, payment_amount, payment_status
    )
    SELECT
        OLD.renting_id, OLD.customer_id, c.full_name,
        OLD.hotel_id, h.address, hc.chain_name,
        OLD.room_number, OLD.employee_ssn, e.full_name,
        OLD.start_date, OLD.end_date, OLD.payment_amount, OLD.payment_status
    FROM customer c, hotel h, hotel_chain hc, employee e
    WHERE c.customer_id = OLD.customer_id
      AND h.hotel_id = OLD.hotel_id
      AND h.hotel_chain_central_address = hc.central_address
      AND e.ssn = OLD.employee_ssn;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS archive_renting_trigger ON renting;
CREATE TRIGGER archive_renting_trigger
    BEFORE DELETE ON renting
    FOR EACH ROW EXECUTE FUNCTION archive_renting_func();

-- ============================================
-- INDEXES (Requirement 2e - 5%)
-- ============================================

-- Index 1: Room search by hotel and price
-- Justification: Customers frequently search for rooms within a price range.
-- This composite index speeds up queries filtering by hotel_id and sorting/filtering by price.
CREATE INDEX IF NOT EXISTS idx_room_hotel_price ON room(hotel_id, price);

-- Index 2: Booking date range searches
-- Justification: Availability checks require finding overlapping date ranges.
-- This index accelerates the OVERLAPS queries used in booking overlap prevention.
CREATE INDEX IF NOT EXISTS idx_booking_dates ON booking(hotel_id, room_number, start_date, end_date);

-- Index 3: Renting date range searches
-- Justification: Similar to bookings, renting queries need fast date overlap checks.
-- This index speeds up current occupancy lookups and the overlap trigger.
CREATE INDEX IF NOT EXISTS idx_renting_dates ON renting(hotel_id, room_number, start_date, end_date);
