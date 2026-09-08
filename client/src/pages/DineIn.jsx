import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getDineInSettings,
  getDineInAvailability,
  createDineInReservation,
} from "../services/api";
import RetroButton from "../components/RetroButton";
import SectionTitle from "../components/SectionTitle";
import Footer from "../components/Footer";

const DineIn = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Settings & Status
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [dineInEnabled, setDineInEnabled] = useState(true);

  // Booking Flow State
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // Party Size State: "single" (1), "double" (2), "four" (4), "family" (5-10)
  const [partyType, setPartyType] = useState("double");
  const [familyCount, setFamilyCount] = useState(6);

  // Time Slots
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");

  // Customer Contact & Notes
  const [customerName, setCustomerName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [notes, setNotes] = useState("");

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmedReservation, setConfirmedReservation] = useState(null);

  // Calculate actual guest count based on selection
  const guestCount = useMemo(() => {
    if (partyType === "single") return 1;
    if (partyType === "double") return 2;
    if (partyType === "four") return 4;
    if (partyType === "family") return familyCount;
    return 2;
  }, [partyType, familyCount]);

  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  }, []);

  const tomorrowStr = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }, []);

  // Update customer name & phone if user logs in
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name || "");
      if (!phone && user.phone) setPhone(user.phone || "");
    }
  }, [user]);

  // 1. Load Restaurant Dine-In Settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoadingSettings(true);
        const data = await getDineInSettings();
        if (data?.settings) {
          setSettings(data.settings);
          setDineInEnabled(data.settings.enabled);
        }
      } catch (err) {
        console.error("Failed to load dine-in settings:", err);
      } finally {
        setLoadingSettings(false);
      }
    };
    loadSettings();
  }, []);

  // 2. Load Availability whenever selectedDate changes
  useEffect(() => {
    if (!dineInEnabled || !selectedDate) return;

    const loadSlots = async () => {
      try {
        setLoadingSlots(true);
        setError("");
        const data = await getDineInAvailability(selectedDate);
        if (data?.enabled === false) {
          setDineInEnabled(false);
          setSlots([]);
        } else {
          setSlots(data?.slots || []);
        }
      } catch (err) {
        console.error("Error fetching availability:", err);
        setError("Unable to load available time slots for this date.");
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [selectedDate, dineInEnabled]);

  // Handle Booking Submission
  const handleConfirmReservation = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!user) {
      navigate("/login", { state: { from: "/dine-in" } });
      return;
    }

    if (!selectedDate) return setError("Please select a date for your visit.");
    if (!selectedTime) return setError("Please select an available time slot.");
    if (!customerName.trim()) return setError("Please enter your name.");
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return setError("Please provide a valid 10-digit contact number.");
    }

    try {
      setSubmitting(true);
      const payload = {
        date: selectedDate,
        time: selectedTime,
        partyType,
        numberOfPeople: guestCount,
        customerName: customerName.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
      };

      const res = await createDineInReservation(payload);
      if (res?.success) {
        setConfirmedReservation(res.reservation);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      console.error("Reservation creation error:", err);
      setError(err.message || "Failed to confirm reservation. Please try another time slot.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-between">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 w-full">
        
        {/* HERO HEADER */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 border border-rose-200 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-rose-700 mb-4 shadow-sm">
            <span>🍽️</span>
            <span>TastyBites 90 Diner Experience</span>
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-stone-900 leading-tight">
            Reserve Your <span className="text-rose-600">Dine-In Table</span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-stone-600 font-normal">
            Step into our 90s vintage booth. Savor piping hot smash burgers, hand-spun shakes, and retro vibes right off the grill.
          </p>
        </div>

        {/* LOADING SETTINGS */}
        {loadingSettings && (
          <div className="max-w-2xl mx-auto p-12 text-center bg-white rounded-3xl border border-stone-200 shadow-sm animate-pulse">
            <span className="text-5xl block mb-3">🍔</span>
            <p className="font-bold text-stone-600">Preparing dining room availability...</p>
          </div>
        )}

        {/* DINE-IN DISABLED NOTICE */}
        {!loadingSettings && !dineInEnabled && (
          <div className="max-w-xl mx-auto rounded-3xl border-2 border-dashed border-rose-300 bg-rose-50/70 p-10 text-center shadow-sm">
            <span className="text-6xl block mb-4">🚪</span>
            <span className="inline-block px-3.5 py-1 bg-rose-200 text-rose-800 rounded-full text-xs font-black uppercase tracking-wider mb-2">
              Dine-In Currently Paused
            </span>
            <h2 className="text-2xl font-black text-stone-900 mt-1">
              Reservations Not Available
            </h2>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed">
              This restaurant is currently not accepting Dine-In reservations. You can still order your favorites online for express delivery or takeaway!
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link to="/menu">
                <RetroButton variant="primary">Order For Delivery &rarr;</RetroButton>
              </Link>
            </div>
          </div>
        )}

        {/* SUCCESS CONFIRMATION MODAL / CARD */}
        {confirmedReservation && (
          <div className="max-w-2xl mx-auto mb-16 rounded-3xl bg-white border-2 border-emerald-500/80 p-8 sm:p-10 shadow-2xl shadow-emerald-950/10 text-center animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl font-black mb-4">
              ✓
            </div>
            <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black uppercase tracking-widest">
              Booking Confirmed
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight mt-2">
              🎉 TABLE RESERVED!
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              Your Dine-In reservation has been confirmed. We have reserved a booth for you!
            </p>

            {/* Retro Ticket Slip */}
            <div className="mt-8 rounded-2xl bg-stone-50 border border-stone-200 p-6 text-left relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500" />
              <div className="flex justify-between items-center pb-4 border-b border-stone-200">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                    Reservation Pass
                  </span>
                  <span className="text-xl font-mono font-black text-stone-900">
                    {confirmedReservation.reservationCode}
                  </span>
                </div>
                <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-extrabold uppercase">
                  {confirmedReservation.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 text-sm">
                <div>
                  <span className="text-xs text-stone-400 uppercase font-bold block">Date</span>
                  <span className="font-bold text-stone-900">
                    📅 {new Date(confirmedReservation.date + "T00:00:00").toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-stone-400 uppercase font-bold block">Time Slot</span>
                  <span className="font-bold text-rose-600">
                    🕐 {confirmedReservation.displayTime || confirmedReservation.time}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-stone-400 uppercase font-bold block">Party Size</span>
                  <span className="font-bold text-stone-900">
                    👥 {confirmedReservation.numberOfPeople} Guests ({confirmedReservation.partyType})
                  </span>
                </div>
                <div>
                  <span className="text-xs text-stone-400 uppercase font-bold block">Reserved For</span>
                  <span className="font-bold text-stone-900">
                    👤 {confirmedReservation.customerName}
                  </span>
                </div>
              </div>

              {confirmedReservation.notes && (
                <div className="mt-4 pt-3 border-t border-stone-200/80 text-xs text-stone-600">
                  <span className="font-bold text-stone-700">Notes: </span>
                  {confirmedReservation.notes}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/my-reservations" className="w-full sm:w-auto">
                <RetroButton variant="primary" className="w-full sm:w-auto px-7 py-3.5">
                  View My Reservations &rarr;
                </RetroButton>
              </Link>
              <Link to="/" className="w-full sm:w-auto">
                <RetroButton variant="outline" className="w-full sm:w-auto px-7 py-3.5">
                  Back to Home
                </RetroButton>
              </Link>
            </div>
          </div>
        )}

        {/* INTERACTIVE BOOKING FORM */}
        {!loadingSettings && dineInEnabled && !confirmedReservation && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: SELECTION STEPS */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* STEP 1: CHOOSE DATE */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-sm font-black shadow-sm">
                    1
                  </span>
                  <div>
                    <h3 className="text-xl font-black text-stone-900">Choose Reservation Date</h3>
                    <p className="text-xs text-stone-500">Book for today or plan ahead for an upcoming visit</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayStr)}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold border transition ${
                      selectedDate === todayStr
                        ? "bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-200"
                        : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(tomorrowStr)}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold border transition ${
                      selectedDate === tomorrowStr
                        ? "bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-200"
                        : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    Tomorrow
                  </button>

                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      Pick Date:
                    </span>
                    <input
                      type="date"
                      min={todayStr}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-4 py-2 text-sm font-bold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 2: CHOOSE PARTY SIZE */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-sm font-black shadow-sm">
                    2
                  </span>
                  <div>
                    <h3 className="text-xl font-black text-stone-900">Choose Party Size</h3>
                    <p className="text-xs text-stone-500">Select table configuration for your dining party</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  {/* Single (1) */}
                  <button
                    type="button"
                    onClick={() => setPartyType("single")}
                    className={`p-5 rounded-2xl border text-center transition flex flex-col items-center justify-center ${
                      partyType === "single"
                        ? "border-rose-600 bg-rose-50/60 ring-2 ring-rose-500/20 shadow-sm"
                        : "border-stone-200 bg-stone-50/50 hover:bg-stone-100/80"
                    }`}
                  >
                    <span className="text-3xl mb-2">👤</span>
                    <span className="text-sm font-black text-stone-900 block">Single</span>
                    <span className="text-xs text-stone-500 font-semibold mt-0.5">1 Person</span>
                  </button>

                  {/* Double (2) */}
                  <button
                    type="button"
                    onClick={() => setPartyType("double")}
                    className={`p-5 rounded-2xl border text-center transition flex flex-col items-center justify-center ${
                      partyType === "double"
                        ? "border-rose-600 bg-rose-50/60 ring-2 ring-rose-500/20 shadow-sm"
                        : "border-stone-200 bg-stone-50/50 hover:bg-stone-100/80"
                    }`}
                  >
                    <span className="text-3xl mb-2">👥</span>
                    <span className="text-sm font-black text-stone-900 block">Double</span>
                    <span className="text-xs text-stone-500 font-semibold mt-0.5">2 People</span>
                  </button>

                  {/* 4 Person (4) */}
                  <button
                    type="button"
                    onClick={() => setPartyType("four")}
                    className={`p-5 rounded-2xl border text-center transition flex flex-col items-center justify-center ${
                      partyType === "four"
                        ? "border-rose-600 bg-rose-50/60 ring-2 ring-rose-500/20 shadow-sm"
                        : "border-stone-200 bg-stone-50/50 hover:bg-stone-100/80"
                    }`}
                  >
                    <span className="text-3xl mb-2">👨‍👩‍👧‍👦</span>
                    <span className="text-sm font-black text-stone-900 block">4 Person</span>
                    <span className="text-xs text-stone-500 font-semibold mt-0.5">4 People</span>
                  </button>

                  {/* Family (5 - 10) */}
                  <button
                    type="button"
                    onClick={() => setPartyType("family")}
                    className={`p-5 rounded-2xl border text-center transition flex flex-col items-center justify-center ${
                      partyType === "family"
                        ? "border-rose-600 bg-rose-50/60 ring-2 ring-rose-500/20 shadow-sm"
                        : "border-stone-200 bg-stone-50/50 hover:bg-stone-100/80"
                    }`}
                  >
                    <span className="text-3xl mb-2">🍽️</span>
                    <span className="text-sm font-black text-stone-900 block">Family</span>
                    <span className="text-xs text-stone-500 font-semibold mt-0.5">Up to 10 People</span>
                  </button>
                </div>

                {/* FAMILY INTERACTIVE STEPPER */}
                {partyType === "family" && (
                  <div className="mt-6 p-5 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-amber-800 block">
                        Family Group Size
                      </span>
                      <p className="text-xs text-stone-600 mt-0.5">
                        Allowed: 5 to 10 people maximum.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setFamilyCount((c) => Math.max(5, c - 1))}
                        disabled={familyCount <= 5}
                        className="w-10 h-10 rounded-full bg-white border border-stone-300 text-stone-800 font-black text-lg flex items-center justify-center hover:bg-stone-100 disabled:opacity-40"
                      >
                        -
                      </button>
                      <div className="w-16 text-center">
                        <span className="text-2xl font-black font-mono text-stone-900">
                          {familyCount}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">
                          Guests
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFamilyCount((c) => Math.min(10, c + 1))}
                        disabled={familyCount >= 10}
                        className="w-10 h-10 rounded-full bg-white border border-stone-300 text-stone-800 font-black text-lg flex items-center justify-center hover:bg-stone-100 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 3: CHOOSE TIME SLOT */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-sm font-black shadow-sm">
                      3
                    </span>
                    <div>
                      <h3 className="text-xl font-black text-stone-900">Choose Time Slot</h3>
                      <p className="text-xs text-stone-500">
                        {settings?.openingTimeFormatted} – {settings?.closingTimeFormatted} (30 min slots)
                      </p>
                    </div>
                  </div>
                  {selectedTime && (
                    <span className="text-xs font-bold px-3 py-1 bg-rose-50 text-rose-700 rounded-full border border-rose-200">
                      Selected: {slots.find((s) => s.time === selectedTime)?.displayTime || selectedTime}
                    </span>
                  )}
                </div>

                {loadingSlots ? (
                  <div className="py-12 text-center">
                    <span className="inline-block w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs font-bold text-stone-500">Checking seat availability...</p>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="py-8 text-center text-stone-500 text-sm">
                    No time slots configured for this date.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-6">
                    {slots.map((slot) => {
                      const isSelected = selectedTime === slot.time;
                      const hasCapacity = slot.remaining >= guestCount;
                      const isClickable = !slot.isPast && hasCapacity;

                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!isClickable}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center relative ${
                            isSelected
                              ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-200"
                              : isClickable
                              ? "bg-stone-50/70 border-stone-200 text-stone-900 hover:bg-stone-100 hover:border-stone-300"
                              : "bg-stone-100/50 border-stone-200 text-stone-400 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <span className="text-sm font-black">{slot.displayTime}</span>
                          <span className={`text-[10px] font-bold mt-1 ${
                            isSelected
                              ? "text-rose-100"
                              : slot.isPast
                              ? "text-stone-400"
                              : slot.remaining < 5
                              ? "text-amber-600 font-extrabold"
                              : "text-stone-500"
                          }`}>
                            {slot.isPast
                              ? "Passed"
                              : !hasCapacity
                              ? `Full (${slot.remaining} left)`
                              : `${slot.remaining} seats left`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* STEP 4: DINER DETAILS */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-sm font-black shadow-sm">
                    4
                  </span>
                  <div>
                    <h3 className="text-xl font-black text-stone-900">Guest Information</h3>
                    <p className="text-xs text-stone-500">Contact details for reservation confirmation</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                      Mobile Contact Number *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="10-digit mobile number"
                      className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Special Requests & Seating Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Celebrating a birthday, booth seating preferred, need child high-chair..."
                    className="w-full px-4 py-2.5 text-sm font-medium rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                  />
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: RESERVATION SUMMARY & CONFIRM */}
            <div className="lg:col-span-4 sticky top-24 space-y-6">
              <div className="rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-7 shadow-xl shadow-stone-900/5">
                <div className="border-b border-stone-200 pb-4 mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block">
                    Reservation Summary
                  </span>
                  <h3 className="text-xl font-black text-stone-900 mt-0.5">
                    Table Booking Slip
                  </h3>
                </div>

                <div className="space-y-3.5 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-stone-100">
                    <span className="text-stone-500 text-xs font-bold uppercase">Date</span>
                    <span className="font-black text-stone-900">
                      {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-stone-100">
                    <span className="text-stone-500 text-xs font-bold uppercase">Time</span>
                    <span className="font-black text-rose-600">
                      {selectedTime
                        ? slots.find((s) => s.time === selectedTime)?.displayTime || selectedTime
                        : "Not selected"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-stone-100">
                    <span className="text-stone-500 text-xs font-bold uppercase">Party Type</span>
                    <span className="font-black text-stone-900 capitalize">
                      {partyType} ({guestCount} {guestCount === 1 ? "Guest" : "Guests"})
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-stone-100">
                    <span className="text-stone-500 text-xs font-bold uppercase">Guest</span>
                    <span className="font-bold text-stone-900 truncate max-w-[150px]">
                      {customerName || "—"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-stone-500 text-xs font-bold uppercase">Reservation Fee</span>
                    <span className="font-black text-emerald-600 uppercase text-xs">
                      FREE (Complimentary)
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 leading-snug">
                    {error}
                  </div>
                )}

                {/* Confirm Button */}
                <div className="mt-6">
                  {!user ? (
                    <button
                      type="button"
                      onClick={() => navigate("/login", { state: { from: "/dine-in" } })}
                      className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-black text-sm rounded-full shadow transition"
                    >
                      Sign In to Confirm Table &rarr;
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={submitting || !selectedTime || !customerName.trim()}
                      onClick={handleConfirmReservation}
                      className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm rounded-full shadow-lg shadow-rose-600/20 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {submitting ? "Reserving Table..." : "Confirm Reservation 🍽️"}
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-center text-stone-400 mt-3">
                  Booth held for 15 minutes past reserved time. Cancel anytime in My Reservations.
                </p>
              </div>

              {/* Quick Info Box */}
              <div className="rounded-3xl bg-amber-50/70 border border-amber-200/80 p-5 text-xs text-amber-900 space-y-2">
                <span className="font-black uppercase tracking-wider block">
                  🍔 TastyBites Dine-In Perks
                </span>
                <p>
                  • Fresh food prepped to order right off our kitchen grill.
                </p>
                <p>
                  • Large parties welcome! Family booths comfortably seat up to 10 guests.
                </p>
                <p>
                  • Real-time table status directly managed by our restaurant floor team.
                </p>
              </div>

            </div>

          </div>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default DineIn;
