# ToolForge - Fast, Static Multi-Page Web Tools Suite

A high-performance, mobile-first suite of free online utilities built with pure **HTML5, CSS3, and vanilla JavaScript** (zero backend, zero node build step). Every tool processes files and data **100% client-side** inside the user's browser for maximum privacy and instantaneous execution.

---

## Tools Included

| Tool | URL Route | Description | Tech Used |
| :--- | :--- | :--- | :--- |
| **Image Compressor & Resizer** | [`image-compressor.html`](image-compressor.html) | Compress, resize, and convert JPEG, PNG, and WebP images client-side with aspect ratio lock, quality slider, and side-by-side preview. | HTML5 Canvas API |
| **EMI / Loan Calculator** | [`emi-calculator.html`](emi-calculator.html) | Calculate monthly EMI, total interest, and total payment. Features interactive SVG donut breakdown and full year/month amortization schedule with CSV export. | Pure JavaScript & SVG |
| **QR Code Generator** | [`qr-code-generator.html`](qr-code-generator.html) | Generate static QR codes for URLs, Wi-Fi networks, text, email, and SMS. Custom color pickers, resolution slider, and PNG/SVG export. | Vendored `qrcode-generator` |
| **Word & Character Counter** | [`word-counter.html`](word-counter.html) | Real-time word, character, sentence, and paragraph counts. Reading/speaking times, case converters (UPPER, lower, Title, Sentence), social media limit bars, and keyword density. | Client-side Regex & Parsing |
| **Simple PDF Merge** | [`pdf-merge.html`](pdf-merge.html) | Combine multiple PDF files into one. Drag-and-drop file queue with reordering (Up/Down), page counter, and instant download. | Vendored `pdf-lib` |

---

## Supporting Pages & SEO
* **Home Page**: [`index.html`](index.html) with hero, tool directory cards, value pillars, and global FAQ.
* **About Page**: [`about.html`](about.html) detailing the client-side privacy philosophy.
* **Contact Page**: [`contact.html`](contact.html) with interactive feedback and bug report form.
* **Privacy Policy**: [`privacy.html`](privacy.html) covering client-side execution, zero server storage, and advertising disclosures.
* **Terms of Service**: [`terms.html`](terms.html) with open-license and financial estimation disclaimers.
* **Sitemap & Robots**: [`sitemap.xml`](sitemap.xml) and [`robots.txt`](robots.txt) for search engine indexing.
* **Structured Data**: JSON-LD schema markup (`WebApplication`, `BreadcrumbList`, `FAQPage`, `WebSite`) implemented across every page.

---

## Ad Placements (Placeholders)
Every page includes standard ad unit slots styled with clean borders and clear "SPONSORED" labels ready for ad network insertion:
* **Leaderboard Banner** (`728x90` desktop / `320x50` mobile): Positioned above main content.
* **Medium Rectangle** (`300x250`): Positioned in tool sidebars.
* **Responsive Content Banner**: Positioned above the educational & FAQ sections.

> **To activate real ads (e.g. Google AdSense):**  
> Simply replace the inner placeholder `<div class="ad-slot-inner">...</div>` with your AdSense `<ins class="adsbygoogle" ...>` tag and include the AdSense script in `<head>`.

---

## Local Development & Testing

Because there are no build steps, bundlers, or node packages required, you can run ToolForge locally using any static HTTP server:

### Option A: Python (Built-in)
```bash
# In the project directory:
python -m http.server 8080
```
Then visit `http://localhost:8080` in your web browser.

### Option B: Node.js (npx serve)
```bash
npx serve .
```

### Option C: VS Code Live Server
Right-click `index.html` and click **"Open with Live Server"**.

---

## Deploying to Cloudflare Pages

ToolForge is designed to be hosted directly on **Cloudflare Pages** for global edge performance and 100% free hosting.

### Method 1: Cloudflare Pages Direct Upload (Fastest — 2 Minutes)
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left navigation, go to **Workers & Pages** &rarr; **Create application** &rarr; **Pages** &rarr; **Upload assets**.
3. Set a project name (e.g. `toolforge`).
4. Drag and drop the entire `free-web-tools` folder (or upload its zip).
5. Click **Deploy site**.
6. Your site is instantly live at `https://toolforge.pages.dev`!

### Method 2: Git Repository Integration (Recommended for CI/CD)
1. Push this directory to a GitHub or GitLab repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of ToolForge"
   git branch -M main
   git remote add origin https://github.com/yourusername/toolforge.git
   git push -u origin main
   ```
2. In the Cloudflare Dashboard, navigate to **Workers & Pages** &rarr; **Create application** &rarr; **Pages** &rarr; **Connect to Git**.
3. Select your repository.
4. Set build settings:
   * **Framework preset**: `None`
   * **Build command**: *(Leave blank)*
   * **Build output directory**: `/` *(or leave blank for root)*
5. Click **Save and Deploy**. Every `git push` will now automatically redeploy your changes.

### Method 3: Cloudflare Wrangler CLI
```bash
# Install Wrangler globally if needed
npm install -g wrangler

# Deploy current directory
npx wrangler pages deploy . --project-name=toolforge
```

---

## Performance & Optimization Notes
* **System Font Stack**: Uses system UI fonts (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`) to eliminate external webfont FOIT/FOUT and render instantly.
* **Zero External Network Dependencies**: Vendor libraries (`pdf-lib.min.js`, `qrcode.min.js`) are bundled locally under `assets/js/vendor/` to allow full offline capability and prevent third-party CDN downtime.
* **Target Lighthouse Score**: 95–100 across Performance, Accessibility, Best Practices, and SEO.
