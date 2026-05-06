import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, X, FileText, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  type: 'kot' | 'bill';
  tenant?: any;
  settings?: any;
}

export default function PrintModal({ isOpen, onClose, order, type, tenant, settings }: PrintModalProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: type === 'kot' ? `KOT-${order?.orderNumber}` : `Bill-${order?.orderNumber}`,
  });

  if (!order) return null;

  const formatCurrency = (amount: number) => {
    const currency = settings?.currency || '£';
    return `${currency}${amount.toFixed(2)}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${type === 'kot' ? 'bg-amber-100' : 'bg-green-100'}`}>
                  {type === 'kot' ? (
                    <FileText className="w-6 h-6 text-amber-600" />
                  ) : (
                    <Receipt className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {type === 'kot' ? 'Kitchen Order Ticket' : 'Bill / Receipt'}
                  </h2>
                  <p className="text-slate-500 text-sm">Order #{order.orderNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="btn-primary flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Print Content */}
            <div ref={componentRef} className="bg-white p-8 border border-slate-200 rounded-xl">
              {/* Header */}
              <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-4">
                <h1 className="text-2xl font-bold text-slate-900">
                  {tenant?.name || 'Restaurant'}
                </h1>
                {tenant?.address && <p className="text-sm text-slate-600">{tenant.address}</p>}
                {tenant?.phone && <p className="text-sm text-slate-600">Phone: {tenant.phone}</p>}
                <p className="text-lg font-semibold mt-2">{type === 'kot' ? 'KITCHEN ORDER TICKET' : 'BILL'}</p>
              </div>

              {/* Order Info */}
              <div className="mb-4">
                <div className="flex justify-between text-sm">
                  <div>
                    <p><strong>Order No:</strong> {order.orderNumber}</p>
                    <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                    {order.table && <p><strong>Table:</strong> {order.table.number}</p>}
                  </div>
                  <div className="text-right">
                    <p><strong>Type:</strong> {order.orderType}</p>
                    <p><strong>Status:</strong> {order.status}</p>
                    {order.user && <p><strong>Server:</strong> {order.user.name}</p>}
                  </div>
                </div>
              </div>

              {/* Items */}
              <table className="w-full mb-4">
                <thead>
                  <tr className="border-b-2 border-slate-300">
                    <th className="text-left py-2">Item</th>
                    <th className="text-center py-2">Qty</th>
                    {type === 'bill' && (
                      <>
                        <th className="text-right py-2">Rate</th>
                        <th className="text-right py-2">Amount</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="py-2">
                        <p className="font-medium">{item.menuItem?.name}</p>
                        {item.notes && <p className="text-xs text-slate-500">Note: {item.notes}</p>}
                      </td>
                      <td className="text-center py-2">{item.quantity}</td>
                      {type === 'bill' && (
                        <>
                          <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
                          <td className="text-right py-2">{formatCurrency(item.totalPrice)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals (Bill only) */}
              {type === 'bill' && (
                <div className="border-t-2 border-dashed border-slate-300 pt-4">
                  <div className="flex justify-between mb-2">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between mb-2 text-red-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between mb-2">
                    <span>Tax ({settings?.taxRate || 18}%)</span>
                    <span>{formatCurrency(order.tax)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t border-slate-300 pt-2 mt-2">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="text-center mt-6 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-500">Thank you for dining with us!</p>
                <p className="text-xs text-slate-400">Powered by RestroPro</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}