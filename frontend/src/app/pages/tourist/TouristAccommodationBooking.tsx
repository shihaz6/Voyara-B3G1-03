import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, BedDouble, CalendarDays, CheckCircle, CreditCard, MapPin, Star, Users } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import { accommodationsApi, touristBookingsApi, type Accommodation } from "../../lib/api";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string) {
  const from = new Date(start);
  const to = new Date(end);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 1;
  return Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000));
}

export default function TouristAccommodationBooking() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null);
  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState(addDays(today(), 1));
  const [guests, setGuests] = useState(1);
  const [rooms, setRooms] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    accommodationsApi
      .get(Number(id))
      .then((item) => {
        if (!cancelled) setAccommodation(item);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load accommodation");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const nights = daysBetween(checkIn, checkOut);
  const total = useMemo(() => Number(accommodation?.price || 0) * nights * Math.max(1, rooms), [accommodation?.price, nights, rooms]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accommodation) return;
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError("Please choose a valid check-in and check-out date.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const booking = await touristBookingsApi.create({
        bookingType: "ACCOMMODATION",
        guest: user?.fullName || "Voyara Tourist",
        email: user?.email || "",
        destination: [accommodation.location, accommodation.country].filter(Boolean).join(", "),
        pkg: `${accommodation.name} stay`,
        guide: "",
        guideSelectionType: "OWN",
        guideResourceId: null,
        accommodation: [accommodation.name, accommodation.type, accommodation.location].filter(Boolean).join(" · "),
        accommodationSelectionType: "VOYARA",
        accommodationResourceId: accommodation.id,
        vehicle: "",
        vehicleSelectionType: "OWN",
        vehicleResourceId: null,
        checkIn,
        checkOut,
        guests,
        total,
        status: "Pending",
        payment: "Pending",
        notes: notes.trim() || `Accommodation booking. Rooms: ${rooms}. Guests: ${guests}.`,
      });
      navigate(`/tourist/bookings/${booking.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create accommodation booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to explore
        </Link>

        {loading ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-8 text-sm text-gray-400">Loading accommodation...</div>
        ) : !accommodation ? (
          <div className="rounded-3xl border border-red-100 bg-white p-8 text-sm font-semibold text-red-600">{error || "Accommodation not found"}</div>
        ) : (
          <form onSubmit={submit} className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <section className="lg:col-span-2 overflow-hidden rounded-3xl border border-gray-200 bg-white">
              <div className="relative h-72">
                <img src={accommodation.image} alt={accommodation.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                <div className="absolute bottom-0 p-6 text-white">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/70">Accommodation booking</p>
                  <h1 className="text-3xl font-extrabold">{accommodation.name}</h1>
                  <p className="mt-2 flex items-center gap-2 text-sm text-white/80"><MapPin className="h-4 w-4" /> {[accommodation.location, accommodation.country].filter(Boolean).join(", ")}</p>
                </div>
              </div>

              <div className="p-6">
                {error && <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}
                <div className="mb-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                  <Info icon={BedDouble} label="Type" value={accommodation.type} />
                  <Info icon={Star} label="Rating" value={`${Number(accommodation.rating || 0).toFixed(1)} (${accommodation.reviews})`} />
                  <Info icon={BedDouble} label="Rooms" value={`${accommodation.rooms}`} />
                  <Info icon={CreditCard} label="Per night" value={`LKR ${Number(accommodation.price || 0).toLocaleString()}`} />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field icon={CalendarDays} label="Check-in">
                    <input type="date" min={today()} value={checkIn} onChange={(event) => {
                      setCheckIn(event.target.value);
                      if (new Date(checkOut) <= new Date(event.target.value)) setCheckOut(addDays(event.target.value, 1));
                    }} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                  </Field>
                  <Field icon={CalendarDays} label="Check-out">
                    <input type="date" min={addDays(checkIn, 1)} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                  </Field>
                  <Field icon={Users} label="Guests">
                    <input type="number" min={1} value={guests} onChange={(event) => setGuests(Number(event.target.value))} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                  </Field>
                  <Field icon={BedDouble} label="Rooms">
                    <input type="number" min={1} max={Math.max(1, accommodation.rooms || 1)} value={rooms} onChange={(event) => setRooms(Number(event.target.value))} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                  </Field>
                </div>

                <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">Special requests</label>
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="w-full resize-none bg-transparent text-sm text-gray-700 outline-none" placeholder="Room preference, arrival time, accessibility needs..." />
                </div>
              </div>
            </section>

            <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-6">
              <h2 className="mb-5 font-bold text-gray-900">Stay summary</h2>
              <div className="space-y-3 text-sm">
                <SummaryRow label="Nights" value={`${nights}`} />
                <SummaryRow label="Rooms" value={`${rooms}`} />
                <SummaryRow label="Guests" value={`${guests}`} />
                <SummaryRow label="Total" value={`LKR ${total.toLocaleString()}`} />
              </div>
              <div className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
                <CheckCircle className="mb-2 h-4 w-4" />
                This accommodation request will appear under My Bookings.
              </div>
              <button disabled={submitting} className="mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" style={{ background: "#FF385C" }}>
                {submitting ? "Creating booking..." : "Confirm stay booking"}
              </button>
            </aside>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  );
}

function Field({ icon: Icon, label, children }: { icon: ComponentType<{ className?: string }>; label: string; children: ReactNode }) {
  return (
    <label className="block rounded-2xl bg-gray-50 p-4">
      <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400"><Icon className="h-4 w-4" /> {label}</span>
      {children}
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}
