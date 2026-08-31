import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async overview() {
    const [studentCount, driverCount, busCount, activeTripCount, routeCount, feedbackCount] = await Promise.all([
      this.prisma.student.count({ where: { isActive: true } }),
      this.prisma.driver.count({ where: { isActive: true } }),
      this.prisma.bus.count({ where: { status: 'ACTIVE' } }),
      this.prisma.trip.count({ where: { status: { in: ['IN_PROGRESS', 'PAUSED'] } } }),
      this.prisma.route.count({ where: { isActive: true } }),
      this.prisma.feedback.count(),
    ]);

    const avgRating = await this.prisma.feedback.aggregate({
      where: { category: 'DRIVER_RATING', rating: { not: null } },
      _avg: { rating: true },
    });

    return {
      studentCount,
      driverCount,
      busCount,
      activeTripCount,
      routeCount,
      feedbackCount,
      averageDriverRating: avgRating._avg.rating ?? null,
    };
  }

  async tripsPerDay(days = 14) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const trips = await this.prisma.trip.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
    });

    const buckets = new Map<string, number>();
    for (const t of trips) {
      const key = t.createdAt.toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }

  async busiestRoutes(limit = 5) {
    const routes = await this.prisma.route.findMany({
      select: { id: true, name: true, _count: { select: { trips: true, favouritedBy: true } } },
    });
    return routes
      .sort((a, b) => b._count.trips - a._count.trips)
      .slice(0, limit)
      .map((r) => ({ routeId: r.id, name: r.name, tripCount: r._count.trips, favouriteCount: r._count.favouritedBy }));
  }

  async incidentBreakdown() {
    const reports = await this.prisma.incidentReport.groupBy({ by: ['type'], _count: { type: true } });
    return reports.map((r) => ({ type: r.type, count: r._count.type }));
  }
}
