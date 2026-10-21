import React, { useState } from 'react';
import { Play, ArrowRightLeft, CreditCard, PlusCircle, CheckCircle, Smartphone, Banknote } from 'lucide-react';
import { Modal, Button, Input, Select, Card } from './ui/index.js';

/**
 * Modal to start a new gaming session
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
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-md"
      title="Start Session"
      subtitle={`${station.name} • ₹${station.hourlyRate}/hr`}
      icon={Play}
      iconColor="text-primary bg-primary-container/40 border-primary/30"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5">Customer Name</label>
          <Input
            type="text"
            placeholder="e.g. Alex (or leave blank for Guest)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5">Phone Number (optional)</label>
          <Input
            type="tel"
            placeholder="e.g. 9876543210"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5">Play Time</label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {durationOptions.map((mins) => (
              <button
                type="button"
                key={mins}
                onClick={() => setDurationMins(mins)}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  durationMins === mins
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:text-on-surface'
                }`}
              >
                {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant">Custom minutes:</span>
            <Input
              type="number"
              min="15"
              max="720"
              fullWidth={false}
              size="sm"
              value={durationMins}
              onChange={(e) => setDurationMins(Math.max(1, Number(e.target.value)))}
              className="w-24 text-center font-mono"
            />
          </div>
        </div>

        {/* Pricing Preview Banner */}
        <Card variant="lowest" className="p-3 flex items-center justify-between text-xs">
          <span className="text-on-surface-variant">Estimated Price:</span>
          <span className="text-base font-bold text-emerald-400 tabular-nums">₹{estimatedCost}</span>
        </Card>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="tonal" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="filled" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Starting...' : 'Start Session'}
          </Button>
        </div>
      </form>
    </Modal>
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
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-sm"
      title="Add More Time"
      subtitle={stationName}
      icon={PlusCircle}
      iconColor="text-primary bg-primary-container/40 border-primary/30"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-2">Choose how much time to add</label>
          <div className="grid grid-cols-4 gap-2">
            {options.map((mins) => (
              <button
                type="button"
                key={mins}
                onClick={() => setAddedMinutes(mins)}
                className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  addedMinutes === mins
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:text-on-surface'
                }`}
              >
                +{mins >= 60 ? `${mins / 60}h` : `${mins}m`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="tonal" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="filled" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Adding...' : `Add +${addedMinutes} mins`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Modal to move session to another computer
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
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-md"
      title="Move to Another Computer"
      subtitle={`Moving player from ${currentStationName}`}
      icon={ArrowRightLeft}
      iconColor="text-tertiary bg-tertiary-container/40 border-tertiary/30"
    >
      {availableStations.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-amber-400 font-medium">No computers available to move to.</p>
          <p className="text-xs text-on-surface-variant mt-1">Please wait for another computer to become free.</p>
          <Button onClick={onClose} variant="tonal" className="mt-4">
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5">Choose new computer</label>
            <Select
              value={targetStationId}
              onChange={(e) => setTargetStationId(e.target.value)}
            >
              {availableStations.map((st) => (
                <option key={st._id} value={st._id} className="bg-surface-container text-on-surface">
                  {st.name} ({st.type.replace('_', ' ')}) — ₹{st.hourlyRate}/hr
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5">Reason for moving</label>
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Mouse issue, sitting next to friends"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="tonal" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="filled" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Moving...' : 'Move Computer'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/**
 * Modal to checkout, settle payment, record Cash/UPI, and release computer
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
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-md"
      title="Checkout & Payment"
      subtitle={`${stationName} • ${liveSession?.customerName || 'Guest'}`}
      icon={CreditCard}
      iconColor="text-emerald-400 bg-emerald-950/60 border-emerald-500/30"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Itemized Breakdown Box */}
        <Card variant="lowest" className="p-3.5 space-y-2 text-xs">
          <div className="flex justify-between text-on-surface-variant">
            <span>Booked time ({bookedMinutes}m):</span>
            <span className="text-on-surface font-medium tabular-nums">₹{baseFee}</span>
          </div>

          {overtimeFee > 0 ? (
            <div className="flex justify-between text-error font-semibold">
              <span>Extra time ({liveSession.billableOvertimeMinutes}m):</span>
              <span className="tabular-nums">+₹{overtimeFee}</span>
            </div>
          ) : (
            <div className="flex justify-between text-emerald-400">
              <span>Extra time:</span>
              <span>₹0 (On time)</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-outline-variant/30">
            <span className="text-on-surface-variant">Discount (₹):</span>
            <input
              type="number"
              min="0"
              max={subtotal}
              value={discount}
              onChange={(e) => setDiscount(Math.min(subtotal, Math.max(0, Number(e.target.value))))}
              className="w-20 bg-surface-container border border-outline-variant rounded px-2 py-0.5 text-xs text-on-surface text-right focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-between text-base font-bold text-on-surface pt-2 border-t border-outline-variant/40">
            <span>Total to pay:</span>
            <span className="text-emerald-400 tabular-nums">₹{totalPayable}</span>
          </div>
        </Card>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-2">How did they pay?</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              className={`py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                paymentMethod === 'CASH'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:text-on-surface'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Cash</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('UPI')}
              className={`py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                paymentMethod === 'UPI'
                  ? 'bg-primary text-on-primary border-primary shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:text-on-surface'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>UPI (QR / GPay)</span>
            </button>
          </div>
        </div>

        {/* Cash Input */}
        {paymentMethod === 'CASH' && (
          <Card variant="lowest" className="p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">Cash given by customer:</span>
              <input
                type="number"
                placeholder={String(totalPayable)}
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                className="w-28 bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1 text-xs text-on-surface text-right focus:outline-none focus:border-primary tabular-nums"
              />
            </div>
            {tendered > totalPayable && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-outline-variant/30 font-semibold text-amber-400">
                <span>Change to return:</span>
                <span className="tabular-nums">₹{changeDue}</span>
              </div>
            )}
          </Card>
        )}

        {/* UPI Reference Input */}
        {paymentMethod === 'UPI' && (
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5">UPI Transaction ID (optional)</label>
            <Input
              type="text"
              placeholder="e.g. UPI3492840192"
              value={upiRef}
              onChange={(e) => setUpiRef(e.target.value)}
              className="font-mono"
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="tonal" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="success" disabled={isSubmitting} className="flex-1">
            <CheckCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Processing...' : `Complete Payment (₹${totalPayable})`}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Modal to add a new computer or console
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
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-sm"
      title="Add New Computer"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5">Computer or Console Name</label>
          <Input
            type="text"
            required
            placeholder="e.g. PC-11, PS5-03"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5">Device Type</label>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="PC_STANDARD" className="bg-surface-container text-on-surface">Standard PC</option>
            <option value="PC_VIP" className="bg-surface-container text-on-surface">VIP PC (High-end)</option>
            <option value="PS5" className="bg-surface-container text-on-surface">PlayStation 5</option>
            <option value="XBOX" className="bg-surface-container text-on-surface">Xbox Series X</option>
            <option value="VR" className="bg-surface-container text-on-surface">VR Simulator</option>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5">Price per hour (₹)</label>
          <Input
            type="number"
            min="0"
            required
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="tonal" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="filled" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Adding...' : 'Add Computer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
