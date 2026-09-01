import { LedgerService } from '../../server/services/ledgerService';
import { db } from '../../server/db/store';

describe('Ledger & Double-Entry Accounting Service', () => {
  const testUserId = 'usr-buyer-01';

  test('Should accurately credit balance and record credit transaction', async () => {
    const user = db.users.get(testUserId)!;
    const initialBalance = user.walletBalance;
    const amount = 500000;

    const res = await LedgerService.executeTransaction({
      userId: testUserId,
      type: 'DEPOSIT',
      amount,
      description: 'Test Deposit Credit'
    });

    expect(res.success).toBe(true);
    expect(res.transaction?.amount).toBe(amount);
    expect(res.transaction?.balanceAfter).toBe(initialBalance + amount);

    const updatedUser = db.users.get(testUserId)!;
    expect(updatedUser.walletBalance).toBe(initialBalance + amount);
  });

  test('Should prevent debiting more than available balance (Insufficient Funds)', async () => {
    const user = db.users.get(testUserId)!;
    const excessiveAmount = user.walletBalance + 100000000;

    const res = await LedgerService.executeTransaction({
      userId: testUserId,
      type: 'PURCHASE_INSTANT',
      amount: -excessiveAmount,
      description: 'Test Excessive Debit'
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/không đủ/);
  });

  test('Should maintain idempotency when provided same idempotencyKey', async () => {
    const key = `idemp-${Date.now()}`;
    const res1 = await LedgerService.executeTransaction({
      userId: testUserId,
      type: 'DEPOSIT',
      amount: 100000,
      description: 'Idempotency Test',
      idempotencyKey: key
    });

    const res2 = await LedgerService.executeTransaction({
      userId: testUserId,
      type: 'DEPOSIT',
      amount: 100000,
      description: 'Idempotency Test',
      idempotencyKey: key
    });

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    expect(res1.transaction?.id).toBe(res2.transaction?.id);
  });
});
