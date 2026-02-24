# Discworld

An unofficial FoundryVTT system for Modiphius’ *Discworld: Adventures in Ankh-Morpork*. Shared with Modiphius’ kind permission.

This system is more cobbled together than the streets of Ankh-Morpork. It is intended for occasional use. As Modiphius describe the game, it’s designed to be played as a one-shot, providing respite between sessions of a more serious system. As such, the rules are light and easy to follow.

In that spirit, this VTT system is little more than an online character sheet and dice roller to assist your play sessions.

![Discworld](https://raw.githubusercontent.com/tokeidlom/discworld/main/screenshots/banner.png)

---

## Installation

Add this manifest to your FoundryVTT: 

https://raw.githubusercontent.com/tokeidlom/discworld/main/src/system.json


Or browse for **Discworld** in your Foundry “Game Systems” section:

https://foundryvtt.com/packages/discworld

---

## Collaboration & Support

I’m open to suggestions for improvement, code submissions, PRs, and generally anything that makes this better for everyone.

If you would like to submit a PR, please target the **develop** branch.

---

# Instructions

Go to the **Characters** tab and click **Create Actor**.  
Choose either **Character** or **NPC**, name your actor, and create it.

![Create Actor](https://raw.githubusercontent.com/tokeidlom/discworld/main/screenshots/create-actor.png)

---

## Character Sheet

![Character Sheet](https://raw.githubusercontent.com/tokeidlom/discworld/main/screenshots/character.png)

The following fields can be typed into directly:

- Name  
- Pronoun  
- Organisation  
- Background  
- Consequences  
- Notes  

### Party Field

The **Party** field is a dropdown list. Users can select any “Party” items (see Items below) in the world for which they have at least Limited permission.

Clicking the 👁 icon opens the Party sheet.

### Trait Fields

The **Niche**, **Quirks**, and **Core** fields are item-based (see Items below).

- Click **+** to add
- Click 🗑 to delete
- Click ✏ to edit

Any description added to an item can be viewed by hovering over the entry on the character sheet for one second, a tooltip will appear.

![Tooltip](https://raw.githubusercontent.com/tokeidlom/discworld/main/screenshots/tooltip.png)

### Dice Rolls

The character sheet includes buttons for:

- d4  
- d6  
- d10  
- d12  

If you highlight text on your character or Party sheet before clicking a roll button, the selected text will be added to the chat card. This follows the principle that:

> “Anything on your character sheet can be a trait.”

If no text is highlighted, the roll proceeds normally.

These are all the dice players should need. For additional dice, use the Dice Roller (see below).

![Chat Output](https://raw.githubusercontent.com/tokeidlom/discworld/main/screenshots/chat.png)

---

## NPC Sheet

![NPC Sheet](https://raw.githubusercontent.com/tokeidlom/discworld/main/screenshots/npc.png)

When creating an NPC, you can:

- Use the auto-generation wizard
- Choose **Blank** and fill it out manually

![NPC Creation](https://raw.githubusercontent.com/tokeidlom/discworld/main/screenshots/npc-creator-1.png)

If using the wizard:

- Click **Confirm** to accept
- Click **Reroll** to generate another option
- Select **Blank** if you change your mind

![NPC Wizard](https://raw.githubusercontent.com/tokeidlom/discworld/main/screenshots/npc-creator-2.png)

### NPC Generator Data

The NPC creator pulls data from rollable tables in the core book, located in the Compendia.

If you import these tables into your world — or create new ones with the same names — the generator will use your world’s versions first, falling back to the Compendia if needed.

This allows you to customise or extend the lists.

---

## Items

From the **Items** directory, click **Create Item** to create:

- Core  
- Feature  
- Mannerism  
- Niche  
- Quirk  
- Party  

![Items Menu](https://raw.githubusercontent.com/tokeidlom/discworld/main/screenshots/items.png)

Items can be dragged onto character sheets.

You can also:

- Drag between character sheets (creates a copy)
- Drag to the Items directory
- Hold **ALT** while dragging to move instead of copy

### Item Compatibility

- **Niche, Quirk, Core** → Character sheets  
- **Niche, Feature, Mannerism** → NPC sheets  

If you attempt to add an incompatible item, you will receive a warning and nothing bad will happen.

All trait items share the same design and functionality.

![Trait Sheet](https://raw.githubusercontent.com/tokeidlom/discworld/main/screenshots/trait.png)

The **Party** item is selected via the dropdown on the Character sheet.

![Party Sheet](https://raw.githubusercontent.com/tokeidlom/discworld/main/screenshots/party.png)

---

## Dice Roller

![Dice Roller](https://raw.githubusercontent.com/tokeidlom/discworld/main/screenshots/roller.png)

A small bundled dice roller stays on screen and allows rolling any dice type.

Unlike the character sheet roll buttons, it:

- Does not capture highlighted text  
- Performs simple dice rolls only  

You can choose one of four screen positions in the **Settings** menu.

---

## Compendia

The Compendia contain:

- **Core Items** — traits from the user-facing section of the core book  
- **Rollable Tables** — rollable tables from the user-facing section  

These can be:

- Used directly
- Dragged onto sheets
- Imported into your world for customisation

![Compendia Menu](https://raw.githubusercontent.com/tokeidlom/discworld/main/screenshots/compendia.png)
![Compendia Items](https://raw.githubusercontent.com/tokeidlom/discworld/main/screenshots/compendia-items.png)
![Compendia Tables](https://raw.githubusercontent.com/tokeidlom/discworld/main/screenshots/compendia-tables.png)

---

## Settings

The Settings menu allows you to:

- Toggle character Luck messages in chat  
- Set the maximum Luck value (for house rules)  
- Choose the Dice Roller screen position  

![Settings Menu](https://raw.githubusercontent.com/tokeidlom/discworld/main/screenshots/settings.png)

---

## Dark & Light Mode

The system supports both light and dark modes (excluding the chat window, which FoundryVTT does not yet support).

By default, it follows your browser setting, but this can be changed in the Foundry menu.

---

## Final Notes

I made this system for fun and for use with my own group. You are welcome to use it freely.

I’ve been asked to create a tips jar, if you’d like to leave a tip, you can do so here:

☕ https://ko-fi.com/calinstar