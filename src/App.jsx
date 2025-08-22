// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { app } from "./firebaseConfig";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

const auth = getAuth(app);

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AUD", "JPY", "CAD"];

const categories = [
  "Flights",
  "Hotels",
  "Food",
  "Transport",
  "Activities",
  "Shopping",
  "Misc",
];

function Navbar({ user, onLogout, displayCurrency, setDisplayCurrency, ratesLoaded }) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold">
            TB
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">Travel Budget Planner</h1>
            <p className="text-xs text-gray-500 -mt-0.5">Plan. Track. Enjoy your trip.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value)}
            className="rounded-xl border-gray-300 px-3 py-2 text-sm"
            title={ratesLoaded ? "Change display currency" : "Rates loading..."}
            disabled={!ratesLoaded}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {user ? (
            <>
              <div className="hidden sm:inline text-sm text-gray-600">Hi, {user.displayName || user.email}</div>
              <button
                onClick={onLogout}
                className="px-3 py-2 rounded-xl bg-gray-900 text-white text-sm hover:bg-black transition"
              >
                Logout
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function AuthCard() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center bg-gradient-to-b from-indigo-50 to-white px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-center text-gray-600 mt-1 mb-6">
          {mode === "login" ? "Sign in to manage your trip budget" : "Start planning your perfect trip"}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                className="mt-1 w-full rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Manisha"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              className="mt-1 w-full rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              className="mt-1 w-full rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-2">{error}</p>}
          <button
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
        <div className="text-center mt-4 text-sm">
          {mode === "login" ? (
            <button onClick={() => setMode("register")} className="text-indigo-600 hover:underline">
              New here? Create an account
            </button>
          ) : (
            <button onClick={() => setMode("login")} className="text-indigo-600 hover:underline">
              Already have an account? Sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook: per-user expenses saved in localStorage
function useUserExpenses(uid) {
  const key = uid ? `tbp:expenses:${uid}` : null;
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!key) return;
    const raw = localStorage.getItem(key);
    setItems(raw ? JSON.parse(raw) : []);
  }, [key]);

  useEffect(() => {
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(items));
  }, [key, items]);

  return [items, setItems];
}

function SummaryCards({ budgetInINR, displayCurrency, rates, spentInINR, onChangeBudgetInDisplay }) {
  // convert INR amounts to display currency for showing
  const conv = (inr) => {
    if (!rates || !rates[displayCurrency]) return inr.toFixed(2);
    const factor = rates[displayCurrency]; // 1 INR = factor DISPLAY
    return (inr * factor).toFixed(2);
  };
  const remainingInINR = Math.max(0, budgetInINR - spentInINR);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="p-5 rounded-2xl border bg-white shadow-sm">
        <p className="text-sm text-gray-500">Total Budget ({displayCurrency})</p>
        <div className="mt-2 flex items-end justify-between">
          <h3 className="text-2xl font-bold">
            {displayCurrency} {conv(budgetInINR)}
          </h3>
          <input
            type="number"
            min={0}
            className="ml-3 w-36 rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
            onChange={(e) => onChangeBudgetInDisplay(Number(e.target.value || 0))}
            placeholder="Set budget"
          />
        </div>
      </div>

      <div className="p-5 rounded-2xl border bg-white shadow-sm">
        <p className="text-sm text-gray-500">Total Spent ({displayCurrency})</p>
        <h3 className="mt-2 text-2xl font-bold">
          {displayCurrency} {conv(spentInINR)}
        </h3>
      </div>

      <div
        className={`p-5 rounded-2xl border shadow-sm ${remainingInINR === 0 ? "bg-red-50 border-red-200" : "bg-white"}`}
      >
        <p className="text-sm text-gray-500">Remaining ({displayCurrency})</p>
        <h3 className="mt-2 text-2xl font-bold">
          {displayCurrency} {conv(remainingInINR)}
        </h3>
      </div>
    </div>
  );
}

function ExpenseForm({ onAdd, displayCurrency, rates }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  // When user enters an amount in displayCurrency, convert to base (INR) for storage
  const handleSubmit = (e) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) return;
    // convert to INR: if rates[displayCurrency] = (1 INR = x DISPLAY), then 1 DISPLAY = 1/x INR
    const rate = rates?.[displayCurrency] ?? 1;
    const amountInINR = rate ? num / rate : num; // safe fallback
    const entry = {
      id: crypto.randomUUID(),
      amountInINR: Math.round(amountInINR * 100) / 100,
      displayAmount: num,
      displayCurrency,
      category,
      note,
      date,
    };
    onAdd(entry);
    setAmount("");
    setNote("");
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-5">
      <input
        type="number"
        className="rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder={`Amount (${displayCurrency})`}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        min={0.01}
        step="0.01"
      />
      <select
        className="rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        type="date"
        className="rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <input
        type="text"
        className="rounded-xl border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <button className="rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition">Add</button>
    </form>
  );
}

function ExpenseTable({ items, onUpdate, onDelete, displayCurrency, rates }) {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ amount: "", category: categories[0], date: "", note: "" });

  useEffect(() => {
    if (!editingId) setForm({ amount: "", category: categories[0], date: "", note: "" });
  }, [editingId]);

  const startEdit = (row) => {
    // display value: convert INR to display currency for edit
    const factor = rates?.[displayCurrency] ?? 1;
    const displayAmount = row.amountInINR * factor;
    setEditingId(row.id);
    setForm({ amount: displayAmount, category: row.category, date: row.date, note: row.note || "" });
  };

  const save = () => {
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return;
    const rate = rates?.[displayCurrency] ?? 1;
    const amountInINR = rate ? amt / rate : amt;
    onUpdate(editingId, { amountInINR: Math.round(amountInINR * 100) / 100, displayAmount: amt, displayCurrency });
    setEditingId(null);
  };

  const fmt = (inr) => {
    const factor = rates?.[displayCurrency] ?? 1;
    return `${displayCurrency} ${(inr * factor).toFixed(2)}`;
  };

  return (
    <div className="overflow-x-auto border rounded-2xl">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {items.length === 0 && (
            <tr>
              <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                No expenses yet. Add your first one!
              </td>
            </tr>
          )}

          {items.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">
                {editingId === row.id ? (
                  <input type="date" className="rounded-lg border-gray-300" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                ) : (
                  <span>{row.date}</span>
                )}
              </td>
              <td className="px-4 py-3">
                {editingId === row.id ? (
                  <select className="rounded-lg border-gray-300" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span>{row.category}</span>
                )}
              </td>
              <td className="px-4 py-3">
                {editingId === row.id ? (
                  <input className="rounded-lg border-gray-300" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
                ) : (
                  <span className="text-gray-700">{row.note || "-"}</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {editingId === row.id ? (
                  <input type="number" className="rounded-lg border-gray-300 w-28 text-right" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
                ) : (
                  <span className="font-medium">{fmt(row.amountInINR)}</span>
                )}
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                {editingId === row.id ? (
                  <div className="flex gap-2 justify-end">
                    <button className="px-3 py-1 rounded-lg bg-green-600 text-white" onClick={save}>
                      Save
                    </button>
                    <button className="px-3 py-1 rounded-lg bg-gray-200" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 justify-end">
                    <button className="px-3 py-1 rounded-lg bg-gray-900 text-white" onClick={() => startEdit(row)}>
                      Edit
                    </button>
                    <button className="px-3 py-1 rounded-lg bg-red-600 text-white" onClick={() => onDelete(row.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Charts({ items, displayCurrency, rates }) {
  const byCategory = useMemo(() => {
    const map = Object.fromEntries(categories.map((c) => [c, 0]));
    for (const r of items) map[r.category] += r.amountInINR;
    return map;
  }, [items]);

  const monthly = useMemo(() => {
    const map = {};
    for (const r of items) {
      const key = r.date?.slice(0, 7) || "Unknown";
      map[key] = (map[key] || 0) + r.amountInINR;
    }
    const keys = Object.keys(map).sort();
    return { labels: keys, values: keys.map((k) => map[k]) };
  }, [items]);

  const pieSeries = categories.map((c) => byCategory[c]);
  const factor = rates?.[displayCurrency] ?? 1;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border bg-white p-4">
        <h3 className="font-semibold mb-2">Expense by Category ({displayCurrency})</h3>
        <Chart options={{ labels: categories, legend: { position: "bottom" } }} series={pieSeries.map((v) => Math.round(v * factor * 100) / 100)} type="pie" height={320} />
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h3 className="font-semibold mb-2">Monthly Spend ({displayCurrency})</h3>
        <Chart options={{ xaxis: { categories: monthly.labels } }} series={[{ name: "Spent", data: monthly.values.map((v) => Math.round(v * factor * 100) / 100) }]} type="bar" height={320} />
      </div>
    </div>
  );
}

function AboutContact() {
  return (
    <footer className="mt-10 border-t pt-8 text-sm text-gray-700">
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-2">About</h3>
        <p>Travel Budget Planner helps you plan trips, track expenses, and stay within budget. Built with React, Tailwind, and Firebase Auth.</p>
      </section>
      <section>
        <h3 className="text-lg font-semibold mb-2">Contact</h3>
        <p>
          Need help or have feedback? Email{" "}
          <a className="text-indigo-600 hover:underline" href="mailto:support@example.com">
            melloww098@gmail.com
          </a>
          .
        </p>
      </section>
      <p className="mt-6 text-xs text-gray-500">© {new Date().getFullYear()} Travel Budget Planner</p>
    </footer>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // display currency & exchange rates
  const [displayCurrency, setDisplayCurrency] = useState("INR");
  const [rates, setRates] = useState(null);
  const [ratesLoaded, setRatesLoaded] = useState(false);

  useEffect(() => {
    // fetch base rates once (base = INR) so 1 INR -> X DISPLAY
    const fetchRates = async () => {
      try {
        setRatesLoaded(false);
        const res = await fetch("https://api.exchangerate.host/latest?base=INR");
        const json = await res.json();
        if (json && json.rates) {
          setRates(json.rates);
        } else {
          setRates(null);
        }
      } catch (err) {
        console.error("Failed to fetch rates", err);
        setRates(null);
      } finally {
        setRatesLoaded(true);
      }
    };
    fetchRates();
    // refresh rates every 30 minutes (optional)
    const id = setInterval(fetchRates, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="animate-pulse text-gray-600">Loading…</div>
      </div>
    );
  }

  return user ? (
    <DashboardWrapper user={user} logout={logout} displayCurrency={displayCurrency} setDisplayCurrency={setDisplayCurrency} rates={rates} ratesLoaded={ratesLoaded} />
  ) : (
    <>
      <Navbar user={null} onLogout={() => {}} displayCurrency={displayCurrency} setDisplayCurrency={setDisplayCurrency} ratesLoaded={ratesLoaded} />
      <AuthCard />
    </>
  );
}

// Dashboard wrapper component (keeps App clean)
function DashboardWrapper({ user, logout, displayCurrency, setDisplayCurrency, rates, ratesLoaded }) {
  const uid = user?.uid;
  const [items, setItems] = useUserExpenses(uid);

  // budget stored in INR per user
  const [budgetInINR, setBudgetInINR] = useState(() => {
    const raw = localStorage.getItem(`tbp:budget:${uid}`);
    return raw ? Number(raw) : 50000;
  });

  useEffect(() => {
    if (!uid) return;
    localStorage.setItem(`tbp:budget:${uid}`, String(budgetInINR));
  }, [uid, budgetInINR]);

  // spent in INR
  const spentInINR = useMemo(() => items.reduce((s, r) => s + (r.amountInINR || 0), 0), [items]);

  // add / update / remove functions
  const add = (r) => setItems((prev) => [r, ...prev]);
  const update = (id, patch) => setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id) => setItems((prev) => prev.filter((r) => r.id !== id));

  // export CSV
  const exportToCSV = () => {
    const header = ["Date", "Category", `Amount (${displayCurrency})`, "Amount (INR)", "Note"];
    const factor = rates?.[displayCurrency] ?? 1;
    const rows = items.map((e) => [
      e.date,
      e.category,
      (e.amountInINR * factor).toFixed(2),
      e.amountInINR.toFixed(2),
      (e.note || "").replaceAll(",", " "), // crude escaping
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }); // BOM for excel
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // export PDF using jsPDF and autotable
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Travel Budget - Expense Report", 14, 12);
    const head = [["Date", "Category", `Amount (${displayCurrency})`, "INR", "Note"]];
    const factor = rates?.[displayCurrency] ?? 1;
    const body = items.map((e) => [e.date, e.category, (e.amountInINR * factor).toFixed(2), e.amountInINR.toFixed(2), e.note || ""]);
    // @ts-ignore
    doc.autoTable({
      startY: 18,
      head,
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save(`expenses_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // handler to set budget value from display currency input
  const handleBudgetChangeInDisplay = (displayAmount) => {
    const factor = rates?.[displayCurrency] ?? 1; // 1 INR = factor DISPLAY
    const inr = factor ? displayAmount / factor : displayAmount;
    setBudgetInINR(Math.round(inr * 100) / 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50">
      <Navbar user={user} onLogout={logout} displayCurrency={displayCurrency} setDisplayCurrency={setDisplayCurrency} ratesLoaded={ratesLoaded} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-gray-600">Plan your trip budget and track every expense.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportToCSV} className="px-3 py-2 rounded-xl bg-green-600 text-white">
              Export CSV
            </button>
            <button onClick={exportToPDF} className="px-3 py-2 rounded-xl bg-red-600 text-white">
              Export PDF
            </button>
          </div>
        </div>

        <SummaryCards budgetInINR={budgetInINR} displayCurrency={displayCurrency} rates={rates} spentInINR={spentInINR} onChangeBudgetInDisplay={handleBudgetChangeInDisplay} />

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border bg-white p-4">
              <h3 className="font-semibold mb-3">Add Expense</h3>
              <ExpenseForm onAdd={add} displayCurrency={displayCurrency} rates={rates} />
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <h3 className="font-semibold mb-3">All Expenses</h3>
              <ExpenseTable items={items} onUpdate={update} onDelete={remove} displayCurrency={displayCurrency} rates={rates} />
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <Charts items={items} displayCurrency={displayCurrency} rates={rates} />
          </div>
        </div>

        <AboutContact />
      </main>
    </div>
  );
}
