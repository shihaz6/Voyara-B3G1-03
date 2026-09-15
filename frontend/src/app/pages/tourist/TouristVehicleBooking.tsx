import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, CalendarDays, Car, CheckCircle, CreditCard, Fuel, MapPin, Settings, Users } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import { touristBookingsApi, vehiclesApi, type Vehicle } from "../../lib/api";

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

export default function TouristVehicleBooking() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [pickupDate, setPickupDate] = useState(today());
  const [returnDate, setReturnDate] = useState(addDays(today(), 1));
  const [pickupLocation, setPickupLocation] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    vehiclesApi
      .get(Number(id))
      .then((item) => {
        if (cancelled) return;
        setVehicle(item);
        setPickupLocation(item.location || "Sri Lanka");
        setPassengers(Math.min(Math.max(1, item.capacity || 1), 2));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load vehicle");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const rentalDays = daysBetween(pickupDate, returnDate);
  const total = useMemo(() => Number(vehicle?.pricePerDay || 0) * rentalDays, [rentalDays, vehicle?.pricePerDay]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!vehicle) return;
    if (!pickupLocation.trim()) {
      setError("Please enter a pickup location.");
      return;
    }
    if (new Date(returnDate) <= new Date(pickupDate)) {
      setError("Please choose a valid pickup and return date.");
      return;
    }
    if (passengers < 1 || passengers > vehicle.capacity) {
      setError(`Passenger count must be between 1 and ${vehicle.capacity}.`);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const booking = await touristBookingsApi.create({
        bookingType: "VEHICLE",
        guest: user?.fullName || "Voyara Tourist",
        email: user?.email || "",
        destination: pickupLocation.trim(),
        pkg: `${vehicle.name} rental`,
        guide: "",
        guideSelectionType: "OWN",
        guideResourceId: null,
        accommodation: "",
        accommodationSelectionType: "OWN",
        accommodationResourceId: null,
        vehicle: [vehicle.name, vehicle.brand, vehicle.model].filter(Boolean).join(" · "),
        vehicleSelectionType: "VOYARA",
        vehicleResourceId: vehicle.id,
        checkIn: pickupDate,
        checkOut: returnDate,
        guests: passengers,
        total,
        status: "Pending",
        payment: "Pending",
        notes: notes.trim() || `Vehicle booking. Pickup location: ${pickupLocation.trim()}. Passengers: ${passengers}.`,
      });
      navigate(`/tourist/bookings/${booking.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create vehicle booking");
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
          <div className="rounded-3xl border border-gray-200 bg-white p-8 text-sm text-gray-400">Loading vehicle...</div>
        ) : !vehicle ? (
          <div className="rounded-3xl border border-red-100 bg-white p-8 text-sm font-semibold text-red-600">{error || "Vehicle not found"}</div>
        ) : (
          <form onSubmit={submit} className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <section className="lg:col-span-2 overflow-hidden rounded-3xl border border-gray-200 bg-white">
              <div className="relative h-72">
                <img src={vehicle.image} alt={vehicle.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                <div className="absolute bottom-0 p-6 text-white">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/70">Vehicle booking</p>
                  <h1 className="text-3xl font-extrabold">{vehicle.name}</h1>
                  <p className="mt-2 flex items-center gap-2 text-sm text-white/80"><MapPin className="h-4 w-4" /> {vehicle.location || "Sri Lanka"}</p>
                </div>
              </div>

              <div className="p-6">
                {error && <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}
                <div className="mb-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                  <Info icon={Car} label="Type" value={vehicle.type} />
                  <Info icon={Users} label="Seats" value={`${vehicle.capacity}`} />
                  <Info icon={Fuel} label="Fuel" value={vehicle.fuel} />
                  <Info icon={CreditCard} label="Per day" value={`LKR ${Number(vehicle.pricePerDay || 0).toLocaleString()}`} />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field icon={CalendarDays} label="Pickup date">
                    <input type="date" min={today()} value={pickupDate} onChange={(event) => {
                      setPickupDate(event.target.value);
                      if (new Date(returnDate) <= new Date(event.target.value)) setReturnDate(addDays(event.target.value, 1));
                    }} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                  </Field>
                  <Field icon={CalendarDays} label="Return date">
                    <input type="date" min={addDays(pickupDate, 1)} value={returnDate} onChange={(event) => setReturnDate(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                  </Field>
                  <Field icon={MapPin} label="Pickup location">
                    <input value={pickupLocation} onChange={(event) => setPickupLocation(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                  </Field>
                  <Field icon={Users} label="Passengers">
                    <input type="number" min={1} max={vehicle.capacity} value={passengers} onChange={(event) => setPassengers(Number(event.target.value))} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                  </Field>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {[vehicle.brand, vehicle.model, vehicle.transmission, vehicle.fuel, ...(vehicle.features || [])].filter(Boolean).map((feature) => (
                    <span key={feature} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{feature}</span>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">Special requests</label>
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="w-full resize-none bg-transparent text-sm text-gray-700 outline-none" placeholder="Pickup time, driver needs, luggage, route notes..." />
                </div>
              </div>
            </section>

            <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-6">
              <h2 className="mb-5 font-bold text-gray-900">Rental summary</h2>
              <div className="space-y-3 text-sm">
                <SummaryRow label="Rental days" value={`${rentalDays}`} />
                <SummaryRow label="Passengers" value={`${passengers}`} />
                <SummaryRow label="Transmission" value={vehicle.transmission} />
                <SummaryRow label="Total" value={`LKR ${total.toLocaleString()}`} />
              </div>
              <div className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
                <CheckCircle className="mb-2 h-4 w-4" />
                This vehicle request will appear under My Bookings.
              </div>
              <button disabled={submitting} className="mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" style={{ background: "#FF385C" }}>
                {submitting ? "Creating booking..." : "Confirm vehicle booking"}
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
