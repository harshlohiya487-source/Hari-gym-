import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";
import {
  Dumbbell, Users, CreditCard, CalendarCheck, Settings as SettingsIcon,
  Plus, Search, MessageCircle, Trash2, Check, Pencil, IndianRupee,
  AlertTriangle, LayoutDashboard, Globe, LogOut,
} from "lucide-react";

const T = {
  en: {
    appName: "GymDesk", dashboard: "Dashboard", members: "Members", addMember: "Add Member",
    payments: "Payments", attendance: "Attendance", settings: "Settings",
    totalMembers: "Total members", activeMembers: "Active", expiringSoon: "Expiring in 7 days",
    monthRevenue: "This month", expiringMembersTitle: "Renewals due soon", remindWhatsApp: "Remind",
    renew: "Renew", noExpiring: "Nobody's expiring in the next 7 days.", searchPlaceholder: "Search by name or phone",
    filterAll: "All", filterActive: "Active", filterExpiring: "Expiring", filterExpired: "Expired",
    name: "Name", phone: "Phone", plan: "Plan", fees: "Fee", joinDate: "Joined", expiryDate: "Expires",
    save: "Save", cancel: "Cancel", delete: "Delete", confirmDeleteMember: "Remove this member?",
    paymentHistory: "Payment history", recordPayment: "Record payment", amount: "Amount", method: "Method",
    cash: "Cash", upi: "UPI", card: "Card", totalRevenue: "Total collected", noPayments: "No payments yet.",
    todayAttendance: "Today's attendance", presentToday: "Present today", totalCheckins: "Total check-ins",
    plansManagement: "Membership plans", planName: "Plan name", days: "Days", defaultFee: "Fee (₹)",
    addPlan: "Add plan", gymSettings: "Gym settings", gymNameLabel: "Gym name", ownerNameLabel: "Owner name",
    gymTimings: "Gym timings", statusActive: "Active", statusExpiring: "Expiring soon", statusExpired: "Expired",
    noMembers: "No members yet.", days_: "days", saved: "Saved", logout: "Log out",
    email: "Email", password: "Password", login: "Log in", signup: "Sign up",
    noAccount: "No account? Sign up", haveAccount: "Already have an account? Log in",
    onboardTitle: "Set up your gym", getStarted: "Get started", trialLeft: (n) => n > 0 ? `Trial: ${n} days left` : "Trial ended",
    trialOverTitle: "Your free trial has ended", trialOverSub: "Contact us to activate your paid plan.",
    whatsappMsg: (n, g, d) => `Hi ${n}, your ${g} membership expires on ${d}. Please renew soon. Thank you!`,
  },
  hi: {
    appName: "GymDesk", dashboard: "Dashboard", members: "Members", addMember: "Member Jodo",
    payments: "Payments", attendance: "Attendance", settings: "Settings",
    totalMembers: "Total members", activeMembers: "Active", expiringSoon: "7 din me expire",
    monthRevenue: "Is mahine", expiringMembersTitle: "Jaldi renew karwana hai", remindWhatsApp: "Yaad dilao",
    renew: "Renew", noExpiring: "Agle 7 din me koi expire nahi ho raha.", searchPlaceholder: "Naam ya phone se dhoondo",
    filterAll: "Sab", filterActive: "Active", filterExpiring: "Expiring", filterExpired: "Expired",
    name: "Naam", phone: "Phone", plan: "Plan", fees: "Fee", joinDate: "Join kiya", expiryDate: "Expiry",
    save: "Save karo", cancel: "Cancel", delete: "Hatao", confirmDeleteMember: "Ye member hatana hai?",
    paymentHistory: "Payment history", recordPayment: "Payment record karo", amount: "Amount", method: "Tarika",
    cash: "Cash", upi: "UPI", card: "Card", totalRevenue: "Total mila", noPayments: "Abhi koi payment nahi.",
    todayAttendance: "Aaj ki attendance", presentToday: "Aaj present", totalCheckins: "Total check-ins",
    plansManagement: "Membership plans", planName: "Plan ka naam", days: "Din", defaultFee: "Fee (₹)",
    addPlan: "Plan jodo", gymSettings: "Gym settings", gymNameLabel: "Gym ka naam", ownerNameLabel: "Owner ka naam",
    gymTimings: "Gym ka timing", statusActive: "Active", statusExpiring: "Jaldi expire", statusExpired: "Expired",
    noMembers: "Abhi koi member nahi.", days_: "din", saved: "Save ho gaya", logout: "Logout",
    email: "Email", password: "Password", login: "Login", signup: "Signup",
    noAccount: "Account nahi hai? Signup karo", haveAccount: "Pehle se account hai? Login karo",
    onboardTitle: "Apna gym set up karo", getStarted: "Shuru karo", trialLeft: (n) => n > 0 ? `Trial: ${n} din baaki` : "Trial khatam",
    trialOverTitle: "Trial khatam ho gaya", trialOverSub: "Paid plan activate karne ke liye contact karo.",
    whatsappMsg: (n, g, d) => `Hi ${n}, aapki ${g} membership ${d} ko expire ho rahi hai. Please renew karwa lijiye. Dhanyawad!`,
  },
};

const DEFAULT_PLANS = [
  { name: "Monthly", days: 30, fee: 1000 },
  { name: "Quarterly", days: 90, fee: 2700 },
  { name: "Half-Yearly", days: 180, fee: 5000 },
  { name: "Yearly", days: 365, fee: 9000 },
];

const TRIAL_DAYS = 7;
const SELLER_WHATSAPP = "919999999999"; // 👉 replace with your own WhatsApp number

const todayStr = () => new Date().toISOString().slice(0, 10);
const addDays = (dateStr, days) => { const d = new Date(dateStr); d.setDate(d.getDate() + Number(days)); return d.toISOString().slice(0, 10); };
const fmtDate = (iso) => !iso ? "—" : new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const daysBetween = (a, b) => Math.ceil((new Date(a) - new Date(b)) / 86400000);
const initials = (name) => (name || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join("");
const getStatus = (expiry) => { const d = daysBetween(expiry, todayStr()); return d < 0 ? "expired" : d <= 7 ? "expiring" : "active"; };

export default function App() {
  const [session, setSession] = useState(undefined);
  const [gym, setGym] = useState(null);
  const [loadingGym, setLoadingGym] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    if (!session) { setGym(null); setLoadingGym(false); return; }
    (async () => {
      setLoadingGym(true);
      const { data } = await supabase.from("gyms").select("*").eq("id", session.user.id).maybeSingle();
      setGym(data);
      setLoadingGym(false);
    })();
  }, [session]);

  if (session === undefined || loadingGym) return <Screen><p className="text-[#8F8F8F]">Loading…</p></Screen>;
  if (!session) return <AuthScreen />;
  if (!gym) return <OnboardingScreen userId={session.user.id} onDone={setGym} />;
  return <MainApp gym={gym} setGym={setGym} />;
}

function Screen({ children }) {
  return <div className="min-h-screen bg-[#0A0A0A] text-[#F2F2F2] flex items-center justify-center px-4">{children}</div>;
}

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(""); setBusy(true);
    const fn = mode === "login" ? supabase.auth.signInWithPassword : supabase.auth.signUp;
    const { error } = await fn({ email, password });
    setBusy(false);
    if (error) setError(error.message);
  };

  return (
    <Screen>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-[#E10600] flex items-center justify-center"><Dumbbell size={20} color="#0A0A0A" /></div>
          <span className="text-xl font-black">GymDesk</span>
        </div>
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-3">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#E10600]" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#E10600]" />
          {error && <p className="text-[#FF3B3B] text-xs">{error}</p>}
          <button onClick={submit} disabled={busy || !email || !password}
            className="w-full bg-[#E10600] disabled:opacity-40 text-[#0A0A0A] font-bold py-2.5 rounded-lg text-sm">
            {mode === "login" ? "Log in" : "Sign up"}
          </button>
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="w-full text-xs text-[#8F8F8F] text-center">
            {mode === "login" ? "No account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </Screen>
  );
}

function OnboardingScreen({ userId, onDone }) {
  const [gymName, setGymName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [language, setLanguage] = useState("en");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!gymName.trim()) return;
    setBusy(true);
    const { data: gymRow, error } = await supabase.from("gyms").insert({
      id: userId, gym_name: gymName.trim(), owner_name: ownerName.trim(), language, trial_start: todayStr(),
    }).select().single();
    if (!error) {
      await supabase.from("plans").insert(DEFAULT_PLANS.map(p => ({ ...p, gym_id: userId })));
      onDone(gymRow);
    }
    setBusy(false);
  };

  return (
    <Screen>
      <div className="w-full max-w-sm bg-[#141414] border border-[#262626] rounded-2xl p-5">
        <h1 className="text-lg font-bold mb-4">Set up your gym</h1>
        <input placeholder="Gym name" value={gymName} onChange={e => setGymName(e.target.value)}
          className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm outline-none mb-3 focus:border-[#E10600]" />
        <input placeholder="Owner name" value={ownerName} onChange={e => setOwnerName(e.target.value)}
          className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm outline-none mb-3 focus:border-[#E10600]" />
        <div className="flex gap-2 mb-4">
          {["en", "hi"].map(l => (
            <button key={l} onClick={() => setLanguage(l)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${language === l ? "bg-[#E10600] border-[#E10600] text-[#0A0A0A]" : "border-[#2A2A2A] text-[#8F8F8F]"}`}>
              {l === "en" ? "English" : "हिंदी"}
            </button>
          ))}
        </div>
        <button onClick={submit} disabled={busy || !gymName.trim()} className="w-full bg-[#E10600] disabled:opacity-40 text-[#0A0A0A] font-bold py-2.5 rounded-lg text-sm">
          Get started
        </button>
      </div>
    </Screen>
  );
}

function MainApp({ gym, setGym }) {
  const t = T[gym.language] || T.en;
  const [tab, setTab] = useState("dashboard");
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [toast, setToast] = useState("");
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 1800); };

  const reloadAll = async () => {
    const [m, p, pay, att] = await Promise.all([
      supabase.from("members").select("*").eq("gym_id", gym.id),
      supabase.from("plans").select("*").eq("gym_id", gym.id),
      supabase.from("payments").select("*").eq("gym_id", gym.id),
      supabase.from("attendance").select("*").eq("gym_id", gym.id),
    ]);
    setMembers(m.data || []); setPlans(p.data || []); setPayments(pay.data || []); setAttendance(att.data || []);
  };

  useEffect(() => { reloadAll(); }, [gym.id]);

  const daysLeft = TRIAL_DAYS - daysBetween(todayStr(), gym.trial_start);
  const locked = gym.subscription_status !== "active" && daysLeft <= 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F2F2F2]">
      <header className="border-b border-[#1F1F1F] sticky top-0 bg-[#0A0A0A]/95 backdrop-blur z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-[#E10600] flex items-center justify-center"><Dumbbell size={16} color="#0A0A0A" /></div>
            <div className="font-black text-sm truncate">{gym.gym_name}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {gym.subscription_status !== "active" && !locked && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${daysLeft <= 2 ? "bg-[#3A1010] text-[#FF3B3B]" : "bg-[#0F2A0A] text-[#39FF14]"}`}>
                {t.trialLeft(daysLeft)}
              </span>
            )}
            <button onClick={() => supabase.auth.signOut()} className="p-1.5 rounded-lg bg-[#141414] border border-[#2A2A2A]"><LogOut size={14} /></button>
          </div>
        </div>
      </header>

      {locked ? (
        <div className="max-w-md mx-auto px-4 py-10 text-center">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
            <AlertTriangle size={28} color="#FF3B3B" className="mx-auto mb-3" />
            <h1 className="text-lg font-bold mb-1">{t.trialOverTitle}</h1>
            <p className="text-sm text-[#8F8F8F] mb-4">{t.trialOverSub}</p>
            <a href={`https://wa.me/${SELLER_WHATSAPP}?text=${encodeURIComponent("Hi, my GymDesk trial for " + gym.gym_name + " has ended, I'd like to upgrade.")}`}
              target="_blank" rel="noreferrer" className="block bg-[#39FF14] text-[#0A0A0A] font-bold py-2.5 rounded-lg text-sm">
              Message us on WhatsApp
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="border-b border-[#1F1F1F] overflow-x-auto sticky top-[57px] bg-[#0A0A0A] z-30">
            <div className="max-w-5xl mx-auto px-4 flex gap-1 min-w-max">
              {[
                { id: "dashboard", label: t.dashboard, icon: LayoutDashboard },
                { id: "members", label: t.members, icon: Users },
                { id: "addMember", label: t.addMember, icon: Plus },
                { id: "payments", label: t.payments, icon: CreditCard },
                { id: "attendance", label: t.attendance, icon: CalendarCheck },
                { id: "settings", label: t.settings, icon: SettingsIcon },
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap ${tab === id ? "border-[#E10600] text-[#F2F2F2]" : "border-transparent text-[#8F8F8F]"}`}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>
          <main className="max-w-5xl mx-auto px-4 pb-24 pt-5">
            {tab === "dashboard" && <Dashboard t={t} gym={gym} members={members} payments={payments} setTab={setTab} />}
            {tab === "members" && <MembersTab t={t} gym={gym} members={members} plans={plans} reload={reloadAll} flash={flash} />}
            {tab === "addMember" && <AddMemberTab t={t} gym={gym} plans={plans} reload={reloadAll} flash={flash} setTab={setTab} />}
            {tab === "payments" && <PaymentsTab t={t} payments={payments} />}
            {tab === "attendance" && <AttendanceTab t={t} members={members} attendance={attendance} gym={gym} reload={reloadAll} />}
            {tab === "settings" && <SettingsTab t={t} gym={gym} setGym={setGym} plans={plans} reload={reloadAll} flash={flash} />}
          </main>
        </>
      )}
      {toast && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#39FF14] text-[#0A0A0A] font-semibold text-sm px-4 py-2 rounded-full shadow-lg z-50">{toast}</div>}
    </div>
  );
}

function StatCard({ label, value, accent, icon: Icon }) {
  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 flex-1 min-w-[140px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-[#8F8F8F] uppercase">{label}</span>
        <Icon size={14} color={accent} />
      </div>
      <div className="num text-2xl font-bold" style={{ color: accent }}>{value}</div>
    </div>
  );
}

function StatusPill({ status, t }) {
  const map = {
    active: { bg: "#0F2A0A", fg: "#39FF14", label: t.statusActive },
    expiring: { bg: "#3A1010", fg: "#FF3B3B", label: t.statusExpiring },
    expired: { bg: "#3A1010", fg: "#FF3B3B", label: t.statusExpired },
  };
  const s = map[status];
  return <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: s.bg, color: s.fg }}>{s.label}</span>;
}

function Avatar({ name }) {
  return <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-[#E1060030] text-[#E10600]">{initials(name)}</div>;
}

function Dashboard({ t, gym, members, payments, setTab }) {
  const withStatus = members.map(m => ({ ...m, status: getStatus(m.expiry_date) }));
  const active = withStatus.filter(m => m.status !== "expired").length;
  const expiringSoon = withStatus.filter(m => m.status === "expiring").sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
  const now = new Date();
  const monthRevenue = payments.filter(p => { const d = new Date(p.paid_on); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((s, p) => s + Number(p.amount), 0);

  const remind = (m) => {
    const msg = t.whatsappMsg(m.name, gym.gym_name, fmtDate(m.expiry_date));
    window.open(`https://wa.me/91${(m.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <StatCard label={t.totalMembers} value={members.length} accent="#F2F2F2" icon={Users} />
        <StatCard label={t.activeMembers} value={active} accent="#39FF14" icon={Check} />
        <StatCard label={t.expiringSoon} value={expiringSoon.length} accent="#FF3B3B" icon={AlertTriangle} />
        <StatCard label={t.monthRevenue} value={`₹${monthRevenue.toLocaleString("en-IN")}`} accent="#39FF14" icon={IndianRupee} />
      </div>
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
        <h2 className="text-sm font-bold mb-3">{t.expiringMembersTitle}</h2>
        {expiringSoon.length === 0 ? <p className="text-[#8F8F8F] text-sm">{t.noExpiring}</p> : (
          <div className="space-y-2">
            {expiringSoon.map(m => (
              <div key={m.id} className="flex items-center gap-3 bg-[#0A0A0A] rounded-xl p-2.5">
                <Avatar name={m.name} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{m.name}</div>
                  <div className="text-xs text-[#8F8F8F] num">{fmtDate(m.expiry_date)}</div>
                </div>
                <button onClick={() => remind(m)} className="p-2 rounded-lg bg-[#0F2A0A] text-[#39FF14]"><MessageCircle size={15} /></button>
                <button onClick={() => setTab("members")} className="text-xs font-semibold bg-[#2A2A2A] px-2.5 py-1.5 rounded-lg">{t.renew}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberForm({ t, plans, gymId, initial, onCancel, onSaved }) {
  const [name, setName] = useState(initial?.name || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [planId, setPlanId] = useState(initial?.plan_id || plans[0]?.id || "");
  const [fee, setFee] = useState(initial?.fee ?? plans[0]?.fee ?? "");
  const [joinDate, setJoinDate] = useState(initial?.join_date || todayStr());
  const [expiryDate, setExpiryDate] = useState(initial?.expiry_date || addDays(tod
