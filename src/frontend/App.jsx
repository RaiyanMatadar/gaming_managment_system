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
import { Snackbar } from './components/ui/index.js';
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
  const [selectedStation, setSelectedStation] = useState(null);
  const [extendData, setExtendData] = useState(null);
  const [transferData, setTransferData] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [isAddStationOpen, setIsAddStationOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 5-minute active warning popups queue
  const [activeWarnings, setActiveWarnings] = useState([]);

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
        setActiveWarnings((prev) => {
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
              setActiveWarnings((prev) => prev.filter((w) => String(w.sessionId) !== String(sessId)));
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
              setActiveWarnings((prev) => prev.filter((w) => String(w.sessionId) !== String(sessId)));
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
              setActiveWarnings((prev) => prev.filter((w) => String(w.sessionId) !== String(sessId)));
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

  // Core session action handlers
  const startSession = async (payload) => {
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
      setSelectedStation(null);
      fetchStations();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelSession = async (sessionId, stationName) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel the session on ${stationName || 'this computer'}? The timer will stop immediately and the computer will become available.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/sessions/${sessionId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Customer decided not to play anymore' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel session');

      setActiveWarnings((prev) => prev.filter((w) => String(w.sessionId) !== String(sessionId)));
      showToast(`Session on ${stationName || 'computer'} was cancelled.`, 'info');
      fetchStations();
    } catch (err) {
      alert(`Error cancelling session: ${err.message}`);
    }
  };

  const pauseSession = async (sessionId) => {
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

  const resumeSession = async (sessionId) => {
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

  const extendSession = async (sessionId, addedMinutes) => {
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
      setExtendData(null);
      fetchStations();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const transferSession = async (sessionId, targetStationId, reason) => {
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
      setTransferData(null);
      fetchStations();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkoutSession = async ({ sessionId, discount, payment }) => {
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
      setCheckoutData(null);
      fetchStations();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMaintenance = async (stationId, status) => {
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

  const addStation = async (payload) => {
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
  const quickStart = () => {
    const available = stations.find((s) => s.status === 'AVAILABLE');
    if (available) {
      setSelectedStation(available);
    } else {
      showToast('All computers are currently in use or under repair.', 'warning');
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
    <div className="min-h-screen flex bg-background text-on-surface font-sans selection:bg-primary selection:text-on-primary">
      {/* 1. Terminal Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        stations={stations}
        isLiveConnected={isLiveConnected}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Workspace Layout with M3 Responsive Adaptations */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-20 lg:pl-72 pb-20 md:pb-6">
        {/* Persistent App Header */}
        <AppHeader
          currentView={currentView}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onNewStationClick={() => setIsAddStationOpen(true)}
          onQuickStartClick={quickStart}
          onRefresh={() => fetchStations(true)}
          isRefreshing={isRefreshing}
          isLiveConnected={isLiveConnected}
          urgentAlertsCount={counts.alerts}
        />

        {/* M3 Snackbar Notifications */}
        {toast && (
          <Snackbar
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* View Router Main Content Area */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 w-full max-w-7xl mx-auto">
          {/* VIEW 1: Live Floor Grid */}
          {currentView === 'floor' && (
            <div className="space-y-5">
              {/* Floor Overview Strip */}
              <StatsBar stations={stations} />

              {/* Floor Segment Filters */}
              <FilterTabs
                activeFilter={activeFilter}
                onSelectFilter={setActiveFilter}
                counts={counts}
              />

              {/* Loading & Error States */}
              {loading && (
                <div className="text-center py-20 bg-surface-container border border-outline-variant/60 rounded-xl">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-on-surface-variant">Loading computers...</p>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-xl bg-error-container/40 border border-error/40 text-on-error-container text-xs text-center mb-6">
                  {error}
                </div>
              )}

              {/* Station Grid Empty State */}
              {!loading && filteredStations.length === 0 && (
                <div className="text-center py-16 bg-surface-container border border-outline-variant/60 rounded-xl">
                  <p className="text-sm font-semibold text-on-surface">No computers found in this category</p>
                  <p className="text-xs text-on-surface-variant mt-1">Switch to "All" or click "Add Computer"</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStations.map((station) => (
                  <StationCard
                    key={station._id}
                    station={station}
                    onStart={(st) => setSelectedStation(st)}
                    onPause={pauseSession}
                    onResume={resumeSession}
                    onExtend={(id, name) => setExtendData({ sessionId: id, stationName: name })}
                    onTransfer={(id, name) => setTransferData({ sessionId: id, currentStationName: name })}
                    onCheckout={(id, name) =>
                      setCheckoutData({ sessionId: id, stationName: name, liveSession: station.liveSession })
                    }
                    onCancel={(id, name) => cancelSession(id, name)}
                    onToggleMaintenance={toggleMaintenance}
                  />
                ))}
              </div>
            </div>
          )}

          {/* VIEW 2: Active Sessions Dashboard */}
          {currentView === 'sessions' && (
            <ActiveSessionsView
              stations={stations}
              onExtend={(id, name) => setExtendData({ sessionId: id, stationName: name })}
              onPause={pauseSession}
              onResume={resumeSession}
              onTransfer={(id, name) => setTransferData({ sessionId: id, currentStationName: name })}
              onCheckout={(id, name) => {
                const targetStation = stations.find((s) => s.liveSession?.sessionId === id);
                setCheckoutData({
                  sessionId: id,
                  stationName: name,
                  liveSession: targetStation?.liveSession
                });
              }}
              onCancel={(id, name) => cancelSession(id, name)}
              onQuickStart={quickStart}
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
              onStartSession={(st) => setSelectedStation(st)}
              onToggleMaintenance={toggleMaintenance}
            />
          )}
        </main>
      </div>

      {/* Global Focused Workflow Modals */}
      {selectedStation && (
        <StartSessionModal
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
          onSubmit={startSession}
          isSubmitting={isSubmitting}
        />
      )}

      {extendData && (
        <ExtendSessionModal
          sessionId={extendData.sessionId}
          stationName={extendData.stationName}
          onClose={() => setExtendData(null)}
          onSubmit={extendSession}
          isSubmitting={isSubmitting}
        />
      )}

      {transferData && (
        <TransferSessionModal
          sessionId={transferData.sessionId}
          currentStationName={transferData.currentStationName}
          availableStations={availableStationsForTransfer}
          onClose={() => setTransferData(null)}
          onSubmit={transferSession}
          isSubmitting={isSubmitting}
        />
      )}

      {checkoutData && (
        <CheckoutModal
          sessionId={checkoutData.sessionId}
          stationName={checkoutData.stationName}
          liveSession={checkoutData.liveSession}
          onClose={() => setCheckoutData(null)}
          onSubmit={checkoutSession}
          isSubmitting={isSubmitting}
        />
      )}

      {isAddStationOpen && (
        <AddStationModal
          onClose={() => setIsAddStationOpen(false)}
          onSubmit={addStation}
          isSubmitting={isSubmitting}
        />
      )}

      {/* High-Priority Floating 5-Minute Warning Popup Queue */}
      <FiveMinuteWarningModal
        warnings={activeWarnings}
        onDismiss={(sessId) => setActiveWarnings((prev) => prev.filter((w) => String(w.sessionId) !== String(sessId)))}
        onExtend={(sessId, stName) => setExtendData({ sessionId: sessId, stationName: stName })}
      />
    </div>
  );
}
