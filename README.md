# OUT OF ORDER

An incremental game. You are VEND-3, a soda machine in a park in Japan, standing between two AI soda
machines. Sell more than them. At every review, the lowest seller gets reset.

**This is an early test build.** The art is placeholder, there are visual glitches, and the balance
still changes. It contains Chapter 1 (about 30–45 minutes); after that you can keep playing.

Made by **Void Possum**.

## Play it

- Online: https://voidpossum.github.io/ImFridge/ (ask Void Possum for the password).
- Offline: download this folder and double-click `index.html`. Nothing to install.

## Controls

- **Click your machine** (the red one) or press **Space**: post an ad. Likes bring followers who buy from you.
- **Click the crate** on top of your machine or press **R**: restock your cans.
- **P** or **Esc**: pause (the pause menu has the settings).
- In a review: press **1–4** to pick a memory card. **Enter** continues.
- Everything you can buy is in the **Shop** on the right.

## Saves

- The game saves by itself every 10 seconds and when you close the tab.
- **Settings → Export save file** makes a backup. **Import save file** loads one.
- Saves are per browser.

## For testing and tuning

- `index.html?debug=1` shows a debug bar (game speed, extra fizz, end the quarter now...).
- `node tools/sim.js` runs bots that play the whole chapter very fast and print how long it takes.
  Use it after changing numbers in `js/data/`.
- All text and balance numbers live in `js/data/`. Menu colours live at the top of `style.css`.
- `art/lobby/` keeps the old office-lobby art (not used right now).

## Bugs and feedback

bugs.voidpossum@icloud.com

## License

© 2026 Void Possum. All rights reserved. See `LICENSE`.
