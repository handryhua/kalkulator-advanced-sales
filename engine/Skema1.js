/**
 * ENGINE - SKEMA PENJUALAN 1
 * Mekanisme:
 *   - Diskon standar 2% untuk semua produk
 *   - Jika total belanja >= Rp850.000 → mendapat Diskon HO (per SKU) + bonus Thermometer MC-246
 *   - Bonus berlaku kelipatan (setiap kelipatan Rp850.000 = +1 unit bonus)
 */

const fs = require("fs");
const path = require("path");
const { loadProducts } = require("./loader");

// Load data
const products = loadProducts();
const gradingProgram = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/program-grading.json"), "utf-8")
);

// Build lookup maps
const productMap = {};
products.forEach((p) => {
  productMap[p.sku.trim()] = p;
});

const hoDiscountMap = {};
gradingProgram.ho_discounts.forEach((d) => {
  hoDiscountMap[d.sku.trim()] = d.disc_ho_pct;
});

/**
 * Hitung Skema Penjualan 1
 * @param {Array} cartItems - [{ sku, qty }]
 * @returns {Object} hasil perhitungan lengkap
 */
function hitungSkema1(cartItems) {
  const BASE_DISC = gradingProgram.base_discount_pct / 100;
  const MIN_PURCHASE = gradingProgram.min_purchase_for_bonus;

  let details = [];
  let subtotalBeforeDisc = 0;
  let totalDiscount = 0;

  for (const item of cartItems) {
    const sku = item.sku.trim();
    const product = productMap[sku];

    if (!product) {
      console.warn(`[Skema1] SKU tidak ditemukan: ${sku}`);
      continue;
    }

    const qty = item.qty;
    const pricePerUnit = product.price;
    const gross = pricePerUnit * qty;

    // Diskon dasar 2%
    const discBase = gross * BASE_DISC;

    // Diskon HO (per SKU, hanya jika eligible)
    const hoDiscPct = (hoDiscountMap[sku] ?? 0) / 100;
    const discHO = gross * hoDiscPct;

    const totalDiscItem = discBase + discHO;
    const netItem = gross - totalDiscItem;

    subtotalBeforeDisc += gross;
    totalDiscount += totalDiscItem;

    details.push({
      sku,
      product_name: product.product_name,
      qty,
      price: pricePerUnit,
      gross,
      disc_base_pct: gradingProgram.base_discount_pct,
      disc_base_amount: Math.round(discBase),
      disc_ho_pct: hoDiscountMap[sku] ?? 0,
      disc_ho_amount: Math.round(discHO),
      total_disc_amount: Math.round(totalDiscItem),
      net_amount: Math.round(netItem),
    });
  }

  const grandTotal = subtotalBeforeDisc - totalDiscount;

  // Hitung bonus (kelipatan Rp850.000)
  const bonusTiers = Math.floor(grandTotal / MIN_PURCHASE);
  const bonusQty = bonusTiers * gradingProgram.bonus_qty_per_tier;
  const isBonusEligible = grandTotal >= MIN_PURCHASE;

  return {
    schema: "Skema Penjualan 1",
    items: details,
    summary: {
      subtotal_before_disc: Math.round(subtotalBeforeDisc),
      total_discount: Math.round(totalDiscount),
      grand_total: Math.round(grandTotal),
      bonus_eligible: isBonusEligible,
      bonus_tiers: bonusTiers,
      bonus_item: isBonusEligible ? gradingProgram.bonus_item_name : null,
      bonus_qty: isBonusEligible ? bonusQty : 0,
      note: isBonusEligible
        ? `Selamat! Anda mendapat ${bonusQty} unit ${gradingProgram.bonus_item_name} (${bonusTiers}x kelipatan Rp${MIN_PURCHASE.toLocaleString("id-ID")})`
        : `Tambah belanja Rp${(MIN_PURCHASE - grandTotal).toLocaleString("id-ID")} lagi untuk mendapat bonus`,
    },
  };
}

module.exports = { hitungSkema1 };

// ─── Demo / CLI ─────────────────────────────────────────────────────────────
if (require.main === module) {
  const contoh = [
    { sku: "8085", qty: 3 },  // BPM HEM-7120
    { sku: "E245", qty: 5 },  // Thermometer
    { sku: "4682", qty: 2 },  // Nebulizer NE-C28
  ];

  const hasil = hitungSkema1(contoh);

  console.log("\n══════════════════════════════════════════");
  console.log("         SKEMA PENJUALAN 1 - HASIL");
  console.log("══════════════════════════════════════════\n");

  console.log("DETAIL ITEM:");
  hasil.items.forEach((i) => {
    console.log(`  [${i.sku}] ${i.product_name}`);
    console.log(`         Qty: ${i.qty}  |  Harga: Rp${i.price.toLocaleString("id-ID")}`);
    console.log(`         Gross: Rp${i.gross.toLocaleString("id-ID")}`);
    console.log(`         Disc Base (${i.disc_base_pct}%): -Rp${i.disc_base_amount.toLocaleString("id-ID")}`);
    console.log(`         Disc HO   (${i.disc_ho_pct}%): -Rp${i.disc_ho_amount.toLocaleString("id-ID")}`);
    console.log(`         Net: Rp${i.net_amount.toLocaleString("id-ID")}\n`);
  });

  const s = hasil.summary;
  console.log("RINGKASAN:");
  console.log(`  Subtotal      : Rp${s.subtotal_before_disc.toLocaleString("id-ID")}`);
  console.log(`  Total Diskon  : Rp${s.total_discount.toLocaleString("id-ID")}`);
  console.log(`  Grand Total   : Rp${s.grand_total.toLocaleString("id-ID")}`);
  console.log(`\n  ${s.note}`);
  if (s.bonus_eligible) {
    console.log(`  Bonus         : ${s.bonus_qty} unit ${s.bonus_item}`);
  }
  console.log("\n══════════════════════════════════════════\n");
}
