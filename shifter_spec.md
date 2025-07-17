### 📄 Shifter - Spec (Updated)

---

## 🏡 Overview

A lightweight, offline-friendly scheduling tool for IDF reservists to manage rotating guard shifts efficiently. Designed for use in dynamic environments with frequent changes, such as military bases with poor or no internet connectivity.

**Note:** The application will be developed entirely in **Hebrew** with a full **Right-to-Left (RTL)** interface.

---

## 🎨 UI/UX & Localization

### 1. **Language & Direction**

* **Primary Language**: **Hebrew (עברית)**. All UI text, including labels, buttons, and messages, must be in Hebrew.
* **UI Direction**: The entire application layout must be **Right-to-Left (RTL)** to properly support the Hebrew language. This affects tables, menus, text input, and all other UI components.

### 2. **Design & Theme**

* **Color Palette**: The design should be user-friendly and based on a dark theme. It should primarily use **dark blue colors** to create a visually comfortable experience, suitable for low-light conditions.
* **Aesthetics**: The interface must be clean, modern, and intuitive, prioritizing ease of use and clarity.

---

## 🛠️ Technology Stack

* **Framework**: **Next.js** (using the App Router).
* **Language**: **TypeScript**.
* **Styling**: **TailwindCSS** for a utility-first CSS workflow.

---

## ✅ Core Features

### 1. **Posts Management (ניהול עמדות)**

* Add/edit/delete guard posts.
* Each post includes:
    * Name (e.g., "ש.ג.", "מגדל שמירה")
    * Required number of guards per time slot.
    * Optional active hours (e.g., only guard from 21:00 to 05:00).

### 2. **Soldier Management (ניהול חיילים)**

* Add/edit/remove soldiers.
* Toggle their availability (e.g., someone just arrived or left).
* ✅ **Remove from schedule**:
    * Right-click or menu option to:
        * Remove from a single time slot.
        * Remove from **all** time slots.

### 3. **Configurable Time Slot Duration (שינוי אורך משמרת)**

* Set slot granularity: 30 min / 1 hour / 2 hours.
* This setting affects the entire current schedule.
* Changeable via a settings dropdown menu.

### 4. **Shift Arrangement Table (טבלת שיבוצים)**

* Rows: time slots (based on selected granularity).
* Columns: guard posts. **The columns should be ordered from right to left.**
* Cells: list of assigned soldier(s).
* Cells validate:
    * Correct number of soldiers.
    * No double-booking.

### 5. **Shift Assignment Tools (כלי שיבוץ)**

* Manual soldier assignment to time slots via:
    * Click-to-assign.
    * ✅ **Drag-and-drop support**:
        * Drag soldiers into a specific time slot.
        * Drag a soldier from one time slot onto another soldier to **swap** their positions.
* Auto-rebalance:
    * ✅ **"דחוס לוח זמנים" (Compress Schedule) button**:
        * This button fills empty time slots ("holes") by shifting all subsequent assignments to an earlier time.
        * The operation moves the later part of the schedule block "as is," preserving the exact order and structure of the shifted assignments.
        * This results in any gaps being moved from the middle to the end of the schedule.
        * **Important**: This compression is a purely mechanical shift and must be performed **without** considering or being constrained by the ideal rest period rules.
* ✅ **"שבץ אוטומטית" (Auto-fill Schedule) button**:
    * A button that automatically fills the entire schedule with available soldiers.
    * The algorithm ensures fair rest periods between shifts.
    * If multiple soldiers are equally eligible, one is chosen randomly.
* Assignment validation:
    * No double-booking.
    * Correct number of guards per slot.
    * ✅ **Rest period warning (התראת מנוחה)**:
        * The app should visually warn when a soldier is scheduled for shifts with a non-ideal rest period in between. The warning should trigger if a soldier has **more or less** rest time than the calculated ideal.
        * **Ideal Rest Formula**: `$Ideal Rest Slots = Floor(Total Available Soldiers / Total Soldiers Needed Per Slot) - 1$`.
        * The "Total Soldiers Needed Per Slot" is the sum of required guards across all active posts for a given time slot.
        * **Example**:
            * Given **2 posts** requiring **2 soldiers** each, the "Total Soldiers Needed Per Slot" is **4**.
            * If there are **12 available soldiers** in total.
            * The ideal rest period is `Floor(12 / 4) - 1 = 2` resting time slots.
            * A soldier scheduled with only **1** rest slot (or less), or with **3** rest slots (or more) between their shifts would trigger a visual warning.
    * ✅ **Unassigned soldier indication**: If an available soldier is not assigned to any slot, they should be highlighted in the UI.

### 6. **Persistence (שמירה מקומית)**

* All data is saved locally (using localStorage or IndexedDB).
* Offline support is mandatory.
* No login is needed.

### 7. **Export to WhatsApp Format (ייצוא לוואטסאפ)**

* Generate a clean, readable schedule for easy WhatsApp sharing.
* The generated text must be **formatted for RTL reading**.
* Offer customizable formats (time-first or post-first layout).
