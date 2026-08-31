'use client';

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Leaflet touches `window` at import time, so it must be loaded client-only.
const LiveMap = dynamic(() => import('@/components/LiveMap').then((m) => m.LiveMap), { ssr: false });

export default function LiveMapPage() {
  return (
    <div className="flex h-full flex-col">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Live Map</h1>
      <p className="mb-6 text-sm text-slate-500">
        Buses update in real time over WebSocket as drivers report their GPS position. Green = empty, amber =
        moderate, red = full.
      </p>
      <div className="h-[70vh] overflow-hidden rounded-xl border border-slate-200">
        <LiveMap />
      </div>
    </div>
  );
}
