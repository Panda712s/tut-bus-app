import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RatingDirection, TripStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { haversineMeters } from '../common/geo/geo.util';
import { DriversService } from '../drivers/drivers.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { allowedTagsFor } from './rating-tags';

@Injectable()
export class RatingsService {
  constructor(
    private prisma: PrismaService,
    private drivers: DriversService,
  ) {}

  async submit(user: AuthenticatedUser, dto: CreateRatingDto) {
    const trip = await this.prisma.trip.findUnique({ where: { id: dto.tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    const direction =
      user.role === 'DRIVER' ? RatingDirection.DRIVER_TO_TRIP : RatingDirection.STUDENT_TO_DRIVER;

    if (direction === RatingDirection.DRIVER_TO_TRIP && trip.driverId !== user.id) {
      throw new BadRequestException('You can only rate your own trips');
    }
    if (direction === RatingDirection.STUDENT_TO_DRIVER) {
      const boarded = await this.prisma.tripHistory.findFirst({
        where: { tripId: dto.tripId, studentId: user.id },
      });
      if (!boarded) throw new BadRequestException('You can only rate a trip you boarded');
    }

    const allowed = allowedTagsFor(direction);
    const tags = (dto.tags ?? []).filter((t) => allowed.includes(t));
    if ((dto.tags ?? []).some((t) => !allowed.includes(t))) {
      throw new BadRequestException(`Unknown tag(s). Allowed: ${allowed.join(', ')}`);
    }

    const existing = await this.prisma.tripRating.findFirst({
      where: {
        tripId: dto.tripId,
        direction,
        ...(direction === RatingDirection.STUDENT_TO_DRIVER
          ? { studentId: user.id }
          : { driverId: user.id }),
      },
    });

    const data = {
      direction,
      score: dto.score,
      tags,
      comment: dto.comment,
      tripId: dto.tripId,
      studentId: direction === RatingDirection.STUDENT_TO_DRIVER ? user.id : undefined,
      driverId: direction === RatingDirection.DRIVER_TO_TRIP ? user.id : trip.driverId,
    };

    const rating = existing
      ? await this.prisma.tripRating.update({ where: { id: existing.id }, data })
      : await this.prisma.tripRating.create({ data });

    // Keep the legacy Feedback table (which the analytics overview reads) in
    // sync for rider -> driver ratings.
    if (direction === RatingDirection.STUDENT_TO_DRIVER) {
      const legacy = await this.prisma.feedback.findFirst({
        where: { tripId: dto.tripId, studentId: user.id, category: 'DRIVER_RATING' },
      });
      const legacyData = {
        category: 'DRIVER_RATING' as const,
        rating: dto.score,
        comment: dto.comment,
        studentId: user.id,
        tripId: dto.tripId,
      };
      if (legacy) {
        await this.prisma.feedback.update({ where: { id: legacy.id }, data: legacyData });
      } else {
        await this.prisma.feedback.create({ data: legacyData });
      }
    }

    return rating;
  }

  forTrip(tripId: string) {
    return this.prisma.tripRating.findMany({
      where: { tripId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Recent ratings across all trips - for the admin feedback view. */
  recent(limit = 50) {
    return this.prisma.tripRating.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
      include: {
        student: { select: { fullName: true, studentNumber: true } },
        driver: { select: { fullName: true } },
        trip: { select: { id: true, route: { select: { name: true } } } },
      },
    });
  }

  /** Rating & tag breakdown for a driver - powers the driver stats screen. */
  async driverSummary(driverId: string) {
    const driver = await this.drivers.findOne(driverId);

    const [tripsCompleted, ratings] = await Promise.all([
      this.prisma.trip.count({ where: { driverId, status: TripStatus.COMPLETED } }),
      this.prisma.tripRating.findMany({
        where: { driverId, direction: RatingDirection.STUDENT_TO_DRIVER },
        select: { score: true, tags: true, createdAt: true },
      }),
    ]);

    const count = ratings.length;
    const average = count ? ratings.reduce((s, r) => s + r.score, 0) / count : null;

    const cutoff = Date.now() - 30 * 24 * 3600_000;
    const recent = ratings.filter((r) => r.createdAt.getTime() >= cutoff);
    const last30dAverage = recent.length
      ? recent.reduce((s, r) => s + r.score, 0) / recent.length
      : null;

    const tagCounts: Record<string, number> = {};
    for (const r of ratings) {
      for (const t of r.tags) tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }

    const distribution = [1, 2, 3, 4, 5].map((star) => ({
      star,
      count: ratings.filter((r) => r.score === star).length,
    }));

    return {
      driverId,
      driverName: driver.fullName,
      tripsCompleted,
      ratingCount: count,
      averageScore: average === null ? null : Number(average.toFixed(2)),
      last30dAverage: last30dAverage === null ? null : Number(last30dAverage.toFixed(2)),
      distribution,
      topTags: Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([tag, n]) => ({ tag, count: n })),
    };
  }

  /** Post-trip receipt: route, timing, distance, stops served, ratings. */
  async receipt(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bus: { select: { busNumber: true, plateNumber: true, capacity: true } },
        route: { select: { name: true, origin: true, destination: true } },
        driver: { select: { id: true, fullName: true } },
        gpsLogs: { orderBy: { recordedAt: 'asc' }, select: { lat: true, lng: true, recordedAt: true } },
        stopEvents: {
          where: { type: 'ARRIVED' },
          orderBy: { occurredAt: 'asc' },
          include: { stop: { select: { name: true } } },
        },
        ratings: { select: { direction: true, score: true, tags: true, comment: true } },
        _count: { select: { tripHistories: true } },
      },
    });
    if (!trip) throw new NotFoundException('Trip not found');

    let distanceMeters = 0;
    for (let i = 1; i < trip.gpsLogs.length; i++) {
      distanceMeters += haversineMeters(trip.gpsLogs[i - 1], trip.gpsLogs[i]);
    }

    const start = trip.startedAt ?? trip.createdAt;
    const end = trip.endedAt ?? (trip.gpsLogs.at(-1)?.recordedAt ?? null);
    const durationMinutes = end ? Math.round((end.getTime() - start.getTime()) / 60000) : null;

    const riderRatings = trip.ratings.filter((r) => r.direction === 'STUDENT_TO_DRIVER');
    const riderAverage = riderRatings.length
      ? Number((riderRatings.reduce((s, r) => s + r.score, 0) / riderRatings.length).toFixed(2))
      : null;

    return {
      tripId: trip.id,
      status: trip.status,
      route: trip.route,
      bus: trip.bus,
      driver: { id: trip.driver.id, name: trip.driver.fullName },
      startedAt: start,
      endedAt: end,
      durationMinutes,
      distanceKm: Number((distanceMeters / 1000).toFixed(2)),
      boardings: trip._count.tripHistories,
      peakPassengerCount: trip.passengerCount,
      stopsServed: trip.stopEvents.map((e) => ({ name: e.stop.name, at: e.occurredAt })),
      riderRatingAverage: riderAverage,
      riderRatingCount: riderRatings.length,
      driverTripRating: trip.ratings.find((r) => r.direction === 'DRIVER_TO_TRIP') ?? null,
    };
  }
}
