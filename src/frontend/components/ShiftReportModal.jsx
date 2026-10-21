import React, { useState, useEffect } from 'react';
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
  Calendar,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export function ShiftReportModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('FINANCIAL');
  const [report, setReport] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReportData() {
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
    }

    fetchReportData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Shift Reconciliation & Register Closing
              </h2>
              <p className="text-xs text-slate-400">
                Daily Ledger • Cash vs UPI • Gaming Hours • Audit Trail
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Print Summary</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 border-b border-slate-800 flex gap-4 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('FINANCIAL')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'FINANCIAL'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Financials & Hours</span>
          </button>
          <button
            onClick={() => setActiveTab('STATIONS')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'STATIONS'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Station Utilization</span>
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'AUDIT'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading && (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400">Loading shift reconciliation...</p>
            </div>
          )}

          {!loading && report && activeTab === 'FINANCIAL' && (
            <div className="space-y-6">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Total Revenue */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <p className="text-xs font-medium text-slate-400">Total Shift Revenue</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">₹{report.financialSummary.totalRevenue}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">All settled payments</p>
                </div>

                {/* Cash in Drawer */}
                <div className="bg-slate-950 border border-emerald-900/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-emerald-400">Cash in Drawer</p>
                    <Banknote className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-1">₹{report.financialSummary.cashTotal}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Physical cash collected</p>
                </div>

                {/* UPI Settlements */}
                <div className="bg-slate-950 border border-blue-900/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-blue-400">UPI Settlements</p>
                    <Smartphone className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-1">₹{report.financialSummary.upiTotal}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">QR / GPay transactions</p>
                </div>

                {/* Overtime Revenue */}
                <div className="bg-slate-950 border border-red-900/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-red-400">Overtime Surcharges</p>
                    <Clock className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-1">₹{report.financialSummary.overtimeRevenue}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Captured beyond package</p>
                </div>
              </div>

              {/* Gaming Hours & Session Metrics */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Gaming Hours & Session Breakdown
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Total Gaming Hours Sold:</span>
                    <span className="text-base font-bold text-white mt-0.5 block">{report.gamingMetrics.hoursSold} hrs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Actual Hours Played:</span>
                    <span className="text-base font-bold text-emerald-400 mt-0.5 block">{report.gamingMetrics.hoursConsumed} hrs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Completed Sessions:</span>
                    <span className="text-base font-bold text-white mt-0.5 block">{report.gamingMetrics.completedSessions}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Cancelled / Voided:</span>
                    <span className="text-base font-bold text-amber-400 mt-0.5 block">{report.gamingMetrics.cancelledSessions}</span>
                  </div>
                </div>
              </div>

              {/* Outstanding Balance Banner */}
              {report.financialSummary.outstandingBalance > 0 && (
                <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-4 flex items-center justify-between text-xs">
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
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Station</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold text-center">Rate</th>
                    <th className="py-3 px-4 font-semibold text-center">Sessions</th>
                    <th className="py-3 px-4 font-semibold text-center">Hours Played</th>
                    <th className="py-3 px-4 font-semibold text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {report.stationBreakdown.map((st) => (
                    <tr key={st.stationId} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-bold text-white">{st.stationName}</td>
                      <td className="py-3 px-4 text-slate-400">{st.stationType.replace('_', ' ')}</td>
                      <td className="py-3 px-4 text-center">₹{st.hourlyRate}/hr</td>
                      <td className="py-3 px-4 text-center font-medium">{st.sessionCount}</td>
                      <td className="py-3 px-4 text-center">{st.gamingHours} hrs</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">₹{st.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && activeTab === 'AUDIT' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Time</th>
                    <th className="py-3 px-4 font-semibold">Action</th>
                    <th className="py-3 px-4 font-semibold">Staff / Actor</th>
                    <th className="py-3 px-4 font-semibold">Target</th>
                    <th className="py-3 px-4 font-semibold">Reason / Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-blue-300 border border-slate-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">{log.actorId}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                        {log.targetType}:{String(log.targetId).slice(-6)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {log.reason || (log.metadata ? JSON.stringify(log.metadata) : '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
