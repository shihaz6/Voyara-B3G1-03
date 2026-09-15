import { Star, MapPin } from "lucide-react";

const reviews = [
  {
    id: 1,
    name: "Sarah M.",
    avatar: "SM",
    avatarBg: "#FF385C",
    location: "United Kingdom",
    date: "June 2026",
    rating: 5,
    tour: "Sigiriya Sunrise Tour",
    text: "Absolutely magical experience! Our guide knew every story behind the ancient rock fortress. Watching the sunrise over Sigiriya was unforgettable.",
  },
  {
    id: 2,
    name: "James K.",
    avatar: "JK",
    avatarBg: "#003580",
    location: "Australia",
    date: "May 2026",
    rating: 5,
    tour: "Kandy Cultural Tour",
    text: "Our guide was warm, knowledgeable, and passionate about Sri Lankan culture. The temple visit, local food, and hill country views made the itinerary feel complete.",
  },
  {
    id: 3,
    name: "Yuki T.",
    avatar: "YT",
    avatarBg: "#00AA6C",
    location: "Germany",
    date: "July 2026",
    rating: 5,
    tour: "Galle Fort Food Walk",
    text: "Best food tour I've ever done! We tried local dishes around the fort and learned the history behind each stop. The guide made everything easy and personal.",
  },
];

export function ReviewSection() {
  return (
    <section className="py-16 px-4 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest mb-1" style={{ color: "#FF385C" }}>Traveler Stories</p>
          <h2 className="text-gray-900" style={{ fontWeight: 800, fontSize: "1.75rem" }}>What our guests say</h2>
        </div>
        <button className="hidden md:block text-sm font-semibold underline text-gray-700 hover:text-gray-900">
          Read all reviews
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow"
            style={{ border: "1px solid #e5e7eb" }}
          >
            {/* Stars */}
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: r.rating }).map((_, i) => (
                <Star key={i} className="w-4 h-4" style={{ fill: "#00AA6C", color: "#00AA6C" }} />
              ))}
            </div>

            {/* Text */}
            <p className="text-gray-700 text-sm leading-relaxed mb-4">"{r.text}"</p>

            {/* Tour */}
            <div className="flex items-center gap-1 mb-4">
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "#FF385C" }} />
              <p className="text-xs font-semibold" style={{ color: "#FF385C" }}>{r.tour}</p>
            </div>

            {/* Reviewer */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ background: r.avatarBg }}
              >
                {r.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                <p className="text-xs text-gray-400">{r.location} · {r.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
