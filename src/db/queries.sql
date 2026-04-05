-- ============================================
-- e-Hotels Database Queries (Requirement 2c - 10%)
-- At least 4 queries, including:
--   - At least 1 with aggregation
--   - At least 1 with nested query
-- ============================================

-- ============================================
-- QUERY 1: Aggregation Query
-- Average room price by hotel star rating
-- ============================================
-- Purpose: Helps management understand pricing trends across hotel categories
-- Aggregation: AVG(), COUNT(), GROUP BY

SELECT
    h.star_rating,
    COUNT(DISTINCT h.hotel_id) AS num_hotels,
    COUNT(r.room_number) AS total_rooms,
    ROUND(AVG(r.price::numeric), 2) AS avg_room_price,
    MIN(r.price::numeric) AS min_price,
    MAX(r.price::numeric) AS max_price
FROM hotel h
JOIN room r ON h.hotel_id = r.hotel_id
GROUP BY h.star_rating
ORDER BY h.star_rating DESC;


-- ============================================
-- QUERY 2: Nested Query (Subquery)
-- Find customers who have made bookings but never completed a renting
-- ============================================
-- Purpose: Identify customers who book but don't show up (no-shows)
-- Nested: Uses NOT EXISTS subquery

SELECT
    c.customer_id,
    c.full_name,
    c.address,
    COUNT(b.booking_id) AS total_bookings
FROM customer c
JOIN booking b ON c.customer_id = b.customer_id
WHERE NOT EXISTS (
    SELECT 1
    FROM renting r
    WHERE r.customer_id = c.customer_id
)
GROUP BY c.customer_id, c.full_name, c.address
ORDER BY total_bookings DESC;


-- ============================================
-- QUERY 3: Join Query with Multiple Tables
-- Available rooms with full hotel and chain details for a date range
-- ============================================
-- Purpose: Core search functionality - find available rooms with all details
-- Features: Multiple JOINs, date filtering, NOT EXISTS for availability

SELECT
    hc.chain_name,
    h.star_rating,
    h.address AS hotel_address,
    r.room_number,
    r.capacity,
    r.price,
    r.view_type,
    r.extendible
FROM room r
JOIN hotel h ON r.hotel_id = h.hotel_id
JOIN hotel_chain hc ON h.hotel_chain_central_address = hc.central_address
WHERE NOT EXISTS (
    -- No overlapping bookings
    SELECT 1 FROM booking b
    WHERE b.hotel_id = r.hotel_id
      AND b.room_number = r.room_number
      AND (DATE '2026-04-15', DATE '2026-04-20') OVERLAPS (b.start_date, b.end_date)
)
AND NOT EXISTS (
    -- No overlapping rentings
    SELECT 1 FROM renting rt
    WHERE rt.hotel_id = r.hotel_id
      AND rt.room_number = r.room_number
      AND (DATE '2026-04-15', DATE '2026-04-20') OVERLAPS (rt.start_date, rt.end_date)
)
ORDER BY hc.chain_name, h.star_rating DESC, r.price;


-- ============================================
-- QUERY 4: Nested Query with Aggregation
-- Hotels with above-average number of rooms in their chain
-- ============================================
-- Purpose: Identify larger properties within each chain
-- Features: Correlated subquery, aggregation in subquery

SELECT
    hc.chain_name,
    h.hotel_id,
    h.address,
    h.star_rating,
    COUNT(r.room_number) AS room_count
FROM hotel h
JOIN hotel_chain hc ON h.hotel_chain_central_address = hc.central_address
JOIN room r ON h.hotel_id = r.hotel_id
GROUP BY hc.chain_name, h.hotel_id, h.address, h.star_rating
HAVING COUNT(r.room_number) > (
    -- Subquery: average rooms per hotel in the same chain
    SELECT AVG(room_cnt)
    FROM (
        SELECT COUNT(r2.room_number) AS room_cnt
        FROM hotel h2
        JOIN room r2 ON h2.hotel_id = r2.hotel_id
        WHERE h2.hotel_chain_central_address = h.hotel_chain_central_address
        GROUP BY h2.hotel_id
    ) AS chain_avg
)
ORDER BY hc.chain_name, room_count DESC;


-- ============================================
-- QUERY 5: Revenue Analysis (Aggregation)
-- Total revenue by hotel chain from completed rentings
-- ============================================
-- Purpose: Financial reporting for management
-- Aggregation: SUM(), COUNT(), GROUP BY with multiple levels

SELECT
    hc.chain_name,
    COUNT(DISTINCT h.hotel_id) AS num_hotels,
    COUNT(rt.renting_id) AS total_rentings,
    COUNT(CASE WHEN rt.payment_status = 'paid' THEN 1 END) AS paid_rentings,
    COALESCE(SUM(rt.payment_amount::numeric), 0) AS total_revenue
FROM hotel_chain hc
JOIN hotel h ON hc.central_address = h.hotel_chain_central_address
LEFT JOIN renting rt ON h.hotel_id = rt.hotel_id
GROUP BY hc.chain_name
ORDER BY total_revenue DESC;


-- ============================================
-- QUERY 6: Employee Workload Analysis
-- Number of rentings processed by each employee
-- ============================================
-- Purpose: Track employee performance and workload distribution
-- Features: LEFT JOIN to include employees with zero rentings

SELECT
    e.ssn,
    e.full_name,
    e.role,
    h.address AS hotel_address,
    COUNT(rt.renting_id) AS rentings_processed,
    COALESCE(SUM(rt.payment_amount::numeric), 0) AS total_payments_collected
FROM employee e
JOIN hotel h ON e.hotel_id = h.hotel_id
LEFT JOIN renting rt ON e.ssn = rt.employee_ssn
GROUP BY e.ssn, e.full_name, e.role, h.address
ORDER BY rentings_processed DESC;
