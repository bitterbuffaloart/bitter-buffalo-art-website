/** Order persistence. D1 when bound; memory store for local tests. */
export function createMemoryStore() {
  const orders = new Map();
  const receipts = new Set();
  const audits = [];
  return {
    async getOrder(orderId) { return orders.get(orderId) || null; },
    async findByPayment(paymentId) {
      return [...orders.values()].find((order) => order.squarePaymentId === paymentId) || null;
    },
    async findBySquareOrder(squareOrderId) {
      return [...orders.values()].find((order) => order.squareOrderId === squareOrderId) || null;
    },
    async findByIdempotency(key) {
      return [...orders.values()].find((order) => order.idempotencyKey === key) || null;
    },
    async insertOrder(order) { orders.set(order.orderId, order); return order; },
    async updateOrder(orderId, patch) {
      const current = orders.get(orderId);
      if (!current) return null;
      const next = { ...current, ...patch, updatedAt: patch.updatedAt || new Date().toISOString() };
      orders.set(orderId, next);
      return next;
    },
    async recordReceipt(source, eventId) {
      const key = `${source}:${eventId}`;
      if (receipts.has(key)) return false;
      receipts.add(key);
      return true;
    },
    async audit(entry) { audits.push(entry); },
    audits,
  };
}

export function createD1Store(db) {
  return {
    async getOrder(orderId) {
      const row = await db.prepare("SELECT payload FROM print_orders WHERE order_id = ?").bind(orderId).first();
      return row ? JSON.parse(row.payload) : null;
    },
    async findByPayment(paymentId) {
      const row = await db.prepare("SELECT payload FROM print_orders WHERE square_payment_id = ?").bind(paymentId).first();
      return row ? JSON.parse(row.payload) : null;
    },
    async findBySquareOrder(squareOrderId) {
      const row = await db.prepare("SELECT payload FROM print_orders WHERE square_order_id = ?").bind(squareOrderId).first();
      return row ? JSON.parse(row.payload) : null;
    },
    async findByIdempotency(key) {
      const row = await db.prepare("SELECT payload FROM print_orders WHERE idempotency_key = ?").bind(key).first();
      return row ? JSON.parse(row.payload) : null;
    },
    async insertOrder(order) {
      await db.prepare(`INSERT INTO print_orders
        (order_id, configuration_id, square_order_id, square_payment_id, idempotency_key, payload, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(
        order.orderId, order.configurationId, order.squareOrderId || null, order.squarePaymentId || null,
        order.idempotencyKey || null, JSON.stringify(order), order.updatedAt,
      ).run();
      return order;
    },
    async updateOrder(orderId, patch) {
      const current = await this.getOrder(orderId);
      if (!current) return null;
      const next = { ...current, ...patch, updatedAt: patch.updatedAt || new Date().toISOString() };
      await db.prepare(`UPDATE print_orders
        SET square_order_id = ?, square_payment_id = ?, payload = ?, updated_at = ? WHERE order_id = ?`).bind(
        next.squareOrderId || null, next.squarePaymentId || null, JSON.stringify(next), next.updatedAt, orderId,
      ).run();
      return next;
    },
    async recordReceipt(source, eventId) {
      try {
        await db.prepare("INSERT INTO webhook_receipts (source, event_id, received_at) VALUES (?, ?, ?)").bind(
          source, eventId, new Date().toISOString(),
        ).run();
        return true;
      } catch {
        return false;
      }
    },
    async audit(entry) {
      await db.prepare("INSERT INTO audit_events (order_id, kind, detail_json, created_at) VALUES (?, ?, ?, ?)").bind(
        entry.orderId || null, entry.kind, JSON.stringify(entry.detail || {}), entry.createdAt,
      ).run();
    },
  };
}
