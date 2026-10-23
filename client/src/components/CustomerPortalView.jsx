import React, { useState, useEffect, useCallback } from 'react';
import {
  Gamepad2,
  Clock,
  AlertTriangle,
  Bell,
  Plus,
  Minus,
  ShoppingBag,
  CheckCircle2,
  Send,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Flame,
  ArrowRight
} from 'lucide-react';
import { Card, Button, Badge } from './ui';

export function CustomerPortalView({ stationId: propStationId, onBackToFloor }) {
  // If loaded via route /portal/:id or passed as prop
  const stationId = propStationId || window.location.pathname.split('/portal/')[1]?.split('/')[0];

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Cart for F&B snacks
  const [cart, setCart] = useState({}); // { [itemId]: qty }
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Call Staff state
  const [isCallingStaff, setIsCallingStaff] = useState(false);
  const [callReason, setCallReason] = useState('Headset audio issue');
  const [callStaffSuccess, setCallStaffSuccess] = useState(null);

  // Extension request state
  const [isExtending, setIsExtending] = useState(false);
  const [extensionSuccess, setExtensionSuccess] = useState(null);

  // Fetch station live status
  const fetchPortalData = useCallback(async (isSilent = false) => {
    if (!stationId) return;
    if (!isSilent) setRefreshing(true);
    try {
      const res = await fetch(`/api/portal/station/${stationId}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to load station status');
      }
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setError(null);
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to station');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [stationId]);

  useEffect(() => {
    fetchPortalData();
    // Poll every 5s for live countdown updates
    const timer = setInterval(() => fetchPortalData(true), 5000);
    return () => clearInterval(timer);
  }, [fetchPortalData]);

  // Handle Cart item changes
  const updateQty = (item, delta) => {
    setCart((prev) => {
      const current = prev[item.id]?.qty || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      }
      return {
        ...prev,
        [item.id]: {
          ...item,
          qty: next
        }
      };
    });
  };

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  // Submit in-seat snack order
  const handleOrderSnacks = async () => {
    if (cartItems.length === 0) return;
    setIsSubmittingOrder(true);
    try {
      const res = await fetch(`/api/portal/station/${stationId}/order-snack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: data?.session?.customerName || 'Gamer',
          items: cartItems,
          notes: orderNotes
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to place order');
      setOrderSuccess(json.data?.message || 'Order received! Staff will deliver it to your seat.');
      setCart({});
      setOrderNotes('');
      setTimeout(() => setOrderSuccess(null), 6000);
    } catch (err) {
      alert(`Order Error: ${err.message}`);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Call staff for assistance
  const handleCallStaff = async () => {
    setIsCallingStaff(true);
    try {
      const res = await fetch(`/api/portal/station/${stationId}/call-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: callReason,
          customerName: data?.session?.customerName || 'Gamer'
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to alert staff');
      setCallStaffSuccess(json.message || 'Staff notified! Help is on the way.');
      setTimeout(() => setCallStaffSuccess(null), 6000);
    } catch (err) {
      alert(`Alert Error: ${err.message}`);
    } finally {
      setIsCallingStaff(false);
    }
  };

  // Request time extension
  const handleRequestExtension = async (mins) => {
    setIsExtending(true);
    try {
      const res = await fetch(`/api/portal/station/${stationId}/request-extension`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          additionalMinutes: mins,
          customerName: data?.session?.customerName || 'Gamer'
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to request extension');
      setExtensionSuccess(json.message || `+${mins} mins extension request sent!`);
      setTimeout(() => setExtensionSuccess(null), 5000);
    } catch (err) {
      alert(`Extension Error: ${err.message}`);
    } finally {
      setIsExtending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-on-surface">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-on-surface-variant">Connecting to Gaming Station...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-on-surface">
        <Card variant="container" className="p-6 max-w-sm w-full text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-error mx-auto" />
          <h2 className="text-base font-bold">Station Portal Error</h2>
          <p className="text-xs text-on-surface-variant">{error || 'Station not found.'}</p>
          <Button variant="tonal" onClick={() => fetchPortalData()} className="w-full text-xs">
            Try Again
          </Button>
          {onBackToFloor && (
            <Button variant="text" onClick={onBackToFloor} className="w-full text-xs">
              Back to Dashboard
            </Button>
          )}
        </Card>
      </div>
    );
  }

  const { station, session, menu = [] } = data;
  const isOccupied = station.status === 'OCCUPIED' && Boolean(session);

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans pb-24">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-surface-container-high/90 backdrop-blur-md border-b border-outline-variant/40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-black">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm text-on-surface">{station.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface text-on-surface-variant border border-outline-variant/30 font-medium">
                {station.type?.replace('_', ' ')}
              </span>
            </div>
            <span className="text-[10px] text-on-surface-variant block">Desk Self-Service Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchPortalData()}
            className="p-1.5 rounded-full bg-surface text-on-surface-variant hover:text-on-surface transition-colors"
            title="Refresh Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {onBackToFloor && (
            <Button variant="tonal" size="sm" onClick={onBackToFloor} className="text-xs px-2.5">
              Dashboard
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Banner Alert Feedback */}
        {callStaffSuccess && (
          <div className="p-3.5 rounded-[16px] bg-success-container text-on-success-container text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-success" />
            <span>{callStaffSuccess}</span>
          </div>
        )}

        {orderSuccess && (
          <div className="p-3.5 rounded-[16px] bg-primary-container text-on-primary-container text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
            <span>{orderSuccess}</span>
          </div>
        )}

        {extensionSuccess && (
          <div className="p-3.5 rounded-[16px] bg-warning-container text-on-warning-container text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-warning" />
            <span>{extensionSuccess}</span>
          </div>
        )}

        {/* 1. Live Session Playtime HUD Card */}
        {isOccupied ? (
          <Card variant="container" className="p-4 sm:p-5 relative overflow-hidden border border-outline-variant/40 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div>
                <span className="text-[11px] font-bold text-outline uppercase tracking-wider block">Player</span>
                <h3 className="text-base font-black text-on-surface flex items-center gap-1.5">
                  <span>{session.customerName}</span>
                  <Flame className="w-4 h-4 text-primary fill-current" />
                </h3>
              </div>
              <Badge variant={session.isOvertime ? 'error' : session.isWarning ? 'warning' : 'primary'}>
                {session.isOvertime ? 'OVERTIME' : session.status}
              </Badge>
            </div>

            {/* Big Countdown Timer HUD */}
            <div className="py-4 text-center">
              <span className="text-xs text-on-surface-variant font-medium block mb-1">
                {session.isOvertime ? 'Overtime Elapsed' : 'Time Remaining'}
              </span>

              <div className="flex items-center justify-center gap-1 font-mono font-black tabular-nums">
                <span className={`text-3xl sm:text-4xl ${session.isOvertime ? 'text-error animate-pulse' : session.isWarning ? 'text-warning animate-pulse' : 'text-primary'}`}>
                  {session.isOvertime
                    ? `+${Math.floor(session.billableOvertimeMinutes || 0)}m`
                    : `${Math.floor(session.remainingMinutes / 60)}h ${session.remainingMinutes % 60}m`}
                </span>
              </div>

              {session.isOvertime && (
                <p className="text-xs font-semibold text-error mt-1">
                  Extra charge: +₹{session.overtimeFee} accrued
                </p>
              )}

              {/* Progress Summary */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-outline-variant/30 text-xs text-on-surface-variant">
                <div>
                  <span className="block text-[10px] text-outline">Played Time</span>
                  <span className="font-semibold text-on-surface">{session.elapsedMinutes} mins</span>
                </div>
                <div>
                  <span className="block text-[10px] text-outline">Booked Time</span>
                  <span className="font-semibold text-on-surface">{session.bookedMinutes} mins</span>
                </div>
              </div>
            </div>

            {/* Quick Extension Buttons */}
            <div className="pt-2 border-t border-outline-variant/30">
              <span className="text-[11px] font-bold text-on-surface block mb-2">Request Extension</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRequestExtension(15)}
                  disabled={isExtending}
                  className="py-1.5 px-2 rounded-[10px] bg-surface-container-high border border-outline-variant/40 hover:border-primary text-xs font-semibold text-on-surface transition-all cursor-pointer"
                >
                  +15 Mins
                </button>
                <button
                  type="button"
                  onClick={() => handleRequestExtension(30)}
                  disabled={isExtending}
                  className="py-1.5 px-2 rounded-[10px] bg-surface-container-high border border-outline-variant/40 hover:border-primary text-xs font-semibold text-on-surface transition-all cursor-pointer"
                >
                  +30 Mins
                </button>
                <button
                  type="button"
                  onClick={() => handleRequestExtension(60)}
                  disabled={isExtending}
                  className="py-1.5 px-2 rounded-[10px] bg-surface-container-high border border-outline-variant/40 hover:border-primary text-xs font-semibold text-on-surface transition-all cursor-pointer"
                >
                  +1 Hour
                </button>
              </div>
            </div>
          </Card>
        ) : (
          <Card variant="container" className="p-5 text-center space-y-2 border border-outline-variant/40">
            <span className="w-3 h-3 rounded-full bg-success inline-block animate-ping" />
            <h3 className="text-base font-bold text-on-surface">Station Available</h3>
            <p className="text-xs text-on-surface-variant">
              This station is currently ready. Head to the front counter to check in and start your gaming session!
            </p>
            <div className="pt-2 text-xs font-semibold text-primary">
              Hourly Rate: ₹{station.hourlyRate}/hr
            </div>
          </Card>
        )}

        {/* 2. Call Floor Staff Assistance */}
        <Card variant="container" className="p-4 border border-outline-variant/40 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-warning-container text-on-warning-container">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-on-surface">Call Staff / Assistance</h4>
              <p className="text-[10px] text-on-surface-variant">Alert floor staff to visit your desk</p>
            </div>
          </div>

          <div className="space-y-2">
            <select
              value={callReason}
              onChange={(e) => setCallReason(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/50 rounded-[12px] px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="Headset audio issue">🎧 Headset audio issue</option>
              <option value="Mouse / Keyboard stuck">⌨️ Mouse / Keyboard unresponsive</option>
              <option value="Game crashing / Update required">🎮 Game update or crash</option>
              <option value="Clean desk / Sanitization">🧹 Clean desk request</option>
              <option value="General counter question">❓ Counter question / Bill help</option>
            </select>

            <Button
              type="button"
              variant="tonal"
              onClick={handleCallStaff}
              disabled={isCallingStaff}
              className="w-full font-bold text-xs"
            >
              <Bell className="w-3.5 h-3.5 text-warning" />
              <span>{isCallingStaff ? 'Alerting...' : 'Alert Staff to My Desk'}</span>
            </Button>
          </div>
        </Card>

        {/* 3. In-Seat Food & Drink Counter Menu */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span>Order Food & Drinks to Desk</span>
            </h4>
            <span className="text-[10px] text-on-surface-variant">Delivered to {station.name}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {menu.map((item) => {
              const inCartQty = cart[item.id]?.qty || 0;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-[16px] bg-surface-container border border-outline-variant/40 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{item.emoji || '🍔'}</span>
                    <div>
                      <span className="font-bold text-xs text-on-surface block leading-tight">{item.name}</span>
                      <span className="text-xs font-semibold text-success tabular-nums">₹{item.price}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-surface-container-high rounded-full p-0.5 border border-outline-variant/30">
                    <button
                      type="button"
                      onClick={() => updateQty(item, -1)}
                      disabled={inCartQty === 0}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold tabular-nums text-on-surface">
                      {inCartQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(item, 1)}
                      className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Submit Panel (Shows if items added) */}
          {cartCount > 0 && (
            <Card variant="lowest" className="p-4 border-2 border-primary/40 space-y-3 sticky bottom-4 shadow-2xl bg-surface-container-high animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-on-surface">
                  Selected Items ({cartCount}):
                </span>
                <span className="font-black text-sm text-success tabular-nums">
                  ₹{cartTotal}
                </span>
              </div>

              <input
                type="text"
                placeholder="Special notes (e.g. Extra cold, no ice)"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/50 rounded-[10px] px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
              />

              <Button
                type="button"
                variant="filled"
                onClick={handleOrderSnacks}
                disabled={isSubmittingOrder}
                className="w-full font-bold text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingOrder ? 'Submitting Order...' : `Order to Desk (Pay ₹${cartTotal} at Counter)`}</span>
              </Button>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
