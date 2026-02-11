import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { CompaniesPage } from "@/pages/CompaniesPage";
import { ContactsPage } from "@/pages/ContactsPage";
import { MediumsPage } from "@/pages/MediumsPage";
import { ChannelsPage } from "@/pages/ChannelsPage";
import { ActionsPage } from "@/pages/ActionsPage";
import { CampaignsPage } from "@/pages/CampaignsPage";
import { CampaignDetailPage } from "@/pages/CampaignDetailPage";
import NewsletterTypesPage from "@/pages/NewsletterTypesPage";
import MagazinesPage from "@/pages/MagazinesPage";
import MagazineEditionPage from "@/pages/MagazineEditionPage";
import { UsersPage } from "@/pages/UsersPage";
import { MainLayout } from "@/layouts/MainLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="mediums" element={<MediumsPage />} />
          <Route path="channels" element={<ChannelsPage />} />
          <Route path="actions" element={<ActionsPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="newsletters" element={<NewsletterTypesPage />} />
          <Route path="revistas" element={<MagazinesPage />} />
          <Route path="revistas/:id" element={<MagazineEditionPage />} />
          <Route path="usuarios" element={<UsersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
