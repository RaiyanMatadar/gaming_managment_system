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
import { Card, Badge, Button } from './ui';

function getActionBadge(action) {
  switch (action) {
    case 'START_SESSION':
      return {
        label: 'Started Session',
        style: 'bg-success-container text-on-success-container border border-success/30',
        icon: <Play className="w-3.5 h-3.5 fill-current" />
      };
    case 'PAUSE_SESSION':
      return {
        label: 'Paused Session',
        style: 'bg-tertiary-container text-tertiary border-tertiary/30',
        icon: <Pause className="w-3.5 h-3.5" />
      };
    case 'RESUME_SESSION':
      return {
        label: 'Resumed Session',
        style: 'bg-primary-container text-primary border-primary/30',
        icon: <Play className="w-3.5 h-3.5 fill-current" />
      };
    case 'EXTEND_SESSION':
      return {
        label: 'Added Time',
        style: 'bg-primary-container/40 text-primary border-primary/40',
        icon: <PlusCircle className="w-3.5 h-3.5" />
      };
    case 'TRANSFER_STATION':
      return {
        label: 'Moved Computer',
        style: 'bg-secondary-container/50 text-on-secondary-container border-secondary/30',
        icon: <ArrowRightLeft className="w-3.5 h-3.5" />
      };
    case 'CHECKOUT_SESSION':
    case 'RECORD_PAYMENT':
      return {
        label: 'Checked Out & Paid',
        style: 'bg-success-container text-on-success-container border border-success/30 font-bold',
        icon: <CreditCard className="w-3.5 h-3.5" />
      };
    case 'CANCEL_SESSION':
      return {
        label: 'Cancelled Session',
        style: 'bg-error-container text-on-error-container border-error/40 font-bold',
        icon: <AlertTriangle className="w-3.5 h-3.5" />
      };
    default:
      return {
        label: action.replace('_', ' '),
        style: 'bg-surface-container-high text-on-surface-variant border-outline-variant',
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
      return `+${log.metadata.addedMinutes}m added (Fee: ₹${log.metadata.extensionFee || 0})`;
    }
    if (log.action === 'CHECKOUT_SESSION' && log.metadata?.financials) {
      const fin = log.metadata.financials;
      return `Total: ₹${fin.totalPayable} (${fin.paymentStatus})${fin.overtimeAmount > 0 ? ` • incl. ₹${fin.overtimeAmount} extra` : ''}`;
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
    return 'Action recorded';
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, customer, PC, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant/60 rounded-xl pl-9 pr-4 py-2 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
          />
        </div>

        {/* Action Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Actions' },
            { id: 'START_SESSION', label: 'Starts' },
            { id: 'CHECKOUT_SESSION', label: 'Checkouts' },
            { id: 'EXTEND_SESSION', label: 'Added Time' },
            { id: 'TRANSFER_STATION', label: 'Moves' },
            { id: 'PAUSE_SESSION', label: 'Pauses' },
            { id: 'CANCEL_SESSION', label: 'Cancellations' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActionFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                actionFilter === tab.id
                  ? 'bg-primary-container text-on-primary-container border-primary/40'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant/60 hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={fetchLogs}
            title="Refresh"
            className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Logs View */}
      {loading && (
        <Card variant="container" className="text-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-on-surface-variant">Loading activity log...</p>
        </Card>
      )}

      {!loading && logs.length === 0 && (
        <Card variant="container" className="text-center py-16">
          <ShieldCheck className="w-10 h-10 text-outline mx-auto mb-2" />
          <p className="text-sm font-semibold text-on-surface">No activity logs found</p>
          <p className="text-xs text-on-surface-variant mt-1">Actions performed by staff are automatically tracked here.</p>
        </Card>
      )}

      {!loading && logs.length > 0 && (
        <div className="space-y-2.5">
          {logs.map((log) => {
            const badge = getActionBadge(log.action);
            const { date, time } = formatLogDate(log.timestamp || log.createdAt);
            const customer = log.customerName || log.after?.customerName || log.before?.customerName || 'Guest';
            const station = log.stationName || log.after?.stationName || (log.targetType === 'STATION' ? log.targetId : 'PC');

            return (
              <Card
                key={log._id}
                variant="container"
                className="hover:border-outline rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
              >
                {/* Left: Action, Customer, Station */}
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-lowest border border-outline-variant/50 flex items-center justify-center flex-shrink-0 text-on-surface-variant">
                    <Monitor className="w-5 h-5 text-primary" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] border font-bold flex items-center gap-1.5 ${badge.style}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>

                      <span className="text-sm font-bold text-on-surface flex items-center gap-1">
                        {station}
                      </span>

                      <span className="text-xs text-on-surface-variant flex items-center gap-1">
                        • <User className="w-3 h-3 text-outline" />
                        <span className="text-on-surface font-medium">{customer}</span>
                      </span>
                    </div>

                    {/* Details / Reason */}
                    <p className="text-xs text-on-surface-variant mt-1.5">
                      <span className="text-on-surface font-medium">{renderDetailText(log)}</span>
                    </p>
                  </div>
                </div>

                {/* Right: Date, Time & Staff Actor */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-outline-variant/30 text-right flex-shrink-0">
                  <div className="text-[11px] font-mono text-on-surface-variant flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-outline" />
                    <span>{time}</span>
                    <span className="text-outline">|</span>
                    <span>{date}</span>
                  </div>

                  <span className="text-[10px] text-on-surface-variant font-medium mt-0.5">
                    by <span className="text-on-surface font-semibold">{log.actorId || 'Staff'}</span>
                  </span>
                </div>
              </Card>
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
      <Card variant="container" className="rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        <div className="p-6 border-b border-outline-variant/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-container text-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                Staff Activity Log
              </h2>
              <p className="text-xs text-on-surface-variant">
                History of staff actions: session starts, extensions, payments, and cancellations
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

        <div className="p-6 flex-1 overflow-y-auto flex flex-col">
          <AuditTrailView embedded={false} />
        </div>
      </Card>
    </div>
  );
}
