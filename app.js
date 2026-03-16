async function loadData() {

  const products = await fetch("./data/products.json").then(r => r.json());
  const customers = await fetch("./data/customers.json").then(r => r.json());
  const flexible = await fetch("./data/flexible-package.json").then(r => r.json());
  const grading = await fetch("./data/grading-foc.json").then(r => r.json());

  return {
    products,
    customers,
    flexible,
    grading
  };

}

loadData().then(data => {
  console.log("DATA LOADED", data);
});
