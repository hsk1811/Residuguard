import { Route, Routes } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { SignInPage } from "../pages/SignInPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { LandingPage } from "../pages/LandingPage";
import { RegistrationChooserPage } from "../pages/RegistrationChooserPage";
import { RoleRegistrationPage } from "../pages/RoleRegistrationPage";
import { RoleDashboardPage } from "../pages/RoleDashboardPage";
import { BatchVerificationPage } from "../pages/BatchVerificationPage";
import { RequireRole } from "../features/auth/RequireRole";
import { FarmerDashboardLayout } from "../layouts/FarmerDashboardLayout";
import { FarmerDashboardPage } from "../pages/FarmerDashboardPage";
import { FarmerCattleDetailPage } from "../pages/FarmerCattleDetailPage";
import { CollectionCentreDashboardLayout } from "../layouts/CollectionCentreDashboardLayout";
import { CollectionCentreDashboardPage } from "../pages/CollectionCentreDashboardPage";
import { FactoryDashboardLayout } from "../layouts/FactoryDashboardLayout";
import { FactoryDashboardPage } from "../pages/FactoryDashboardPage";
import { AuthorityDashboardLayout } from "../layouts/AuthorityDashboardLayout";
import { AuthorityDashboardPage } from "../pages/AuthorityDashboardPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="sign-in" element={<SignInPage />} />
        <Route path="register" element={<RegistrationChooserPage />} />
        <Route path="register/:role" element={<RoleRegistrationPage />} />
        <Route path="verify" element={<BatchVerificationPage />} />
        <Route path="dashboard/veterinarian" element={<RequireRole allowedRole="VETERINARIAN"><RoleDashboardPage role="VETERINARIAN" /></RequireRole>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="dashboard/farmer" element={<RequireRole allowedRole="FARMER"><FarmerDashboardLayout /></RequireRole>}>
        <Route index element={<FarmerDashboardPage />} />
        <Route path="cattle/:cattleId" element={<FarmerCattleDetailPage />} />
      </Route>
      <Route path="dashboard/collection-centre" element={<RequireRole allowedRole="COLLECTION_CENTRE"><CollectionCentreDashboardLayout /></RequireRole>}>
        <Route index element={<CollectionCentreDashboardPage />} />
      </Route>
      <Route path="dashboard/factory" element={<RequireRole allowedRole="FACTORY"><FactoryDashboardLayout /></RequireRole>}>
        <Route index element={<FactoryDashboardPage />} />
      </Route>
      <Route path="dashboard/authority" element={<RequireRole allowedRole="AUTHORITY"><AuthorityDashboardLayout /></RequireRole>}>
        <Route index element={<AuthorityDashboardPage />} />
      </Route>
    </Routes>
  );
}
