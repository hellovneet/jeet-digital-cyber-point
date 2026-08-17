const DEFAULT_SETTINGS = {
  businessName: "Jeetu Digital Cyber Point", ownerName: "Jeetu", ownerRole: "Digital Services & Online Assistance",
  phone: "7302830054", upi: "Premshrm01@ptyes", address: "Nagla Churamani, Nagla Gukhrauli, Baldeo, Mathura",
  maps: "https://maps.app.goo.gl/8qJzYFHLZVmsMPy36?g_st=aw", onlineFormPrice: "99", hours: "9:00 AM – 8:00 PM",
  qr: "upi-qr.jpg", photo: "owner-photo.jpg"
};
const OWNER_EMAIL = "ps9905965@gmail.com";
let firestore = null;
let firebaseReady = false;

function initFirebase(){
  try{
    if(window.firebase && !firebase.apps.length) firebase.initializeApp(firebaseConfig);
    if(window.firebase){ firestore = firebase.firestore(); firebaseReady = true; }
  }catch(e){ console.error("Firebase init failed", e); }
}
function getSettings(){try{return {...DEFAULT_SETTINGS,...JSON.parse(localStorage.getItem("jeetuSettings")||"{}")}}catch{return {...DEFAULT_SETTINGS}}}
function saveSettings(s){localStorage.setItem("jeetuSettings",JSON.stringify(s))}
function waNumber(p){const d=String(p||"").replace(/\D/g,"");return d.length===10?"91"+d:d}
function setText(id,v){const e=document.getElementById(id);if(e)e.textContent=v}
function setHref(id,v){const e=document.getElementById(id);if(e)e.href=v}
function applySiteSettings(){
  const s=getSettings(); document.title=s.businessName;
  setText("heroBusinessName",s.businessName);setText("paymentBusinessName",s.businessName);setText("ownerBusinessName",s.businessName);setText("footerBusinessName",s.businessName);
  setText("ownerRole",s.ownerRole);setText("upiId",s.upi);setText("contactPhone",s.phone);setText("contactAddress",s.address);setText("onlineFormPrice","₹"+s.onlineFormPrice);setText("hoursText",s.hours);
  setHref("mapsLink",s.maps); const wa="https://wa.me/"+waNumber(s.phone);setHref("contactWhatsApp",wa);setHref("ownerWhatsApp",wa);setHref("floatingWhatsApp",wa);
  const qr=document.getElementById("upiQrImage");if(qr)qr.src=s.qr||DEFAULT_SETTINGS.qr;const photo=document.querySelector(".owner-photo-frame img");if(photo)photo.src=s.photo||DEFAULT_SETTINGS.photo;
}
function toggleMenu(){document.getElementById("navMenu")?.classList.toggle("active")}
function selectService(n){const e=document.getElementById("service");if(e)e.value=n;document.getElementById("order")?.scrollIntoView({behavior:"smooth"})}
document.querySelectorAll("#navMenu a").forEach(a=>a.addEventListener("click",()=>document.getElementById("navMenu")?.classList.remove("active")));

function renderPublicUpdates(items){
  const box=document.getElementById("publicUpdates");if(!box)return;
  const active=items.filter(x=>x.active!==false).sort((a,b)=>(b.important?1:0)-(a.important?1:0)||(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  if(!active.length){box.innerHTML='<div class="no-updates">No new updates right now. Please check again soon.</div>';return}
  box.innerHTML=active.map(x=>`<article class="update-card ${x.important?'important':''}">${x.important?'<span class="update-badge">IMPORTANT</span>':''}<span class="update-tag">${x.important?'Important Update':'Latest Update'}</span><h3>${escapeHtml(x.title||'Update')}</h3><p>${escapeHtml(x.description||'')}</p><div class="update-meta"><span>${x.lastDate?'Last date: '+escapeHtml(x.lastDate):'Recently posted'}</span><span>Jeetu Digital</span></div></article>`).join("");
}
function subscribePublicUpdates(){
  if(!firestore)return;
  firestore.collection("updates").onSnapshot(snap=>renderPublicUpdates(snap.docs.map(d=>({id:d.id,...d.data()}))),err=>{
    console.error(err);const box=document.getElementById("publicUpdates");if(box)box.innerHTML='<div class="no-updates">Updates are temporarily unavailable.</div>';
  });
}

const fileInput=document.getElementById("file");if(fileInput)fileInput.addEventListener("change",()=>{const list=document.getElementById("fileList"),fs=[...fileInput.files];if(list)list.textContent=fs.length?fs.map(f=>`${f.name} (${Math.round(f.size/1024)} KB)`).join(" • "):"No file selected"});
function makeOrderId(){const d=new Date(),stamp=d.getFullYear().toString().slice(-2)+String(d.getMonth()+1).padStart(2,"0")+String(d.getDate()).padStart(2,"0");return`JDC-${stamp}-${Math.floor(1000+Math.random()*9000)}`}
const orderForm=document.getElementById("orderForm");if(orderForm)orderForm.addEventListener("submit",function(e){e.preventDefault();const name=document.getElementById("name").value.trim(),mobile=document.getElementById("mobile").value.trim(),service=document.getElementById("service").value,quantity=document.getElementById("quantity").value||"1",details=document.getElementById("details").value.trim(),files=fileInput?[...fileInput.files]:[];if(!/^[0-9]{10}$/.test(mobile))return alert("Please enter a valid 10 digit mobile number.");if(!service)return alert("Please select a service.");const s=getSettings(),orderId=makeOrderId();setText("orderId",orderId);setText("orderSummary",`${service} • ${name} • Qty: ${quantity}${files.length?` • ${files.length} file(s) selected`:""}`);const message=`*New Order - ${encodeURIComponent(s.businessName)}*%0A%0A*Order ID:* ${encodeURIComponent(orderId)}%0A*Name:* ${encodeURIComponent(name)}%0A*Mobile:* ${encodeURIComponent(mobile)}%0A*Service:* ${encodeURIComponent(service)}%0A*Quantity:* ${encodeURIComponent(quantity)}%0A*Details:* ${encodeURIComponent(details||"N/A")}%0A*Files:* ${files.length?encodeURIComponent(files.map(f=>f.name).join(", ")):"No file attached"}%0A%0APlease process my order.`;const wa=document.getElementById("waOrder");if(wa)wa.href=`https://wa.me/${waNumber(s.phone)}?text=${message}`;document.getElementById("successBox")?.classList.remove("hidden");document.getElementById("successBox")?.scrollIntoView({behavior:"smooth",block:"center"});const order={orderId,name,mobile,service,quantity,details,files:files.map(f=>f.name),status:"Pending",createdAt:new Date().toISOString()};const orders=getOrders();orders.unshift(order);saveOrders(orders);localStorage.setItem("lastJeetuOrder",JSON.stringify(order));renderAdmin();});
function copyOrder(){const id=document.getElementById("orderId")?.textContent||"";navigator.clipboard?.writeText(id).then(()=>alert("Order ID copied: "+id))}
function getOrders(){try{return JSON.parse(localStorage.getItem("jeetuOrders")||"[]")}catch{return[]}}function saveOrders(o){localStorage.setItem("jeetuOrders",JSON.stringify(o))}
function trackOrder(){const id=document.getElementById("trackId")?.value.trim().toUpperCase(),r=document.getElementById("trackResult");if(!r)return;if(!id){r.innerHTML='<div class="track-card">Please enter an Order ID.</div>';return}const o=getOrders().find(x=>x.orderId.toUpperCase()===id);r.innerHTML=o?`<div class="track-card"><strong>${escapeHtml(o.orderId)}</strong><br>Service: ${escapeHtml(o.service)}<br>Customer: ${escapeHtml(o.name)}<br><span class="status-pill">${escapeHtml(o.status)}</span></div>`:'<div class="track-card">❌ Order not found on this device.</div>'}
function updateOrderStatus(id,status){const o=getOrders(),i=o.findIndex(x=>x.orderId===id);if(i<0)return;o[i].status=status;saveOrders(o);renderAdmin()}
function renderAdmin(){const box=document.getElementById("adminOrders");if(!box)return;const filter=document.getElementById("statusFilter")?.value||"All",orders=getOrders().filter(o=>filter==="All"||o.status===filter);if(!orders.length){box.innerHTML='<div class="empty-admin">No orders found.</div>';return}box.innerHTML=orders.map(o=>`<div class="admin-order"><div class="admin-order-top"><div><strong>${escapeHtml(o.orderId)}</strong><br><small>${new Date(o.createdAt).toLocaleString()}</small></div><span class="status-pill">${escapeHtml(o.status)}</span></div><p><strong>${escapeHtml(o.name)}</strong> • ${escapeHtml(o.mobile)}</p><p>${escapeHtml(o.service)} • Qty: ${escapeHtml(String(o.quantity))}</p><small>Files: ${o.files?.length?escapeHtml(o.files.join(", ")):"None"}</small><div class="admin-actions"><button onclick="updateOrderStatus('${o.orderId}','Pending')">Pending</button><button onclick="updateOrderStatus('${o.orderId}','Processing')">Processing</button><button onclick="updateOrderStatus('${o.orderId}','Ready')">Ready</button><button onclick="updateOrderStatus('${o.orderId}','Completed')">Completed</button><button onclick="updateOrderStatus('${o.orderId}','Cancelled')">Cancelled</button></div></div>`).join("")}
function clearOrders(){if(confirm("Delete all locally stored orders?")){localStorage.removeItem("jeetuOrders");renderAdmin()}}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function copyUpi(){const u=document.getElementById("upiId")?.textContent||"";navigator.clipboard?.writeText(u).then(()=>alert("UPI ID copied."))}
function printInvoice(){const last=JSON.parse(localStorage.getItem("lastJeetuOrder")||"null");if(!last)return alert("No order available for invoice.");const s=getSettings(),i=document.createElement("div");i.id="invoicePrint";i.style.padding="40px";i.style.fontFamily="Arial";i.innerHTML=`<h1>${escapeHtml(s.businessName)}</h1><hr><h2>Service Invoice</h2><p><b>Order ID:</b> ${escapeHtml(last.orderId)}</p><p><b>Date:</b> ${new Date(last.createdAt).toLocaleString()}</p><p><b>Customer:</b> ${escapeHtml(last.name)}</p><p><b>Mobile:</b> ${escapeHtml(last.mobile)}</p><p><b>Service:</b> ${escapeHtml(last.service)}</p><p><b>Quantity:</b> ${escapeHtml(String(last.quantity))}</p><p><b>Status:</b> ${escapeHtml(last.status)}</p><p><b>Details:</b> ${escapeHtml(last.details||"N/A")}</p><br><p>${escapeHtml(s.address)}</p><p>Thank you for choosing ${escapeHtml(s.businessName)}.</p>`;document.body.appendChild(i);window.print();setTimeout(()=>i.remove(),500)}
function loadOwnerSettingsForm(){const s=getSettings(),m={setBusinessName:"businessName",setOwnerName:"ownerName",setOwnerRole:"ownerRole",setPhone:"phone",setUpi:"upi",setAddress:"address",setMaps:"maps",setOnlineFormPrice:"onlineFormPrice",setHours:"hours"};Object.entries(m).forEach(([id,k])=>{const e=document.getElementById(id);if(e)e.value=s[k]??""});const p=document.getElementById("ownerPhotoPreview");if(p)p.src=s.photo||DEFAULT_SETTINGS.photo;const q=document.getElementById("qrPreview");if(q)q.src=s.qr||DEFAULT_SETTINGS.qr}
function saveOwnerSettings(){const s=getSettings(),m={businessName:"setBusinessName",ownerName:"setOwnerName",ownerRole:"setOwnerRole",phone:"setPhone",upi:"setUpi",address:"setAddress",maps:"setMaps",onlineFormPrice:"setOnlineFormPrice",hours:"setHours"};Object.entries(m).forEach(([k,id])=>{const e=document.getElementById(id);if(e)s[k]=e.value.trim()});saveSettings(s);applySiteSettings();loadOwnerSettingsForm();alert("Local website settings saved.")}
function resetOwnerSettings(){if(confirm("Reset website settings?")){saveSettings({...DEFAULT_SETTINGS});applySiteSettings();loadOwnerSettingsForm()}}
function readImageToSetting(inputId,key,previewId){const input=document.getElementById(inputId);if(!input?.files?.[0])return;const f=input.files[0];if(f.size>2.5*1024*1024){alert("Please choose an image smaller than 2.5 MB.");input.value="";return}const r=new FileReader();r.onload=()=>{const s=getSettings();s[key]=r.result;saveSettings(s);const p=document.getElementById(previewId);if(p)p.src=r.result;applySiteSettings()};r.readAsDataURL(f)}

// Firebase Owner Authentication + Latest Updates manager
function firebaseOwnerLogin(){
  if(!firebaseReady)return alert("Firebase is not ready. Refresh the page and try again.");
  const email=document.getElementById("adminUser")?.value.trim(),pass=document.getElementById("adminPass")?.value;
  if(email!==OWNER_EMAIL)return alert("Use the registered owner email.");
  firebase.auth().signInWithEmailAndPassword(email,pass).then(user=>{
    if(user.user.email!==OWNER_EMAIL){firebase.auth().signOut();throw new Error("Not owner")}
    sessionStorage.setItem("firebaseOwner","1"); showOwnerPanel();
  }).catch(e=>alert("Owner login failed: "+(e.code||e.message)));
}
function ownerLogout(){firebase?.auth?.().signOut?.();sessionStorage.removeItem("firebaseOwner");location.reload()}
function showOwnerPanel(){document.getElementById("ownerLogin").style.display="none";document.getElementById("ownerPanel").style.display="block";loadOwnerSettingsForm();renderAdmin();renderFirebaseUpdatesAdmin();updateStats()}
function updateStats(){const o=getOrders(),c=s=>o.filter(x=>x.status===s).length;const a=document.getElementById("statTotal");if(a)a.textContent=o.length;const b=document.getElementById("statPending");if(b)b.textContent=c("Pending");const d=document.getElementById("statReady");if(d)d.textContent=c("Ready");const e=document.getElementById("statCompleted");if(e)e.textContent=c("Completed")}
function ownerIsLoggedIn(){return firebaseReady&&firebase.auth().currentUser?.email===OWNER_EMAIL}
async function addFirebaseUpdate(){
  if(!ownerIsLoggedIn())return alert("Please login as owner first.");
  const title=document.getElementById("updateTitle")?.value.trim(),description=document.getElementById("updateDescription")?.value.trim(),lastDate=document.getElementById("updateLastDate")?.value.trim(),important=document.getElementById("updateImportant")?.checked??false,active=document.getElementById("updateActive")?.checked??true;
  if(!title||!description)return alert("Title and description are required.");
  await firestore.collection("updates").add({title,description,lastDate,important,active,createdAt:firebase.firestore.FieldValue.serverTimestamp(),createdBy:OWNER_EMAIL});
  document.getElementById("updateTitle").value="";document.getElementById("updateDescription").value="";document.getElementById("updateLastDate").value="";document.getElementById("updateImportant").checked=false;document.getElementById("updateActive").checked=true;
  alert("Update published to Firebase. Customers can see it now.");
}
function renderFirebaseUpdatesAdmin(){
  const box=document.getElementById("firebaseUpdatesAdmin");if(!box||!firestore)return;
  firestore.collection("updates").orderBy("createdAt","desc").onSnapshot(snap=>{
    if(!snap.docs.length){box.innerHTML='<div class="empty-admin">No live updates yet.</div>';return}
    box.innerHTML=snap.docs.map(d=>{const x=d.data();return `<div class="admin-update-card"><div class="admin-update-top"><h3>${escapeHtml(x.title||"Update")}</h3><span class="status-pill">${x.active===false?"Hidden":(x.important?"Important":"Live")}</span></div><p>${escapeHtml(x.description||"")}</p><small>${x.lastDate?"Last date: "+escapeHtml(x.lastDate):"No last date"}</small><div class="admin-update-actions"><button onclick="toggleFirebaseUpdate('${d.id}',${x.active!==false})">${x.active===false?"Publish":"Hide"}</button><button class="danger" onclick="deleteFirebaseUpdate('${d.id}')">Delete</button></div></div>`}).join("");
  },err=>{box.innerHTML='<div class="empty-admin">Unable to load updates: '+escapeHtml(err.message)+'</div>'});
}
async function toggleFirebaseUpdate(id,current){if(!ownerIsLoggedIn())return alert("Please login as owner.");await firestore.collection("updates").doc(id).update({active:!current})}
async function deleteFirebaseUpdate(id){if(!ownerIsLoggedIn())return alert("Please login as owner.");if(confirm("Delete this update permanently?"))await firestore.collection("updates").doc(id).delete()}

initFirebase();applySiteSettings();renderAdmin();subscribePublicUpdates();
