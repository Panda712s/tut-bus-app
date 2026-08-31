-- CreateEnum
CREATE TYPE "StopEventType" AS ENUM ('ARRIVED', 'DEPARTED');

-- CreateEnum
CREATE TYPE "SosStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "DeviationStatus" AS ENUM ('OPEN', 'CLEARED');

-- CreateEnum
CREATE TYPE "RatingDirection" AS ENUM ('STUDENT_TO_DRIVER', 'DRIVER_TO_TRIP');

-- AlterTable
ALTER TABLE "bus_stops" ADD COLUMN     "radiusMeters" INTEGER NOT NULL DEFAULT 60;

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "lastKnownStopId" TEXT;

-- CreateTable
CREATE TABLE "trip_stop_events" (
    "id" TEXT NOT NULL,
    "type" "StopEventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tripId" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,

    CONSTRAINT "trip_stop_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sos_alerts" (
    "id" TEXT NOT NULL,
    "status" "SosStatus" NOT NULL DEFAULT 'ACTIVE',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "raisedByStudentId" TEXT,
    "raisedByDriverId" TEXT,
    "tripId" TEXT,

    CONSTRAINT "sos_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_shares" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "tripId" TEXT NOT NULL,
    "createdByStudentId" TEXT,

    CONSTRAINT "trip_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_deviation_alerts" (
    "id" TEXT NOT NULL,
    "status" "DeviationStatus" NOT NULL DEFAULT 'OPEN',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "distanceMeters" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clearedAt" TIMESTAMP(3),
    "tripId" TEXT NOT NULL,
    "busId" TEXT NOT NULL,

    CONSTRAINT "route_deviation_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_ratings" (
    "id" TEXT NOT NULL,
    "direction" "RatingDirection" NOT NULL,
    "score" INTEGER NOT NULL,
    "tags" TEXT[],
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tripId" TEXT NOT NULL,
    "studentId" TEXT,
    "driverId" TEXT,

    CONSTRAINT "trip_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trip_stop_events_tripId_idx" ON "trip_stop_events"("tripId");

-- CreateIndex
CREATE INDEX "trip_stop_events_stopId_idx" ON "trip_stop_events"("stopId");

-- CreateIndex
CREATE INDEX "sos_alerts_status_idx" ON "sos_alerts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "trip_shares_token_key" ON "trip_shares"("token");

-- CreateIndex
CREATE INDEX "trip_shares_tripId_idx" ON "trip_shares"("tripId");

-- CreateIndex
CREATE INDEX "route_deviation_alerts_status_idx" ON "route_deviation_alerts"("status");

-- CreateIndex
CREATE INDEX "trip_ratings_tripId_idx" ON "trip_ratings"("tripId");

-- AddForeignKey
ALTER TABLE "trip_stop_events" ADD CONSTRAINT "trip_stop_events_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stop_events" ADD CONSTRAINT "trip_stop_events_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "bus_stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_alerts" ADD CONSTRAINT "sos_alerts_raisedByStudentId_fkey" FOREIGN KEY ("raisedByStudentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_alerts" ADD CONSTRAINT "sos_alerts_raisedByDriverId_fkey" FOREIGN KEY ("raisedByDriverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_alerts" ADD CONSTRAINT "sos_alerts_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_shares" ADD CONSTRAINT "trip_shares_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_shares" ADD CONSTRAINT "trip_shares_createdByStudentId_fkey" FOREIGN KEY ("createdByStudentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_deviation_alerts" ADD CONSTRAINT "route_deviation_alerts_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_deviation_alerts" ADD CONSTRAINT "route_deviation_alerts_busId_fkey" FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_ratings" ADD CONSTRAINT "trip_ratings_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_ratings" ADD CONSTRAINT "trip_ratings_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_ratings" ADD CONSTRAINT "trip_ratings_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
