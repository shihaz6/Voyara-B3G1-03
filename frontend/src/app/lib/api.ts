const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";
const MANAGEMENT_AUTH_REQUIRED = import.meta.env.VITE_MANAGEMENT_AUTH_REQUIRED === "true";
export { API_BASE_URL };

export interface Destination {
  id: number;
  name: string;
  country: string;
  continent: string;
  categories: string[];
  description: string;
  image: string;
  tours: number;
  status: "Featured" | "Active" | "Hidden";
  rating: number;
  reviews: number;
  bestSeason: string;
  highlights: string;
}

export interface TourPackage {
  id: number;
  name: string;
  category: string;
  destinations: string[];
  duration: number;
  price: number;
  maxGroup: number;
  difficulty: "Easy" | "Moderate" | "Challenging";
  status: "Active" | "Draft" | "Archived";
  rating: number;
  reviews: number;
  bookings: number;
  image: string;
  included: string;
  description: string;
}

export interface Booking {
  id: string;
  bookingType?: "PACKAGE" | "ACCOMMODATION" | "VEHICLE" | "CUSTOM";
  guest: string;
  email: string;
  destination: string;
  pkg: string;
  guide: string;
  guideSelectionType?: "VOYARA" | "OWN";
  guideResourceId?: number | null;
  accommodation: string;
  accommodationSelectionType?: "VOYARA" | "OWN";
  accommodationResourceId?: number | null;
  vehicle: string;
  vehicleSelectionType?: "VOYARA" | "OWN";
  vehicleResourceId?: number | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  status: "Confirmed" | "Pending" | "Cancelled" | "Completed";
  payment: "Paid" | "Pending" | "Refunded";
  notes: string;
  createdAt: string;
}

export interface Guide {
  id: number;
  name: string;
  initials: string;
  color: string;
  location: string;
  country: string;
  specialties: string[];
  languages: string[];
  rating: number;
  reviews: number;
  pricePerDay: number;
  experience: number;
  status: "Available" | "Busy" | "Offline";
  bio: string;
  toursCompleted: number;
}

export interface Accommodation {
  id: number;
  name: string;
  type: "Hotel" | "Villa" | "Resort" | "Hostel" | "Apartment";
  destinationId?: number | null;
  location: string;
  country: string;
  price: number;
  rooms: number;
  rating: number;
  reviews: number;
  status: "Active" | "Inactive" | "Maintenance";
  amenities: string[];
  image: string;
  occupancy?: number;
}

export interface Vehicle {
  id: number;
  name: string;
  brand: string;
  model: string;
  year: number;
  type: "Car" | "SUV" | "Van" | "Minibus" | "Motorbike" | "Luxury";
  capacity: number;
  pricePerDay: number;
  status: "Available" | "Rented" | "Maintenance";
  transmission: "Automatic" | "Manual";
  fuel: "Petrol" | "Diesel" | "Electric" | "Hybrid";
  features: string[];
  location: string;
  image: string;
  mileage: number;
  plate: string;
}

type ApiErrorBody = { message?: string; error?: string };
type ResourcePayload<T extends { id: string | number }> = Omit<T, "id"> & Partial<Pick<T, "id">>;

const PUBLIC_GET_PATHS = [
  "/destinations",
  "/packages",
  "/accommodations",
  "/tour-guides",
  "/vehicles",
  "/ai-chat/welcome",
  "/ai-chat/suggestions",
];

const AUTH_REQUIRED_WRITE_PATHS = [
  "/destinations",
  "/packages",
  "/bookings",
  "/accommodations",
  "/tour-guides",
  "/vehicles",
  "/tourist",
];

function isPublicGetRequest(path: string, method: string) {
  if (method.toUpperCase() !== "GET") return false;
  return PUBLIC_GET_PATHS.some((publicPath) => path === publicPath || path.startsWith(`${publicPath}/`) || path.startsWith(`${publicPath}?`));
}

function isManagementRequest(path: string) {
  return ["/destinations", "/packages", "/accommodations", "/tour-guides", "/vehicles"]
    .some((managementPath) => path === managementPath || path.startsWith(`${managementPath}/`));
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method ?? "GET";
  const token = sessionStorage.getItem("voyara_token");
  const publicGetRequest = isPublicGetRequest(path, method);
  const localOpenManagementRequest = !MANAGEMENT_AUTH_REQUIRED && isManagementRequest(path);
  const authRequiredRequest = !publicGetRequest && AUTH_REQUIRED_WRITE_PATHS.some((protectedPath) => path === protectedPath || path.startsWith(`${protectedPath}/`));
  if (authRequiredRequest && !localOpenManagementRequest && !token) {
    sessionStorage.removeItem("voyara_user");
    throw new Error("Please log in again as an authorized user.");
  }

  const shouldAttachToken = token && !publicGetRequest && !localOpenManagementRequest;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(shouldAttachToken ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401 && !localOpenManagementRequest) {
      sessionStorage.removeItem("voyara_user");
      sessionStorage.removeItem("voyara_token");
      window.dispatchEvent(new Event("voyara:auth-expired"));
    }
    let body: ApiErrorBody = {};
    try {
      body = await response.json();
    } catch {
      body = {};
    }
    throw new Error(body.message || body.error || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

function resource<T extends { id: Id }, Id extends string | number>(path: string) {
  return {
    list: () => request<T[]>(path),
    get: (id: Id) => request<T>(`${path}/${id}`),
    create: (payload: ResourcePayload<T>) => request<T>(path, { method: "POST", body: JSON.stringify(payload) }),
    update: (id: Id, payload: ResourcePayload<T>) => request<T>(`${path}/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    remove: (id: Id) => request<void>(`${path}/${id}`, { method: "DELETE" }),
  };
}

export const destinationsApi = resource<Destination, number>("/destinations");
export const packagesApi = resource<TourPackage, number>("/packages");
export const bookingsApi = resource<Booking, string>("/bookings");
export const touristBookingsApi = {
  list: () => request<Booking[]>("/tourist/bookings"),
  detail: (id: string) => request<Booking>(`/tourist/bookings/${id}`),
  create: (payload: Partial<Booking>) => request<Booking>("/tourist/bookings", { method: "POST", body: JSON.stringify(payload) }),
  cancel: (id: string) => request<Booking>(`/tourist/bookings/${id}/cancel`, { method: "PATCH" }),
  payment: (id: string) => request<Payment | null>(`/tourist/bookings/${id}/payment`),
  pay: (id: string, paymentMethod: string) => request<Payment>(`/tourist/bookings/${id}/payment`, { method: "POST", body: JSON.stringify({ paymentMethod }) }),
};
export interface Payment { id: number; amount: number; paymentMethod: string; status: "Paid" | "Pending" | "Failed"; transactionReference: string; paidAt: string; }
export const touristProfileApi = {
  get: () => request<{ id: number; fullName: string; email: string; phone?: string; nationality?: string; passportNumber?: string; preferences?: string }>('/tourist/profile'),
  update: (payload: { fullName: string; phone?: string; nationality?: string; passportNumber?: string; preferences?: string }) => request<{ id: number; fullName: string; email: string; phone?: string; nationality?: string; passportNumber?: string; preferences?: string }>('/tourist/profile', { method: 'PUT', body: JSON.stringify(payload) }),
};
export const touristReviewsApi = {
  list: () => request<Review[]>('/tourist/reviews'),
  create: (bookingId: string, payload: { targetType: string; targetId?: number; rating: number; comment?: string }) => request<Review>(`/tourist/bookings/${bookingId}/reviews`, { method: 'POST', body: JSON.stringify(payload) }),
};
export interface Review { id: number; bookingId: string; targetType: string; targetId?: number; rating: number; comment?: string; createdAt: string; }
export interface Notification { id: number; title: string; message: string; type?: string; referenceId?: string; read: boolean; createdAt: string; }
export const notificationsApi = {
  list: () => request<Notification[]>('/notifications'),
  markRead: (id: number) => request<Notification>(`/notifications/${id}/read`, { method: 'PATCH' }),
};
export interface DailyReport {
  date: string;
  summary: { activityCount: number; totalBookings: number; pending: number; confirmed: number; completed: number; cancelled: number; paidRevenue: number };
  resources: { destinations: number; packages: number; accommodations: number; activeAccommodations: number; guides: number; vehicles: number };
  bookings: Array<{ id: string; guest: string; email: string; packageName: string; destination: string; checkIn?: string; checkOut?: string; guests: number; total: number; status: string; payment: string; guide?: string; accommodation?: string; vehicle?: string; createdAt?: string }>;
}
export const reportsApi = {
  daily: (date?: string) => request<DailyReport>(`/reports/daily${date ? `?date=${encodeURIComponent(date)}` : ""}`),
};
export const guidesApi = resource<Guide, number>("/tour-guides");
export const accommodationsApi = resource<Accommodation, number>("/accommodations");
export const accommodationSearchApi = {
  list: (params: { destinationId?: number; destination?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.destinationId) query.set("destinationId", String(params.destinationId));
    if (params.destination) query.set("destination", params.destination);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<Accommodation[]>(`/accommodations${suffix}`);
  },
};
export const vehiclesApi = resource<Vehicle, number>("/vehicles");

export const aiChatApi = {
  welcome: () => request<{ reply: string }>("/ai-chat/welcome"),
  suggestions: () => request<string[]>("/ai-chat/suggestions"),
  chat: (message: string) => request<{ reply: string }>("/ai-chat", { method: "POST", body: JSON.stringify({ message }) }),
};
