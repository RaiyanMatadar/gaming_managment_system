import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ShieldCheck,
  Search,
  RefreshCw,
  Play,
  Pause,
  PlusCircle,
  ArrowRightLeft,
  CreditCard,
  AlertTriangle,
  Clock,
  User,
  Monitor
} from 'lucide-react';

function getActionBadge(action) {
  switch (action) {
    case 'START_SESSION':
      return {
        label: 'Session Started',
        style: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        icon: <Play className="w-3.5 h-3.5 fill-current" />
      };
    case 'PAUSE_SESSION':
      return {
        label: 'Session Paused',
        style: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        icon: <Pause className="w-3.5 h-3.5" />
      };
    case 'RESUME_SESSION':
      return {
        label: 'Session Resumed',
        style: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        icon: <Play className="w-3.5 h-3.5 fill-current" />
      };
    case 'EXTEND_SESSION':
      return {
        label: 'Session Extended',
        style: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        icon: <PlusCircle className="w-3.5 h-3.5" />
      };
    case 'TRANSFER_STATION':
      return {
        label: 'Station Transferred',
        style: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        icon: <ArrowRightLeft className="w-3.5 h-3.5" />
      };
    case 'CHECKOUT_SESSION':
    case 'RECORD_PAYMENT':
      return {
        label: 'Checkout / Paid',
        style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold',
        icon: <CreditCard className="w-3.5 h-3.5" />
      };
    case 'CANCEL_SESSION':
      return {
        label: 'Session Cancelled',
        style: 'bg-red-500/20 text-red-300 border-red-500/40 font-bold',
        icon: <AlertTriangle className="w-3.5 h-3.5" />
      };
    default:
      return {
        label: action.replace('_', ' '),
        style: 'bg-slate-800 text-slate-300 border-slate-700',
        icon: <Clock className="w-3.5 h-3.5" />
      };
  }
}

export function AuditTrailView({ embedded = true }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (actionFilter !== 'ALL') params.set('action', actionFilter);
      params.set('limit', '100');

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatLogDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  };

  const renderDetailText = (log) => {
    if (log.action === 'EXTEND_SESSION' && log.metadata) {
      return `+${log.metadata.addedMinutes}m extended (Fee: ₹${log.metadata.extensionFee || 0})`;
    }
    if (log.action === 'CHECKOUT_SESSION' && log.metadata?.financials) {
      const fin = log.metadata.financials;
      return `Total: ₹${fin.totalPayable} (${fin.paymentStatus})${fin.overtimeAmount > 0 ? ` • incl. ₹${fin.overtimeAmount} OT` : ''}`;
    }
    if (log.action === 'RECORD_PAYMENT' && log.metadata) {
      return `Collected ₹${log.metadata.amount} via ${log.metadata.method}`;
    }
    if (log.reason) {
      return log.reason;
    }
    if (log.metadata && Object.keys(log.metadata).length > 0) {
      return JSON.stringify(log.metadata);
    }
    return 'Operation recorded';
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, customer, PC, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Action Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Actions' },
            { id: 'START_SESSION', label: 'Started' },
            { id: 'CHECKOUT_SESSION', label: 'Checkout' },
            { id: 'EXTEND_SESSION', label: 'Extended' },
            { id: 'TRANSFER_STATION', label: 'Transferred' },
            { id: 'PAUSE_SESSION', label: 'Paused' },
            { id: 'CANCEL_SESSION', label: 'Cancelled' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActionFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                actionFilter === tab.id
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={fetchLogs}
            title="Refresh"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Logs View */}
      {loading && (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading audit trail records...</p>
        </div>
      )}

      {!loading && logs.length === 0 && (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
          <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No matching audit logs found</p>
          <p className="text-xs text-slate-500 mt-1">Actions performed by staff are tracked here automatically.</p>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="space-y-2.5">
          {logs.map((log) => {
            const badge = getActionBadge(log.action);
            const { date, time } = formatLogDate(log.timestamp || log.createdAt);
            const customer = log.customerName || log.after?.customerName || log.before?.customerName || 'Guest';
            const station = log.stationName || log.after?.stationName || (log.targetType === 'STATION' ? log.targetId : 'PC');

            return (
              <div
                key={log._id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
              >
                {/* Left: Action, Customer, Station */}
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center flex-shrink-0 text-slate-300">
                    <Monitor className="w-5 h-5 text-blue-400" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] border font-bold flex items-center gap-1.5 ${badge.style}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>

                      <span className="text-sm font-bold text-white flex items-center gap-1">
                        {station}
                      </span>

                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        • <User className="w-3 h-3 text-slate-500" />
                        <span className="text-slate-300 font-medium">{customer}</span>
                      </span>
                    </div>

                    {/* Details / Reason */}
                    <p className="text-xs text-slate-400 mt-1.5">
                      <span className="text-slate-300 font-medium">{renderDetailText(log)}</span>
                    </p>
                  </div>
                </div>

                {/* Right: Date, Time & Staff Actor */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/80 text-right flex-shrink-0">
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{time}</span>
                    <span className="text-slate-600">|</span>
                    <span>{date}</span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                    by <span className="text-slate-400 font-semibold">{log.actorId || 'Staff'}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AuditTrailModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Operational Audit Trail & Activity Log
              </h2>
              <p className="text-xs text-slate-400">
                Authoritative staff log tracking session starts, extensions, payments, and cancellations
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

        <div className="p-6 flex-1 overflow-y-auto flex flex-col">
          <AuditTrailView embedded={false} />
        </div>
      </div>
    </div>
  );
}
