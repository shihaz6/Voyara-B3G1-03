import { useState } from "react";
import { Search, MapPin, Calendar, Users, Waves, Landmark, Mountain, UtensilsCrossed, Trees } from "lucide-react";
import heroImage from "../../imports/image-4.png";

interface HeroProps {
  onSearch?: (query: string) => void;
  onCategoryChange?: (category: string) => void;
}

export function Hero({ onSearch, onCategoryChange }: HeroProps) {
  const [destination, setDestination] = useState("");
  const [dates, setDates] = useState("");
  const [guests, setGuests] = useState("");
  const [activeTab, setActiveTab] = useState("Tours");

  const tabs = ["Tours", "Hotels", "Activities", "Car Rental"];

  const handleSearch = () => {
    if (onSearch) onSearch(destination.trim());
    const section = document.getElementById("listings-section");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative h-[560px] md:h-[620px] overflow-hidden">
      <img
        src={heroImage}
        alt="Sri Lanka travel landscape"
        className="w-full h-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 100%)" }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        <p className="text-white/80 text-sm mb-2 tracking-widest uppercase font-medium">Discover Sri Lanka</p>
        <h1 className="text-white text-center mb-2" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.15 }}>
          Find Your Next Adventure
        </h1>
        <p className="text-white/75 text-center text-base mb-8 max-w-md">
          Explore expert-guided tours, top-rated attractions & the best travel deals in Sri Lanka
        </p>

        {/* Search card */}
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex" style={{ borderBottom: "1px solid #f0f0f0" }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-3 text-sm font-semibold transition-colors relative"
                style={{
                  color: activeTab === tab ? "#FF385C" : "#6b7280",
                  borderBottom: activeTab === tab ? "2px solid #FF385C" : "2px solid transparent",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search inputs */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-0">
            {/* Destination */}
            <div className="flex-1 flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer md:border-r border-b md:border-b-0" style={{ borderColor: "#f0f0f0" }}>
              <MapPin className="w-5 h-5 shrink-0" style={{ color: "#FF385C" }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Destination</p>
                <input
                  type="text"
                  placeholder="Where are you going?"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full text-sm text-gray-800 outline-none bg-transparent placeholder-gray-400"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="flex-1 flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer md:border-r border-b md:border-b-0" style={{ borderColor: "#f0f0f0" }}>
              <Calendar className="w-5 h-5 shrink-0 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Dates</p>
                <input
                  type="text"
                  placeholder="Add dates"
                  value={dates}
                  onChange={(e) => setDates(e.target.value)}
                  className="w-full text-sm text-gray-800 outline-none bg-transparent placeholder-gray-400"
                />
              </div>
            </div>

            {/* Guests */}
            <div className="flex-1 flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer" style={{ borderColor: "#f0f0f0" }}>
              <Users className="w-5 h-5 shrink-0 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Guests</p>
                <input
                  type="text"
                  placeholder="Add guests"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full text-sm text-gray-800 outline-none bg-transparent placeholder-gray-400"
                />
              </div>
            </div>

            {/* Search button */}
            <div className="px-4 py-3 flex justify-center md:justify-end">
              <button
                onClick={handleSearch}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #FF385C, #E31C5F)" }}
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Quick tags — map to category filter */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {[
            { icon: Waves, label: "Beaches", cat: "Beaches" },
            { icon: Landmark, label: "Cultural", cat: "Cultural" },
            { icon: Mountain, label: "Adventure", cat: "Hiking" },
            { icon: UtensilsCrossed, label: "Food Tours", cat: "Food & Drink" },
            { icon: Trees, label: "Nature", cat: "Nature" },
          ].map(({ icon: Icon, label, cat }) => (
            <button
              key={label}
              onClick={() => {
                if (onCategoryChange) onCategoryChange(cat);
                const section = document.getElementById("listings-section");
                if (section) section.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium text-white transition-all hover:bg-white/30"
              style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.3)" }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
