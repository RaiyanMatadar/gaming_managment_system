import React, { useState } from 'react';
import { X, Play, Clock, ArrowRightLeft, CreditCard, PlusCircle, CheckCircle, Smartphone, Banknote } from 'lucide-react';

/**
 * Modal to initiate a new gaming session
 */
export function StartSessionModal({ station, onClose, onSubmit, isSubmitting }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [durationMins, setDurationMins] = useState(60);

  const durationOptions = [30, 60, 120, 180];
  const estimatedCost = Math.round((durationMins / 60) * station.hourlyRate);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      stationId: station._id,
      customerName: customerName.trim() || 'Guest',
      customerPhone: customerPhone.trim(),
      bookedMinutes: Number(durationMins)
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Start New Session</h3>
            <p className="text-xs text-slate-400">{station.name} • ₹{station.hourlyRate}/hour</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Customer Name</label>
            <input
              type="text"
              placeholder="e.g. Alex (or leave blank for Guest)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Customer Phone (Optional)</label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Session Duration</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {durationOptions.map((mins) => (
                <button
                  type="button"
                  key={mins}
                  onClick={() => setDurationMins(mins)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    durationMins === mins
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Custom minutes:</span>
              <input
                type="number"
                min="15"
                max="720"
                value={durationMins}
                onChange={(e) => setDurationMins(Math.max(1, Number(e.target.value)))}
                className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white text-center focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Pricing Preview Banner */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">Estimated Base Package:</span>
            <span className="text-base font-bold text-emerald-400">₹{estimatedCost}</span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? 'Starting...' : 'Confirm & Start'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal to extend an active session
 */
export function ExtendSessionModal({ sessionId, stationName, onClose, onSubmit, isSubmitting }) {
  const [addedMinutes, setAddedMinutes] = useState(30);
  const options = [15, 30, 60, 120];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(sessionId, addedMinutes);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Extend Session</h3>
            <p className="text-xs text-slate-400">{stationName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Extra Time</label>
            <div className="grid grid-cols-4 gap-2">
              {options.map((mins) => (
                <button
                  type="button"
                  key={mins}
                  onClick={() => setAddedMinutes(mins)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    addedMinutes === mins
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  +{mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-blue-600/30"
            >
              {isSubmitting ? 'Extending...' : `Add +${addedMinutes} Mins`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal to transfer session to another station
 */
export function TransferSessionModal({ sessionId, currentStationName, availableStations = [], onClose, onSubmit, isSubmitting }) {
  const [targetStationId, setTargetStationId] = useState(availableStations[0]?._id || '');
  const [reason, setReason] = useState('Customer preference');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetStationId) return;
    onSubmit(sessionId, targetStationId, reason);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Transfer Station</h3>
            <p className="text-xs text-slate-400">Moving session from {currentStationName}</p>
          </div>
        </div>

        {availableStations.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-amber-400 font-medium">No available stations for transfer.</p>
            <p className="text-xs text-slate-500 mt-1">Please wait for another station to be released.</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-slate-800 rounded-xl text-xs font-semibold text-slate-300"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Destination Station</label>
              <select
                value={targetStationId}
                onChange={(e) => setTargetStationId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {availableStations.map((st) => (
                  <option key={st._id} value={st._id}>
                    {st.name} ({st.type.replace('_', ' ')}) — ₹{st.hourlyRate}/hr
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reason for Transfer</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Mouse issue, moving closer to friends"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-purple-600/30"
              >
                {isSubmitting ? 'Transferring...' : 'Confirm Transfer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/**
 * Modal to checkout, settle itemized bill, record Cash/UPI payment, and release station
 */
export function CheckoutModal({ sessionId, stationName, liveSession, onClose, onSubmit, isSubmitting }) {
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashTendered, setCashTendered] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [discount, setDiscount] = useState(0);

  // Compute estimated bill
  const baseRate = liveSession?.hourlyRate || 100;
  const bookedMinutes = liveSession?.bookedMinutes || 60;
  const baseFee = Math.round((bookedMinutes / 60) * baseRate);
  const overtimeFee = liveSession?.overtimeFee || 0;
  const subtotal = baseFee + overtimeFee;
  const cleanDiscount = Math.max(0, Number(discount) || 0);
  const totalPayable = Math.max(0, subtotal - cleanDiscount);

  const tendered = Number(cashTendered) || totalPayable;
  const changeDue = Math.max(0, tendered - totalPayable);

  const handleSubmit = (e) => {
    e.preventDefault();
    const idempotencyKey = `pay_${sessionId}_${Date.now()}`;
    onSubmit({
      sessionId,
      discount: cleanDiscount,
      payment: {
        amount: totalPayable,
        paymentMethod,
        referenceNumber: paymentMethod === 'UPI' ? upiRef.trim() : '',
        idempotencyKey
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Checkout & Settle</h3>
            <p className="text-xs text-slate-400">{stationName} • {liveSession?.customerName || 'Guest'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Itemized Breakdown Box */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Base Duration ({bookedMinutes}m):</span>
              <span className="text-white font-medium">₹{baseFee}</span>
            </div>

            {overtimeFee > 0 ? (
              <div className="flex justify-between text-red-400 font-semibold">
                <span>Overtime ({liveSession.billableOvertimeMinutes}m billable):</span>
                <span>+₹{overtimeFee}</span>
              </div>
            ) : (
              <div className="flex justify-between text-emerald-400">
                <span>Overtime:</span>
                <span>₹0 (Grace Period)</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
              <span className="text-slate-400">Discount (₹):</span>
              <input
                type="number"
                min="0"
                max={subtotal}
                value={discount}
                onChange={(e) => setDiscount(Math.min(subtotal, Math.max(0, Number(e.target.value))))}
                className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white text-right focus:outline-none"
              />
            </div>

            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
              <span>Total Payable:</span>
              <span className="text-emerald-400">₹{totalPayable}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'UPI'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>UPI (QR / GPay)</span>
              </button>
            </div>
          </div>

          {/* Cash Input */}
          {paymentMethod === 'CASH' && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Cash Tendered:</span>
                <input
                  type="number"
                  placeholder={String(totalPayable)}
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white text-right focus:outline-none focus:border-emerald-500"
                />
              </div>
              {tendered > totalPayable && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800 font-semibold text-amber-400">
                  <span>Change to Return:</span>
                  <span>₹{changeDue}</span>
                </div>
              )}
            </div>
          )}

          {/* UPI Reference Input */}
          {paymentMethod === 'UPI' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">UPI Ref / Transaction #</label>
              <input
                type="text"
                placeholder="e.g. UPI3492840192"
                value={upiRef}
                onChange={(e) => setUpiRef(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Finalizing...' : `Settle & Release (₹${totalPayable})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal to add a new station
 */
export function AddStationModal({ onClose, onSubmit, isSubmitting }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('PC_STANDARD');
  const [hourlyRate, setHourlyRate] = useState(120);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      type,
      hourlyRate: Number(hourlyRate)
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-4">Add Gaming Station</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Station Name / Number</label>
            <input
              type="text"
              required
              placeholder="e.g. PC-11, PS5-03"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Station Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="PC_STANDARD">PC Standard</option>
              <option value="PC_VIP">PC VIP (RTX 4080)</option>
              <option value="PS5">PlayStation 5</option>
              <option value="XBOX">Xbox Series X</option>
              <option value="VR">VR Simulator</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hourly Rate (₹)</label>
            <input
              type="number"
              min="0"
              required
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-blue-600/30"
            >
              {isSubmitting ? 'Creating...' : 'Create Station'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
