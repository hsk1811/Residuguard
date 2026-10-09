import { prisma } from "../lib/prisma";
import { canReceiveFarmerAccessGrant, isCompleteCentreProfile, profileUserLookup } from "./profileCompatibility";

async function findFarmer(userId: string) {
  return prisma.farmer.findUnique({ where: profileUserLookup(userId), select: { id: true } });
}

export async function listFarmerCollectionCentres(userId: string) {
  const farmer = await findFarmer(userId);
  if (!farmer) return null;
  const [centres, grants] = await Promise.all([
    prisma.collectionCentre.findMany({
      where: { userId: { not: null } },
      select: { id: true, userId: true, centreName: true, registrationNumber: true, phone: true, village: true, address: true, user: { select: { id: true } } },
      orderBy: { id: "asc" },
    }),
    prisma.collectionCentreSupplier.findMany({
      where: { farmerId: farmer.id },
      select: { id: true, collectionCentreId: true, grantedAt: true, revokedAt: true },
    }),
  ]);
  const grantByCentre = new Map(grants.map((grant) => [grant.collectionCentreId, grant]));
  return {
    centres: centres.filter(isCompleteCentreProfile).map((centre) => {
      const grant = grantByCentre.get(centre.id);
      return {
        ...centre,
        accessGranted: grant?.revokedAt === null,
        grantedAt: grant?.revokedAt === null ? grant.grantedAt.toISOString() : null,
      };
    }),
  };
}

export async function grantCollectionCentreAccess(userId: string, centreId: string) {
  const farmer = await findFarmer(userId);
  if (!farmer) return { error: "Farmer profile not found.", status: 404 } as const;
  const centre = await prisma.collectionCentre.findUnique({
    where: { id: centreId },
    select: { id: true, userId: true, centreName: true, registrationNumber: true, phone: true, address: true, user: { select: { id: true } } },
  });
  if (!centre) return { error: "Collection centre not found.", status: 404 } as const;
  if (!canReceiveFarmerAccessGrant(centre)) {
    return { error: "Only complete, linked collection centre profiles can receive access grants.", status: 409 } as const;
  }
  const now = new Date();
  const grant = await prisma.collectionCentreSupplier.upsert({
    where: { farmerId_collectionCentreId: { farmerId: farmer.id, collectionCentreId: centre.id } },
    create: { farmerId: farmer.id, collectionCentreId: centre.id },
    update: { grantedAt: now, revokedAt: null },
    select: { id: true, grantedAt: true },
  });
  return { grant: { id: grant.id, grantedAt: grant.grantedAt.toISOString() } };
}

export async function revokeCollectionCentreAccess(userId: string, centreId: string) {
  const farmer = await findFarmer(userId);
  if (!farmer) return { error: "Farmer profile not found.", status: 404 } as const;
  const result = await prisma.collectionCentreSupplier.updateMany({
    where: { farmerId: farmer.id, collectionCentreId: centreId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (result.count === 0) return { error: "No active access grant was found.", status: 404 } as const;
  return { message: "Collection centre access revoked." };
}
