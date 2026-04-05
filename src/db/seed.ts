import { drizzle } from "drizzle-orm/node-postgres";
import {eq, sql} from "drizzle-orm";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import crypto from "crypto";
import {
  hotelChain,
  hotelChainPhone,
  hotelChainEmail,
  hotel,
  hotelPhone,
  room,
  roomAmenities,
  roomProblems,
  employee,
  customer,
  booking,
  renting,
  user,
} from "./schema";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Hash a password using PBKDF2
 */
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

// ============================================
// SEED DATA
// ============================================

const hotelChains = [
  { centralAddress: "100 King Street West, Toronto, ON M5X 1A9", chainName: "Marriott International" },
  { centralAddress: "7100 Corporate Drive, Plano, TX 75024", chainName: "Hilton Hotels & Resorts" },
  { centralAddress: "1 Starwood Lane, Stamford, CT 06902", chainName: "Hyatt Hotels Corporation" },
  { centralAddress: "3 Ravinia Drive, Atlanta, GA 30346", chainName: "InterContinental Hotels Group" },
  { centralAddress: "10400 Fernwood Road, Bethesda, MD 20817", chainName: "Wyndham Hotels & Resorts" },
];

const hotelChainPhones = [
  { centralAddress: "100 King Street West, Toronto, ON M5X 1A9", phoneNumber: "1-800-228-9290" },
  { centralAddress: "100 King Street West, Toronto, ON M5X 1A9", phoneNumber: "1-800-321-7396" },
  { centralAddress: "7100 Corporate Drive, Plano, TX 75024", phoneNumber: "1-800-445-8667" },
  { centralAddress: "1 Starwood Lane, Stamford, CT 06902", phoneNumber: "1-800-233-1234" },
  { centralAddress: "3 Ravinia Drive, Atlanta, GA 30346", phoneNumber: "1-800-465-4329" },
  { centralAddress: "10400 Fernwood Road, Bethesda, MD 20817", phoneNumber: "1-800-466-1589" },
];

const hotelChainEmails = [
  { centralAddress: "100 King Street West, Toronto, ON M5X 1A9", emailAddress: "contact@marriott.com" },
  { centralAddress: "7100 Corporate Drive, Plano, TX 75024", emailAddress: "guest.services@hilton.com" },
  { centralAddress: "1 Starwood Lane, Stamford, CT 06902", emailAddress: "info@hyatt.com" },
  { centralAddress: "3 Ravinia Drive, Atlanta, GA 30346", emailAddress: "support@ihg.com" },
  { centralAddress: "10400 Fernwood Road, Bethesda, MD 20817", emailAddress: "help@wyndham.com" },
];

// Areas for hotels (requirement: at least 2 hotels in same area)
const areas = [
  "Toronto Downtown",
  "Toronto Airport",
  "Montreal Downtown",
  "Vancouver Downtown",
  "Vancouver Airport",
  "Calgary Downtown",
  "Ottawa Downtown",
  "New York Times Square",
  "New York JFK Airport",
  "Los Angeles Downtown",
  "Miami Beach",
  "Chicago Downtown",
  "Boston Downtown",
  "Seattle Downtown",
];

// Generate hotels: 5 chains x 8 hotels = 40 hotels
// Star ratings distributed across 1-5 (at least 3 categories per chain)
const generateHotels = () => {
  const hotels: Array<{
    hotelId: number;
    chainAddress: string;
    address: string;
    starRating: number;
    email: string;
    managerSsn: string | null;
  }> = [];

  let hotelId = 1;

  hotelChains.forEach((chain, chainIndex) => {
    // Each chain gets 8 hotels with varying star ratings (at least 3 different ratings)
    const starRatings = [3, 4, 5, 3, 4, 5, 4, 3]; // Mix of ratings

    for (let i = 0; i < 8; i++) {
      const areaIndex = (chainIndex * 3 + i) % areas.length;
      hotels.push({
        hotelId: hotelId,
        chainAddress: chain.centralAddress,
        address: `${100 + i * 10} ${areas[areaIndex]} Street, ${areas[areaIndex]}`,
        starRating: starRatings[i],
        email: `hotel${hotelId}@${chain.chainName.toLowerCase().replace(/[^a-z]/g, "")}.com`,
        managerSsn: null, // Will be set after employees are created
      });
      hotelId++;
    }
  });

  return hotels;
};

// Generate employees: at least 3 per hotel (1 manager + 2 staff)
const generateEmployees = (hotels: ReturnType<typeof generateHotels>) => {
  const employees: Array<{
    ssn: string;
    hotelId: number;
    fullName: string;
    address: string;
    role: string;
  }> = [];

  const roles = ["Manager", "Receptionist", "Housekeeper", "Concierge", "Chef"];
  const firstNames = [
    "James", "Mary", "Robert", "Patricia", "Michael", "Jennifer", "William", "Linda",
    "Richard", "Elizabeth", "Joseph", "Barbara", "Thomas", "Susan", "Christopher", "Jessica",
    "Charles", "Sarah", "Daniel", "Karen", "Matthew", "Lisa", "Anthony", "Nancy",
    "Mark", "Betty", "Donald", "Margaret", "Steven", "Sandra", "Paul", "Ashley",
    "Andrew", "Kimberly", "Joshua", "Emily", "Kenneth", "Donna", "Kevin", "Michelle",
    "Brian", "Dorothy", "George", "Carol", "Timothy", "Amanda", "Ronald", "Melissa",
    "Edward", "Deborah", "Jason", "Stephanie", "Jeffrey", "Rebecca", "Ryan", "Sharon",
    "Jacob", "Laura", "Gary", "Cynthia", "Nicholas", "Kathleen", "Eric", "Amy",
    "Jonathan", "Angela", "Stephen", "Shirley", "Larry", "Anna", "Justin", "Brenda",
    "Scott", "Pamela", "Brandon", "Emma", "Benjamin", "Nicole", "Samuel", "Helen",
    "Raymond", "Samantha", "Gregory", "Katherine", "Frank", "Christine", "Alexander", "Debra",
    "Patrick", "Rachel", "Jack", "Carolyn", "Dennis", "Janet", "Jerry", "Catherine"
  ];
  const lastNames = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
    "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
    "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
    "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
    "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
    "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker",
    "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy",
    "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey",
    "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
    "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza",
    "Ruiz", "Hughes", "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers"
  ];

  let employeeIndex = 0;
  hotels.forEach((h, hotelIndex) => {
    // 3-5 employees per hotel
    const numEmployees = 3 + (hotelIndex % 3);

    for (let i = 0; i < numEmployees; i++) {
      const ssn = `${String(hotelIndex + 1).padStart(3, "0")}-${String(i + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      // Use employeeIndex to ensure unique name combinations
      const firstName = firstNames[employeeIndex % firstNames.length];
      const lastName = lastNames[Math.floor(employeeIndex / firstNames.length) % lastNames.length];

      employees.push({
        ssn,
        hotelId: h.hotelId,
        fullName: `${firstName} ${lastName}`,
        address: `${200 + employeeIndex * 5} Employee Ave, Suite ${employeeIndex + 1}`,
        role: i === 0 ? "Manager" : roles[(i % (roles.length - 1)) + 1],
      });
      employeeIndex++;
    }
  });

  return employees;
};

// Generate rooms: at least 5 per hotel with different capacities
const generateRooms = (hotels: ReturnType<typeof generateHotels>) => {
  const rooms: Array<{
    roomNumber: number;
    hotelId: number;
    price: string;
    capacity: string;
    viewType: string | null;
    extendible: boolean;
  }> = [];

  const capacities = ["single", "double", "suite", "family"];
  const views = ["sea", "mountain", null];

  hotels.forEach((h) => {
    // 5-7 rooms per hotel
    const numRooms = 5 + (h.hotelId % 3);
    const basePrice = h.starRating * 50; // Higher star = higher price

    for (let i = 0; i < numRooms; i++) {
      const capacity = capacities[i % capacities.length];
      const capacityMultiplier = capacities.indexOf(capacity) + 1;

      rooms.push({
        roomNumber: 100 + i + 1,
        hotelId: h.hotelId,
        price: String(basePrice + capacityMultiplier * 30 + (i * 10)),
        capacity,
        viewType: views[i % views.length],
        extendible: i % 2 === 0,
      });
    }
  });

  return rooms;
};

// Generate room amenities
const generateRoomAmenities = (rooms: ReturnType<typeof generateRooms>) => {
  const amenities: Array<{
    roomNumber: number;
    hotelId: number;
    amenityType: string;
  }> = [];

  const amenityTypes = ["TV", "WiFi", "Air Conditioning", "Mini Bar", "Safe", "Coffee Maker", "Balcony", "Jacuzzi"];

  rooms.forEach((r, index) => {
    // 2-4 amenities per room
    const numAmenities = 2 + (index % 3);
    for (let i = 0; i < numAmenities; i++) {
      amenities.push({
        roomNumber: r.roomNumber,
        hotelId: r.hotelId,
        amenityType: amenityTypes[(index + i) % amenityTypes.length],
      });
    }
  });

  return amenities;
};

// Generate some room problems (not all rooms have problems)
const generateRoomProblems = (rooms: ReturnType<typeof generateRooms>) => {
  const problems: Array<{
    roomNumber: number;
    hotelId: number;
    problemType: string;
  }> = [];

  const problemTypes = ["Leaky faucet", "Broken AC", "Stained carpet", "Squeaky door", "Cracked window"];

  // Only ~20% of rooms have problems
  rooms.filter((_, i) => i % 5 === 0).forEach((r, index) => {
    problems.push({
      roomNumber: r.roomNumber,
      hotelId: r.hotelId,
      problemType: problemTypes[index % problemTypes.length],
    });
  });

  return problems;
};

// Generate customers
const generateCustomers = () => {
  const customers: Array<{
    fullName: string;
    address: string;
    idType: string;
    registrationDate: string;
  }> = [];

  const firstNames = [
    "Oliver", "Emma", "Liam", "Ava", "Noah", "Sophia", "Ethan", "Isabella",
    "Mason", "Mia", "Lucas", "Charlotte", "Logan", "Amelia", "Aiden", "Harper",
    "Elijah", "Evelyn", "Sebastian", "Abigail", "Henry", "Ella", "Jackson", "Scarlett",
    "Carter", "Grace", "Owen", "Chloe", "Wyatt", "Victoria", "Jack", "Riley",
    "Luke", "Aria", "Jayden", "Lily", "Dylan", "Aubrey", "Grayson", "Zoey",
    "Levi", "Penelope", "Isaac", "Lillian", "Gabriel", "Addison", "Julian", "Layla",
    "Mateo", "Natalie", "Anthony", "Camila", "Jaxon", "Hannah", "Lincoln", "Brooklyn",
    "Joshua", "Zoe", "Christopher", "Nora", "Andrew", "Leah", "Theodore", "Savannah"
  ];
  const lastNames = [
    "Chen", "Patel", "O'Brien", "Kim", "Singh", "Nakamura", "Johansson", "Müller",
    "Fernandez", "Costa", "Ivanov", "Kowalski", "Andersen", "Schmidt", "Larsson", "Rossi",
    "Tanaka", "Sato", "Watanabe", "Yamamoto", "Suzuki", "Takahashi", "Kobayashi", "Yoshida",
    "Gupta", "Sharma", "Kumar", "Verma", "Joshi", "Kapoor", "Malhotra", "Mehta",
    "Dubois", "Bernard", "Moreau", "Laurent", "Simon", "Michel", "Lefebvre", "Leroy",
    "Becker", "Wagner", "Hoffmann", "Schulz", "Fischer", "Weber", "Meyer", "Richter",
    "O'Connor", "Murphy", "Kelly", "Sullivan", "McCarthy", "Walsh", "Burke", "Byrne",
    "Andersson", "Eriksson", "Karlsson", "Nilsson", "Lindberg", "Olsson", "Persson", "Svensson"
  ];
  const idTypes = ["SSN", "SIN", "DriverLicense", "Passport"];

  for (let i = 0; i < 30; i++) {
    const regDate = new Date();
    regDate.setDate(regDate.getDate() - Math.floor(Math.random() * 365));

    // Use index to get unique name combinations
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];

    customers.push({
      fullName: `${firstName} ${lastName}`,
      address: `${500 + i * 10} Customer Blvd, Apt ${i + 1}`,
      idType: idTypes[i % idTypes.length],
      registrationDate: regDate.toISOString().split("T")[0],
    });
  }

  return customers;
};

// Generate bookings
const generateBookings = (
  customers: Array<{ customerId: number }>,
  rooms: ReturnType<typeof generateRooms>
) => {
  const bookings: Array<{
    customerId: number;
    hotelId: number;
    roomNumber: number;
    startDate: string;
    endDate: string;
  }> = [];

  // Create 20 bookings
  for (let i = 0; i < 20; i++) {
    const customer = customers[i % customers.length];
    const room = rooms[i % rooms.length];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + i * 3 + 5); // Future bookings

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2 + (i % 5)); // 2-6 night stays

    bookings.push({
      customerId: customer.customerId,
      hotelId: room.hotelId,
      roomNumber: room.roomNumber,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    });
  }

  return bookings;
};

// Generate rentings (some from bookings, some walk-ins)
const generateRentings = (
  customers: Array<{ customerId: number }>,
  rooms: ReturnType<typeof generateRooms>,
  employees: ReturnType<typeof generateEmployees>,
  bookings: Array<{ bookingId: number; hotelId: number; roomNumber: number }>
) => {
  const rentings: Array<{
    customerId: number;
    hotelId: number;
    roomNumber: number;
    employeeSsn: string;
    startDate: string;
    endDate: string;
    bookingId: number | null;
    paymentAmount: string | null;
    paymentDate: string | null;
    paymentStatus: string;
  }> = [];

  // Create 15 rentings
  for (let i = 0; i < 15; i++) {
    const customer = customers[(i + 10) % customers.length];
    const room = rooms[(i + 5) % rooms.length];

    // Find an employee at this hotel
    const hotelEmployee = employees.find((e) => e.hotelId === room.hotelId);
    if (!hotelEmployee) continue;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 10 + i); // Mix of past and current

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2 + (i % 4));

    // Some rentings come from bookings
    const relatedBooking = i < 5 ? bookings[i] : null;

    // Calculate payment
    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const paymentAmount = String(parseFloat(room.price) * nights);

    rentings.push({
      customerId: customer.customerId,
      hotelId: room.hotelId,
      roomNumber: room.roomNumber,
      employeeSsn: hotelEmployee.ssn,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      bookingId: relatedBooking?.bookingId || null,
      paymentAmount: i % 3 === 0 ? paymentAmount : null, // Some paid, some pending
      paymentDate: i % 3 === 0 ? startDate.toISOString().split("T")[0] : null,
      paymentStatus: i % 3 === 0 ? "paid" : "pending",
    });
  }

  return rentings;
};

// ============================================
// MAIN SEED FUNCTION
// ============================================
async function seed() {
  console.log("🌱 Starting database seed...\n");

  try {
    // Clear existing data (in reverse order of dependencies)
    console.log("🗑️  Clearing existing data...");
    await db.delete(renting);
    await db.delete(booking);
    await db.delete(user);
    await db.delete(roomProblems);
    await db.delete(roomAmenities);
    await db.delete(room);
    await db.delete(employee);
    await db.delete(hotelPhone);
    await db.delete(hotel);
    await db.delete(hotelChainEmail);
    await db.delete(hotelChainPhone);
    await db.delete(hotelChain);
    await db.delete(customer);

    // Insert hotel chains
    console.log("🏢 Inserting hotel chains...");
    await db.insert(hotelChain).values(hotelChains);
    await db.insert(hotelChainPhone).values(hotelChainPhones);
    await db.insert(hotelChainEmail).values(hotelChainEmails);
    console.log(`   ✓ ${hotelChains.length} hotel chains created`);

    // Insert hotels
    console.log("🏨 Inserting hotels...");
    const hotelsData = generateHotels();
    await db.insert(hotel).values(hotelsData);
    console.log(`   ✓ ${hotelsData.length} hotels created`);

    // Insert employees
    console.log("👥 Inserting employees...");
    const employeesData = generateEmployees(hotelsData);
    await db.insert(employee).values(employeesData);
    console.log(`   ✓ ${employeesData.length} employees created`);

    // Update hotels with manager SSN
    console.log("👔 Assigning managers...");
    for (const h of hotelsData) {
      const manager = employeesData.find((e) => e.hotelId === h.hotelId && e.role === "Manager");
      if (manager) {
        await db.update(hotel)
          .set({ managerSsn: manager.ssn })
          .where(eq(hotel.hotelId, h.hotelId));
      }
    }
    console.log(`   ✓ Managers assi gned`);

    // Insert hotel phones
    console.log("📞 Inserting hotel phones...");
    const hotelPhonesData = hotelsData.map((h) => ({
      hotelId: h.hotelId,
      phoneNumber: `1-800-${String(h.hotelId).padStart(3, "0")}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    }));
    await db.insert(hotelPhone).values(hotelPhonesData);

    // Insert rooms
    console.log("🛏️  Inserting rooms...");
    const roomsData = generateRooms(hotelsData);
    await db.insert(room).values(roomsData);
    console.log(`   ✓ ${roomsData.length} rooms created`);

    // Insert room amenities
    console.log("✨ Inserting room amenities...");
    const amenitiesData = generateRoomAmenities(roomsData);
    await db.insert(roomAmenities).values(amenitiesData);
    console.log(`   ✓ ${amenitiesData.length} amenities created`);

    // Insert room problems
    console.log("⚠️  Inserting room problems...");
    const problemsData = generateRoomProblems(roomsData);
    await db.insert(roomProblems).values(problemsData);
    console.log(`   ✓ ${problemsData.length} problems created`);

    // Insert customers
    console.log("🧑 Inserting customers...");
    const customersData = generateCustomers();
    const insertedCustomers = await db.insert(customer).values(customersData).returning({ customerId: customer.customerId });
    console.log(`   ✓ ${insertedCustomers.length} customers created`);

    // Insert bookings
    console.log("📅 Inserting bookings...");
    const bookingsData = generateBookings(insertedCustomers, roomsData);
    const insertedBookings = await db.insert(booking).values(bookingsData).returning({
      bookingId: booking.bookingId,
      hotelId: booking.hotelId,
      roomNumber: booking.roomNumber,
    });
    console.log(`   ✓ ${insertedBookings.length} bookings created`);

    // Insert rentings
    console.log("🔑 Inserting rentings...");
    const rentingsData = generateRentings(insertedCustomers, roomsData, employeesData, insertedBookings);
    await db.insert(renting).values(rentingsData);
    console.log(`   ✓ ${rentingsData.length} rentings created`);

    // Insert users (authentication)
    console.log("🔐 Inserting authentication users...");
    const testPassword = hashPassword("password123");
    
    const usersData = [
      // Customer user
      {
        email: "customer@example.com",
        passwordHash: testPassword,
        role: "customer",
        customerId: insertedCustomers[0]?.customerId || 1,
        employeeSsn: null,
      },
      // Employee user
      {
        email: "employee@example.com",
        passwordHash: testPassword,
        role: "employee",
        customerId: null,
        employeeSsn: employeesData[0]?.ssn || null,
      },
      // Admin user
      {
        email: "admin@example.com",
        passwordHash: testPassword,
        role: "admin",
        customerId: null,
        employeeSsn: employeesData[0]?.ssn || null,
      },
    ];

    await db.insert(user).values(usersData);
    console.log(`   ✓ 3 authentication users created
      - customer@example.com (customer)
      - employee@example.com (employee)
      - admin@example.com (admin)
      Password for all: password123`);

    // Reset sequences to avoid duplicate key errors on future inserts
    console.log("🔄 Resetting sequences...");
    await db.execute(sql`SELECT setval('hotel_hotel_id_seq', (SELECT COALESCE(MAX(hotel_id), 0) FROM hotel))`);
    await db.execute(sql`SELECT setval('customer_customer_id_seq', (SELECT COALESCE(MAX(customer_id), 0) FROM customer))`);
    await db.execute(sql`SELECT setval('booking_booking_id_seq', (SELECT COALESCE(MAX(booking_id), 0) FROM booking))`);
    await db.execute(sql`SELECT setval('renting_renting_id_seq', (SELECT COALESCE(MAX(renting_id), 0) FROM renting))`);
    await db.execute(sql`SELECT setval('user_user_id_seq', (SELECT COALESCE(MAX(user_id), 0) FROM "user"))`);
    console.log("   ✓ Sequences reset");

    console.log("\n✅ Database seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - ${hotelChains.length} hotel chains`);
    console.log(`   - ${hotelsData.length} hotels (8 per chain)`);
    console.log(`   - ${employeesData.length} employees`);
    console.log(`   - ${roomsData.length} rooms (5-7 per hotel)`);
    console.log(`   - ${amenitiesData.length} room amenities`);
    console.log(`   - ${problemsData.length} room problems`);
    console.log(`   - ${insertedCustomers.length} customers`);
    console.log(`   - ${insertedBookings.length} bookings`);
    console.log(`   - ${rentingsData.length} rentings`);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed();
