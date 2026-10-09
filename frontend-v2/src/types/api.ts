export type UserRole = "FARMER" | "VETERINARIAN" | "COLLECTION_CENTRE" | "FACTORY" | "AUTHORITY";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string | null;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface RegistrationResponse {
  message: string;
  user: AuthUser & Record<string, unknown>;
}

export type MilkBatchStatus = "SAFE" | "HOLD" | "PROCESSING" | "DISPATCHED";
export type MilkEligibility = "HOLD" | "UNVERIFIED" | "ELIGIBLE_BY_RECORD";

export interface FarmerTreatment {
  id: string;
  medicineName: string;
  dosage: string | null;
  administeredAt: string;
  withdrawalEnds: string | null;
  reason: string | null;
}

export interface FarmerCattle {
  id: string;
  cattleId: string;
  name: string | null;
  breed: string | null;
  sex: string | null;
  dateOfBirth: string | null;
  createdAt: string;
  treatments: FarmerTreatment[];
}

export interface FarmerMilkBatch {
  id: string;
  batchId: string;
  date: string;
  volumeL: number;
  status: MilkBatchStatus;
  contributingAnimals: Array<{ cattle: Pick<FarmerCattle, "id" | "cattleId" | "name"> }>;
}

export interface FarmerDashboardData {
  farmer: { id: string; name: string; village: string };
  summary: {
    totalCattle: number;
    healthyCattle: number | null;
    underTreatmentCattle: number | null;
    withdrawalHoldCattle: number;
    safeMilkBatches: number;
  };
  cattle: FarmerCattle[];
  milkBatches: FarmerMilkBatch[];
  generatedAt: string;
}

export interface CollectionCentreSource {
  id: string;
  cattleId: string;
  name: string | null;
  breed: string | null;
  farmer: { village: string | null; user: { id: string; name: string } };
  eligibility: MilkEligibility;
  withdrawalEnds: string[];
}

export interface CollectionBatchContributor {
  id: string;
  cattleId: string;
  name: string | null;
  farmer: CollectionCentreSource["farmer"];
  eligibility: MilkEligibility;
}

export interface CollectionTraceEvent {
  id?: string;
  eventType: string;
  blockchainStatus: string | null;
  blockchainTxId: string | null;
  createdAt: string;
}

export interface CollectionMilkBatch {
  id: string;
  batchId: string;
  date: string;
  volumeL: number;
  createdAt: string;
  status: MilkBatchStatus;
  eligibility: "ELIGIBLE_BY_RECORD" | "HOLD";
  contributors: CollectionBatchContributor[];
  traceability: CollectionTraceEvent[];
}

export interface CollectionCentreDashboardData {
  centre: { name: string; centreName: string; village: string | null };
  summary: { todaysCollectionL: number; eligibleMilkL: number; holdSources: number; todaysBatches: number };
  sources: CollectionCentreSource[];
  batches: CollectionMilkBatch[];
  generatedAt: string;
}

export interface CreateCollectionBatchResponse {
  batch: Omit<CollectionMilkBatch, "eligibility">;
  warnings: Array<{ cattleId: string; eligibility: MilkEligibility }>;
}

export interface CollectionCentreDirectoryResponse {
  centres: Array<{
    id: string;
    centreName: string;
    registrationNumber: string;
    village: string | null;
    address: string;
    accessGranted: boolean;
    grantedAt: string | null;
  }>;
}

export interface FactoryMilkBatch {
  id: string;
  batchId: string;
  date: string;
  volumeL: number;
  recordedStatus: MilkBatchStatus;
  eligibility: "ELIGIBLE_BY_RECORD" | "HOLD";
  available: boolean;
  collectionCentre: string | null;
  collectionCentreProfileComplete: boolean;
  sourceCount: number;
}

export interface FactoryProcessingBatch {
  id: string;
  batchId: string;
  date: string;
  createdAt: string;
  volumeL: number;
  product: string;
  packs: number;
  status: "PROCESSING" | "COMPLETED" | "DISPATCHED" | "HOLD";
  sources: FactoryMilkBatch[];
}

export interface FactoryDashboardData {
  factory: { name: string; factoryName: string };
  summary: { incomingBatches: number; eligibleIncomingL: number; holdIncoming: number; processedBatches: number; processedVolumeL: number };
  incoming: FactoryMilkBatch[];
  processingBatches: FactoryProcessingBatch[];
  generatedAt: string;
}

export interface CreateProcessingBatchResponse { processingBatch: FactoryProcessingBatch }

export interface AuthorityUserRecord {
  id: string; name: string; email: string; role: UserRole; organization: string | null; createdAt: string;
}

export interface AuthorityTreatmentRecord {
  id: string; medicineName: string; dosage: string | null; administeredAt: string; withdrawalEnds: string | null; reason: string | null;
  cattle: { cattleId: string; name: string | null; farmer: { user: { name: string } } };
  veterinarian: { name: string | null; profileCompleteness: "COMPLETE" | "INCOMPLETE_LEGACY" };
}

export interface AuthorityCattleRecord {
  id: string; cattleId: string; name: string | null; breed: string | null; sex: string | null; createdAt: string;
  farmer: { village: string; user: { name: string; email: string } };
  treatments: Array<{ id: string; medicineName: string; dosage: string | null; administeredAt: string; withdrawalEnds: string | null; reason: string | null; veterinarian: { name: string | null; profileCompleteness: "COMPLETE" | "INCOMPLETE_LEGACY" } }>;
  withdrawalStatus: MilkEligibility;
}

export interface AuthorityMilkBatchRecord {
  id: string; batchId: string; date: string; volumeL: number; status: MilkBatchStatus; collectionCentre: string | null;
  collectionCentreProfileCompleteness: "COMPLETE" | "INCOMPLETE_LEGACY";
  eligibility: "ELIGIBLE_BY_RECORD" | "HOLD";
  sources: Array<{ cattleId: string; name: string | null; eligibility: MilkEligibility }>;
  processingBatchIds: string[];
}

export interface AuthorityProcessingBatchRecord {
  id: string; batchId: string; date: string; volumeL: number; product: string; packs: number; status: FactoryProcessingBatch["status"];
  factoryName: string | null; factoryProfileCompleteness: "COMPLETE" | "INCOMPLETE_LEGACY"; sourceMilkBatchIds: string[];
}

export interface AuthorityTraceabilityEvent {
  id: string; eventType: string; entityType: string; entityId: string; payload: unknown;
  blockchainTxId: string | null; blockNumber: string | null; blockchainStatus: string | null; createdAt: string;
}

export interface AuthorityDashboardData {
  summary: { users: number; cattle: number; treatments: number; milkBatches: number; processingBatches: number; activeWithdrawalHolds: number; withdrawalUnverified: number; holdMilkBatches: number; holdProcessingBatches: number };
  roleCounts: Partial<Record<UserRole, number>>;
  users: AuthorityUserRecord[];
  cattle: AuthorityCattleRecord[];
  treatments: AuthorityTreatmentRecord[];
  milkBatches: AuthorityMilkBatchRecord[];
  processingBatches: AuthorityProcessingBatchRecord[];
  holds: { cattle: Array<{ cattleId: string; name: string | null; farmerName: string; status: MilkEligibility }>; milkBatches: AuthorityMilkBatchRecord[]; processingBatches: AuthorityProcessingBatchRecord[] };
  traceabilityEvents: AuthorityTraceabilityEvent[];
  dataAvailability: {
    mrlReferences: { available: false; reason: string };
    holdInvestigations: { available: false; reason: string };
    blockchainVerification: { available: false; reason: string };
    managementActions: { available: false; reason: string };
    recordsReturned: { users: number; cattle: number; treatments: number; milkBatches: number; processingBatches: number; traceabilityEvents: number };
    recordLimit: number;
  };
  generatedAt: string;
}

export interface PublicBatchVerification {
  batch: {
    milkBatchId: string;
    status: MilkBatchStatus;
    collectionDate: string;
    processingBatches: Array<{
      batchId: string;
      date: string;
      status: FactoryProcessingBatch["status"];
      sourceBatchIds: string[];
    }>;
    timeline: Array<{
      eventType: string;
      direction: "collection" | "forward" | "portal";
      batchId: string;
      occurredAt: string;
      sourceBatchIds?: string[];
    }>;
    notices: string[];
  };
}
