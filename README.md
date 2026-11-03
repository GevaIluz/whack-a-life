# 🔨 Whack-a-Life

A fun to-do list. Every life area is an arcade machine, every task is a mole. Done? **Whack it.**

## Open it
```
open ~/whack-board/index.html
```
No install and no server.

## The arcade floor (home)
- **Today's run** (right side) is your daily list: everything urgent, due today or overdue, plus what's coming up this week. Hit the red hammer to mark one done. **Write a list** and **+ Mole** sit at the top of it.
- **Machines** stand in a tidy grid, each on its own pedestal, with a name plate showing how many moles are loose (red = something's overdue, ✓ = all clear), a calm meter and its key number. Every life area has its own machine:

| Area | Machine |
|---|---|
| Work | Laptop with sticky notes and a coffee mug |
| MBA | Stack of books with a graduation cap |
| Apartment | House with a chimney |
| Money | Piggy bank |
| Travel | Airplane on clouds |
| Health | Strength tester with a heart |
| Family | Carousel |
| Possessions | Capsule (gumball) machine |
| Murphy 🐶 | German shepherd |
| Free Play | Whack-a-mole table |

- Machines hold still at rest and come alive when you hover them (the dog wags, coins drop into the piggy bank, the horses bob, the chimney puffs). Click one (or press `1` to `9`) and its screen grows into the board.
- **Free Play** (press `0`) is a just-for-fun 30-second whack-a-mole round starring tasks you've already finished. It never changes your list.
- **Install a machine** adds a new life area. Pick its machine, world and icon; you can change a machine's type anytime in its ⚙ settings.
- Your **level** is your age, and it goes up on your birthday (Oct 3). The month is shown under it.

## Adding a list
Hit **Write a list** (in Today's run or inside any machine, or press `L`) and write or paste one task per line, in Hebrew or English.
- Hebrew lines are **translated to English** automatically, then each line is **sorted into a machine**. You get a preview where you can edit any name, change its machine, mark it done, or untick it.
- Translation uses Chrome's built-in translator **on your device** (the first use downloads the Hebrew→English language pack). If that's unavailable, it falls back to MyMemory, a free online service, and the status line tells you which one ran. Untick "Translate to English" to keep the Hebrew.
- A heading like `בריאות:` sends the lines under it (until a blank line) to that machine. ✅ lines are logged as done, duplicates are skipped, and "דחוף/urgent" makes a mole urgent.

## Inside a machine
- Type in the bar under the board and press Enter to add a mole (`N` focuses it). You can set a due date and urgency: Chill, Normal or Urgent.
- **Click a mole** to whack it (done). **Undo** is in the toast.
- **Click a mole's name tag** to edit it, move it to another machine, or delete it.
- **⚙** opens the machine settings: rename it, change its world or icon, reorder it, or remove it.
- `Esc` goes back to the arcade.

## Your data & Cloud Sync (iPhone + Mac)
- Your data is saved immediately in `localStorage` on your device. Use **⬇** to back it up to a JSON file and **⬆** to restore it. The 📅 button shows your done log.
- **☁️ Cloud sync (Secret GitHub Gist):** Click the **☁️** button in the top bar and paste a GitHub Personal Access Token (with only the `gist` scope). It automatically creates or connects to a private `whack-a-life-sync.json` Secret Gist and merges your tasks in the background whenever you make changes or open the app.
- **Pair your iPhone in one paste:** Once connected on your Mac, open **☁️ Cloud sync** and click **Copy code**, then paste that code into the token field on your iPhone.
- **Install as an app:**
  - **iPhone:** Open your hosted URL in Safari → tap **Share** → **Add to Home Screen**.
  - **Mac:** Open your hosted URL in Chrome (click the **Install Whack-a-Life** icon in the address bar) or Safari (**File → Add to Dock**).

## Adding a batch of tasks
`seeds.js` holds one-time imports. Each entry (with a unique `id`) is merged into your saved data once. It only adds, never overwrites, and skips duplicates. The post-Italy list is already in there.

## Previous looks
Older versions are saved in `versions/`: `v3-cabinets/` (identical cabinets), `v4-park-rows/` (machines in rows), `v5-wide-park/` (side-scrolling park), `v6-hall/` (the indoor hall) and `v7-outdoor-park/` (the perspective park in a forest clearing). Open a version's `index.html` to use it; in Chrome it reads the same saved data. To switch back for good, copy that version's files over the main ones.

## Files
`index.html`, `styles.css`, `app.js` (logic), `seeds.js` (task imports), `themes.js` (worlds, scenes, mole art), `park.js` (the machine illustrations), `icons.js` ([Lucide](https://lucide.dev) icons, ISC license).
