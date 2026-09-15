import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, CalendarDays, CheckCircle, CreditCard, Fuel, Languages, MapPin, Package, Star, Users } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import { accommodationSearchApi, guidesApi, packagesApi, touristBookingsApi, vehiclesApi, type Accommodation, type Guide, type TourPackage, type Vehicle } from "../../lib/api";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function tripDays(start: string, end: string) {
  const from = new Date(start);
  const to = new Date(end);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 1;
  return Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000));
}

export default function TouristBookingCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get("packageId");
  const destinationIdParam = searchParams.get("destinationId");
  const destinationParam = searchParams.get("destination") || "";
  const bookingType = packageId ? "PACKAGE" : "CUSTOM";

  const [tourPackage, setTourPackage] = useState<TourPackage | null>(null);
  const [primaryDestinationId, setPrimaryDestinationId] = useState<number | null>(destinationIdParam ? Number(destinationIdParam) : null);
  const [destination, setDestination] = useState(destinationParam);
  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState(addDays(today(), 1));
  const [guests, setGuests] = useState(1);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<number | null>(null);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [selectedAccommodationId, setSelectedAccommodationId] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(!!packageId);
  const [guidesLoading, setGuidesLoading] = useState(true);
  const [accommodationsLoading, setAccommodationsLoading] = useState(true);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!packageId) return;

    let cancelled = false;
    setLoading(true);
    packagesApi
      .get(Number(packageId))
      .then((item) => {
        if (cancelled) return;
        setTourPackage(item);
        setDestination(item.destinations?.[0] || item.destinations?.join(", ") || "");
        setPrimaryDestinationId(null);
        setCheckOut(addDays(today(), Math.max(1, Number(item.duration || 1))));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load package details");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [packageId]);

  useEffect(() => {
    let cancelled = false;
    setGuidesLoading(true);
    guidesApi
      .list()
      .then((items) => {
        if (!cancelled) setGuides(items.filter((guide) => guide.status === "Available"));
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to load guides", err);
      })
      .finally(() => {
        if (!cancelled) setGuidesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setAccommodationsLoading(true);
    accommodationSearchApi
      .list({ destinationId: primaryDestinationId || undefined, destination: primaryDestinationId ? undefined : primaryDestinationName(destination) })
      .then((items) => {
        if (!cancelled) setAccommodations(items.filter((accommodation) => accommodation.status === "Active"));
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to load accommodations", err);
      })
      .finally(() => {
        if (!cancelled) setAccommodationsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [destination, primaryDestinationId]);

  useEffect(() => {
    let cancelled = false;
    setVehiclesLoading(true);
    vehiclesApi
      .list()
      .then((items) => {
        if (cancelled) return;
        const available = items.filter((vehicle) => vehicle.status === "Available");
        setVehicles(available);
        setSelectedVehicleId((current) => current && available.some((vehicle) => vehicle.id === current) ? current : null);
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to load vehicles", err);
      })
      .finally(() => {
        if (!cancelled) {
          setVehiclesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const nearbyGuides = useMemo(() => {
    const nearby = guides.filter((guide) => isNearDestination(destination, guide.location, guide.country));
    return nearby.length ? nearby : guides;
  }, [destination, guides]);

  const nearbyAccommodations = useMemo(() => {
    return accommodations;
  }, [accommodations, destination]);

  useEffect(() => {
    if (!nearbyGuides.length) {
      setSelectedGuideId(null);
      return;
    }
    setSelectedGuideId((current) => current && nearbyGuides.some((guide) => guide.id === current) ? current : nearbyGuides[0].id);
  }, [nearbyGuides]);

  useEffect(() => {
    if (!nearbyAccommodations.length) {
      setSelectedAccommodationId(null);
      return;
    }
    setSelectedAccommodationId((current) => current && nearbyAccommodations.some((accommodation) => accommodation.id === current) ? current : nearbyAccommodations[0].id);
  }, [nearbyAccommodations]);

  const total = useMemo(() => {
    const base = Number(tourPackage?.price || 0);
    const days = tripDays(checkIn, checkOut);
    const selectedGuide = guides.find((guide) => guide.id === selectedGuideId);
    const selectedAccommodation = accommodations.find((accommodation) => accommodation.id === selectedAccommodationId);
    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);
    const guideTotal = selectedGuide ? Number(selectedGuide.pricePerDay || 0) * days : 0;
    const stayTotal = selectedAccommodation ? Number(selectedAccommodation.price || 0) * days : 0;
    const vehicleTotal = selectedVehicle ? Number(selectedVehicle.pricePerDay || 0) * days : 0;
    if (!base && !guideTotal && !stayTotal && !vehicleTotal) return 0;
    return (base * Math.max(1, guests)) + guideTotal + stayTotal + vehicleTotal;
  }, [accommodations, checkIn, checkOut, guests, guides, selectedAccommodationId, selectedGuideId, selectedVehicleId, tourPackage?.price, vehicles]);

  const selectedGuide = useMemo(
    () => guides.find((guide) => guide.id === selectedGuideId) || null,
    [guides, selectedGuideId]
  );

  const selectedAccommodation = useMemo(
    () => accommodations.find((accommodation) => accommodation.id === selectedAccommodationId) || null,
    [accommodations, selectedAccommodationId]
  );

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) || null,
    [selectedVehicleId, vehicles]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!destination.trim()) {
      setError("Please select or enter a destination.");
      return;
    }
    if (!checkIn || !checkOut || new Date(checkOut) <= new Date(checkIn)) {
      setError("Please choose a valid start and end date.");
      return;
    }
    if (guests < 1) {
      setError("Guest count must be at least 1.");
      return;
    }
    setSubmitting(true);
    try {
      const booking = await touristBookingsApi.create({
        bookingType,
        guest: user?.fullName || "Voyara Tourist",
        email: user?.email || "",
        destination: destination.trim(),
        pkg: bookingTitle(bookingType, destination.trim(), tourPackage, selectedAccommodation, selectedVehicle),
        guide: selectedGuide ? guideLabel(selectedGuide) : "",
        guideSelectionType: "VOYARA",
        guideResourceId: selectedGuide?.id ?? null,
        accommodation: selectedAccommodation ? accommodationLabel(selectedAccommodation) : "",
        accommodationSelectionType: "VOYARA",
        accommodationResourceId: selectedAccommodation?.id ?? null,
        vehicle: selectedVehicle ? vehicleLabel(selectedVehicle) : OWN_VEHICLE_LABEL,
        vehicleSelectionType: selectedVehicle ? "VOYARA" : "OWN",
        vehicleResourceId: selectedVehicle?.id ?? null,
        checkIn,
        checkOut,
        guests,
        total,
        status: "Pending",
        payment: "Pending",
        notes: notes.trim() || selectedResourceNote(bookingType, selectedGuide, selectedAccommodation, selectedVehicle),
      });
      navigate(`/tourist/bookings/${booking.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to explore
        </Link>

        <section className="rounded-3xl overflow-hidden mb-6" style={{ background: "linear-gradient(135deg, #003580, #0057B8)" }}>
          <div className="p-6 md:p-8 text-white">
              <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mb-2">Create {bookingTypeLabel(bookingType)} Booking</p>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
              {bookingTitle(bookingType, destination, tourPackage, selectedAccommodation, selectedVehicle)}
            </h1>
            <p className="text-white/75 max-w-2xl">
              Submit your preferred dates. Voyara staff will review availability and confirm the details.
            </p>
          </div>
        </section>

        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-8 text-sm text-gray-400">Loading booking details...</div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <section className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-5">Travel details</h2>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field icon={MapPin} label="Destination">
                  <input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none"
                    placeholder="Ella, Sigiriya, Kandy..."
                  />
                </Field>

                <Field icon={Package} label="Booking type">
                  <input
                    value={bookingTypeLabel(bookingType)}
                    readOnly
                    className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none"
                  />
                </Field>

                <Field icon={CalendarDays} label="Start date">
                  <input
                    type="date"
                    min={today()}
                    value={checkIn}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      if (new Date(checkOut) <= new Date(e.target.value)) setCheckOut(addDays(e.target.value, 1));
                    }}
                    className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none"
                  />
                </Field>

                <Field icon={CalendarDays} label="End date">
                  <input
                    type="date"
                    min={addDays(checkIn, 1)}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none"
                  />
                </Field>

                <Field icon={Users} label="Travelers">
                  <input
                    type="number"
                    min={1}
                    max={tourPackage?.maxGroup || 50}
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none"
                  />
                </Field>

                <Field icon={CreditCard} label="Estimated total">
                  <p className="text-sm font-semibold text-gray-800">{total ? `LKR ${total.toLocaleString()}` : "Pending quote"}</p>
                </Field>
              </div>

              <OptionSection
                title="Guide options"
                description={`Available guides ${nearbyGuides.length ? "near this destination" : "for your trip request"}`}
                loading={guidesLoading}
                loadingText="Loading guides..."
                emptyText="No available guides are listed right now. Staff can assign a guide after reviewing your booking."
              >
                {nearbyGuides.map((guide) => {
                  const selected = guide.id === selectedGuideId;
                  return (
                    <button
                      type="button"
                      key={guide.id}
                      onClick={() => setSelectedGuideId(guide.id)}
                      className="text-left rounded-2xl border p-4 transition-colors"
                      style={{
                        borderColor: selected ? "#FF385C" : "#e5e7eb",
                        background: selected ? "#fff5f7" : "#fff",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-gray-900">{guide.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{guide.location || "Sri Lanka"} · {guide.experience} years experience</p>
                        </div>
                        <ChoiceBadge selected={selected} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> {Number(guide.rating || 0).toFixed(1)} ({guide.reviews})</span>
                        <span className="font-semibold text-gray-800">LKR {Number(guide.pricePerDay || 0).toLocaleString()} / day</span>
                        <span className="inline-flex items-center gap-1.5"><Languages className="w-3.5 h-3.5" /> {guide.languages?.slice(0, 2).join(", ") || "Languages pending"}</span>
                        <span>{guide.specialties?.slice(0, 2).join(", ") || "General tours"}</span>
                      </div>
                      {guide.bio && <p className="mt-2 line-clamp-2 text-xs text-gray-400">{guide.bio}</p>}
                    </button>
                  );
                })}
              </OptionSection>

              <OptionSection
                title="Accommodation options"
                description={`Active stays near ${primaryDestinationName(destination) || "this destination"}`}
                loading={accommodationsLoading}
                loadingText="Loading stays..."
                emptyText={`No active accommodations are linked near ${primaryDestinationName(destination) || "this destination"}. Staff can assign a suitable stay after reviewing your booking.`}
              >
                {nearbyAccommodations.map((accommodation) => {
                  const selected = accommodation.id === selectedAccommodationId;
                  return (
                    <button
                      type="button"
                      key={accommodation.id}
                      onClick={() => setSelectedAccommodationId(accommodation.id)}
                      className="text-left rounded-2xl border p-4 transition-colors"
                      style={{
                        borderColor: selected ? "#FF385C" : "#e5e7eb",
                        background: selected ? "#fff5f7" : "#fff",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-gray-900">{accommodation.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{accommodation.type} · {accommodation.location || "Sri Lanka"}</p>
                        </div>
                        <ChoiceBadge selected={selected} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> {Number(accommodation.rating || 0).toFixed(1)} ({accommodation.reviews})</span>
                        <span className="font-semibold text-gray-800">LKR {Number(accommodation.price || 0).toLocaleString()} / night</span>
                        <span>{accommodation.rooms} rooms</span>
                        <span>{accommodation.status}</span>
                      </div>
                      {accommodation.amenities?.length > 0 && (
                        <p className="mt-2 text-xs text-gray-400">{accommodation.amenities.slice(0, 4).join(" · ")}</p>
                      )}
                    </button>
                  );
                })}
              </OptionSection>

              <div className="mt-5">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">Vehicle options</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Choose the transport option for this package request</p>
                  </div>
                  {vehiclesLoading && <span className="text-xs text-gray-400">Loading vehicles...</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <OwnOptionCard
                    selected={selectedVehicleId === null}
                    title={OWN_VEHICLE_LABEL}
                    description="You will use your own transport for this trip."
                    detail="No vehicle charge"
                    icon={Fuel}
                    onClick={() => setSelectedVehicleId(null)}
                  />
                  {!vehiclesLoading && vehicles.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-400">
                      No available Voyara vehicles are listed right now.
                    </div>
                  ) : (
                    vehicles.map((vehicle) => {
                      const selected = vehicle.id === selectedVehicleId;
                      return (
                        <button
                          type="button"
                          key={vehicle.id}
                          onClick={() => setSelectedVehicleId(vehicle.id)}
                          className="text-left rounded-2xl border p-4 transition-colors"
                          style={{
                            borderColor: selected ? "#FF385C" : "#e5e7eb",
                            background: selected ? "#fff5f7" : "#fff",
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold text-gray-900">{vehicle.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{vehicle.brand} {vehicle.model} · {vehicle.type}</p>
                            </div>
                            <ChoiceBadge selected={selected} />
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {vehicle.capacity} seats</span>
                            <span className="inline-flex items-center gap-1.5"><Fuel className="w-3.5 h-3.5" /> {vehicle.fuel}</span>
                            <span>{vehicle.transmission}</span>
                            <span className="font-semibold text-gray-800">LKR {Number(vehicle.pricePerDay || 0).toLocaleString()} / day</span>
                          </div>
                          {vehicle.location && <p className="mt-2 text-xs text-gray-400">{vehicle.location}</p>}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Special requests</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-transparent text-sm text-gray-700 outline-none resize-none"
                  placeholder="Pickup location, dietary needs, preferred guide language, or anything staff should know..."
                />
              </div>
            </section>

            <aside className="bg-white rounded-3xl border border-gray-200 p-6 h-fit">
              <h2 className="font-bold text-gray-900 mb-5">Booking summary</h2>
              <div className="space-y-3 text-sm">
                <SummaryRow label="Tourist" value={user?.fullName || "Current user"} />
                <SummaryRow label="Email" value={user?.email || "Signed-in account"} />
                <SummaryRow label="Type" value={bookingTypeLabel(bookingType)} />
                <SummaryRow label="Duration" value={`${tripDays(checkIn, checkOut)} day${tripDays(checkIn, checkOut) === 1 ? "" : "s"}`} />
                <SummaryRow label="Guide" value={selectedGuide ? guideLabel(selectedGuide) : "Staff assignment"} />
                <SummaryRow label="Stay" value={selectedAccommodation ? accommodationLabel(selectedAccommodation) : "Staff assignment"} />
                <SummaryRow label="Vehicle" value={selectedVehicle ? vehicleLabel(selectedVehicle) : OWN_VEHICLE_LABEL} />
                <SummaryRow label="Estimated total" value={total ? `LKR ${total.toLocaleString()}` : "Pending quote"} />
                <SummaryRow label="Status" value="Pending" />
                <SummaryRow label="Payment" value="Pending" />
              </div>

              <div className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>Your booking will be saved in the database and visible in My Bookings immediately.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #FF385C, #E31C5F)" }}
              >
                {submitting ? "Creating booking..." : "Confirm Booking Request"}
              </button>
            </aside>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}

function vehicleLabel(vehicle: Vehicle) {
  return [vehicle.name, vehicle.brand, vehicle.model].filter(Boolean).join(" · ");
}

const OWN_VEHICLE_LABEL = "Own vehicle";

function guideLabel(guide: Guide) {
  return [guide.name, guide.location].filter(Boolean).join(" · ");
}

function accommodationLabel(accommodation: Accommodation) {
  return [accommodation.name, accommodation.type, accommodation.location].filter(Boolean).join(" · ");
}

function bookingTypeLabel(type: string) {
  if (type === "ACCOMMODATION") return "Accommodation";
  if (type === "VEHICLE") return "Vehicle";
  if (type === "CUSTOM") return "Custom trip";
  return "Tour package";
}

function bookingTitle(type: string, destination: string, tourPackage: TourPackage | null, accommodation: Accommodation | null, vehicle: Vehicle | null) {
  if (type === "ACCOMMODATION") return accommodation ? `${accommodation.name} stay` : "Accommodation booking";
  if (type === "VEHICLE") return vehicle ? `${vehicle.name} rental` : "Vehicle booking";
  return tourPackage?.name || `${destination || "Sri Lanka"} Custom Trip`;
}

function selectedResourceNote(type: string, guide: Guide | null, accommodation: Accommodation | null, vehicle: Vehicle | null) {
  const selections = [
    type !== "VEHICLE" && (accommodation ? `Accommodation: ${accommodationLabel(accommodation)}` : "Accommodation: staff assignment"),
    (type === "PACKAGE" || type === "CUSTOM") && (guide ? `Guide preference: ${guideLabel(guide)}` : "Guide preference: staff assignment"),
    type !== "ACCOMMODATION" && (vehicle ? `Vehicle: ${vehicleLabel(vehicle)}` : `Vehicle: ${OWN_VEHICLE_LABEL}`),
  ].filter(Boolean);
  return `Tourist requested a ${bookingTypeLabel(type).toLowerCase()} booking from the Voyara website. ${selections.join("; ")}.`;
}

function isNearDestination(destination: string, location?: string, country?: string) {
  const haystack = [location, country].filter(Boolean).join(" ").toLowerCase();
  const terms = destination.toLowerCase().split(/[,/|-]/).map((item) => item.trim()).filter((item) => item.length > 2);
  if (!terms.length || !haystack) return false;
  return terms.some((term) => haystack.includes(term) || term.includes(haystack));
}

function primaryDestinationName(destination: string) {
  return destination.split(",")[0]?.trim() || destination.trim();
}

function ChoiceBadge({ selected }: { selected: boolean }) {
  return (
    <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: selected ? "#FF385C" : "#f3f4f6", color: selected ? "white" : "#6b7280" }}>
      {selected ? "Selected" : "Choose"}
    </span>
  );
}

function OwnOptionCard({
  selected,
  title,
  description,
  detail,
  icon: Icon,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-2xl border p-4 transition-colors"
      style={{
        borderColor: selected ? "#FF385C" : "#e5e7eb",
        background: selected ? "#fff5f7" : "#fff",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-gray-400" />
            <p className="font-bold text-gray-900">{title}</p>
          </div>
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        </div>
        <ChoiceBadge selected={selected} />
      </div>
      <p className="mt-3 text-xs font-semibold text-gray-800">{detail}</p>
    </button>
  );
}

function OptionSection({
  title,
  description,
  loading,
  loadingText,
  emptyText,
  children,
}: {
  title: string;
  description: string;
  loading: boolean;
  loadingText: string;
  emptyText: string;
  children: ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <h3 className="font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
        {loading && <span className="text-xs text-gray-400">{loadingText}</span>}
      </div>

      {!loading && !hasChildren ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-400">
          {emptyText}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
      )}
    </div>
  );
}

function Field({ icon: Icon, label, children }: { icon: ComponentType<{ className?: string }>; label: string; children: ReactNode }) {
  return (
    <label className="block rounded-2xl bg-gray-50 p-4">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
        <Icon className="w-4 h-4" /> {label}
      </span>
      {children}
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-gray-800 text-right">{value}</span>
    </div>
  );
}
