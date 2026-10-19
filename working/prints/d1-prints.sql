CREATE TABLE IF NOT EXISTS print_orders (
  order_id TEXT PRIMARY KEY,
  configuration_id TEXT NOT NULL,
  square_order_id TEXT,
  square_payment_id TEXT,
  idempotency_key TEXT UNIQUE,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_receipts (
  source TEXT NOT NULL,
  event_id TEXT NOT NULL,
  received_at TEXT NOT NULL,
  PRIMARY KEY (source, event_id)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT,
  kind TEXT NOT NULL,
  detail_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS print_orders_square_order ON print_orders (square_order_id);
CREATE INDEX IF NOT EXISTS print_orders_square_payment ON print_orders (square_payment_id);
