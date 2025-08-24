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

/* ---------------------------
   Constants & categories
   --------------------------- */
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

/* ---------------------------
   Helper: readable displayName
   --------------------------- */
function getDisplayName(user) {
  if (!user) return "";
  if (user.displayName) return user.displayName;
  if (user.email) {
    const beforeAt = user.email.split("@")[0];
    const cleaned = beforeAt.replace(/[._-]+/g, " ");
    return cleaned
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return "User";
}

/* ---------------------------
   Navbar
   --------------------------- */
function Navbar({ user, onLogout, displayCurrency, setDisplayCurrency, ratesLoaded, darkMode, toggleDarkMode }) {
  return (
    <header
      className={`sticky top-0 z-30 backdrop-blur border-b ${
        darkMode ? "bg-gray-900/80 border-gray-800" : "bg-white/80 border-gray-200"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl font-bold text-white ${
              darkMode ? "bg-indigo-500" : "bg-indigo-600"
            }`}
            title="Travel Budget"
          >
            TB
          </div>
          <div>
            <h1 className={`text-lg sm:text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
              Travel Budget Planner
            </h1>
            <p className={`text-xs -mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Plan. Track. Enjoy your trip.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className={`px-3 py-2 rounded-xl text-sm border transition ${
              darkMode
                ? "bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-700"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>

          <select
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value)}
            className={`rounded-xl px-3 py-2 text-sm border ${
              darkMode ? "bg-gray-800 text-gray-100 border-gray-700" : "bg-white text-gray-800 border-gray-300"
            }`}
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
              <div className={`hidden sm:inline text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Hi, {getDisplayName(user)}
              </div>
              <button onClick={onLogout} className="px-3 py-2 rounded-xl bg-gray-900 text-white text-sm hover:bg-black transition">
                Logout
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}

/* ---------------------------
   AuthCard (Login / Register)
   --------------------------- */
function AuthCard({ darkMode }) {
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
        if (name) {
          // set displayName immediately after registration
          await updateProfile(cred.user, { displayName: name });
        }
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
    <div
      className={`min-h-[calc(100vh-4rem)] grid place-items-center ${
        darkMode ? "bg-gradient-to-b from-gray-950 to-gray-900" : "bg-gradient-to-b from-indigo-50 to-white"
      } px-4`}
    >
      <div className={`w-full max-w-md rounded-3xl shadow-xl border p-6 sm:p-8 ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}`}>
        <h2 className={`text-2xl font-bold text-center ${darkMode ? "text-white" : "text-gray-900"}`}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className={`text-center mt-1 mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          {mode === "login" ? "Sign in to manage your trip budget" : "Start planning your perfect trip"}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Name</label>
              <input
                className={`mt-1 w-full rounded-xl border focus:border-indigo-500 focus:ring-indigo-500 ${
                  darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "border-gray-300"
                }`}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Manisha"
                required
              />
            </div>
          )}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Email</label>
            <input
              className={`mt-1 w-full rounded-xl border focus:border-indigo-500 focus:ring-indigo-500 ${
                darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "border-gray-300"
              }`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Password</label>
            <input
              className={`mt-1 w-full rounded-xl border focus:border-indigo-500 focus:ring-indigo-500 ${
                darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "border-gray-300"
              }`}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          {error && (
            <p className={`text-sm ${darkMode ? "text-red-400 bg-red-950 border-red-900" : "text-red-600 bg-red-50 border-red-200"} border rounded-xl p-2`}>
              {error}
            </p>
          )}
          <button disabled={loading} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-50">
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
        <div className="text-center mt-4 text-sm">
          {mode === "login" ? (
            <button onClick={() => setMode("register")} className="text-indigo-500 hover:underline">New here? Create an account</button>
          ) : (
            <button onClick={() => setMode("login")} className="text-indigo-500 hover:underline">Already have an account? Sign in</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------
   Hook: per-user expenses saved in localStorage
   --------------------------- */
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

/* ---------------------------
   SummaryCards
   --------------------------- */
function SummaryCards({ budgetInINR, displayCurrency, rates, spentInINR, onChangeBudgetInDisplay, darkMode }) {
  const conv = (inr) => {
    if (!rates || !rates[displayCurrency]) return inr.toFixed(2);
    const factor = rates[displayCurrency];
    return (inr * factor).toFixed(2);
  };
  const remainingInINR = Math.max(0, budgetInINR - spentInINR);

  const cardCls = `p-5 rounded-2xl border shadow-sm ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white"}`;
  const labelCls = `text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`;
  const titleCls = `text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className={cardCls}>
        <p className={labelCls}> Total Budget ({displayCurrency})</p>
        <div className="mt-2 flex items-end justify-between">
          <h3 className={titleCls}>
            {displayCurrency} {conv(budgetInINR)}
          </h3>
          <input
            type="number"
            min={0}
            className={`ml-3 w-36 rounded-xl border focus:ring-indigo-500 focus:border-indigo-500 ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "border-gray-300"}`}
            onChange={(e) => onChangeBudgetInDisplay(Number(e.target.value || 0))}
            placeholder="Set budget"
          />
        </div>
      </div>

      <div className={cardCls}>
        <p className={labelCls}> Total Spent ({displayCurrency})</p>
        <h3 className={titleCls}>
          {displayCurrency} {conv(spentInINR)}
        </h3>
      </div>

      <div className={`p-5 rounded-2xl border shadow-sm ${remainingInINR === 0 ? (darkMode ? "bg-red-950 border-red-900" : "bg-red-50 border-red-200") : (darkMode ? "bg-gray-900 border-gray-800" : "bg-white")}`}>
        <p className={labelCls}> Remaining ({displayCurrency})</p>
        <h3 className={titleCls}>
          {displayCurrency} {conv(remainingInINR)}
        </h3>
      </div>
    </div>
  );
}

/* ---------------------------
   ExpenseForm
   --------------------------- */
function ExpenseForm({ onAdd, displayCurrency, rates, darkMode }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) return;
    const rate = rates?.[displayCurrency] ?? 1;
    const amountInINR = rate ? num / rate : num;
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

  const inputCls = `rounded-xl border focus:ring-indigo-500 focus:border-indigo-500 ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-400" : "border-gray-300"}`;

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-5">
      <input type="number" className={inputCls} placeholder={`Amount (${displayCurrency})`} value={amount} onChange={(e) => setAmount(e.target.value)} required min={0.01} step="0.01" />
      <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
      <input type="text" className={inputCls} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition">Add</button>
    </form>
  );
}

/* ---------------------------
   ExpenseTable
   --------------------------- */
function ExpenseTable({ items, onUpdate, onDelete, displayCurrency, rates, darkMode }) {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ amount: "", category: categories[0], date: "", note: "" });

  useEffect(() => {
    if (!editingId) setForm({ amount: "", category: categories[0], date: "", note: "" });
  }, [editingId]);

  const startEdit = (row) => {
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

  const thCls = `px-4 py-3 text-left text-xs font-medium uppercase ${darkMode ? "text-gray-300" : "text-gray-500"}`;
  const tdInputCls = `rounded-lg ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "border-gray-300"}`;
  const tableWrapCls = `overflow-x-auto border rounded-2xl ${darkMode ? "border-gray-800" : ""}`;
  const theadCls = `${darkMode ? "bg-gray-900" : "bg-gray-50"}`;
  const rowHover = `${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}`;
  const tbodyCls = `divide-y ${darkMode ? "divide-gray-800 bg-gray-900" : "divide-gray-100 bg-white"}`;

  return (
    <div className={tableWrapCls}>
      <table className="min-w-full divide-y">
        <thead className={theadCls}>
          <tr>
            <th className={thCls}>Date</th>
            <th className={thCls}>Category</th>
            <th className={thCls}>Note</th>
            <th className={`${thCls} text-right`}>Amount</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className={tbodyCls}>
          {items.length === 0 && (
            <tr>
              <td colSpan="5" className={`px-4 py-6 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No expenses yet. Add your first one!</td>
            </tr>
          )}

          {items.map((row) => (
            <tr key={row.id} className={rowHover}>
              <td className="px-4 py-3 whitespace-nowrap">
                {editingId === row.id ? (
                  <input type="date" className={tdInputCls} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                ) : (
                  <span className={darkMode ? "text-gray-200" : ""}>{row.date}</span>
                )}
              </td>
              <td className="px-4 py-3">
                {editingId === row.id ? (
                  <select className={tdInputCls} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                    {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                ) : (
                  <span className={darkMode ? "text-gray-200" : ""}>{row.category}</span>
                )}
              </td>
              <td className="px-4 py-3">
                {editingId === row.id ? (
                  <input className={tdInputCls} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
                ) : (
                  <span className={darkMode ? "text-gray-300" : "text-gray-700"}>{row.note || "-"}</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {editingId === row.id ? (
                  <input type="number" className={`${tdInputCls} w-28 text-right`} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
                ) : (
                  <span className={`font-medium ${darkMode ? "text-gray-100" : ""}`}>{fmt(row.amountInINR)}</span>
                )}
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                {editingId === row.id ? (
                  <div className="flex gap-2 justify-end">
                    <button className="px-3 py-1 rounded-lg bg-green-600 text-white" onClick={save}>Save</button>
                    <button className={`px-3 py-1 rounded-lg ${darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-200"}`} onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                ) : (
                  <div className="flex gap-2 justify-end">
                    <button className="px-3 py-1 rounded-lg bg-gray-900 text-white" onClick={() => startEdit(row)}>Edit</button>
                    <button className="px-3 py-1 rounded-lg bg-red-600 text-white" onClick={() => onDelete(row.id)}>Delete</button>
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

/* ---------------------------
   Charts component
   - Pie chart fix: container height (h-96) + Chart height/width 100%
   --------------------------- */
function Charts({ items, displayCurrency, rates, darkMode }) {
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

  const pieOptions = {
    chart: {
      background: "transparent",
      toolbar: { show: false },
    },
    labels: categories,
    legend: {
      position: "bottom",
      labels: { colors: darkMode ? "#e5e7eb" : "#374151" },
    },
    dataLabels: { style: { colors: ["#fff"] } },
    theme: { mode: darkMode ? "dark" : "light" },
    responsive: [
      {
        breakpoint: 640,
        options: {
          legend: { position: "bottom" },
        },
      },
    ],
  };

  const barOptions = {
    chart: { background: "transparent" },
    plotOptions: { bar: { borderRadius: 6 } },
    xaxis: { categories: monthly.labels, labels: { style: { colors: darkMode ? "#e5e7eb" : "#374151" } } },
    yaxis: { labels: { style: { colors: darkMode ? "#e5e7eb" : "#374151" } } },
    theme: { mode: darkMode ? "dark" : "light" },
  };

  const cardCls = `rounded-2xl border p-4 ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white"}`;
  const titleCls = `font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* PIE - note the container has a tall height (h-96) so chart can fill */}
      <div className={`${cardCls} h-96 flex flex-col`}>
        <h3 className={titleCls}>Expense by Category ({displayCurrency})</h3>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full h-full">
            {/* Chart set to fill available container */}
            <Chart options={pieOptions} series={pieSeries.map((v) => Math.round(v * factor * 100) / 100)} type="pie" height="100%" width="100%" />
          </div>
        </div>
      </div>

      {/* BAR */}
      <div className={cardCls}>
        <h3 className={titleCls}>Monthly Spend ({displayCurrency})</h3>
        <Chart options={barOptions} series={[{ name: "Spent", data: monthly.values.map((v) => Math.round(v * factor * 100) / 100) }]} type="bar" height={320} />
      </div>
    </div>
  );
}

/* ---------------------------
   About & Contact
   --------------------------- */
function AboutContact({ darkMode }) {
  return (
    <footer className={`mt-10 border-t pt-8 text-sm ${darkMode ? "text-gray-300 border-gray-800" : "text-gray-700"}`}>
      <section className="mb-8">
        <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>About</h3>
        <p>
          Travel Budget Planner is a smart and easy-to-use web app designed to help travelers plan, manage, and track their trip expenses in one place. With features like multi-currency support, expense categorization, real-time charts, and export options (CSV & PDF), it ensures you always stay within budget while traveling. The app securely manages user accounts with Firebase Authentication and stores your budget and expenses locally for a personalized experience. Built using React, Tailwind CSS, and Firebase, Travel Budget Planner is your all-in-one solution to plan better, spend wisely, and enjoy stress-free travel.
        </p>
      </section>
      <section>
        <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>Contact</h3>
        <p>
          Need help or have feedback? Email{" "}
          <a className="text-indigo-500 hover:underline" href="mailto:melloww098@gmail.com">melloww098@gmail.com</a>.
        </p>
      </section>
      <p className={`mt-6 text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>© {new Date().getFullYear()} Travel Budget Planner</p>
    </footer>
  );
}

/* ---------------------------
   Main App
   --------------------------- */
export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // Theme (dark/light) with persistence
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("tbp:theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    localStorage.setItem("tbp:theme", darkMode ? "dark" : "light");
  }, [darkMode]);
  const toggleDarkMode = () => setDarkMode((d) => !d);

  // display currency & exchange rates
  const [displayCurrency, setDisplayCurrency] = useState("INR");
  const [rates, setRates] = useState(null);
  const [ratesLoaded, setRatesLoaded] = useState(false);

  useEffect(() => {
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
    const id = setInterval(fetchRates, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // auth state
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
      <div className={`min-h-screen grid place-items-center ${darkMode ? "bg-gray-950 text-gray-200" : ""}`}>
        <div className={`animate-pulse ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Loading…</div>
      </div>
    );
  }

  return user ? (
    <DashboardWrapper
      user={user}
      logout={logout}
      displayCurrency={displayCurrency}
      setDisplayCurrency={setDisplayCurrency}
      rates={rates}
      ratesLoaded={ratesLoaded}
      darkMode={darkMode}
      toggleDarkMode={toggleDarkMode}
    />
  ) : (
    <div className={darkMode ? "dark bg-gray-950 text-gray-100 min-h-screen" : "bg-white min-h-screen"}>
      <Navbar user={null} onLogout={() => {}} displayCurrency={displayCurrency} setDisplayCurrency={setDisplayCurrency} ratesLoaded={ratesLoaded} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <AuthCard darkMode={darkMode} />
    </div>
  );
}

/* ---------------------------
   Dashboard wrapper (keeps App clean)
   --------------------------- */
function DashboardWrapper({ user, logout, displayCurrency, setDisplayCurrency, rates, ratesLoaded, darkMode, toggleDarkMode }) {
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
      (e.note || "").replaceAll(",", " "),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
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
    <div className={darkMode ? "dark bg-gray-950 text-gray-100 min-h-screen" : "bg-gradient-to-b from-white to-indigo-50 min-h-screen"}>
      <Navbar user={user} onLogout={logout} displayCurrency={displayCurrency} setDisplayCurrency={setDisplayCurrency} ratesLoaded={ratesLoaded} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Dashboard</h2>
            <p className={darkMode ? "text-gray-400" : "text-gray-600"}>Plan your trip budget and track every expense.</p>
            <p className={`mt-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Welcome, {getDisplayName(user)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportToCSV} className="px-3 py-2 rounded-xl bg-green-600 text-white">Export CSV</button>
            <button onClick={exportToPDF} className="px-3 py-2 rounded-xl bg-red-600 text-white">Export PDF</button>
          </div>
        </div>

        <SummaryCards budgetInINR={budgetInINR} displayCurrency={displayCurrency} rates={rates} spentInINR={spentInINR} onChangeBudgetInDisplay={handleBudgetChangeInDisplay} darkMode={darkMode} />

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className={`rounded-2xl border p-4 ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white"}`}>
              <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>Add Expense</h3>
              <ExpenseForm onAdd={add} displayCurrency={displayCurrency} rates={rates} darkMode={darkMode} />
            </div>

            <div className={`rounded-2xl border p-4 ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white"}`}>
              <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>All Expenses</h3>
              <ExpenseTable items={items} onUpdate={update} onDelete={remove} displayCurrency={displayCurrency} rates={rates} darkMode={darkMode} />
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <Charts items={items} displayCurrency={displayCurrency} rates={rates} darkMode={darkMode} />
          </div>
        </div>

        <AboutContact darkMode={darkMode} />
      </main>
    </div>
  );
}
