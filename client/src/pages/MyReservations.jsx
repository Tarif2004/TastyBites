import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyDineInReservations, cancelDineInReservation } from "../services/api";
import RetroButton from "../components/RetroButton";
import Footer from "../components/Footer";

const STATUS_CONFIG = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-sky-50 text-sky-700 border-sky-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};

const MyReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMyDineInReservations();
      setReservations(Array.isArray(data.reservations) ? data.reservations : []);
    } catch (err) {
      console.error("Error loading reservations:", err);
      setError(err.message || "Failed to load your reservations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleCancel = async (id, code) => {
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel reservation ${code}? This table slot will be released for other diners.`
    );
    if (!confirmCancel) return;

    try {
      setCancellingId(id);
      setActionError("");
      await cancelDineInReservation(id);
      // Reload list
      await loadReservations();
    } catch (err) {
      console.error("Cancel error:", err);
      setActionError(err.message || "Unable to cancel reservation.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-between">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full">
        
        {/* PAGE HEADER */}
        <div className="mb-8 border-b border-stone-200/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Account</span>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight mt-1">
              My Table Reservations
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              View your upcoming Dine-In bookings and reservation history.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/my-orders"
              className="px-4 py-2 text-xs font-bold rounded-full border border-stone-300 text-stone-700 hover:bg-stone-100 transition"
            >
              View Food Orders &rarr;
            </Link>
            <Link to="/dine-in">
              <RetroButton variant="primary" className="px-5 py-2 text-xs">
                Book a Table 🍽️
              </RetroButton>
            </Link>
          </div>
        </div>

        {/* ERROR MESSAGES */}
        {actionError && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
            {actionError}
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 animate-pulse rounded-3xl bg-white border border-stone-200" />
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && reservations.length === 0 && (
          <div className="mx-auto max-w-md rounded-3xl border border-stone-200 bg-white p-12 text-center shadow-sm">
            <span className="text-6xl mb-4 block">🍽️</span>
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
              No Table Reservations
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              You haven't reserved a booth at TastyBites yet. Book a table now to enjoy our diner vibe in person!
            </p>
            <Link to="/dine-in" className="mt-6 inline-block">
              <RetroButton variant="primary" className="px-7 py-3 text-sm">
                Reserve a Table &rarr;
              </RetroButton>
            </Link>
          </div>
        )}

        {/* RESERVATIONS GRID */}
        {!loading && !error && reservations.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reservations.map((r) => {
              const statusClass =
                STATUS_CONFIG[r.status] || "bg-stone-50 text-stone-700 border-stone-200";

              const formattedDate = new Date(r.date + "T00:00:00").toLocaleDateString("en-IN", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              const canCancel = r.status === "confirmed" || r.status === "pending";

              return (
                <div
                  key={r._id}
                  className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-stone-100">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 block">
                          Pass Code
                        </span>
                        <span className="font-mono font-black text-stone-900 text-sm">
                          {r.reservationCode}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase border ${statusClass}`}
                      >
                        {r.status}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-stone-800">
                        <span className="text-base">📅</span>
                        <span className="font-bold">{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-rose-600 font-bold">
                        <span className="text-base">🕐</span>
                        <span>{r.displayTime || r.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-stone-700">
                        <span className="text-base">👥</span>
                        <span>
                          <strong className="text-stone-900">{r.numberOfPeople} Guests</strong> (
                          <span className="capitalize">{r.partyType}</span>)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-stone-600 text-xs">
                        <span className="text-sm">👤</span>
                        <span>
                          {r.customerName} • {r.phone}
                        </span>
                      </div>

                      {r.notes && (
                        <div className="mt-3 p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-xs text-stone-600">
                          <span className="font-bold text-stone-700">Notes: </span>
                          {r.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] text-stone-400">
                      Booked {new Date(r.createdAt).toLocaleDateString()}
                    </span>

                    {canCancel ? (
                      <button
                        type="button"
                        disabled={cancellingId === r._id}
                        onClick={() => handleCancel(r._id, r.reservationCode)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline disabled:opacity-50"
                      >
                        {cancellingId === r._id ? "Cancelling..." : "Cancel Booking"}
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-stone-400">
                        {r.status === "cancelled" ? "Cancelled" : "Archived"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default MyReservations;
