/* =================================
   GLOBAL STATE
================================= */

let PRODUCTS = []
let CART = []


/* =================================
   LOAD DATA
================================= */

async function loadData(){

  const products = await fetch("./data/products.json")
    .then(res => res.json())

  const customers = await fetch("./data/customers.json")
    .then(res => res.json())

  const flexible = await fetch("./data/flexible-package.json")
    .then(res => res.json())

  const grading = await fetch("./data/grading-foc.json")
    .then(res => res.json())

  return {
    products,
    customers,
    flexible,
    grading
  }

}


/* =================================
   INIT APPLICATION
================================= */

async function init(){

  try{

    const data = await loadData()

    PRODUCTS = data.products

    console.log("DATA LOADED:", data)

    renderProducts()

  }catch(error){

    console.error("LOAD ERROR:", error)

  }

}

init()


/* =================================
   RENDER PRODUCT TABLE
================================= */

function renderProducts(){

  const tbody = document.querySelector("#productTable tbody")

  tbody.innerHTML = ""

  PRODUCTS.forEach(p => {

    const row = document.createElement("tr")

    row.innerHTML = 
      <td>${p.sku}</td>

      <td>${p.productName}</td>

      <td>
        <button onclick="changeQty('${p.sku}',-1)">-</button>

        <input id="qty-${p.sku}" value="0">

        <button onclick="changeQty('${p.sku}',1)">+</button>
      </td>

      <td>${formatCurrency(p.price)}</td>
    

    tbody.appendChild(row)

  })

}


/* =================================
   QTY CONTROL
================================= */

function changeQty(sku, change){

  const input = document.getElementById("qty-" + sku)

  let value = parseInt(input.value)

  value += change

  if(value < 0){
    value = 0
  }

  input.value = value

  updateCart()

}


/* =================================
   UPDATE CART
================================= */

function updateCart(){

  CART = []

  PRODUCTS.forEach(p => {

    const qtyInput = document.getElementById("qty-" + p.sku)

    if(!qtyInput) return

    const qty = parseInt(qtyInput.value)

    if(qty > 0){

      CART.push({
        sku: p.sku,
        qty: qty
      })

    }

  })

  calculate()

}


/* =================================
   CALCULATE TOTAL
================================= */

function calculate(){

  let total = 0

  CART.forEach(item => {

    const product = PRODUCTS.find(
      p => p.sku === item.sku
    )

    if(product){
      total += product.price * item.qty
    }

  })

  document.getElementById("totalValue").innerText =
    formatCurrency(total)

}


/* =================================
   HELPER
================================= */

function formatCurrency(value){

  return new Intl.NumberFormat("id-ID",{
    style:"currency",
    currency:"IDR",
    minimumFractionDigits:0
  }).format(value)

}
