const fs = require("fs");
const path = require("path");

/**
 * Load products.json — support both formats:
 *   - Legacy: array of objects [{category, sku, ...}]
 *   - Compact: { _fields: [...], data: [[...], ...] }
 * Returns always as array of objects.
 */
function loadProducts() {
  const raw = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/products.json"), "utf-8")
  );
  if (Array.isArray(raw)) return raw; // legacy format
  const fields = raw._fields;
  return raw.data.map((row) =>
    Object.fromEntries(fields.map((f, i) => [f, row[i]]))
  );
}

module.exports = { loadProducts };
