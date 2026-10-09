import { getCattle, getFarmerDashboard } from "./routes/cattle";
import { authorizeCattleRead } from "./routes/cattleAccess";
import { login, register, verifyBearerToken } from "./routes/auth";
import { createCollectionBatch, getCollectionCentreDashboard } from "./routes/collectionCentre";
import { grantCollectionCentreAccess, listFarmerCollectionCentres, revokeCollectionCentreAccess } from "./routes/farmerCollectionCentres";
import { createProcessingBatch, getFactoryDashboard } from "./routes/factory";
import { getAuthorityDashboard, isConfiguredAuthorityAdmin } from "./routes/authority";
import { getPublicMilkBatchVerification } from "./routes/publicVerification";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const server = Bun.serve({
  port: Number(process.env.PORT) || 3000,

  async fetch(req) {
    const url = new URL(req.url);

    // Handle browser CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // POST /api/auth/login
    if (req.method === "POST" && url.pathname === "/api/auth/login") {
      const response = await login(req);

      const headers = new Headers(response.headers);

      for (const [key, value] of Object.entries(corsHeaders)) {
        headers.set(key, value);
      }

      return new Response(response.body, {
        status: response.status,
        headers,
      });
    }
    // POST /api/auth/register
    if (req.method === "POST" && url.pathname === "/api/auth/register") {
       const response = await register(req);

       const headers = new Headers(response.headers);

       for (const [key, value] of Object.entries(corsHeaders)) {
          headers.set(key, value);
       }

      return new Response(response.body, {
       status: response.status,
       headers,
    });
  }

    // GET /api/public/milk-batches/:batchId/verification (public, sanitized read-only lookup)
    const publicBatchMatch = url.pathname.match(/^\/api\/public\/milk-batches\/([^/]+)\/verification$/);
    if (req.method === "GET" && publicBatchMatch) {
      let batchId: string;
      try { batchId = decodeURIComponent(publicBatchMatch[1] ?? ""); }
      catch { return Response.json({ error: "Milk Batch ID is not valid URL encoding." }, { status: 400, headers: corsHeaders }); }
      try {
        const result = await getPublicMilkBatchVerification(batchId);
        if ("error" in result) return Response.json({ error: result.error }, { status: result.status, headers: corsHeaders });
        return Response.json(result, { headers: corsHeaders });
      } catch (error) {
        console.error("Failed to verify public milk batch:", error);
        return Response.json({ error: "Batch verification is temporarily unavailable." }, { status: 500, headers: corsHeaders });
      }
    }

    // GET /api/farmer/dashboard
    if (req.method === "GET" && url.pathname === "/api/farmer/dashboard") {
      const identity = await verifyBearerToken(req);
      if (!identity) {
        return Response.json({ error: "Authentication required" }, { status: 401, headers: corsHeaders });
      }
      if (identity.role !== "FARMER") {
        return Response.json({ error: "Farmer access is required" }, { status: 403, headers: corsHeaders });
      }

      try {
        const dashboard = await getFarmerDashboard(identity.userId);
        if (!dashboard) {
          return Response.json({ error: "Farmer profile not found" }, { status: 404, headers: corsHeaders });
        }
        return Response.json(dashboard, { headers: corsHeaders });
      } catch (error) {
        console.error("Failed to fetch farmer dashboard:", error);
        return Response.json({ error: "Failed to fetch farmer dashboard" }, { status: 500, headers: corsHeaders });
      }
    }

    // GET /api/farmer/collection-centres (directory and this farmer's grants)
    if (req.method === "GET" && url.pathname === "/api/farmer/collection-centres") {
      const identity = await verifyBearerToken(req);
      if (!identity) return Response.json({ error: "Authentication required" }, { status: 401, headers: corsHeaders });
      if (identity.role !== "FARMER") return Response.json({ error: "Farmer access is required" }, { status: 403, headers: corsHeaders });
      try {
        const result = await listFarmerCollectionCentres(identity.userId);
        if (!result) return Response.json({ error: "Farmer profile not found" }, { status: 404, headers: corsHeaders });
        return Response.json(result, { headers: corsHeaders });
      } catch (error) {
        console.error("Failed to fetch collection centre directory:", error);
        return Response.json({ error: "Failed to fetch collection centre directory" }, { status: 500, headers: corsHeaders });
      }
    }

    const centreAccessMatch = url.pathname.match(/^\/api\/farmer\/collection-centres\/([^/]+)\/access$/);
    if ((req.method === "POST" || req.method === "DELETE") && centreAccessMatch) {
      const identity = await verifyBearerToken(req);
      if (!identity) return Response.json({ error: "Authentication required" }, { status: 401, headers: corsHeaders });
      if (identity.role !== "FARMER") return Response.json({ error: "Farmer access is required" }, { status: 403, headers: corsHeaders });
      const centreId = decodeURIComponent(centreAccessMatch[1] ?? "");
      try {
        const result = req.method === "POST"
          ? await grantCollectionCentreAccess(identity.userId, centreId)
          : await revokeCollectionCentreAccess(identity.userId, centreId);
        if ("error" in result) return Response.json({ error: result.error }, { status: result.status, headers: corsHeaders });
        return Response.json(result, { status: req.method === "POST" ? 201 : 200, headers: corsHeaders });
      } catch (error) {
        console.error("Failed to update collection centre access:", error);
        return Response.json({ error: "Could not update collection centre access" }, { status: 500, headers: corsHeaders });
      }
    }

    // GET /api/collection-centre/dashboard
    if (req.method === "GET" && url.pathname === "/api/collection-centre/dashboard") {
      const identity = await verifyBearerToken(req);
      if (!identity) return Response.json({ error: "Authentication required" }, { status: 401, headers: corsHeaders });
      if (identity.role !== "COLLECTION_CENTRE") return Response.json({ error: "Collection centre access is required" }, { status: 403, headers: corsHeaders });
      try {
        const dashboard = await getCollectionCentreDashboard(identity.userId);
        if (!dashboard) return Response.json({ error: "Collection centre profile not found" }, { status: 404, headers: corsHeaders });
        return Response.json(dashboard, { headers: corsHeaders });
      } catch (error) {
        console.error("Failed to fetch collection centre dashboard:", error);
        return Response.json({ error: "Failed to fetch collection centre dashboard" }, { status: 500, headers: corsHeaders });
      }
    }

    // POST /api/collection-centre/milk-batches
    if (req.method === "POST" && url.pathname === "/api/collection-centre/milk-batches") {
      const identity = await verifyBearerToken(req);
      if (!identity) return Response.json({ error: "Authentication required" }, { status: 401, headers: corsHeaders });
      if (identity.role !== "COLLECTION_CENTRE") return Response.json({ error: "Collection centre access is required" }, { status: 403, headers: corsHeaders });
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return Response.json({ error: "Request body must be valid JSON." }, { status: 400, headers: corsHeaders });
      }
      try {
        const result = await createCollectionBatch(identity.userId, body);
        if ("error" in result) return Response.json({ error: result.error }, { status: result.status, headers: corsHeaders });
        return Response.json(result, { status: 201, headers: corsHeaders });
      } catch (error) {
        console.error("Failed to create collection batch:", error);
        return Response.json({ error: "Milk batch was not saved. Please try again." }, { status: 500, headers: corsHeaders });
      }
    }

    // GET /api/factory/dashboard
    if (req.method === "GET" && url.pathname === "/api/factory/dashboard") {
      const identity = await verifyBearerToken(req);
      if (!identity) return Response.json({ error: "Authentication required" }, { status: 401, headers: corsHeaders });
      if (identity.role !== "FACTORY") return Response.json({ error: "Factory access is required" }, { status: 403, headers: corsHeaders });
      try {
        const dashboard = await getFactoryDashboard(identity.userId);
        if (!dashboard) return Response.json({ error: "Factory profile not found" }, { status: 404, headers: corsHeaders });
        return Response.json(dashboard, { headers: corsHeaders });
      } catch (error) {
        console.error("Failed to fetch factory dashboard:", error);
        return Response.json({ error: "Failed to fetch factory dashboard" }, { status: 500, headers: corsHeaders });
      }
    }

    // POST /api/factory/processing-batches
    if (req.method === "POST" && url.pathname === "/api/factory/processing-batches") {
      const identity = await verifyBearerToken(req);
      if (!identity) return Response.json({ error: "Authentication required" }, { status: 401, headers: corsHeaders });
      if (identity.role !== "FACTORY") return Response.json({ error: "Factory access is required" }, { status: 403, headers: corsHeaders });
      let body: unknown;
      try { body = await req.json(); }
      catch { return Response.json({ error: "Request body must be valid JSON." }, { status: 400, headers: corsHeaders }); }
      try {
        const result = await createProcessingBatch(identity.userId, body);
        if ("error" in result) return Response.json({ error: result.error }, { status: result.status, headers: corsHeaders });
        return Response.json(result, { status: 201, headers: corsHeaders });
      } catch (error) {
        console.error("Failed to create processing batch:", error);
        return Response.json({ error: "Processing batch was not saved. Please retry." }, { status: 500, headers: corsHeaders });
      }
    }

    // GET /api/authority/dashboard
    if (req.method === "GET" && url.pathname === "/api/authority/dashboard") {
      const identity = await verifyBearerToken(req);
      if (!identity) return Response.json({ error: "Authentication required" }, { status: 401, headers: corsHeaders });
      if (identity.role !== "AUTHORITY") return Response.json({ error: "Authority access is required" }, { status: 403, headers: corsHeaders });
      const configuredAdmins = (process.env.AUTHORITY_ADMIN_USER_IDS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
      if (configuredAdmins.length === 0) return Response.json({ error: "Authority administration is not configured. Set AUTHORITY_ADMIN_USER_IDS on the backend." }, { status: 503, headers: corsHeaders });
      if (!isConfiguredAuthorityAdmin(identity.userId)) return Response.json({ error: "This account is not authorized for administrative access." }, { status: 403, headers: corsHeaders });
      try {
        const dashboard = await getAuthorityDashboard();
        return Response.json(dashboard, { headers: corsHeaders });
      } catch (error) {
        console.error("Failed to fetch Authority dashboard:", error);
        return Response.json({ error: "Failed to fetch Authority dashboard" }, { status: 500, headers: corsHeaders });
      }
    }

    // GET /api/cattle (authenticated farmer's own cattle only)
    if (req.method === "GET" && url.pathname === "/api/cattle") {
      const access = authorizeCattleRead(await verifyBearerToken(req));
      if (access.allowed === false) return Response.json({ error: access.error }, { status: access.status, headers: corsHeaders });
      try {
        const cattle = await getCattle(access.farmerUserId);

        return Response.json(cattle, {
          headers: corsHeaders,
        });
      } catch (error) {
        console.error("Failed to fetch cattle:", error);

        return Response.json(
          { error: "Failed to fetch cattle" },
          {
            status: 500,
            headers: corsHeaders,
          },
        );
      }
    }

    return Response.json(
      { error: "Route not found" },
      {
        status: 404,
        headers: corsHeaders,
      },
    );
  },
});

console.log(
  `ResiduGuard backend running at http://localhost:${server.port}`,
);
