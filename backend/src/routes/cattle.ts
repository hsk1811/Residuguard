import { prisma } from "../lib/prisma";
import { farmerCattleWhere } from "./cattleAccess";

export async function getCattle(farmerUserId: string) {
  return await prisma.cattle.findMany({
    where: farmerCattleWhere(farmerUserId),
    select: {
      id: true,
      cattleId: true,
      name: true,
      breed: true,
      sex: true,
      dateOfBirth: true,
      createdAt: true,
      treatments: {
        orderBy: { administeredAt: "desc" },
        select: {
          id: true,
          medicineName: true,
          dosage: true,
          administeredAt: true,
          withdrawalEnds: true,
          reason: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getFarmerDashboard(userId: string) {
  const farmer = await prisma.farmer.findUnique({
    where: { userId },
    select: {
      id: true,
      village: true,
      user: { select: { id: true, name: true } },
    },
  });

  if (!farmer) return null;

  const [cattle, milkBatches] = await Promise.all([
    prisma.cattle.findMany({
      where: { farmerId: farmer.id },
      select: {
        id: true,
        cattleId: true,
        name: true,
        breed: true,
        sex: true,
        dateOfBirth: true,
        createdAt: true,
        treatments: {
          orderBy: { administeredAt: "desc" },
          select: {
            id: true,
            medicineName: true,
            dosage: true,
            administeredAt: true,
            withdrawalEnds: true,
            reason: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.milkBatch.findMany({
      where: {
        contributingAnimals: {
          some: { cattle: { farmerId: farmer.id } },
        },
      },
      select: {
        id: true,
        batchId: true,
        date: true,
        volumeL: true,
        status: true,
        contributingAnimals: {
          where: { cattle: { farmerId: farmer.id } },
          select: {
            cattle: { select: { id: true, cattleId: true, name: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    }),
  ]);

  const now = Date.now();
  const withdrawalHoldCattleCount = cattle.filter((animal) =>
    animal.treatments.some((treatment) => treatment.withdrawalEnds !== null && treatment.withdrawalEnds.getTime() > now),
  ).length;

  return {
    farmer: { id: farmer.id, name: farmer.user.name, village: farmer.village },
    summary: {
      totalCattle: cattle.length,
      healthyCattle: null,
      underTreatmentCattle: null,
      withdrawalHoldCattle: withdrawalHoldCattleCount,
      safeMilkBatches: milkBatches.filter((batch) => batch.status === "SAFE").length,
    },
    cattle,
    milkBatches,
    generatedAt: new Date(now).toISOString(),
  };
}
