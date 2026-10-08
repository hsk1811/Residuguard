# ResiduGuard

### Digital Farm Management, MRL & AMU Compliance and Dairy Traceability System

ResiduGuard is a full-stack dairy farm management and traceability platform designed to monitor livestock health, antimicrobial usage (AMU), maximum residue limits (MRL), milk batches, processing batches and consumer-level traceability.

The project currently uses:

- **Frontend:** React + TanStack Start + TypeScript
- **Backend:** Bun + TypeScript
- **Database:** PostgreSQL through Supabase
- **ORM:** Prisma 7
- **Database Adapter:** `@prisma/adapter-pg`
- **Authentication:** JWT
- **Styling:** Tailwind CSS
- **Icons/UI:** Lucide React + custom UI components
- **Version Control:** Git + GitHub

> **Current development phase:** The main application is being made fully functional first. Blockchain integration will be added later.

---

# 1. Repository

GitHub repository:

```text
https://github.com/hsk1811/Residuguard
```

Clone it using:

```powershell
git clone https://github.com/hsk1811/Residuguard.git
```

Then:

```powershell
cd ResiduGuard
```

Check the repository:

```powershell
git status
```

---

# 2. Project Structure

The project is organized approximately as follows:

```text
ResiduGuard/
│
├── src/                              # Frontend
│   ├── routes/                       # TanStack routes/pages
│   ├── components/                   # Reusable UI components
│   ├── lib/                          # API, session and application utilities
│   └── ...
│
├── public/
│
├── backend/
│   ├── src/
│   │   ├── lib/
│   │   │   └── prisma.ts             # Prisma client
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.ts               # Login/Register
│   │   │   └── cattle.ts             # Cattle API
│   │   │
│   │   ├── server.ts                 # Bun API server
│   │   └── test-db.ts                # Database connection test
│   │
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema
│   │   ├── seed.ts                   # Demo data
│   │   └── migrations/               # Database migrations
│   │
│   ├── generated/                    # Generated Prisma client
│   ├── .env                          # LOCAL ONLY — DO NOT PUSH
│   ├── .env.example
│   ├── prisma7.config.ts
│   └── package.json
│
├── package.json
├── bun.lock
├── .gitignore
└── README.md
```

---

# 3. Prerequisites

Install the following before setting up the project.

### Required

- Git
- Bun
- Node.js
- VS Code
- Supabase account/access to the project

PostgreSQL itself does **not** need to be installed locally when using the shared Supabase database.

---

# 4. Check Required Installations

Open PowerShell.

### Git

```powershell
git --version
```

### Bun

```powershell
bun --version
```

### Node.js

```powershell
node --version
```

A successful setup should show versions for all three.

---

# 5. Install Bun

If Bun is not installed:

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

Close and reopen PowerShell after installation.

Then verify:

```powershell
bun --version
```

---

# 6. Clone the Repository

Run:

```powershell
git clone https://github.com/hsk1811/Residuguard.git
```

Go into the project:

```powershell
cd ResiduGuard
```

Check:

```powershell
git status
```

---

# 7. Install Frontend Dependencies

From the project root:

```powershell
bun install
```

This installs the frontend dependencies.

---

# 8. Setup Backend Dependencies

Go into the backend:

```powershell
cd backend
```

Install backend dependencies:

```powershell
bun install
```

After installation, go back to the project root:

```powershell
cd ..
```

---

# 9. Database — Supabase

The current ResiduGuard backend uses **PostgreSQL hosted through Supabase**.

The database is not stored inside the GitHub repository.

The Prisma schema and migrations are stored in the repository, while the actual database is hosted by Supabase.

The project currently uses:

```text
Supabase
    ↓
PostgreSQL
    ↓
Prisma 7
    ↓
Bun Backend
```

---

# 10. Environment Variables

The backend requires a local environment file:

```text
backend/.env
```

This file is intentionally excluded from GitHub.

There is a template:

```text
backend/.env.example
```

Copy it:

```powershell
cd backend
Copy-Item .env.example .env
```

Then open:

```text
backend/.env
```

---

# 11. Configure `backend/.env`

The backend requires the following configuration:

```env
DATABASE_URL="YOUR_SUPABASE_DATABASE_URL"
DIRECT_URL="YOUR_SUPABASE_DIRECT_DATABASE_URL"
JWT_SECRET="YOUR_PRIVATE_JWT_SECRET"
```

### Important

Do **not** copy the actual secrets into the README.

Do not commit:

```text
backend/.env
```

to GitHub.

The project owner/team lead should provide the required private environment values to team members through a secure/private channel.

---

# 12. Why There Are Two Database URLs

ResiduGuard uses two PostgreSQL connection URLs.

### `DATABASE_URL`

Used by the application at runtime.

It connects Prisma to the Supabase PostgreSQL database through the configured connection pool.

### `DIRECT_URL`

Used by Prisma migrations.

The Prisma configuration uses:

```text
DIRECT_URL
```

for database migrations.

This separation allows the application runtime and Prisma migration workflow to use the appropriate PostgreSQL connection.

---

# 13. JWT Secret

Authentication uses JWT tokens.

The backend requires:

```env
JWT_SECRET="YOUR_PRIVATE_JWT_SECRET"
```

The JWT secret is used by the backend to sign authentication tokens.

Never commit the real JWT secret to GitHub.

---

# 14. Verify `.env` Is Ignored

From the project root:

```powershell
git check-ignore -v backend/.env
```

You should see something similar to:

```text
backend/.gitignore:19:.env backend/.env
```

If `.env` is not ignored, **do not push anything** until the `.gitignore` is fixed.

---

# 15. Prisma Setup

Go into the backend:

```powershell
cd backend
```

Generate the Prisma client:

```powershell
bunx prisma generate
```

The generated client is created under:

```text
backend/generated/
```

This folder is generated automatically and should not be committed.

---

# 16. Run Database Migrations

Make sure:

```text
backend/.env
```

contains valid Supabase connection details.

Then run:

```powershell
bunx prisma migrate dev
```

This applies the committed Prisma migrations to the database.

The schema is located at:

```text
backend/prisma/schema.prisma
```

Migrations are located at:

```text
backend/prisma/migrations/
```

---

# 17. Seed the Database

Run:

```powershell
bunx prisma db seed
```

The seed creates demo data used during development and testing.

The seed includes sample application records such as:

- Users
- Farmers
- Cattle
- Treatments
- Veterinarian-related records
- Collection-centre-related records
- Factory-related records

A demo farmer currently exists for development/testing.

Example:

```text
Name:
Ramesh Patil

Email:
ramesh@residuguard.demo

Password:
demo1234
```

> Demo credentials are for development only. Do not use them in production.

---

# 18. Test the Database Connection

From:

```text
backend/
```

run:

```powershell
bun src/test-db.ts
```

A successful connection should indicate that PostgreSQL/Supabase is reachable.

If the connection fails, check:

1. `backend/.env`
2. `DATABASE_URL`
3. `DIRECT_URL`
4. Supabase project availability
5. Internet connection
6. Whether the password contains special characters that need URL encoding

---

# 19. Start the Backend

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

The backend API is available at:

```text
http://localhost:3000
```

---

# 20. Backend API

The backend currently exposes APIs such as:

### Authentication

```text
POST /api/auth/login
POST /api/auth/register
```

### Cattle

```text
GET /api/cattle
```

Additional APIs will be added as the remaining modules are implemented.

---

# 21. Test the Cattle API

Open another PowerShell terminal.

Run:

```powershell
Invoke-RestMethod http://localhost:3000/api/cattle
```

You should receive cattle records from the PostgreSQL database.

---

# 22. Authentication

ResiduGuard currently supports farmer authentication.

The authentication flow is:

```text
Farmer
   ↓
Register
   ↓
POST /api/auth/register
   ↓
User + Farmer record created
   ↓
Login
   ↓
POST /api/auth/login
   ↓
Password verification
   ↓
JWT generated
   ↓
Frontend stores authentication information
   ↓
Farmer Dashboard
```

---

# 23. Farmer Registration

Farmers can create an account through:

```text
/register
```

Registration currently collects:

```text
Full Name
Phone Number
Email Address
Password
Confirm Password
Village
Farm / Organization Name
```

The backend creates:

```text
User
   +
Farmer
```

The farmer is assigned the role:

```text
FARMER
```

---

# 24. Farmer Login

The login page is:

```text
/login
```

The frontend sends:

```text
email
password
```

to:

```text
POST /api/auth/login
```

The backend verifies the credentials and returns a JWT.

The frontend stores:

```text
residuguard.token
residuguard.user
```

in browser local storage.

---

# 25. Start the Frontend

Open another terminal.

From the project root:

```powershell
cd ResiduGuard
```

Run:

```powershell
bun run dev
```

The TanStack development server will display the local URL.

The current development setup normally uses:

```text
http://localhost:8081
```

Always use the URL shown by the terminal if the port changes.

---

# 26. Running the Complete Project

Normally use **two terminals**.

### Terminal 1 — Backend

```powershell
cd ResiduGuard\backend
bun src/server.ts
```

Backend:

```text
http://localhost:3000
```

### Terminal 2 — Frontend

```powershell
cd ResiduGuard
bun run dev
```

Frontend:

```text
http://localhost:8081
```

Keep both terminals running while developing.

---

# 27. Complete Setup From Scratch

For a new team member, the complete process is:

```text
1. Install Git
        ↓
2. Install Bun
        ↓
3. Install Node.js
        ↓
4. Clone GitHub repository
        ↓
5. bun install
        ↓
6. cd backend
        ↓
7. bun install
        ↓
8. Create backend/.env
        ↓
9. Add Supabase DATABASE_URL
        ↓
10. Add Supabase DIRECT_URL
        ↓
11. Add JWT_SECRET
        ↓
12. bunx prisma generate
        ↓
13. bunx prisma migrate dev
        ↓
14. bunx prisma db seed
        ↓
15. bun src/test-db.ts
        ↓
16. bun src/server.ts
        ↓
17. Open second terminal
        ↓
18. bun run dev
        ↓
19. Open frontend
        ↓
20. Test Login/Register
```

---

# 28. Testing Farmer Registration

After starting both servers:

### Step 1

Open:

```text
http://localhost:8081
```

### Step 2

Go to:

```text
Register / Create Account
```

### Step 3

Create a farmer account.

Example:

```text
Name:
Rahul Patil

Email:
rahul@example.com

Password:
Rahul@123

Phone:
9876543210

Village:
Kalyan

Organization:
Patil Dairy Farm
```

### Step 4

After registration, go to Login.

### Step 5

Enter the newly created email and password.

### Step 6

The backend verifies the account.

### Step 7

The farmer is redirected to the farmer dashboard.

---

# 29. Current Application Flow

The intended ResiduGuard workflow is:

```text
                         RESIDUGUARD
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
       FARMER            VETERINARIAN       CONSUMER
          │                   │                   │
          ▼                   ▼                   ▼
    Register Cattle     Search Cattle       Verify Batch
          │                   │                   │
          ▼                   ▼                   │
    Health Records      Record Treatment         │
          │                   │                   │
          └───────────┬───────┘                   │
                      ▼                           │
               Withdrawal Period                  │
                      │                           │
                SAFE / HOLD                       │
                      │                           │
                      ▼                           │
              COLLECTION CENTRE                  │
                      │                           │
                      ▼                           │
                 Milk Batch                      │
                      │                           │
                      ▼                           │
                   FACTORY                       │
                      │                           │
                      ▼                           │
              Processing Batch                   │
                      │                           │
                      ▼                           │
                  Packages                       │
                      │                           │
                      └───────────────► Verification
```

---

# 30. Main User Roles

ResiduGuard is designed around multiple roles.

### Farmer

Responsibilities:

- Manage farmer profile
- Register cattle
- View cattle
- View cattle health records
- View treatments
- Monitor withdrawal status
- View milk-related records

### Veterinarian

Responsibilities:

- Search cattle
- View cattle health history
- Record treatments
- Record medicine
- Record dosage
- Record treatment reason
- Monitor withdrawal periods

### Collection Centre

Responsibilities:

- Check cattle/milk eligibility
- Create milk batches
- Record milk volume
- Link cattle to milk batches
- Manage batch status
- Dispatch batches

### Factory

Responsibilities:

- Receive milk batches
- Create processing batches
- Process milk
- Generate packages
- Manage processing status
- Dispatch packages

### Authority

Responsibilities:

- Monitor compliance
- Monitor MRL/AMU information
- View traceability information
- Review records

### Consumer

Responsibilities:

- Verify milk/product batch
- View traceability information
- Check product journey

---

# 31. Team Development Structure

The project can be divided among three team members.

## Member 1 — Farmer + Veterinarian

### Frontend

Main files:

```text
src/routes/farmer.tsx
src/routes/veterinarian.tsx
```

Responsibilities:

```text
Farmer dashboard
Farmer profile
Add cattle
Edit cattle
View cattle
Cattle details
Cattle health history

Veterinarian dashboard
Search cattle
View cattle history
Record treatment
Treatment history
Withdrawal status
```

### Backend

Main models:

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
```

---

# 32. Member 2 — Collection Centre + Factory

### Frontend

Main files:

```text
src/routes/collection-centre.tsx
src/routes/factory.tsx
```

### Collection Centre

Responsibilities:

```text
Dashboard
Cattle eligibility
SAFE/HOLD status
Select cattle
Create milk batch
Generate batch ID
Record milk volume
Link cattle to milk batch
View milk batches
Update batch status
Dispatch batch
```

### Factory

Responsibilities:

```text
Incoming milk batches
Select milk batches
Create processing batch
Product information
Processing volume
Number of packs
Processing status
Package generation
Dispatch
```

### Backend

Main models:

```text
CollectionCentre
MilkBatch
MilkBatchAnimal
Factory
ProcessingBatch
ProcessingMilkBatch
Package
```

---

# 33. Member 3 — Consumer + Authority

### Consumer

Main frontend:

```text
src/routes/verify.tsx
```

Responsibilities:

```text
Batch verification
Package verification
Traceability timeline
Milk batch information
Processing information
Product information
```

### Authority

Main frontend:

```text
src/routes/authority.tsx
```

Responsibilities:

```text
Compliance dashboard
MRL reference register
AMU monitoring
Treatment monitoring
Withdrawal violations
Farm monitoring
Traceability monitoring
```

### Backend

Potential models:

```text
Authority
TraceabilityEvent
MRLReference
ComplianceRecord
```

---

# 34. Git Workflow

Before starting work:

```powershell
git pull origin main
```

Check status:

```powershell
git status
```

After making changes:

```powershell
git add .
```

Commit:

```powershell
git commit -m "Describe your changes"
```

Push:

```powershell
git push origin main
```

> The current team workflow is working directly on `main` unless the team later decides to introduce feature branches.

---

# 35. Important Git Rules

### DO

```text
Pull before starting work
Test your changes
Commit meaningful changes
Push working code
Keep migrations in Git
Keep seed.ts updated
Communicate before changing shared database schema
```

### DO NOT

```text
Push backend/.env
Push passwords
Push JWT secrets
Push API keys
Push node_modules
Push generated Prisma client
Delete another person's migrations
Commit broken code
```

---

# 36. Files That Must Stay Private / Ignored

These should not be pushed:

```text
backend/.env
node_modules/
backend/node_modules/
backend/generated/
dist/
dist-ssr/
.output/
```

The `.gitignore` is already configured for these types of files.

---

# 37. Important Database Rule

Do not directly connect the frontend to PostgreSQL.

Correct architecture:

```text
React / TanStack Frontend
          │
          │ HTTP API
          ▼
     Bun Backend
          │
          │ Prisma
          ▼
      PostgreSQL
       (Supabase)
```

Incorrect:

```text
React
  │
  └──────► PostgreSQL
```

All database operations should go through the backend/API layer.

---

# 38. Prisma Workflow

When changing the Prisma schema:

```text
backend/prisma/schema.prisma
```

After modifying the schema, create a migration:

```powershell
cd backend
bunx prisma migrate dev --name describe_change
```

Then generate Prisma client:

```powershell
bunx prisma generate
```

Test the backend before pushing.

---

# 39. Example Schema Change Workflow

Example:

```text
1. Modify schema.prisma
        ↓
2. bunx prisma migrate dev --name add_new_field
        ↓
3. bunx prisma generate
        ↓
4. Update backend API
        ↓
5. Update frontend
        ↓
6. Test
        ↓
7. git add .
        ↓
8. git commit
        ↓
9. git push
```

---

# 40. Adding a New API

Backend APIs are implemented inside:

```text
backend/src/routes/
```

For example:

```text
backend/src/routes/cattle.ts
backend/src/routes/auth.ts
```

Then register the route in:

```text
backend/src/server.ts
```

The frontend communicates with the API through:

```text
src/lib/api.ts
```

---

# 41. Frontend API Communication

Frontend API functions should be kept in:

```text
src/lib/api.ts
```

Example architecture:

```text
React Page
    ↓
src/lib/api.ts
    ↓
HTTP Request
    ↓
Bun Backend
    ↓
Prisma
    ↓
Supabase PostgreSQL
```

Avoid putting database logic directly inside React components.

---

# 42. Authentication Architecture

Current authentication architecture:

```text
Register
   ↓
Frontend
   ↓
POST /api/auth/register
   ↓
Bun Backend
   ↓
Password Hash
   ↓
Prisma
   ↓
User + Farmer
   ↓
PostgreSQL
```

Login:

```text
Login Form
   ↓
POST /api/auth/login
   ↓
Find User
   ↓
Verify Password
   ↓
Create JWT
   ↓
Return Token + User
   ↓
Frontend
   ↓
Store Session Information
```

---

# 43. Demo Login

For development/testing, the seed currently provides:

```text
Email:
ramesh@residuguard.demo

Password:
demo1234
```

Use the demo account only for testing.

For normal farmer testing, create a new account through:

```text
/register
```

---

# 44. Current Backend Ports

Backend:

```text
3000
```

URL:

```text
http://localhost:3000
```

Frontend development server:

```text
8081
```

URL:

```text
http://localhost:8081
```

If TanStack chooses another available port, use the URL shown in the terminal.

---

# 45. Common Problems

## Problem 1 — `bun` is not recognized

Install Bun and restart PowerShell.

Check:

```powershell
bun --version
```

---

## Problem 2 — Prisma cannot connect

Check:

```text
backend/.env
```

Verify:

```text
DATABASE_URL
DIRECT_URL
```

Make sure the Supabase database is available.

---

## Problem 3 — JWT error

Check:

```text
JWT_SECRET
```

in:

```text
backend/.env
```

Restart the backend after changing environment variables.

---

## Problem 4 — Port 3000 already in use

Find the process:

```powershell
netstat -ano | findstr :3000
```

Then terminate the process if necessary:

```powershell
taskkill /PID <PID> /F
```

Restart:

```powershell
bun src/server.ts
```

---

## Problem 5 — Frontend route type errors after adding a route

TanStack generates:

```text
src/routeTree.gen.ts
```

If the generated route tree becomes stale, stop the frontend server, delete:

```text
src/routeTree.gen.ts
```

and restart:

```powershell
bun run dev
```

TanStack will regenerate the route tree.

---

## Problem 6 — CORS error

The backend currently allows frontend requests through CORS.

Make sure the backend is running:

```text
http://localhost:3000
```

and restart the backend if `server.ts` was changed.

---

# 46. Useful Commands

### Install dependencies

```powershell
bun install
```

### Start frontend

```powershell
bun run dev
```

### Start backend

```powershell
cd backend
bun src/server.ts
```

### Generate Prisma client

```powershell
bunx prisma generate
```

### Create/apply development migration

```powershell
bunx prisma migrate dev
```

### Seed database

```powershell
bunx prisma db seed
```

### Test database

```powershell
bun src/test-db.ts
```

### Check Git

```powershell
git status
```

### Pull latest changes

```powershell
git pull origin main
```

### Push changes

```powershell
git push origin main
```

---

# 47. Development Checklist

Before starting development:

```text
[ ] Git installed
[ ] Bun installed
[ ] Node.js installed
[ ] Repository cloned
[ ] Frontend dependencies installed
[ ] Backend dependencies installed
[ ] backend/.env created
[ ] Supabase DATABASE_URL configured
[ ] Supabase DIRECT_URL configured
[ ] JWT_SECRET configured
[ ] Prisma client generated
[ ] Database migrations applied
[ ] Database seeded
[ ] Database connection tested
[ ] Backend running
[ ] Frontend running
```

---

# 48. Final Project Architecture

```text
                    RESIDUGUARD
                         │
              ┌──────────┴──────────┐
              │                     │
          FRONTEND                BACKEND
              │                     │
      React + TanStack          Bun + TypeScript
              │                     │
              │                 Prisma 7
              │                     │
              └──────────┬──────────┘
                         │
                     PostgreSQL
                         │
                      Supabase
```

---

# 49. Current Development Priority

The current priority is:

```text
Make the complete application functional
              ↓
Connect frontend + backend
              ↓
Complete role-based workflows
              ↓
Complete database operations
              ↓
Integration testing
              ↓
Add blockchain traceability
```

Blockchain is **not the current implementation dependency**.

The application should first work correctly using:

```text
React/TanStack
       +
Bun
       +
Prisma
       +
PostgreSQL/Supabase
```

Blockchain integration can then be added on top of the working system.

---

# 50. Quick Start — New Team Member

If everything is already configured and you have received the private environment values:

```powershell
git clone https://github.com/hsk1811/Residuguard.git
cd ResiduGuard

bun install

cd backend
bun install

Copy-Item .env.example .env
```

Configure:

```text
backend/.env
```

with the private:

```text
DATABASE_URL
DIRECT_URL
JWT_SECRET
```

Then:

```powershell
bunx prisma generate
bunx prisma migrate dev
bunx prisma db seed
bun src/test-db.ts
```

Start backend:

```powershell
bun src/server.ts
```

Open another terminal:

```powershell
cd ResiduGuard
bun run dev
```

Open the frontend URL shown in the terminal.

The local ResiduGuard development environment is now ready.

---

# 51. Final Team Workflow

```text
                    CLONE REPOSITORY
                           │
                           ▼
                    INSTALL DEPENDENCIES
                           │
                           ▼
                     CONFIGURE .ENV
                           │
                           ▼
                     SETUP SUPABASE
                           │
                           ▼
                   PRISMA MIGRATIONS
                           │
                           ▼
                       SEED DATA
                           │
                           ▼
                    TEST DATABASE
                           │
                           ▼
                    START BACKEND
                           │
                           ▼
                    START FRONTEND
                           │
                           ▼
                     TEST FEATURES
                           │
                           ▼
                    DEVELOP MODULE
                           │
                           ▼
                       COMMIT
                           │
                           ▼
                         PUSH
                           │
                           ▼
                    TEAM INTEGRATION
                           │
                           ▼
                  COMPLETE RESIDUGUARD
```

---

# 52. Security Reminder

Never put any of the following in GitHub:

```text
Database passwords
Supabase connection strings containing passwords
JWT secrets
API keys
Private tokens
Personal credentials
backend/.env
```

If a secret is accidentally committed, consider it compromised and rotate it immediately.

---

# 53. Project Status

### Currently implemented

```text
✓ React/TanStack frontend
✓ Bun backend
✓ PostgreSQL/Supabase database
✓ Prisma 7
✓ Prisma migrations
✓ Prisma seed
✓ Cattle API
✓ Farmer registration
✓ Farmer login
✓ Password hashing
✓ JWT authentication
✓ Frontend authentication integration
✓ Farmer registration page
✓ Login → Farmer dashboard flow
```

### In progress

```text
→ Dynamic farmer dashboard data
→ Complete farmer module
→ Complete veterinarian module
→ Collection centre workflow
→ Factory workflow
→ Authority workflow
→ Consumer verification workflow
→ Complete traceability workflow
```

### Planned

```text
→ Blockchain integration
→ Hyperledger-based traceability
→ Immutable traceability events
→ Production deployment
```

---

# 54. ResiduGuard Vision

The final system is intended to provide an end-to-end traceability chain:

```text
FARM
  │
  ▼
CATTLE
  │
  ▼
VETERINARY TREATMENT
  │
  ▼
MRL / AMU MONITORING
  │
  ▼
WITHDRAWAL PERIOD
  │
  ▼
MILK COLLECTION
  │
  ▼
MILK BATCH
  │
  ▼
FACTORY PROCESSING
  │
  ▼
PACKAGE
  │
  ▼
CONSUMER
  │
  ▼
TRACEABILITY VERIFICATION
```

The goal is to provide a reliable digital record of the dairy supply chain from livestock treatment through final consumer verification.
