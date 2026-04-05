# e-Hotels Database Application

**CSI 2132 - Databases I | Winter 2026 | University of Ottawa**

**Group 90**
- Edward-Joseph Fattouch (300353595)
- Ipinoluwa Shobayo (300381875)
- Victor Situ (300349206)

---

## Prerequisites

Ensure the following are installed on your system:

| Software | Version | Download |
|----------|---------|----------|
| Node.js | v18+ | https://nodejs.org/ |
| PostgreSQL | v14+ | https://www.postgresql.org/download/ |
| npm | (included with Node.js) | - |

Verify installation:
```bash
node --version
psql --version
npm --version
```

---

## Setup Instructions

### Step 1: Install Dependencies

Navigate to the `root dir` folder and install Node.js packages:

```bash
cd ehotels
npm install
```

### Step 2: Create PostgreSQL Database

Open a terminal and create the database:

**Windows (Command Prompt):**
```cmd
psql -U postgres -c "CREATE DATABASE ehotels;"
```

**macOS / Linux:**
```bash
createdb ehotels
```

**Or using psql interactive mode:**
```bash
psql -U postgres
```
```sql
CREATE DATABASE ehotels;
\q
```

### Step 3: Configure Database Connection

Edit the `.env` file in the project root:

```
DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/ehotels
```

Replace `USERNAME` and `PASSWORD` with your PostgreSQL credentials.

**Example:**
```
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/ehotels
```

### Step 4: Create Database Tables (Schema)

Run Drizzle to push the schema to the database:

```bash
npm run db:push
```

This creates all tables:
- `hotel_chain`, `hotel_chain_phone`, `hotel_chain_email`
- `hotel`, `hotel_phone`
- `room`, `room_amenities`, `room_problems`
- `employee`, `customer`
- `booking`, `renting`
- `booking_archive`, `renting_archive`

### Step 5: Run Migrations (Views, Triggers, Indexes)

Execute the SQL migration file:

**Windows:**
```cmd
psql -U postgres -d ehotels -f src/db/migrations.sql
```

**macOS / Linux:**
```bash
psql -d ehotels -f src/db/migrations.sql
```

This creates:
- **2 Views:** `rooms_per_area`, `hotel_capacity`
- **2 Triggers:** `archive_booking_trigger`, `archive_renting_trigger`
- **3 Indexes:** `idx_room_hotel_price`, `idx_booking_dates`, `idx_renting_dates`

### Step 6: Populate Database (Seed Data)

Run the seed script to insert sample data:

```bash
npm run db:seed
```

**Data inserted:**
| Entity | Count |
|--------|-------|
| Hotel Chains | 5 |
| Hotels | 40 (8 per chain) |
| Employees | ~160 |
| Rooms | ~220 (5-7 per hotel) |
| Room Amenities | ~600 |
| Customers | 30 |
| Bookings | 20 |
| Rentings | 15 |

---

## Running Queries

### Execute Showcase Queries (Requirement 2c)

Run the demonstration queries file:

```bash
psql -U postgres -d ehotels -f src/db/queries.sql
```

Or connect interactively and run queries manually:

```bash
psql -U postgres -d ehotels
```

### Query the Views (Requirement 2f)

```sql
-- View 1: Available rooms per area
SELECT * FROM rooms_per_area;

-- View 2: Hotel capacity breakdown
SELECT * FROM hotel_capacity;
```

### Test Archive Triggers (Requirement 2d)

```sql
-- Check current bookings
SELECT * FROM booking LIMIT 5;

-- Delete a booking (triggers archive)
DELETE FROM booking WHERE booking_id = 1;

-- Verify it was archived
SELECT * FROM booking_archive;
```

---

## npm Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run db:push` | Create/update tables from schema |
| `npm run db:seed` | Populate database with sample data |
| `npm run db:studio` | Open Drizzle Studio (visual DB browser) |
| `npm run db:generate` | Generate SQL migration files |
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build for production |

---

## Project Structure

```
ehotels/
├── src/
│   ├── db/
│   │   ├── schema.ts        # Drizzle ORM schema (all tables)
│   │   ├── index.ts         # Database connection
│   │   ├── seed.ts          # Data population script
│   │   ├── migrations.sql   # Views, triggers, indexes (SQL)
│   │   └── queries.sql      # Showcase queries (SQL)
│   ├── app/                 # Next.js application
│   ├── components/          # React components
│   └── lib/                 # Utility functions
├── drizzle/                 # Generated migrations
├── drizzle.config.ts        # Drizzle configuration
├── .env                     # Database credentials (do not commit)
├── .env.example             # Example environment file
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

---

## Deliverable Requirements Coverage

| Req | Weight | Description | Implementation |
|-----|--------|-------------|----------------|
| 2a | 10% | Database Implementation | `src/db/schema.ts` |
| 2b | 5% | Database Population | `src/db/seed.ts` |
| 2c | 10% | Database Queries (4+) | `src/db/queries.sql` |
| 2d | 10% | Triggers (2+) | `src/db/migrations.sql` |
| 2e | 5% | Indexes (3+) | `src/db/migrations.sql` |
| 2f | 5% | Views (2) | `src/db/migrations.sql` |
| 2g | 30% | Web Application | `src/app/` (TBD) |

---

## Technologies Used

| Layer | Technology |
|-------|------------|
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Language | TypeScript |
| Runtime | Node.js |
| Framework | Next.js |
| Styling | Tailwind CSS |

---

## Troubleshooting

### "Connection refused" error

Ensure PostgreSQL is running:

**Windows:**
```cmd
net start postgresql-x64-14
```

**macOS:**
```bash
brew services start postgresql
```

**Linux:**
```bash
sudo systemctl start postgresql
```

### "Permission denied" error

Grant privileges to your user:
```sql
GRANT ALL PRIVILEGES ON DATABASE ehotels TO your_username;
```

### Reset database

To start fresh:
```bash
psql -U postgres -c "DROP DATABASE IF EXISTS ehotels;"
psql -U postgres -c "CREATE DATABASE ehotels;"
npm run db:push
psql -U postgres -d ehotels -f src/db/migrations.sql
npm run db:seed
```

### View database in browser

Use Drizzle Studio:
```bash
npm run db:studio
```
Then open https://local.drizzle.studio in your browser.
