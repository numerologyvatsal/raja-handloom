const CATEGORIES = [
  "Towel", "Napkin", "Bedsheet", "Comforter Set", "Carpet",
  "Aasan", "Lungi", "Shawl", "Towel Set", "Doormat",
  "Runner Set", "Dohar", "Blanket"
];

const PRODUCTS_KEY = "rajaHandloomProductsV1";
const CART_KEY = "rajaHandloomCartV1";
const BUYER_KEY = "rajaHandloomBuyerV1";

let products = readStore(PRODUCTS_KEY, []);
let cart = readStore(CART_KEY, []);
let selectedCategory = "All Categories";

const $ = (id) => document.getElementById(id);

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(Number(value) || 0);

function readStore(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    alert("Browser storage is full. Remove some product photos and try again.");
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function setupCategories() {
  $("categorySelect").innerHTML = CATEGORIES.map(
    (category) =>
      `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`
  ).join("");

  renderCategoryFilters();
}

function renderCategoryFilters() {
  const categories = ["All Categories", ...CATEGORIES];

  $("categoryFilters").innerHTML = categories.map((category) => `
    <button
      class="filter-chip ${selectedCategory === category ? "active" : ""}"
      data-category="${escapeHtml(category)}"
      type="button"
    >
      ${escapeHtml(category)}
    </button>
  `).join("");
}

function renderProducts() {
  const query = $("searchInput").value.trim().toLowerCase();

  const visibleProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "All Categories" ||
      product.category === selectedCategory;

    const searchableText =
      `${product.name} ${product.design} ${product.category}`.toLowerCase();

    return matchesCategory && searchableText.includes(query);
  });

  if (visibleProducts.length === 0) {
    $("productGrid").innerHTML = `
      <div class="empty-state">
        <strong>No products yet</strong>
        Select “Add Product” to add a variety, price, and design photo.
      </div>
    `;
    return;
  }

  $("productGrid").innerHTML = visibleProducts.map((product) => `
    <article class="product-card">
      <div class="product-photo">
        ${
          product.image
            ? `<img src="${product.image}" alt="${escapeHtml(product.name)}">`
            : `<span>✳</span>`
        }
      </div>

      <div class="product-info">
        <button
          class="delete-product"
          data-delete-product="${product.id}"
          type="button"
        >
          Delete
        </button>

        <div class="product-category">${escapeHtml(product.category)}</div>
        <h3>${escapeHtml(product.name)}</h3>
        <div class="product-design">
          ${escapeHtml(product.design || "No design details")}
        </div>

        <div class="product-bottom">
          <span class="product-price">
            ${money(product.price)} / ${escapeHtml(product.unit)}
          </span>
          <button class="add-button" data-add="${product.id}" type="button">
            ＋ Add
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

function addToCart(productId) {
  const existingItem = cart.find((item) => item.productId === productId);

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({ productId, qty: 1 });
  }

  saveStore(CART_KEY, cart);
  renderCart();
}

function renderCart() {
  cart = cart.filter((row) =>
    products.some((product) => product.id === row.productId)
  );

  saveStore(CART_KEY, cart);

  const totalQuantity = cart.reduce((sum, row) => sum + row.qty, 0);
  $("cartCount").textContent = totalQuantity;

  if (cart.length === 0) {
    $("cartItems").innerHTML = `
      <div class="cart-empty">Your cart is empty.</div>
    `;
  } else {
    $("cartItems").innerHTML = cart.map((row) => {
      const product = products.find(
        (item) => item.id === row.productId
      );

      return `
        <div class="cart-row">
          <div>
            <strong>${escapeHtml(product.name)}</strong>
            <small>
              ${escapeHtml(product.category)} ·
              ${money(product.price)} / ${escapeHtml(product.unit)}
            </small>

            <div class="qty">
              <button
                data-qty="${product.id}"
                data-change="-1"
                type="button"
                aria-label="Decrease quantity"
              >−</button>

              <input
                class="qty-input"
                data-qty-input="${product.id}"
                type="number"
                min="1"
                step="1"
                value="${row.qty}"
                aria-label="Quantity"
              >

              <button
                data-qty="${product.id}"
                data-change="1"
                type="button"
                aria-label="Increase quantity"
              >＋</button>
            </div>
          </div>

          <div class="cart-price">
            ${money(product.price * row.qty)}
            <div>
              <button
                class="remove-item"
                data-remove="${product.id}"
                type="button"
                aria-label="Remove item"
              >×</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  updateTotals();
}

function updateTotals() {
  const subtotal = cart.reduce((sum, row) => {
    const product = products.find(
      (item) => item.id === row.productId
    );

    return sum + (product ? Number(product.price) * row.qty : 0);
  }, 0);

  const discount = Math.max(
    0,
    Number($("discountInput").value) || 0
  );

  const shipping = Math.max(
    0,
    Number($("shippingInput").value) || 0
  );

  const total = Math.max(0, subtotal - discount) + shipping;

  $("subtotalValue").textContent = money(subtotal);
  $("discountValue").textContent = "− " + money(discount);
  $("shippingValue").textContent = money(shipping);
  $("totalValue").textContent = money(total);
}

function saveBuyerDetails() {
  const buyer = {
    name: $("buyerName").value,
    phone: $("buyerPhone").value,
    gst: $("buyerGst").value,
    address: $("buyerAddress").value
  };

  saveStore(BUYER_KEY, buyer);
}

function loadBuyerDetails() {
  const buyer = readStore(BUYER_KEY, {});

  $("buyerName").value = buyer.name || "";
  $("buyerPhone").value = buyer.phone || "";
  $("buyerGst").value = buyer.gst || "";
  $("buyerAddress").value = buyer.address || "";
}

async function compressImage(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selected file is not an image.");
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  const scale = Math.min(
    1,
    750 / image.width,
    750 / image.height
  );

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.7);
}

$("productForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  let image = "";
  const file = $("productImage").files[0];

  if (file) {
    try {
      image = await compressImage(file);
    } catch {
      alert("Could not read this photo. Please choose another image.");
      return;
    }
  }

  const product = {
    id: makeId(),
    category: $("categorySelect").value,
    name: $("productName").value.trim(),
    design: $("productDesign").value.trim(),
    price: Number($("productPrice").value),
    unit: $("productUnit").value,
    image
  };

  products.unshift(product);
  saveStore(PRODUCTS_KEY, products);

  event.target.reset();
  renderProducts();
  alert("Product saved.");
});

$("productGrid").addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");

  if (addButton) {
    addToCart(addButton.dataset.add);
  }

  const deleteButton = event.target.closest("[data-delete-product]");

  if (deleteButton) {
    const shouldDelete = confirm(
      "Delete this product and remove it from the cart?"
    );

    if (!shouldDelete) return;

    const id = deleteButton.dataset.deleteProduct;

    products = products.filter((item) => item.id !== id);
    cart = cart.filter((item) => item.productId !== id);

    saveStore(PRODUCTS_KEY, products);
    saveStore(CART_KEY, cart);

    renderProducts();
    renderCart();
  }
});

$("cartItems").addEventListener("click", (event) => {
  const quantityButton = event.target.closest("[data-qty]");

  if (quantityButton) {
    const row = cart.find(
      (item) => item.productId === quantityButton.dataset.qty
    );

    if (row) {
      row.qty += Number(quantityButton.dataset.change);

      if (row.qty <= 0) {
        cart = cart.filter((item) => item !== row);
      }

      saveStore(CART_KEY, cart);
      renderCart();
    }
  }

  const removeButton = event.target.closest("[data-remove]");

  if (removeButton) {
    cart = cart.filter(
      (item) => item.productId !== removeButton.dataset.remove
    );

    saveStore(CART_KEY, cart);
    renderCart();
  }
});

// Update the cart when a quantity is typed.
$("cartItems").addEventListener("input", (event) => {
  const input = event.target.closest("[data-qty-input]");

  if (!input || input.value === "") return;

  const row = cart.find(
    (item) => item.productId === input.dataset.qtyInput
  );

  const quantity = Math.floor(Number(input.value));

  if (row && quantity >= 1) {
    row.qty = quantity;

    saveStore(CART_KEY, cart);

    $("cartCount").textContent = cart.reduce(
      (sum, item) => sum + item.qty,
      0
    );

    updateTotals();
  }
});

// Make sure the quantity is at least 1 when leaving the quantity box.
$("cartItems").addEventListener("change", (event) => {
  const input = event.target.closest("[data-qty-input]");

  if (!input) return;

  const row = cart.find(
    (item) => item.productId === input.dataset.qtyInput
  );

  if (!row) return;

  const quantity = Math.max(
    1,
    Math.floor(Number(input.value) || 1)
  );

  row.qty = quantity;
  input.value = quantity;

  saveStore(CART_KEY, cart);

  $("cartCount").textContent = cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  updateTotals();
});

$("categoryFilters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");

  if (!button) return;

  selectedCategory = button.dataset.category;
  renderCategoryFilters();
  renderProducts();
});

$("searchInput").addEventListener("input", renderProducts);

$("discountInput").addEventListener("input", updateTotals);
$("shippingInput").addEventListener("input", updateTotals);

["buyerName", "buyerPhone", "buyerGst", "buyerAddress"].forEach((id) => {
  $(id).addEventListener("input", saveBuyerDetails);
});

$("clearCartBtn").addEventListener("click", () => {
  if (cart.length > 0 && !confirm("Clear the cart?")) {
    return;
  }

  cart = [];
  saveStore(CART_KEY, cart);
  renderCart();
});

$("showFormBtn").addEventListener("click", () => {
  $("productFormPanel").scrollIntoView({ behavior: "smooth" });
  $("productName").focus();
});

$("hideFormBtn").addEventListener("click", () => {
  $("productFormPanel").scrollIntoView({ behavior: "smooth" });
});

$("printBillBtn").addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Add a product to the cart before creating a bill.");
    return;
  }

  saveBuyerDetails();

  const buyer = {
    name: $("buyerName").value.trim() || "—",
    phone: $("buyerPhone").value.trim(),
    gst: $("buyerGst").value.trim(),
    address: $("buyerAddress").value.trim()
  };

  const invoiceNo =
    "RH-" +
    new Date().toISOString().slice(0, 10).replaceAll("-", "") +
    "-" +
    Math.floor(100 + Math.random() * 900);

  const subtotal = cart.reduce((sum, row) => {
    const product = products.find(
      (item) => item.id === row.productId
    );

    return sum + (product ? Number(product.price) * row.qty : 0);
  }, 0);

  const discount = Math.max(
    0,
    Number($("discountInput").value) || 0
  );

  const shipping = Math.max(
    0,
    Number($("shippingInput").value) || 0
  );

  const total = Math.max(0, subtotal - discount) + shipping;

  const rows = cart.map((row, index) => {
    const product = products.find(
      (item) => item.id === row.productId
    );

    return `
      <tr>
        <td>${index + 1}</td>
        <td>
          ${escapeHtml(product.name)}
          ${product.design ? `<br><small>${escapeHtml(product.design)}</small>` : ""}
        </td>
        <td>${escapeHtml(product.category)}</td>
        <td>${row.qty} ${escapeHtml(product.unit)}</td>
        <td class="right">${money(product.price)}</td>
        <td class="right">${money(product.price * row.qty)}</td>
      </tr>
    `;
  }).join("");

  $("invoice").innerHTML = `
    <div class="invoice-head">
      <div>
        <h1>RAJA HANDLOOM</h1>
        <p>Textile Wholesale Order Bill</p>
      </div>
      <div>
        <p><strong>Bill No:</strong> ${invoiceNo}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString("en-IN")}</p>
      </div>
    </div>

    <h2>Trader / Customer Details</h2>
    <p><strong>Name:</strong> ${escapeHtml(buyer.name)}</p>
    ${buyer.phone ? `<p><strong>Mobile:</strong> ${escapeHtml(buyer.phone)}</p>` : ""}
    ${buyer.gst ? `<p><strong>GSTIN:</strong> ${escapeHtml(buyer.gst)}</p>` : ""}
    ${buyer.address ? `<p><strong>Address:</strong> ${escapeHtml(buyer.address)}</p>` : ""}

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Product</th>
          <th>Category</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="invoice-totals">
      <div><span>Subtotal</span><strong>${money(subtotal)}</strong></div>
      <div><span>Discount</span><strong>− ${money(discount)}</strong></div>
      <div><span>Extra charge / freight</span><strong>${money(shipping)}</strong></div>
      <div class="final"><span>Total</span><strong>${money(total)}</strong></div>
    </div>

    <div class="invoice-foot">
      <p>Thank you!</p>
      <p><strong>RAJA HANDLOOM</strong></p>
    </div>
  `;

  window.print();
});

function updateConnectionStatus() {
  const status = $("connectionStatus");
  const isOnline = navigator.onLine;

  status.textContent = isOnline
    ? "Online"
    : "Offline · App ready";

  status.classList.toggle("offline", !isOnline);
}

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);

setupCategories();
loadBuyerDetails();
renderProducts();
renderCart();
updateConnectionStatus();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch((error) => {
        console.log("Offline cache setup failed:", error);
      });
  });
}