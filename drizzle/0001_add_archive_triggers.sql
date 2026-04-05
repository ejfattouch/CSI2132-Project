-- Custom SQL migration file, put your code below! --
-- 1. Create the function for archiving bookings
CREATE OR REPLACE FUNCTION archive_booking_on_delete()
RETURNS TRIGGER AS $$
DECLARE
v_customer_name varchar(100);
    v_hotel_address varchar(255);
    v_chain_name varchar(100);
BEGIN
    -- Fetch customer name
SELECT full_name INTO v_customer_name FROM customer WHERE customer_id = OLD.customer_id;

-- Fetch hotel address and chain name
SELECT h.address, hc.chain_name INTO v_hotel_address, v_chain_name
FROM hotel h
         JOIN hotel_chain hc ON h.hotel_chain_central_address = hc.central_address
WHERE h.hotel_id = OLD.hotel_id;

-- Insert into archive
INSERT INTO booking_archive (
    original_booking_id, customer_id, customer_name,
    hotel_id, hotel_address, chain_name,
    room_number, start_date, end_date
) VALUES (
             OLD.booking_id, OLD.customer_id, COALESCE(v_customer_name, 'Unknown'),
             OLD.hotel_id, COALESCE(v_hotel_address, 'Unknown'), COALESCE(v_chain_name, 'Unknown'),
             OLD.room_number, OLD.start_date, OLD.end_date
         );

RETURN OLD;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- 2. Bind the booking trigger to the table
CREATE TRIGGER trigger_archive_booking
    AFTER DELETE ON booking
    FOR EACH ROW EXECUTE FUNCTION archive_booking_on_delete();
--> statement-breakpoint

-- 3. Create the function for archiving rentings
CREATE OR REPLACE FUNCTION archive_renting_on_delete()
RETURNS TRIGGER AS $$
DECLARE
v_customer_name varchar(100);
    v_hotel_address varchar(255);
    v_chain_name varchar(100);
    v_employee_name varchar(100);
BEGIN
    -- Fetch customer name
SELECT full_name INTO v_customer_name FROM customer WHERE customer_id = OLD.customer_id;

-- Fetch employee name
SELECT full_name INTO v_employee_name FROM employee WHERE ssn = OLD.employee_ssn;

-- Fetch hotel address and chain name
SELECT h.address, hc.chain_name INTO v_hotel_address, v_chain_name
FROM hotel h
         JOIN hotel_chain hc ON h.hotel_chain_central_address = hc.central_address
WHERE h.hotel_id = OLD.hotel_id;

-- Insert into archive
INSERT INTO renting_archive (
    original_renting_id, customer_id, customer_name,
    hotel_id, hotel_address, chain_name,
    room_number, employee_ssn, employee_name,
    start_date, end_date, payment_amount, payment_status
) VALUES (
             OLD.renting_id, OLD.customer_id, COALESCE(v_customer_name, 'Unknown'),
             OLD.hotel_id, COALESCE(v_hotel_address, 'Unknown'), COALESCE(v_chain_name, 'Unknown'),
             OLD.room_number, OLD.employee_ssn, COALESCE(v_employee_name, 'Unknown'),
             OLD.start_date, OLD.end_date, OLD.payment_amount, OLD.payment_status
         );

RETURN OLD;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- 4. Bind the renting trigger to the table
CREATE TRIGGER trigger_archive_renting
    AFTER DELETE ON renting
    FOR EACH ROW EXECUTE FUNCTION archive_renting_on_delete();