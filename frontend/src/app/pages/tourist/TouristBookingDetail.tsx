import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, CalendarDays, Car, CreditCard, Hotel, MapPin, Package, Users, UserRoundCheck, XCircle, CheckCircle } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { touristBookingsApi, type Booking, type Payment } from "../../lib/api";

const timeline = ["Pending", "Confirmed", "Completed"];

const statusStyle: Record<string, { bg: string; color: string }> = {
  Confirmed: { bg: "#f0fdf4", color: "#16a34a" },
  Pending: { bg: "#fffbeb", color: "#d97706" },
  Completed: { bg: "#f0f9ff", color: "#0284c7" },
  Cancelled: { bg: "#fef2f2", color: "#dc2626" },
};

function formatDate(value?: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function canCancel(booking: Booking) {
  return (booking.status === "Pending" || booking.status === "Confirmed") && booking.payment !== "Paid";
}

function bookingType(booking: Booking) {
  return booking.bookingType || "PACKAGE";
}

function bookingTypeLabel(booking: Booking) {
  const type = bookingType(booking);
  if (type === "ACCOMMODATION") return "Accommodation";
  if (type === "VEHICLE") return "Vehicle";
  if (type === "CUSTOM") return "Custom";
  return "Package";
}

function bookingTitle(booking: Booking) {
  if (bookingType(booking) === "ACCOMMODATION") return booking.accommodation || booking.pkg || "Accommodation booking";
  if (bookingType(booking) === "VEHICLE") return booking.vehicle || booking.pkg || "Vehicle booking";
  return booking.pkg || "Voyara Tour";
}

function bookingLocationLabel(booking: Booking) {
  if (bookingType(booking) === "VEHICLE") return booking.destination || "Pickup location pending";
  return booking.destination || "Destination not assigned";
}

export default function TouristBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("Card (demo)");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("Booking id is missing.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    touristBookingsApi
      .detail(id)
      .then((item) => {
        if (!cancelled) {
          setBooking(item);
          setError("");
          touristBookingsApi.payment(item.id).then(setPayment).catch(() => setPayment(null));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load booking");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const timelineIndex = useMemo(() => {
    if (!booking || booking.status === "Cancelled") return -1;
    return timeline.indexOf(booking.status);
  }, [booking]);

  const handleCancel = async () => {
    if (!booking) return;
    setCancelling(true);
    setError("");
    try {
      const updated = await touristBookingsApi.cancel(booking.id);
      setBooking(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  const handlePayment = async () => {
    if (!booking) return;
    setPaying(true);
    setError("");
    try {
      const savedPayment = await touristBookingsApi.pay(booking.id, paymentMethod);
      setPayment(savedPayment);
      const refreshedBooking = await touristBookingsApi.detail(booking.id);
      setBooking(refreshedBooking);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete payment");
    } finally {
      setPaying(false);
    }
  };

  const style = booking ? statusStyle[booking.status] || { bg: "#f3f4f6", color: "#6b7280" } : statusStyle.Pending;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 mb-5">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {loading && <div className="bg-white rounded-3xl border border-gray-200 p-8 text-sm text-gray-400">Loading booking...</div>}

        {!loading && error && (
          <div className="bg-white rounded-3xl border border-red-100 p-8">
            <p className="font-semibold text-red-600">{error}</p>
            <Link to="/tourist/dashboard" className="inline-flex mt-4 text-sm font-semibold" style={{ color: "#FF385C" }}>
              Return to dashboard
            </Link>
          </div>
        )}

        {!loading && !error && booking && (
          <>
            <section className="rounded-3xl overflow-hidden mb-6" style={{ background: "linear-gradient(135deg, #003580, #0057B8)" }}>
              <div className="p-6 md:p-8 text-white">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-white/70">{booking.id}</span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: style.bg, color: style.color }}>{booking.status}</span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-white">{booking.payment}</span>
                </div>
                <span className="mb-3 inline-flex rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">{bookingTypeLabel(booking)}</span>
                <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{bookingTitle(booking)}</h1>
                <p className="text-white/75 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {bookingLocationLabel(booking)}
                </p>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 p-6">
                <h2 className="font-bold text-gray-900 mb-5">{bookingTypeLabel(booking)} details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Info icon={CalendarDays} label={bookingType(booking) === "VEHICLE" ? "Rental dates" : "Travel dates"} value={`${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}`} />
                  <Info icon={Users} label={bookingType(booking) === "VEHICLE" ? "Passengers" : "Travelers"} value={`${booking.guests || 1} guest${booking.guests === 1 ? "" : "s"}`} />
                  {(bookingType(booking) === "PACKAGE" || bookingType(booking) === "CUSTOM") && <Info icon={UserRoundCheck} label="Assigned guide" value={booking.guide || "Pending assignment"} />}
                  {bookingType(booking) !== "VEHICLE" && <Info icon={Hotel} label="Accommodation" value={booking.accommodation || "Pending assignment"} />}
                  {bookingType(booking) !== "ACCOMMODATION" && <Info icon={Car} label="Vehicle" value={booking.vehicle || "Pending assignment"} />}
                  <Info icon={CreditCard} label="Payment" value={`${booking.payment} · LKR ${Number(booking.total || 0).toLocaleString()}`} />
                  <Info icon={Package} label="Created" value={formatDate(booking.createdAt)} />
                </div>
                {booking.notes && (
                  <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Notes</p>
                    <p className="text-sm text-gray-600">{booking.notes}</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl border border-gray-200 p-6">
                <h2 className="font-bold text-gray-900 mb-5">Booking actions</h2>
                <p className="text-sm text-gray-500 mb-4">
                  You can cancel pending or confirmed bookings from your account. Completed or already cancelled trips stay locked.
                </p>
                {canCancel(booking) ? (
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: "#dc2626" }}
                  >
                    <XCircle className="w-4 h-4" />
                    {cancelling ? "Cancelling..." : "Cancel booking"}
                  </button>
                ) : (
                  <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">No actions are available for this booking status.</div>
                )}
              </div>
            </section>

            {booking.status === "Confirmed" && booking.payment !== "Paid" && !payment && (
              <section className="bg-white rounded-3xl border border-amber-200 p-6 mb-6">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <h2 className="font-bold text-gray-900">Complete your payment</h2>
                    <p className="text-sm text-gray-500 mt-1">Your booking is confirmed. Pay LKR {Number(booking.total || 0).toLocaleString()} to complete the reservation.</p>
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                      <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white">
                        <option>Card (demo)</option>
                        <option>Bank transfer</option>
                        <option>Pay at Voyara office</option>
                      </select>
                      <button onClick={handlePayment} disabled={paying} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ background: "#16a34a" }}>
                        <CheckCircle className="w-4 h-4" /> {paying ? "Processing..." : "Pay now"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {payment && (
              <section className="bg-green-50 rounded-3xl border border-green-200 p-6 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h2 className="font-bold text-green-900">Payment completed</h2>
                    <p className="text-sm text-green-700 mt-1">Reference: {payment.transactionReference} · LKR {Number(payment.amount || 0).toLocaleString()}</p>
                  </div>
                </div>
              </section>
            )}

            <section className="bg-white rounded-3xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-5">Status timeline</h2>
              {booking.status === "Cancelled" ? (
                <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600">This booking has been cancelled.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {timeline.map((step, index) => {
                    const active = index <= timelineIndex;
                    return (
                      <div key={step} className="rounded-2xl border p-4" style={{ borderColor: active ? "#FF385C" : "#e5e7eb", background: active ? "#fff5f7" : "white" }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-3" style={{ background: active ? "#FF385C" : "#f3f4f6", color: active ? "white" : "#9ca3af" }}>
                          {index + 1}
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{step}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
        <Icon className="w-4 h-4" /> {label}
      </div>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}
