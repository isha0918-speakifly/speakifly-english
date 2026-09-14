/* ============================================================
   Speakifly — users-data.js
   This is the list of accounts you assign to students.

   HOW TO ADD OR REMOVE A STUDENT:
   - Add a new line inside the USERS array below, following the
     same format: { u: "username", p: "password", name: "Display Name" }
   - Usernames must be unique. Passwords can be anything you like.
   - Save the file and re-upload it to GitHub (or edit it directly
     on GitHub.com — click the file, click the pencil icon, edit,
     then "Commit changes").

   SECURITY NOTE:
   This is a simple access gate for a free static website, not a
   secure login system. Anyone who knows how to view a page's
   source code could see this list. Do not reuse a real, important
   password here, and don't use this to protect sensitive data —
   it's meant to control casual access to course content only.
   ============================================================ */

const USERS = [
  { u: "student1", p: "speak2026", name: "Student One" },
  { u: "student2", p: "speak2026", name: "Student Two" },
  { u: "demo", p: "demo123", name: "Demo Student" }
];
