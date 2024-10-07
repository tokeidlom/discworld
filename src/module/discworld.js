import {
  DiscRoller
} from './apps/discroller.js';
import {
  DiscworldCharacterSheet
} from './actors/character-sheet.js';
import {
  DiscworldNPCSheet
} from './actors/npc-sheet.js';
import {
  DiscworldTraitsItem
} from './items/traits-sheet.js';

//Item type hooks
Hooks.on("preCreateItem", (item, options, userId) => {

  // Update item images if the default Foundry icon is present
  if ((!item.img || item.img === "icons/svg/item-bag.svg")) {
    switch (item.type) {
      case "niche":
        item.updateSource({ img: "systems/discworld/assets/items/niches.webp" });
        break;
      case "core":
        item.updateSource({ img: "systems/discworld/assets/items/core.webp" });
        break;
      case "quirk":
        item.updateSource({ img: "systems/discworld/assets/items/quirks.webp" });
        break;
      case "trait":
        item.updateSource({ img: "systems/discworld/assets/items/traits.webp" });
        break;
    }
  }
  // Define the forbidden items for different actor types
  const actor = item.parent;
  if (!actor || actor.documentName !== "Actor") return true;

  const actorType = actor.type;
  const forbiddenItemsForCharacter = ["trait"];
  const forbiddenItemsForNPC = ["niche", "core", "quirk"];

  if (actorType === "character" && forbiddenItemsForCharacter.includes(item.type)) {
    ui.notifications.error(`${actor.name} cannot hold ${item.type} items.`);
    return false;
  }

  if (actorType === "NPC" && forbiddenItemsForNPC.includes(item.type)) {
    ui.notifications.error(`${actor.name} cannot hold ${item.type} items.`);
    return false;
  }

  return true;
});