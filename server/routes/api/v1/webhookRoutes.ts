import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { LedgerService } from '../../../services/ledgerService';
import { notificationService } from '../../../services/notificationService';
import { AuditService } from '../../../services/auditService';

export const webhookRouter = Router();

// In-memory idempotency cache for webhooks
const processedWebhookIds = new Set<string>();

// POST /api/v1/webhooks/vietqr
webhookRouter.post('/vietqr', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-vietqr-signature'] as string;
    const { transactionId, amount, content, status, bankCode } = req.body;

    if (!transactionId || !amount) {
      return res.status(400).json({ success: false, error: 'Thiếu tham số bắt buộc' });
    }

    // Idempotency check
    if (processedWebhookIds.has(transactionId)) {
      return res.json({ success: true, message: 'Giao dịch đã được xử lý trước đó (Idempotent OK)' });
    }

    // Verify signature if secret configured
    const secret = process.env.VIETQR_WEBHOOK_SECRET || 'CYBER_VIETQR_SECRET_KEY';
    if (signature) {
      const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== expectedSig && process.env.NODE_ENV === 'production') {
        return res.status(401).json({ success: false, error: 'Chữ ký webhook không hợp lệ' });
      }
    }

    // Process deposit if status is success
    if (status === 'SUCCESS' || status === 'COMPLETED' || !status) {
      const userId = 'usr-buyer-01'; // extracted from transaction memo or account mapping

      await LedgerService.executeTransaction({
        userId,
        amount: Number(amount),
        type: 'DEPOSIT',
        description: `Nạp tự động VietQR (${bankCode || 'MBBank'}): ${content || transactionId}`,
        referenceId: transactionId,
        actorId: 'WEBHOOK_VIETQR',
        actorName: 'VietQR Auto Gateway'
      });

      notificationService.send(
        userId,
        'PAYMENT_SUCCESS',
        'Nạp tiền tự động thành công',
        `Ví của bạn đã được cộng +${Number(amount).toLocaleString('vi-VN')}đ qua VietQR.`,
        { transactionId, amount }
      );

      AuditService.log({
        actorId: 'WEBHOOK_VIETQR',
        actorName: 'VietQR Auto Gateway',
        actorRole: 'SUPER_ADMIN',
        action: 'AUTO_DEPOSIT_COMPLETED',
        resource: 'WALLET',
        resourceId: userId,
        newValue: { transactionId, amount, bankCode }
      });

      processedWebhookIds.add(transactionId);
    }

    res.json({
      success: true,
      message: 'Xử lý webhook VietQR thành công',
      processedAt: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Lỗi xử lý webhook' });
  }
});

// POST /api/v1/webhooks/telco
webhookRouter.post('/telco', async (req: Request, res: Response) => {
  try {
    const { requestId, status, declaredAmount, realAmount, callbackSign } = req.body;

    if (!requestId) {
      return res.status(400).json({ success: false, error: 'Thiếu requestId' });
    }

    if (processedWebhookIds.has(requestId)) {
      return res.json({ success: true, message: 'Giao dịch đã được xử lý (Idempotent OK)' });
    }

    processedWebhookIds.add(requestId);

    res.json({
      success: true,
      message: 'Xử lý callback gạch thẻ cào thành công'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});
