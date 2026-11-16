# Devil's advocate checklist

Features the project owner wants tested thoroughly. Test each in a real browser at desktop and phone size. Report problems ranked by severity. Do not fix code. Sources: `plan.md` (sections 4 and 7) and `docs/engineering.md` Part A.

Add each new feature here when the owner asks for it.

## 1. Map navigation
- Dragging the map is smooth, with no jumps, on desktop and phone.
- Zoom (wheel, pinch, buttons, double tap) is convenient but not jumpy or imprecise.
- A small building can still be tapped on a phone at the opening zoom.
- Clicking empty map closes or minimises the panel without surprises.

## 2. Building colour on the map
- A building with no report is grey.
- After a report is submitted, the building takes the colour of its latest report (green, yellow, red).
- A newer report changes the colour. Older reports stay in History.
- Colour is never the only signal: the panel shows the colour word and remarks (rule 1).
- Grey is not shown as a finding. Wording is "Not yet inspected" (rule 3).

## 3. Preview, maximize, minimize
- Clicking a building shows the preview with the latest report summary, or "Not yet inspected".
- Maximize opens the full view with the History and Create report tabs. Minimize returns to the preview.
- Selection, scroll position and a half-filled form survive maximize and minimize.
- Escape, the close button, and the browser back button behave sensibly. Phone bottom sheet, landscape, narrow desktop widths.

## 4. History tab
- Rows show report date (day, month, year), engineer name, colour word with dot, and the first line of the final observation. Newest first.
- Two reports on the same day are ordered by save time.
- Opening a past report shows it read-only in the same format as the form.
- Empty state for a building with no reports.
- Very long text and Arabic text display correctly and right to left.

## 5. Create report form
- Fields: engineer name and contact, date of report, number of people living in the building, construction date, observations on roof, columns, foundations, final observation, colour.
- Colour is the last field, required, with no default. Save is disabled until all four observations (or "Not inspected" reasons) are done and a colour is chosen.
- Date of report: real calendar dates only, 1990 or later, not in the future.
- Construction date: autofilled from the previous report, editable, 1800 or later. An edit requires a reason (10 to 300 characters) and keeps the previous value.
- "Not inspected" tick box per area, with a required reason.
- Observations: at least 10 characters, at most 2000. Empty, spaces only, "OK", very long input.
- Residents: 0 versus "Not yet verified", negative numbers, huge numbers, decimals.
- The triage warning is shown near the colour.
- Double-clicking Save does not create two reports. A slow connection and a failed save keep the engineer's input.
- Arabic names and observations type and save correctly.

## 6. The record is never overwritten (plan section 4)
- Submitted reports cannot be edited or deleted from the app.
- Try to edit or delete reports through the public API and the browser: it must fail.
- Construction date changes keep every earlier value, with who, when and why.

## 7. Accounts and approval
- Sign-up has six fields (full name, contact number, OEA membership number, discipline, username, password) with the limits in `docs/engineering.md` D9. Email addresses are rejected in the contact field. Duplicate usernames. Arabic names.
- After sign-up: "Waiting for OEA approval." Refresh approves the account and goes straight into the map. Refreshing twice, closing the tab and returning, and signing in on a second device all behave sensibly.
- A pending (not yet refreshed) account cannot see any building, report or colour, including by calling the API directly.
- Before sign-in nothing about any building is reachable: pages, `/api/buildings`, the colours feed, reports (rule 2).
- Login: a wrong username and a wrong password give the same message. Logout works. A session cannot be reused after logout.
- A report's engineer name, contact, OEA number and discipline come from the account, appear at once, and are locked. Try to change them in the browser and by calling the API with other values: the server must ignore them. A user must not be able to file a report as someone else.
- Old reports keep the engineer details they were written with.
- All signed-in engineers can see each other's data (this is intended).
- Passwords are not stored or logged in plain text. Very long inputs, injection, and rapid repeated sign-ups.

## 8. Attacker checks
- Script injection in every text field. Huge payloads. Fake or malformed requests to the API.
- The buildings feed and report endpoints: can they be abused to run up cost or read private data?
- Nothing about any building is public beyond what the engineer-only app shows (rule 2).
