// Utility: DOM helpers
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

// Elements
const loginScreen = $("#login-screen");
const mainScreen = $("#main-screen");
const loginYesBtn = $("#login-yes");
const loginNoBtn = $("#login-no");
const loginError = $("#login-error");
const valentineYesBtn = $("#valentine-yes");
const valentineNoBtn = $("#valentine-no");
const loveMeterFill = document.querySelector(".love-meter-fill");
const loveMessage = $("#love-message");
const celebrationLayer = $("#celebration-layer");
const valentineGif = $("#valentine-gif");
const wishlistForm = $("#wishlist-form");
const wishlistInput = $("#wishlist-input");
const wishlistList = $("#wishlist-list");
const floatingHeartsContainer = document.querySelector(".floating-hearts");
const rainingHeartsContainer = document.querySelector("#raining-hearts");
const valentineStep = document.querySelector("#valentine-step");
const giftStep = document.querySelector("#gift-step");

// Local storage key (fallback when Firebase not configured)
const WISHLIST_KEY = "jessica_valentine_wishlist";

// -------------------------------
// List ID for shared wishlist (same link = same list for you and your gf)
// -------------------------------
function getListId() {
  const params = new URLSearchParams(window.location.search);
  let id = params.get("list");
  if (!id || !/^[a-zA-Z0-9_-]{10,}$/.test(id)) {
    id = "wl_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    const url = new URL(window.location.href);
    url.searchParams.set("list", id);
    window.history.replaceState({}, "", url.toString());
  }
  return id;
}

const LIST_ID = getListId();

// Firebase / Firestore (optional)
let db = null;
let itemsColRef = null;

function initFirestore() {
  const config = typeof window !== "undefined" && window.FIREBASE_CONFIG;
  if (!config || !config.apiKey || config.apiKey === "YOUR_API_KEY") return false;
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    db = firebase.firestore();
    itemsColRef = db.collection("wishlists").doc(LIST_ID).collection("items");
    return true;
  } catch (e) {
    console.warn("Firebase init failed:", e);
    return false;
  }
}

const useFirestore = initFirestore();

// -------------------------------
// View transitions
// -------------------------------

function showMainScreen() {
  loginScreen.classList.remove("active");
  mainScreen.classList.add("active");
}

function shakeCard(cardEl) {
  cardEl.classList.remove("shake");
  // Force reflow to restart animation
  void cardEl.offsetWidth;
  cardEl.classList.add("shake");
}

// -------------------------------
// Login interactions
// -------------------------------

loginYesBtn?.addEventListener("click", () => {
  loginError.textContent = "";
  // Small success animation before showing main screen
  loginYesBtn.classList.add("pulse-once");
  setTimeout(() => {
    showMainScreen();
  }, 320);
});

loginNoBtn?.addEventListener("click", () => {
  loginError.textContent = "Wrong answer 😏 Try again.";
  const card = loginNoBtn.closest(".glass-card");
  if (card) {
    shakeCard(card);
  }
});

// -------------------------------
// Valentine "YES" celebration
// -------------------------------

function triggerLoveMeter() {
  loveMeterFill.style.maxWidth = "100%";
}

function showLoveMessage() {
  loveMessage.textContent = "";
}

function spawnHeartBurst(x, y, count = 18) {
  const rect = celebrationLayer.getBoundingClientRect();
  const originX = x - rect.left;
  const originY = y - rect.top;

  for (let i = 0; i < count; i++) {
    const heart = document.createElement("div");
    heart.className = "celebration-heart";
    heart.textContent = "❤";
    const angle = (Math.PI * 2 * i) / count;
    const radius = 60 + Math.random() * 40;
    heart.style.setProperty("--x", `${Math.cos(angle) * radius + originX}px`);
    heart.style.setProperty("--y", `${Math.sin(angle) * radius + originY}px`);

    celebrationLayer.appendChild(heart);
    heart.addEventListener("animationend", () => {
      heart.remove();
    });
  }
}

const HEART_CHARS = ["❤", "💕", "💖", "♥"];
let rainingHeartsInterval = null;

function spawnOneRainingHeart() {
  if (!rainingHeartsContainer) return;
  const heart = document.createElement("div");
  heart.className = "raining-heart";
  heart.textContent = HEART_CHARS[Math.floor(Math.random() * HEART_CHARS.length)];
  heart.style.setProperty("--rx", `${Math.random() * 100}vw`);
  heart.style.animationDuration = `${1.2 + Math.random() * 0.8}s`;
  heart.style.opacity = String(0.6 + Math.random() * 0.4);
  rainingHeartsContainer.appendChild(heart);
  heart.addEventListener("animationend", () => heart.remove());
}

function startRainingHearts() {
  if (!rainingHeartsContainer) return;
  rainingHeartsContainer.classList.add("active");
  rainingHeartsContainer.setAttribute("aria-hidden", "false");

  // Initial burst
  for (let i = 0; i < 40; i++) {
    setTimeout(spawnOneRainingHeart, (i / 40) * 600);
  }

  // Keep raining continuously
  if (rainingHeartsInterval) clearInterval(rainingHeartsInterval);
  rainingHeartsInterval = setInterval(spawnOneRainingHeart, 180);
}

valentineYesBtn?.addEventListener("click", (event) => {
  triggerLoveMeter();
  showLoveMessage();

  const rect = valentineYesBtn.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  spawnHeartBurst(centerX, centerY);
  startRainingHearts();

  if (valentineGif) {
    valentineGif.classList.add("visible");
  }

  // After a short celebration, go to gift section (next page)
  setTimeout(() => {
    if (valentineStep) valentineStep.classList.remove("active");
    if (giftStep) giftStep.classList.add("active");
  }, 1600);
});

// -------------------------------
// Runaway NO button behavior
// -------------------------------

if (valentineNoBtn) {
  valentineNoBtn.classList.add("runaway-moving");

  const moveAway = (e) => {
    const btn = valentineNoBtn;
    const rect = btn.getBoundingClientRect();
    const area = btn.closest(".card-actions") ?? btn.parentElement ?? document.body;
    const bounds = area.getBoundingClientRect();

    const offsetX = (Math.random() - 0.5) * 140;
    const offsetY = (Math.random() - 0.5) * 60;

    let newX = (parseFloat(btn.dataset.tx) || 0) + offsetX;
    let newY = (parseFloat(btn.dataset.ty) || 0) + offsetY;

    // Gentle constraints to keep the button inside the card area
    const maxX = (bounds.width - rect.width) / 2 - 10;
    const maxY = (bounds.height - rect.height) / 2 - 10;
    newX = Math.max(-maxX, Math.min(maxX, newX));
    newY = Math.max(-maxY, Math.min(maxY, newY));

    btn.dataset.tx = String(newX);
    btn.dataset.ty = String(newY);
    btn.style.transform = `translate(${newX}px, ${newY}px)`;
  };

  valentineNoBtn.addEventListener("pointerenter", moveAway);
  // Fallback for slower devices / keyboard focus
  valentineNoBtn.addEventListener("focus", moveAway);
}

// -------------------------------
// Wishlist: Firestore (real-time) or localStorage (fallback)
// -------------------------------

function loadWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWishlist(items) {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  } catch {
    // ignore quota issues
  }
}

function renderWishlistItem(id, text) {
  const li = document.createElement("li");
  li.className = "wishlist-item";
  if (id) li.dataset.docId = id;

  const label = document.createElement("span");
  label.className = "wishlist-label";

  const heart = document.createElement("span");
  heart.className = "wishlist-heart";
  heart.textContent = "❤";

  const spanText = document.createElement("span");
  spanText.textContent = text;

  label.appendChild(heart);
  label.appendChild(spanText);

  const removeBtn = document.createElement("button");
  removeBtn.className = "wishlist-remove";
  removeBtn.type = "button";
  removeBtn.textContent = "×";
  removeBtn.setAttribute("aria-label", `Remove ${text} from wishlist`);

  removeBtn.addEventListener("click", () => {
    if (useFirestore && id && itemsColRef) {
      itemsColRef.doc(id).delete();
    } else {
      const items = loadWishlist().filter((item) => item !== text);
      saveWishlist(items);
      li.remove();
      updateWishlistProgress();
    }
  });

  li.appendChild(label);
  li.appendChild(removeBtn);
  wishlistList.appendChild(li);
}

function setWishlistFromItems(items) {
  if (!wishlistList) return;
  wishlistList.innerHTML = "";
  items.forEach(({ id, text }) => renderWishlistItem(id, text));
  updateWishlistProgressFromCount(items.length);
}

function updateWishlistProgressFromCount(count) {
  const maxVisible = 10;
  const fill = document.getElementById("wishlist-progress-fill");
  const label = document.getElementById("wishlist-progress-label");
  if (!fill || !label) return;
  const percent = Math.min(100, (count / maxVisible) * 100);
  fill.style.width = `${percent}%`;
  label.textContent = count === 1 ? "1 gift added" : `${count} gifts added`;
}

function updateWishlistProgress() {
  const count = useFirestore
    ? wishlistList.querySelectorAll(".wishlist-item").length
    : loadWishlist().length;
  updateWishlistProgressFromCount(count);
}

function hydrateWishlistFromStorage() {
  const items = loadWishlist();
  setWishlistFromItems(items.map((text) => ({ id: null, text })));
}

function startWishlistRealtime() {
  if (!useFirestore || !itemsColRef) return;
  itemsColRef.onSnapshot(
    (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        text: doc.data().text || ""
      }));
      setWishlistFromItems(items);
    },
    (err) => console.warn("Wishlist sync error:", err)
  );
}

wishlistForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = wishlistInput.value.trim();
  if (!value) return;

  if (useFirestore && itemsColRef) {
    itemsColRef.add({ text: value });
  } else {
    const items = loadWishlist();
    items.push(value);
    saveWishlist(items);
    renderWishlistItem(null, value);
    updateWishlistProgress();
  }
  wishlistInput.value = "";
});

// Floating background hearts
// -------------------------------

function spawnFloatingHeart() {
  const heart = document.createElement("div");
  heart.className = "floating-heart";
  heart.textContent = "❤";
  const x = Math.random() * 100;
  heart.style.setProperty("--x", `${x}vw`);
  heart.style.animationDuration = `${14 + Math.random() * 8}s`;
  heart.style.opacity = String(0.2 + Math.random() * 0.5);
  floatingHeartsContainer.appendChild(heart);
  setTimeout(() => {
    heart.remove();
  }, 22000);
}

function startFloatingHearts() {
  // Seed a few hearts
  for (let i = 0; i < 8; i++) {
    setTimeout(spawnFloatingHeart, i * 1000);
  }
  setInterval(spawnFloatingHeart, 2500);
}

// -------------------------------
// Init
// -------------------------------

window.addEventListener("DOMContentLoaded", () => {
  // Init wishlist: real-time if Firebase configured, else localStorage
  if (useFirestore) {
    startWishlistRealtime();
  } else {
    hydrateWishlistFromStorage();
  }

  // Floating hearts
  startFloatingHearts();
});
