export function calculateFinalPrice(price, discount) {

  const discounted = price * (1 - discount / 100);
  const tax = discounted * 0.11;

  return discounted + tax;

}
