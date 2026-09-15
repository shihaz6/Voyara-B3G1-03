import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import HelpPage from "./pages/HelpPage";
import ListTourPage from "./pages/ListTourPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import { DestinationDetailPage, PackageDetailPage } from "./pages/PlaceDetailPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute, TouristRoute } from "./components/RoleBasedRoute";
import TouristDashboard from "./pages/tourist/TouristDashboard";
import TouristBookingDetail from "./pages/tourist/TouristBookingDetail";
import TouristBookingCreate from "./pages/tourist/TouristBookingCreate";
import TouristAccommodationBooking from "./pages/tourist/TouristAccommodationBooking";
import TouristVehicleBooking from "./pages/tourist/TouristVehicleBooking";
import { DashboardLayout } from "./pages/dashboard/DashboardLayout";
import { DashboardHome } from "./pages/dashboard/DashboardHome";
import { AccommodationManagement } from "./pages/dashboard/AccommodationManagement";
import { GuideManagement } from "./pages/dashboard/GuideManagement";
import { BookingManagement } from "./pages/dashboard/BookingManagement";
import { PackageManagement } from "./pages/dashboard/PackageManagement";
import { DestinationManagement } from "./pages/dashboard/DestinationManagement";
import { VehicleRentalManagement } from "./pages/dashboard/VehicleRentalManagement";

export const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  { path: "/login", Component: LoginPage },
  { path: "/help", Component: HelpPage },
  { path: "/list-tour", Component: ListTourPage },
  { path: "/destinations/:id", Component: DestinationDetailPage },
  { path: "/packages/:id", Component: PackageDetailPage },
  { path: "/unauthorized", Component: UnauthorizedPage },
  {
    Component: ProtectedRoute,
    children: [
      {
        Component: TouristRoute,
        children: [
          { path: "/tourist/dashboard", Component: TouristDashboard },
          { path: "/tourist/bookings/new", Component: TouristBookingCreate },
          { path: "/tourist/bookings/:id", Component: TouristBookingDetail },
          { path: "/tourist/accommodations/:id/book", Component: TouristAccommodationBooking },
          { path: "/tourist/vehicles/:id/book", Component: TouristVehicleBooking },
          { path: "/book", Component: TouristBookingCreate },
        ],
      },
      {
        Component: AdminRoute,
        children: [
          {
            path: "/dashboard",
            Component: DashboardLayout,
            children: [
              { index: true, Component: DashboardHome },
              { path: "accommodations", Component: AccommodationManagement },
              { path: "guides", Component: GuideManagement },
              { path: "bookings", Component: BookingManagement },
              { path: "packages", Component: PackageManagement },
              { path: "destinations", Component: DestinationManagement },
              { path: "vehicles", Component: VehicleRentalManagement },
            ],
          },
        ],
      },
    ],
  },
]);
