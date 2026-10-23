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
  AddStationModal,
  CancelSessionModal,
  DeleteStationModal,
  ProfileSettingsModal,
  WhatsAppLinkModal
} from './components/Modals.jsx';
import { FiveMinuteWarningModal } from './components/FiveMinuteWarningModal.jsx';
import { ThermalReceiptModal } from './components/ThermalReceiptModal.jsx';
import { DeskQRModal } from './components/DeskQRModal.jsx';
import { CustomerPortalView } from './components/CustomerPortalView.jsx';
import { UPSFreezeBanner, UPSFreezeModal } from './components/UPSFreezeBanner.jsx';
import { GamingHeroBanner } from './components/GamingHeroBanner.jsx';
import { HomePage } from './components/HomePage.jsx';
import { LoginView } from './components/LoginView.jsx';
import { Snackbar } from './components/ui/index.js';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { getToken, getCurrentUser, clearAuth, verifySession, updateProfile } from './utils/api.js';
import { soundEngine } from './utils/soundEngine.js';

export function App() {
  // Authentication & Session State
  const [authToken, setAuthToken] = useState(getToken());
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isViewingLogin, setIsViewingLogin] = useState(false);

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
  const [cancelModalData, setCancelModalData] = useState(null);
  const [deleteModalStation, setDeleteModalStation] = useState(null);
  const [isAddStationOpen, setIsAddStationOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [receiptModalData, setReceiptModalData] = useState(null);
  const [deskQRStation, setDeskQRStation] = useState(null);
  const [isEmergencyFrozen, setIsEmergencyFrozen] = useState(false);
  const [frozenCount, setFrozenCount] = useState(0);
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [portalStationId, setPortalStationId] = useState(
    window.location.pathname.startsWith('/portal/')
      ? window.location.pathname.replace('/portal/', '').split('/')[0]
      : null
  );
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

  const handleSaveProfile = async (profileData) => {
    setIsSubmitting(true);
    try {
      const updated = await updateProfile(profileData);
      setCurrentUser(updated);
      setIsProfileModalOpen(false);
      showToast('Manager profile & WhatsApp number updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update profile settings', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify token on mount and listen for authorization invalidation
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      if (authToken) {
        const user = await verifySession();
        if (isMounted) {
          if (user) {
            setCurrentUser(user);
          } else {
            setAuthToken(null);
            setCurrentUser(null);
          }
        }
      }
      if (isMounted) setIsCheckingAuth(false);
    }
    checkAuth();

    const handleUnauthorized = () => {
      setAuthToken(null);
      setCurrentUser(null);
      showToast('Session expired. Please sign in again.', 'warning');
    };

    window.addEventListener('gamedash:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('gamedash:unauthorized', handleUnauthorized);
    };
  }, [authToken]);

  const handleLogout = () => {
    clearAuth();
    setAuthToken(null);
    setCurrentUser(null);
    setStations([]);
    showToast('Signed out successfully.', 'info');
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
    if (!authToken || !currentUser) return;
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

        // Sound alert chime
        soundEngine.playChime();

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
        // Sound alert buzzer
        soundEngine.playOvertimeBuzzer();
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

      // Emergency Power Cut Freeze SSE Events
      eventSource.addEventListener('EMERGENCY_FREEZE_TRIGGERED', (e) => {
        setIsEmergencyFrozen(true);
        if (e.data) {
          try {
            const data = JSON.parse(e.data);
            setFrozenCount(data.payload?.count || 0);
          } catch {}
        }
        showToast('⚠️ Power Cut / UPS Emergency Freeze active across all stations.', 'warning');
        fetchStations();
      });

      eventSource.addEventListener('EMERGENCY_RESUME_TRIGGERED', () => {
        setIsEmergencyFrozen(false);
        setFrozenCount(0);
        showToast('⚡ Power Cut Mode cleared. All station clocks resumed!', 'success');
        fetchStations();
      });

      // In-Desk Customer Self-Service SSE Events
      eventSource.addEventListener('STAFF_ASSISTANCE_REQUEST', (e) => {
        if (e.data) {
          try {
            const data = JSON.parse(e.data);
            soundEngine.playChime();
            showToast(`🛎️ Staff Call: ${data.payload.stationName} — ${data.payload.reason} (${data.payload.customerName})`, 'warning');
          } catch {}
        }
      });

      eventSource.addEventListener('IN_SEAT_ORDER_RECEIVED', (e) => {
        if (e.data) {
          try {
            const data = JSON.parse(e.data);
            soundEngine.playSuccessDing();
            showToast(`🍜 In-Seat Order: ${data.payload.stationName} ordered ${data.payload.items?.length} items (₹${data.payload.totalAmount})`, 'info');
          } catch {}
        }
      });

      eventSource.addEventListener('EXTENSION_REQUESTED', (e) => {
        if (e.data) {
          try {
            const data = JSON.parse(e.data);
            showToast(`➕ Extension Request: ${data.payload.stationName} requests +${data.payload.additionalMinutes}m (${data.payload.customerName})`, 'info');
          } catch {}
        }
      });
    }

    // Check current emergency status on load
    async function checkEmergency() {
      try {
        const res = await fetch('/api/sessions/emergency/status');
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setIsEmergencyFrozen(json.data.isEmergencyFrozen);
            setFrozenCount(json.data.frozenCount);
          }
        }
      } catch {}
    }
    checkEmergency();

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [authToken, currentUser, fetchStations]);

  // Route popstate listener for /portal/:stationId
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/portal/')) {
        setPortalStationId(window.location.pathname.replace('/portal/', '').split('/')[0]);
      } else {
        setPortalStationId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  const initiateCancelSession = (sessionId, stationName, customerName) => {
    setCancelModalData({ sessionId, stationName, customerName });
  };

  const executeCancelSession = async () => {
    if (!cancelModalData) return;
    const { sessionId, stationName } = cancelModalData;
    setIsSubmitting(true);
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
      setCancelModalData(null);
      fetchStations();
    } catch (err) {
      showToast(`Error cancelling session: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateDeleteStation = (station) => {
    setDeleteModalStation(station);
  };

  const executeDeleteStation = async () => {
    if (!deleteModalStation) return;
    const station = deleteModalStation;
    setIsSubmitting(true);
    try {
      const stationId = station._id || station.id;
      const res = await fetch(`/api/stations/${stationId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete computer');

      showToast(`Computer '${station.name}' was deleted from fleet.`, 'success');
      setDeleteModalStation(null);
      fetchStations();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
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
      soundEngine.playSuccessDing();
      showToast(`Checkout complete. Receipt: ${data.data.receipt?.receiptNumber || 'OK'}`, 'success');
      setCheckoutData(null);
      if (data.data?.receipt) {
        setReceiptModalData(data.data.receipt);
      }
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

  const triggerEmergencyFreeze = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/sessions/emergency/freeze-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'UPS Emergency Power Cut' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to trigger UPS freeze');
      setIsEmergencyFrozen(true);
      setFrozenCount(data.data?.frozenCount || 0);
      setIsFreezeModalOpen(false);
      showToast(`⚡ Power Cut Mode: ${data.data?.frozenCount || 0} sessions paused!`, 'warning');
      fetchStations();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resumeEmergencyFreeze = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/sessions/emergency/resume-all', {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resume sessions');
      setIsEmergencyFrozen(false);
      setFrozenCount(0);
      showToast(`⚡ Floor Clocks Resumed: ${data.data?.resumedCount || 0} sessions active!`, 'success');
      fetchStations();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // In-Desk Customer Portal Mode (Public view for players scanning desk QR code)
  if (portalStationId) {
    return (
      <CustomerPortalView
        stationId={portalStationId}
        onBackToFloor={() => {
          window.history.pushState({}, '', '/');
          setPortalStationId(null);
        }}
      />
    );
  }

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

  // Loading initial auth check state
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-3 border-primary border-t-transparent animate-spin mb-4" />
        <p className="body-medium text-on-surface-variant font-medium">Loading GameDash...</p>
      </div>
    );
  }

  // If user is unauthenticated, render the Public Arena Home Page or Staff Login View
  if (!authToken || !currentUser) {
    if (isViewingLogin) {
      return (
        <LoginView
          onBackToHome={() => setIsViewingLogin(false)}
          onLoginSuccess={(user, token) => {
            setCurrentUser(user);
            setAuthToken(token);
            setIsViewingLogin(false);
            showToast(`Welcome back, ${user.name || user.username}!`, 'success');
          }}
        />
      );
    }
    return (
      <HomePage
        onOpenLogin={() => setIsViewingLogin(true)}
        stations={stations}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-on-surface font-sans selection:bg-primary selection:text-on-primary cyber-arena-grid">
      {/* 1. Terminal Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        stations={stations}
        isLiveConnected={isLiveConnected}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onProfileClick={() => setIsProfileModalOpen(true)}
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
          currentUser={currentUser}
          onLogout={handleLogout}
          onProfileClick={() => setIsProfileModalOpen(true)}
          onWhatsAppClick={() => setIsWhatsAppModalOpen(true)}
          isEmergencyFrozen={isEmergencyFrozen}
          onTriggerUPSFreeze={() => setIsFreezeModalOpen(true)}
          onResumeUPSFreeze={resumeEmergencyFreeze}
        />

        {/* UPS Emergency Power Cut Freeze Banner */}
        <UPSFreezeBanner
          isEmergencyFrozen={isEmergencyFrozen}
          frozenCount={frozenCount}
          onResumeAll={resumeEmergencyFreeze}
          isSubmitting={isSubmitting}
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
        <main className="p-2.5 sm:p-5 lg:p-6 flex-1 w-full max-w-7xl mx-auto pb-20 md:pb-6">
          {/* VIEW 1: Live Floor Grid */}
          {currentView === 'floor' && (
            <div className="space-y-3 sm:space-y-4">
              {/* Gaming Arena Hero Banner */}
              <GamingHeroBanner
                stations={stations}
                onQuickStart={quickStart}
                onNewStation={() => setIsAddStationOpen(true)}
              />

              {/* Floor Overview Strip (Visible on desktop/tablet, hidden on mobile for maximum space) */}
              <div className="hidden sm:block">
                <StatsBar stations={stations} />
              </div>

              {/* Floor Segment Filters */}
              <FilterTabs
                activeFilter={activeFilter}
                onSelectFilter={setActiveFilter}
                counts={counts}
              />

              {/* Loading & Error States */}
              {loading && (
                <div className="text-center py-16 bg-surface-container border border-outline-variant/40 rounded-xl">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-on-surface-variant">Loading computers...</p>
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-xl bg-error-container/40 border border-error/40 text-on-error-container text-xs text-center mb-4">
                  {error}
                </div>
              )}

              {/* Station Grid Empty State */}
              {!loading && filteredStations.length === 0 && (
                <div className="text-center py-12 bg-surface-container border border-outline-variant/40 rounded-xl">
                  <p className="text-sm font-semibold text-on-surface">No computers found in this category</p>
                  <p className="text-xs text-on-surface-variant mt-1">Switch to "All" or click "Add Computer"</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
                    onCancel={(id, name, cust) => initiateCancelSession(id, name, cust)}
                    onDelete={(st) => initiateDeleteStation(st)}
                    onToggleMaintenance={toggleMaintenance}
                    onDeskQR={(st) => setDeskQRStation(st)}
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
              onCancel={(id, name, cust) => initiateCancelSession(id, name, cust)}
              onQuickStart={quickStart}
            />
          )}

          {/* VIEW 3: Customer Ledger & History */}
          {currentView === 'customers' && (
            <CustomerLedgerView embedded={true} onViewReceipt={setReceiptModalData} />
          )}

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
              onDeleteStation={(st) => initiateDeleteStation(st)}
            />
          )}

          {/* VIEW 7: Gaming Lounge Public Home Page / Display */}
          {currentView === 'home' && (
            <HomePage
              isLoggedIn={true}
              onOpenDashboard={() => setCurrentView('floor')}
              stations={stations}
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

      {/* Confirmation Modal to Cancel Active Session */}
      {cancelModalData && (
        <CancelSessionModal
          isOpen={true}
          stationName={cancelModalData.stationName}
          customerName={cancelModalData.customerName}
          onClose={() => setCancelModalData(null)}
          onConfirm={executeCancelSession}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Confirmation Modal to Delete Station */}
      {deleteModalStation && (
        <DeleteStationModal
          isOpen={true}
          station={deleteModalStation}
          onClose={() => setDeleteModalStation(null)}
          onConfirm={executeDeleteStation}
          isSubmitting={isSubmitting}
        />
      )}

      {/* High-Priority Floating 5-Minute Warning Popup Queue */}
      <FiveMinuteWarningModal
        warnings={activeWarnings}
        onDismiss={(sessId) => setActiveWarnings((prev) => prev.filter((w) => String(w.sessionId) !== String(sessId)))}
        onExtend={(sessId, stName) => setExtendData({ sessionId: sessId, stationName: stName })}
      />

      {/* Tenant Manager Profile & WhatsApp Alert Settings Modal */}
      {isProfileModalOpen && (
        <ProfileSettingsModal
          isOpen={true}
          user={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onSave={handleSaveProfile}
          onOpenWhatsAppLink={() => {
            setIsProfileModalOpen(false);
            setIsWhatsAppModalOpen(true);
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {/* WhatsApp Device Connection & QR Modal */}
      {isWhatsAppModalOpen && (
        <WhatsAppLinkModal
          isOpen={true}
          user={currentUser}
          onClose={() => setIsWhatsAppModalOpen(false)}
        />
      )}

      {/* 80mm / 58mm POS Thermal Receipt Modal */}
      {receiptModalData && (
        <ThermalReceiptModal
          receipt={receiptModalData}
          currentUser={currentUser}
          onClose={() => setReceiptModalData(null)}
        />
      )}

      {/* Desk QR Code & In-Seat Self-Service Portal Modal */}
      {deskQRStation && (
        <DeskQRModal
          station={deskQRStation}
          onClose={() => setDeskQRStation(null)}
        />
      )}

      {/* UPS Emergency Power Cut Freeze Confirmation Modal */}
      <UPSFreezeModal
        isOpen={isFreezeModalOpen}
        onClose={() => setIsFreezeModalOpen(false)}
        onConfirm={triggerEmergencyFreeze}
        isSubmitting={isSubmitting}
        activeCount={counts.occupied}
      />
    </div>
  );
}
