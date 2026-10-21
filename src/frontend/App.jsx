import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar.jsx';
import { AppHeader } from './components/AppHeader.jsx';
import { StatsBar } from './components/StatsBar.jsx';
import { FilterTabs } from './components/FilterTabs.jsx';
import { StationCard } from './components/StationCard.jsx';
import { ActiveSessionsView } from './components/ActiveSessionsView.jsx';
import { StationInventoryView } from './components/StationInventoryView.jsx';
import { CustomerLedgerView } from './components/CustomerHistoryModal.jsx';
import { ShiftReportView } from './components/ShiftReportModal.jsx';
import { AuditTrailView } from './components/AuditTrailModal.jsx';
import {
  StartSessionModal,
  ExtendSessionModal,
  TransferSessionModal,
  CheckoutModal,
  AddStationModal
} from './components/Modals.jsx';
import { FiveMinuteWarningModal } from './components/FiveMinuteWarningModal.jsx';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export function App() {
  // Navigation & Layout State
  const [currentView, setCurrentView] = useState('floor'); // 'floor' | 'sessions' | 'customers' | 'reports' | 'audit' | 'inventory'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data & Real-time State
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Workflow Modals State
  const [startModalStation, setStartModalStation] = useState(null);
  const [extendModalData, setExtendModalData] = useState(null);
  const [transferModalData, setTransferModalData] = useState(null);
  const [checkoutModalData, setCheckoutModalData] = useState(null);
  const [isAddStationOpen, setIsAddStationOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 5-minute active warning popups queue
  const [fiveMinWarnings, setFiveMinWarnings] = useState([]);

  // Toast notifications
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((t) => (t && t.id === toast?.id ? null : t));
    }, 4000);
  };

  // Fetch live station overview
  const fetchStations = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const res = await fetch('/api/sessions/live');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setStations(json.data);
        setError(null);
      }
    } catch (err) {
      setError('Unable to fetch station status. Retrying...');
    } finally {
      setLoading(false);
      if (isManualRefresh) setIsRefreshing(false);
    }
  }, []);

  // Initial fetch and SSE event stream connection
  useEffect(() => {
    fetchStations();

    let eventSource;
    function connectSSE() {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        setIsLiveConnected(true);
      };

      eventSource.onerror = () => {
        setIsLiveConnected(false);
        eventSource.close();
        setTimeout(connectSSE, 3000); // Reconnect after 3s
      };

      // Handle real-time alert events
      eventSource.addEventListener('SESSION_EXPIRY_WARNING', (e) => {
        const data = JSON.parse(e.data);
        const payload = data.payload;

        // Push warning to active modal queue if not already present
        setFiveMinWarnings((prev) => {
          if (prev.some((w) => String(w.sessionId) === String(payload.sessionId))) {
            return prev;
          }
          return [...prev, payload];
        });

        showToast(`⚠️ Only 5 minutes left for ${payload.customerName} on PC ${payload.stationName}.`, 'warning');
        fetchStations();
      });

      eventSource.addEventListener('SESSION_EXPIRED', (e) => {
        const data = JSON.parse(e.data);
        showToast(`🚨 ${data.payload.stationName}: Time EXPIRED! Overtime charges accumulating.`, 'error');
        fetchStations();
      });

      eventSource.addEventListener('SESSION_STARTED', () => fetchStations());
      eventSource.addEventListener('SESSION_PAUSED', () => fetchStations());
      eventSource.addEventListener('SESSION_RESUMED', () => fetchStations());
      eventSource.addEventListener('SESSION_EXTENDED', (e) => {
        if (e.data) {
          try {
            const data = JSON.parse(e.data);
            const sessId = data.payload?.sessionId;
            if (sessId) {
              setFiveMinWarnings((prev) => prev.filter((w) => String(w.sessionId) !== String(sessId)));
            }
          } catch (err) {}
        }
        fetchStations();
      });
      eventSource.addEventListener('SESSION_TRANSFERRED', () => fetchStations());
      eventSource.addEventListener('SESSION_COMPLETED', (e) => {
        if (e.data) {
          try {
            const data = JSON.parse(e.data);
            const sessId = data.payload?.sessionId;
            if (sessId) {
              setFiveMinWarnings((prev) => prev.filter((w) => String(w.sessionId) !== String(sessId)));
            }
          } catch (err) {}
        }
        fetchStations();
      });
      eventSource.addEventListener('SESSION_CANCELLED', (e) => {
        if (e.data) {
          try {
            const data = JSON.parse(e.data);
            const sessId = data.payload?.sessionId;
            if (sessId) {
              setFiveMinWarnings((prev) => prev.filter((w) => String(w.sessionId) !== String(sessId)));
            }
          } catch (err) {}
        }
        fetchStations();
      });
    }

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [fetchStations]);

  // Action handlers
  const handleStartSession = async (payload) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start session');
      showToast(`Session started on ${payload.stationName || 'station'}.`, 'success');
      setStartModalStation(null);
      fetchStations();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePauseSession = async (sessionId) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cashier paused' })
      });
      if (!res.ok) throw new Error('Failed to pause');
      showToast('Session paused.', 'info');
      fetchStations();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleResumeSession = async (sessionId) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error('Failed to resume');
      showToast('Session resumed.', 'success');
      fetchStations();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleExtendSession = async (sessionId, addedMinutes) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addedMinutes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extend session');
      showToast(`Extended by ${addedMinutes} mins.`, 'success');
      setExtendModalData(null);
      fetchStations();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferSession = async (sessionId, targetStationId, reason) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStationId, reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to transfer session');
      showToast('Session transferred successfully.', 'success');
      setTransferModalData(null);
      fetchStations();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckoutSession = async ({ sessionId, discount, payment }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount, payment })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to checkout');
      showToast(`Checkout complete. Receipt: ${data.data.receipt.receiptNumber}`, 'success');
      setCheckoutModalData(null);
      fetchStations();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMaintenance = async (stationId, status) => {
    try {
      const res = await fetch(`/api/stations/${stationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      showToast(`Station marked as ${status}.`, 'info');
      fetchStations();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddStation = async (payload) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create station');
      showToast(`Station ${payload.name} created.`, 'success');
      setIsAddStationOpen(false);
      fetchStations();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick start helper
  const handleQuickStart = () => {
    const available = stations.find((s) => s.status === 'AVAILABLE');
    if (available) {
      setStartModalStation(available);
    } else {
      showToast('All gaming stations are currently occupied or in service.', 'warning');
    }
  };

  // Filter logic for Floor Grid
  const filteredStations = stations.filter((s) => {
    if (activeFilter === 'AVAILABLE') return s.status === 'AVAILABLE';
    if (activeFilter === 'ACTIVE') return s.status === 'OCCUPIED';
    if (activeFilter === 'ALERTS') return s.liveSession && (s.liveSession.isWarning || s.liveSession.isOvertime);
    if (activeFilter === 'MAINTENANCE') return s.status === 'MAINTENANCE';
    return true;
  });

  const availableStationsForTransfer = stations.filter((s) => s.status === 'AVAILABLE');

  const counts = {
    all: stations.length,
    available: stations.filter((s) => s.status === 'AVAILABLE').length,
    occupied: stations.filter((s) => s.status === 'OCCUPIED').length,
    alerts: stations.filter((s) => s.liveSession && (s.liveSession.isWarning || s.liveSession.isOvertime)).length,
    maintenance: stations.filter((s) => s.status === 'MAINTENANCE').length
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. SaaS Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        stations={stations}
        isLiveConnected={isLiveConnected}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Persistent App Header */}
        <AppHeader
          currentView={currentView}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onNewStationClick={() => setIsAddStationOpen(true)}
          onQuickStartClick={handleQuickStart}
          onRefresh={() => fetchStations(true)}
          isRefreshing={isRefreshing}
          isLiveConnected={isLiveConnected}
          urgentAlertsCount={counts.alerts}
        />

        {/* Toast Alert Banner */}
        {toast && (
          <div className="fixed top-20 right-6 z-50 animate-bounce">
            <div
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs sm:text-sm font-semibold ${
                toast.type === 'error'
                  ? 'bg-red-950 border-red-500 text-red-200 shadow-red-900/50'
                  : toast.type === 'warning'
                  ? 'bg-amber-950 border-amber-500 text-amber-200 shadow-amber-900/50'
                  : 'bg-emerald-950 border-emerald-500 text-emerald-200 shadow-emerald-900/50'
              }`}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{toast.message}</span>
              <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* View Router Main Content Area */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 w-full max-w-7xl mx-auto">
          {/* VIEW 1: Live Floor Grid */}
          {currentView === 'floor' && (
            <div className="space-y-6">
              {/* Key Fleet Metrics */}
              <StatsBar stations={stations} />

              {/* Floor Segment Filters */}
              <FilterTabs
                activeFilter={activeFilter}
                onSelectFilter={setActiveFilter}
                counts={counts}
              />

              {/* Loading & Error States */}
              {loading && (
                <div className="text-center py-20">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-xs text-slate-400">Synchronizing floor status...</p>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-2xl bg-red-950/40 border border-red-900 text-red-300 text-xs text-center mb-6">
                  {error}
                </div>
              )}

              {/* Station Grid */}
              {!loading && filteredStations.length === 0 && (
                <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
                  <p className="text-sm font-bold text-slate-300">No stations match the selected filter.</p>
                  <p className="text-xs text-slate-500 mt-1">Switch filter to "All Stations" or click "+ Add Station".</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStations.map((station) => (
                  <StationCard
                    key={station._id}
                    station={station}
                    onStartSession={(st) => setStartModalStation(st)}
                    onPauseSession={handlePauseSession}
                    onResumeSession={handleResumeSession}
                    onExtendSession={(id, name) => setExtendModalData({ sessionId: id, stationName: name })}
                    onTransferSession={(id, name) => setTransferModalData({ sessionId: id, currentStationName: name })}
                    onCheckoutSession={(id, name) =>
                      setCheckoutModalData({ sessionId: id, stationName: name, liveSession: station.liveSession })
                    }
                    onToggleMaintenance={handleToggleMaintenance}
                  />
                ))}
              </div>
            </div>
          )}

          {/* VIEW 2: Active Sessions Dashboard */}
          {currentView === 'sessions' && (
            <ActiveSessionsView
              stations={stations}
              onExtendSession={(id, name) => setExtendModalData({ sessionId: id, stationName: name })}
              onPauseSession={handlePauseSession}
              onResumeSession={handleResumeSession}
              onTransferSession={(id, name) => setTransferModalData({ sessionId: id, currentStationName: name })}
              onCheckoutSession={(id, name) => {
                const targetStation = stations.find((s) => s.liveSession?.sessionId === id);
                setCheckoutModalData({
                  sessionId: id,
                  stationName: name,
                  liveSession: targetStation?.liveSession
                });
              }}
              onQuickStart={handleQuickStart}
            />
          )}

          {/* VIEW 3: Customer Ledger & History */}
          {currentView === 'customers' && <CustomerLedgerView embedded={true} />}

          {/* VIEW 4: Shift Reconciliation & Reports */}
          {currentView === 'reports' && <ShiftReportView embedded={true} />}

          {/* VIEW 5: Operational Audit Trail */}
          {currentView === 'audit' && <AuditTrailView embedded={true} />}

          {/* VIEW 6: Station Inventory & Rates */}
          {currentView === 'inventory' && (
            <StationInventoryView
              stations={stations}
              onNewStationClick={() => setIsAddStationOpen(true)}
              onStartSession={(st) => setStartModalStation(st)}
              onToggleMaintenance={handleToggleMaintenance}
            />
          )}
        </main>
      </div>

      {/* Global Focused Workflow Modals */}
      {startModalStation && (
        <StartSessionModal
          station={startModalStation}
          onClose={() => setStartModalStation(null)}
          onSubmit={handleStartSession}
          isSubmitting={isSubmitting}
        />
      )}

      {extendModalData && (
        <ExtendSessionModal
          sessionId={extendModalData.sessionId}
          stationName={extendModalData.stationName}
          onClose={() => setExtendModalData(null)}
          onSubmit={handleExtendSession}
          isSubmitting={isSubmitting}
        />
      )}

      {transferModalData && (
        <TransferSessionModal
          sessionId={transferModalData.sessionId}
          currentStationName={transferModalData.currentStationName}
          availableStations={availableStationsForTransfer}
          onClose={() => setTransferModalData(null)}
          onSubmit={handleTransferSession}
          isSubmitting={isSubmitting}
        />
      )}

      {checkoutModalData && (
        <CheckoutModal
          sessionId={checkoutModalData.sessionId}
          stationName={checkoutModalData.stationName}
          liveSession={checkoutModalData.liveSession}
          onClose={() => setCheckoutModalData(null)}
          onSubmit={handleCheckoutSession}
          isSubmitting={isSubmitting}
        />
      )}

      {isAddStationOpen && (
        <AddStationModal
          onClose={() => setIsAddStationOpen(false)}
          onSubmit={handleAddStation}
          isSubmitting={isSubmitting}
        />
      )}

      {/* High-Priority Floating 5-Minute Warning Popup Queue */}
      <FiveMinuteWarningModal
        warnings={fiveMinWarnings}
        onDismiss={(sessId) => setFiveMinWarnings((prev) => prev.filter((w) => String(w.sessionId) !== String(sessId)))}
        onExtend={(sessId, stName) => setExtendModalData({ sessionId: sessId, stationName: stName })}
      />
    </div>
  );
}
