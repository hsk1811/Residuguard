# ResiduGuard — Complete Project Setup & Team Development Guide

## 1. Project Structure

After cloning the repository, the project should look approximately like this:

```text
ResiduGuard/
│
├── src/                         # Frontend
│   ├── routes/
│   ├── components/
│   ├── lib/
│   └── ...
│
├── public/
│
├── backend/
│   ├── src/
│   │   ├── lib/
│   │   │   └── prisma.ts
│   │   ├── routes/
│   │   │   └── cattle.ts
│   │   ├── server.ts
│   │   └── test-db.ts
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   │
│   ├── generated/               # Generated automatically
│   ├── .env                     # Local only — DO NOT push
│   ├── .env.example
│   ├── prisma7.config.ts
│   └── package.json
│
├── .gitignore
├── README.md
├── package.json
└── ...
```

---

# 2. Prerequisites

Every team member should install the following:

### Required

* Git
* Bun
* Node.js
* PostgreSQL
* pgAdmin 4
* VS Code

Check installations:

```powershell
git --version
```

```powershell
bun --version
```

```powershell
node --version
```

```powershell
psql --version
```

---

# 3. Clone the GitHub Repository

Each team member should clone the project.

```powershell
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

Go inside the project:

```powershell
cd ResiduGuard
```

Check:

```powershell
git status
```

The repository should be clean.

---

# 4. Install Frontend Dependencies

From the project root:

```powershell
bun install
```

This installs the frontend dependencies.

---

# 5. Setup PostgreSQL

Each team member needs their own local PostgreSQL database.

The PostgreSQL server does **not** need to be uploaded to GitHub.

Open:

```text
pgAdmin 4
```

Connect to the local PostgreSQL server.

Create a database called:

```text
Residuguard
```

### Using pgAdmin

Go to:

```text
Servers
→ PostgreSQL
→ Databases
→ Right Click
→ Create
→ Database
```

Database name:

```text
Residuguard
```

Save it.

---

# 6. Setup Backend

Go to the backend:

```powershell
cd backend
```

Install backend dependencies:

```powershell
bun install
```

---

# 7. Create Backend Environment File

Inside:

```text
backend/
```

there should be:

```text
.env.example
```

Copy it to:

```text
.env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Open:

```text
backend/.env
```

Set your own PostgreSQL connection string.

Example:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/Residuguard"
```

Use the PostgreSQL username and password configured on **your own computer**.

Do not use another team member's password.

---

# 8. Important — Never Push `.env`

The following files/folders must NOT be pushed to GitHub:

```text
backend/.env
backend/node_modules/
backend/generated/
node_modules/
dist/
```

The `.gitignore` should contain:

```gitignore
# Dependencies
node_modules/
backend/node_modules/

# Environment files
.env
backend/.env

# Generated Prisma client
backend/generated/

# Build output
dist/
dist-ssr/
.output/
```

---

# 9. Install Prisma Dependencies

The backend uses Prisma with PostgreSQL.

The required packages are already present in the project.

If necessary:

```powershell
cd backend
```

```powershell
bun install
```

The project uses:

```text
Prisma
@prisma/adapter-pg
pg
dotenv
```

---

# 10. Create the Database Tables

Make sure you are inside:

```text
backend/
```

Run:

```powershell
bunx prisma migrate dev
```

This creates the database tables based on:

```text
backend/prisma/schema.prisma
```

It also applies the committed Prisma migrations.

---

# 11. Generate Prisma Client

Run:

```powershell
bunx prisma generate
```

This generates the Prisma client inside:

```text
backend/generated/
```

This folder is automatically generated and should not be pushed to GitHub.

---

# 12. Seed the Database

Run:

```powershell
bunx prisma db seed
```

This inserts demo data into the local database.

The seed contains sample:

* Farmer
* Cattle
* Veterinarian
* Collection Centre
* Factory

Example farmer:

```text
Ramesh Patil
```

Example cattle:

```text
CATTLE-001
CATTLE-002
```

Example veterinarian:

```text
Dr. Anjali Sharma
```

Example collection centre:

```text
Pune Milk Collection Centre
```

Example factory:

```text
Pune Dairy Processing Factory
```

---

# 13. Test PostgreSQL Connection

From:

```text
backend/
```

run:

```powershell
bun src/test-db.ts
```

Expected output:

```text
PostgreSQL connection successful!
Users: [...]
```

If you see this, your PostgreSQL + Prisma connection is working.

---

# 14. Start the Backend

From:

```text
backend/
```

run:

```powershell
bun src/server.ts
```

Expected output:

```text
ResiduGuard backend running at http://localhost:3000
```

The backend is now running at:

```text
http://localhost:3000
```

---

# 15. Test the Cattle API

Open another PowerShell terminal.

Run:

```powershell
Invoke-RestMethod http://localhost:3000/api/cattle
```

You should receive the cattle data from PostgreSQL.

The API currently available is:

```text
GET /api/cattle
```

---

# 16. Start the Frontend

Open another terminal.

Go back to the project root:

```powershell
cd ..
```

If necessary:

```powershell
cd ResiduGuard
```

Start the frontend:

```powershell
bun run dev
```

The terminal will show the frontend URL, usually something similar to:

```text
http://localhost:3000
```

or another Vite/TanStack development port.

Open the URL shown in the terminal.

---

# 17. Running the Complete Project

You normally need **two terminals**.

### Terminal 1 — Backend

```powershell
cd ResiduGuard/backend
bun src/server.ts
```

### Terminal 2 — Frontend

```powershell
cd ResiduGuard
bun run dev
```

Keep both terminals running.

---

# 18. Database Workflow

The database is **local for every developer**.

GitHub stores:

```text
schema.prisma
migrations/
seed.ts
```

GitHub does NOT store:

```text
actual PostgreSQL database
PostgreSQL data
.env
database password
```

Therefore, when a new team member clones the repository, they recreate the database using:

```powershell
bunx prisma migrate dev
```

and:

```powershell
bunx prisma db seed
```

---

# 19. How the Backend Connects to PostgreSQL

The connection flow is:

```text
Frontend
   │
   │ HTTP API
   ▼
Bun Backend
   │
   │ Prisma
   ▼
Prisma PostgreSQL Adapter
   │
   ▼
PostgreSQL
   │
   ▼
Residuguard Database
```

The main Prisma connection file is:

```text
backend/src/lib/prisma.ts
```

---

# 20. Current Database Architecture

The main entities are:

```text
User
 │
 └── Farmer
       │
       └── Cattle
             │
             └── Treatment
                    │
                    └── Veterinarian

CollectionCentre
 │
 └── MilkBatch
       │
       └── MilkBatchAnimal
              │
              └── Cattle

Factory
 │
 └── ProcessingBatch
       │
       ├── ProcessingMilkBatch
       │
       └── Package

TraceabilityEvent
```

---

# 21. Project Workflow

The intended ResiduGuard workflow is:

```text
FARMER
   │
   ▼
Register Cattle
   │
   ▼
Cattle Health Records
   │
   ▼
VETERINARIAN
   │
   ▼
Treatment Recorded
   │
   ▼
Withdrawal Period
   │
   ▼
SAFE / HOLD
   │
   ▼
COLLECTION CENTRE
   │
   ▼
Milk Batch Created
   │
   ▼
FACTORY
   │
   ▼
Processing Batch
   │
   ▼
Packages
   │
   ▼
CONSUMER
   │
   ▼
Batch / Package Verification
```

---

# 22. Team Division

There are 3 project members.

## Member 1 — Farmer + Veterinarian

### Frontend

Work on:

```text
src/routes/farmer.tsx
src/routes/veterinarian.tsx
```

Implement:

* Farmer dashboard
* Farmer profile
* Add cattle
* Edit cattle
* View cattle
* Cattle details
* Cattle health history
* Veterinarian dashboard
* Search cattle
* View cattle history
* Record treatment
* Treatment history
* Withdrawal status

### Backend

Work mainly with:

```text
User
Farmer
Cattle
Veterinarian
Treatment
```

Potential APIs:

```text
GET    /api/farmers/:id
GET    /api/farmers/:id/cattle

GET    /api/cattle
GET    /api/cattle/:id
POST   /api/cattle
PUT    /api/cattle/:id

GET    /api/cattle/:id/treatments
POST   /api/treatments

GET    /api/veterinarians/:id
```

---

# 23. Member 2 — Collection Centre + Factory

### Frontend

Work on:

```text
src/routes/collection-centre.tsx
src/routes/factory.tsx
```

Implement:

### Collection Centre

* Dashboard
* Cattle eligibility
* SAFE/HOLD status
* Select cattle
* Create milk batch
* Generate batch ID
* Record milk volume
* Link cattle to milk batch
* View milk batches
* Update batch status
* Dispatch batch

### Factory

* Incoming milk batches
* Select milk batches
* Create processing batch
* Product information
* Processing volume
* Number of packs
* Processing status
* Package generation
* Dispatch

### Backend

Work mainly with:

```text
CollectionCentre
MilkBatch
MilkBatchAnimal
Factory
ProcessingBatch
ProcessingMilkBatch
Package
```

Potential APIs:

```text
GET    /api/milk-batches
GET    /api/milk-batches/:id
POST   /api/milk-batches
PUT    /api/milk-batches/:id

GET    /api/processing-batches
GET    /api/processing-batches/:id
POST   /api/processing-batches
PUT    /api/processing-batches/:id

GET    /api/packages
GET    /api/packages/:id
POST   /api/packages
```

---

# 24. Member 3 — Consumer + Authority

### Consumer

Work on:

```text
src/routes/verify.tsx
```

Implement:

```text
Enter Batch ID / Package ID
          │
          ▼
Search Backend
          │
          ▼
Find Package
          │
          ▼
Find Processing Batch
          │
          ▼
Find Milk Batch
          │
          ▼
Find Collection Centre
          │
          ▼
Find Contributing Cattle
          │
          ▼
Display Traceability Information
```

Consumer should be able to see information such as:

```text
Product
Package ID
Processing Batch
Milk Batch
Collection Centre
Factory
Source Cattle
Milk Collection Date
Safety Status
```

---

# 25. Authority Module

Work on:

```text
src/routes/authority.tsx
```

Authority dashboard should provide system-level information:

```text
Total Farmers
Total Cattle
Total Veterinarians
Total Treatments
SAFE Milk Batches
HOLD Milk Batches
Processing Batches
Packages
```

Also provide:

```text
HOLD cases
Recent treatments
Recent milk batches
Recent processing batches
```

---

# 26. Authentication

The current login system is still demo/mock authentication.

Current roles:

```text
FARMER
VETERINARIAN
COLLECTION_CENTRE
FACTORY
AUTHORITY
CONSUMER
```

The login frontend currently uses demo credentials and session state.

Later, backend authentication should be implemented.

Possible future flow:

```text
Login
  │
  ▼
POST /api/auth/login
  │
  ▼
Verify email/password
  │
  ▼
Return session/token
  │
  ▼
Frontend stores authenticated session
  │
  ▼
Role-based dashboard
```

Do not let each member create a separate authentication system.

---

# 27. Important Rule for Database Changes

If someone changes:

```text
backend/prisma/schema.prisma
```

they must create a Prisma migration.

Example:

```powershell
bunx prisma migrate dev --name add_something
```

Then commit the migration:

```text
backend/prisma/migrations/
```

Other team members then pull the changes and run:

```powershell
bunx prisma migrate dev
```

Do **not** manually modify another developer's local PostgreSQL database and expect the change to appear on GitHub.

---

# 28. Important Rule for Seed Data

If demo data needs to change, modify:

```text
backend/prisma/seed.ts
```

Then run:

```powershell
bunx prisma db seed
```

Do not commit your local database contents.

---

# 29. Git Workflow for the Team

Do not have everyone directly work on `main`.

Each member should create their own branch.

Example:

### Member 1

```powershell
git checkout -b feature/farmer-veterinarian
```

### Member 2

```powershell
git checkout -b feature/collection-factory
```

### Member 3

```powershell
git checkout -b feature/consumer-authority
```

---

# 30. Before Starting Work

Always pull the latest changes:

```powershell
git checkout main
```

```powershell
git pull origin main
```

Then switch back to your branch:

```powershell
git checkout feature/your-branch
```

Update your branch if required:

```powershell
git merge main
```

---

# 31. After Completing Work

Check changed files:

```powershell
git status
```

Review changes:

```powershell
git diff
```

Add files:

```powershell
git add .
```

Commit:

```powershell
git commit -m "Implement farmer cattle management"
```

Push:

```powershell
git push -u origin feature/farmer-veterinarian
```

Then create a Pull Request on GitHub.

---

# 32. Before Every Commit

Make sure you are NOT committing:

```text
.env
node_modules/
backend/node_modules/
backend/generated/
```

Check:

```powershell
git status --ignored
```

You should never see the PostgreSQL password staged for commit.

---

# 33. Pulling Another Member's Changes

After their Pull Request is merged into `main`:

```powershell
git checkout main
```

```powershell
git pull origin main
```

Then update your branch:

```powershell
git checkout feature/your-branch
```

```powershell
git merge main
```

If the database schema changed:

```powershell
cd backend
```

```powershell
bunx prisma migrate dev
```

Then:

```powershell
bunx prisma generate
```

---

# 34. API Development Rules

Frontend should communicate with the backend through API endpoints.

Do not directly access PostgreSQL from React.

Correct:

```text
React
  ↓
API
  ↓
Bun Backend
  ↓
Prisma
  ↓
PostgreSQL
```

Incorrect:

```text
React
  ↓
PostgreSQL
```

---

# 35. Frontend API File

Keep frontend API calls organized in:

```text
src/lib/api.ts
```

For example:

```ts
export async function fetchCattle() {
  const response = await fetch(
    "http://localhost:3000/api/cattle",
  );

  if (!response.ok) {
    throw new Error("Failed to fetch cattle");
  }

  return response.json();
}
```

As APIs are added, keep them organized in this file or split them into separate API modules if it becomes large.

---

# 36. Current Backend API

Currently implemented:

```text
GET /api/cattle
```

The backend server runs on:

```text
http://localhost:3000
```

More APIs will be added as the modules are completed.

---

# 37. CORS

The backend already allows the frontend to communicate with it during local development.

The backend includes CORS headers for:

```text
GET
POST
PUT
DELETE
OPTIONS
```

If the frontend shows:

```text
Failed to fetch
```

check that the backend is running.

---

# 38. Troubleshooting — PostgreSQL Connection Error

If you get:

```text
DATABASE_URL is not defined
```

check:

```text
backend/.env
```

Make sure it contains:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/Residuguard"
```

---

# 39. Troubleshooting — Database Does Not Exist

If Prisma says the database does not exist:

Open pgAdmin and create:

```text
Residuguard
```

Then run:

```powershell
cd backend
bunx prisma migrate dev
```

---

# 40. Troubleshooting — Prisma Client Error

Run:

```powershell
cd backend
bunx prisma generate
```

Then restart the backend:

```powershell
bun src/server.ts
```

---

# 41. Troubleshooting — Backend API Not Working

Check whether the backend is running:

```powershell
cd backend
bun src/server.ts
```

Then test:

```powershell
Invoke-RestMethod http://localhost:3000/api/cattle
```

If this works but the frontend does not, check the frontend API URL.

---

# 42. Troubleshooting — Frontend Cannot Fetch Backend

Make sure both are running.

### Backend

```powershell
cd backend
bun src/server.ts
```

### Frontend

```powershell
cd ResiduGuard
bun run dev
```

Then refresh the browser.

---

# 43. Troubleshooting — Migration Problems

If a team member has an outdated local database, first try:

```powershell
cd backend
bunx prisma migrate dev
```

If the local database is only development/test data and can safely be deleted:

```powershell
bunx prisma migrate reset
```

Then:

```powershell
bunx prisma db seed
```

**Do not use `migrate reset` on a database containing important real data.**

---

# 44. Troubleshooting — Git Conflicts

If Git reports a conflict:

```powershell
git status
```

Open the conflicted files and resolve them.

Then:

```powershell
git add .
```

```powershell
git commit
```

If the conflict occurs while merging:

```powershell
git merge --continue
```

---

# 45. Development Order

The project should be completed in phases.

## Phase 1 — Database + Backend Foundation

Complete:

```text
PostgreSQL
Prisma
Database schema
Seed data
Basic APIs
```

---

## Phase 2 — Farmer + Veterinarian

Complete:

```text
Farmer
   ↓
Cattle
   ↓
Veterinarian
   ↓
Treatment
   ↓
Withdrawal Period
   ↓
SAFE / HOLD
```

---

## Phase 3 — Collection Centre

Complete:

```text
Cattle eligibility
        ↓
Select SAFE cattle
        ↓
Create Milk Batch
        ↓
Generate Batch ID
        ↓
Link cattle
        ↓
Record volume
        ↓
Batch status
```

---

## Phase 4 — Factory

Complete:

```text
Milk Batch
    ↓
Factory
    ↓
Processing Batch
    ↓
Product
    ↓
Packages
```

---

## Phase 5 — Consumer

Complete:

```text
Package ID / Batch ID
        ↓
Backend lookup
        ↓
Processing Batch
        ↓
Milk Batch
        ↓
Collection Centre
        ↓
Cattle
        ↓
Safety information
```

---

## Phase 6 — Authority

Complete:

```text
System Dashboard
       ↓
Farmers
Cattle
Treatments
Milk Batches
Processing
Packages
HOLD Cases
```

---

# 46. Phase 7 — Full Integration Testing

Before blockchain, test the complete workflow:

```text
Farmer
  ↓
Add Cattle
  ↓
Veterinarian
  ↓
Record Treatment
  ↓
Withdrawal Period
  ↓
SAFE / HOLD
  ↓
Collection Centre
  ↓
Create Milk Batch
  ↓
Factory
  ↓
Create Processing Batch
  ↓
Create Package
  ↓
Consumer
  ↓
Verify Package / Batch
```

Every step must use the actual PostgreSQL database.

No mock data should remain in the production workflow.

---

# 47. Blockchain — Later Phase

Blockchain is intentionally **parked for now**.

Do not block the current development because of Hyperledger.

First make:

```text
Frontend
+
Backend
+
PostgreSQL
+
Prisma
+
APIs
```

fully functional.

After the complete workflow works, blockchain can be added.

---

# 48. Future Blockchain Architecture

Later the architecture can become:

```text
Frontend
    │
    ▼
Bun Backend
    │
    ├──────────────► PostgreSQL
    │
    │
    └──────────────► Hyperledger Fabric
                          │
                          ▼
                   Blockchain Ledger
```

PostgreSQL will continue handling the application's normal data.

Hyperledger will provide tamper-evident traceability records.

The existing:

```text
TraceabilityEvent
```

model can later be used to connect application events with blockchain transaction IDs.

---

# 49. Blockchain Should Record Events Such As

Later, events could include:

```text
CATTLE_REGISTERED
TREATMENT_RECORDED
WITHDRAWAL_STARTED
WITHDRAWAL_COMPLETED
MILK_BATCH_CREATED
MILK_BATCH_DISPATCHED
PROCESSING_BATCH_CREATED
PACKAGE_CREATED
PACKAGE_DISPATCHED
```

The application should first work without blockchain.

---

# 50. Final Team Workflow

Every team member should follow:

```text
1. Clone repository
        ↓
2. Install Bun dependencies
        ↓
3. Install PostgreSQL
        ↓
4. Create Residuguard database
        ↓
5. Create backend/.env
        ↓
6. Run Prisma migrations
        ↓
7. Generate Prisma client
        ↓
8. Seed database
        ↓
9. Test database
        ↓
10. Start backend
        ↓
11. Start frontend
        ↓
12. Create feature branch
        ↓
13. Develop module
        ↓
14. Test module
        ↓
15. Commit changes
        ↓
16. Push branch
        ↓
17. Create Pull Request
        ↓
18. Merge into main
```

---

# 51. Quick Start — For a New Team Member

After cloning the repository:

```powershell
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd ResiduGuard
```

Install frontend:

```powershell
bun install
```

Setup backend:

```powershell
cd backend
bun install
```

Create:

```text
backend/.env
```

with:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/Residuguard"
```

Create the database in PostgreSQL:

```text
Residuguard
```

Run:

```powershell
bunx prisma migrate dev
```

Then:

```powershell
bunx prisma generate
```

Then:

```powershell
bunx prisma db seed
```

Test:

```powershell
bun src/test-db.ts
```

Start backend:

```powershell
bun src/server.ts
```

Open a second terminal and run:

```powershell
cd ResiduGuard
bun run dev
```

Now the complete local development environment is ready.

---

# 52. Important Rules for the Whole Team

### DO

```text
Use PostgreSQL
Use Prisma
Use API endpoints
Use Git branches
Commit migrations
Keep seed.ts updated
Pull before starting work
Test before pushing
Create Pull Requests
```

### DO NOT

```text
Push .env
Push PostgreSQL database files
Push passwords
Push node_modules
Push generated Prisma client
Directly connect React to PostgreSQL
Delete another member's migrations
Work directly on main unnecessarily
```

---

# 53. Current Project Priority

The current priority is:

```text
                 RESIDUGUARD
                      │
          ┌───────────┴───────────┐
          │                       │
       FRONTEND                BACKEND
          │                       │
          │                   PostgreSQL
          │                       │
          │                     Prisma
          │                       │
          └───────────┬───────────┘
                      │
               MAKE EVERYTHING
                 FUNCTIONAL
                      │
                      ▼
              INTEGRATION TEST
                      │
                      ▼
             ADD BLOCKCHAIN LATER
```

**Blockchain is not part of the current implementation phase.**

The immediate goal is to make the entire ResiduGuard workflow functional using **React/TanStack frontend + Bun backend + Prisma + PostgreSQL**, with all three team members working on their respective modules.
