import { OrderService } from '../../server/services/orderService';
import { InventoryService } from '../../server/services/inventoryService';
import { db } from '../../server/db/store';

describe('End-to-End Checkout & Auto Key Delivery Integration', () => {
  const buyerId = 'usr-buyer-01';
  const productId = 'prod_chatgpt_plus';

  beforeAll(async () => {
    const user = db.users.get(buyerId)!;
    user.walletBalance = 5000000;

    InventoryService.bulkAddKeys(productId, [
      'GPT-INTEG-KEY-001',
      'GPT-INTEG-KEY-002'
    ]);
  });

  test('Should complete atomic instant checkout, deduct balance, and deliver digital key', async () => {
    const user = db.users.get(buyerId)!;
    const balanceBefore = user.walletBalance;

    const result = await OrderService.createInstantPurchase({
      buyer: user,
      productId
    });

    expect(result.success).toBe(true);
    expect(result.order).toBeDefined();
    expect(result.order?.deliveredData?.keys).toBeDefined();

    const balanceAfter = user.walletBalance;
    expect(balanceAfter).toBe(balanceBefore - result.order!.pricePaid);
  });
});
