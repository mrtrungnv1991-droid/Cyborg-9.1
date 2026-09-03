import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Send, 
  RotateCcw, 
  Eye, 
  Gamepad2, 
  Gift, 
  Zap, 
  Sparkles, 
  Check, 
  Copy, 
  FileText, 
  User, 
  ShieldCheck,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { ManualOrder, Currency, SourcePendingOrder } from '../../types';
import { INITIAL_MANUAL_ORDERS } from '../../data/shopclone7ExtendedData';
import { formatCurrency } from '../../utils/formatters';
import { DualStreamChatModal } from './DualStreamChatModal';

interface AdminManualOrdersTabProps {
  currency?: Currency;
}

export const AdminManualOrdersTab: React.FC<AdminManualOrdersTabProps> = ({ currency = 'VND' }) => {
  const [orders, setOrders] = useState<ManualOrder[]>(INITIAL_MANUAL_ORDERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<ManualOrder | null>(null);
  const [deliveryContentInput, setDeliveryContentInput] = useState('');
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeDualStreamOrder, setActiveDualStreamOrder] = useState<SourcePendingOrder | null>(null);

  const filteredOrders = orders.filter(ord => {
    const matchSearch = (ord.orderCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord.productTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord.orderInputs?.uid && ord.orderInputs.uid.includes(searchTerm)) ||
      (ord.orderInputs?.emailDelivery && ord.orderInputs.emailDelivery.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchStatus = statusFilter === 'all' || ord.status === statusFilter;
    const matchType = typeFilter === 'all' || ord.productType === typeFilter;

    return matchSearch && matchStatus && matchType;
  });

  const handleOpenProcess = (ord: ManualOrder) => {
    setSelectedOrder(ord);
    setDeliveryContentInput(ord.deliveredContent || '');
    setAdminNoteInput(ord.adminNote || '');
  };

  const handleFulfillOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!deliveryContentInput.trim()) {
      setSaveNotice('⚠️ Vui lòng nhập nội dung bàn giao (Key / Serial thẻ / Mã giao dịch Top Up)');
      setTimeout(() => setSaveNotice(null), 3000);
      return;
    }

    const updated = orders.map(o => {
      if (o.id === selectedOrder.id) {
        return {
          ...o,
          status: 'completed' as const,
          deliveredContent: deliveryContentInput.trim(),
          adminNote: adminNoteInput.trim(),
          processedAt: new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN'),
          processedBy: 'Root_SuperAdmin'
        };
      }
      return o;
    });

    setOrders(updated);
    setSaveNotice(`Đã hoàn tất duyệt và gửi bàn giao đơn "${selectedOrder.orderCode}" thành công!`);
    setSelectedOrder(null);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleRefundOrder = (ord: ManualOrder) => {
    const updated = orders.map(o => {
      if (o.id === ord.id) {
        return {
          ...o,
          status: 'refunded' as const,
          adminNote: 'Đã hoàn tiền vào số dư ví của khách hàng',
          processedAt: new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN'),
          processedBy: 'Root_SuperAdmin'
        };
      }
      return o;
    });

    setOrders(updated);
    setSaveNotice(`Đã hủy & hoàn tiền ${formatCurrency(ord.totalPrice, currency)} cho đơn "${ord.orderCode}"!`);
    if (selectedOrder?.id === ord.id) setSelectedOrder(null);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'key_game':
        return <Gamepad2 className="w-4 h-4 text-cyan-400" />;
      case 'gift_card':
        return <Gift className="w-4 h-4 text-pink-400" />;
      case 'topup_manual':
        return <Zap className="w-4 h-4 text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'key_game':
        return 'Key Game Bản Quyền';
      case 'gift_card':
        return 'Thẻ Quà Tặng E-Gift';
      case 'topup_manual':
        return 'Nạp Game UID/Server';
      default:
        return 'Tài Khoản Số';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_process':
        return (
          <span className="px-2.5 py-1 rounded-md bg-amber-950 text-amber-300 border border-amber-500/40 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ Xử Lý</span>
          </span>
        );
      case 'processing':
        return (
          <span className="px-2.5 py-1 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
            <span>Đang Xử Lý</span>
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã Giao Hàng</span>
          </span>
        );
      case 'refunded':
        return (
          <span className="px-2.5 py-1 rounded-md bg-rose-950 text-rose-300 border border-rose-500/40 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
            <XCircle className="w-3.5 h-3.5" />
            <span>Đã Hoàn Tiền</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 font-sans text-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2 tracking-wide">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>HÀNG ĐỢI XỬ LÝ ĐƠN HÀNG THỦ CÔNG ({orders.filter(o => o.status === 'pending_process' || o.status === 'processing').length} ĐƠN CHỜ DUYỆT)</span>
            <span className="px-2 py-0.5 rounded text-xs bg-amber-950 text-amber-300 border border-amber-500/30 font-medium">
              Manual Fulfillment
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Duyệt & bàn giao các đơn hàng: Key Game thủ công, Mã thẻ quà tặng (Gift Card) và Dịch vụ nạp game theo UID/Server.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Tổng doanh thu chờ giao:</span>
          <span className="px-3 py-1 rounded-lg bg-amber-950/80 border border-amber-500/30 text-amber-300 font-bold font-mono text-xs">
            {formatCurrency(orders.filter(o => o.status === 'pending_process' || o.status === 'processing').reduce((s, o) => s + o.totalPrice, 0), currency)}
          </span>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 text-xs">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã đơn, tên khách, UID game, email..."
            className="w-full pl-10 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending_process">Chờ xử lý</option>
            <option value="processing">Đang xử lý</option>
            <option value="completed">Đã giao hàng</option>
            <option value="refunded">Đã hoàn tiền</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tất cả loại đơn</option>
            <option value="key_game">Key Game</option>
            <option value="gift_card">Gift Card</option>
            <option value="topup_manual">Nạp Game UID</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[11px] font-semibold tracking-wider">
              <th className="py-3 px-4 whitespace-nowrap w-44">Mã Đơn / Thời Gian</th>
              <th className="py-3 px-4 whitespace-nowrap w-40">Khách Hàng</th>
              <th className="py-3 px-4 min-w-[200px]">Phân Loại & Sản Phẩm</th>
              <th className="py-3 px-4 min-w-[220px]">Thông Tin Đầu Vào (UID / Email)</th>
              <th className="py-3 px-4 whitespace-nowrap w-32">Tổng Tiền</th>
              <th className="py-3 px-4 whitespace-nowrap w-36">Trạng Thái</th>
              <th className="py-3 px-4 whitespace-nowrap w-32 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredOrders.map((ord) => (
              <tr key={ord.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-amber-400 font-mono text-xs flex items-center gap-1">
                    <span>{ord.orderCode}</span>
                    <button
                      onClick={() => copyToClipboard(ord.orderCode, ord.id)}
                      className="text-slate-500 hover:text-white p-0.5 transition-colors"
                    >
                      {copiedId === ord.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{ord.createdAt}</div>
                </td>

                <td className="py-3 px-4">
                  <div className="font-semibold text-white">{ord.customerName}</div>
                  {ord.customerContact && (
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{ord.customerContact}</div>
                  )}
                </td>

                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    {getTypeIcon(ord.productType)}
                    <span className="font-semibold text-slate-200">{ord.productTitle}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Phân loại: <span className="text-cyan-400 font-medium">{getTypeLabel(ord.productType)}</span> (x{ord.quantity})
                  </div>
                </td>

                <td className="py-3 px-4">
                  {ord.orderInputs.uid && (
                    <div>UID: <span className="font-semibold text-amber-300 font-mono">{ord.orderInputs.uid}</span> {ord.orderInputs.server ? `(${ord.orderInputs.server})` : ''}</div>
                  )}
                  {ord.orderInputs.characterName && (
                    <div className="text-[11px] text-slate-400">Tên NV: {ord.orderInputs.characterName}</div>
                  )}
                  {ord.orderInputs.emailDelivery && (
                    <div className="text-[11px] text-cyan-400">Email: {ord.orderInputs.emailDelivery}</div>
                  )}
                  {ord.orderInputs.notes && (
                    <div className="text-[11px] text-slate-400 italic max-w-xs truncate">Note: "{ord.orderInputs.notes}"</div>
                  )}
                </td>

                <td className="py-3 px-4 font-bold text-emerald-400 font-mono">
                  {formatCurrency(ord.totalPrice, currency)}
                </td>

                <td className="py-3 px-4 whitespace-nowrap">
                  {getStatusBadge(ord.status)}
                </td>

                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const mapped: SourcePendingOrder = {
                          id: ord.id,
                          orderCode: ord.orderCode,
                          customerName: ord.customerName,
                          productTitle: ord.productTitle,
                          productType: ord.productType,
                          retailPrice: ord.totalPrice,
                          sourceEstimatedCost: Math.round(ord.totalPrice * 0.75),
                          sourceName: 'Muakey.com',
                          idempotencyKey: `IDEMP-MAN-${ord.orderCode}`,
                          status: ord.status === 'completed' ? 'FULFILLED' : 'MANUAL_SUPPORT',
                          sourceAccountBalance: 85000,
                          fundsNeeded: 0,
                          telegramAlertSent: true,
                          deliveredContent: ord.deliveredContent,
                          accountDetails: {
                            uid: ord.orderInputs?.uid,
                            emailDelivery: ord.orderInputs?.emailDelivery,
                            accountNote: ord.orderInputs?.notes
                          },
                          createdAt: ord.createdAt,
                          updatedAt: ord.processedAt || ord.createdAt
                        };
                        setActiveDualStreamOrder(mapped);
                      }}
                      className="p-1.5 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900 cursor-pointer transition-colors"
                      title="Mở Cầu Chat Song Song (Khách ⟷ Nguồn Muakey)"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenProcess(ord)}
                      className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer flex items-center gap-1.5 text-xs transition-colors ${
                        ord.status === 'completed'
                          ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md font-bold'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{ord.status === 'completed' ? 'Xem Bàn Giao' : 'Duyệt & Giao'}</span>
                    </button>

                    {ord.status !== 'refunded' && ord.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => handleRefundOrder(ord)}
                        className="p-1 rounded bg-rose-950 text-rose-400 border border-rose-500/30 hover:bg-rose-900 cursor-pointer"
                        title="Hủy đơn & Hoàn tiền ví"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fulfillment Processing Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-amber-500/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {getTypeIcon(selectedOrder.productType)}
                <div>
                  <h4 className="font-bold text-white text-sm">
                    XỬ LÝ ĐƠN HÀNG THỦ CÔNG: #{selectedOrder.orderCode}
                  </h4>
                  <div className="text-[11px] text-slate-400 font-sans">
                    Khách: <span className="text-white font-bold">{selectedOrder.customerName}</span> | Phân loại: <span className="text-amber-400 font-bold">{getTypeLabel(selectedOrder.productType)}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px]">
              <div>
                <div className="text-slate-500">Sản phẩm:</div>
                <div className="font-bold text-white">{selectedOrder.productTitle} (x{selectedOrder.quantity})</div>
                <div className="text-slate-500 mt-1">Tổng tiền thanh toán:</div>
                <div className="font-bold text-emerald-400">{formatCurrency(selectedOrder.totalPrice, currency)}</div>
              </div>

              <div>
                <div className="text-slate-500">Thông tin khách cung cấp:</div>
                {selectedOrder.orderInputs.uid && (
                  <div className="text-amber-300 font-mono font-bold">UID: {selectedOrder.orderInputs.uid} ({selectedOrder.orderInputs.server || 'No Server'})</div>
                )}
                {selectedOrder.orderInputs.characterName && (
                  <div className="text-slate-300">Tên NV: {selectedOrder.orderInputs.characterName}</div>
                )}
                {selectedOrder.orderInputs.emailDelivery && (
                  <div className="text-cyan-300">Email: {selectedOrder.orderInputs.emailDelivery}</div>
                )}
                {selectedOrder.orderInputs.notes && (
                  <div className="text-slate-400 italic">"{selectedOrder.orderInputs.notes}"</div>
                )}
              </div>
            </div>

            <form onSubmit={handleFulfillOrder} className="space-y-3.5">
              <div>
                <label className="text-[11px] text-slate-400 font-bold flex items-center justify-between">
                  <span>Nội Dung Bàn Giao (Key / Thẻ / Mã Giao Dịch Top Up) (*):</span>
                  <span className="text-amber-400 text-[10px]">Khách hàng sẽ nhìn thấy nội dung này</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={deliveryContentInput}
                  onChange={(e) => setDeliveryContentInput(e.target.value)}
                  placeholder="Nhập CD-Key, Mã quà tặng Gift Card, hoặc Mã Transaction Top Up thành công..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs mt-1 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold">Ghi Chú Quản Trị (Admin Note):</label>
                <input
                  type="text"
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="Ghi chú nội bộ cho ca trực (VD: Đã check live, nạp qua Midasbuy)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs mt-1"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                {selectedOrder.status !== 'refunded' && selectedOrder.status !== 'completed' ? (
                  <button
                    type="button"
                    onClick={() => handleRefundOrder(selectedOrder)}
                    className="px-3.5 py-2 rounded-lg bg-rose-950 text-rose-300 border border-rose-500/40 hover:bg-rose-900 font-bold cursor-pointer text-xs flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Hủy & Hoàn Tiền Ví</span>
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold cursor-pointer text-xs"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center gap-1.5 cursor-pointer shadow-lg text-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Xác Nhận Bàn Giao Cho Khách</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dual Stream Chat Support Bridge */}
      {activeDualStreamOrder && (
        <DualStreamChatModal
          isOpen={true}
          onClose={() => setActiveDualStreamOrder(null)}
          order={activeDualStreamOrder}
          currency={currency as any}
          onSendMessage={(stream, sender, text) => {
            console.log('Dual-stream msg:', stream, sender, text);
          }}
          onFulfillOrder={(orderId, deliveredKey) => {
            setOrders(prev => prev.map(o => {
              if (o.id === orderId) {
                return {
                  ...o,
                  status: 'completed',
                  deliveredContent: deliveredKey,
                  processedAt: new Date().toLocaleTimeString('vi-VN')
                };
              }
              return o;
            }));
            setSaveNotice(`✅ Đã bàn giao xong đơn qua Cầu Chat Song Song! Key: ${deliveredKey}`);
            setTimeout(() => setSaveNotice(null), 4000);
            setActiveDualStreamOrder(null);
          }}
        />
      )}
    </div>
  );
};
