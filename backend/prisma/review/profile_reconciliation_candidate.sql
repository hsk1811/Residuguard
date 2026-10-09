-- REVIEW ARTIFACT ONLY.
-- This is a draft for a disposable restored database, not a Prisma migration.
-- It has not been executed or tested against any database. Do not apply as-is.
-- Existing legacy columns and primary keys are intentionally retained.

-- Expand legacy profile tables with nullable current-model fields. Nullable
-- additions preserve existing rows without inventing identity/profile data.
ALTER TABLE "veterinarians"
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "licenseNumber" TEXT,
  ADD COLUMN "specialization" TEXT,
  ADD COLUMN "clinicName" TEXT,
  ADD COLUMN "address" TEXT;

ALTER TABLE "collection_centres"
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "centreName" TEXT,
  ADD COLUMN "registrationNumber" TEXT,
  ADD COLUMN "phone" TEXT;

ALTER TABLE "factories"
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "factoryName" TEXT,
  ADD COLUMN "registrationNumber" TEXT,
  ADD COLUMN "phone" TEXT;

-- This table has no legacy counterpart. It is created empty; no authority
-- profiles or user links are inferred or inserted by this candidate.
CREATE TABLE "authorities" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "designation" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "officeAddress" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "authorities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "authorities_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "authorities_userId_key"
  ON "authorities"("userId");
CREATE UNIQUE INDEX "authorities_employeeId_key"
  ON "authorities"("employeeId");

-- Intentionally deferred until profile data has been verified:
-- * NOT NULL / UNIQUE constraints on the newly added profile columns
-- * veterinarian / collection-centre / factory userId foreign keys
-- * any legacy-to-current backfill or legacy-column drop/rename
-- * collection_centre_suppliers (review its existing untracked migration
--   independently; do not infer or insert grants)
-- * global uniqueness of processing_milk_batches.milkBatchId

-- Disposable-copy preflight/validation queries (run before and after the
-- candidate on that copy only; adapt identifier types only if the restored
-- catalog proves they differ):
--
-- Counts:
-- SELECT 'veterinarians' AS table_name, COUNT(*) FROM "veterinarians"
-- UNION ALL SELECT 'collection_centres', COUNT(*) FROM "collection_centres"
-- UNION ALL SELECT 'factories', COUNT(*) FROM "factories"
-- UNION ALL SELECT 'users', COUNT(*) FROM "users"
-- UNION ALL SELECT 'cattle', COUNT(*) FROM "cattle"
-- UNION ALL SELECT 'treatments', COUNT(*) FROM "treatments"
-- UNION ALL SELECT 'milk_batches', COUNT(*) FROM "milk_batches"
-- UNION ALL SELECT 'processing_batches', COUNT(*) FROM "processing_batches"
-- UNION ALL SELECT 'processing_milk_batches', COUNT(*) FROM "processing_milk_batches"
-- UNION ALL SELECT 'packages', COUNT(*) FROM "packages"
-- UNION ALL SELECT 'traceability_events', COUNT(*) FROM "traceability_events";
--
-- Legacy primary key preservation (repeat for each profile table, swapping
-- table name). Run these immediately BEFORE the candidate, then compare after:
-- CREATE TEMP TABLE pre_veterinarians_ids ON COMMIT PRESERVE ROWS AS SELECT "id" FROM "veterinarians";
-- CREATE TEMP TABLE pre_collection_centres_ids ON COMMIT PRESERVE ROWS AS SELECT "id" FROM "collection_centres";
-- CREATE TEMP TABLE pre_factories_ids ON COMMIT PRESERVE ROWS AS SELECT "id" FROM "factories";
-- After applying the candidate:
-- SELECT "id" FROM pre_veterinarians_ids EXCEPT SELECT "id" FROM "veterinarians";
-- SELECT "id" FROM "veterinarians" EXCEPT SELECT "id" FROM pre_veterinarians_ids;
-- Repeat both EXCEPT queries for collection_centres and factories. Each must
-- return zero rows. Persist snapshots outside the session if the test runner
-- reconnects between steps.
--
-- Null and duplicate checks before adding final constraints:
-- SELECT COUNT(*) FROM "veterinarians" WHERE "userId" IS NULL OR "licenseNumber" IS NULL;
-- SELECT "userId", COUNT(*) FROM "veterinarians" WHERE "userId" IS NOT NULL GROUP BY "userId" HAVING COUNT(*) > 1;
-- SELECT "licenseNumber", COUNT(*) FROM "veterinarians" WHERE "licenseNumber" IS NOT NULL GROUP BY "licenseNumber" HAVING COUNT(*) > 1;
-- SELECT COUNT(*) FROM "collection_centres" WHERE "userId" IS NULL OR "centreName" IS NULL OR "registrationNumber" IS NULL OR "phone" IS NULL OR "address" IS NULL;
-- SELECT "userId", COUNT(*) FROM "collection_centres" WHERE "userId" IS NOT NULL GROUP BY "userId" HAVING COUNT(*) > 1;
-- SELECT "registrationNumber", COUNT(*) FROM "collection_centres" WHERE "registrationNumber" IS NOT NULL GROUP BY "registrationNumber" HAVING COUNT(*) > 1;
-- SELECT COUNT(*) FROM "factories" WHERE "userId" IS NULL OR "factoryName" IS NULL OR "registrationNumber" IS NULL OR "phone" IS NULL OR "address" IS NULL;
-- SELECT "userId", COUNT(*) FROM "factories" WHERE "userId" IS NOT NULL GROUP BY "userId" HAVING COUNT(*) > 1;
-- SELECT "registrationNumber", COUNT(*) FROM "factories" WHERE "registrationNumber" IS NOT NULL GROUP BY "registrationNumber" HAVING COUNT(*) > 1;
-- SELECT "milkBatchId", COUNT(*) FROM "processing_milk_batches" GROUP BY "milkBatchId" HAVING COUNT(*) > 1;
