CREATE TABLE "collection_centre_suppliers" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "collectionCentreId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "collection_centre_suppliers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "collection_centre_suppliers_farmerId_revokedAt_idx"
ON "collection_centre_suppliers"("farmerId", "revokedAt");

CREATE INDEX "collection_centre_suppliers_collectionCentreId_revokedAt_idx"
ON "collection_centre_suppliers"("collectionCentreId", "revokedAt");

CREATE UNIQUE INDEX "collection_centre_suppliers_farmerId_collectionCentreId_key"
ON "collection_centre_suppliers"("farmerId", "collectionCentreId");

ALTER TABLE "collection_centre_suppliers"
ADD CONSTRAINT "collection_centre_suppliers_farmerId_fkey"
FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "collection_centre_suppliers"
ADD CONSTRAINT "collection_centre_suppliers_collectionCentreId_fkey"
FOREIGN KEY ("collectionCentreId") REFERENCES "collection_centres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
