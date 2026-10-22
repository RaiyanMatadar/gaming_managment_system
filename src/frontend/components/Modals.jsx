import React, { useState } from 'react';
import {
  Play,
  ArrowRightLeft,
  CreditCard,
  PlusCircle,
  CheckCircle,
  Smartphone,
  Banknote,
  Clock,
  User,
  Phone,
  AlertTriangle,
  Trash2,
  XCircle,
  Plus,
  Minus
} from 'lucide-react';
import { Modal, Button, Input, Select, Card, Badge } from './ui/index.js';

/**
 * Modal to start a new gaming session
 * Redesigned with professional visual hierarchy, grouped form fields, and high-contrast styling.
 */
export function StartSessionModal({ station, onClose, onSubmit, isSubmitting }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [durationMins, setDurationMins] = useState(60);

  const durationOptions = [
    { label: '30m', title: '30 Mins', mins: 30 },
    { label: '1h', title: '1 Hour', mins: 60 },
    { label: '2h', title: '2 Hours', mins: 120 },
    { label: '3h', title: '3 Hours', mins: 180 }
  ];

  const hourlyRate = station?.hourlyRate || 100;
  const estimatedCost = Math.round((durationMins / 60) * hourlyRate);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      stationId: station._id,
      customerName: customerName.trim() || 'Guest',
      customerPhone: customerPhone.trim(),
      bookedMinutes: Number(durationMins)
    });
  };

  const adjustMinutes = (delta) => {
    setDurationMins((prev) => Math.max(15, Math.min(720, prev + delta)));
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-md"
      title="Start Gaming Session"
      subtitle={`${station?.name || 'Computer'} • ₹${hourlyRate}/hr`}
      icon={Play}
      iconColor="text-primary bg-primary-container"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hardware Status Strip */}
        <div className="flex items-center justify-between px-3 py-2 rounded-[10px] bg-surface-container border border-outline-variant/40 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="font-semibold text-on-surface">{station?.name}</span>
            <span className="text-on-surface-variant">({station?.type?.replace('_', ' ') || 'Standard PC'})</span>
          </div>
          <Badge variant="primary" size="xs">
            ₹{hourlyRate}/hr
          </Badge>
        </div>

        {/* Section 1: Customer Details */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
            <User className="w-3.5 h-3.5 text-primary" />
            <span>Player Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                Player Name
              </label>
              <Input
                type="text"
                placeholder="e.g. Alex (or Guest)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                Phone Number <span className="text-on-surface-variant/60">(Optional)</span>
              </label>
              <Input
                type="tel"
                placeholder="e.g. 9876543210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Session Duration */}
        <div className="space-y-3 pt-2 border-t border-outline-variant/30">
          <div className="flex items-center justify-between text-xs font-semibold text-on-surface">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Select Duration</span>
            </div>
            <span className="text-[11px] font-normal text-on-surface-variant">
              {durationMins >= 60 ? `${(durationMins / 60).toFixed(1)} hrs` : `${durationMins} mins`}
            </span>
          </div>

          {/* Quick preset pills */}
          <div className="grid grid-cols-4 gap-2">
            {durationOptions.map((opt) => {
              const isSelected = durationMins === opt.mins;
              const cost = Math.round((opt.mins / 60) * hourlyRate);
              return (
                <button
                  type="button"
                  key={opt.mins}
                  onClick={() => setDurationMins(opt.mins)}
                  className={`py-2 px-1 rounded-[10px] text-center border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-container text-on-primary-container border-primary font-semibold shadow-sm'
                      : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/50 hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="block text-xs font-bold leading-tight">{opt.title}</span>
                  <span className={`block text-[10px] mt-0.5 tabular-nums ${isSelected ? 'text-on-primary-container/80' : 'text-on-surface-variant/70'}`}>
                    ₹{cost}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Duration Stepper */}
          <div className="flex items-center justify-between p-2 rounded-[10px] bg-surface-container-lowest border border-outline-variant/40 text-xs">
            <span className="text-on-surface-variant pl-1">Custom Time:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => adjustMinutes(-15)}
                className="w-7 h-7 rounded-md bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 flex items-center justify-center text-on-surface transition-colors"
                title="Subtract 15 mins"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <Input
                type="number"
                min="15"
                max="720"
                step="5"
                fullWidth={false}
                size="sm"
                value={durationMins}
                onChange={(e) => setDurationMins(Math.max(1, Number(e.target.value)))}
                className="w-20 text-center font-mono tabular-nums font-semibold"
              />
              <span className="text-[11px] text-on-surface-variant pr-1">min</span>
              <button
                type="button"
                onClick={() => adjustMinutes(15)}
                className="w-7 h-7 rounded-md bg-surface-container hover:bg-surface-container-high border border-outline-variant/50 flex items-center justify-center text-on-surface transition-colors"
                title="Add 15 mins"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Summary Card */}
        <div className="p-3.5 rounded-[12px] bg-surface-container-lowest border border-outline-variant/40 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-on-surface-variant block">Estimated Bill Total</span>
            <span className="text-xs text-on-surface-variant font-medium">
              {durationMins}m @ ₹{hourlyRate}/hr
            </span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-success tabular-nums leading-none block">
              ₹{estimatedCost}
            </span>
            <span className="text-[10px] text-on-surface-variant/70 mt-0.5 block">
              Collect at checkout
            </span>
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="flex gap-2.5 pt-2">
          <Button
            type="button"
            variant="tonal"
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="filled"
            disabled={isSubmitting}
            className="flex-1"
          >
            <Play className="w-4 h-4 fill-current mr-1" />
            <span>{isSubmitting ? 'Starting...' : 'Start Session'}</span>
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
      iconColor="text-primary bg-primary-container"
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
                className={`py-2.5 rounded-[10px] text-xs font-semibold border transition-all cursor-pointer ${
                  addedMinutes === mins
                    ? 'bg-primary-container text-on-primary-container border-primary shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/50 hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                +{mins >= 60 ? `${mins / 60}h` : `${mins}m`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2.5 pt-2">
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
      iconColor="text-tertiary bg-tertiary-container"
    >
      {availableStations.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-warning font-medium">No computers available to move to.</p>
          <p className="text-xs text-on-surface-variant mt-1">Please wait for another computer to become free.</p>
          <Button onClick={onClose} variant="tonal" className="mt-4">
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5">Choose New Computer</label>
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
            <label className="block text-xs font-semibold text-on-surface mb-1.5">Reason for Moving</label>
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Mouse issue, sitting next to friends"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
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
 * Confirmation dialog to cancel an active gaming session
 */
export function CancelSessionModal({ isOpen, stationName, customerName, onClose, onConfirm, isSubmitting }) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-md"
      title="Cancel Active Session"
      subtitle={`Station: ${stationName || 'Computer'}`}
      icon={AlertTriangle}
      iconColor="text-error bg-error-container"
    >
      <div className="space-y-4">
        <p className="text-sm text-on-surface">
          Are you sure you want to cancel the session for <strong className="text-on-surface font-bold">{customerName || 'Guest'}</strong> on <strong className="text-on-surface font-bold">{stationName || 'this computer'}</strong>?
        </p>

        <div className="p-3.5 rounded-[12px] bg-surface-container-lowest border border-outline-variant/40 space-y-2 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2 text-error font-medium">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Active timer will stop immediately</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-outline shrink-0 ml-1.5" />
            <span>No further usage or overtime fees will accumulate.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-outline shrink-0 ml-1.5" />
            <span>Session will be recorded as Cancelled in history.</span>
          </div>
          <div className="flex items-center gap-2 text-success font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0 ml-1.5" />
            <span>Computer will be released and marked as Available.</span>
          </div>
        </div>

        <div className="flex gap-2.5 pt-2">
          <Button type="button" variant="tonal" onClick={onClose} className="flex-1" disabled={isSubmitting}>
            Keep Playing
          </Button>
          <Button type="button" variant="error" onClick={onConfirm} className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Cancelling...' : 'Yes, Cancel Session'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Confirmation dialog to delete a computer from fleet
 */
export function DeleteStationModal({ isOpen, station, onClose, onConfirm, isSubmitting }) {
  if (!isOpen || !station) return null;
  const isOccupied = station.status === 'OCCUPIED' || !!station.currentSessionId;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-md"
      title="Delete Computer"
      subtitle={`Fleet Management • ${station.name}`}
      icon={Trash2}
      iconColor="text-error bg-error-container"
    >
      <div className="space-y-4">
        {isOccupied ? (
          <div className="p-4 rounded-[12px] bg-warning-container text-on-warning-container text-xs space-y-1.5 border border-warning/40">
            <div className="font-bold flex items-center gap-1.5 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Cannot Delete Active Computer</span>
            </div>
            <p>
              <strong>{station.name}</strong> currently has an active gaming session. You must check out or cancel the active session before deleting this computer from your fleet.
            </p>
          </div>
        ) : (
          <p className="text-sm text-on-surface">
            Are you sure you want to permanently delete <strong className="font-bold">{station.name}</strong> ({station.type?.replace('_', ' ')})?
          </p>
        )}

        <div className="p-3.5 rounded-[12px] bg-surface-container-lowest border border-outline-variant/40 space-y-1.5 text-xs text-on-surface-variant">
          <div className="flex justify-between">
            <span>Hardware Model:</span>
            <span className="font-semibold text-on-surface">{station.type?.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span>Hourly Rate:</span>
            <span className="font-semibold text-on-surface">₹{station.hourlyRate}/hr</span>
          </div>
          <div className="flex justify-between">
            <span>Current Status:</span>
            <span className="font-semibold text-on-surface">{station.status}</span>
          </div>
        </div>

        <div className="flex gap-2.5 pt-2">
          <Button type="button" variant="tonal" onClick={onClose} className="flex-1" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="error"
            onClick={onConfirm}
            className="flex-1"
            disabled={isSubmitting || isOccupied}
          >
            {isSubmitting ? 'Deleting...' : 'Delete Computer'}
          </Button>
        </div>
      </div>
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
      iconColor="text-success bg-success-container"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Itemized Breakdown Box */}
        <Card variant="lowest" className="p-3.5 space-y-2 text-xs border border-outline-variant/40">
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
            <div className="flex justify-between text-success">
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
              className="w-20 bg-surface-container border border-outline-variant/50 rounded-[8px] px-2 py-1 text-xs text-on-surface text-right focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-between text-base font-bold text-on-surface pt-2 border-t border-outline-variant/40">
            <span>Total to pay:</span>
            <span className="text-success tabular-nums">₹{totalPayable}</span>
          </div>
        </Card>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-2">Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              className={`py-2.5 rounded-full text-xs font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                paymentMethod === 'CASH'
                  ? 'bg-success text-on-success border-success shadow-sm'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant/50 hover:text-on-surface'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Cash</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('UPI')}
              className={`py-2.5 rounded-full text-xs font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                paymentMethod === 'UPI'
                  ? 'bg-primary text-on-primary border-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant/50 hover:text-on-surface'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>UPI (QR / GPay)</span>
            </button>
          </div>
        </div>

        {/* Cash Input */}
        {paymentMethod === 'CASH' && (
          <Card variant="lowest" className="p-3 space-y-2 border border-outline-variant/40">
            <div className="flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">Cash given by customer:</span>
              <input
                type="number"
                placeholder={String(totalPayable)}
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                className="w-28 bg-surface-container border border-outline-variant/50 rounded-[8px] px-2.5 py-1 text-xs text-on-surface text-right focus:outline-none focus:border-primary tabular-nums"
              />
            </div>
            {tendered > totalPayable && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-outline-variant/30 font-semibold text-warning">
                <span>Change to return:</span>
                <span className="tabular-nums">₹{changeDue}</span>
              </div>
            )}
          </Card>
        )}

        {/* UPI Reference Input */}
        {paymentMethod === 'UPI' && (
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5">UPI Reference / ID (Optional)</label>
            <Input
              type="text"
              placeholder="e.g. UPI3492840192"
              value={upiRef}
              onChange={(e) => setUpiRef(e.target.value)}
              className="font-mono"
            />
          </div>
        )}

        <div className="flex gap-2.5 pt-2">
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

        <div className="flex gap-2.5 pt-2">
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
