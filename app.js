let PRODUCTS = []
let CART = []

/* ===============================
   LOAD DATA
================================*/

async function loadData(){

  const products = await fetch("./data/products.json")
  .then(r => r.json())

  const customers = await fetch("./data/customers.json")
  .then(r => r.json())

  const flexible = await fetch("./data/flexible-package.json")
  .then(r => r.json())

  const grading = await fetch("./data/grading-foc.json")
  .then(r => r.json())

  return {
    products,
    customers,
    flexible,
    grading
  }

}

/* ===============================
   INIT APP
================================*/

async function init(){

  const data = await loadData()

  PRODUCTS = data.products

  console.log("DATA LOADED", data)

  renderProducts()

}

init()

/* ===============================
   RENDER PRODUCT TABLE
================================*/

function renderProducts(){

  const tbody = document.querySelector("#productTable tbody")

  tbody.innerHTML = ""

  PRODUCTS.forEach(p => {

    const row = document.createElement("tr")

    row.innerHTML =
      <td>${p.sku}</td>

      <td>${p.productName ?? p.product}</td>

      <td>
        <button onclick="changeQty('${p.sku}',-1)">-</button>

        <input id="qty-${p.sku}" value="0">

        <button onclick="changeQty('${p.sku}',1)">+</button>
      </td>

      <td>${p.price}</td>
    `

    tbody.appendChild(row)

  })

}

/* ===============================
   QTY CONTROL
================================*/

function changeQty(sku, change){

  const input = document.getElementById("qty-" + sku)

  let value = parseInt(input.value)

  value += change

  if(value < 0) value = 0

  input.value = value

  updateCart()

}

/* ===============================
   UPDATE CART
================================*/

function updateCart(){

  CART = []

  PRODUCTS.forEach(p => {

    const qty = parseInt(
      document.getElementById("qty-" + p.sku).value
    )

    if(qty > 0){

      CART.push({
        sku: p.sku,
        qty: qty
      })

    }

  })

  calculate()

}

/* ===============================
   CALCULATE TOTAL
================================*/

function calculate(){

  let total = 0

  CART.forEach(item => {

    const p = PRODUCTS.find(x => x.sku === item.sku)

    total += p.price * item.qty

  })

  document.getElementById("totalValue").innerText = total

}
