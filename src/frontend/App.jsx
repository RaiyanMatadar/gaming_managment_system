import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { StatsBar } from './components/StatsBar.jsx';
import { FilterTabs } from './components/FilterTabs.jsx';
import { StationCard } from './components/StationCard.jsx';
import {
  StartSessionModal,
  ExtendSessionModal,
  TransferSessionModal,
  CheckoutModal,
  AddStationModal
} from './components/Modals.jsx';
import { ShiftReportModal } from './components/ShiftReportModal.jsx';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export function App() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Modals state
  const [startModalStation, setStartModalStation] = useState(null);
  const [extendModalData, setExtendModalData] = useState(null);
  const [transferModalData, setTransferModalData] = useState(null);
  const [checkoutModalData, setCheckoutModalData] = useState(null);
  const [isAddStationOpen, setIsAddStationOpen] = useState(false);
  const [isShiftReportOpen, setIsShiftReportOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(t => (t && t.id === toast?.id ? null : t));
    }, 4000);
  };

  // Fetch live station overview
  const fetchStations = useCallback(async () => {
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
        showToast(`⚠️ ${data.payload.stationName}: Session expiring in ${data.payload.remainingMinutes} minutes!`, 'warning');
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
      eventSource.addEventListener('SESSION_EXTENDED', () => fetchStations());
      eventSource.addEventListener('SESSION_TRANSFERRED', () => fetchStations());
      eventSource.addEventListener('SESSION_COMPLETED', () => fetchStations());
      eventSource.addEventListener('SESSION_CANCELLED', () => fetchStations());
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

  // Filter logic
  const filteredStations = stations.filter(s => {
    if (activeFilter === 'AVAILABLE') return s.status === 'AVAILABLE';
    if (activeFilter === 'ACTIVE') return s.status === 'OCCUPIED';
    if (activeFilter === 'ALERTS') return s.liveSession && (s.liveSession.isWarning || s.liveSession.isOvertime);
    if (activeFilter === 'MAINTENANCE') return s.status === 'MAINTENANCE';
    return true;
  });

  const availableStationsForTransfer = stations.filter(s => s.status === 'AVAILABLE');

  const counts = {
    all: stations.length,
    available: stations.filter(s => s.status === 'AVAILABLE').length,
    occupied: stations.filter(s => s.status === 'OCCUPIED').length,
    alerts: stations.filter(s => s.liveSession && (s.liveSession.isWarning || s.liveSession.isOvertime)).length,
    maintenance: stations.filter(s => s.status === 'MAINTENANCE').length
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar
        isLiveConnected={isLiveConnected}
        onNewStationClick={() => setIsAddStationOpen(true)}
        onShiftReportClick={() => setIsShiftReportOpen(true)}
      />

      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium ${
            toast.type === 'error'
              ? 'bg-red-950 border-red-500 text-red-200 shadow-red-900/50'
              : toast.type === 'warning'
              ? 'bg-amber-950 border-amber-500 text-amber-200 shadow-amber-900/50'
              : 'bg-emerald-950 border-emerald-500 text-emerald-200 shadow-emerald-900/50'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-6 flex-1 w-full">
        {/* Top Operational Metrics */}
        <StatsBar stations={stations} />

        {/* Filter Tabs */}
        <FilterTabs
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          counts={counts}
        />

        {/* Loading / Error States */}
        {loading && (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-400">Loading gaming stations...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-900 text-red-300 text-xs text-center mb-6">
            {error}
          </div>
        )}

        {/* Stations Grid */}
        {!loading && filteredStations.length === 0 && (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <p className="text-sm font-semibold text-slate-300">No stations match the selected filter.</p>
            <p className="text-xs text-slate-500 mt-1">Try switching to "All Stations" or click "+ Add Station".</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStations.map(station => (
            <StationCard
              key={station._id}
              station={station}
              onStartSession={(st) => setStartModalStation(st)}
              onPauseSession={handlePauseSession}
              onResumeSession={handleResumeSession}
              onExtendSession={(id, name) => setExtendModalData({ sessionId: id, stationName: name })}
              onTransferSession={(id, name) => setTransferModalData({ sessionId: id, currentStationName: name })}
              onCheckoutSession={(id, name) => setCheckoutModalData({ sessionId: id, stationName: name, liveSession: station.liveSession })}
              onToggleMaintenance={handleToggleMaintenance}
            />
          ))}
        </div>
      </main>

      {/* Modals */}
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

      {isShiftReportOpen && (
        <ShiftReportModal
          onClose={() => setIsShiftReportOpen(false)}
        />
      )}
    </div>
  );
}
