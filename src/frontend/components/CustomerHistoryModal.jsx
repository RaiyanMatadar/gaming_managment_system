import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Users,
  Search,
  Clock,
  Phone,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export function CustomerLedgerView({ embedded = true }) {
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      let res = await fetch(`/api/sessions/history?${params.toString()}`);
      if (!res.ok) {
        res = await fetch(`/api/customers/history?${params.toString()}`);
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success) {
        setSessions(json.data || []);
        setAnalytics(json.analytics || null);
        setError(null);
      } else {
        throw new Error(json.error || 'Failed to retrieve records');
      }
    } catch (err) {
      console.error('Customer history fetch error:', err);
      setError(err.message || 'Unable to load customer history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMinutes = (mins) => {
    if (!mins && mins !== 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  return (
    <div className="space-y-4">
      {/* 30-Day Monthly Retention Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="font-semibold text-white">Monthly Retention Policy:</span>
          <span className="text-slate-400">
            Only sessions within the active 30-day (1-month) window are preserved. Out-of-month records are automatically pruned.
          </span>
        </div>
        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold whitespace-nowrap">
          Auto-Purge 30d Active
        </span>
      </div>

      {/* Top Analytics Summary Cards */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <span className="text-xs font-semibold text-slate-400 block">Unique Customers</span>
            <span className="text-2xl font-black text-white mt-1 block">{analytics.uniqueCustomers}</span>
            <span className="text-[11px] text-slate-500 font-medium">Distinct Players</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <span className="text-xs font-semibold text-blue-400 block">Total Sessions</span>
            <span className="text-2xl font-black text-blue-300 mt-1 block">{analytics.totalSessions}</span>
            <span className="text-[11px] text-slate-500 font-medium">Recorded Visits</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <span className="text-xs font-semibold text-emerald-400 block">Hours Logged</span>
            <span className="text-2xl font-black text-emerald-300 mt-1 block">{analytics.totalHoursLogged} hrs</span>
            <span className="text-[11px] text-slate-500 font-medium">Station Time</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <span className="text-xs font-semibold text-slate-400 block">Total Revenue</span>
            <span className="text-2xl font-black text-white mt-1 block">₹{analytics.totalSpend}</span>
            <span className="text-[11px] text-slate-500 font-medium">30-Day Period</span>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Sessions' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'ACTIVE', label: 'In-Play' },
            { id: 'CANCELLED', label: 'Cancelled' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={fetchHistory}
            title="Refresh Records"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content Body */}
      {loading && (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading customer history records...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-6 rounded-2xl bg-red-950/30 border border-red-900/60 text-center my-4 space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <div>
            <p className="text-sm font-bold text-red-200">Unable to load customer history</p>
            <p className="text-xs text-red-400 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchHistory}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md"
          >
            Retry Request
          </button>
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No customer history records found</p>
          <p className="text-xs text-slate-500 mt-1">
            {searchTerm ? 'Try adjusting your search criteria.' : 'Sessions completed this month will appear here.'}
          </p>
        </div>
      )}

      {!loading && !error && sessions.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Station / PC</th>
                <th className="py-3.5 px-4 font-semibold">Session Date</th>
                <th className="py-3.5 px-4 font-semibold text-center">Playing Duration</th>
                <th className="py-3.5 px-4 font-semibold text-right">Amount Charged</th>
                <th className="py-3.5 px-4 font-semibold text-center">Payment Status</th>
                <th className="py-3.5 px-4 font-semibold text-center">Session Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {sessions.map((s) => {
                const elapsed = s.financials?.elapsedMinutes ?? s.bookedMinutes;
                const payable = s.financials?.totalPayable ?? 0;
                const payStatus = s.financials?.paymentStatus || 'UNPAID';

                let payBadgeStyle = 'bg-slate-800 text-slate-400 border-slate-700';
                if (payStatus === 'PAID') payBadgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold';
                else if (payStatus === 'PARTIALLY_PAID') payBadgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                else if (payStatus === 'UNPAID') payBadgeStyle = 'bg-red-500/10 text-red-400 border-red-500/30';

                let sessBadgeStyle = 'bg-slate-800 text-slate-400 border-slate-700';
                if (s.status === 'COMPLETED') sessBadgeStyle = 'bg-blue-500/10 text-blue-400 border-blue-500/30 font-medium';
                else if (s.status === 'ACTIVE') sessBadgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse';
                else if (s.status === 'CANCELLED') sessBadgeStyle = 'bg-red-500/10 text-red-400 border-red-500/30';

                return (
                  <tr key={s._id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        {s.customerName || 'Guest'}
                      </div>
                      {s.customerPhone && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {s.customerPhone}
                        </span>
                      )}
                    </td>

                    {/* Station */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-white">{s.stationName || 'Station'}</span>
                      <span className="block text-[10px] text-slate-400">
                        {s.rateCardSnapshot?.hourlyRate ? `₹${s.rateCardSnapshot.hourlyRate}/hr` : ''}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                      {formatDateTime(s.startTime || s.createdAt)}
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-white">{formatMinutes(elapsed)}</span>
                      <span className="block text-[10px] text-slate-400">Booked: {s.bookedMinutes}m</span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-emerald-400 text-sm">₹{payable}</span>
                      {s.financials?.overtimeAmount > 0 && (
                        <span className="block text-[10px] text-red-400">
                          incl. ₹{s.financials.overtimeAmount} OT
                        </span>
                      )}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${payBadgeStyle}`}>
                        {payStatus.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Session Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] border ${sessBadgeStyle}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function CustomerHistoryModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Customer History & Session Ledger
              </h2>
              <p className="text-xs text-slate-400">
                Detailed customer records, historical sessions, and monthly auto-purged ledger
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <CustomerLedgerView embedded={false} />
        </div>
      </div>
    </div>
  );
}
