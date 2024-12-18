import { DiscRoller } from './apps/discroller.js';
import { DiscworldCharacterSheet } from './actors/character-sheet.js';
import { DiscworldNPCSheet } from './actors/npc-sheet.js';
import { DiscworldTraitsItem } from './items/traits-sheet.js';

// Register sheets
Actors.unregisterSheet('core', ActorSheet);
Items.unregisterSheet('core', ItemSheet);
Actors.registerSheet("core", DiscworldCharacterSheet, {
  types: ["character"],
  makeDefault: true
});
Actors.registerSheet("core", DiscworldNPCSheet, {
  types: ["NPC"],
});
Items.registerSheet("discworld", DiscworldTraitsItem, {
  types: ["core", "trait", "quirk", "niche"],
});

// Item type hooks
Hooks.on("preCreateItem", (item, options, userId) => {

  // Update item images if the default Foundry icon is present
  if (!item.img || item.img === "icons/svg/item-bag.svg") {
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
    ui.notifications.error(game.i18n.format("application.actorcannothold", {
      actor: actor.name,
      item: item.type
    }));
    return false;
  }

  if (actorType === "NPC" && forbiddenItemsForNPC.includes(item.type)) {
    ui.notifications.error(game.i18n.format("application.actorcannothold", {
      actor: actor.name,
      item: item.type
    }));
    return false;
  }

  return true;
});

  // Register system settings
Hooks.once('init', async function() {
  game.settings.register('discworld', 'sendLuckToChat', {
    name: 'See Luck Updates in Chat:',
    hint: 'Uncheck this if you do not want to see luck update messages in chat.',
    scope: 'world',
    type: Boolean,
    default: true,
    config: true
  });
  game.settings.register('discworld', 'maxNumberOfLuck', {
    name: 'Maximum amount of Luck:',
    hint: 'Maximum amount of Luck each player can have at a time (4 is default).',
    scope: 'world',
    type: Number,
    default: 4,
    config: true
  });
});