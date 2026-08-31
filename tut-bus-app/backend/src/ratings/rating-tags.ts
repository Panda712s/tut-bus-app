import { RatingDirection } from '@prisma/client';

/** Structured feedback tags a rider can attach to a driver rating. */
export const STUDENT_TO_DRIVER_TAGS = [
  'SAFE_DRIVING',
  'ON_TIME',
  'CLEAN_BUS',
  'COURTEOUS',
  'SMOOTH_RIDE',
  'RECKLESS',
  'LATE',
  'OVERCROWDED',
  'RUDE',
  'SKIPPED_STOP',
] as const;

/** Tags a driver can attach when rating how a trip went. */
export const DRIVER_TO_TRIP_TAGS = [
  'SMOOTH',
  'HEAVY_TRAFFIC',
  'ROADWORKS',
  'OVERCROWDED',
  'PASSENGER_ISSUE',
  'VEHICLE_ISSUE',
  'ON_SCHEDULE',
  'BEHIND_SCHEDULE',
] as const;

export function allowedTagsFor(direction: RatingDirection): readonly string[] {
  return direction === RatingDirection.STUDENT_TO_DRIVER
    ? STUDENT_TO_DRIVER_TAGS
    : DRIVER_TO_TRIP_TAGS;
}
