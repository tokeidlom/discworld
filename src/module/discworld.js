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

  async function loadPartySheet() {
    const modulePath = isVersion13OrHigher() ? './items/party-sheetV2.js' : './items/party-sheetV1.js';
    const module = await import(modulePath);
    return module.DiscworldPartyItem;
  }

  const DiscRoller = await loadDiscRoller();
  console.log("Loaded DiscRoller:", DiscRoller);

  const DiscworldCharacterSheet = await loadCharacterSheet();
  console.log("Loaded DiscworldCharacterSheet:", DiscworldCharacterSheet);

  const DiscworldNPCSheet = await loadNPCSheet();
  console.log("Loaded DiscworldNPCSheet:", DiscworldNPCSheet);

  const DiscworldTraitsItem = await loadTraitSheet();
  console.log("Loaded DiscworldTraitsItem:", DiscworldTraitsItem);

  const DiscworldPartyItem = await loadPartySheet();
  console.log("Loaded DiscworldPartyItem:", DiscworldPartyItem);

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
    foundry.documents.collections.Items.registerSheet("discworld", DiscworldPartyItem, {
      types: ["party"],
    });

    // Change role field into a nice item for NPC
    Hooks.on('renderDiscworldNPCSheet', async (actorSheet, html, data) => {
      const actor = actorSheet.actor;
      if (actor.system.role && actor.system.role.trim()) {
        const roleName = actor.system.role.trim();
        const existingNiche = actor.items.find((niche) => niche.name === roleName && niche.type === 'niche');
        if (!existingNiche) {
          const nicheItemData = {
            name: roleName,
            type: 'niche',
          };
          try {
            await actor.createEmbeddedDocuments('Item', [nicheItemData]);
            await actor.update({
              'system.role': ''
            });
          } catch (err) {
            console.error(`Error creating niche item for actor ${actor.name}:`, err);
          }
        }
      }
    });

    // Merge background and description into background field
    Hooks.on('renderDiscworldCharacterSheet', async (actorSheet, html, data) => {
      const actor = actorSheet.actor;
      const background = String(actor.system.background ?? '').trim();
      const description = String(actor.system.description ?? '').trim();
      if (description && !background.includes(description)) {
        const newBackground = background
          ? `${background}\n${description}`
          : description;
        try {
          await actor.update({
            'system.background': newBackground,
            'system.description': ''
          });
          console.log(`[Discworld] Merged description into background for "${actor.name}"`);
        } catch (err) {
          console.error(`[Discworld] Failed to merge background/description for "${actor.name}":`, err);
        }
      }
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
    Items.registerSheet("discworld", DiscworldPartyItem, {
      types: ["party"],
    });

    // Change role field into a nice item for NPC & Merge background and description into background field
    Hooks.on('renderActorSheet', async (actorSheet, html, data) => {
      const actor = actorSheet.object;
      if (actor.system.role && actor.system.role.trim()) {
        const roleName = actor.system.role.trim();
        const existingNiche = actor.items.find((niche) => niche.name === roleName && niche.type === 'niche');
        if (!existingNiche) {
          const nicheItemData = {
            name: roleName,
            type: 'niche',
          };
          try {
            await actor.createEmbeddedDocuments('Item', [nicheItemData]);
            await actor.update({
              'system.role': ''
            });
          } catch (err) {
            console.error(`Error creating niche item for actor ${actor.name}:`, err);
          }
        }
      }
      const background = String(actor.system.background ?? '').trim();
      const description = String(actor.system.description ?? '').trim();
      if (description && !background.includes(description)) {
        const newBackground = background
          ? `${background}\n${description}`
          : description;
        try {
          await actor.update({
            'system.background': newBackground,
            'system.description': ''
          });
          console.log(`[Discworld] Merged description into background for "${actor.name}"`);
        } catch (err) {
          console.error(`[Discworld] Failed to merge background/description for "${actor.name}":`, err);
        }
      }
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
      case "party":
        item.updateSource({ img: "systems/discworld/assets/items/party.png" });
        break;
    }
  }

  // Define the forbidden items for different actor types
  const actor = item.parent;
  if (!actor || actor.documentName !== "Actor") return true;

  const actorType = actor.type;
  const forbiddenItemsForCharacter = ["trait"];
  const forbiddenItemsForNPC = ["core", "quirk"];

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