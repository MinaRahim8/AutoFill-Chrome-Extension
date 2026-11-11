# QBO Intake Autofill

A small Chrome extension that parses the text from your ANY LAB TEST NOW
intake export and autofills it into a QuickBooks Online customer form.

## Install (unpacked, for personal/dev use)

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this folder (`qbo-autofill-extension`)
5. Pin the extension icon to your toolbar for easy access

## Use it

1. Open the QuickBooks Online customer form (the "Customer" panel, as in
   your screenshot).
2. Click the extension icon.
3. Paste the full text of the intake export into the box and click **Parse**.
4. Review the fields — fix anything that parsed wrong.
5. Click **3. Autofill QuickBooks tab**. It'll report which fields it filled
   and which it couldn't find.

## If a field doesn't get filled

QBO's screen is React-based, and I don't have access to its actual DOM, so
`content.js` finds fields by matching visible label text (e.g. "First name",
"Email") rather than hardcoded CSS selectors. That's usually robust, but if
a field is reported as "not found":

1. Right-click the field in QBO → **Inspect**.
2. Note whether it has a `<label>` with matching text, or an `id`/`name`/
   `aria-label` you can point me to.
3. Send me that and I'll tighten `findInputForLabel` in `content.js`, or add
   a direct selector for that one field.

## Extending it

- **Address fields**: the "Billing address" section on the Customer panel
  may be a multi-field block or a single autocomplete box — I left it
  commented out in `content.js` since I couldn't confirm which from the
  screenshot alone. Fill it in once you check.
- **Reading the PDF directly** instead of pasting text: doable with
  `pdf.js` bundled into the extension, so you could pick the PDF file in
  the popup instead of copy/pasting. Worth doing once the paste-based flow
  is solid and you know exactly which fields you actually use.
- **Auto-detect the "Choose a customer" search box** on the Sales Receipt
  screen itself (not just the New Customer panel) — that one's a
  type-ahead combobox, a bit trickier, but doable if that's part of your
  flow too.
