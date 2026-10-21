import React, { useState, useEffect } from 'react';
import { AuditTrailView } from './AuditTrailModal.jsx';
import {
  X,
  FileText,
  DollarSign,
  Smartphone,
  Banknote,
  Clock,
  Printer,
  ShieldAlert,
  BarChart3,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Card, Button } from './ui';

export function ShiftReportView({ embedded = true }) {
  const [activeTab, setActiveTab] = useState('FINANCIAL');
  const [report, setReport] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [repRes, auditRes] = await Promise.all([
        fetch('/api/reports/shift'),
        fetch('/api/audit?limit=50')
      ]);

      const repJson = await repRes.json();
      const auditJson = await auditRes.json();

      if (repJson.success) setReport(repJson.data);
      if (auditJson.success) setAuditLogs(auditJson.data);
    } catch (err) {
      console.error('Failed to load shift report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Row in View */}
      <Card variant="container" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl">
        <div>
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Shift Reconciliation & Register Closing
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Cash in drawer, UPI settlements, overtime surcharges & gaming station usage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReportData}
            title="Refresh Ledger"
            className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all border border-outline-variant/60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Button
            variant="outlined"
            size="md"
            onClick={handlePrint}
          >
            <Printer className="w-3.5 h-3.5 text-primary" />
            <span>Print Register Closing</span>
          </Button>
        </div>
      </Card>

      {/* Tab Switcher */}
      <div className="border-b border-outline-variant/40 flex gap-4">
        <button
          onClick={() => setActiveTab('FINANCIAL')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'FINANCIAL'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Financials & Hours</span>
        </button>
        <button
          onClick={() => setActiveTab('STATIONS')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'STATIONS'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Station Utilization</span>
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'AUDIT'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Shift Activity ({auditLogs.length})</span>
        </button>
      </div>

      {/* Body Content */}
      {loading && (
        <Card variant="container" className="text-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-on-surface-variant">Loading shift reconciliation...</p>
        </Card>
      )}

      {!loading && report && activeTab === 'FINANCIAL' && (
        <div className="space-y-6">
          {/* Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Revenue */}
            <Card variant="container" className="p-4">
              <span className="text-xs font-semibold text-on-surface-variant">Total Shift Revenue</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">₹{report.financialSummary.totalRevenue}</p>
              <span className="text-[11px] text-on-surface-variant font-medium">All settled payments</span>
            </Card>

            {/* Cash in Drawer */}
            <Card variant="container" className="p-4 border-emerald-500/30">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-xs font-semibold">Cash in Drawer</span>
                <Banknote className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-on-surface mt-1">₹{report.financialSummary.cashTotal}</p>
              <span className="text-[11px] text-emerald-400/80 font-medium">Physical cash collected</span>
            </Card>

            {/* UPI Settlements */}
            <Card variant="container" className="p-4 border-primary/30">
              <div className="flex items-center justify-between text-primary">
                <span className="text-xs font-semibold">UPI Settlements</span>
                <Smartphone className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-on-surface mt-1">₹{report.financialSummary.upiTotal}</p>
              <span className="text-[11px] text-primary/80 font-medium">QR / GPay transactions</span>
            </Card>

            {/* Overtime Revenue */}
            <Card variant="container" className="p-4 border-error/30">
              <div className="flex items-center justify-between text-error">
                <span className="text-xs font-semibold">Overtime Surcharges</span>
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-on-surface mt-1">₹{report.financialSummary.overtimeRevenue}</p>
              <span className="text-[11px] text-error/80 font-medium">Captured beyond package</span>
            </Card>
          </div>

          {/* Gaming Hours & Session Metrics */}
          <Card variant="container" className="p-5">
            <h4 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Gaming Hours & Session Breakdown
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-on-surface-variant block font-medium">Gaming Hours Sold:</span>
                <span className="text-lg font-bold text-on-surface mt-0.5 block">{report.gamingMetrics.hoursSold} hrs</span>
              </div>
              <div>
                <span className="text-on-surface-variant block font-medium">Actual Hours Played:</span>
                <span className="text-lg font-bold text-emerald-400 mt-0.5 block">{report.gamingMetrics.hoursConsumed} hrs</span>
              </div>
              <div>
                <span className="text-on-surface-variant block font-medium">Completed Sessions:</span>
                <span className="text-lg font-bold text-on-surface mt-0.5 block">{report.gamingMetrics.completedSessions}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block font-medium">Cancelled / Voided:</span>
                <span className="text-lg font-bold text-amber-400 mt-0.5 block">{report.gamingMetrics.cancelledSessions}</span>
              </div>
            </div>
          </Card>

          {/* Outstanding Balance Banner */}
          {report.financialSummary.outstandingBalance > 0 && (
            <div className="bg-amber-950/20 border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Unsettled / Outstanding Customer Balance Due:</span>
              </div>
              <span className="text-base font-bold text-amber-400">₹{report.financialSummary.outstandingBalance}</span>
            </div>
          )}
        </div>
      )}

      {!loading && report && activeTab === 'STATIONS' && (
        <Card variant="container" className="overflow-hidden shadow-inner">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-lowest text-on-surface-variant border-b border-outline-variant/40">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Station</th>
                <th className="py-3.5 px-4 font-semibold">Hardware Type</th>
                <th className="py-3.5 px-4 font-semibold text-center">Hourly Rate</th>
                <th className="py-3.5 px-4 font-semibold text-center">Sessions Logged</th>
                <th className="py-3.5 px-4 font-semibold text-center">Hours Consumed</th>
                <th className="py-3.5 px-4 font-semibold text-right">Station Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 text-on-surface-variant">
              {report.stationBreakdown.map((st) => (
                <tr key={st.stationId} className="hover:bg-surface-container-high transition-colors">
                  <td className="py-3.5 px-4 font-bold text-on-surface">{st.stationName}</td>
                  <td className="py-3.5 px-4 text-on-surface-variant">{st.stationType.replace('_', ' ')}</td>
                  <td className="py-3.5 px-4 text-center">₹{st.hourlyRate}/hr</td>
                  <td className="py-3.5 px-4 text-center font-bold text-primary">{st.sessionCount}</td>
                  <td className="py-3.5 px-4 text-center">{st.gamingHours} hrs</td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-400 text-sm">₹{st.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {!loading && activeTab === 'AUDIT' && (
        <div className="pt-1">
          <AuditTrailView embedded={true} />
        </div>
      )}
    </div>
  );
}

export function ShiftReportModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card variant="container" className="rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        <div className="p-6 border-b border-outline-variant/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-container text-primary flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                Shift Reconciliation & Register Closing
              </h2>
              <p className="text-xs text-on-surface-variant">
                Daily Ledger • Cash vs UPI • Gaming Hours • Station Utilization
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
          <ShiftReportView embedded={false} />
        </div>
      </Card>
    </div>
  );
}
