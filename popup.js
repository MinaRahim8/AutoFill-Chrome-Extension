// Maps the exact labels used in the ANY LAB TEST NOW intake export
// to internal field keys. If they tweak their form export, add/adjust rows here.
const LABEL_MAP = [
  ["Customer First Name", "firstName"],
  ["Customer Last Name", "lastName"],
  ["Address 1", "address1"],
  ["Address 2", "address2"],
  ["City", "city"],
  ["State/Province/Region", "state"],
  ["Zip Code", "zip"],
  ["Country", "country"],
  ["Phone Number", "phone"],
  ["E-mail Address", "email"],
  ["Date of Birth", "dob"],
  ["Gender", "gender"],
];

function parseIntakeText(text) {
  const data = {};
  const lines = text.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    for (const [label, key] of LABEL_MAP) {
      const prefix = label.toLowerCase() + ":";
      if (line.toLowerCase().startsWith(prefix)) {
        const value = line.slice(label.length + 1).trim();
        if (value) data[key] = value; // don't clobber a good value with a blank repeat
        break;
      }
    }
  }
  return data;
}

function fillPreview(data) {
  document.getElementById("firstName").value = data.firstName || "";
  document.getElementById("lastName").value = data.lastName || "";
  document.getElementById("email").value = data.email || "";
  document.getElementById("phone").value = data.phone || "";
  document.getElementById("address1").value = data.address1 || "";
  document.getElementById("city").value = data.city || "";
  document.getElementById("state").value = data.state || "";
  document.getElementById("zip").value = data.zip || "";
}

function readPreview() {
  return {
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    address1: document.getElementById("address1").value.trim(),
    city: document.getElementById("city").value.trim(),
    state: document.getElementById("state").value.trim(),
    zip: document.getElementById("zip").value.trim(),
  };
}

const statusEl = document.getElementById("status");

document.getElementById("parseBtn").addEventListener("click", () => {
  const text = document.getElementById("rawText").value;
  const data = parseIntakeText(text);
  fillPreview(data);
  statusEl.textContent = Object.keys(data).length
    ? `Parsed ${Object.keys(data).length} field(s). Review above, then autofill.`
    : "Didn't recognize any fields — check the pasted text matches the intake export format.";
});

document.getElementById("fillBtn").addEventListener("click", async () => {
  const data = readPreview();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || !tab.url.includes("qbo.intuit.com")) {
    statusEl.textContent = "Switch to the QuickBooks Online tab first, then click Autofill.";
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: "FILL_QBO", data }, (response) => {
    if (chrome.runtime.lastError) {
      statusEl.textContent =
        "Couldn't reach the QBO tab. Reload the QuickBooks page and try again.\n" +
        chrome.runtime.lastError.message;
      return;
    }
    if (!response) {
      statusEl.textContent = "No response from the page — try reloading the QBO tab.";
      return;
    }
    const filled = Object.entries(response.results)
      .filter(([, ok]) => ok)
      .map(([k]) => k);
    const missed = Object.entries(response.results)
      .filter(([, ok]) => !ok)
      .map(([k]) => k);

    statusEl.textContent =
      (filled.length ? `Filled: ${filled.join(", ")}\n` : "") +
      (missed.length ? `Not found on page: ${missed.join(", ")}` : "");
  });
});
