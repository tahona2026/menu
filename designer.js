/* مصمم الحملة (للمطوّر بس): سحب وتصغير وتكبير وتحكم في الخط واللون، وتصدير صورة بمقاسات المنصات.
   المعاينة والتصدير بيترسموا من نفس الدالة (render) فاللي بتشوفه هو اللي بيتصدّر. بيتحمّل من index.html لما المطوّر يفتح تبويب المصمم. */
(function () {
  "use strict";
  const FONTS = ["Cairo", "Tajawal", "Almarai", "Amiri", "Lalezar"];
  const SIZES = { story: [1080, 1920, "ستوري 1080×1920"], post: [1080, 1350, "بوست 1080×1350"], square: [1080, 1080, "مربع 1080×1080"] };
  const TYPES = { text: "🔤 نص", rect: "▭ شكل", image: "🖼️ صورة", qr: "🔳 QR", phones: "📞 الأرقام", products: "🛒 الأصناف", logo: "🐔 اللوجو" };
  let propsDirty = true, D = null, sel = null, hist = [], fut = [], root = null, cv = null, scale = 1, raf = 0, drag = null, guideX = false, cur = { id: "", name: "" };
  const imgs = {};
  const uid = () => "L" + Math.random().toString(36).slice(2, 8);
  const clone = o => JSON.parse(JSON.stringify(o));
  const el = (h) => { const t = document.createElement("template"); t.innerHTML = h.trim(); return t.content.firstChild; };

  /* ---------- القوالب ---------- */
  function defaultIds(max) {
    const a = []; try { activeOffers().forEach(m => a.push(m.id)); } catch (e) {}
    (S.menu || []).filter(m => { try { return itemVisible(m); } catch (e) { return true; } }).forEach(m => { if (!a.includes(m.id)) a.push(m.id); });
    return a.slice(0, max);
  }
  function mk(t, p) {
    const base = {
      text: { x: 90, y: 300, w: 900, h: 120, text: "نص جديد", fs: 64, color: "#111827", bold: true, align: "center", font: "Cairo", bgc: "", r: 0 },
      rect: { x: 90, y: 300, w: 900, h: 160, fill: "#f59e0b", r: 28, stroke: "", sw: 0 },
      image: { x: 90, y: 300, w: 600, h: 400, src: "", fit: "cover", r: 24 },
      qr: { x: 70, y: 1300, w: 300, h: 300, fg: "#000000", bgc: "#ffffff", r: 18, pad: 14, link: "" },
      phones: { x: 380, y: 1400, w: 630, h: 200, fs: 44, color: "#374151", bold: true, align: "right", font: "Cairo", icon: true },
      products: { x: 50, y: 520, w: 980, h: 600, fs: 44, color: "#111827", pcolor: "#7f1d1d", band: "#f6ece6", rowh: 100, font: "Cairo", ids: defaultIds(6) },
      logo: { x: 800, y: 40, w: 220, h: 220, r: 28, bgc: "#ffffff", pad: 8 }
    }[t];
    return Object.assign({ id: uid(), t, op: 1 }, base, p || {});
  }
  const TPL = {
    classic: () => ({ v: 1, w: 1080, h: 1920, bg: "#fffaf0", layers: [
      mk("rect", { x: 0, y: 0, w: 1080, h: 250, fill: "#7f1d1d", r: 0 }), mk("rect", { x: 0, y: 250, w: 1080, h: 10, fill: "#f59e0b", r: 0 }),
      mk("logo", { x: 820, y: 25, w: 200, h: 200 }),
      mk("text", { x: 60, y: 60, w: 740, text: "{shop}", fs: 76, color: "#ffffff", align: "right" }), mk("text", { x: 60, y: 160, w: 740, text: "{slogan}", fs: 40, color: "#fde68a", align: "right" }),
      mk("text", { x: 70, y: 290, w: 940, text: "أسعار وعروض النهاردة", fs: 58, color: "#450a0a", bgc: "#f59e0b", r: 28 }),
      mk("text", { x: 70, y: 420, w: 940, text: "{date}", fs: 34, color: "#6b7280", bold: false }),
      mk("products", { x: 50, y: 500, w: 980, rowh: 120, fs: 50, ids: defaultIds(10) }),
      mk("qr", { x: 60, y: 1410, w: 330, h: 330 }), mk("text", { x: 420, y: 1420, w: 590, text: "اطلب أونلاين الآن", fs: 66, color: "#7f1d1d", align: "right" }),
      mk("phones", { x: 420, y: 1570, w: 590, h: 200, fs: 44 }), mk("rect", { x: 0, y: 1898, w: 1080, h: 22, fill: "#7f1d1d", r: 0 })
    ] }),
    dark: () => ({ v: 1, w: 1080, h: 1350, bg: "#0f172a", layers: [
      mk("rect", { x: 40, y: 40, w: 1000, h: 1270, fill: "#111c34", r: 40, stroke: "#f59e0b", sw: 6 }),
      mk("logo", { x: 440, y: 70, w: 200, h: 200, bgc: "#0f172a" }),
      mk("text", { x: 90, y: 290, w: 900, text: "{shop}", fs: 70, color: "#f59e0b" }), mk("text", { x: 90, y: 380, w: 900, text: "عروض النهاردة", fs: 54, color: "#ffffff" }),
      mk("products", { x: 90, y: 470, w: 900, rowh: 96, fs: 44, color: "#ffffff", pcolor: "#fbbf24", band: "#1b2a4a", ids: defaultIds(6) }),
      mk("qr", { x: 100, y: 1040, w: 230, h: 230 }), mk("phones", { x: 380, y: 1060, w: 600, h: 180, fs: 42, color: "#e5e7eb" })
    ] }),
    light: () => ({ v: 1, w: 1080, h: 1080, bg: "#ffffff", layers: [
      mk("rect", { x: 0, y: 0, w: 1080, h: 18, fill: "#dc2626", r: 0 }),
      mk("text", { x: 60, y: 50, w: 960, text: "{shop}", fs: 64, color: "#7f1d1d" }), mk("text", { x: 60, y: 140, w: 960, text: "{date}", fs: 32, color: "#6b7280", bold: false }),
      mk("products", { x: 60, y: 210, w: 960, rowh: 92, fs: 42, ids: defaultIds(5) }),
      mk("qr", { x: 70, y: 770, w: 250, h: 250 }), mk("phones", { x: 370, y: 800, w: 640, h: 190, fs: 42 })
    ] }),
    blank: () => ({ v: 1, w: 1080, h: 1350, bg: "#ffffff", layers: [] })
  };

  /* ---------- رسم (المعاينة = التصدير) ---------- */
  function getImg(src) {
    if (!src) return null;
    if (imgs[src] && imgs[src].ok) return imgs[src].img;
    if (!imgs[src]) { const im = new Image(); imgs[src] = { img: im, ok: false }; im.crossOrigin = "anonymous"; im.onload = () => { imgs[src].ok = true; redraw(); }; im.onerror = () => { imgs[src].bad = true; }; im.src = src; }
    return null;
  }
  const tokens = t => { const sh = shopOf(); return String(t).replace(/\{shop\}/g, sh.name || "").replace(/\{slogan\}/g, sh.slogan || "").replace(/\{address\}/g, sh.address || "").replace(/\{phone\}/g, (phonesOf(sh)[0] || ""))
    .replace(/\{date\}/g, new Date(nowMs()).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Cairo" })); };
  function rr(c, x, y, w, h, r) { r = Math.max(0, Math.min(r || 0, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  const FN = (L, px, bold) => (bold ? "700 " : "400 ") + Math.round(px) + 'px "' + (L.font || "Cairo") + '","Cairo",Tahoma,sans-serif';
  function wrap(c, txt, maxW) {
    const out = [];
    String(txt).split("\n").forEach(par => {
      let cur = ""; par.split(/\s+/).forEach(w => { const t = cur ? cur + " " + w : w; if (c.measureText(t).width <= maxW || !cur) cur = t; else { out.push(cur); cur = w; } });
      out.push(cur);
    });
    return out;
  }
  function textBlock(c, L, lines, fs, color, bold, align) {      // بيرسم سطور بمحاذاة وبيرجّع الارتفاع الكلي
    const pad = 14, lh = fs * 1.3; c.font = FN(L, fs, bold); c.fillStyle = color; c.textAlign = align; c.textBaseline = "alphabetic";
    const x = align === "right" ? L.x + L.w - pad : align === "left" ? L.x + pad : L.x + L.w / 2;
    lines.forEach((ln, i) => c.fillText(ln, x, L.y + pad + fs * 0.95 + i * lh));
    return lines.length * lh + pad * 2;
  }
  function drawLayer(c, L) {
    c.save(); c.globalAlpha = L.op == null ? 1 : L.op; c.direction = "rtl";
    if (L.t === "rect") {
      rr(c, L.x, L.y, L.w, L.h, L.r); c.fillStyle = L.fill || "transparent"; c.fill();
      if (L.stroke && L.sw > 0) { c.strokeStyle = L.stroke; c.lineWidth = L.sw; c.stroke(); }
    } else if (L.t === "text") {
      c.font = FN(L, L.fs, L.bold); const lines = wrap(c, tokens(L.text), L.w - 28), lh = L.fs * 1.3; L.h = Math.round(lines.length * lh + 28);
      if (L.bgc) { rr(c, L.x, L.y, L.w, L.h, L.r); c.fillStyle = L.bgc; c.fill(); }
      textBlock(c, L, lines, L.fs, L.color, L.bold, L.align);
    } else if (L.t === "phones") {
      const sh = shopOf(), lines = phonesOf(sh).slice(0, 4).map(p => (L.icon ? "📞 " : "") + p); c.font = FN(L, L.fs, L.bold);
      L.h = Math.round(textBlock(c, L, lines, L.fs, L.color, L.bold, L.align));
    } else if (L.t === "image") {
      const im = getImg(L.src);
      c.save(); rr(c, L.x, L.y, L.w, L.h, L.r); c.clip();
      if (im) {
        const k = L.fit === "contain" ? Math.min(L.w / im.width, L.h / im.height) : Math.max(L.w / im.width, L.h / im.height), w = im.width * k, h = im.height * k;
        c.drawImage(im, L.x + (L.w - w) / 2, L.y + (L.h - h) / 2, w, h);
      } else { c.fillStyle = "#e5e7eb"; c.fillRect(L.x, L.y, L.w, L.h); c.fillStyle = "#6b7280"; c.font = FN(L, 40, true); c.textAlign = "center"; c.fillText("🖼️ اختار صورة", L.x + L.w / 2, L.y + L.h / 2); }
      c.restore();
    } else if (L.t === "logo") {
      c.fillStyle = L.bgc || "#fff"; rr(c, L.x, L.y, L.w, L.h, L.r); c.fill();
      const lg = window.__dzLogo; if (lg) { c.save(); rr(c, L.x, L.y, L.w, L.h, L.r); c.clip(); const p = L.pad || 0; c.drawImage(lg, L.x + p, L.y + p, L.w - 2 * p, L.h - 2 * p); c.restore(); }
    } else if (L.t === "qr") {
      c.fillStyle = L.bgc || "#fff"; rr(c, L.x, L.y, L.w, L.h, L.r); c.fill();
      try { const q = qrCanvas(L.link || campLink(), 600, null), p = L.pad || 0; c.drawImage(q, L.x + p, L.y + p, L.w - 2 * p, L.h - 2 * p); } catch (e) {}
    } else if (L.t === "products") {
      const ids = L.ids || [], all = (S.menu || []), rows = ids.map(id => all.find(m => m.id === id)).filter(Boolean), rh = L.rowh;
      rows.forEach((m, i) => {
        const y = L.y + i * rh, mid = y + rh / 2;
        if (i % 2 === 0 && L.band) { c.fillStyle = L.band; rr(c, L.x, y + 2, L.w, rh - 6, 18); c.fill(); }
        c.textAlign = "left"; c.fillStyle = L.pcolor; const price = money(m.price) + " / " + m.unit; let fs = L.fs; c.font = FN(L, fs, true);
        while (c.measureText(price).width > L.w * .38 && fs > 20) { fs -= 2; c.font = FN(L, fs, true); }
        c.fillText(price, L.x + 24, mid + fs * .34); const pw = c.measureText(price).width, maxW = L.w - 48 - pw - 24;
        let nf = L.fs; c.font = FN(L, nf, true); while (c.measureText(m.name).width > maxW && nf > 22) { nf -= 2; c.font = FN(L, nf, true); }
        c.textAlign = "right"; c.fillStyle = L.color; let ty = mid + nf * .34, offer = false; try { offer = offerActive(m); } catch (e) {}
        if (offer) { ty = mid - rh * .03; }
        c.fillText(m.name, L.x + L.w - 24, ty);
        if (offer) { c.fillStyle = "#dc2626"; c.font = FN(L, Math.max(20, nf * .6), true); c.fillText("🔥 عرض: " + num(m.offer_qty) + " " + m.unit + " بـ " + money(m.offer_total), L.x + L.w - 24, mid + rh * .3); }
      });
      L.h = Math.max(rh, rows.length * rh);
    }
    c.restore();
  }
  function renderTo(c) { c.fillStyle = D.bg; c.fillRect(0, 0, D.w, D.h); D.layers.forEach(L => drawLayer(c, L)); }
  function redraw() { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { if (!cv) return; cv.width = D.w; cv.height = D.h; renderTo(cv.getContext("2d")); layoutBoxes(); }); }

  /* ---------- تحديد وسحب وتكبير ---------- */
  function layoutBoxes() {
    const wrapEl = root.querySelector(".dz-stage"); scale = wrapEl.clientWidth / D.w;
    cv.style.height = (D.h * scale) + "px"; wrapEl.style.height = (D.h * scale) + "px";
    root.querySelectorAll(".dz-box").forEach(b => b.remove());
    D.layers.forEach(L => {
      const b = el(`<div class="dz-box${L.id === sel ? " on" : ""}" data-id="${L.id}" style="left:${L.x * scale}px;top:${L.y * scale}px;width:${L.w * scale}px;height:${L.h * scale}px"></div>`);
      if (L.id === sel) b.innerHTML = '<i class="dz-h" data-h="se"></i><i class="dz-h" data-h="sw"></i>';
      wrapEl.appendChild(b);
    });
    const g = root.querySelector(".dz-guide"); if (g) g.style.display = guideX ? "block" : "none";
    if (propsDirty) { propsDirty = false; renderProps(); }
    else { const pr = root.querySelector(".dz-props"), L = sel && find(sel); if (L) ["x", "y", "w", "h"].forEach(k => { const i = pr.querySelector(`[data-k="${k}"]`); if (i && document.activeElement !== i) i.value = Math.round(L[k]); }); }
  }
  const find = id => D.layers.find(l => l.id === id);
  function snap() { hist.push(JSON.stringify(D)); if (hist.length > 60) hist.shift(); fut = []; }
  function undo() { propsDirty = true; if (!hist.length) return; fut.push(JSON.stringify(D)); D = JSON.parse(hist.pop()); if (!find(sel)) sel = null; redraw(); }
  function redo() { propsDirty = true; if (!fut.length) return; hist.push(JSON.stringify(D)); D = JSON.parse(fut.pop()); if (!find(sel)) sel = null; redraw(); }
  function onDown(e) {
    const b = e.target.closest(".dz-box"), h = e.target.closest(".dz-h");
    if (!b) { sel = null; propsDirty = true; layoutBoxes(); return; }
    e.preventDefault(); const L = find(b.dataset.id); if (sel !== L.id) propsDirty = true; sel = L.id; snap();
    drag = { id: L.id, mode: h ? h.dataset.h : "move", sx: e.clientX, sy: e.clientY, ox: L.x, oy: L.y, ow: L.w, oh: L.h, ofs: L.fs, orow: L.rowh };
    try { b.setPointerCapture(e.pointerId); } catch (er) {}
    layoutBoxes();
  }
  function onMove(e) {
    if (!drag) return; const L = find(drag.id); if (!L) return;
    const dx = (e.clientX - drag.sx) / scale, dy = (e.clientY - drag.sy) / scale;
    if (drag.mode === "move") {
      L.x = Math.round(drag.ox + dx); L.y = Math.round(drag.oy + dy);
      const cx = L.x + L.w / 2; guideX = Math.abs(cx - D.w / 2) < 10; if (guideX) L.x = Math.round(D.w / 2 - L.w / 2);
    } else {
      const east = drag.mode === "se"; let w = Math.max(40, Math.round(drag.ow + (east ? dx : -dx)));
      if (L.t === "qr" || L.t === "logo") { L.w = w; L.h = w; if (!east) L.x = drag.ox + drag.ow - w; }
      else {
        const k = w / drag.ow; L.w = w; if (!east) L.x = drag.ox + drag.ow - w;
        if (L.t === "text" || L.t === "phones") L.fs = Math.max(12, Math.round(drag.ofs * k));
        else if (L.t === "products") { L.fs = Math.max(14, Math.round(drag.ofs * k)); L.rowh = Math.max(40, Math.round(drag.orow * k)); }
        else if (L.t === "rect" || L.t === "image") L.h = Math.max(20, Math.round(drag.oh + dy * (east ? 1 : 1)));
      }
    }
    redraw();
  }
  function onUp() { drag = null; guideX = false; layoutBoxes(); }

  /* ---------- لوحة الخصائص ---------- */
  const row = (label, input) => `<label class="dz-f"><span>${label}</span>${input}</label>`;
  const num_ = (k, v, extra) => `<input type="number" data-k="${k}" value="${v}" ${extra || ""}>`;
  const col_ = (k, v) => `<input type="color" data-k="${k}" value="${/^#[0-9a-f]{6}$/i.test(v) ? v : "#000000"}">`;
  function renderProps() {
    const box = root.querySelector(".dz-props"), L = sel && find(sel);
    if (!L) { box.innerHTML = '<p class="dz-hint">اضغط على أي عنصر في التصميم عشان تعدّله، أو أضف عنصر من الأزرار فوق.</p>' + bgPanel(); return; }
    let h = `<b class="dz-t">${TYPES[L.t] || L.t}</b>`;
    if (L.t === "text") h += row("النص", `<textarea data-k="text" rows="3">${esc(L.text)}</textarea>`) + `<p class="dz-hint">ممكن تكتب {shop} {slogan} {date} {phone} {address} وبتتبدل أوتوماتيك.</p>` + row("حجم الخط", num_("fs", L.fs, 'min="12" max="300"')) + row("الخط", fontSel(L)) + row("اللون", col_("color", L.color)) + row("خلفية", col_("bgc", L.bgc || "#ffffff") + `<button type="button" data-clr="bgc">✖</button>`) + row("استدارة", num_("r", L.r || 0, 'min="0" max="200"')) + alignBtns(L) + boldChk(L);
    if (L.t === "phones") h += row("حجم الخط", num_("fs", L.fs, 'min="12" max="200"')) + row("الخط", fontSel(L)) + row("اللون", col_("color", L.color)) + alignBtns(L) + boldChk(L) + `<label class="dz-f"><span>أيقونة 📞</span><input type="checkbox" data-k="icon"${L.icon ? " checked" : ""}></label>`;
    if (L.t === "rect") h += row("اللون", col_("fill", L.fill)) + row("استدارة", num_("r", L.r, 'min="0" max="300"')) + row("إطار", col_("stroke", L.stroke || "#000000")) + row("سمك الإطار", num_("sw", L.sw || 0, 'min="0" max="40"'));
    if (L.t === "image") h += `<button type="button" class="dz-b" data-act="pickimg">📷 اختيار صورة</button>` + row("رابط", `<input data-k="src" dir="ltr" value="${esc(L.src || "")}" placeholder="https://…">`) + row("الملاءمة", `<select data-k="fit"><option value="cover"${L.fit === "cover" ? " selected" : ""}>تغطية</option><option value="contain"${L.fit === "contain" ? " selected" : ""}>احتواء</option></select>`) + row("استدارة", num_("r", L.r, 'min="0" max="300"'));
    if (L.t === "logo") h += row("خلفية", col_("bgc", L.bgc || "#ffffff")) + row("استدارة", num_("r", L.r, 'min="0" max="300"')) + row("هامش", num_("pad", L.pad || 0, 'min="0" max="60"'));
    if (L.t === "qr") h += row("لون الخلفية", col_("bgc", L.bgc || "#ffffff")) + row("استدارة", num_("r", L.r, 'min="0" max="100"')) + row("هامش", num_("pad", L.pad || 0, 'min="0" max="60"')) + row("رابط (فاضي = رابط المنيو)", `<input data-k="link" dir="ltr" value="${esc(L.link || "")}">`);
    if (L.t === "products") h += row("حجم الخط", num_("fs", L.fs, 'min="14" max="120"')) + row("ارتفاع الصف", num_("rowh", L.rowh, 'min="40" max="300"')) + row("الخط", fontSel(L)) + row("لون الاسم", col_("color", L.color)) + row("لون السعر", col_("pcolor", L.pcolor)) + row("لون الصف", col_("band", L.band || "#f6ece6")) + prodList(L);
    h += `<hr><div class="dz-grid">${row("X", num_("x", Math.round(L.x)))}${row("Y", num_("y", Math.round(L.y)))}${row("العرض", num_("w", Math.round(L.w)))}${L.t === "rect" || L.t === "image" ? row("الارتفاع", num_("h", Math.round(L.h))) : ""}</div>` + row("الشفافية", `<input type="range" data-k="op" min="0.1" max="1" step="0.05" value="${L.op == null ? 1 : L.op}">`);
    h += `<div class="dz-acts"><button type="button" data-act="center">↔ توسيط</button><button type="button" data-act="front">⬆️ قدّام</button><button type="button" data-act="back">⬇️ ورا</button><button type="button" data-act="dup">⧉ نسخ</button><button type="button" data-act="del" class="dz-del">🗑 حذف</button></div>`;
    box.innerHTML = h;
  }
  const fontSel = L => `<select data-k="font">${FONTS.map(f => `<option${L.font === f ? " selected" : ""}>${f}</option>`).join("")}</select>`;
  const alignBtns = L => `<div class="dz-al">${[["right", "يمين"], ["center", "وسط"], ["left", "شمال"]].map(a => `<button type="button" data-al="${a[0]}" class="${L.align === a[0] ? "on" : ""}">${a[1]}</button>`).join("")}</div>`;
  const boldChk = L => `<label class="dz-f"><span>عريض</span><input type="checkbox" data-k="bold"${L.bold ? " checked" : ""}></label>`;
  const prodList = L => `<div class="dz-prods"><b>الأصناف اللي هتظهر:</b>${(S.menu || []).map(m => `<label class="dz-f"><input type="checkbox" data-pid="${esc(m.id)}"${(L.ids || []).includes(m.id) ? " checked" : ""}><span>${esc(m.name)} — ${money(m.price)}</span></label>`).join("")}</div>`;
  const bgPanel = () => `<div class="dz-bgp">${row("لون الخلفية", col_("__bg", D.bg))}</div>`;
  function onProp(e) {
    const t = e.target, L = sel && find(sel);
    if (t.dataset.k === "__bg") { snap(); D.bg = t.value; return redraw(); }
    if (!L) return;
    if (t.dataset.pid) { snap(); const s = new Set(L.ids || []); t.checked ? s.add(t.dataset.pid) : s.delete(t.dataset.pid); L.ids = (S.menu || []).map(m => m.id).filter(id => s.has(id)); return redraw(); }
    const k = t.dataset.k; if (!k) return;
    if (e.type === "input" && !(t.type === "range" || t.tagName === "TEXTAREA" || t.type === "number" || t.type === "color" || t.type === "text" || !t.type)) return;
    if (!drag && !t._snapped) { snap(); t._snapped = true; setTimeout(() => { t._snapped = false; }, 600); }
    L[k] = t.type === "checkbox" ? t.checked : (t.type === "number" || t.type === "range" ? Number(t.value) : t.value);
    redraw();
  }
  function onAct(e) {
    const b = e.target.closest("[data-act],[data-al],[data-clr]"); if (!b) return; const L = sel && find(sel);
    if (b.dataset.al && L) { propsDirty = true; snap(); L.align = b.dataset.al; return redraw(); }
    if (b.dataset.clr && L) { propsDirty = true; snap(); L[b.dataset.clr] = ""; return redraw(); }
    const a = b.dataset.act; if (!L) return; propsDirty = true;
    if (a === "pickimg") return pickImage(L);
    snap();
    if (a === "center") L.x = Math.round(D.w / 2 - L.w / 2);
    if (a === "front") { D.layers.splice(D.layers.indexOf(L), 1); D.layers.push(L); }
    if (a === "back") { D.layers.splice(D.layers.indexOf(L), 1); D.layers.unshift(L); }
    if (a === "dup") { const c = clone(L); c.id = uid(); c.x += 30; c.y += 30; D.layers.push(c); sel = c.id; }
    if (a === "del") { D.layers.splice(D.layers.indexOf(L), 1); sel = null; }
    redraw();
  }
  async function pickImage(L) {
    const inp = el('<input type="file" accept="image/*">'); inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return; toast("⏳ جاري تجهيز الصورة ورفعها…");
      try {
        const bmp = await createImageBitmap(f), k = Math.min(1, 1400 / Math.max(bmp.width, bmp.height)), c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
        c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
        const blob = await new Promise(r => c.toBlob(r, "image/jpeg", 0.86)), r = await post({ action: "upload_image", pin: S.pin, mime: "image/jpeg", imageBase64: await readB64(blob) });
        if (!r.ok) return toast(r.error || "فشل رفع الصورة", "err");
        snap(); L.src = r.url; toast("✅ تم رفع الصورة"); redraw();
      } catch (e) { toast("تعذر رفع الصورة", "err"); }
    }; inp.click();
  }

  /* ---------- حفظ وفتح وتصدير ---------- */
  async function saveDesign() {
    const name = prompt("اسم التصميم:", cur.name || "تصميم " + new Date().toLocaleDateString("ar-EG")); if (!name) return;
    const json = JSON.stringify(D); if (json.length > 45000) return toast("التصميم كبير. استخدم صور مرفوعة بدل المدمجة", "err");
    const r = await post({ action: "save_design", pin: S.pin, id: cur.id, name, json });
    if (!r.ok) return toast(r.error || "تعذر الحفظ", "err"); cur = { id: r.id, name }; toast("💾 اتحفظ التصميم ✅");
  }
  async function openDesigns() {
    const r = await post({ action: "list_designs", pin: S.pin }); if (!r.ok) return toast(r.error || "تعذر التحميل", "err");
    const list = r.designs || []; const dlg = root.querySelector(".dz-list");
    dlg.innerHTML = list.length ? list.map(d => `<div class="dz-li"><button type="button" data-open="${esc(d.id)}">${esc(d.name)}</button><button type="button" class="dz-del" data-rm="${esc(d.id)}" aria-label="حذف">🗑</button></div>`).join("") : "<p class=\"dz-hint\">مفيش تصاميم محفوظة.</p>";
    dlg.classList.toggle("hidden");
  }
  async function listClick(e) {
    const o = e.target.closest("[data-open]"), d = e.target.closest("[data-rm]");
    if (o) { const r = await post({ action: "get_design", pin: S.pin, id: o.dataset.open }); if (!r.ok) return toast(r.error || "تعذر الفتح", "err"); D = JSON.parse(r.json); cur = { id: r.id, name: r.name }; hist = []; fut = []; sel = null; propsDirty = true; root.querySelector(".dz-list").classList.add("hidden"); redraw(); }
    if (d && confirm("تمسح التصميم ده؟")) { const r = await post({ action: "delete_design", pin: S.pin, id: d.dataset.rm }); if (r.ok) { toast("اتمسح"); openDesigns(); openDesigns(); } }
  }
  async function exportBlob() {
    try { await document.fonts.load('700 40px Cairo'); await Promise.all(FONTS.map(f => document.fonts.load('700 40px "' + f + '"'))); } catch (e) {}
    const c = document.createElement("canvas"); c.width = D.w; c.height = D.h; renderTo(c.getContext("2d"));
    return new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error("toBlob")), "image/jpeg", 0.92));
  }
  async function doExport(share) {
    try {
      const blob = await exportBlob(), f = new File([blob], "design-" + Date.now() + ".jpg", { type: "image/jpeg" });
      if (share && navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f] }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
      const a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast("تم تنزيل الصورة ✅");
    } catch (e) { toast("تعذر تصدير الصورة", "err"); }
  }
  function setSize(k) { const s = SIZES[k]; if (!s || !confirm("هتغيّر المقاس؟ العناصر هتفضل مكانها وممكن تحتاج ترتيب.")) return; snap(); D.w = s[0]; D.h = s[1]; redraw(); }
  function loadTpl(k) { if (D && D.layers.length && !confirm("هتبدأ من قالب جديد؟ التعديلات الحالية هتتشال (تقدر ترجع بزرار التراجع).")) return; if (D) snap(); D = TPL[k](); sel = null; propsDirty = true; cur = { id: "", name: "" }; redraw(); }

  /* ---------- الواجهة ---------- */
  const CSS = `.dz{display:flex;flex-direction:column;gap:8px}.dz-bar{display:flex;flex-wrap:wrap;gap:6px}.dz-bar button,.dz-bar select{min-height:42px;padding:0 10px;border-radius:10px;border:1px solid var(--border);background:var(--surface-2);font-weight:800;font-size:.78rem}
.dz-bar .dz-p{background:var(--brand);color:#fff;border-color:var(--brand)}.dz-stage{position:relative;width:100%;max-width:560px;margin:0 auto;background:#ddd;touch-action:none;border:1px solid var(--border)}
.dz-stage canvas{width:100%;display:block}.dz-box{position:absolute;border:1px dashed rgba(37,99,235,.0);cursor:move;touch-action:none}.dz-box.on{border:2px solid #2563eb}.dz-box:hover{border-color:rgba(37,99,235,.5)}
.dz-h{position:absolute;bottom:-12px;width:26px;height:26px;border-radius:50%;background:#2563eb;border:3px solid #fff;touch-action:none}.dz-h[data-h=se]{right:-12px;cursor:nwse-resize}.dz-h[data-h=sw]{left:-12px;cursor:nesw-resize}
.dz-guide{position:absolute;top:0;bottom:0;left:50%;width:2px;background:#ec4899;display:none;pointer-events:none}.dz-props{border:1px solid var(--border);border-radius:14px;padding:10px;background:var(--surface)}
.dz-f{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:6px 0;font-size:.8rem;font-weight:700}.dz-f input[type=number],.dz-f input:not([type]),.dz-f select,.dz-f textarea{flex:1;max-width:60%;min-height:38px;border:1px solid var(--border);border-radius:8px;padding:0 8px;background:var(--surface-2);font-family:inherit}
.dz-f textarea{padding:6px 8px}.dz-f input[type=color]{width:56px;height:38px;border:0;background:none}.dz-t{display:block;margin-bottom:6px}.dz-hint{font-size:.74rem;color:var(--muted);margin:4px 0}
.dz-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 10px}.dz-acts,.dz-al{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.dz-acts button,.dz-al button,.dz-b{min-height:40px;padding:0 10px;border-radius:10px;border:1px solid var(--border);background:var(--surface-2);font-weight:800;font-size:.78rem}
.dz-al button.on{background:var(--brand);color:#fff}.dz-del{color:#b91c1c}.dz-prods{max-height:220px;overflow:auto;margin-top:8px;border-top:1px dashed var(--border);padding-top:6px}.dz-list{border:1px solid var(--border);border-radius:12px;padding:8px;background:var(--surface)}
.dz-li{display:flex;gap:6px;margin:4px 0}.dz-li button:first-child{flex:1;min-height:42px;border-radius:10px;border:1px solid var(--border);background:var(--surface-2);font-weight:800;text-align:right;padding:0 10px}.dz-li .dz-del{width:46px;border-radius:10px;border:1px solid var(--border);background:var(--surface-2)}`;
  function open(host) {
    if (!document.getElementById("dz-css")) { const s = document.createElement("style"); s.id = "dz-css"; s.textContent = CSS; document.head.appendChild(s); }
    if (!document.getElementById("dz-fonts")) { const l = document.createElement("link"); l.id = "dz-fonts"; l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Almarai:wght@400;700&family=Amiri:wght@400;700&family=Lalezar&family=Tajawal:wght@400;700&display=swap"; document.head.appendChild(l); }
    root = host; host.innerHTML = `<div class="dz">
      <div class="dz-bar"><button type="button" data-undo>↩️ تراجع</button><button type="button" data-redo>↪️ إعادة</button>
        <select data-tpl><option value="">🎨 قالب…</option><option value="classic">تقليدي (ستوري)</option><option value="dark">داكن (بوست)</option><option value="light">فاتح (مربع)</option><option value="blank">فاضي</option></select>
        <select data-size><option value="">📐 المقاس…</option>${Object.keys(SIZES).map(k => `<option value="${k}">${SIZES[k][2]}</option>`).join("")}</select></div>
      <div class="dz-bar">${Object.keys(TYPES).map(t => `<button type="button" data-add="${t}">${TYPES[t]}</button>`).join("")}</div>
      <div class="dz-stage"><canvas></canvas><div class="dz-guide"></div></div>
      <div class="dz-bar"><button type="button" data-save>💾 حفظ</button><button type="button" data-open>📂 فتح</button><button type="button" class="dz-p" data-exp>⬇️ تنزيل الصورة</button><button type="button" class="dz-p" data-share>📤 مشاركة الصورة</button></div>
      <div class="dz-list hidden"></div><div class="dz-props"></div></div>`;
    cv = host.querySelector("canvas");
    window.__dzLogo = null; (async () => { try { window.__dzLogo = await loadShopLogo(shopOf()); redraw(); } catch (e) {} })();
    const st = host.querySelector(".dz-stage");
    st.addEventListener("pointerdown", onDown); st.addEventListener("pointermove", onMove); st.addEventListener("pointerup", onUp); st.addEventListener("pointercancel", onUp);
    const props = host.querySelector(".dz-props"); props.addEventListener("input", onProp); props.addEventListener("change", onProp); props.addEventListener("click", onAct);
    host.querySelector(".dz-list").addEventListener("click", listClick);
    host.addEventListener("click", e => {
      if (e.target.closest("[data-undo]")) undo(); else if (e.target.closest("[data-redo]")) redo();
      else if (e.target.closest("[data-save]")) saveDesign(); else if (e.target.closest("[data-open]") && !e.target.closest(".dz-list")) openDesigns();
      else if (e.target.closest("[data-exp]")) doExport(false); else if (e.target.closest("[data-share]")) doExport(true);
      else { const a = e.target.closest("[data-add]"); if (a) { snap(); const L = mk(a.dataset.add, { x: 100, y: 200 }); D.layers.push(L); sel = L.id; propsDirty = true; redraw(); } }
    });
    host.querySelector("[data-tpl]").addEventListener("change", e => { if (e.target.value) loadTpl(e.target.value); e.target.value = ""; });
    host.querySelector("[data-size]").addEventListener("change", e => { if (e.target.value) setSize(e.target.value); e.target.value = ""; });
    window.addEventListener("resize", () => { if (root && root.isConnected) redraw(); });
    if (!D) D = TPL.classic(); propsDirty = true; redraw();
  }
  window.Designer = { open, _state: () => D, _render: c => renderTo(c) };
})();
