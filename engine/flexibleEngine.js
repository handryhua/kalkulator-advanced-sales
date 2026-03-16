export function calculateFlexible(cart, products, config) {

  let totalValue = 0;

  cart.forEach(item => {
    const product = products.find(p => p.sku === item.sku);
    totalValue += product.price * item.qty;
  });

  const threshold = config.threshold;

  const packageCount = Math.floor(totalValue / threshold);

  return {
    totalValue,
    packageCount
  };

}
