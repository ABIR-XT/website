const STORAGE_KEY = "aincrad-key-vault";
const THEME_KEY = "aincrad-key-theme";

const menuButton = document.querySelector("#menuButton");
const pageMenu = document.querySelector("#pageMenu");
const menuItems = document.querySelectorAll(".menu-item");
const storagePage = document.querySelector("#storagePage");
const managerPage = document.querySelector("#managerPage");
const storageList = document.querySelector("#storageList");
const managerList = document.querySelector("#managerList");
const storageEmpty = document.querySelector("#storageEmpty");
const managerEmpty = document.querySelector("#managerEmpty");
const keyForm = document.querySelector("#keyForm");
const editingId = document.querySelector("#editingId");
const keyName = document.querySelector("#keyName");
const keyValue = document.querySelector("#keyValue");
const expiryDisplay = document.querySelector("#expiryDisplay");
const datetimePicker = document.querySelector("#datetimePicker");
const datetimeTrigger = document.querySelector("#datetimeTrigger");
const datetimePanel = document.querySelector("#datetimePanel");
const expiryDate = document.querySelector("#expiryDate");
const expiryTime = document.querySelector("#expiryTime");
const applyExpiryButton = document.querySelector("#applyExpiryButton");
const saveButton = document.querySelector("#saveButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const vaultCount = document.querySelector("#vaultCount");
const themeToggle = document.querySelector("#themeToggle");
const toast = document.querySelector("#toast");

let keys = readKeys();
let toastTimer;

document.body.dataset.page = "storage";
applyTheme(readTheme());
render();

menuButton.addEventListener("click", () => {
  const isOpen = pageMenu.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

document.addEventListener("click", (event) => {
  if (!pageMenu.contains(event.target) && !menuButton.contains(event.target)) {
    closeMenu();
  }

  if (!datetimePicker.contains(event.target)) {
    closeDateTimePicker();
  }
});

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    showPage(item.dataset.page);
    closeMenu();
  });
});

keyName.addEventListener("input", () => {
  const cursorPosition = keyName.selectionStart;
  keyName.value = keyName.value.toUpperCase();
  keyName.setSelectionRange(cursorPosition, cursorPosition);
});

datetimeTrigger.addEventListener("click", () => {
  const isOpen = datetimePicker.classList.toggle("open");
  datetimeTrigger.setAttribute("aria-expanded", String(isOpen));
});

applyExpiryButton.addEventListener("click", () => {
  if (!expiryDate.value || !expiryTime.value) {
    showToast("Choose both date and time.");
    return;
  }

  setExpiryValue(`${expiryDate.value}T${expiryTime.value}`);
  closeDateTimePicker();
});

keyForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = keyName.value.trim().toUpperCase();
  const value = keyValue.value.trim();

  if (!name || !value) {
    showToast("Enter a key and choose an expiry date first.");
    return;
  }

  const activeEditId = editingId.value;

  if (activeEditId) {
    keys = keys.map((item) => {
      if (item.id !== activeEditId) {
        return item;
      }

      return {
        ...item,
        name,
        value,
        updatedAt: new Date().toISOString()
      };
    });
    showToast("Key updated.");
  } else {
    keys.unshift({
      id: createId(),
      name,
      value,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    showToast("Key uploaded to storage.");
  }

  saveKeys();
  resetForm();
  render();
});

cancelEditButton.addEventListener("click", resetForm);

themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.dataset.theme === "light" ? "dark" : "light";
  applyTheme(nextTheme);
  localStorage.setItem(THEME_KEY, nextTheme);
});

function showPage(pageName) {
  const isStorage = pageName === "storage";

  storagePage.classList.toggle("active", isStorage);
  managerPage.classList.toggle("active", !isStorage);
  document.body.dataset.page = pageName;

  menuItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.page === pageName);
  });
}

function closeMenu() {
  pageMenu.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
}

function closeDateTimePicker() {
  datetimePicker.classList.remove("open");
  datetimeTrigger.setAttribute("aria-expanded", "false");
}

function readKeys() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) {
      return [];
    }

    return saved.map((item) => ({
      ...item,
      name: String(item.name || "").toUpperCase()
    }));
  } catch {
    return [];
  }
}

function saveKeys() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

function readTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

function applyTheme(theme) {
  const selectedTheme = theme === "light" ? "light" : "dark";
  document.body.dataset.theme = selectedTheme;
  themeToggle.setAttribute(
    "aria-label",
    selectedTheme === "light" ? "Switch to dark mode" : "Switch to light mode"
  );
}

function render() {
  vaultCount.textContent = `${keys.length} ${keys.length === 1 ? "key" : "keys"}`;
  renderStorage();
  renderManager();
}

function renderStorage() {
  storageList.innerHTML = "";
  storageEmpty.classList.toggle("visible", keys.length === 0);

  keys.forEach((item, index) => {
    storageList.append(createKeyCard(item, "storage", index));
  });
}

function renderManager() {
  managerList.innerHTML = "";
  managerEmpty.classList.toggle("visible", keys.length === 0);

  keys.forEach((item, index) => {
    managerList.append(createKeyCard(item, "manager", index));
  });
}

function createKeyCard(item, mode, index) {
  const card = document.createElement("article");
  card.className = "key-card";

  const expiry = formatDate(item.value);
  const serialName = `Key ${index + 1}`;

  card.innerHTML = `
    <div class="key-top">
      <span class="key-symbol" aria-hidden="true"><img src="assets/aincrad-key.png" alt=""></span>
      <div class="key-title">
        <h3 title="${escapeAttribute(item.name)}">${serialName}</h3>
        <p>Expires ${expiry}</p>
      </div>
    </div>
    <pre class="key-value">${escapeHtml(maskForPreview(item.name))}</pre>
    <div class="card-actions"></div>
  `;

  const actions = card.querySelector(".card-actions");
  actions.append(createIconButton("Copy key", copyIcon(), () => copyKey(item.name)));

  if (mode === "manager") {
    actions.append(createIconButton("Edit key", editIcon(), () => startEdit(item)));
    actions.append(createIconButton("Delete key", deleteIcon(), () => deleteKey(item.id), "danger-button"));
  }

  return card;
}

function createIconButton(label, iconMarkup, action, extraClass = "") {
  const button = document.createElement("button");
  button.className = `icon-button ${extraClass}`.trim();
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.innerHTML = iconMarkup;
  button.addEventListener("click", action);
  return button;
}

async function copyKey(value) {
  try {
    await navigator.clipboard.writeText(value);
    showToast("Key copied.");
  } catch {
    const helper = document.createElement("textarea");
    helper.value = value;
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
    showToast("Key copied.");
  }
}

function startEdit(item) {
  editingId.value = item.id;
  keyName.value = item.name;
  setExpiryValue(toDateTimeInputValue(item.value));
  saveButton.textContent = "Save changes";
  cancelEditButton.hidden = false;
  keyName.focus();
}

function deleteKey(id) {
  keys = keys.filter((item) => item.id !== id);
  saveKeys();
  resetForm();
  render();
  showToast("Key deleted.");
}

function resetForm() {
  editingId.value = "";
  keyForm.reset();
  keyValue.value = "";
  expiryDate.value = "";
  expiryTime.value = "";
  expiryDisplay.textContent = "Select expiry date and time";
  closeDateTimePicker();
  saveButton.textContent = "Upload key";
  cancelEditButton.hidden = true;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2200);
}

function formatDate(dateString) {
  if (!dateString) {
    return "today";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `key-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toDateTimeInputValue(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00`;
  }

  return value;
}

function setExpiryValue(value) {
  const normalizedValue = toDateTimeInputValue(value);
  keyValue.value = normalizedValue;

  if (normalizedValue.includes("T")) {
    const [date, time] = normalizedValue.split("T");
    expiryDate.value = date;
    expiryTime.value = time.slice(0, 5);
  }

  expiryDisplay.textContent = formatDate(normalizedValue);
}

function maskForPreview(value) {
  if (value.length <= 42) {
    return value;
  }

  return `${value.slice(0, 18)}...${value.slice(-14)}`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return entities[character];
  });
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function copyIcon() {
  return '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
}

function editIcon() {
  return '<svg viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>';
}

function deleteIcon() {
  return '<svg viewBox="0 0 24 24"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path></svg>';
}
