/**
 * ENGINE - SKEMA PENJUALAN 2 (GRADING / PACKAGE)
 * Mekanisme:
 *   - Pembelian minimal qty tertentu → dapat diskon Omron + diskon Distributor + bonus unit
 *   - Bonus berlaku kelipatan: setiap kelipatan qty tambahan mendapat free unit
 *   - Contoh SKU 4682: min_buy=21, free=3, kelipatan=7
 *     → beli 21 dapat 3 free, setiap +7 berikutnya dapat +1 free
 */

const fs = require("fs");
const path = require("path");
const { loadProducts } = require("./loader");

// Load data
const products = loadProducts();
const packageProgram = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/program-package.json"), "utf-8")
);

// Build lookup maps
const productMap = {};
products.forEach((p) => {
  productMap[p.sku.trim()] = p;
});

const packageMap = {};
packageProgram.packages.forEach((pkg) => {
  packageMap[pkg.sku.trim()] = pkg;
});

/**
 * Hitung bonus unit berdasarkan qty dan aturan kelipatan
 * @param {number} qty        - jumlah dibeli
 * @param {number} minBuy     - minimal beli untuk dapat bonus
 * @param {number} freeQty    - bonus pada pembelian pertama (min_buy)
 * @param {number} kelipatan  - setiap kelipatan tambahan mendapat 1 unit
 * @returns {number} total unit bonus
 */
function hitungBonus(qty, minBuy, freeQty, kelipatan) {
  if (minBuy === 0 || qty < minBuy) return 0;
  if (kelipatan === 0 || freeQty === 0) return 0;

  // Bonus pertama (tier 1 = pembelian awal sejumlah min_buy)
  let bonus = freeQty;

  // Sisa qty setelah memenuhi min_buy, hitung kelipatan tambahan
  const sisaQty = qty - minBuy;
  const extraTiers = Math.floor(sisaQty / kelipatan);
  bonus += extraTiers * 1; // setiap kelipatan = +1 unit

  return bonus;
}

/**
 * Hitung Skema Penjualan 2
 * @param {Array} cartItems - [{ sku, qty }]
 * @returns {Object} hasil perhitungan lengkap
 */
function hitungSkema2(cartItems) {
  let details = [];
  let subtotalBeforeDisc = 0;
  let totalDiscount = 0;
  let totalFreeUnits = 0;

  for (const item of cartItems) {
    const sku = item.sku.trim();
    const product = productMap[sku];
    const pkg = packageMap[sku];

    if (!product) {
      console.warn(`[Skema2] SKU tidak ditemukan: ${sku}`);
      continue;
    }

    const qty = item.qty;
    const pricePerUnit = product.price;
    const gross = pricePerUnit * qty;

    let discOmronPct = 0;
    let discDistPct = 0;
    let freeUnits = 0;
    let eligible = false;
    let minBuy = 0;

    if (pkg) {
      minBuy = pkg.min_buy;
      eligible = minBuy === 0 || qty >= minBuy;

      if (eligible) {
        discOmronPct = pkg.disc_omron_pct;
        discDistPct = pkg.disc_distributor_pct;

        // Total diskon gabungan (sequential / compound)
        // Disc Omron dulu, lalu Disc Distributor dari hasil setelah Omron
        const afterOmron = gross * (1 - discOmronPct / 100);
        const discOmronAmount = gross - afterOmron;
        const discDistAmount = afterOmron * (discDistPct / 100);
        const netItem = afterOmron - discDistAmount;

        freeUnits = hitungBonus(qty, pkg.min_buy, pkg.free_qty, pkg.kelipatan);
        totalFreeUnits += freeUnits;

        const totalDiscItem = discOmronAmount + discDistAmount;
        subtotalBeforeDisc += gross;
        totalDiscount += totalDiscItem;

        details.push({
          sku,
          product_name: product.product_name,
          qty,
          price: pricePerUnit,
          gross,
          eligible: true,
          min_buy: pkg.min_buy,
          disc_omron_pct: discOmronPct,
          disc_omron_amount: Math.round(discOmronAmount),
          disc_distributor_pct: discDistPct,
          disc_distributor_amount: Math.round(discDistAmount),
          total_disc_amount: Math.round(totalDiscItem),
          net_amount: Math.round(netItem),
          free_units: freeUnits,
          kelipatan: pkg.kelipatan,
          note: freeUnits > 0
            ? `Bonus ${freeUnits} unit (min ${pkg.min_buy}, +1/kelipatan ${pkg.kelipatan})`
            : "Memenuhi syarat diskon (tanpa bonus unit)",
        });
      } else {
        // Tidak eligible → tidak ada diskon, tidak ada bonus
        subtotalBeforeDisc += gross;
        details.push({
          sku,
          product_name: product.product_name,
          qty,
          price: pricePerUnit,
          gross,
          eligible: false,
          min_buy: pkg.min_buy,
          disc_omron_pct: 0,
          disc_omron_amount: 0,
          disc_distributor_pct: 0,
          disc_distributor_amount: 0,
          total_disc_amount: 0,
          net_amount: gross,
          free_units: 0,
          kelipatan: pkg.kelipatan,
          note: `Belum memenuhi syarat min. pembelian ${pkg.min_buy} unit`,
        });
      }
    } else {
      // SKU tidak terdaftar di program → harga normal
      subtotalBeforeDisc += gross;
      details.push({
        sku,
        product_name: product.product_name,
        qty,
        price: pricePerUnit,
        gross,
        eligible: false,
        min_buy: null,
        disc_omron_pct: 0,
        disc_omron_amount: 0,
        disc_distributor_pct: 0,
        disc_distributor_amount: 0,
        total_disc_amount: 0,
        net_amount: gross,
        free_units: 0,
        kelipatan: 0,
        note: "SKU tidak terdaftar dalam program grading",
      });
    }
  }

  const grandTotal = subtotalBeforeDisc - totalDiscount;

  return {
    schema: "Skema Penjualan 2 (Grading)",
    items: details,
    summary: {
      subtotal_before_disc: Math.round(subtotalBeforeDisc),
      total_discount: Math.round(totalDiscount),
      grand_total: Math.round(grandTotal),
      total_free_units: totalFreeUnits,
    },
  };
}

module.exports = { hitungSkema2, hitungBonus };

// ─── Demo / CLI ─────────────────────────────────────────────────────────────
if (require.main === module) {
  const contoh = [
    { sku: "4682", qty: 28 },  // min_buy=21, free=3, kelipatan=7 → (28-21)/7=1 → bonus=3+1=4
    { sku: "8085", qty: 10 },  // min_buy=10, free=2, kelipatan=5
    { sku: "E245", qty: 15 },  // min_buy=20 → belum memenuhi syarat
  ];

  const hasil = hitungSkema2(contoh);

  console.log("\n══════════════════════════════════════════");
  console.log("      SKEMA PENJUALAN 2 (GRADING) - HASIL");
  console.log("══════════════════════════════════════════\n");

  hasil.items.forEach((i) => {
    console.log(`  [${i.sku}] ${i.product_name}`);
    console.log(`         Qty  : ${i.qty}  |  Min Buy: ${i.min_buy ?? "-"}`);
    console.log(`         Harga: Rp${i.price.toLocaleString("id-ID")}`);
    console.log(`         Gross: Rp${i.gross.toLocaleString("id-ID")}`);
    console.log(`         Disc Omron (${i.disc_omron_pct}%):  -Rp${i.disc_omron_amount.toLocaleString("id-ID")}`);
    console.log(`         Disc Dist  (${i.disc_distributor_pct}%):  -Rp${i.disc_distributor_amount.toLocaleString("id-ID")}`);
    console.log(`         Net  : Rp${i.net_amount.toLocaleString("id-ID")}`);
    console.log(`         ${i.note}\n`);
  });

  const s = hasil.summary;
  console.log("RINGKASAN:");
  console.log(`  Subtotal      : Rp${s.subtotal_before_disc.toLocaleString("id-ID")}`);
  console.log(`  Total Diskon  : Rp${s.total_discount.toLocaleString("id-ID")}`);
  console.log(`  Grand Total   : Rp${s.grand_total.toLocaleString("id-ID")}`);
  console.log(`  Total Bonus   : ${s.total_free_units} unit gratis`);
  console.log("\n══════════════════════════════════════════\n");
}
