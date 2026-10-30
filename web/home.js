/*
 * The home screen for web-app TVs (LG webOS, Samsung Tizen), in Apple TV's style:
 *  - a glass tab bar at the top: Home, Games, Streaming, Music, Apps, and Home Settings; focusing a tab shows it;
 *  - a featured carousel under it that turns by itself (← → turn it, OK opens), in liquid glass: the art blurred
 *    behind the tab bar, the clock and the buttons, and a lens that slides and stretches between the tabs;
 *  - the focused card's art full screen (a trending title from that app, or the brand's colors), its name large;
 *  - the apps with the TV's own icons (the originals), or our logo on the brand's color where the TV has none;
 *  - rows of cards: the consoles (through the receiver's HDMI port), the streaming apps, the trending picks, music,
 *    shortcuts; going down a row lifts the rows over the art and hides the tab bar, Back comes up again;
 *  - always dark; a screensaver after a few idle minutes.
 * The remote's arrows, OK and Back move the focus; a pointer (LG's Magic Remote) focuses what it points at.
 */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function el(tag, cls, parent, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  function sym(name, parent, size) {
    var s = el('span', 'sym', parent);
    s.style.webkitMaskImage = 'url(symbols/' + name + '.png)';
    s.style.maskImage = 'url(symbols/' + name + '.png)';
    if (size) { s.style.width = size + 'px'; s.style.height = size + 'px'; }
    return s;
  }

  function hasClass(e, c) { return (' ' + e.className + ' ').indexOf(' ' + c + ' ') >= 0; }
  function setClass(e, c, on) {
    if (!e) return;
    if (on && !hasClass(e, c)) e.className = (e.className + ' ' + c).replace(/^\s+/, '');
    else if (!on && hasClass(e, c)) e.className = (' ' + e.className + ' ').replace(' ' + c + ' ', ' ').replace(/^\s+|\s+$/g, '');
  }

  var stage = $('stage'), body = document.body;

  /** The 1920 × 1080 stage fills the window (on the TV it already is 1920 × 1080). */
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.webkitTransform = stage.style.transform = s === 1 ? '' : 'scale(' + s + ')';
  }

  // MARK: - Apps, consoles and their colors

  /** Text for this screen's own words: Portuguese on a Portuguese TV, English elsewhere. */
  function L(pt, en) { return /^pt/.test(I18N.lang || '') ? pt : en; }

  /** Brands: key, LG/Samsung app id, name on the TV, tile gradient. */
  var SHELF = [
    ['disney', /disney/i, /disney/i, ['#1E4FB0', '#0A1446']],
    ['netflix', /netflix/i, /netflix/i, ['#141414', '#000000']],
    ['prime', /^amazon$|primevideo|amazonignition/i, /prime video|amazon/i, ['#1B2A3A', '#0B141D']],
    ['youtube', /youtube(?!.*(kids|music))/i, /^youtube$/i, ['#282828', '#0F0F0F']],
    ['globoplay', /globoplay/i, /globoplay/i, ['#FF7A1F', '#F0256A']],
    ['max', /hbo|wbd/i, /^(hbo )?max$|hbo max/i, ['#5C30E8', '#221684']],
    ['appletv', /appletv|apple\.tv/i, /apple tv/i, ['#2C2C2E', '#000000']],
    ['paramount', /paramount|cbs/i, /paramount/i, ['#0064FF', '#002A86']],
    ['hulu', /^hulu/i, /hulu/i, ['#1CE783', '#0B8F4E']],
    ['peacock', /peacock/i, /peacock/i, ['#1C1C1E', '#000000']],
    ['jellyfin', /jellyfin/i, /jellyfin/i, ['#AA5CC3', '#00A4DC']],
    ['spotify', /spotify/i, /spotify/i, ['#1F1F1F', '#000000']]
  ];

  // The streaming row, in this order when installed (Home Settings → Streaming row changes it on the TV).
  var STREAMING = ['disney', 'netflix', 'prime', 'youtube', 'globoplay', 'max', 'appletv', 'paramount'];
  var FEW_APPS = 8;
  var MUSIC = /spotify|deezer|tidal|music|soundcloud|tunein|radio|pandora|palco ?mp3|napster|amazon music/i;
  var GAMES = /xbox|geforce|steam ?link|amazon luna|^luna$|boosteroid|gaming hub|game pass|blacknut|antstream|utomik/i;

  /** White logos bundled in web/icons, for the big art behind the title (and tiles whose icon the TV doesn't give). */
  var LOGOS = {
    netflix: 'icons/netflix.svg', youtube: 'icons/youtube.png', prime: 'icons/prime.png', max: 'icons/max.svg',
    appletv: 'icons/appletv.svg', paramount: 'icons/paramountplus.svg', jellyfin: 'icons/jellyfin.svg', spotify: 'icons/spotify-green.svg'
  };

  /** Brands without a logo here: their name, set in the style of theirs. */
  var WORDMARK = {disney: 'wm-disney', globoplay: 'wm-globoplay'};

  /** The colors of each brand's art, full screen: its own color, fading to black. */
  var ART = {
    disney: ['#1F6FD8', '#040B2E'], netflix: ['#E50914', '#2A0003'], prime: ['#1A98FF', '#03182F'],
    youtube: ['#FF0033', '#2A0008'], globoplay: ['#FF5A1F', '#3A0618'], max: ['#5C30E8', '#0E0526'],
    appletv: ['#6E6E73', '#0B0B0D'], paramount: ['#0064FF', '#000E2E'], spotify: ['#1DB954', '#03200C']
  };

  /** One line about each app, under its name. */
  var ABOUT = {
    disney: ['Disney, Pixar, Marvel, Star Wars e National Geographic.', 'Disney, Pixar, Marvel, Star Wars and National Geographic.'],
    netflix: ['Séries, filmes, animes e documentários.', 'Series, films, anime and documentaries.'],
    prime: ['Filmes, séries e Amazon Originals.', 'Films, series and Amazon Originals.'],
    youtube: ['Vídeos, música e os criadores que você segue.', 'Videos, music and the creators you follow.'],
    globoplay: ['Novelas, séries, jornalismo e a Globo ao vivo.', 'Telenovelas, series, news and Globo live.'],
    max: ['HBO, Warner Bros., DC e Discovery.', 'HBO, Warner Bros., DC and Discovery.'],
    appletv: ['Apple Originals, filmes e séries.', 'Apple Originals, films and series.'],
    spotify: ['Suas músicas, playlists e podcasts, no som da sala.', 'Your music, playlists and podcasts, on the big speakers.']
  };

  /**
   * The consoles, all through the receiver: each one switches the TV to the receiver's HDMI port (Home Settings sets
   * it per console; Automatic is the first port with a device on). The receiver picks the console itself (HDMI-CEC
   * when the console turns on, or its own remote).
   */
  var CONSOLES = [
    {key: 'xbox', name: 'Xbox', maker: 'Microsoft', logo: 'icons/xbox.svg', tile: ['#2BA640', '#0B5418'], art: ['#107C10', '#021A05']},
    {key: 'ps5', name: 'PlayStation 5', maker: 'Sony', logo: 'icons/playstation.svg', tile: ['#2F74E6', '#0A2A7A'], art: ['#0B56D0', '#020A26']},
    {key: 'switch', name: 'Nintendo Switch', maker: 'Nintendo', logo: 'icons/nintendoswitch.svg', tile: ['#F23A46', '#A3000F'], art: ['#E60012', '#2A0004']},
    {key: 'switch2', name: 'Nintendo Switch 2', maker: 'Nintendo', logo: 'icons/nintendoswitch.svg', tile: ['#3B3D45', '#0E0F12'], art: ['#00A6D6', '#05080F'], accent: true}
  ];

  function shelfKey(app) {
    for (var i = 0; i < SHELF.length; i++) if (SHELF[i][1].test(app.id) || SHELF[i][2].test(app.title)) return SHELF[i];
    return null;
  }

  function darken(hex, f) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return '#161618';
    var n = parseInt(m[1], 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return 'rgb(' + Math.round(r * f) + ',' + Math.round(g * f) + ',' + Math.round(b * f) + ')';
  }

  /** A name that fits the tile on one line (the font shrinks for long names). */
  function wordFit(title, width, max) {
    return Math.max(18, Math.min(max, Math.floor(width * 0.8 / (Math.max(4, title.length) * 0.56))));
  }

  // MARK: - Logos

  // The TV's icons are small squares with their own background (white behind Netflix, black behind Max). Like the
  // Android app does with the TV art, the logo is lifted off it once: the background goes transparent and the rest is
  // cropped to the logo, which then fills the tile on the brand's color.
  var lifted = {};   // icon url -> {src, bg: [r, g, b], ink: luminance histogram} or false (keep the icon as it is)
  var LIFT_SIZE = 240;

  // sRGB (0-255) to linear light, computed once: lift() needs it for every pixel, and old TVs are slow at Math.pow.
  var LINEAR = [];
  for (var li = 0; li < 256; li++) LINEAR[li] = li <= 10 ? li / 255 / 12.92 : Math.pow((li / 255 + 0.055) / 1.055, 2.4);

  /** Relative luminance (0-1) of an sRGB color (whole numbers, as read from the canvas). */
  function luminance(r, g, b) {
    return 0.2126 * LINEAR[r] + 0.7152 * LINEAR[g] + 0.0722 * LINEAR[b];
  }

  function rgbOf(color) {
    var m = /^#?([0-9a-f]{6})$/i.exec(color || '');
    if (m) { var n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(color || '');
    return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
  }

  function lift(img) {
    var w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) return false;
    var f = Math.min(1, LIFT_SIZE / Math.max(w, h));
    w = Math.max(1, Math.round(w * f));
    h = Math.max(1, Math.round(h * f));
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var g = canvas.getContext('2d');
    var data;
    try {
      g.drawImage(img, 0, 0, w, h);
      data = g.getImageData(0, 0, w, h);
    } catch (e) {
      return false;   // a TV that doesn't let the page read its icons
    }
    var px = data.data;
    // The background: the most common color a little inside the edges (rounded icons have transparent corners).
    var votes = {}, best = null, bestN = 0, inset = Math.round(Math.min(w, h) * 0.08);
    for (var s = 0; s < 64; s++) {
      var t = s % 16 / 16, side = s >> 4;
      var x = side < 2 ? Math.round(inset + t * (w - 2 * inset)) : side === 2 ? inset : w - 1 - inset;
      var y = side < 2 ? (side === 0 ? inset : h - 1 - inset) : Math.round(inset + t * (h - 2 * inset));
      var i = (y * w + x) * 4;
      var key = px[i + 3] < 128 ? 'clear' : (px[i] >> 4) + ',' + (px[i + 1] >> 4) + ',' + (px[i + 2] >> 4);
      votes[key] = (votes[key] || 0) + 1;
      if (votes[key] > bestN) { bestN = votes[key]; best = key === 'clear' ? null : [px[i], px[i + 1], px[i + 2]]; }
    }
    var minX = w, minY = h, maxX = -1, maxY = -1, ink = [0, 0, 0, 0, 0, 0, 0, 0], inkSum = 0;
    for (var p = 0; p < w * h; p++) {
      var j = p * 4, a = px[j + 3] / 255;
      if (best) {
        // color to alpha: how far each channel is from the background, as a share of how far it could go, so the
        // anti-aliased edges come out as the logo's color, partly clear, without a fringe of the background
        var k = 0, c;
        for (c = 0; c < 3; c++) {
          var v = px[j + c], o = best[c];
          k = Math.max(k, v > o ? (v - o) / Math.max(1, 255 - o) : (o - v) / Math.max(1, o));
        }
        k = Math.max(0, Math.min(1, (k - 0.1) / 0.9));   // compression noise stays clear
        if (k > 0 && k < 1) {
          for (c = 0; c < 3; c++) px[j + c] = Math.max(0, Math.min(255, best[c] + (px[j + c] - best[c]) / k));
        }
        a *= k;
      }
      px[j + 3] = Math.round(a * 255);
      if (a > 0.3) {
        var px0 = p % w, py0 = (p / w) | 0;
        if (px0 < minX) minX = px0;
        if (px0 > maxX) maxX = px0;
        if (py0 < minY) minY = py0;
        if (py0 > maxY) maxY = py0;
        ink[Math.min(7, Math.floor(Math.sqrt(luminance(px[j], px[j + 1], px[j + 2])) * 8))] += a;
        inkSum += a;
      }
    }
    // Nothing left, or nothing taken away (a picture rather than a logo on a background): keep the icon.
    if (maxX < 0 || (maxX - minX > w * 0.96 && maxY - minY > h * 0.96)) return false;
    var crop = document.createElement('canvas');
    crop.width = maxX - minX + 1;
    crop.height = maxY - minY + 1;
    g.putImageData(data, 0, 0);
    crop.getContext('2d').drawImage(canvas, minX, minY, crop.width, crop.height, 0, 0, crop.width, crop.height);
    for (var b = 0; b < 8; b++) ink[b] /= inkSum;
    try {
      return {src: crop.toDataURL('image/png'), bg: best, ink: ink};
    } catch (e2) {
      return false;
    }
  }

  /**
   * Share of the logo that hardly shows on a tile of this luminance (YouTube's black type on a dark tile). Each bin
   * of the histogram holds the ink whose square-root luminance falls in it.
   */
  function unseen(ink, tileLum) {
    var share = 0;
    for (var b = 0; b < 8; b++) {
      var l = Math.pow((b + 0.5) / 8, 2);
      if ((Math.max(l, tileLum) + 0.05) / (Math.min(l, tileLum) + 0.05) < 1.8) share += ink[b];
    }
    return share;
  }

  function paint(box, top, bottom) {
    box.style.background = '-webkit-linear-gradient(top, ' + top + ', ' + bottom + ')';
    box.style.background = 'linear-gradient(' + top + ', ' + bottom + ')';
  }

  /** A color that is clearly a hue (Crunchyroll's orange), not black, white or a gray. */
  function colorful(rgb) {
    return Math.max(rgb[0], rgb[1], rgb[2]) - Math.min(rgb[0], rgb[1], rgb[2]) >= 96;
  }

  /**
   * The logo's box in its own proportions, as large as object-fit: contain draws it. Chrome 38 (webOS 3) ignores
   * object-fit while a tile next to it animates, and the logo stretched to its 70% x 50% box until the move ended.
   * Not laid out yet (a closed sheet): object-fit stays, and fitLogos() runs when the sheet opens.
   */
  function fitLogo(img) {
    var box = img.parentNode, bw = img.offsetWidth, bh = img.offsetHeight, nw = img.naturalWidth, nh = img.naturalHeight;
    if (!box || !bw || !bh || !nw || !nh || img.style.width) return;
    var s = Math.min(bw / nw, bh / nh);
    img.style.width = nw * s / box.offsetWidth * 100 + '%';
    img.style.height = nh * s / box.offsetHeight * 100 + '%';
  }

  function fitLogos(root) {
    var imgs = root.querySelectorAll('img.logo');
    for (var i = 0; i < imgs.length; i++) if (imgs[i].complete) fitLogo(imgs[i]);
  }

  /** own: the tile has the TV's color for the app, not one of SHELF's. */
  function showLogo(img, box, top, bottom, logo, own) {
    img.className = 'logo';
    img.onload = function () { img.onload = null; fitLogo(img); };
    img.src = logo.src;
    if (img.complete) fitLogo(img);
    var a = rgbOf(top), z = rgbOf(bottom);
    var tileLum = (luminance(a[0], a[1], a[2]) + luminance(z[0], z[1], z[2])) / 2;
    // The tile takes the icon's background when the logo only reads on it, and when that background is the brand's
    // color: LG's bgColor isn't always the icon's (Crunchyroll's is black, on an orange icon).
    if (logo.bg && ((own && colorful(logo.bg)) || unseen(logo.ink, tileLum) > 0.35)) {
      var bg = 'rgb(' + logo.bg.join(',') + ')';
      var hex = '#' + ((1 << 24) | (logo.bg[0] << 16) | (logo.bg[1] << 8) | logo.bg[2]).toString(16).slice(1);
      paint(box, bg, darken(hex, 0.93));
    }
  }

  /** An app's face: the TV's own icon for it, as it is (the original), or else its logo on its brand color. */
  function face(app, box, wordSize) {
    if (app.original && app.icon) originalFace(app, box, wordSize);
    else brandFace(app, box, wordSize, app.logo || app.icon);
  }

  var edges = {};   // icon url -> what's around its logo: {kind: 'solid' | 'clear' | 'picture', bg: [r, g, b]}

  /**
   * What fills the icon's edges, away from its rounded corners: one color (the card takes it, so the icon seems to
   * fill it), nothing (a logo on its own: the brand's color behind it) or a picture (it covers the card).
   */
  function edgeOf(img) {
    var w = 64, h = Math.max(1, Math.round(64 * img.naturalHeight / Math.max(1, img.naturalWidth)));
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var px;
    try {
      var g = canvas.getContext('2d');
      g.drawImage(img, 0, 0, w, h);
      px = g.getImageData(0, 0, w, h).data;
    } catch (e) {
      return {kind: 'solid', bg: [0, 0, 0]};   // a TV that doesn't let the page read its icons
    }
    var votes = {}, best = null, bestN = 0, n = 0, inset = 2;
    for (var s = 0; s < 64; s++) {
      var t = 0.2 + (s % 16) / 16 * 0.6, side = s >> 4;
      var x = side < 2 ? Math.round(t * (w - 1)) : side === 2 ? inset : w - 1 - inset;
      var y = side < 2 ? (side === 0 ? inset : h - 1 - inset) : Math.round(t * (h - 1));
      var i = (y * w + x) * 4;
      var key = px[i + 3] < 128 ? 'clear' : (px[i] >> 4) + ',' + (px[i + 1] >> 4) + ',' + (px[i + 2] >> 4);
      votes[key] = (votes[key] || 0) + 1;
      n++;
      if (votes[key] > bestN) { bestN = votes[key]; best = key === 'clear' ? null : [px[i], px[i + 1], px[i + 2]]; }
    }
    if (bestN < n * 0.6) return {kind: 'picture'};
    return best ? {kind: 'solid', bg: best} : {kind: 'clear'};
  }

  /** The TV's own icon, whole, on the card's full height; its own background fills the sides. */
  function originalFace(app, box, wordSize) {
    var img = el('img', 'orig', box), url = app.icon, k = shelfKey(app);
    box.style.background = '#1C1C1E';
    img.onerror = function () { box.innerHTML = ''; brandFace(app, box, wordSize, app.logo); };
    img.onload = function () {
      img.onload = null;
      if (!edges[url]) edges[url] = edgeOf(img);
      var e = edges[url];
      if (e.kind === 'solid') box.style.background = 'rgb(' + e.bg.join(',') + ')';
      else if (e.kind === 'picture') setClass(img, 'cover', true);
      else {
        setClass(img, 'fit', true);
        paint(box, k ? k[3][0] : '#2A2A2E', k ? k[3][1] : '#161618');
      }
    };
    img.src = url;
  }

  /** Our logo for the app on its brand color (or its name, when there's no logo). */
  function brandFace(app, box, wordSize, logo) {
    var k = shelfKey(app);
    var top = k ? k[3][0] : app.color ? darken(app.color, 0.92) : '#2A2A2E';
    var bottom = k ? k[3][1] : app.color ? darken(app.color, 0.62) : '#161618';
    paint(box, top, bottom);
    var word = el('div', 'word', box, app.title);
    if (wordSize) word.style.fontSize = wordSize + 'px';
    if (k && WORDMARK[k[0]]) setClass(word, WORDMARK[k[0]], true);
    var url = (k && LOGOS[k[0]]) || logo || '';
    if (url) {
      var img = el('img', '', box);
      word.style.visibility = 'hidden';
      img.onerror = function () { if (img.parentNode) img.parentNode.removeChild(img); word.style.visibility = ''; };
      if (lifted[url]) { showLogo(img, box, top, bottom, lifted[url], !k); return; }
      if (lifted[url] !== false) {
        img.onload = function () {
          img.onload = null;
          if (lifted[url] === undefined) lifted[url] = lift(img);
          if (lifted[url]) showLogo(img, box, top, bottom, lifted[url], !k);
        };
      }
      img.src = url;
    }
  }

  var apps = [], shelf = [], others = [], inputs = [];

  /** shelf_apps in config.properties: the streaming row in that order, by id or name (part of it). */
  var WANTED = (CONFIG.shelfApps || []).map(function (s) { return s.toLowerCase(); });

  function isMusic(app) { return MUSIC.test(app.title) || MUSIC.test(app.id); }
  function isGame(app) { return GAMES.test(app.title) || GAMES.test(app.id); }

  function pickShelf() {
    if (WANTED.length && Prefs.shelfConfig() !== WANTED.join(',')) {
      Prefs.set('shelf', null);
      Prefs.set('shelfConfig', WANTED.join(','));
    }
    var chosen = Prefs.shelf(), out = [];
    if (chosen) {
      for (var i = 0; i < chosen.length; i++) {
        for (var j = 0; j < apps.length; j++) if (apps[j].id === chosen[i]) out.push(apps[j]);
      }
    } else if (WANTED.length) {
      for (var w = 0; w < WANTED.length; w++) {
        for (var k = 0; k < apps.length; k++) {
          var id = apps[k].id.toLowerCase(), title = apps[k].title.toLowerCase();
          if ((id.indexOf(WANTED[w]) >= 0 || title.indexOf(WANTED[w]) >= 0) && out.indexOf(apps[k]) < 0) { out.push(apps[k]); break; }
        }
      }
    } else {
      for (var s = 0; s < STREAMING.length && out.length < FEW_APPS; s++) {
        for (var a = 0; a < apps.length; a++) {
          var key = shelfKey(apps[a]);
          if (key && key[0] === STREAMING[s] && !isMusic(apps[a]) && out.indexOf(apps[a]) < 0) { out.push(apps[a]); break; }
        }
      }
    }
    shelf = out;
    others = apps.filter(function (x) { return shelf.indexOf(x) < 0; });
  }

  /** The music apps, Spotify first. */
  function musicApps() {
    return apps.filter(isMusic).sort(function (a, b) { return (/spotify/i.test(b.title) ? 1 : 0) - (/spotify/i.test(a.title) ? 1 : 0); });
  }

  // MARK: - Focus

  var Z = {TABS: 'tabs', HERO: 'hero', ROWS: 'rows', SETTINGS: 'settings', EDIT: 'edit', LANG: 'lang', CITY: 'city', KEY: 'key', ABOUT: 'about'};
  var st = {zone: Z.ROWS, tab: 0, tabFocus: 0, page: 0, line: 0, col: 0, row: 0, edit: 0, lang: 0, city: 0, key: 0};

  function isSheet(zone) { return zone === Z.SETTINGS || zone === Z.EDIT || zone === Z.LANG || zone === Z.CITY || zone === Z.KEY || zone === Z.ABOUT; }
  function sheetOpen() { return isSheet(st.zone); }

  function updateFocus() {
    var i, list = tabsBox().children;
    for (i = 0; i < list.length; i++) {
      setClass(list[i], 'on', i === st.tab);
      setClass(list[i], 'focus', st.zone === Z.TABS && st.tabFocus === i);
    }
    placeLens();
    var nodes = $('rows').children, deep = st.zone === Z.ROWS && st.line > 0;
    for (var r = 0; r < nodes.length; r++) {
      var items = nodes[r].lastChild.children;
      for (i = 0; i < items.length; i++) setClass(items[i], 'focus', st.zone === Z.ROWS && r === st.line && i === st.col);
      setClass(nodes[r], 'gone', deep && r < st.line);
    }
    if (lines[st.line]) reveal(st.line);
    setClass(body, 'deep', deep);
    var y = deep ? TOP_DEEP - lines[st.line].y : 0;
    $('rows').style.webkitTransform = $('rows').style.transform = 'translateY(' + y + 'px)';
    renderHero();
    focusRows($('settings'), st.row, st.zone === Z.SETTINGS);
    focusRows($('shelfedit'), st.edit, st.zone === Z.EDIT);
    focusRows($('langpick'), st.lang, st.zone === Z.LANG);
    if (langHint) langHint.textContent = (st.lang + 1) + ' / ' + languageChoices().length + '  ·  ' + tr('OK picks, Back cancels.');
    focusRows($('citypick'), st.city, st.zone === Z.CITY);
    focusRows($('keypick'), st.key, st.zone === Z.KEY);
    if (sheetOpen()) frostSheets();
  }

  function focusRows(sheet, index, on) {
    var rows = sheet.querySelectorAll('.row');
    for (var i = 0; i < rows.length; i++) setClass(rows[i], 'focus', on && i === index);
    var holder = sheet.querySelector('.rows');
    if (!holder) return;
    var visible = 7, first = Math.max(0, Math.min(rows.length - visible, index - 3));
    holder.style.webkitTransform = holder.style.transform = 'translateY(' + (-first * 78) + 'px)';
  }

  // MARK: - Tab bar: Home, Games, Streaming, Music, Apps, and Home Settings at the end

  var TABS = ['home', 'games', 'streaming', 'music', 'apps'];

  function tabName(key) {
    return key === 'home' ? L('Início', 'Home') : key === 'games' ? 'Games' : key === 'streaming' ? 'Streaming'
      : key === 'music' ? L('Música', 'Music') : 'Apps';
  }

  function tabsBox() { return $('tabbar').querySelector('.tabs'); }

  function renderTabs() {
    var box = tabsBox();
    box.innerHTML = '';
    for (var i = 0; i < TABS.length; i++) hover(el('div', 'tab', box, tabName(TABS[i])), Z.TABS, i);
    var gear = el('div', 'tab icon', box);
    sym('settings', gear);
    hover(gear, Z.TABS, TABS.length);
    lensAt = null;
    lensTab = -1;
  }

  var lensAt = null, lensW = 0, lensTab = -1;

  /**
   * The clear lens under the selected tab, while the focus is elsewhere (on the bar, the focused tab is white): two
   * round caps and a middle that stretches between them. Going right, the right cap leads and the left one follows
   * later, so the lens stretches and settles like a drop.
   */
  function placeLens() {
    var tab = tabsBox().children[st.tab];
    var lens = $('tabbar').querySelector('.lens');
    if (!tab || !lens) return;
    setClass(lens, 'hide', st.zone === Z.TABS);
    if (lensTab === st.tab && lensAt !== null) return;   // reading offsetLeft forces a layout on every key press
    lensTab = st.tab;
    var x = tab.offsetLeft, w = tab.offsetWidth, parts = lens.children;
    if (x === lensAt && w === lensW) return;
    var first = lensAt === null, right = x >= lensAt;
    var lead = first ? '0s' : '0.32s', mid = first ? '0s' : '0.42s', tail = first ? '0s' : '0.54s';
    var curve = ' cubic-bezier(0.3, 1.25, 0.4, 1)';
    var timing = [right ? tail : lead, mid, right ? lead : tail];
    for (var i = 0; i < 3; i++) {
      parts[i].style.webkitTransition = '-webkit-transform ' + timing[i] + curve;
      parts[i].style.transition = 'transform ' + timing[i] + curve;
    }
    // Round caps (whole circles) at both ends, the middle from one's center to the other's: no corner shows.
    var cap = 72;
    parts[0].style.webkitTransform = parts[0].style.transform = 'translateX(' + x + 'px)';
    parts[1].style.webkitTransform = parts[1].style.transform = 'translateX(' + (x + cap / 2) + 'px) scaleX(' + Math.max(1, w - cap) + ')';
    parts[2].style.webkitTransform = parts[2].style.transform = 'translateX(' + (x + w - cap) + 'px)';
    lensAt = x;
    lensW = w;
  }

  var tabTimer = 0, TAB_REST_MS = 220;

  /**
   * Focusing a tab shows it once the focus rests there: a run along the bar doesn't build every tab's rows on the way
   * (that's what made it stutter). Anything that needs the tab now (↓, OK) calls selectTabNow first.
   */
  function selectTabSoon(i) {
    clearTimeout(tabTimer);
    tabTimer = setTimeout(function () { tabTimer = 0; selectTab(i); }, TAB_REST_MS);
  }

  function selectTabNow() {
    if (!tabTimer) return;
    clearTimeout(tabTimer);
    tabTimer = 0;
    if (st.tabFocus < TABS.length) selectTab(st.tabFocus);
  }

  /** As on Apple TV, focusing a tab shows it: its rows at once, from the start. */
  function selectTab(i, force) {
    clearTimeout(tabTimer);
    tabTimer = 0;
    if (i === st.tab && !force) return;
    st.tab = i;
    st.line = 0;
    st.col = 0;
    st.page = 0;
    heroDir = 0;
    var holder = $('rows');
    holder.style.webkitTransition = holder.style.transition = 'none';
    renderRows();
    void holder.offsetWidth;   // laid out where it lands before the slide comes back
    holder.style.webkitTransition = holder.style.transition = '';
  }

  // MARK: - Rows: what each tab shows

  // Card sizes by kind: width, height, gap.
  var SIZES = {app: [300, 180, 44], appbig: [400, 240, 48], console: [400, 225, 40], consolebig: [520, 292, 44],
    pick: [480, 270, 40], action: [240, 150, 32]};
  // The first row sits under the hero; further down, the focused row rises to the top (the tab bar hides).
  var TOP_FIRST = 640, TOP_DEEP = 150, LEFT = 96, RIGHT = 1824;

  var lines = [];

  function buildLines(tab) {
    var out = [];
    function add(title, kind, items) { if (items.length) out.push({title: title, kind: kind, items: items}); }
    var picks = Data.showcase().filter(function (p) { return p.backdrop; });
    if (tab === 'home') {
      add('Games', 'console', CONSOLES.map(consoleItem));
      add('Streaming', 'app', shelf.map(appItem));
      add(L('Em alta nos seus apps', 'Trending on your apps'), 'pick', picks.map(pickItem));
      add(L('Música', 'Music'), 'app', musicApps().map(appItem));
      add(L('Atalhos', 'Shortcuts'), 'action', shortcuts());
    } else if (tab === 'games') {
      add('Consoles', 'consolebig', CONSOLES.map(consoleItem));
      add(L('Jogos na nuvem', 'Cloud gaming'), 'app', apps.filter(isGame).map(appItem));
      add(L('Entradas', 'Inputs'), 'action', inputItems());
    } else if (tab === 'streaming') {
      add(L('Seus apps', 'Your apps'), 'appbig', shelf.map(appItem));
      add(L('Filmes em alta', 'Trending movies'), 'pick', picks.filter(function (p) { return p.kind === 'movie'; }).map(pickItem));
      add(L('Séries em alta', 'Trending shows'), 'pick', picks.filter(function (p) { return p.kind === 'tv'; }).map(pickItem));
      add(L('Mais apps de vídeo', 'More video apps'), 'app', others.filter(function (a) { return !isMusic(a) && !isGame(a); }).map(appItem));
    } else if (tab === 'music') {
      add(L('Música', 'Music'), 'appbig', musicApps().map(appItem));
    } else {
      var all = apps.slice(), per = 5;
      for (var i = 0; i < all.length; i += per) {
        add(i ? '' : L('Todos os apps', 'All apps'), 'app', all.slice(i, i + per).map(appItem));
      }
    }
    if (!out.length) add(L('Atalhos', 'Shortcuts'), 'action', shortcuts());
    return out;
  }

  function renderRows() {
    var holder = $('rows');
    holder.innerHTML = '';
    lines = buildLines(TABS[st.tab]);
    featured = buildFeatured(TABS[st.tab]);
    st.page = featured.length ? st.page % featured.length : 0;
    var y = TOP_FIRST;
    for (var r = 0; r < lines.length; r++) {
      var line = lines[r], size = SIZES[line.kind];
      line.w = size[0];
      line.h = size[1];
      line.gap = size[2];
      line.y = y;
      line.scroll = 0;
      var node = el('div', 'line', holder);
      node.style.top = y + 'px';
      if (line.title) el('div', 'title', node, line.title);
      var strip = el('div', 'strip', node);
      strip.style.top = (line.title ? 64 : 0) + 'px';
      for (var c = 0; c < line.items.length; c++) {
        var it = line.items[c], item = el('div', 'item ' + it.kind + (it.off ? ' off' : ''), strip);
        item.style.left = (LEFT + c * (line.w + line.gap)) + 'px';
        item.style.width = line.w + 'px';
        item.style.height = line.h + 'px';
        var f = el('div', 'face', item);
        f.style.height = line.h + 'px';
        it.draw(f, line);
        if (it.label) el('div', 'label', item, it.label).style.top = (line.h + 22) + 'px';
        hover(item, Z.ROWS, r * 1000 + c);
      }
      y += (line.title ? 64 : 0) + line.h + 84;
    }
    st.line = Math.max(0, Math.min(st.line, lines.length - 1));
    st.col = lines.length ? Math.max(0, Math.min(st.col, lines[st.line].items.length - 1)) : 0;
    if (!lines.length && st.zone === Z.ROWS) st.zone = Z.TABS;
    if (!featured.length && st.zone === Z.HERO) st.zone = Z.TABS;
    updateFocus();
  }

  /** The focused row's strip slides to its card; the other rows keep where they were left. */
  function reveal(r) {
    var line = lines[r], node = $('rows').children[r];
    if (!line || !node) return;
    // As on Apple TV, the focused card stays at the row's start and the row glides under it, until its last cards
    // are all in view.
    var step = line.w + line.gap, room = RIGHT - LEFT, total = line.items.length * step - line.gap;
    line.scroll = Math.max(0, Math.min(st.col * step, total - room));
    var strip = node.lastChild;
    strip.style.webkitTransform = strip.style.transform = 'translateX(' + (-line.scroll) + 'px)';
  }

  /** Up or down a row: to the card under the focused one. */
  function moveLine(d) {
    var from = lines[st.line], to = lines[st.line + d];
    if (!to) return;
    var x = LEFT + st.col * (from.w + from.gap) - from.scroll + from.w / 2, best = 0, bestD = 1e9;
    for (var c = 0; c < to.items.length; c++) {
      var dist = Math.abs(LEFT + c * (to.w + to.gap) - to.scroll + to.w / 2 - x);
      if (dist < bestD) { bestD = dist; best = c; }
    }
    st.line += d;
    st.col = best;
  }

  function current() { var line = lines[st.line]; return line ? line.items[st.col] : null; }

  // MARK: - Cards

  function appItem(app) {
    var k = shelfKey(app), key = k ? k[0] : '';
    return {
      kind: 'app', label: app.title, go: isMusic(app) ? L('Ouvir', 'Listen') : L('Abrir', 'Open'),
      draw: function (box, line) { face(app, box, wordFit(app.title, line.w, line.w > 300 ? 46 : 38)); },
      hero: function () {
        var p = trendingOn(app), about = ABOUT[key];
        var kind = isMusic(app) ? L('Música', 'Music') : isGame(app) ? L('Jogos na nuvem', 'Cloud gaming') : k || Data.services().some(function (x) { return Data.appFor(x.key) === app; }) ? 'Streaming' : 'App';
        if (p) {
          return {kicker: app.title + ' · ' + L('Em alta', 'Trending'), name: p.title, info: p.meta,
            desc: L('OK abre o ' + app.title + '.', 'OK opens ' + app.title + '.'),
            art: {img: Data.image(p.backdrop, 'w1280')}};
        }
        return {kicker: kind, name: app.title, desc: about ? L(about[0], about[1]) : L('Pressione OK para abrir.', 'Press OK to open.'),
          art: {colors: ART[key] || [app.color ? darken(app.color, 0.9) : '#3A3A40', '#050506'], logo: LOGOS[key] || ''}};
      },
      run: launcher(app.id, app.title)
    };
  }

  /** A pick from this app (TMDB's trending titles, when there's a key), for its art. */
  function trendingOn(app) {
    var list = Data.showcase();
    for (var i = 0; i < list.length; i++) if (list[i].app && list[i].backdrop && Data.appFor(list[i].app) === app) return list[i];
    return null;
  }

  function consoleItem(c) {
    return {
      kind: 'console', go: L('Jogar', 'Play'),
      draw: function (box, line) {
        paint(box, c.tile[0], c.tile[1]);
        el('div', 'glow', box);
        if (c.accent) {   // Switch 2: the Joy-Con's blue and red at the edges
          var a = el('div', '', box), b = el('div', '', box);
          a.style.cssText = 'position:absolute;left:0;top:0;bottom:0;width:10px;background:#00B8E6';
          b.style.cssText = 'position:absolute;right:0;top:0;bottom:0;width:10px;background:#FF3C28';
        }
        var logo = el('img', 'mark', box);
        logo.src = c.logo;
        logo.width = logo.height = line.h > 240 ? 80 : 64;
        if (line.h > 240) { logo.style.width = logo.style.height = '80px'; }
        el('div', 'cname', box, c.name).style.fontSize = (line.h > 240 ? 46 : 38) + 'px';
        el('div', 'via', box, 'HDMI ' + consoleHdmi(c));
      },
      hero: function () {
        var n = consoleHdmi(c);
        return {kicker: c.maker + ' · ' + L('Console', 'Console'), name: c.name, badge: 'HDMI ' + n,
          art: {colors: c.art, logo: c.logo}};
      },
      run: function () { playConsole(c); }
    };
  }

  function pickItem(p) {
    var app = p.app ? Data.appFor(p.app) : null;
    return {
      kind: 'pick', go: L('Assistir', 'Watch'),
      draw: function (box) {
        box.style.backgroundImage = 'url(' + Data.image(p.backdrop, 'w780') + ')';
        el('div', 'shadeb', box);
        el('div', 'ptitle', box, p.title);
        if (app) el('div', 'applogo', box, app.title);
      },
      hero: function () {
        return {kicker: (app ? app.title + ' · ' : '') + (p.kind === 'tv' ? L('Série', 'Series') : L('Filme', 'Movie')),
          name: p.title, info: p.meta, desc: app ? L('OK abre no ' + app.title + '.', 'OK opens it on ' + app.title + '.') : '',
          art: {img: Data.image(p.backdrop, 'w1280')}};
      },
      run: function () { if (app) launcher(app.id, app.title)(); }
    };
  }

  function actionItem(symbol, name, run, desc, off) {
    return {
      kind: 'action', off: off,
      draw: function (box) { sym(symbol, box); el('div', 'aname', box, name); },
      hero: function () { return {kicker: L('Atalho', 'Shortcut'), name: name, desc: desc || '', art: {colors: ['#3A3A40', '#050506']}}; },
      run: run
    };
  }

  function liveTV() {
    for (var i = 0; i < inputs.length; i++) if (inputs[i].key === 'live') return inputs[i];
    return null;
  }

  function shortcuts() {
    var out = [], live = liveTV();
    if (live) out.push(actionItem('live_tv', tr('light|Live TV'), launcher(live.id, tr('Live TV')), L('A TV aberta e a antena.', 'Broadcast TV.')));
    out.push(actionItem('apps', L('Todos os apps', 'All apps'), function () { st.zone = Z.ROWS; selectTab(TABS.length - 1); }));
    out.push(actionItem('settings', tr('Home Settings'), openSettings, L('Idioma, cidade, consoles, protetor de tela e mais.', 'Language, city, consoles, screensaver and more.')));
    if (TV.canOpenSettings) out.push(actionItem('tv_settings', tr('TV Settings'), tvSettings));
    return out;
  }

  function inputItems() {
    var out = [];
    for (var i = 0; i < inputs.length; i++) {
      var x = inputs[i];
      out.push(actionItem(x.symbol, x.label || tr('Live TV'), launcher(x.id, x.label), '', !x.connected));
    }
    return out;
  }

  // MARK: - Consoles: the receiver's HDMI port

  /** The port a console comes in on: Home Settings, or the first HDMI with a device on (HDMI 1 when the TV doesn't say). */
  function consoleHdmi(c) {
    var v = Prefs.get('hdmi_' + c.key, 'auto');
    if (v !== 'auto') return +v;
    for (var i = 0; i < inputs.length; i++) {
      if (/^hdmi\d$/.test(inputs[i].key) && inputs[i].connected) return +inputs[i].key.slice(4);
    }
    return 1;
  }

  function playConsole(c) {
    var n = consoleHdmi(c), input = null;
    for (var i = 0; i < inputs.length; i++) if (inputs[i].key === 'hdmi' + n) input = inputs[i];
    if (!input) { toast(L('Esta TV não tem HDMI ' + n + '.', 'This TV has no HDMI ' + n + '.')); return; }
    toast(c.name + ' · HDMI ' + n);
    launcher(input.id, c.name)();
  }

  // MARK: - Hero and art

  var heroNow = null;

  var heroDir = 0;   // the carousel turned: 1 forward, -1 back (the text slides in from that side)

  /** The featured carousel shows while the focus is on the tab bar or on it; otherwise, the focused card. */
  function showingFeatured() { return featured.length > 0 && (st.zone === Z.TABS || st.zone === Z.HERO); }

  function renderHero() {
    var feat = showingFeatured(), it = feat ? featured[st.page % featured.length] : current();
    var h = it ? it.hero() : null, hero = $('hero'), text = hero.querySelector('.text');
    if (!h) { hero.style.visibility = 'hidden'; return; }
    hero.style.visibility = '';
    setClass(hero, 'featured', feat);
    var cta = hero.querySelector('.cta');
    setClass(cta, 'focus', st.zone === Z.HERO);
    var dots = hero.querySelector('.dots'), shown = dots.querySelectorAll('.dot');
    if (shown.length !== featured.length) {
      for (var d = 0; d < shown.length; d++) dots.removeChild(shown[d]);
      for (d = 0; d < featured.length; d++) el('span', 'dot', dots);
      shown = dots.querySelectorAll('.dot');
    }
    for (d = 0; d < shown.length; d++) setClass(shown[d], 'on', d === st.page % featured.length);
    dots.style.visibility = featured.length > 1 ? '' : 'hidden';
    var sig = [h.kicker, h.name, h.info, h.badge, h.desc].join('|');
    if (sig !== heroNow) {
      heroNow = sig;
      var parts = text.children;
      parts[0].textContent = h.kicker || '';
      parts[1].textContent = h.name || '';
      parts[1].style.fontSize = (h.name && h.name.length > 22 ? 72 : 92) + 'px';
      parts[2].innerHTML = '';
      if (h.badge) el('span', 'badge', parts[2], h.badge);
      if (h.info) parts[2].appendChild(document.createTextNode(h.info));
      parts[3].textContent = h.desc || '';
      var go = cta.querySelector('.go'), icon = cta.querySelector('.sym');
      go.textContent = it.go || L('Abrir', 'Open');
      icon.style.webkitMaskImage = icon.style.maskImage = 'url(symbols/play.png)';
      if (feat) {   // the button and the dots moved with the text's height
        frostMoved([hero.querySelector('.cta'), hero.querySelector('.dots')]);
        frostAll();
      }
      if (heroDir) {   // the carousel turned: the text slides in from the side it came from
        setClass(text, 'turn', false);
        setClass(text, 'back', false);
        void text.offsetWidth;
        setClass(text, heroDir > 0 ? 'turn' : 'back', true);
      }
    }
    heroDir = 0;
    artSoon(h.art);
  }

  /** Featured, for each tab: what the carousel at the top turns through. */
  var featured = [];

  function buildFeatured(tab) {
    var picks = Data.showcase().filter(function (p) { return p.backdrop && p.app && Data.appFor(p.app); });
    var out = [];
    if (tab === 'home') out = picks.slice(0, 3).map(pickItem).concat(CONSOLES.map(consoleItem), shelf.slice(0, 3).map(appItem));
    else if (tab === 'games') out = CONSOLES.map(consoleItem);
    else if (tab === 'streaming') out = picks.length ? picks.slice(0, 6).map(pickItem) : shelf.map(appItem);
    else if (tab === 'music') out = musicApps().slice(0, 4).map(appItem);
    return out.slice(0, 9);
  }

  /** The carousel turns by itself every few seconds while it shows and nobody presses anything. */
  var TURN_MS = 8000;
  setInterval(function () {
    if (saverOn || ambientOn || sheetOpen() || !showingFeatured() || featured.length < 2 || Date.now() - idleAt < TURN_MS) return;
    st.page = (st.page + 1) % featured.length;
    heroDir = 1;
    updateFocus();
  }, TURN_MS);

  // MARK: - Liquid glass: the art behind each glass piece, blurred

  // The art, drawn tiny: stretched back to the screen's size it is as soft as a heavy blur, and cheap on any TV.
  var FW = 96, FH = 54, frostGen = 0;
  var frostSrc = document.createElement('canvas');
  frostSrc.width = FW;
  frostSrc.height = FH;

  /** Where a node is on the 1920 × 1080 stage (the stage may be scaled to the window). */
  function stageXY(node) {
    var r = node.getBoundingClientRect(), s = stage.getBoundingClientRect(), k = s.width / 1920 || 1;
    return {x: (r.left - s.left) / k, y: (r.top - s.top) / k};
  }

  var frostURL = '';   // the art behind the glass, tiny, as an image (empty: the glass is plain)

  /**
   * One glass piece: the tiny art stretched over the stage as its background, shifted to the piece's place, so it
   * shows what's behind it, blurred. A background, not a canvas: a composited canvas under rounded corners costs
   * the GPU an extra pass every frame. Set again only when the art or the piece's place changed.
   */
  function frostInto(node) {
    // Where it is: measured once, and again only when it may have moved (frostMoved). Measuring forces a layout.
    var p = node.frostXY;
    if (!p) {
      if (!node.offsetWidth) return;
      p = node.frostXY = stageXY(node);
    }
    var f = node.firstChild;
    var stamp = frostGen + ':' + Math.round(p.x) + ',' + Math.round(p.y);
    if (f && f.className === 'frost' && node.getAttribute('data-frost') === stamp) return;
    node.setAttribute('data-frost', stamp);
    if (!f || f.className !== 'frost') {
      f = document.createElement('div');
      f.className = 'frost';
      node.insertBefore(f, node.firstChild);
    }
    f.style.backgroundImage = frostURL ? 'url(' + frostURL + ')' : 'none';
    f.style.backgroundPosition = Math.round(-p.x) + 'px ' + Math.round(-p.y) + 'px';
  }

  var lite = /\blite\b/.test(document.documentElement.className);   // tv.js: no glass blur there

  /** The pieces moved (the hero's text changed height, the font came): measured again at the next frostAll. */
  function frostMoved(nodes) {
    for (var i = 0; i < nodes.length; i++) if (nodes[i]) nodes[i].frostXY = null;
  }

  function frostAll() {
    if (lite) return;
    var nodes = [$('tabbar').querySelector('.pill'), $('status'), $('hero').querySelector('.cta'), $('hero').querySelector('.dots')];
    for (var i = 0; i < nodes.length; i++) if (nodes[i]) frostInto(nodes[i]);
    frostSheets();
  }

  /** The open sheet's box (built again on each change of its rows, so its canvas comes back here). */
  function frostSheets() {
    if (lite) return;
    var boxes = document.querySelectorAll('.sheet.open .box');
    for (var b = 0; b < boxes.length; b++) {
      setClass(boxes[b], 'glass', true);
      boxes[b].frostXY = {x: 560, y: 150};   // home.css puts every box there (measured, it'd be off while it opens)
      frostInto(boxes[b]);
    }
  }

  var frostRaw = document.createElement('canvas');
  frostRaw.width = FW;
  frostRaw.height = FH;

  /**
   * The glass takes the new art, shaded as the screen shows it: painted tiny, then more vivid (the filter on the tiny
   * copy only: on the whole art it cost the TV's CPU), then an image for the pieces' backgrounds.
   */
  function frostArt(art, img, mark) {
    if (lite) return;
    // painted small from the photo itself: copying the big canvas back from the GPU took the TV's CPU ~20 ms a turn
    paintArt(frostRaw, art, img, mark);
    var g = frostSrc.getContext('2d');
    g.clearRect(0, 0, FW, FH);
    if ('filter' in g) g.filter = 'saturate(1.8) brightness(1.1)';
    g.drawImage(frostRaw, 0, 0);
    if ('filter' in g) g.filter = 'none';
    try { frostURL = frostSrc.toDataURL('image/png'); } catch (e) { frostURL = ''; }   // a photo without CORS
    frostGen++;
    frostAll();
  }

  var artKey = null, artFront = 'artA', artTimer = 0, ART_FOLLOW_MS = 260;

  /** The art follows the focus once it rests: a quick run along a row fades once. */
  function artSoon(art) {
    clearTimeout(artTimer);
    artTimer = setTimeout(function () { showArt(art); }, artKey === null ? 0 : ART_FOLLOW_MS);
  }

  var marks = {};   // logo url -> its loaded image, for the art

  function showArt(art) {
    if (!art) return;
    var key = art.img || (art.colors.join(',') + art.logo);
    if (key === artKey) return;
    artKey = key;
    var next = artFront === 'artA' ? 'artB' : 'artA', canvas = $(next);
    function draw(img, mark) {
      if (artKey !== key) return;
      paintArt(canvas, art, img, mark);
      setClass(canvas, 'on', true);
      setClass($(artFront), 'on', false);
      artFront = next;
      frostArt(art, img, mark);
    }
    if (art.img) {
      var img = new Image(), tried = false;
      img.crossOrigin = 'anonymous';   // TMDB answers CORS: the canvas stays readable for the glass
      img.onload = function () { draw(img, null); };
      img.onerror = function () {   // a TV that can't load it that way: as before, without the glass's copy
        if (tried) return;
        tried = true;
        img = new Image();
        img.onload = function () { draw(img, null); };
        img.src = art.img;
      };
      img.src = art.img;
    } else if (art.logo) {
      var m = marks[art.logo];
      if (m && m.complete) { draw(null, m); return; }
      m = marks[art.logo] = new Image();
      // drawn once into a small canvas: an SVG rasterized again at every turn of the carousel was the slowest step
      m.onload = function () {
        var c = document.createElement('canvas');
        c.width = c.height = 520;   // the size it's drawn at on the full-size art
        try { c.getContext('2d').drawImage(m, 0, 0, 520, 520); } catch (e) {}
        c.complete = true;
        marks[art.logo] = c;
        draw(null, c);
      };
      m.onerror = function () { draw(null, null); };
      m.src = art.logo;
    } else draw(null, null);
  }

  /**
   * The art at half size, as the full-screen layers drew it: a photo (or the brand's colors and its logo, large and
   * quiet), then the shade at the left for the text and the darker floor under the rows.
   */
  function paintArt(canvas, art, img, mark) {
    var g = canvas.getContext('2d'), W = canvas.width, H = canvas.height, grad;
    g.fillStyle = '#000';
    g.fillRect(0, 0, W, H);
    if (img) {
      // cover, from the top (the faces in a backdrop are rarely at its bottom)
      var s = Math.max(W / img.naturalWidth, H / img.naturalHeight), w = img.naturalWidth * s, h = img.naturalHeight * s;
      try { g.drawImage(img, (W - w) / 2, 0, w, h); } catch (e) {}
    } else {
      var cx = 0.74 * W, cy = 0.26 * H;
      grad = g.createRadialGradient(cx, cy, 0, cx, cy, Math.sqrt(cx * cx + (H - cy) * (H - cy)));
      grad.addColorStop(0, art.colors[0]);
      grad.addColorStop(0.62, art.colors[1]);
      grad.addColorStop(1, '#000');
      g.fillStyle = grad;
      g.fillRect(0, 0, W, H);
      if (mark) {
        g.globalAlpha = 0.16;
        var k = W / 960;
        try { g.drawImage(mark, W - (75 + 260) * k, 75 * k, 260 * k, 260 * k); } catch (e) {}
        g.globalAlpha = 1;
      }
    }
    grad = g.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0.78)');
    grad.addColorStop(0.45, 'rgba(0,0,0,0.38)');
    grad.addColorStop(0.72, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    var top = H - H * 640 / 1080;
    grad = g.createLinearGradient(0, top, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.55, 'rgba(0,0,0,0.72)');
    grad.addColorStop(1, 'rgba(0,0,0,0.9)');
    g.fillStyle = grad;
    g.fillRect(0, top, W, H - top);
  }

  // MARK: - Status: the time and the weather

  function renderStatus() {
    var s = $('status'), d = new Date(), w = Prefs.weather() ? Data.weather : null, wx = s.querySelector('.wx');
    wx.innerHTML = '';
    if (w) {
      sym(Data.symbol(w.code, w.isDay), wx);
      wx.appendChild(document.createTextNode(Data.degrees(w.temp)));
    }
    s.querySelector('.time').textContent = formatDate('format|h:mm', d.getTime());
  }

  /** On the minute, so the clock never runs late. */
  function tickClock() {
    renderStatus();
    setTimeout(tickClock, 60000 - Date.now() % 60000 + 50);
  }

  function closeSheets() {
    setClass($('settings'), 'open', false);
    setClass($('shelfedit'), 'open', false);
    setClass($('langpick'), 'open', false);
    setClass($('about'), 'open', false);
    closeField('citypick');
    closeField('keypick');
    setClass($('citypick'), 'open', false);
    setClass($('keypick'), 'open', false);
    langHint = null;
    st.zone = lines.length ? Z.ROWS : Z.TABS;
    updateFocus();
  }

  // MARK: - Home Settings

  function settingRows() {
    var unit = Prefs.temperature();
    var auto = tr('Automatic'), picked = pickedLanguage();
    var rows = [
      {label: tr('Language'), value: picked === 'auto' ? auto : I18N.languageName(picked), opens: true, language: true,
        step: function (d) { if (d >= 0) openLanguages(); }}
    ];
    // Each console's port on the TV: the receiver's (Automatic: the first HDMI with a device on).
    for (var c = 0; c < CONSOLES.length; c++) {
      (function (con) {
        var v = String(Prefs.get('hdmi_' + con.key, 'auto'));
        rows.push({label: con.name, value: v === 'auto' ? auto + ' · HDMI ' + consoleHdmi(con) : 'HDMI ' + v,
          step: function (d) { cycle('hdmi_' + con.key, ['auto', '1', '2', '3', '4'], v, d); refreshRows(true); }});
      })(CONSOLES[c]);
    }
    rows.push(
      {label: tr('Temperature'), value: unit === 'C' ? '°C' : unit === 'F' ? '°F' : tr('unit|Automatic'),
        step: function (d) { cycle('temperature', ['auto', 'C', 'F'], unit, d); renderStatus(); }},
      {label: tr('Dim'), value: dimName(),
        step: function (d) { cycle('dim', ['off', 'low', 'medium', 'high', 'auto'], Prefs.dim(), d); applyDim(); }},
      {label: tr('Screensaver'), value: saverMode() === 'clock' ? tr('Clock') : tr('Photos'),
        step: function (d) { cycle('saver', ['photos', 'clock'], saverMode(), d); }},
      {label: tr('Picks per tab'), value: String(Prefs.cards()),
        step: function (d) { Prefs.set('cards', 3 + (Prefs.cards() - 3 + (d || 1) + 4) % 4); refreshRows(); }},
      {label: tr('Watch from the screensaver'), toggle: Prefs.saverWatch(),
        step: function () { Prefs.set('saverWatch', !Prefs.saverWatch()); }},
      {label: tr('Weather widget'), toggle: Prefs.weather(),
        step: function () { Prefs.set('weather', !Prefs.weather()); renderStatus(); }},
      {label: tr('City'), value: Prefs.city() || '—', opens: true, city: true,
        step: function (d) { if (d >= 0) openCities(); }}
    );
    rows.push({label: tr('TMDB key'), value: Prefs.tmdbKey().length >= 4 ? '•••• ' + Prefs.tmdbKey().slice(-4) : tr('Not set'), opens: true, tmdb: true,
      step: function (d) { if (d >= 0) openKey(); }});
    var sv = Data.services();
    if (sv.length) {
      var someOff = false;   // only the services this TV has count
      for (var q = 0; q < sv.length; q++) someOff = someOff || Prefs.serviceOff(sv[q].key);
      rows.push({label: tr('Picks from'), value: someOff ? tr('services|Some') : tr('services|All'),
        step: function () { Prefs.set('servicesOff', []); Data.settingsChanged(); }});
      for (var j = 0; j < sv.length; j++) {
        (function (key, name) {
          rows.push({label: name, toggle: !Prefs.serviceOff(key),
            step: function () { Prefs.setServiceOff(key, !Prefs.serviceOff(key)); Data.refresh(); Data.settingsChanged(); }});
        })(sv[j].key, sv[j].name);
      }
    }
    rows.push({label: L('Fileira de streaming', 'Streaming row'), value: '›', shelf: true, step: function (d) { if (d >= 0) openShelfEdit(); }});
    rows.push({label: tr('About this TV'), value: '›', about: true, step: function (d) { if (d >= 0) openAbout(); }});
    if (TV.canOpenSettings) rows.push({label: tr('TV Settings'), value: '›', step: function (d) { if (d >= 0) tvSettings(); }});
    return rows;
  }

  function cycle(name, values, current, d) {
    var i = values.indexOf(current);
    Prefs.set(name, values[(i + (d || 1) + values.length) % values.length]);
  }

  var rowsNow = [];

  function renderSettings() {
    var box = $('settings').firstChild;
    box.innerHTML = '';
    var title = el('div', 'title', box);
    sym('settings', title);
    title.appendChild(document.createTextNode(tr('Home Settings')));
    var list = el('div', 'list', box), holder = el('div', 'rows', list);
    rowsNow = settingRows();
    list.style.height = Math.min(rowsNow.length, 7) * 78 + 'px';
    for (var i = 0; i < rowsNow.length; i++) {
      var r = rowsNow[i], row = el('div', 'row' + (r.dim ? ' dim' : ''), holder, r.label);
      if (r.toggle !== undefined) setClass(el('div', 'toggle', row), 'on', r.toggle);
      else {
        var v = el('span', 'value', row);
        if (r.value === '›') v.textContent = '›';
        else if (r.opens) { v.appendChild(document.createTextNode(r.value)); el('span', 'chev', v, '›'); }
        else { el('span', 'chev', v, '‹'); v.appendChild(document.createTextNode(r.value)); el('span', 'chev', v, '›'); }
      }
      hover(row, Z.SETTINGS, i);
    }
    el('div', 'hint', box, tr('OK or the arrows change the value.'));
    updateFocus();
  }

  function openSettings() {
    st.zone = Z.SETTINGS;
    st.row = 0;
    renderSettings();
    setClass($('settings'), 'open', true);
    updateFocus();
  }

  // MARK: - Language: a list of every catalogue in its own name, as on Android (moving through it doesn't switch the app)

  var langHint = null;

  function languageChoices() {
    return ['auto'].concat(I18N.languages());
  }

  /** The language in use: "auto", or the catalogue the setting resolved to ("pt-BR" in config.properties is "pt"). */
  function pickedLanguage() {
    return Prefs.language() === 'auto' ? 'auto' : I18N.lang;
  }

  function renderLanguages() {
    var box = $('langpick').firstChild, choices = languageChoices(), current = choices.indexOf(pickedLanguage());
    box.innerHTML = '';
    el('div', 'title', box, tr('Language'));
    var list = el('div', 'list', box), holder = el('div', 'rows', list);
    list.style.height = Math.min(choices.length, 7) * 78 + 'px';
    for (var i = 0; i < choices.length; i++) {
      var row = el('div', 'row', holder, choices[i] === 'auto' ? tr('Automatic') : I18N.languageName(choices[i]));
      if (i === current) sym('check', el('span', 'value', row));
      hover(row, Z.LANG, i);
    }
    langHint = el('div', 'hint', box);
    updateFocus();
  }

  function openLanguages() {
    setClass($('settings'), 'open', false);
    st.zone = Z.LANG;
    st.lang = Math.max(0, languageChoices().indexOf(pickedLanguage()));
    renderLanguages();
    setClass($('langpick'), 'open', true);
    updateFocus();
  }

  /** OK: the language under the focus; Back: none. Either way, back to Home Settings, on the Language row. */
  function closeLanguages(pick) {
    setClass($('langpick'), 'open', false);
    langHint = null;
    var code = languageChoices()[st.lang];
    if (pick && code !== pickedLanguage()) {
      Prefs.set('language', code);
      I18N.set(Prefs.language());
      renderAll();
      Data.refresh();   // the picks' titles and genres come in the new language
    }
    openSettings();
    for (var i = 0; i < rowsNow.length; i++) if (rowsNow[i].language) st.row = i;
    updateFocus();
  }

  // MARK: - Text fields: typed with the TV's keyboard (the city, the TMDB key)

  /** A row with a text field; on the TV, the focus in it brings up the keyboard. */
  function textField(holder, zone, value, placeholder, label) {
    var field = el('input', '', el('div', 'row field', holder));
    field.type = 'text';
    field.value = value;
    field.placeholder = placeholder;
    field.setAttribute('aria-label', label);
    field.setAttribute('autocomplete', 'off');
    field.setAttribute('spellcheck', 'false');
    hover(field.parentNode, zone, 0);
    return field;
  }

  function fieldOf(sheet) { return $(sheet).querySelector('input'); }

  function typingIn(sheet) { var f = fieldOf(sheet); return !!f && document.activeElement === f; }

  /** Into the field: the TV shows its keyboard. */
  function openField(sheet) {
    var f = fieldOf(sheet);
    if (!f) return;
    f.focus();
    try { f.setSelectionRange(f.value.length, f.value.length); } catch (e) {}
  }

  function closeField(sheet) {
    if (typingIn(sheet)) fieldOf(sheet).blur();
  }

  // MARK: - City: typed with the TV's keyboard, found by Open-Meteo, as on Android (the weather is for its coordinates)

  var cityFound = [], cityStatus = '', cityTimer = 0, citySeq = 0;

  /** The field to type in, the Search row, then the places found. */
  function cityRows() { return 2 + cityFound.length; }

  function renderCities() {
    var box = $('citypick').firstChild, old = fieldOf('citypick'), typed = old ? old.value : '', inField = typingIn('citypick');
    box.innerHTML = '';
    el('div', 'title', box, tr('City'));
    var list = el('div', 'list', box), holder = el('div', 'rows', list);
    list.style.height = Math.min(cityRows(), 7) * 78 + 'px';
    textField(holder, Z.CITY, typed, tr("Type the city's name"), tr('City'));
    var search = el('div', 'row', holder, tr('Search'));
    sym('chevron_right', el('span', 'value', search));
    hover(search, Z.CITY, 1);
    for (var i = 0; i < cityFound.length; i++) {
      var row = el('div', 'row', holder, cityFound[i].label);
      hover(row, Z.CITY, 2 + i);
    }
    el('div', 'hint', box, cityStatus || tr('OK picks, Back cancels.'));
    if (inField) openField('citypick');   // a message that went away while typing: the keyboard stays
    updateFocus();
  }

  function openCities() {
    setClass($('settings'), 'open', false);
    st.zone = Z.CITY;
    st.city = 0;
    cityFound = [];
    cityStatus = '';
    $('citypick').firstChild.innerHTML = '';
    renderCities();
    setClass($('citypick'), 'open', true);
    openField('citypick');
  }

  function setCityStatus(text) {
    cityStatus = text;
    clearTimeout(cityTimer);
    // Clears only the hint: a new render would rebuild the field and interrupt the TV's keyboard while someone types.
    if (text && text !== tr('Searching…')) cityTimer = setTimeout(function () {
      cityStatus = '';
      var hint = st.zone === Z.CITY && $('citypick').querySelector('.hint');
      if (hint) hint.textContent = tr('OK picks, Back cancels.');
    }, 4000);
    if (st.zone === Z.CITY) renderCities();
  }

  function searchCity() {
    var f = fieldOf('citypick'), name = f ? f.value : '';
    closeField('citypick');
    if (!name.trim()) { st.city = 0; openField('citypick'); updateFocus(); return; }
    if (cityStatus === tr('Searching…')) return;
    setCityStatus(tr('Searching…'));
    var mine = ++citySeq;   // an answer for a sheet already closed (and opened again) is dropped
    Data.findCity(name, function (err, found) {
      if (mine !== citySeq) return;
      if (st.zone !== Z.CITY) { cityStatus = ''; return; }
      cityFound = found || [];
      if (cityFound.length) st.city = 2;   // on the first place found
      setCityStatus(err ? trf("Couldn't search now: {error}", {error: err.message}) : cityFound.length ? '' : tr('No city with that name.'));
    });
  }

  /** OK on a place: the weather moves there. Back (pick false): nothing changes. Either way, back on the City row. */
  function closeCities(pick) {
    var place = pick && cityFound[st.city - 2];
    closeField('citypick');
    setClass($('citypick'), 'open', false);
    cityFound = [];
    citySeq++;
    clearTimeout(cityTimer);
    cityStatus = '';
    if (place) {
      Prefs.setCity(place.city, place.lat, place.lon);
      Data.cityChanged();
    }
    openSettings();
    for (var i = 0; i < rowsNow.length; i++) if (rowsNow[i].city) st.row = i;
    updateFocus();
  }

  function activateCity() {
    if (st.city === 0) openField('citypick');
    else if (st.city === 1) searchCity();
    else closeCities(true);
  }

  // MARK: - TMDB key: typed on the TV, so builds without one (the releases) get the picks too; TMDB checks it first

  var keyStatus = '', keyWarn = false, keyTimer = 0, keySeq = 0, keyAsking = false;

  function keyRows() { return keyAsking ? 2 : Prefs.tmdbKeyOnTV() ? 3 : 2; }

  function keySteps() {
    return tr("The key brings the picks: what's trending on your streaming apps, with their photos on the screensaver.") + '\n'
      + tr('Free, and it takes two minutes:') + '\n1. ' + tr('Create an account at themoviedb.org.')
      + '\n2. ' + tr('Open Settings → API and request a developer key.');
  }

  function renderKey() {
    var box = $('keypick').firstChild, old = fieldOf('keypick'), typed = old ? old.value : '', inField = typingIn('keypick');
    box.innerHTML = '';
    el('div', 'title', box, keyAsking ? tr('Remove the TMDB key?') : tr('TMDB key'));
    var list = el('div', 'list', box), holder = el('div', 'rows', list);
    list.style.height = keyRows() * 78 + 'px';
    if (keyAsking) {
      hover(el('div', 'row', holder, tr('Cancel')), Z.KEY, 0);
      hover(el('div', 'row', holder, tr('Remove')), Z.KEY, 1);
      updateFocus();
      return;
    }
    var keyField = textField(holder, Z.KEY, typed, tr('API Read Access Token or API Key'), tr('TMDB key'));
    // A v3 key is lowercase hex: the TV's keyboard mustn't capitalize it (the city's field wants capitals).
    keyField.setAttribute('autocapitalize', 'none');
    keyField.setAttribute('autocorrect', 'off');
    var save = el('div', 'row', holder, tr('Save'));
    sym('chevron_right', el('span', 'value', save));
    hover(save, Z.KEY, 1);
    if (Prefs.tmdbKeyOnTV()) hover(el('div', 'row', holder, tr('Remove the key')), Z.KEY, 2);
    if (keyStatus) setClass(el('div', 'hint', box, keyStatus), 'warn', keyWarn);
    el('div', 'hint steps', box, keySteps());
    if (inField) openField('keypick');
    updateFocus();
  }

  function openKey() {
    setClass($('settings'), 'open', false);
    st.zone = Z.KEY;
    st.key = 0;
    keyStatus = '';
    keyAsking = false;
    $('keypick').firstChild.innerHTML = '';
    renderKey();
    setClass($('keypick'), 'open', true);
    openField('keypick');
  }

  function setKeyStatus(text, warn) {
    keyStatus = text;
    keyWarn = !!warn;
    clearTimeout(keyTimer);
    if (text && text !== tr('Checking the key with TMDB…')) keyTimer = setTimeout(function () {
      keyStatus = '';
      var line = st.zone === Z.KEY && $('keypick').querySelector('.hint:not(.steps)');
      if (line) line.parentNode.removeChild(line);
    }, 6000);
    if (st.zone === Z.KEY) renderKey();
  }

  function cleanKey(typed) {
    var key = typed.replace(/\s+/g, '');
    return /^[A-Za-z0-9._-]{16,1024}$/.test(key) ? key : '';
  }

  function saveKey() {
    var f = fieldOf('keypick'), typed = f ? f.value : '', key = cleanKey(typed);
    closeField('keypick');
    if (!typed.replace(/\s+/g, '')) { st.key = 0; openField('keypick'); updateFocus(); return; }
    if (keyStatus === tr('Checking the key with TMDB…')) return;
    if (!key) { setKeyStatus(tr("That doesn't look like a TMDB key."), true); return; }
    setKeyStatus(tr('Checking the key with TMDB…'));
    var mine = ++keySeq;   // an answer for a sheet already closed is dropped
    Data.checkKey(key, function (err) {
      if (mine !== keySeq || st.zone !== Z.KEY) return;
      if (err) { setKeyStatus(err.rejected ? tr('TMDB refused this key.') : trf("Couldn't reach TMDB: {error}", {error: err.message}), true); return; }
      Prefs.set('tmdbKey', key);
      if (fieldOf('keypick')) fieldOf('keypick').value = '';
      Data.keyChanged();
      setKeyStatus(tr('Saved. The picks arrive in a moment.'));
    });
  }

  /** Back to config.properties' key (none in the releases): the picks go. */
  function removeKey() {
    Prefs.set('tmdbKey', undefined);   // left out of the saved settings
    closeKey();
    Data.keyChanged();
  }

  /** Back on the TMDB key row of Home Settings. */
  function closeKey() {
    closeField('keypick');
    setClass($('keypick'), 'open', false);
    keySeq++;
    clearTimeout(keyTimer);
    keyStatus = '';
    keyAsking = false;
    var f = fieldOf('keypick');
    if (f) f.value = '';
    openSettings();
    for (var i = 0; i < rowsNow.length; i++) if (rowsNow[i].tmdb) st.row = i;
    updateFocus();
  }

  function askRemoveKey(on) {
    keyAsking = on;
    keyStatus = '';
    clearTimeout(keyTimer);
    st.key = on ? 0 : 2;
    renderKey();
  }

  function activateKey() {
    if (keyAsking) { if (st.key === 1) removeKey(); else askRemoveKey(false); }
    else if (st.key === 0) openField('keypick');
    else if (st.key === 1) saveKey();
    else askRemoveKey(true);
  }

  // MARK: - About this TV: what to quote when reporting a problem, without LG's or Samsung's slow menus

  function renderAbout(info) {
    var box = $('about').firstChild;
    box.innerHTML = '';
    el('div', 'title', box, tr('About this TV'));
    var list = el('div', 'list', box), holder = el('div', 'rows', list);
    var rows = [
      [tr('Model'), info && info.model], [tr('Firmware'), info && info.firmware], [tr('System'), info && info.system],
      [tr('IP address'), info && info.ip], [tr('Time zone'), TV.zone()], ['Free My TV', info && info.version],
      // How this TV draws the page: what decides the lite mode (tv.js), to quote when it's slow.
      [L('Tela', 'Screen'), window.innerWidth + '×' + window.innerHeight + ' @' + (window.devicePixelRatio || 1) + 'x'],
      [L('Memória', 'Memory'), navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '—'],
      [L('Modo leve', 'Lite mode'), /\bstill\b/.test(document.documentElement.className) ? L('Sem animações', 'No animations')
        : lite ? L('Ligado', 'On') : L('Desligado', 'Off')]
    ];
    for (var i = 0; i < rows.length; i++) {
      var row = el('div', 'row', holder), label = el('span', '', row, rows[i][0]);
      fitValue(row, label, el('span', 'value', row, info ? rows[i][1] || tr('Unavailable') : '…'));
    }
    el('div', 'hint', box, tr('Back closes.'));
  }

  /** A long value (Samsung's firmware) gets smaller instead of running over its label, and ends in "…" if even the smallest size is too wide. */
  function fitValue(row, label, value) {
    var room = row.clientWidth - label.offsetWidth - 2 * 24 - 24;   // the row's padding, and a gap after the label
    for (var size = 30; value.offsetWidth > room && size > 18; size -= 2) value.style.fontSize = size - 2 + 'px';
    if (value.offsetWidth > room) { value.style.maxWidth = room + 'px'; setClass(value, 'cut', true); }
  }

  function openAbout() {
    setClass($('settings'), 'open', false);
    st.zone = Z.ABOUT;
    renderAbout(null);
    setClass($('about'), 'open', true);
    updateFocus();
    TV.about(function (info) { if (st.zone === Z.ABOUT) renderAbout(info); });
  }

  function closeAbout() {
    setClass($('about'), 'open', false);
    openSettings();
    for (var i = 0; i < rowsNow.length; i++) if (rowsNow[i].about) st.row = i;
    updateFocus();
  }

  // MARK: - Shelf editor: which apps, in what order

  function editList() {
    var ids = shelf.map(function (a) { return a.id; });
    return {ids: ids, rows: apps.slice().sort(function (a, b) {
      var ia = ids.indexOf(a.id), ib = ids.indexOf(b.id);
      if (ia >= 0 || ib >= 0) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1;
    })};
  }

  function renderShelfEdit() {
    var box = $('shelfedit').firstChild, e = editList();
    box.innerHTML = '';
    var title = el('div', 'title', box);
    sym('apps', title);
    title.appendChild(document.createTextNode(L('Fileira de streaming', 'Streaming row')));
    var list = el('div', 'list', box), holder = el('div', 'rows', list);
    list.style.height = Math.min(e.rows.length, 7) * 78 + 'px';
    for (var i = 0; i < e.rows.length; i++) {
      var a = e.rows[i], at = e.ids.indexOf(a.id), row = el('div', 'row', holder, a.title);
      var place = el('span', 'value', row, at >= 0 ? '#' + (at + 1) : tr('shelf|Off'));
      if (at >= 0) sym('check', place).style.marginLeft = '16px';   // on the shelf: a check, as in the pickers
      hover(row, Z.EDIT, i);
    }
    el('div', 'hint', box, tr('OK adds or removes an app. ← → change the order.'));
    updateFocus();
  }

  function openShelfEdit() {
    setClass($('settings'), 'open', false);
    st.zone = Z.EDIT;
    st.edit = 0;
    renderShelfEdit();
    setClass($('shelfedit'), 'open', true);
    updateFocus();
  }

  function editShelf(dx) {
    var e = editList(), app = e.rows[st.edit];
    if (!app) return;
    var ids = e.ids.slice(), at = ids.indexOf(app.id);
    if (dx === 0) {
      if (at >= 0) ids.splice(at, 1);
      else ids.push(app.id);
    } else {
      if (at < 0) return;
      var to = Math.max(0, Math.min(ids.length - 1, at + dx));
      ids.splice(at, 1);
      ids.splice(to, 0, app.id);
    }
    Prefs.set('shelf', ids);
    pickShelf();
    refreshRows(true);
    var again = editList();
    for (var i = 0; i < again.rows.length; i++) if (again.rows[i].id === app.id) st.edit = i;
    renderShelfEdit();
  }

  // MARK: - Opening things

  function launcher(id, name) {
    return function () {
      TV.launch(id, null, function (ok) {
        if (!ok) toast(trf("Couldn't open {app}.", {app: name || id}));
      });
    };
  }

  function tvSettings() {
    TV.settings(function (ok) {
      if (!ok) toast(tr("Couldn't open TV Settings"));
    });
  }

  function activate() {
    switch (st.zone) {
      case Z.TABS:
        selectTabNow();
        if (st.tabFocus === TABS.length) openSettings();
        else if (featured.length) { st.zone = Z.HERO; updateFocus(); }
        else if (lines.length) { st.zone = Z.ROWS; st.line = 0; updateFocus(); }
        return;
      case Z.HERO:
        if (featured[st.page]) featured[st.page].run();
        return;
      case Z.ROWS:
        var it = current();
        if (it) it.run();
        return;
      case Z.SETTINGS:
        if (rowsNow[st.row]) { rowsNow[st.row].step(1); if (st.zone === Z.SETTINGS) renderSettings(); }
        return;
      case Z.EDIT:
        editShelf(0);
        return;
      case Z.LANG:
        closeLanguages(true);
        return;
      case Z.CITY:
        activateCity();
        return;
      case Z.KEY:
        activateKey();
        return;
      case Z.ABOUT:
        closeAbout();
        return;
    }
  }

  function move(dx, dy) {
    switch (st.zone) {
      case Z.TABS:
        if (dx) {
          st.tabFocus = Math.max(0, Math.min(TABS.length, st.tabFocus + dx));
          if (st.tabFocus < TABS.length) selectTabSoon(st.tabFocus);
          else { clearTimeout(tabTimer); tabTimer = 0; }   // on the gear: the tab shown stays
        } else if (dy > 0) selectTabNow();
        if (dy > 0 && st.tabFocus < TABS.length && featured.length) {
          st.zone = Z.HERO;
        } else if (dy > 0 && lines.length) {
          st.zone = Z.ROWS;
          st.line = 0;
        }
        break;
      case Z.HERO:
        if (dx) { st.page = (st.page + dx + featured.length) % featured.length; heroDir = dx; }
        else if (dy < 0) { st.zone = Z.TABS; st.tabFocus = st.tab; }
        else if (dy > 0 && lines.length) { st.zone = Z.ROWS; st.line = 0; }
        break;
      case Z.ROWS:
        var line = lines[st.line];
        if (dx && line) {
          var col = Math.max(0, Math.min(line.items.length - 1, st.col + dx));
          if (col === st.col) bump(dx);
          st.col = col;
        } else if (dy < 0) {
          if (st.line > 0) moveLine(-1);
          else if (featured.length) st.zone = Z.HERO;
          else { st.zone = Z.TABS; st.tabFocus = st.tab; }
        } else if (dy > 0) {
          if (st.line < lines.length - 1) moveLine(1);
          else bump(0);
        }
        break;
      case Z.SETTINGS:
        if (dy) st.row = Math.max(0, Math.min(rowsNow.length - 1, st.row + dy));
        else if (dx && rowsNow[st.row]) {
          var r = rowsNow[st.row];
          if (r.value !== '›') { r.step(dx); if (st.zone === Z.SETTINGS) renderSettings(); }
        }
        break;
      case Z.EDIT:
        if (dy) st.edit = Math.max(0, Math.min(apps.length - 1, st.edit + dy));
        else if (dx) editShelf(dx);
        break;
      case Z.LANG:
        if (dy) st.lang = Math.max(0, Math.min(languageChoices().length - 1, st.lang + dy));
        break;
      case Z.CITY:
        if (dy) st.city = Math.max(0, Math.min(cityRows() - 1, st.city + dy));
        break;
      case Z.KEY:
        if (dy) st.key = Math.max(0, Math.min(keyRows() - 1, st.key + dy));
        break;
    }
    updateFocus();
  }

  /** Nowhere to go that way: the focused card leans toward it and comes back. */
  function bump(dx) {
    var node = $('rows').children[st.line], item = node && node.lastChild.children[st.col];
    if (!item || !dx) return;
    setClass(item, 'bump-r', false);
    setClass(item, 'bump-l', false);
    void item.offsetWidth;
    setClass(item, dx > 0 ? 'bump-r' : 'bump-l', true);
    setTimeout(function () { setClass(item, 'bump-r', false); setClass(item, 'bump-l', false); }, 400);
  }

  /** Back, as on Apple TV: to the first row, then to the tab bar, then to Home, then out. */
  function back() {
    if (st.zone === Z.EDIT) {
      setClass($('shelfedit'), 'open', false);
      openSettings();
      for (var i = 0; i < rowsNow.length; i++) if (rowsNow[i].shelf) st.row = i;   // back on the Shelf row, whatever follows it
      updateFocus();
      return;
    }
    if (st.zone === Z.LANG) { closeLanguages(false); return; }
    if (st.zone === Z.CITY) { closeCities(false); return; }
    if (st.zone === Z.KEY) { if (keyAsking) askRemoveKey(false); else closeKey(); return; }
    if (st.zone === Z.ABOUT) { closeAbout(); return; }
    if (sheetOpen()) { closeSheets(); return; }
    if (st.zone === Z.ROWS && st.line > 0) { st.line = 0; st.col = 0; updateFocus(); return; }
    if (st.zone === Z.ROWS || st.zone === Z.HERO) { st.zone = Z.TABS; st.tabFocus = st.tab; updateFocus(); return; }
    if (st.tab !== 0 || st.tabFocus !== 0) { st.tabFocus = 0; selectTab(0); return; }
    TV.back();
  }

  /** The pointer focuses what it's over (the Magic Remote, or a mouse when previewing). */
  function hover(node, zone, index) {
    node.onmouseover = function () {
      if (saverOn || sheetOpen() !== isSheet(zone)) return;
      st.zone = zone;
      if (zone === Z.TABS) { st.tabFocus = index; if (index < TABS.length) selectTabSoon(index); }
      else if (zone === Z.HERO && !featured.length) return;
      else if (zone === Z.ROWS) { st.line = Math.floor(index / 1000); st.col = index % 1000; }
      else if (zone === Z.SETTINGS) st.row = index;
      else if (zone === Z.EDIT) st.edit = index;
      else if (zone === Z.LANG) st.lang = index;
      else if (zone === Z.CITY) st.city = index;
      else if (zone === Z.KEY) st.key = index;
      updateFocus();
    };
    node.onclick = function () { node.onmouseover(); activate(); };
  }

  // MARK: - Toast

  var toastTimer = 0;
  function toast(text) {
    var t = $('toast');
    t.textContent = text;
    setClass(t, 'on', true);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { setClass(t, 'on', false); }, 6000);
  }

  // MARK: - Clock screensaver, photos screensaver

  var saverOn = false, idleAt = Date.now(), saverIndex = 0, saverTimer = 0, saverPick = null, SAVER_AFTER = 5 * 60000;

  /** "photos" (the picks' photos, as it always was) or "clock": what the screen shows when nobody touches it. */
  function saverMode() { return Prefs.saver(); }

  /** Dim, as the person picked it: off, low, medium, high, or automatic (medium from 22:00 to 07:00). */
  function dimName() {
    var v = Prefs.dim();
    return v === 'low' ? tr('dim|Low') : v === 'medium' ? tr('dim|Medium') : v === 'high' ? tr('dim|High')
      : v === 'auto' ? tr('Automatic') : tr('Off');
  }

  function dimLevel() {
    var v = Prefs.dim();
    if (v === 'auto') { var h = new Date().getHours(); return h >= 22 || h < 7 ? 2 : 0; }
    return v === 'low' ? 1 : v === 'medium' ? 2 : v === 'high' ? 3 : 0;
  }

  /** The panel's brightness is a private API: this is a black layer over the picture instead. */
  function applyDim() {
    var level = dimLevel();
    $('dim').className = 'layer' + (level ? ' d' + level : '');
  }

  /** The screensaver's photos: picks with an app on the TV. */
  function saverPhotos() {
    return Data.showcase().filter(function (p) { return p.backdrop && Data.usable(p.app); });
  }

  function showSaver() {
    var photos = saverPhotos();
    saverOn = true;
    saverPick = null;
    var s = $('saver');
    s.innerHTML = '';
    var a = el('div', 'photo', s), b = el('div', 'photo', s);
    el('div', 'shade', s);
    var clock = el('div', 'clock', s);
    el('div', 'time', clock);
    el('div', 'date', clock);
    el('div', 'title', clock);
    var hint = el('div', 'hint', clock);
    var front = a;
    function next() {
      if (!saverOn) return;
      var p = photos.length ? photos[saverIndex++ % photos.length] : null;
      var back = front === a ? b : a;
      if (p) {
        back.style.backgroundImage = 'url(' + Data.image(p.backdrop, 'original') + ')';
        back.style.webkitTransform = back.style.transform = 'scale(1.0)';
        clock.children[2].textContent = p.title;
        saverPick = p;
        // With Watch from the screensaver on, OK opens this title's app (any other key only closes).
        var app = Prefs.saverWatch() && Data.appFor(p.app);
        hint.textContent = app ? trf('Press OK to watch on {app} · any other button to close', {app: app.title}) : '';
        setTimeout(function () {
          setClass(back, 'on', true);
          setClass(front, 'on', false);
          back.style.webkitTransform = back.style.transform = 'scale(1.08) translateX(-1.5%)';
          front = back;
        }, 60);
      }
      tickSaverClock(clock);
      saverTimer = setTimeout(next, 12000);
    }
    setClass(s, 'on', true);
    next();
  }

  function tickSaverClock(clock) {
    var d = new Date();
    clock.firstChild.textContent = formatDate('format|h:mm', d.getTime());
    clock.children[1].textContent = formatDate('format|EEEE, MMMM d', d.getTime());
  }

  function hideSaver() {
    saverOn = false;
    clearTimeout(saverTimer);
    setClass($('saver'), 'on', false);
  }

  // MARK: - The clock screensaver: a clock, the date and the weather, drifting slowly for OLED panels

  var ambientOn = false, ambientTimer = 0;

  function showAmbient() {
    if (ambientOn) return;
    var a = $('ambient');
    a.innerHTML = '';
    var shift = el('div', 'shift', a);
    el('div', 'clock', shift);
    el('div', 'date', shift);
    var side = el('div', 'side', shift);
    el('div', 'temp', side);
    el('div', 'cond', side);
    ambientOn = true;
    setClass(a, 'on', true);
    ambientTimer = setInterval(tickAmbient, 30000);
    tickAmbient();
  }

  function tickAmbient() {
    if (!ambientOn) return;
    var a = $('ambient'), d = new Date(), w = Prefs.weather() ? Data.weather : null;
    a.querySelector('.clock').textContent = formatDate('format|h:mm', d.getTime());
    a.querySelector('.date').textContent = formatDate('format|EEEE, MMMM d', d.getTime());
    // The forecast as it is now (a new one comes every 30 minutes), and only with the weather card on, as on Android.
    a.querySelector('.temp').textContent = w ? Data.degrees(w.temp) : '';
    a.querySelector('.cond').textContent = w ? Data.condition(w.code, w.isDay) : '';
    // A clock that never moves burns into an OLED: the drift of Android's clock without photos (40 × 26 px, 10 minutes).
    var phase = 2 * Math.PI * (d.getTime() / 1000 % 600) / 600, shift = a.querySelector('.shift');
    shift.style.webkitTransform = shift.style.transform =
      'translate(' + Math.round(40 * Math.sin(phase)) + 'px,' + Math.round(26 * Math.sin(2 * phase + 0.7)) + 'px)';
  }

  function hideAmbient() {
    ambientOn = false;
    clearInterval(ambientTimer);
    setClass($('ambient'), 'on', false);
  }

  function poke(ok) {
    idleAt = Date.now();
    if (ambientOn) { hideAmbient(); return true; }
    if (!saverOn) return false;
    var app = ok && saverPick && Prefs.saverWatch() && Data.appFor(saverPick.app);
    hideSaver();
    if (app) launcher(app.id, app.title)();
    return true;
  }

  // MARK: - Keys

  document.addEventListener('keydown', function (e) {
    var k = e.keyCode;
    if (poke(k === TV.keys.ok)) { e.preventDefault(); return; }   // the first press only wakes the screen (or OK watches)
    if (typing(k)) return;
    if (k === TV.keys.left) move(-1, 0);
    else if (k === TV.keys.right) move(1, 0);
    else if (k === TV.keys.up) move(0, -1);
    else if (k === TV.keys.down) move(0, 1);
    else if (k === TV.keys.ok) activate();
    else if (k === TV.keys.back || k === 27 || k === 8) back();
    else return;
    e.preventDefault();
  });
  document.addEventListener('mousemove', function () { poke(); });

  /**
   * In a text field, the keys type (← → move in the text, Delete erases). OK or the keyboard's Done searches (or saves); Back,
   * its Cancel or ↑ ↓ leave the field. Samsung's keyboard sends Done as 65376 and Cancel as 65385. True: handled here.
   */
  function typing(k) {
    var sheet = st.zone === Z.CITY ? 'citypick' : st.zone === Z.KEY ? 'keypick' : '';
    if (!sheet || !typingIn(sheet)) return false;
    if (k === TV.keys.ok || k === 65376) { if (st.zone === Z.CITY) searchCity(); else saveKey(); }
    else if (k === TV.keys.back || k === 27 || k === 65385) { closeField(sheet); updateFocus(); }
    else if (k === TV.keys.up || k === TV.keys.down) { closeField(sheet); move(0, k === TV.keys.up ? -1 : 1); }
    return true;   // anything else types into the field
  }

  // MARK: - Start

  /** The rows again, when what they show changed (the picks came, an app was installed), keeping the focus. */
  var shown = '';
  function refreshRows(force) {
    var sig = apps.length + ':' + shelf.length + ':' + inputs.length + ':' + Data.showcase().map(function (p) { return p.id + (p.app || ''); }).join(',');
    if (!force && sig === shown) return;
    shown = sig;
    var line = st.line, col = st.col;
    renderRows();
    st.line = Math.max(0, Math.min(line, lines.length - 1));
    st.col = lines.length ? Math.max(0, Math.min(col, lines[st.line].items.length - 1)) : 0;
    updateFocus();
  }

  function renderAll() {
    renderTabs();
    refreshRows(true);
    renderStatus();
    if (st.zone === Z.SETTINGS) renderSettings();
    updateFocus();
  }

  /** hide_apps in config.properties: left out of the rows and the picks, by id or name (part of it). */
  var HIDE = (CONFIG.hideApps || []).map(function (s) { return s.toLowerCase(); });
  function hidden(app) {
    var id = (app.id || '').toLowerCase(), title = (app.title || '').toLowerCase();
    for (var i = 0; i < HIDE.length; i++) if (id.indexOf(HIDE[i]) >= 0 || title.indexOf(HIDE[i]) >= 0) return true;
    return false;
  }

  function loadApps(done) {
    TV.apps(function (list) {
      apps = list.filter(function (a) { return !hidden(a); });
      Data.setApps(apps);
      pickShelf();
      TV.inputs(function (list2) {
        inputs = list2;
        if (done) done();
      });
    });
  }

  /** Back to the home screen (the app was opened again): Home, its first row, everything closed. */
  function reset() {
    hideSaver();
    hideAmbient();
    closeSheets();
    st.zone = Z.ROWS;
    st.tabFocus = 0;
    selectTab(0, true);
    startOnFeatured();
  }

  /** As the Apple TV app opens: on the featured carousel, when there is one. */
  function startOnFeatured() {
    if (st.zone !== Z.ROWS || st.line !== 0 || !featured.length) return;
    st.zone = Z.HERO;
    updateFocus();
  }

  Data.onChange(function () {
    refreshRows();
    renderStatus();
  });

  function reopened() {
    // LG: with handlesRelaunch the app has to come to the front itself, or opening it again while it runs shows nothing.
    if (window.PalmSystem && window.PalmSystem.activate) window.PalmSystem.activate();
    reset();
    loadApps(function () { refreshRows(true); Data.refresh(); });
  }

  window.addEventListener('resize', fit);
  // The font came after the first layout: the tabs' widths changed, so the lens and the glass measure again.
  window.addEventListener('load', function () {
    lensAt = null;
    lensTab = -1;
    frostMoved([$('tabbar').querySelector('.pill'), $('status'), $('hero').querySelector('.cta'), $('hero').querySelector('.dots')]);
    updateFocus();
    frostAll();
  });
  document.addEventListener('webOSRelaunch', reopened);   // LG: opened again while running
  window.addEventListener('appcontrol', reopened);        // Samsung: the same
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { hideSaver(); hideAmbient(); return; }
    idleAt = Date.now();
    loadApps(function () { refreshRows(); Data.refresh(); });
  });

  I18N.set(Prefs.language());
  // LG's screensaver waits only when ours will show: not under a sheet (ours waits there), and not without photos.
  TV.holdScreenSaver(function () { return !sheetOpen() && (saverMode() === 'clock' || saverPhotos().length > 0); });
  fit();
  renderTabs();
  hover($('hero').querySelector('.cta'), Z.HERO, 0);
  applyDim();
  tickClock();
  loadApps(function () {
    renderAll();
    startOnFeatured();
    Data.refresh();
  });
  setInterval(function () {
    Data.refresh();
    applyDim();   // automatic: medium from 22:00, off again at 07:00
    if (!saverOn && !ambientOn && !sheetOpen() && Date.now() - idleAt > SAVER_AFTER) {
      if (saverMode() === 'clock') showAmbient(); else showSaver();
    }
    if (saverOn) tickSaverClock($('saver').querySelector('.clock'));
    if (ambientOn) tickAmbient();
  }, 30000);

  // For the browser preview and tests.
  window.FreeMyTV = {state: st, move: move, activate: activate, back: back, showSaver: showSaver, hideSaver: hideSaver, toast: toast,
    showAmbient: showAmbient, hideAmbient: hideAmbient, applyDim: applyDim};
})();
