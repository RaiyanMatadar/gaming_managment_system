import React, { useState } from 'react';
import { Printer, Share2, Check, X, Smartphone, CreditCard, Banknote, ShieldCheck } from 'lucide-react';
import { Button, Modal } from './ui';

export function ThermalReceiptModal({ receipt, currentUser, onClose }) {
  const [paperWidth, setPaperWidth] = useState('80mm'); // '80mm' | '58mm'
  const [copied, setCopied] = useState(false);

  if (!receipt) return null;

  const centerName = currentUser?.centerName || 'GameDash Arena';
  const managerName = currentUser?.name || currentUser?.username || 'Cashier';
  const contactPhone = currentUser?.whatsappNumber || '';

  const {
    receiptNumber = `REC-${Date.now().toString().slice(-6)}`,
    stationName = 'Gaming Station',
    stationType = 'PC',
    customerName = 'Guest',
    customerPhone = null,
    startTime,
    checkoutTime = new Date(),
    bookedMinutes = 60,
    financials = {},
    payments = []
  } = receipt;

  const startDate = startTime ? new Date(startTime) : new Date(Date.now() - bookedMinutes * 60000);
  const endDate = checkoutTime ? new Date(checkoutTime) : new Date();

  const baseFee = financials.baseFee ?? Math.round((bookedMinutes / 60) * (financials.hourlyRate || 100));
  const overtimeFee = financials.overtimeFee ?? 0;
  const overtimeMinutes = financials.billableOvertimeMinutes ?? 0;
  const totalActiveMinutes = financials.totalActiveMinutes ?? bookedMinutes;
  const discount = financials.discount ?? 0;
  const totalAmount = financials.totalAmount ?? (baseFee + overtimeFee - discount);

  const mainPayment = payments && payments.length > 0 ? payments[0] : null;
  const paymentMethod = mainPayment?.paymentMethod || 'CASH';
  const upiRef = mainPayment?.referenceNumber || '';

  // Trigger system print
  const handlePrint = () => {
    window.print();
  };

  // Generate WhatsApp-friendly text receipt
  const handleCopyTextReceipt = () => {
    const text = `🎮 *${centerName} — Official Receipt*
📄 Receipt No: *${receiptNumber}*
📅 Date: ${endDate.toLocaleDateString()} ${endDate.toLocaleTimeString()}
👤 Customer: ${customerName} ${customerPhone ? `(${customerPhone})` : ''}
🖥️ Station: ${stationName} (${stationType})
⏱️ Time Played: ${totalActiveMinutes} mins (Booked: ${bookedMinutes}m)
${overtimeFee > 0 ? `⚠️ Overtime: ${overtimeMinutes}m (+₹${overtimeFee})\n` : ''}${discount > 0 ? `🏷️ Discount: -₹${discount}\n` : ''}💰 *Total Paid: ₹${totalAmount}* (${paymentMethod}${upiRef ? ` - Ref: ${upiRef}` : ''})
🤝 Thank you for gaming with us! GG!`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-md"
      title="Thermal Receipt"
      subtitle={`${stationName} • ${customerName}`}
      icon={Printer}
      iconColor="text-primary bg-primary-container"
    >
      <div className="space-y-4">
        {/* Paper Size Selector & Quick Actions */}
        <div className="flex items-center justify-between no-print">
          <div className="flex rounded-full bg-surface-container p-0.5 border border-outline-variant/40">
            <button
              type="button"
              onClick={() => setPaperWidth('80mm')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                paperWidth === '80mm'
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              80mm Standard
            </button>
            <button
              type="button"
              onClick={() => setPaperWidth('58mm')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                paperWidth === '58mm'
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              58mm Compact
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyTextReceipt}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary-container/20 rounded-full transition-colors cursor-pointer"
            title="Copy text format for WhatsApp"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'WhatsApp Text'}</span>
          </button>
        </div>

        {/* Thermal Slip Simulated Container */}
        <div className="flex justify-center bg-surface-container-low p-3 sm:p-5 rounded-[16px] border border-outline-variant/30 overflow-x-auto">
          <div
            id="thermal-receipt-print-area"
            style={{ width: paperWidth === '80mm' ? '302px' : '220px' }}
            className="bg-white text-black p-4 font-mono text-[11px] leading-tight shadow-md rounded-[4px] border border-neutral-300 transition-all select-all"
          >
            {/* Header */}
            <div className="text-center pb-2 border-b border-dashed border-black">
              <h2 className="font-bold text-sm tracking-wide uppercase">{centerName}</h2>
              <p className="text-[10px] text-neutral-600">GAMING & ESPORTS ARENA</p>
              {contactPhone && <p className="text-[9px] text-neutral-500">Contact: +{contactPhone}</p>}
            </div>

            {/* Metadata */}
            <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold">{receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{endDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span>{endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{managerName}</span>
              </div>
            </div>

            {/* Session Particulars */}
            <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Station:</span>
                <span className="font-bold">{stationName} ({stationType})</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-semibold">{customerName}</span>
              </div>
              {customerPhone && (
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <span>{customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>In / Out:</span>
                <span>
                  {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Played:</span>
                <span>{totalActiveMinutes} mins (Booked: {bookedMinutes}m)</span>
              </div>
            </div>

            {/* Financial Ledger Items */}
            <div className="py-2 border-b border-dashed border-black space-y-1">
              <div className="flex justify-between">
                <span>Base Gaming Fee:</span>
                <span className="tabular-nums">₹{baseFee}</span>
              </div>

              {overtimeFee > 0 && (
                <div className="flex justify-between font-bold">
                  <span>Overtime ({overtimeMinutes}m):</span>
                  <span className="tabular-nums">+₹{overtimeFee}</span>
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span className="tabular-nums">-₹{discount}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-xs pt-1.5 border-t border-black">
                <span>TOTAL PAID:</span>
                <span className="tabular-nums">₹{totalAmount}</span>
              </div>

              <div className="flex justify-between text-[10px] text-neutral-600 pt-0.5">
                <span>Paid via:</span>
                <span className="font-semibold uppercase">{paymentMethod}</span>
              </div>

              {upiRef && (
                <div className="flex justify-between text-[9px] text-neutral-500">
                  <span>UPI Ref:</span>
                  <span className="truncate max-w-[130px]">{upiRef}</span>
                </div>
              )}
            </div>

            {/* Verification Barcode / Stamp */}
            <div className="pt-3 pb-1 text-center space-y-1.5">
              <div className="flex justify-center items-center py-1">
                {/* SVG Barcode Graphic */}
                <svg className="w-36 h-6 opacity-80" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <rect x="0" y="0" width="3" height="20" fill="black" />
                  <rect x="5" y="0" width="2" height="20" fill="black" />
                  <rect x="9" y="0" width="4" height="20" fill="black" />
                  <rect x="15" y="0" width="1" height="20" fill="black" />
                  <rect x="18" y="0" width="3" height="20" fill="black" />
                  <rect x="23" y="0" width="2" height="20" fill="black" />
                  <rect x="27" y="0" width="5" height="20" fill="black" />
                  <rect x="34" y="0" width="2" height="20" fill="black" />
                  <rect x="38" y="0" width="1" height="20" fill="black" />
                  <rect x="41" y="0" width="4" height="20" fill="black" />
                  <rect x="47" y="0" width="2" height="20" fill="black" />
                  <rect x="51" y="0" width="3" height="20" fill="black" />
                  <rect x="56" y="0" width="2" height="20" fill="black" />
                  <rect x="60" y="0" width="4" height="20" fill="black" />
                  <rect x="66" y="0" width="1" height="20" fill="black" />
                  <rect x="69" y="0" width="3" height="20" fill="black" />
                  <rect x="74" y="0" width="2" height="20" fill="black" />
                  <rect x="78" y="0" width="5" height="20" fill="black" />
                  <rect x="85" y="0" width="2" height="20" fill="black" />
                  <rect x="89" y="0" width="3" height="20" fill="black" />
                  <rect x="94" y="0" width="2" height="20" fill="black" />
                  <rect x="98" y="0" width="2" height="20" fill="black" />
                </svg>
              </div>

              <p className="font-bold text-[10px] tracking-widest uppercase">
                *** THANK YOU FOR GAMING! ***
              </p>
              <p className="text-[8px] text-neutral-500">
                Powered by GameDash • Verified POS
              </p>
            </div>
          </div>
        </div>

        {/* Print & Close Actions */}
        <div className="flex gap-2.5 pt-2 no-print">
          <Button type="button" variant="tonal" onClick={onClose} className="flex-1">
            Done
          </Button>
          <Button type="button" variant="filled" onClick={handlePrint} className="flex-1">
            <Printer className="w-4 h-4" />
            <span>Print Thermal Slip</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
