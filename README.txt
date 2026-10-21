RAJA HANDLOOM - Static billing app
===================================

FILES
- index.html, style.css, app.js: the complete app
- manifest.webmanifest, service-worker.js: install and offline support
- icon-192.png, icon-512.png: app icons

USE IN VS CODE
1. Extract this ZIP into your existing project folder (for example F:\Raja Handloom).
2. Keep every file together at the project root. Do not put them in an extra nested folder.
3. In VS Code, open index.html with Live Server to preview it.
4. To update your existing GitHub Pages site, copy/replace these files in the same repository, then run:
   git add .
   git commit -m "Add order history and category tools"
   git push
5. Wait for GitHub Pages to publish. Open the HTTPS site in Chrome and reload once while online.
6. On Android Chrome, use the menu (three dots) > Install app or Add to Home screen.

FEATURES
- English interface, responsive on phones
- Add/edit/delete products and add custom categories
- Create subcategories under a main category (for example Towel > Ritugold)
- Add multiple design photos to each subcategory and show them in the customer Design gallery
- Assign products to a subcategory and filter the catalog by it
- Change a product's bill price in the cart for a customer-specific special rate; the catalog price stays unchanged
- Search/filter products; set price and unit
- Add to cart, tap plus/minus or type a quantity directly
- Customer details, discount, freight, totals and printable bill
- Saved order history with bill details and reprint
- Catalog, categories, design photos, cart, and order history saved in this browser on this device
- Offline app shell after first successful online visit; use HTTPS for installation

IMPORTANT DATA NOTES
The app uses this browser's local storage. Data is not automatically shared with other phones, browsers, or computers. Clearing browser/site data can erase saved products, design photos, and history. Adding many high-resolution photos may use the browser's local storage; images are compressed automatically, but add a reasonable number at a time. Keep the same website address when updating the site. Bills created before this version was installed cannot be recovered into the new history automatically.

For reliable offline loading, first open the published site while online and wait until the page has loaded. If Chrome still shows "Could not open app", remove the old home-screen shortcut, open the HTTPS website again, refresh it, then install from Chrome's menu.
