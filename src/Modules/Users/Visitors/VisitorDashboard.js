import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { API, getData } from "../../../Helpers/api";
import { Users, Clock, CheckCircle, XCircle, Check, X, Calendar, User, MessageSquare, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { useUser } from "../../../Helpers/Context/UserContext";
import { toast } from "react-toastify";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const VisitorDashboard = () => {
  const { user } = useUser();
  const [stats, setStats] = useState({ dailyVisits: [], reasonStats: [], statusStats: [], totalVisits: 0 });
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [rescheduleData, setRescheduleData] = useState({ id: null, date: "", time: "", reason: "" });
  const [showModal, setShowModal] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const role = user?.role?.toLowerCase();
      const isAdmin = ["superadmin", "admin", "hr"].includes(role);

      const [statsRes, reqRes] = await Promise.all([
        getData("/visitorlogs/stats"),
        getData("/visitorlogs", {
          status: "Pending",
          ...(isAdmin ? {} : { employeeId: user?.employeeId || user?.employee_id })
        })
      ]);

      if (statsRes.status) setStats(statsRes.data);
      if (reqRes.status) setRequests(reqRes.data);
    } catch (error) {
      console.error("Dashboard data fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleAction = async (requestId, action, date = null, time = "", reason = "") => {
    try {
      const res = await API.visitorlog.updateStatus(requestId, {
        status: action,
        rescheduleDate: date,
        rescheduleTime: time,
        rescheduleReason: reason
      });
      if (res.status) {
        toast.success(res.message || `Request ${action.toLowerCase()}ed`);
        setRequests(requests.filter(r => (r.id || r._id) !== requestId));
        setShowModal(false);
        // Refresh stats
        const statsRes = await getData("/visitorlogs/stats");
        if (statsRes.status) setStats(statsRes.data);
      }
    } catch (error) {
      toast.error("Action failed");
    }
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = requests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(requests.length / itemsPerPage);

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">Initializing Command Center...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Visitor Command Center</h1>
          <p className="text-gray-500 mt-2 uppercase text-xs font-bold tracking-[0.3em] leading-none text-highlight">
            Real-time analytics & authorization portal
          </p>
        </div>
        {/* <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
            <div className="px-5 py-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100 text-xs font-black text-white uppercase tracking-widest">
              Admin Overview
            </div>
        </div> */}
      </div>

      {/* 📊 ANALYTICS SECTION (NOW ON TOP) */}
      <div className="space-y-8 animate-in fade-in duration-700">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Total Visits", value: stats.totalVisits || 0, icon: Users, color: "bg-blue-50" },
            { label: "Pending", value: requests.length, icon: Clock, color: "bg-amber-50" },
            { label: "Approved", value: stats.statusStats?.find(s => s._id === "Approved")?.count || 0, icon: CheckCircle, color: "bg-emerald-50" },
            { label: "Declined", value: stats.statusStats?.find(s => s._id === "Declined")?.count || 0, icon: XCircle, color: "bg-rose-50" },
            { label: "Check-ins", value: stats.dailyVisits?.find(d => d._id === new Date().toISOString().split('T')[0])?.count || 0, icon: Clock, color: "bg-indigo-50" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center group hover:border-indigo-200 transition-all">
              <div className={`${stat.color} p-4 rounded-2xl mr-4 group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} className="text-gray-900" />
              </div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Visits Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tight">Visit Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyVisits}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "bold" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "bold" }} />
                  <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Reason Distribution */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tight">Purpose Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.reasonStats} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="count" nameKey="_id">
                    {stats.reasonStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ⚠️ REQUESTS SECTION (NOW BELOW ANALYTICS) */}
      <div className="mt-16 mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-3 h-10 bg-indigo-600 rounded-full" />
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none">Security Clearances</h2>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Personnel requiring entry authorization</p>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-gray-50 rounded-xl disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                Page {currentPage} <span className="text-gray-300">/</span> {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-gray-50 rounded-xl disabled:opacity-30 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {requests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentRequests.map((req) => (
              <div key={req.id || req._id} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/30 flex flex-col hover:border-indigo-200 transition-all group relative overflow-hidden">
                <div className=" absolute top-0 right-0 w-40 h-40 bg-indigo-50/30 rounded-full -mr-20 -mt-20" />

                <div className="flex items-start mb-6 relative z-10">
                    <div className="h-20 w-20 rounded-3xl bg-gray-100 overflow-hidden mr-5 ring-4 ring-white shadow-lg">
                      <img src={req.visitorImage || "/visitor_placeholder.png"} alt="" className="h-full w-full object-cover" />
                    </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 leading-tight mb-1">{req.visitorName}</h3>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck size={12} /> ID: {req.visitorId || "Pending"}</span>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><User size={12} /> Host: {req.employeeName}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Clock size={12} /> Slot: {req.timeSlot || "Anytime"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-3xl p-5 mb-8 relative z-10 border border-slate-100/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><MessageSquare size={12} /> Stated Purpose</p>
                  <p className="text-xs font-bold text-slate-600 italic">"{req.remark || "Regular business visit requested."}"</p>
                </div>

                <div className="grid grid-cols-2 gap-3 relative z-10 mt-auto">
                  <div className="grid grid-cols-2 gap-3 col-span-2">
                    <button onClick={() => handleAction(req.id, "Approved")} className="bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                      <Check size={18} /> Accept
                    </button>
                    <button onClick={() => handleAction(req.id, "Declined")} className="bg-rose-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-600 transition-all shadow-lg shadow-rose-100">
                      <X size={18} /> Decline
                    </button>
                  </div>
                  <button onClick={() => { setRescheduleData({ id: req.id || req._id, date: new Date().toISOString().split('T')[0], time: req.timeSlot || "09:00 - 10:00", reason: "" }); setShowModal(true); }} className="col-span-2 bg-gray-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-gray-200">
                    <Calendar size={18} /> Reschedule for Later
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Clock size={40} />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase">Clear Record</h3>
            <p className="text-gray-400 font-medium mt-2">All visitor requests have been processed.</p>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-10">
              <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                  <Calendar size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Reschedule Visit</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Adjust Authorization Timing</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">New Date</label>
                    <input type="date" className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-gray-700 text-sm" value={rescheduleData.date} onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Time Slot</label>
                    <select className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-gray-700 text-sm" value={rescheduleData.time} onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}>
                      {["09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "12:00 - 13:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00"].map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Reason</label>
                  <textarea rows="3" className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-gray-700 resize-none text-sm" placeholder="Reason for delay..." value={rescheduleData.reason} onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-10">
                <button onClick={() => setShowModal(false)} className="py-5 bg-gray-100 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-200 transition-all">Cancel</button>
                <button onClick={() => handleAction(rescheduleData.id, "Rescheduled", new Date(rescheduleData.date), rescheduleData.time, rescheduleData.reason)} disabled={!rescheduleData.date || !rescheduleData.reason} className="py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-100 transition-all disabled:opacity-50">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorDashboard;
