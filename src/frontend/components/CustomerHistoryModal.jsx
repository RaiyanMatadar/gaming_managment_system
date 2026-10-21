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
import { Card, Button, Badge } from './ui';

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

      const qs = params.toString() ? `?${params.toString()}` : '';
      let res = await fetch(`/api/sessions/history${qs}`);
      if (!res.ok) {
        res = await fetch(`/api/customers/history${qs}`);
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
      <Card variant="container" className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="font-semibold text-on-surface">Monthly Retention Policy:</span>
          <span className="text-on-surface-variant">
            Only sessions within the active 30-day (1-month) window are preserved. Out-of-month records are automatically pruned.
          </span>
        </div>
        <Badge variant="primary" size="pill">
          Auto-Purge 30d Active
        </Badge>
      </Card>

      {/* Top Analytics Summary Cards */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card variant="container" className="p-4">
            <span className="text-xs font-semibold text-on-surface-variant block">Unique Customers</span>
            <span className="text-2xl font-black text-on-surface mt-1 block">{analytics.uniqueCustomers}</span>
            <span className="text-[11px] text-on-surface-variant font-medium">Distinct Players</span>
          </Card>

          <Card variant="container" className="p-4">
            <span className="text-xs font-semibold text-primary block">Total Sessions</span>
            <span className="text-2xl font-black text-primary mt-1 block">{analytics.totalSessions}</span>
            <span className="text-[11px] text-on-surface-variant font-medium">Recorded Visits</span>
          </Card>

          <Card variant="container" className="p-4">
            <span className="text-xs font-semibold text-emerald-400 block">Hours Logged</span>
            <span className="text-2xl font-black text-emerald-300 mt-1 block">{analytics.totalHoursLogged} hrs</span>
            <span className="text-[11px] text-on-surface-variant font-medium">Station Time</span>
          </Card>

          <Card variant="container" className="p-4">
            <span className="text-xs font-semibold text-on-surface-variant block">Total Revenue</span>
            <span className="text-2xl font-black text-on-surface mt-1 block">₹{analytics.totalSpend}</span>
            <span className="text-[11px] text-on-surface-variant font-medium">30-Day Period</span>
          </Card>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant/60 rounded-xl pl-9 pr-4 py-2 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
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
                  ? 'bg-primary-container text-on-primary-container border-primary/40'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant/60 hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={fetchHistory}
            title="Refresh Records"
            className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all border border-outline-variant/60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content Body */}
      {loading && (
        <Card variant="container" className="text-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-on-surface-variant">Loading customer history records...</p>
        </Card>
      )}

      {error && !loading && (
        <div className="p-6 rounded-2xl bg-error-container/40 border border-error/40 text-center my-4 space-y-3">
          <AlertCircle className="w-8 h-8 text-error mx-auto" />
          <div>
            <p className="text-sm font-bold text-on-error-container">Unable to load customer history</p>
            <p className="text-xs text-on-error-container/80 mt-1">{error}</p>
          </div>
          <Button
            variant="filled"
            size="sm"
            onClick={fetchHistory}
          >
            Retry Request
          </Button>
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <Card variant="container" className="text-center py-16">
          <Users className="w-10 h-10 text-outline mx-auto mb-2" />
          <p className="text-sm font-semibold text-on-surface">No customer history records found</p>
          <p className="text-xs text-on-surface-variant mt-1">
            {searchTerm ? 'Try adjusting your search criteria.' : 'Sessions completed this month will appear here.'}
          </p>
        </Card>
      )}

      {!loading && !error && sessions.length > 0 && (
        <Card variant="container" className="overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-lowest text-on-surface-variant border-b border-outline-variant/40">
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
            <tbody className="divide-y divide-outline-variant/30 text-on-surface-variant">
              {sessions.map((s) => {
                const elapsed = s.financials?.elapsedMinutes ?? s.bookedMinutes;
                const payable = s.financials?.totalPayable ?? 0;
                const payStatus = s.financials?.paymentStatus || 'UNPAID';

                let payBadgeStyle = 'bg-surface-container-high text-on-surface-variant border-outline-variant';
                if (payStatus === 'PAID') payBadgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold';
                else if (payStatus === 'PARTIALLY_PAID') payBadgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                else if (payStatus === 'UNPAID') payBadgeStyle = 'bg-error-container text-on-error-container border-error/30';

                let sessBadgeStyle = 'bg-surface-container-high text-on-surface-variant border-outline-variant';
                if (s.status === 'COMPLETED') sessBadgeStyle = 'bg-primary-container text-on-primary-container border-primary/30 font-medium';
                else if (s.status === 'ACTIVE') sessBadgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse';
                else if (s.status === 'CANCELLED') sessBadgeStyle = 'bg-error-container text-on-error-container border-error/30';

                return (
                  <tr key={s._id} className="hover:bg-surface-container-high transition-colors">
                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-on-surface flex items-center gap-1.5">
                        {s.customerName || 'Guest'}
                      </div>
                      {s.customerPhone && (
                        <span className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-outline" />
                          {s.customerPhone}
                        </span>
                      )}
                    </td>

                    {/* Station */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-on-surface">{s.stationName || 'Station'}</span>
                      <span className="block text-[10px] text-on-surface-variant">
                        {s.rateCardSnapshot?.hourlyRate ? `₹${s.rateCardSnapshot.hourlyRate}/hr` : ''}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-on-surface-variant font-mono text-[11px]">
                      {formatDateTime(s.startTime || s.createdAt)}
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-on-surface">{formatMinutes(elapsed)}</span>
                      <span className="block text-[10px] text-on-surface-variant">Booked: {s.bookedMinutes}m</span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-emerald-400 text-sm">₹{payable}</span>
                      {s.financials?.overtimeAmount > 0 && (
                        <span className="block text-[10px] text-error">
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
        </Card>
      )}
    </div>
  );
}

export function CustomerHistoryModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card variant="container" className="rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        <div className="p-6 border-b border-outline-variant/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-container text-primary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                Customer History & Session Ledger
              </h2>
              <p className="text-xs text-on-surface-variant">
                Detailed customer records, historical sessions, and monthly auto-purged ledger
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-2 rounded-xl hover:bg-surface-container-high transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <CustomerLedgerView embedded={false} />
        </div>
      </Card>
    </div>
  );
}
