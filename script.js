const WHATSAPP_NUMBER = "917302830054";

function toggleMenu() {
  document.getElementById("navMenu").classList.toggle("active");
}

function selectService(serviceName) {
  document.getElementById("service").value = serviceName;
  document.getElementById("order").scrollIntoView({behavior:"smooth"});
}

document.querySelectorAll("#navMenu a").forEach(link => {
  link.addEventListener("click", () => document.getElementById("navMenu").classList.remove("active"));
});

const fileInput = document.getElementById("file");
fileInput.addEventListener("change", () => {
  const files = [...fileInput.files];
  document.getElementById("fileList").textContent =
    files.length ? files.map(f => `${f.name} (${Math.round(f.size/1024)} KB)`).join(" • ") : "No file selected";
});

function makeOrderId() {
  const date = new Date();
  const stamp = date.getFullYear().toString().slice(-2)
    + String(date.getMonth()+1).padStart(2,"0")
    + String(date.getDate()).padStart(2,"0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `JDC-${stamp}-${random}`;
}

document.getElementById("orderForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const service = document.getElementById("service").value;
  const quantity = document.getElementById("quantity").value || "1";
  const details = document.getElementById("details").value.trim();
  const files = [...fileInput.files];

  if (!/^[0-9]{10}$/.test(mobile)) {
    alert("Please enter a valid 10 digit mobile number.");
    return;
  }

  const orderId = makeOrderId();

  document.getElementById("orderId").textContent = orderId;
  document.getElementById("orderSummary").textContent =
    `${service} • ${name} • Qty: ${quantity}${files.length ? ` • ${files.length} file(s) selected` : ""}`;

  const message =
`*New Order - Jeetu Digital Cyber Point*%0A%0A` +
`*Order ID:* ${encodeURIComponent(orderId)}%0A` +
`*Name:* ${encodeURIComponent(name)}%0A` +
`*Mobile:* ${encodeURIComponent(mobile)}%0A` +
`*Service:* ${encodeURIComponent(service)}%0A` +
`*Quantity:* ${encodeURIComponent(quantity)}%0A` +
`*Details:* ${encodeURIComponent(details || "N/A")}%0A` +
`*Files:* ${files.length ? encodeURIComponent(files.map(f => f.name).join(", ")) : "No file attached"}%0A%0A` +
`Please process my order.`;

  document.getElementById("waOrder").href = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  document.getElementById("successBox").classList.remove("hidden");
  document.getElementById("successBox").scrollIntoView({behavior:"smooth", block:"center"});

  const order = {
    orderId, name, mobile, service, quantity, details,
    files: files.map(f => f.name),
    status: "Pending",
    createdAt: new Date().toISOString()
  };
  const orders = JSON.parse(localStorage.getItem("jeetuOrders") || "[]");
  orders.unshift(order);
  localStorage.setItem("jeetuOrders", JSON.stringify(orders));
  localStorage.setItem("lastJeetuOrder", JSON.stringify(order));
  renderAdmin();
});

function copyOrder() {
  const id = document.getElementById("orderId").textContent;
  navigator.clipboard.writeText(id).then(() => alert("Order ID copied: " + id));
}

function getOrders() {
  return JSON.parse(localStorage.getItem("jeetuOrders") || "[]");
}

function saveOrders(orders) {
  localStorage.setItem("jeetuOrders", JSON.stringify(orders));
}

function trackOrder() {
  const id = document.getElementById("trackId").value.trim().toUpperCase();
  const result = document.getElementById("trackResult");
  if (!id) {
    result.innerHTML = '<div class="track-card">Please enter an Order ID.</div>';
    return;
  }
  const order = getOrders().find(o => o.orderId.toUpperCase() === id);
  if (!order) {
    result.innerHTML = '<div class="track-card">❌ Order not found on this device.</div>';
    return;
  }
  result.innerHTML = `<div class="track-card">
    <strong>${order.orderId}</strong><br>
    Service: ${escapeHtml(order.service)}<br>
    Customer: ${escapeHtml(order.name)}<br>
    <span class="status-pill">${escapeHtml(order.status)}</span>
  </div>`;
}

function updateOrderStatus(id, status) {
  const orders = getOrders();
  const index = orders.findIndex(o => o.orderId === id);
  if (index < 0) return;
  orders[index].status = status;
  saveOrders(orders);
  renderAdmin();
}

function renderAdmin() {
  const box = document.getElementById("adminOrders");
  if (!box) return;
  const filter = document.getElementById("statusFilter")?.value || "All";
  const orders = getOrders().filter(o => filter === "All" || o.status === filter);
  if (!orders.length) {
    box.innerHTML = '<div class="empty-admin">No orders found.</div>';
    return;
  }
  box.innerHTML = orders.map(o => `
    <div class="admin-order">
      <div class="admin-order-top">
        <div><strong>${o.orderId}</strong><br><small>${new Date(o.createdAt).toLocaleString()}</small></div>
        <span class="status-pill">${escapeHtml(o.status)}</span>
      </div>
      <p><strong>${escapeHtml(o.name)}</strong> • ${escapeHtml(o.mobile)}</p>
      <p>${escapeHtml(o.service)} • Qty: ${escapeHtml(String(o.quantity))}</p>
      <small>Files: ${o.files?.length ? escapeHtml(o.files.join(", ")) : "None"}</small>
      <div class="admin-actions">
        <button onclick="updateOrderStatus('${o.orderId}','Pending')">Pending</button>
        <button onclick="updateOrderStatus('${o.orderId}','Processing')">Processing</button>
        <button onclick="updateOrderStatus('${o.orderId}','Ready')">Ready</button>
        <button onclick="updateOrderStatus('${o.orderId}','Completed')">Completed</button>
        <button onclick="updateOrderStatus('${o.orderId}','Cancelled')">Cancelled</button>
      </div>
    </div>`).join("");
}

function clearOrders() {
  if (confirm("Delete all locally stored orders?")) {
    localStorage.removeItem("jeetuOrders");
    renderAdmin();
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

renderAdmin();


/* V3: demo admin authentication */
function adminLogin() {
  const user = document.getElementById("adminUser").value.trim();
  const pass = document.getElementById("adminPass").value;
  if (user === "JEETUCYBER" && pass === "Jeetu@7300") {
    sessionStorage.setItem("jeetuAdmin", "1");
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
    renderAdmin();
  } else {
    alert("Invalid admin credentials.");
  }
}

function initAdmin() {
  if (sessionStorage.getItem("jeetuAdmin") === "1") {
    document.getElementById("loginBox")?.classList.add("hidden");
    document.getElementById("adminPanel")?.classList.remove("hidden");
  }
}
initAdmin();

function copyUpi() {
  const upi = document.getElementById("upiId").textContent;
  navigator.clipboard.writeText(upi).then(() => alert("UPI ID copied."));
}

function printInvoice() {
  const last = JSON.parse(localStorage.getItem("lastJeetuOrder") || "null");
  if (!last) return alert("No order available for invoice.");
  const invoice = document.createElement("div");
  invoice.id = "invoicePrint";
  invoice.style.padding = "40px";
  invoice.style.fontFamily = "Arial";
  invoice.innerHTML = `
    <h1>Jeetu Digital Cyber Point</h1>
    <hr>
    <h2>Service Invoice</h2>
    <p><b>Order ID:</b> ${escapeHtml(last.orderId)}</p>
    <p><b>Date:</b> ${new Date(last.createdAt).toLocaleString()}</p>
    <p><b>Customer:</b> ${escapeHtml(last.name)}</p>
    <p><b>Mobile:</b> ${escapeHtml(last.mobile)}</p>
    <p><b>Service:</b> ${escapeHtml(last.service)}</p>
    <p><b>Quantity:</b> ${escapeHtml(String(last.quantity))}</p>
    <p><b>Status:</b> ${escapeHtml(last.status)}</p>
    <p><b>Details:</b> ${escapeHtml(last.details || "N/A")}</p>
    <br><p>Thank you for choosing Jeetu Digital Cyber Point.</p>`;
  document.body.appendChild(invoice);
  window.print();
  setTimeout(() => invoice.remove(), 500);
}
