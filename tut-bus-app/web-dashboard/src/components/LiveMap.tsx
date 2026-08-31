'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getGpsSocket } from '@/lib/socket';
import { api } from '@/lib/api';
import type { LiveBus } from '@/lib/types';

// Default TUT Pretoria campus area as the initial map center.
const DEFAULT_CENTER: [number, number] = [-25.7461, 28.1881];

const busIcon = (state: LiveBus['capacityState']) => {
  const color = state === 'FULL' ? '#dc2626' : state === 'MODERATE' ? '#d97706' : '#16a34a';
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 1px ${color}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

export function LiveMap() {
  const [buses, setBuses] = useState<Record<string, LiveBus>>({});

  useEffect(() => {
    api
      .get<LiveBus[]>('/buses/live')
      .then((initial) => {
        const map: Record<string, LiveBus> = {};
        initial.forEach((b) => (map[b.id] = b));
        setBuses(map);
      })
      .catch(() => undefined);

    const socket = getGpsSocket();
    const onLocation = (payload: any) => {
      setBuses((prev) => ({
        ...prev,
        [payload.busId]: {
          id: payload.busId,
          busNumber: payload.busNumber,
          currentLat: payload.lat,
          currentLng: payload.lng,
          heading: payload.heading,
          speedKmh: payload.speedKmh,
          lastLocationAt: payload.timestamp,
          capacityState: payload.capacityState,
          passengerCount: payload.passengerCount,
          capacity: prev[payload.busId]?.capacity ?? 60,
          currentRouteId: payload.routeId,
        },
      }));
    };
    socket.on('bus:location', onLocation);
    return () => {
      socket.off('bus:location', onLocation);
    };
  }, []);

  const busList = useMemo(
    () => Object.values(buses).filter((b) => typeof b.currentLat === 'number' && typeof b.currentLng === 'number'),
    [buses],
  );

  return (
    <MapContainer center={DEFAULT_CENTER} zoom={12} scrollWheelZoom className="h-full w-full rounded-xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {busList.map((bus) => (
        <Marker key={bus.id} position={[bus.currentLat as number, bus.currentLng as number]} icon={busIcon(bus.capacityState)}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{bus.busNumber}</p>
              <p>Passengers: {bus.passengerCount}/{bus.capacity} ({bus.capacityState})</p>
              {bus.speedKmh != null && <p>Speed: {bus.speedKmh.toFixed(0)} km/h</p>}
              {bus.lastLocationAt && <p className="text-slate-400">Updated {new Date(bus.lastLocationAt).toLocaleTimeString()}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
