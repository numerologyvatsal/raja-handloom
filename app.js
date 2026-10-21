(() => {
  'use strict';
  const KEYS = {
    products: 'rajaHandloomProductsV1',
    cart: 'rajaHandloomCartV1',
    categories: 'rajaHandloomCategoriesV1',
    buyer: 'rajaHandloomBuyerV1',
    history: 'rajaHandloomOrderHistoryV1',
    subcategories: 'rajaHandloomSubcategoriesV1'
  };
  const DEFAULT_CATEGORIES = ['Towel','Napkin','Bedsheet','Comforter Set','Carpet','Aasan','Lungi','Shawl','Towel Set','Doormat','Runner Set','Dohar','Blanket'];
  const $ = id => document.getElementById(id);
  const read = (key, fallback) => { try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (_) { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { toast('Storage is full. Remove a few photos or clear old data.'); return false; } };
  let products = read(KEYS.products, []);
  let cart = read(KEYS.cart, []);
  let categories = read(KEYS.categories, DEFAULT_CATEGORIES);
  let history = read(KEYS.history, []);
  let subcategories = read(KEYS.subcategories, []);
  let photoData = '';
  let deferredInstall = null;
  let toastTimer;
  const money = n => '₹' + (Number(n) || 0).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2});
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`;
  function toast(message) { const el = $('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2500); }
  function normalizedCategories() { categories = [...new Set([...DEFAULT_CATEGORIES, ...(Array.isArray(categories) ? categories : [])].map(c => String(c).trim()).filter(Boolean))]; write(KEYS.categories, categories); }
  function renderCategoryOptions() {
    normalizedCategories();
    const filter = $('categoryFilter'); const old = filter.value || 'all';
    filter.innerHTML = '<option value="all">All categories</option>' + categories.map(c => `<option value="${safe(c)}">${safe(c)}</option>`).join('');
    filter.value = categories.includes(old) || old === 'all' ? old : 'all';
    const select = $('productCategory'); const selected = select.value;
    select.innerHTML = categories.map(c => `<option value="${safe(c)}">${safe(c)}</option>`).join('');
    if (categories.includes(selected)) select.value = selected;
    $('categoryCount').textContent = categories.length;
    ['subcategoryMainCategory','galleryCategorySelect'].forEach(id => { const el=$(id); if(!el)return; const prior=el.value; el.innerHTML=categories.map(c=>`<option value="${safe(c)}">${safe(c)}</option>`).join(''); el.value=categories.includes(prior)?prior:(categories[0]||''); });
    refreshSubcategorySelects();
  }
  function getCollections(category) { return subcategories.filter(item=>item.category===category); }
  function refreshSubcategorySelects() {
    const category=$('productCategory')?.value || categories[0] || '';
    const productSelect=$('productSubcategory');
    if(productSelect){const old=productSelect.value;productSelect.innerHTML='<option value="">No subcategory</option>'+getCollections(category).map(c=>`<option value="${safe(c.id)}">${safe(c.name)}</option>`).join('');if(getCollections(category).some(c=>c.id===old))productSelect.value=old;}
    const filter=$('subcategoryFilter');
    if(filter){const old=filter.value;const selectedCat=$('categoryFilter').value;const available=selectedCat==='all'?subcategories: getCollections(selectedCat);filter.innerHTML='<option value="all">All subcategories</option>'+available.map(c=>`<option value="${safe(c.id)}">${safe(c.name)}</option>`).join('');if(available.some(c=>c.id===old))filter.value=old;else filter.value='all';}
    const manager=$('designCollectionSelect');
    if(manager){const old=manager.value;manager.innerHTML=subcategories.length?subcategories.map(c=>`<option value="${safe(c.id)}">${safe(c.category)} / ${safe(c.name)}</option>`).join(''):'<option value="">Add a subcategory first</option>';if(subcategories.some(c=>c.id===old))manager.value=old;}
    const galleryCategory=$('galleryCategorySelect')?.value; const gallerySelect=$('gallerySubcategorySelect');
    if(gallerySelect){const old=gallerySelect.value;const available=getCollections(galleryCategory);gallerySelect.innerHTML=available.length?available.map(c=>`<option value="${safe(c.id)}">${safe(c.name)}</option>`).join(''):'<option value="">No subcategories</option>';if(available.some(c=>c.id===old))gallerySelect.value=old;}
  }
  function renderManageCollections() {
    const host=$('manageCollectionList'); if(!host)return;
    host.innerHTML=subcategories.length?subcategories.map(c=>`<div class="manage-collection"><div><strong>${safe(c.name)}</strong><small>${safe(c.category)} · ${(c.photos||[]).length} design photos</small></div><div class="manage-actions"><button type="button" data-select-collection="${safe(c.id)}">Add photos</button><button type="button" data-preview-collection="${safe(c.id)}">View</button><button type="button" class="danger-text" data-delete-collection="${safe(c.id)}">Delete</button></div></div>`).join(''):'<p class="muted">No subcategories yet. Add one above, such as Ritugold under Towel.</p>';
  }
  function renderCustomerGallery() {
    refreshSubcategorySelects();
    const collection=subcategories.find(c=>c.id===$('gallerySubcategorySelect').value);
    const photos=collection?.photos||[];
    $('customerGalleryGrid').innerHTML=photos.map((photo,index)=>`<figure class="customer-design"><img src="${photo.data}" alt="${safe(photo.name||`${collection.name} design ${index+1}`)}" loading="lazy"><figcaption>${safe(photo.name||`${collection.name} · Design ${index+1}`)}</figcaption></figure>`).join('');
    $('emptyGallery').classList.toggle('hidden',photos.length>0);
  }
  function renderProducts() {
    renderCategoryOptions();
    const term = $('searchInput').value.trim().toLowerCase(); const cat = $('categoryFilter').value; const subcat=$('subcategoryFilter').value;
    const shown = products.filter(p => (cat === 'all' || p.category === cat) && (subcat==='all'||p.subcategoryId===subcat) && (!term || `${p.name} ${p.category} ${p.subcategory||''} ${p.unit}`.toLowerCase().includes(term)));
    $('productCount').textContent = products.length;
    $('productGrid').innerHTML = shown.map(p => `<article class="product-card"><div class="product-photo">${p.photo ? `<img src="${p.photo}" alt="${safe(p.name)}" loading="lazy">` : '<span class="photo-placeholder">RH</span>'}</div><div class="product-info"><div class="product-category">${safe(p.category)}</div>${p.subcategory?`<span class="subcategory-tag">${safe(p.subcategory)}</span>`:''}<div class="product-name" title="${safe(p.name)}">${safe(p.name)}</div><div class="product-meta"><span>${safe(p.unit || 'Piece')}</span><strong class="product-price">${money(p.price)}</strong></div><div class="product-actions"><button class="add-to-cart" data-add="${safe(p.id)}">＋ Add</button><button data-edit="${safe(p.id)}">Edit</button><button data-delete="${safe(p.id)}" aria-label="Delete ${safe(p.name)}">×</button></div></div></article>`).join('');
    $('emptyProducts').classList.toggle('hidden', shown.length !== 0);
  }
  function cartPrice(item, product) { return Number.isFinite(Number(item.unitPrice)) ? Number(item.unitPrice) : Number(product.price); }
  function renderCart() {
    const count = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0); $('cartCount').textContent = count; $('cartBadge').textContent = count;
    $('cartItems').innerHTML = cart.map(item => { const p = products.find(product => product.id === item.id); if (!p) return ''; const qty = Math.max(0, Number(item.qty) || 0); const price=cartPrice(item,p); return `<div class="cart-line"><div><div class="cart-line-name">${safe(p.name)}</div><div class="cart-line-price">Catalog: ${money(p.price)} / ${safe(p.unit || 'Piece')}</div></div><div class="cart-line-right"><div class="cart-line-total">${money(price * qty)}</div><label class="cart-special-price">Bill price ₹<input type="number" min="0" step="0.01" inputmode="decimal" value="${price}" data-price-input="${safe(p.id)}" aria-label="Special bill price for ${safe(p.name)}"></label><div class="qty-control"><button type="button" data-qty="${safe(p.id)}" data-step="-1" aria-label="Decrease quantity">−</button><input type="number" min="0" step="any" inputmode="decimal" value="${qty}" data-qty-input="${safe(p.id)}" aria-label="Quantity of ${safe(p.name)}"><button type="button" data-qty="${safe(p.id)}" data-step="1" aria-label="Increase quantity">＋</button><button type="button" class="remove-line" data-remove="${safe(p.id)}" aria-label="Remove ${safe(p.name)}">×</button></div></div></div>`; }).join('');
    $('emptyCart').classList.toggle('hidden', cart.length > 0);
    const subtotal = cart.reduce((sum,item) => { const p = products.find(product => product.id === item.id); return sum + (p ? cartPrice(item,p) * Number(item.qty || 0) : 0); }, 0);
    const discount = Math.max(0, Number($('discountInput').value) || 0), freight = Math.max(0, Number($('freightInput').value) || 0);
    $('subtotalValue').textContent = money(subtotal); $('discountValue').textContent = '− ' + money(discount); $('freightValue').textContent = money(freight); $('totalValue').textContent = money(Math.max(0, subtotal - discount + freight));
    write(KEYS.cart, cart);
  }
  function renderHistory() {
    $('historyCount').textContent = history.length;
    $('emptyHistory').classList.toggle('hidden', history.length > 0);
    $('historyList').innerHTML = history.map(b => `<article class="history-card"><div><strong>${safe(b.customer.name || 'Walk-in customer')}</strong><br><small>${safe(b.invoice)} · ${safe(new Date(b.createdAt).toLocaleString())}</small><div class="history-actions"><button type="button" data-view-bill="${safe(b.id)}">View bill</button><button type="button" data-print-bill="${safe(b.id)}">Reprint</button><button type="button" class="danger-text" data-delete-bill="${safe(b.id)}">Delete</button></div></div><div class="history-total">${money(b.total)}</div></article>`).join('');
  }
  function addToCart(id) { const p = products.find(item => item.id === id); if (!p) return; const item = cart.find(i => i.id === id); if (item) item.qty = Number(item.qty || 0) + 1; else cart.push({id, qty:1, unitPrice:Number(p.price)}); write(KEYS.cart, cart); renderCart(); toast('Added to cart'); }
  function setQuantity(id, value) { const qty = Math.max(0, Number(value) || 0); const item = cart.find(i => i.id === id); if (!item) return; if (qty <= 0) cart = cart.filter(i => i.id !== id); else item.qty = qty; write(KEYS.cart, cart); renderCart(); }
  function openProduct(product) {
    $('productForm').reset(); photoData = ''; $('editProductId').value = product?.id || ''; $('productDialogTitle').textContent = product ? 'Edit product' : 'Add product';
    renderCategoryOptions(); $('productCategory').value = product?.category || categories[0]; refreshSubcategorySelects(); $('productSubcategory').value=product?.subcategoryId||''; $('productName').value = product?.name || ''; $('productPrice').value = product?.price ?? ''; $('productUnit').value = product?.unit || 'Piece';
    $('productDialog').showModal();
  }
  function createBill() {
    const items = cart.map(item => { const p = products.find(product => product.id === item.id); return p ? {id:p.id, name:p.name, category:p.category, subcategory:p.subcategory||'', unit:p.unit || 'Piece', price:cartPrice(item,p), qty:Number(item.qty)} : null; }).filter(Boolean);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0); const discount = Math.max(0, Number($('discountInput').value) || 0), freight = Math.max(0, Number($('freightInput').value) || 0);
    const createdAt = new Date().toISOString(); const count = history.length + 1; const invoice = `RH-${createdAt.slice(0,10).replaceAll('-','')}-${String(count).padStart(3,'0')}`;
    const bill = {id:uid(), invoice, createdAt, customer:{name:$('customerName').value.trim(), phone:$('customerPhone').value.trim(), gstin:$('customerGstin').value.trim(), address:$('customerAddress').value.trim()}, items, subtotal, discount, freight, total:Math.max(0,subtotal-discount+freight)};
    return bill;
  }
  function receiptMarkup(b) {
    return `<div class="bill-receipt"><div class="receipt-top"><div><h3>RAJA HANDLOOM</h3><small>Customer bill</small></div><div style="text-align:right"><strong>${safe(b.invoice)}</strong><br><small>${safe(new Date(b.createdAt).toLocaleString())}</small></div></div><div class="receipt-customer"><strong>${safe(b.customer.name || 'Walk-in customer')}</strong>${b.customer.phone ? `<br>Mobile: ${safe(b.customer.phone)}`:''}${b.customer.gstin ? `<br>GSTIN: ${safe(b.customer.gstin)}`:''}${b.customer.address ? `<br>${safe(b.customer.address).replace(/\n/g,'<br>')}`:''}</div><table class="receipt-table"><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead><tbody>${b.items.map(i=>`<tr><td>${safe(i.name)}<br><small>${safe(i.category)}${i.subcategory?` · ${safe(i.subcategory)}`:''}</small></td><td>${i.qty} ${safe(i.unit)}</td><td>${money(i.price)}</td><td>${money(i.price*i.qty)}</td></tr>`).join('')}</tbody></table><div class="receipt-totals"><div><span>Subtotal</span><strong>${money(b.subtotal)}</strong></div><div><span>Discount</span><strong>− ${money(b.discount)}</strong></div><div><span>Freight</span><strong>${money(b.freight)}</strong></div><div class="receipt-grand"><span>Total</span><strong>${money(b.total)}</strong></div></div><p style="text-align:center;color:#78857d;font-size:11px;margin:18px 0 0">Thank you for your business!</p></div>`;
  }
  function printBill(b) {
    const win = window.open('', '_blank', 'width=760,height=800');
    if (!win) { toast('Allow pop-ups to print this bill.'); return; }
    win.document.write(`<!doctype html><html><head><title>${safe(b.invoice)} - RAJA HANDLOOM</title><meta name="viewport" content="width=device-width"><style>body{font:14px Arial,sans-serif;color:#1d2a25;max-width:700px;margin:30px auto;padding:0 20px}.bill-receipt{border:1px solid #ddd;border-radius:10px;padding:22px}.receipt-top{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding-bottom:15px}.receipt-top h3{font:24px Georgia;margin:0}.receipt-top small,.receipt-customer{color:#666;font-size:12px}.receipt-customer{padding:14px 0;line-height:1.6}.receipt-table{width:100%;border-collapse:collapse;font-size:12px}.receipt-table th,.receipt-table td{text-align:left;padding:9px 5px;border-bottom:1px solid #ddd}.receipt-table th:last-child,.receipt-table td:last-child{text-align:right}.receipt-totals{margin:12px 0 0 auto;max-width:240px}.receipt-totals div{display:flex;justify-content:space-between;padding:5px}.receipt-grand{font-weight:bold;border-top:1px solid #aaa;padding-top:10px!important;font-size:16px}@media print{body{margin:0 auto}}</style></head><body>${receiptMarkup(b)}<script>window.onload=()=>{window.print()}<\/script></body></html>`);
    win.document.close();
  }
  function persistBuyer() { write(KEYS.buyer, {name:$('customerName').value,phone:$('customerPhone').value,gstin:$('customerGstin').value,address:$('customerAddress').value}); }
  $('productGrid').addEventListener('click', event => { const add = event.target.closest('[data-add]'), edit = event.target.closest('[data-edit]'), del = event.target.closest('[data-delete]'); if(add) addToCart(add.dataset.add); if(edit) openProduct(products.find(p=>p.id===edit.dataset.edit)); if(del && confirm('Delete this product?')) { const id=del.dataset.delete; products=products.filter(p=>p.id!==id); cart=cart.filter(i=>i.id!==id); write(KEYS.products,products); write(KEYS.cart,cart); renderProducts(); renderCart(); toast('Product deleted'); } });
  $('cartItems').addEventListener('click', event => { const btn=event.target.closest('[data-qty]'), remove=event.target.closest('[data-remove]'); if(btn){const item=cart.find(i=>i.id===btn.dataset.qty);if(item)setQuantity(item.id,Number(item.qty)+Number(btn.dataset.step));} if(remove)setQuantity(remove.dataset.remove,0); });
  $('cartItems').addEventListener('input', event => {
    const qtyInput=event.target.closest('[data-qty-input]'), priceInput=event.target.closest('[data-price-input]');
    if(qtyInput){const item=cart.find(i=>i.id===qtyInput.dataset.qtyInput);if(item)item.qty=Math.max(0,Number(qtyInput.value)||0);}
    if(priceInput){const item=cart.find(i=>i.id===priceInput.dataset.priceInput);if(item)item.unitPrice=Math.max(0,Number(priceInput.value)||0);}
    if(qtyInput||priceInput){write(KEYS.cart,cart);const subtotal=cart.reduce((sum,item)=>{const p=products.find(product=>product.id===item.id);return sum+(p?cartPrice(item,p)*Number(item.qty||0):0)},0);const line=(qtyInput||priceInput).closest('.cart-line');const item=cart.find(i=>i.id===(qtyInput||priceInput).dataset.qtyInput||(i.id===(qtyInput||priceInput).dataset.priceInput));const p=item&&products.find(product=>product.id===item.id);if(line&&item&&p)line.querySelector('.cart-line-total').textContent=money(cartPrice(item,p)*Number(item.qty||0));$('subtotalValue').textContent=money(subtotal);$('totalValue').textContent=money(Math.max(0,subtotal-(Number($('discountInput').value)||0)+(Number($('freightInput').value)||0)));$('cartCount').textContent=cart.reduce((sum,i)=>sum+Number(i.qty||0),0);$('cartBadge').textContent=$('cartCount').textContent;}
  });
  $('cartItems').addEventListener('change', event => { const input=event.target.closest('[data-qty-input]'); if(input)setQuantity(input.dataset.qtyInput,input.value); const price=event.target.closest('[data-price-input]'); if(price)renderCart(); });
  $('productForm').addEventListener('submit', event => { event.preventDefault(); const id=$('editProductId').value; const existing=products.find(p=>p.id===id); const product={id:id||uid(),name:$('productName').value.trim(),category:$('productCategory').value,subcategoryId:$('productSubcategory').value||'',subcategory:subcategories.find(c=>c.id===$('productSubcategory').value)?.name||'',price:Math.max(0,Number($('productPrice').value)||0),unit:$('productUnit').value.trim()||'Piece',photo:photoData||existing?.photo||''}; if(existing)products=products.map(p=>p.id===id?product:p);else products.unshift(product); if(!write(KEYS.products,products))return; $('productDialog').close();renderProducts();toast(existing?'Product updated':'Product added'); });
  $('productCategory').addEventListener('change',()=>{refreshSubcategorySelects();});
  $('productPhoto').addEventListener('change', event => {const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const image=new Image();image.onload=()=>{const scale=Math.min(1,800/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);photoData=canvas.toDataURL('image/jpeg',.72);};image.src=reader.result;};reader.readAsDataURL(file);});
  $('subcategoryForm').addEventListener('submit',event=>{event.preventDefault();const category=$('subcategoryMainCategory').value,name=$('subcategoryName').value.trim();if(!name)return;if(subcategories.some(c=>c.category===category&&c.name.toLowerCase()===name.toLowerCase())){toast('This subcategory already exists');return;}const item={id:uid(),category,name,photos:[]};subcategories.push(item);write(KEYS.subcategories,subcategories);$('subcategoryName').value='';refreshSubcategorySelects();$('designCollectionSelect').value=item.id;renderManageCollections();renderProducts();toast('Subcategory added');});
  $('designPhotoFiles').addEventListener('change',async event=>{const files=Array.from(event.target.files||[]);const collection=subcategories.find(c=>c.id===$('designCollectionSelect').value);if(!files.length||!collection)return;try{const photos=await Promise.all(files.map(file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(reader.error);reader.onload=()=>{const image=new Image();image.onerror=()=>reject(new Error('Image could not be opened'));image.onload=()=>{const scale=Math.min(1,700/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);resolve({name:file.name.replace(/\.[^.]+$/,'')||collection.name,data:canvas.toDataURL('image/jpeg',.62)});};image.src=reader.result;};reader.readAsDataURL(file);})));collection.photos.push(...photos);if(!write(KEYS.subcategories,subcategories)){collection.photos.splice(-photos.length);return;}renderManageCollections();renderCustomerGallery();event.target.value='';toast(`${photos.length} design photo${photos.length===1?'':'s'} added`);}catch(_){toast('One or more photos could not be loaded');}});
  $('manageCollectionList').addEventListener('click',event=>{const select=event.target.closest('[data-select-collection]'),preview=event.target.closest('[data-preview-collection]'),del=event.target.closest('[data-delete-collection]');if(select){$('designCollectionSelect').value=select.dataset.selectCollection;$('designPhotoFiles').click();}if(preview){const item=subcategories.find(c=>c.id===preview.dataset.previewCollection);if(item){$('galleryCategorySelect').value=item.category;refreshSubcategorySelects();$('gallerySubcategorySelect').value=item.id;renderCustomerGallery();$('customerGalleryDialog').showModal();}}if(del&&confirm('Delete this subcategory and all its design photos?')){const id=del.dataset.deleteCollection;subcategories=subcategories.filter(c=>c.id!==id);products=products.map(p=>p.subcategoryId===id?{...p,subcategoryId:'',subcategory:''}:p);write(KEYS.subcategories,subcategories);write(KEYS.products,products);renderManageCollections();refreshSubcategorySelects();renderProducts();toast('Subcategory and photos deleted');}});
  $('galleryCategorySelect').addEventListener('change',()=>{refreshSubcategorySelects();renderCustomerGallery();});$('gallerySubcategorySelect').addEventListener('change',renderCustomerGallery);
  $('categoryForm').addEventListener('submit', event=>{event.preventDefault();const name=$('categoryName').value.trim();if(!name)return;if(categories.some(c=>c.toLowerCase()===name.toLowerCase())){toast('That category already exists');return;}categories.push(name);write(KEYS.categories,categories);$('categoryDialog').close();renderCategoryOptions();$('productCategory').value=name;refreshSubcategorySelects();toast('Category added');});
  $('billForm').addEventListener('submit', event=>{event.preventDefault();if(!cart.length){toast('Add at least one product to the cart');return;}const bill=createBill();history.unshift(bill);if(!write(KEYS.history,history)){history.shift();return;}renderHistory();persistBuyer();printBill(bill);cart=[];write(KEYS.cart,cart);renderCart();$('discountInput').value=0;$('freightInput').value=0;renderCart();toast('Bill saved to order history');});
  $('historyList').addEventListener('click',event=>{const view=event.target.closest('[data-view-bill]'),print=event.target.closest('[data-print-bill]'),del=event.target.closest('[data-delete-bill]');if(view){const b=history.find(x=>x.id===view.dataset.viewBill);if(b){$('billDetails').innerHTML=receiptMarkup(b);$('billViewDialog').showModal();}}if(print){const b=history.find(x=>x.id===print.dataset.printBill);if(b)printBill(b);}if(del&&confirm('Delete this saved bill from history?')){history=history.filter(x=>x.id!==del.dataset.deleteBill);write(KEYS.history,history);renderHistory();toast('Bill deleted');}});
  $('addProductOpen').addEventListener('click',()=>openProduct());$('emptyAddProduct').addEventListener('click',()=>openProduct());$('addCategoryOpen').addEventListener('click',()=>{$('categoryForm').reset();$('categoryDialog').showModal();});$('historyOpen').addEventListener('click',()=>{$('historyDialog').showModal();renderHistory();});$('manageDesignsOpen').addEventListener('click',()=>{renderCategoryOptions();renderManageCollections();$('designManagerDialog').showModal();});$('galleryOpen').addEventListener('click',()=>{renderCategoryOptions();renderCustomerGallery();$('customerGalleryDialog').showModal();});
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$(button.dataset.close).close()));
  $('searchInput').addEventListener('input',renderProducts);$('categoryFilter').addEventListener('change',()=>{refreshSubcategorySelects();renderProducts();});$('subcategoryFilter').addEventListener('change',renderProducts);$('discountInput').addEventListener('input',renderCart);$('freightInput').addEventListener('input',renderCart);
  $('clearCart').addEventListener('click',()=>{if(!cart.length)return;if(confirm('Clear all items from the current cart?')){cart=[];write(KEYS.cart,cart);renderCart();}});
  const buyer=read(KEYS.buyer,{});$('customerName').value=buyer.name||'';$('customerPhone').value=buyer.phone||'';$('customerGstin').value=buyer.gstin||'';$('customerAddress').value=buyer.address||'';
  ['customerName','customerPhone','customerGstin','customerAddress'].forEach(id=>$(id).addEventListener('input',persistBuyer));
  window.addEventListener('online',()=>{$('onlineStatus').classList.remove('offline');$('onlineStatus').innerHTML='<i></i> Online';});window.addEventListener('offline',()=>{$('onlineStatus').classList.add('offline');$('onlineStatus').innerHTML='<i></i> Offline';});
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstall=event;$('installBtn').classList.remove('hidden');});$('installBtn').addEventListener('click',async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$('installBtn').classList.add('hidden');});window.addEventListener('appinstalled',()=>toast('RAJA HANDLOOM installed'));
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'}).then(registration=>registration.update()).catch(()=>{}));
  renderProducts();renderCart();renderHistory();renderManageCollections();renderCustomerGallery();
})();
