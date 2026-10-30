import { describe, expect, it } from 'vitest';
import { createContractSchema } from './contracts.schema';

const MAX_DB_INT = 2_147_483_647;

const validContract = {
  roomId: 1,
  startDate: '2026-10-30',
  rentPrice: 3_000_000,
  deposit: 3_000_000,
  tenantIds: [1],
  primaryTenantId: 1,
  services: [],
};

describe('createContractSchema', () => {
  it('accepts rent and deposit up to the PostgreSQL INT maximum', () => {
    const result = createContractSchema.safeParse({
      ...validContract,
      rentPrice: MAX_DB_INT,
      deposit: MAX_DB_INT,
    });

    expect(result.success).toBe(true);
  });

  it.each(['rentPrice', 'deposit'] as const)('rejects %s above the PostgreSQL INT maximum', (field) => {
    const result = createContractSchema.safeParse({
      ...validContract,
      [field]: MAX_DB_INT + 1,
    });

    expect(result.success).toBe(false);
  });
});
