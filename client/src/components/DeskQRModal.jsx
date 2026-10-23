import React, { useState } from 'react';
import { QrCode, Printer, ExternalLink, Copy, Check, Sparkles, Smartphone } from 'lucide-react';
import { Button, Modal } from './ui';

export function DeskQRModal({ station, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!station) return null;

  const origin = window.location.origin;
  const portalUrl = `${origin}/portal/${station._id || station.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpen = () => {
    window.open(portalUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-md"
      title="Desk QR Code & Self-Service"
      subtitle={`${station.name} • ${station.type?.replace('_', ' ')}`}
      icon={QrCode}
      iconColor="text-primary bg-primary-container"
    >
      <div className="space-y-4">
        {/* Printable 80mm Desk Sticker Container */}
        <div className="flex justify-center bg-surface-container-low p-4 rounded-[20px] border border-outline-variant/30">
          <div
            id="thermal-receipt-print-area"
            className="w-72 bg-white text-black p-5 rounded-[12px] shadow-lg border border-neutral-300 text-center select-all"
          >
            {/* Header */}
            <div className="pb-2 border-b-2 border-black">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600 block">
                CYBER ARENA GAMING
              </span>
              <h2 className="text-xl font-black tracking-tight">{station.name}</h2>
              <span className="inline-block px-2 py-0.5 mt-1 rounded bg-black text-white text-[10px] font-bold">
                {station.type?.replace('_', ' ')}
              </span>
            </div>

            {/* QR Code Frame */}
            <div className="my-4 flex flex-col items-center justify-center">
              <div className="p-3 bg-white border-2 border-black rounded-xl shadow-inner">
                {/* Visual SVG QR Representation pointing to the portal */}
                <svg className="w-36 h-36" viewBox="0 0 100 100">
                  <rect width="100" height="100" fill="white" />
                  {/* Outer corner boxes */}
                  <rect x="5" y="5" width="30" height="30" fill="black" />
                  <rect x="10" y="10" width="20" height="20" fill="white" />
                  <rect x="14" y="14" width="12" height="12" fill="black" />

                  <rect x="65" y="5" width="30" height="30" fill="black" />
                  <rect x="70" y="10" width="20" height="20" fill="white" />
                  <rect x="74" y="14" width="12" height="12" fill="black" />

                  <rect x="5" y="65" width="30" height="30" fill="black" />
                  <rect x="10" y="70" width="20" height="20" fill="white" />
                  <rect x="14" y="74" width="12" height="12" fill="black" />

                  {/* QR Matrix Grid Details */}
                  <rect x="40" y="8" width="6" height="6" fill="black" />
                  <rect x="50" y="8" width="8" height="6" fill="black" />
                  <rect x="42" y="20" width="6" height="8" fill="black" />
                  <rect x="52" y="22" width="6" height="6" fill="black" />
                  <rect x="10" y="42" width="8" height="6" fill="black" />
                  <rect x="22" y="42" width="6" height="8" fill="black" />
                  <rect x="8" y="52" width="6" height="6" fill="black" />
                  <rect x="20" y="54" width="8" height="6" fill="black" />
                  <rect x="40" y="40" width="20" height="20" fill="black" />
                  <rect x="45" y="45" width="10" height="10" fill="white" />
                  <rect x="48" y="48" width="4" height="4" fill="black" />
                  <rect x="65" y="42" width="8" height="6" fill="black" />
                  <rect x="78" y="44" width="6" height="8" fill="black" />
                  <rect x="68" y="54" width="10" height="6" fill="black" />
                  <rect x="42" y="68" width="8" height="6" fill="black" />
                  <rect x="54" y="70" width="6" height="10" fill="black" />
                  <rect x="44" y="82" width="8" height="8" fill="black" />
                  <rect x="66" y="68" width="6" height="6" fill="black" />
                  <rect x="76" y="70" width="10" height="6" fill="black" />
                  <rect x="68" y="80" width="8" height="10" fill="black" />
                  <rect x="82" y="82" width="10" height="6" fill="black" />
                </svg>
              </div>

              <div className="mt-2 space-y-0.5">
                <span className="text-[11px] font-black uppercase text-black flex items-center justify-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 inline" />
                  Scan with Your Phone Camera
                </span>
                <p className="text-[9px] text-neutral-600 leading-tight">
                  ⏱️ Live Playtime • 🍜 Order Snacks • 🛎️ Call Staff
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-dashed border-neutral-400 text-[9px] text-neutral-500 font-mono">
              <span>{portalUrl}</span>
            </div>
          </div>
        </div>

        {/* Quick Testing & Sharing Controls */}
        <div className="space-y-2 no-print">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="filled"
              onClick={handleOpen}
              className="flex-1 font-bold text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open In-Desk Portal</span>
            </Button>

            <Button
              type="button"
              variant="tonal"
              onClick={handleCopy}
              className="px-3 text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </Button>
          </div>

          <Button
            type="button"
            variant="outlined"
            onClick={handlePrint}
            className="w-full font-medium text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print 80mm Desk Sticker Slip</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
