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
let PRODUCTS=[]
let CART=[]

function renderProducts(){

const tbody=document.querySelector("#productTable tbody")

tbody.innerHTML=""

PRODUCTS.forEach(p=>{

const row=document.createElement("tr")

row.innerHTML=`

<td>${p.sku}</td>

<td>${p.product}</td>

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
function changeQty(sku,change){

const input=document.getElementById("qty-"+sku)

let value=parseInt(input.value)

value+=change

if(value<0)value=0

input.value=value

updateCart()

}
