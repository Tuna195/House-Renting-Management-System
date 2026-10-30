import { prisma } from '../../lib/prisma';
import type { ListServicesQuery } from './services.schema';

export function listServices(ownerId: number, query: ListServicesQuery) {
  return prisma.service.findMany({
    where: {
      buildingId: query.buildingId,
      building: { ownerId },
    },
    orderBy: { name: 'asc' },
  });
}
