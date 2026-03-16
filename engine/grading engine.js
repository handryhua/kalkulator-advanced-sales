export function calculateGrading(sku, qty, gradingRules) {

  const tier3 = gradingRules.tier3[sku];
  const tier2 = gradingRules.tier2[sku];

  if (tier3 && qty >= tier3.startQty) {

    const extra = Math.floor((qty - tier3.startQty) / tier3.stepQty);
    const bonus = tier3.startBonus + extra * tier3.stepBonus;

    return {
      tier: 3,
      discount: tier3.discount,
      bonus
    };

  }

  if (tier2 && qty >= tier2.startQty) {

    const extra = Math.floor((qty - tier2.startQty) / tier2.stepQty);
    const bonus = tier2.startBonus + extra * tier2.stepBonus;

    return {
      tier: 2,
      discount: tier2.discount,
      bonus
    };

  }

  return {
    tier: 1,
    discount: gradingRules.tier1.discount,
    bonus: 0
  };

}
