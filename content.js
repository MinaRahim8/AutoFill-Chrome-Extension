// Runs on qbo.intuit.com. Finds visible form fields by their on-screen label
// text and fills them the way React expects (native setter + input/change events),
// since QBO's inputs are React-controlled and ignore a plain `.value = ...` assignment.

function setNativeValue(el, value) {
  const proto = Object.getPrototypeOf(el);
  const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
  if (descriptor && descriptor.set) {
    descriptor.set.call(el, value);
  } else {
    el.value = value;
  }
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function isVisible(el) {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && !el.disabled;
}

// Finds the input/textarea associated with a visible label whose text
// exactly matches `labelText` (case-insensitive).
function findInputForLabel(labelText) {
  const target = labelText.trim().toLowerCase();

  // 1) Real <label> elements, either via htmlFor or proximity to an input.
  const labels = Array.from(document.querySelectorAll("label"));
  for (const lbl of labels) {
    if (lbl.textContent.trim().toLowerCase() !== target) continue;

    if (lbl.htmlFor) {
      const el = document.getElementById(lbl.htmlFor);
      if (el && isVisible(el)) return el;
    }

    const container = lbl.closest("div");
    if (container) {
      const input = container.querySelector("input, textarea");
      if (input && isVisible(input)) return input;
    }
  }

  // 2) Fallback: some fields use a plain div/span as the "label" instead of <label>.
  const textNodes = Array.from(document.querySelectorAll("div, span")).filter(
    (el) => el.children.length === 0 && el.textContent.trim().toLowerCase() === target
  );
  for (const node of textNodes) {
    const container = node.parentElement && node.parentElement.parentElement;
    if (container) {
      const input = container.querySelector("input, textarea");
      if (input && isVisible(input)) return input;
    }
  }

  return null;
}

function fillField(labelText, value) {
  if (!value) return false;
  const input = findInputForLabel(labelText);
  if (!input) return false;
  setNativeValue(input, value);
  return true;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "FILL_QBO") return;

  const d = message.data;
  const results = {
    firstName: fillField("First name", d.firstName),
    lastName: fillField("Last name", d.lastName),
    email: fillField("Email", d.email),
    phone: fillField("Phone number", d.phone),
  };

  // Address fields on QBO's Customer panel often live behind an expandable
  // "Billing address" block rather than plain top-level inputs, so they're
  // not wired up by default. Uncomment/adjust once you confirm the actual
  // field labels by inspecting that section:
  //
  // results.address1 = fillField("Street address", d.address1);
  // results.city = fillField("City", d.city);
  // results.state = fillField("State", d.state);
  // results.zip = fillField("ZIP code", d.zip);

  sendResponse({ ok: true, results });
});
