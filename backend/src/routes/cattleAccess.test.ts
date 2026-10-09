import { describe, expect, test } from "bun:test";
import { authorizeCattleRead, farmerCattleWhere } from "./cattleAccess";

describe("GET /api/cattle authorization policy", () => {
  test("rejects unauthenticated requests", () => {
    expect(authorizeCattleRead(null)).toEqual({
      allowed: false,
      status: 401,
      error: "Authentication required",
    });
  });

  test("rejects veterinarian and non-farmer roles without querying cattle", () => {
    for (const role of ["VETERINARIAN", "COLLECTION_CENTRE", "FACTORY", "AUTHORITY", "CONSUMER"]) {
      expect(authorizeCattleRead({ userId: "user-1", role })).toMatchObject({
        allowed: false,
        status: 403,
      });
    }
  });

  test("permits a farmer identity and scopes the database query to that farmer", () => {
    const access = authorizeCattleRead({ userId: "farmer-user-1", role: "FARMER" });
    expect(access).toEqual({ allowed: true, farmerUserId: "farmer-user-1" });
    if (!access.allowed) throw new Error("Expected authorized farmer access");

    expect(farmerCattleWhere(access.farmerUserId)).toEqual({
      farmer: { is: { userId: "farmer-user-1" } },
    });
    expect(farmerCattleWhere("farmer-user-1")).not.toEqual(farmerCattleWhere("farmer-user-2"));
  });
});
