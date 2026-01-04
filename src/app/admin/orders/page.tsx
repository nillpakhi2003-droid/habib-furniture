import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { updateOrderStatusAction, createDemoOrderAction } from "./actions";

function formatTaka(value: number | string) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "৳0";
  return `৳${num.toLocaleString("en-BD")}`;
}

const STATUSES = ["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED"] as const;
type OrderStatus = (typeof STATUSES)[number];

async function getOrders(statusFilter?: string) {
  const where = statusFilter && STATUSES.includes(statusFilter as OrderStatus)
    ? { status: statusFilter as OrderStatus }
    : {};

  return prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      customerName: true,
      phone: true,
      address: true,
      deliveryCharge: true,
      totalAmount: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      paymentPhone: true,
      transactionId: true,
      createdAt: true,
      items: {
        select: {
          quantity: true,
          priceSnapshot: true,
          product: { select: { name: true } },
        },
      },
    },
  });
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const color =
    status === "PENDING"
      ? "bg-orange-100 text-orange-700"
      : status === "CONFIRMED"
      ? "bg-blue-100 text-blue-700"
      : status === "DELIVERED"
      ? "bg-green-100 text-green-700"
      : "bg-gray-200 text-gray-700";

  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${color}`}>
      {status}
    </span>
  );
}

function PaymentBadge({ method, status }: { method: string; status: string }) {
  const methodColors: Record<string, string> = {
    CASH_ON_DELIVERY: "bg-yellow-100 text-yellow-800",
    BKASH: "bg-pink-100 text-pink-800",
    NAGAD: "bg-orange-100 text-orange-800",
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-700",
    PAID: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex gap-2">
      <span className={`px-2 py-1 text-xs font-semibold rounded ${methodColors[method] || "bg-gray-100 text-gray-700"}`}>
        {method === "CASH_ON_DELIVERY" ? "COD" : method}
      </span>
      <span className={`px-2 py-1 text-xs font-semibold rounded ${statusColors[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    </div>
  );
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params?.status;
  const orders = await getOrders(statusFilter);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="flex flex-wrap items-center gap-3">
          <form method="get" className="flex items-center gap-3">
            <label className="text-sm text-gray-600" htmlFor="status">
              Filter by status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={statusFilter ?? ""}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
            >
              Apply
            </button>
          </form>

          <form action={createDemoOrderAction}>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-semibold hover:bg-blue-700"
            >
              Create demo order
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="border rounded-lg p-6 bg-white shadow-sm text-gray-500">
            No orders found.
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="border rounded-lg bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-semibold text-gray-900">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-semibold text-gray-900">{order.customerName}</p>
                  <p className="text-sm text-gray-600">{order.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment</p>
                  <PaymentBadge method={order.paymentMethod} status={order.paymentStatus} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-semibold text-gray-900">{formatTaka(order.totalAmount.toString())}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={order.status as OrderStatus} />
                </div>
                <form action={updateOrderStatusAction} className="flex items-center gap-2">
                  <input type="hidden" name="orderId" value={order.id} />
                  <select
                    name="status"
                    defaultValue={order.status}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
                  >
                    Update
                  </button>
                </form>
              </div>

              <div className="px-6 py-4">
                <div className="mb-3">
                  <p className="text-sm text-gray-500">Ship to</p>
                  <p className="text-gray-900">{order.address}</p>
                </div>

                {(order.paymentPhone || order.transactionId) && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Payment Details</p>
                    {order.paymentPhone && (
                      <p className="text-sm text-gray-600">
                        {order.paymentMethod === "BKASH" ? "bKash" : "Nagad"} Number: <strong>{order.paymentPhone}</strong>
                      </p>
                    )}
                    {order.transactionId && (
                      <p className="text-sm text-gray-600">
                        Transaction ID: <strong>{order.transactionId}</strong>
                      </p>
                    )}
                  </div>
                )}

                <div className="border rounded-lg">
                  <div className="grid grid-cols-3 text-sm font-semibold text-gray-700 bg-gray-50 px-4 py-2">
                    <span>Item</span>
                    <span>Qty</span>
                    <span className="text-right">Price</span>
                  </div>
                  {order.items.map((item, idx) => (
                    <div
                      key={`${order.id}-${idx}`}
                      className="grid grid-cols-3 text-sm px-4 py-2 border-t"
                    >
                      <span className="text-gray-900">{item.product.name}</span>
                      <span className="text-gray-700">{item.quantity}</span>
                      <span className="text-right text-gray-900">
                        {formatTaka(item.priceSnapshot.toString())}
                      </span>
                    </div>
                  ))}
                  <div className="grid grid-cols-3 text-sm px-4 py-2 border-t bg-gray-50">
                    <span className="col-span-2 text-gray-700">Delivery Charge</span>
                    <span className="text-right text-gray-900">
                      {formatTaka(order.deliveryCharge.toString())}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 text-sm px-4 py-2 border-t bg-gray-50">
                    <span className="col-span-2 font-bold text-gray-900">Total</span>
                    <span className="text-right font-bold text-gray-900">
                      {formatTaka(order.totalAmount.toString())}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
