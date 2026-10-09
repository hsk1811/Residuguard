import { describe, expect, test } from "bun:test";
import { buildPublicMilkBatchVerification } from "./publicVerificationPolicy";

describe("public Milk Batch verification projection", () => {
  test("returns public traceability while omitting user, treatment, and internal event data", () => {
    const internalEvent = {
      eventType: "PROCESSING_BATCH_CREATED",
      entityType: "PROCESSING_BATCH",
      entityId: "internal-processing-row-id",
      createdAt: "2026-10-09T06:01:00.000Z",
      payload: { privateAddress: "private address", blockchainTxId: "unverified-reference" },
    };
    const result = buildPublicMilkBatchVerification(
      {
        id: "internal-milk-row-id",
        batchId: "RG-MB-20261009-ABCD1234",
        date: "2026-10-09T04:00:00.000Z",
        status: "SAFE",
        farmerPhone: "+910000000000",
        privateAddress: "private address",
      } as { id: string; batchId: string; date: string; status: string },
      [{
        entityId: "internal-processing-row-id",
        batchId: "RG-PB-20261009-ABCD5678",
        date: "2026-10-09T06:00:00.000Z",
        status: "PROCESSING",
        sourceBatchIds: ["RG-MB-20261009-ABCD1234"],
        prescription: "private treatment data",
      } as { entityId: string; batchId: string; date: string; status: string; sourceBatchIds: string[] }],
      [internalEvent],
    );

    const serialized = JSON.stringify(result);
    expect(serialized).toContain("RG-MB-20261009-ABCD1234");
    expect(serialized).toContain("RG-PB-20261009-ABCD5678");
    expect(serialized).not.toContain("internal-milk-row-id");
    expect(serialized).not.toContain("internal-processing-row-id");
    expect(serialized).not.toContain("farmerPhone");
    expect(serialized).not.toContain("privateAddress");
    expect(serialized).not.toContain("prescription");
    expect(serialized).not.toContain("unverified-reference");
    expect(result.batch.notices.join(" ")).toContain("does not represent laboratory residue testing");
    expect(result.batch.notices.join(" ")).toContain("no independent blockchain confirmation");
  });
});
