Hooks.once("init", async () => {
  function isVersion13OrHigher() {
    const version = game?.version || game?.data?.version;
    return version ? parseInt(version.split('.')[0]) >= 13 : false;
  }

  async function loadDiscRoller() {
    const modulePath = isVersion13OrHigher() ? './apps/discrollerV2.js' : './apps/discrollerV1.js';
    const module = await import(modulePath);
    return module.DiscRoller;
  }

  async function loadCharacterSheet() {
    const modulePath = isVersion13OrHigher() ? './actors/character-sheetV2.js' : './actors/character-sheetV1.js';
    const module = await import(modulePath);
    return module.DiscworldCharacterSheet;
  }

  async function loadNPCSheet() {
    const modulePath = isVersion13OrHigher() ? './actors/npc-sheetV2.js' : './actors/npc-sheetV1.js';
    const module = await import(modulePath);
    return module.DiscworldNPCSheet;
  }

  async function loadTraitSheet() {
    const modulePath = isVersion13OrHigher() ? './items/traits-sheetV2.js' : './items/traits-sheetV1.js';
    const module = await import(modulePath);
    return module.DiscworldTraitsItem;
  }

  const DiscRoller = await loadDiscRoller();
  console.log("Loaded DiscRoller:", DiscRoller);

  const DiscworldCharacterSheet = await loadCharacterSheet();
  console.log("Loaded DiscworldCharacterSheet:", DiscworldCharacterSheet);

  const DiscworldNPCSheet = await loadNPCSheet();
  console.log("Loaded DiscworldNPCSheet:", DiscworldNPCSheet);

  const DiscworldTraitsItem = await loadTraitSheet();
  console.log("Loaded DiscworldTraitsItem:", DiscworldTraitsItem);

  // Register sheets
  if (isVersion13OrHigher()) {
    foundry.documents.collections.Actors.unregisterSheet('core', foundry.appv1.sheets.ActorSheet);
    foundry.documents.collections.Items.unregisterSheet('core', foundry.appv1.sheets.ItemSheet);
    foundry.documents.collections.Actors.registerSheet("core", DiscworldCharacterSheet, {
      types: ["character"],
      makeDefault: true
    });
    foundry.documents.collections.Actors.registerSheet("core", DiscworldNPCSheet, {
      types: ["NPC"],
    });
    foundry.documents.collections.Items.registerSheet("discworld", DiscworldTraitsItem, {
      types: ["core", "trait", "quirk", "niche"],
    });
  } else {
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
  }
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