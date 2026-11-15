/* Hruditya Rajwade portfolio: small vanilla script, no dependencies. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var share = !!document.querySelector('meta[name="hr-mode"][content="share"]');
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (/[?&]og=1/.test(location.search)) document.documentElement.classList.add("og");
  var css = function (name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); };

  /* ---- A1: every page opens at the top, or at its #anchor; never at a remembered scroll position ---- */
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (err) { /* ignore */ }
  var toStart = function () {
    var id = location.hash && location.hash.length > 1 ? decodeURIComponent(location.hash.slice(1)) : "";
    var el = id ? document.getElementById(id) : null;
    if (el) el.scrollIntoView({ block: "start" }); else window.scrollTo(0, 0);
  };
  toStart();
  window.addEventListener("pageshow", function (e) { if (e.persisted) toStart(); });

  /* ---- Back: go to the page the visitor came from (same site), else the previous page in the story ---- */
  var back = $(".pager .back");
  if (back) {
    back.addEventListener("click", function (e) {
      var ref = document.referrer;
      var same = ref && ref.indexOf(location.origin) === 0 && ref.split("#")[0] !== location.href.split("#")[0];
      if (same && history.length > 1) { e.preventDefault(); history.back(); }
    });
  }

  /* ---- Work tabs: keep the current tab in view on narrow screens ---- */
  var curTab = $(".tabs-nav a[aria-current]");
  if (curTab) { var tn = curTab.parentNode; tn.scrollLeft = curTab.offsetLeft - (tn.clientWidth - curTab.offsetWidth) / 2; }

  /* ---- Work menu: closes on outside click or Escape ---- */
  var menu = $(".menu");
  if (menu) {
    document.addEventListener("click", function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.open) { menu.open = false; $("summary", menu).focus(); } });
  }

  /* ---- Photos that keep changing (Work rows, Work pages, Story frames) ---- */
  var rots = $$("[data-rotate]");
  var wake = function (im) { if (im && im.getAttribute("data-src")) { im.src = im.getAttribute("data-src"); im.removeAttribute("data-src"); } };
  var turn = function (r, dir) {
    var ims = $$("img", r);
    if (ims.length < 2) return;
    var k = ims.findIndex(function (x) { return x.classList.contains("on"); });
    var nx = (k + (dir || 1) + ims.length) % ims.length;
    wake(ims[nx]); wake(ims[(nx + 1) % ims.length]);
    ims[k].classList.remove("on"); ims[nx].classList.add("on");
    var src = ims[nx].getAttribute("src") || "";
    if (src) r.style.setProperty("--bg", "url(" + src.replace(/-l\.jpg$/, "-s.jpg") + ")");
  };
  rots.forEach(function (r) {
    wake($$("img", r)[1]);
    r.addEventListener("click", function (ev) { if (!r.closest(".st-photo")) { ev.preventDefault(); turn(r, 1); } });
  });
  if (!reduce) setInterval(function () {
    rots.forEach(function (r, i) {
      if (r.offsetParent === null) return;
      var b = r.getBoundingClientRect();
      if (b.bottom < 0 || b.top > innerHeight) return;
      setTimeout(function () { turn(r, 1); }, i * 350);
    });
  }, 3000);

  /* ---- Copy email (mail links do not always open from a shared page) ---- */
  $$("button.copy").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = b.getAttribute("data-copy"), label = b.textContent;
      var done = function (ok) { b.textContent = ok ? "Copied" : v; setTimeout(function () { b.textContent = label; }, 2200); };
      try { navigator.clipboard.writeText(v).then(function () { done(true); }, function () { done(false); }); } catch (err) { done(false); }
    });
  });

  /* ---- External links always open in a new tab ---- */
  $$("a[href^='http'], a[href^='mailto:']").forEach(function (a) {
    if (a.hostname && a.hostname === location.hostname) return;
    a.target = "_blank"; a.rel = "noopener noreferrer";
  });

  /* ---- Fade images in once loaded ---- */
  $$("img.fade").forEach(function (img) {
    if (img.complete && img.naturalWidth) img.classList.add("in");
    else {
      img.addEventListener("load", function () { img.classList.add("in"); }, { once: true });
      img.addEventListener("error", function () { img.classList.add("in"); }, { once: true });
    }
  });

  /* ---- Show all: open the rest of a photo set in place ---- */
  $$("[data-more]").forEach(function (b) {
    b.addEventListener("click", function () {
      var set = b.closest(".photo-set"), open = !set.classList.contains("expanded");
      set.classList.toggle("expanded", open);
      b.setAttribute("aria-expanded", String(open));
      b.textContent = b.getAttribute(open ? "data-open" : "data-closed");
      if (!open) set.scrollIntoView({ block: "nearest" });
    });
  });

  /* ---- Lightbox for photo tiles ---- */
  var lb = $("dialog.lightbox");
  if (lb) {
    var group = [], gi = 0;
    var show = function () {
      var t = group[gi], img = $("img", t), cap = $("figcaption", t);
      $("img", lb).src = img.getAttribute("data-full") || img.currentSrc || img.src;
      $("img", lb).alt = img.alt;
      var fc = $("figcaption", lb);
      fc.innerHTML = cap ? cap.innerHTML : "";
      $$(".no", fc).forEach(function (n) { n.remove(); });
      $(".lb-count", lb).textContent = (gi + 1) + " / " + group.length;
    };
    document.addEventListener("click", function (e) {
      var t = e.target.closest(".tile");
      if (!t) return;
      var wall = t.closest("[data-wall]") || document;
      group = $$(".tile", wall).filter(function (x) { return !x.hidden && x.offsetParent !== null; });
      gi = Math.max(0, group.indexOf(t));
      show(); lb.showModal();
    });
    $(".lb-prev", lb).addEventListener("click", function () { gi = (gi - 1 + group.length) % group.length; show(); });
    $(".lb-next", lb).addEventListener("click", function () { gi = (gi + 1) % group.length; show(); });
    $(".lb-close", lb).addEventListener("click", function () { lb.close(); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") $(".lb-next", lb).click();
      if (e.key === "ArrowLeft") $(".lb-prev", lb).click();
    });
    $$(".tile").forEach(function (t) {
      t.tabIndex = 0; t.setAttribute("role", "button");
      t.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); t.click(); } });
    });
  }

  /* ---- Landing viewfinder: photos shuffle like cards, one lands in the frame with a lower third ---- */
  var deck = $(".vf-deck");
  if (deck) {
    var cards = $$(".vf-card", deck);
    var lt = $(".lower-third"), ltRole = $(".lt-role"), ltCap = $(".lt-cap");
    var tc = $(".vf-tc");
    var order = cards.map(function (_, i) { return i; });
    var busy = false;
    var paint = function () {
      order.forEach(function (ci, pos) { cards[ci].style.zIndex = String(cards.length - pos); });
      for (var k = 0; k < Math.min(3, order.length); k++) {
        var im = $("img", cards[order[k]]);
        if (im && im.getAttribute("data-srcset")) { im.srcset = im.getAttribute("data-srcset"); im.removeAttribute("data-srcset"); }
      }
      var c = cards[order[0]];
      lt.classList.add("swap");
      setTimeout(function () {
        ltRole.textContent = c.getAttribute("data-role") || "";
        ltCap.textContent = c.getAttribute("data-cap") || "";
        lt.classList.remove("swap");
      }, reduce ? 0 : 220);
    };
    var shuffle = function () {
      if (busy) return; busy = true;
      var c = cards[order[0]];
      c.classList.add("out");
      setTimeout(function () { order.push(order.shift()); paint(); c.classList.remove("out"); busy = false; }, reduce ? 0 : 520);
    };
    order.sort(function () { return Math.random() - 0.5; });
    paint();
    if (!reduce) {
      // no deal-in animation: the first photo is simply there
      setTimeout(function () {
        order.slice().reverse().forEach(function (ci, k) { setTimeout(function () { cards[ci].classList.remove("deal"); }, k * 70); });
      }, 60);
      // If the browser has paused transitions (background tab, low-power mode), land the cards anyway
      setTimeout(function () {
        if (+getComputedStyle(cards[order[0]]).opacity < 1) {
          cards.forEach(function (c) { c.style.transition = "none"; });
          setTimeout(function () { cards.forEach(function (c) { c.style.transition = ""; }); }, 80);
        }
      }, 2200);
    }
    var auto = null, playBtn0 = $(".vf-play");
    var startAuto = function () { if (!auto && !reduce) auto = setInterval(shuffle, 3200); playBtn0.setAttribute("aria-pressed", "true"); playBtn0.setAttribute("aria-label", "Pause photos"); };
    var stopAuto = function () { clearInterval(auto); auto = null; playBtn0.setAttribute("aria-pressed", "false"); playBtn0.setAttribute("aria-label", "Play photos"); };
    $(".vf-change").addEventListener("click", function () { shuffle(); });
    playBtn0.addEventListener("click", function () { if (auto) stopAuto(); else startAuto(); });
    if (reduce) stopAuto(); else startAuto();
    var t0 = Date.now();
    setInterval(function () {
      var s = (Date.now() - t0) / 1000, f = Math.floor((s % 1) * 25);
      var p = function (n) { return String(Math.floor(n)).padStart(2, "0"); };
      tc.textContent = p(s / 3600) + ":" + p((s / 60) % 60) + ":" + p(s % 60) + ":" + p(f);
    }, 80);
  }

  /* ---- Work mode / Story mode: the choice is remembered from page to page ---- */
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (err) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (err) { /* private mode */ } }
  };
  var setMode = function (m) { store.set("hr-mode", m); document.documentElement.dataset.mode = m; };
  if (document.body.classList.contains("p-story")) setMode("story");
  $$("[data-mode-set]").forEach(function (a) { a.addEventListener("click", function () { setMode(a.getAttribute("data-mode-set")); }); });
  $$(".mode a[data-mode]").forEach(function (a) { a.addEventListener("click", function () { setMode(a.getAttribute("data-mode")); }); });
  (function () {
    var mw = $(".mode-work"), ms = $(".mode-story");
    if (!mw || !ms || document.body.classList.contains("p-story")) return;
    if (store.get("hr-mode") === "story") {
      mw.removeAttribute("aria-current"); ms.setAttribute("aria-current", "true");
      var f = parseInt(store.get("hr-story") || "0", 10);
      if (f > 0) {
        var r = document.createElement("span"); r.className = "resume num"; r.textContent = (f + 1) + "/8";
        ms.appendChild(r); ms.href = "story.html#f" + f; ms.setAttribute("aria-label", "Story mode, resume at frame " + (f + 1));
      }
    }
  })();

  /* ---- Story mode: 8-bit map, one frame at a time, narration typed out ---- */
  var story = $(".p-story .story");
  if (story) {
    var frames = $$(".st-frame", story), stops = $$(".st-stop", story);
    var n = frames.length, cur = 0, typing = null;
    var box = $(".st-box", story), headEl = $(".st-head", story), textEl = $(".st-text", story);
    var canvas = $(".story-map", story), ctx = canvas.getContext("2d");
    var W = canvas.width, H = canvas.height, GROUND = 42;
    var STOPX = [20, 56, 92, 128, 164, 200, 300, 338], SEA = [226, 280];
    var col = { ink: css("--ink"), ink2: css("--ink-2"), ink3: css("--ink-3"), paper: css("--paper"), coral: css("--coral"),
      sky: css("--sky"), dim: "rgba(239,230,212,0.28)", far: "rgba(140,198,234,0.16)", hair: "#3b2a22", skin: "#c68b62" };
    var bm = function (rows, x, y) {
      var map = { K: col.hair, S: col.skin, C: col.coral, N: col.sky, P: col.paper, I: col.ink };
      rows.forEach(function (r, j) { for (var i = 0; i < r.length; i++) { var c = map[r[i]]; if (c) { ctx.fillStyle = c; ctx.fillRect(x + i, y + j, 1, 1); } } });
    };
    var ADULT = ["..KKKK..", ".KKKKKK.", ".KSSSSK.", "..SSSS..", "..SSSS..", "...SS...", ".CCCCCC.", "C.CCCC.C", "S.CCCC.S", "..NNNN.."];
    var WAVE = ["..KKKK..", ".KKKKKK.", ".KSSSSK.", "..SSSS..", "..SSSS.S", "...SS..C", ".CCCCCCC", "C.CCCC..", "S.CCCC..", "..NNNN.."];
    var CHILD = ["..KKKK..", ".KSSSSK.", "..SSSS..", "...SS...", ".CCCCCC.", "S.CCCC.S", "..NNNN.."];
    var LEGS = [["..N..N..", ".N....N."], ["...NN...", "...NN..."]];
    var PLANE = ["....P.......", "PPPPPPPPPPP.", ".PPPPPPPPPPP", "....P......."];
    var STAR = ["...C...", "..CCC..", "CCCCCCC", ".CCCCC.", ".C...C."];
    var CLAP = ["PIPIPIP", "IPIPIPI", "PPPPPPP", "P.....P", "PPPPPPP"];
    var TROPHY = ["CCCCCCC", ".CCCCC.", "..CCC..", "...C...", ".CCCCC."];
    var SCREEN = ["PPPPPPP", "P..C..P", "P.CCC.P", "PPPPPPP", "..P.P.."];
    var CAP = ["...P...", ".PPPPP.", "PPPPPPP", "..PPP.C", "......C"];
    var FLAG = ["CCCC...", "CCCCC..", "CCCC...", "P......", "P......"];
    var ICONS = [CLAP, CLAP, TROPHY, SCREEN, SCREEN, SCREEN, CAP, FLAG];
    var x = STOPX[0], target = STOPX[0], step = 0, tick = 0, hop = 0, running = false;
    var moving = function () { return Math.abs(target - x) > 0.5; };
    var overSea = function () { return x > SEA[0] - 8 && x < SEA[1] + 8; };
    var skyline = function () {
      ctx.fillStyle = col.far;
      [[6, 14], [14, 22], [24, 10], [32, 26], [44, 16], [54, 30], [66, 12], [76, 20], [88, 34], [100, 18], [112, 24], [124, 14],
        [136, 28], [150, 20], [164, 16], [176, 26], [190, 12], [204, 18]].forEach(function (b) { ctx.fillRect(b[0], GROUND - b[1], 8, b[1]); });
      [[286, 12], [296, 18], [328, 10], [340, 18], [350, 12]].forEach(function (b) { ctx.fillRect(b[0], GROUND - b[1], 9, b[1]); });
      ctx.fillRect(316, GROUND - 32, 6, 32); ctx.fillRect(317, GROUND - 36, 4, 4); // clock tower
    };
    var draw = function () {
      ctx.fillStyle = col.ink2; ctx.fillRect(0, 0, W, H);
      skyline();
      ctx.fillStyle = col.ink3; ctx.fillRect(0, GROUND, SEA[0], H - GROUND); ctx.fillRect(SEA[1], GROUND, W - SEA[1], H - GROUND);
      ctx.fillStyle = col.sky;
      for (var sy = GROUND + 3; sy < H; sy += 4) for (var sx = SEA[0] + 2 + ((sy + (tick >> 3)) % 6); sx < SEA[1] - 3; sx += 6) ctx.fillRect(sx, sy, 3, 1);
      for (var px = 4; px < W - 4; px += 6) {
        if (px > SEA[0] - 4 && px < SEA[1] + 4) {
          ctx.fillStyle = px <= x ? col.coral : col.dim;
          ctx.fillRect(px, Math.round(30 - Math.sin((px - SEA[0]) / (SEA[1] - SEA[0]) * Math.PI) * 10), 2, 1);
        } else { ctx.fillStyle = px <= x ? col.coral : col.dim; ctx.fillRect(px, GROUND + 3, 3, 2); }
      }
      STOPX.forEach(function (sx2, i) {
        ctx.fillStyle = i === cur ? col.coral : (i < cur ? col.sky : col.paper); ctx.fillRect(sx2 - 2, GROUND + 2, 5, 4);
        if (i === cur || i === cur + 1 || !running) bm(ICONS[i], sx2 - 3, 3 - (i === cur && !moving() ? (tick >> 4) % 2 : 0));
      });
      if (moving() && overSea()) {
        var t = (x - (SEA[0] - 8)) / ((SEA[1] + 8) - (SEA[0] - 8));
        bm(PLANE, Math.round(x) - 6, Math.round(28 - Math.sin(t * Math.PI) * 10));
      } else {
        var lift = hop > 0 ? Math.round(Math.sin(hop / 12 * Math.PI) * 5) : 0;
        var px0 = Math.round(x) - 4;
        {
          var py0 = GROUND - 12 - lift;
          bm(!moving() && hop === 0 ? WAVE : ADULT, px0, py0);
          bm(moving() ? LEGS[step] : LEGS[1], px0, py0 + 10);
        }
      }
    };
    var loopFn = function () {
      tick++;
      if (moving()) {
        var d = target - x;
        x += Math.sign(d) * Math.min(Math.abs(d), overSea() ? 3 : 2);
        if (tick % 6 === 0) step = 1 - step;
        if (!moving()) { x = target; hop = 12; }
      } else if (hop > 0) { hop--; }
      draw();
      requestAnimationFrame(loopFn);
    };
    // Narration: the head line appears at once, the rest types out; tap the box to finish it
    var narrate = function (head, text) {
      if (typing) { clearInterval(typing); typing = null; }
      headEl.textContent = head;
      textEl.innerHTML = '<span class="sr"></span><span class="tw" aria-hidden="true"></span>';
      $(".sr", textEl).textContent = text;
      var tw = $(".tw", textEl), k = 0;
      box.classList.remove("done");
      if (reduce) { tw.textContent = text; box.classList.add("done"); return; }
      typing = setInterval(function () {
        k += 3; tw.textContent = text.slice(0, k);
        if (k >= text.length) { clearInterval(typing); typing = null; box.classList.add("done"); }
      }, 24);
    };
    box.addEventListener("click", function () {
      if (typing) { clearInterval(typing); typing = null; $(".tw", textEl).textContent = $(".sr", textEl).textContent; box.classList.add("done"); }
      else go(cur + 1);
    });
    var go = function (i, quiet) {
      cur = Math.max(0, Math.min(n - 1, i));
      frames.forEach(function (f, j) { f.hidden = j !== cur; });
      stops.forEach(function (s, j) {
        if (j === cur) s.setAttribute("aria-current", "step"); else s.removeAttribute("aria-current");
        if (j < cur) s.classList.add("seen");
      });
      var f = frames[cur];
      narrate(f.getAttribute("data-head"), f.getAttribute("data-text"));
      $(".st-pl", story).textContent = f.getAttribute("data-place") || "";
      $(".st-n", story).textContent = String(cur + 1).padStart(2, "0") + " / " + String(n).padStart(2, "0");
      $(".st-prev", story).disabled = cur === 0;
      $(".st-next", story).textContent = cur === n - 1 ? "Start again" : "Next";
      $(".st-end", story).hidden = cur !== n - 1;
      var nx = frames[cur + 1] && $("img", frames[cur + 1]);
      if (nx && nx.loading === "lazy") nx.loading = "eager";
      store.set("hr-story", String(cur));
      try { history.replaceState(null, "", "#f" + cur); } catch (err) { /* shared pages may refuse */ }
      target = STOPX[cur];
      if (reduce || quiet) x = target;
      draw();
    };
    $(".st-prev", story).addEventListener("click", function () { go(cur - 1); });
    $(".st-next", story).addEventListener("click", function () { go(cur === n - 1 ? 0 : cur + 1); });
    stops.forEach(function (s) { s.addEventListener("click", function () { go(+s.getAttribute("data-go")); }); });
    canvas.addEventListener("click", function (e) {
      var r = canvas.getBoundingClientRect(), mx = (e.clientX - r.left) / r.width * W, best = 0;
      STOPX.forEach(function (sx, i) { if (Math.abs(sx - mx) < Math.abs(STOPX[best] - mx)) best = i; });
      go(best);
    });
    var ph = $(".st-photo", story), sx0 = null;
    ph.addEventListener("click", function () { go(cur === n - 1 ? 0 : cur + 1); });
    ph.addEventListener("touchstart", function (e) { sx0 = e.touches[0].clientX; }, { passive: true });
    ph.addEventListener("touchend", function (e) {
      if (sx0 === null) return;
      var dx = e.changedTouches[0].clientX - sx0; sx0 = null;
      if (Math.abs(dx) > 50) { e.preventDefault(); go(cur + (dx < 0 ? 1 : -1)); }
    });
    document.addEventListener("keydown", function (e) {
      if (document.querySelector("dialog[open]") || e.target.closest("input, textarea")) return;
      if (e.key === "ArrowRight") go(cur + 1);
      if (e.key === "ArrowLeft") go(cur - 1);
    });
    var start = 0, h = /^#f(\d)$/.exec(location.hash);
    if (h) start = +h[1]; else start = parseInt(store.get("hr-story") || "0", 10) || 0;
    if (start >= n - 1 && !h) start = 0;
    go(start, true);
    var redraw = function () { draw(); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);
    if (!reduce) { running = true; requestAnimationFrame(loopFn); }
  }

  /* ---- Consumption & Creation loop ---- */
  var loopBox = $(".loop[data-loop]");
  if (loopBox) {
    var data = JSON.parse(loopBox.getAttribute("data-loop"));
    var nodes = $$(".node", loopBox), keys = nodes.map(function (g) { return g.getAttribute("data-node"); });
    var tiles = $$("#loopwall .tile");
    var run = $(".ring-run", loopBox), playBtn = $(".loop-play", loopBox);
    var timer = null, at = -1;
    var setText = function (label, c, m) {
      $(".loop-label", loopBox).textContent = label;
      $(".loop-consume", loopBox).textContent = c;
      $(".loop-create", loopBox).textContent = m;
    };
    var pick = function (i) {
      at = i;
      var k = keys[i], d = data[k];
      nodes.forEach(function (g, j) { g.setAttribute("aria-pressed", String(j === i)); });
      run.style.strokeDasharray = ((i + 1) / keys.length * 600) + " 600";
      setText(d.label, d.consume, d.create);
      $("#loopset").classList.remove("all-mode");
      tiles.forEach(function (t) { t.hidden = t.getAttribute("data-cat") !== k; });
    };
    var all = function () {
      at = -1;
      nodes.forEach(function (g) { g.setAttribute("aria-pressed", "false"); });
      run.style.strokeDasharray = "600 600";
      setText("All", "Travel, music, sport, film, food and the work itself", "Content strategy, production, brand activations and execution, communicated to audiences who care about the same things");
      $("#loopset").classList.add("all-mode");
      tiles.forEach(function (t) { t.hidden = false; });
    };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } playBtn.setAttribute("aria-pressed", "false"); playBtn.textContent = "Play the loop"; };
    nodes.forEach(function (g, i) {
      var act = function () { stop(); pick(i); };
      g.addEventListener("click", act);
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
    });
    $(".loop-all", loopBox).addEventListener("click", function () { stop(); all(); });
    playBtn.addEventListener("click", function () {
      if (timer) { stop(); return; }
      playBtn.setAttribute("aria-pressed", "true"); playBtn.textContent = "Pause";
      pick((at + 1) % keys.length);
      timer = setInterval(function () { pick((at + 1) % keys.length); }, 2800);
    });
    all();
  }

  /* ---- Published work: search plus role chips (chips combine as OR), state kept in the URL ---- */
  var lib = $("#library");
  var pieces = $$(".piece[data-id]");
  if (lib) {
    var q = $("#q"), chips = $$(".chip[data-role]", lib), total = pieces.length;
    var norm = function (s) { return (s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, ""); };
    var picked = function () { return chips.filter(function (c) { return c.getAttribute("aria-pressed") === "true"; }).map(function (c) { return c.getAttribute("data-role"); }); };
    var runF = function (push) {
      var terms = norm(q.value).split(/\s+/).filter(Boolean), roles = picked(), cnt = 0;
      pieces.forEach(function (p) {
        var hay = norm(p.getAttribute("data-search")), have = " " + p.getAttribute("data-r") + " ";
        var ok = terms.every(function (t) { return hay.indexOf(t) >= 0; })
          && (!roles.length || roles.some(function (r) { return have.indexOf(" " + r + " ") >= 0; }));
        p.hidden = !ok; if (ok) cnt++;
      });
      var filtering = terms.length > 0 || roles.length > 0;
      lib.classList.toggle("filtering", filtering);
      $("#shown-line").textContent = filtering ? "Showing " + cnt + " of " + total : (lib.classList.contains("all") ? "All " + total : "Top 12 by views");
      $("#empty").hidden = cnt > 0;
      if (push) {
        var u = new URLSearchParams();
        if (q.value) u.set("q", q.value);
        if (roles.length) u.set("r", roles.join(","));
        try { history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u : "")); } catch (err) { /* shared pages may refuse */ }
      }
    };
    var params = new URLSearchParams(location.search);
    q.value = params.get("q") || "";
    var want = (params.get("r") || "").split(",");
    chips.forEach(function (c) {
      c.setAttribute("aria-pressed", String(want.indexOf(c.getAttribute("data-role")) >= 0));
      c.addEventListener("click", function () { c.setAttribute("aria-pressed", String(c.getAttribute("aria-pressed") !== "true")); runF(true); });
    });
    q.addEventListener("input", function () { runF(true); });
    var sa = $("#show-all");
    if (sa) sa.addEventListener("click", function () {
      var open = !lib.classList.contains("all");
      lib.classList.toggle("all", open);
      sa.setAttribute("aria-expanded", String(open));
      sa.textContent = open ? "Show top 12" : "Show all " + total;
      runF(false);
    });
    $("#clear").addEventListener("click", function () { q.value = ""; chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); }); runF(true); q.focus(); });
    runF(false);
  }

  /* ---- Player: embeds load only on tap, always with a link to the original ---- */
  var pl = $("dialog.player");
  if (pl && pieces.length) {
    var list = [], pi = 0;
    var screen = $(".screen", pl);
    var row = function (cls, text, small) {
      var dd = $(cls, pl); dd.textContent = text || "";
      if (small && text) { var s = document.createElement("small"); s.textContent = small; dd.appendChild(s); }
      dd.parentNode.hidden = !text;
    };
    var load = function () {
      var p = list[pi], d = p.dataset;
      var site = /instagram\.com/.test(d.url) ? "Instagram" : "YouTube";
      if (share) {
        screen.className = "screen card";
        screen.innerHTML = '<div class="textcard"><span class="tc-t"></span></div>';
        $(".tc-t", screen).textContent = d.title;
      } else {
        screen.className = "screen " + (d.v === "1" ? "v" : "h");
        screen.innerHTML = '<div class="loading">Loading the post</div>';
        var f = document.createElement("iframe");
        f.src = d.embed; f.title = d.title; f.loading = "eager";
        f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write";
        f.allowFullscreen = true;
        screen.appendChild(f);
      }
      $(".pl-link", pl).textContent = (share ? "Watch on " : "Open on ") + site;
      $(".pl-tour-k", pl).textContent = d.t || "";
      $(".pl-title", pl).textContent = d.title;
      row(".pl-views", d.views);
      row(".pl-role", d.role);
      row(".pl-tour", d.t);
      $(".pl-link", pl).href = d.url;
      $(".pl-count", pl).textContent = (pi + 1) + " / " + list.length;
    };
    document.addEventListener("click", function (e) {
      var b = e.target.closest(".piece .open");
      if (!b) return;
      var p = b.closest(".piece");
      list = pieces.filter(function (x) { return !x.hidden && x.offsetParent !== null; });
      pi = Math.max(0, list.indexOf(p));
      load(); pl.showModal();
    });
    $(".pl-close", pl).addEventListener("click", function () { pl.close(); });
    pl.addEventListener("close", function () { screen.innerHTML = ""; });
    $(".pl-prev", pl).addEventListener("click", function () { pi = (pi - 1 + list.length) % list.length; load(); });
    $(".pl-next", pl).addEventListener("click", function () { pi = (pi + 1) % list.length; load(); });
  }
})();
