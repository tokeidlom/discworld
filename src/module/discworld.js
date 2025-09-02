// Import Modules
import {DiscRoller} from './apps/discroller.js';
import {DiscworldCharacterSheet} from './actors/character-sheet.js';
import {DiscworldNPCSheet} from './actors/npc-sheet.js';
import {DiscworldTraitsItem} from './items/traits-sheet.js';
import {DiscworldPartyItem} from './items/party-sheet.js';
import {NpcCreatorService} from './apps/npc-creator.js';

// Register sheets
foundry.documents.collections.Actors.unregisterSheet('core', foundry.appv1.sheets.ActorSheet);
foundry.documents.collections.Items.unregisterSheet('core', foundry.appv1.sheets.ItemSheet);
foundry.documents.collections.Actors.registerSheet('core', DiscworldCharacterSheet, {
  types: ['character'],
  label: 'Character',
  makeDefault: true
});
foundry.documents.collections.Actors.registerSheet('core', DiscworldNPCSheet, {
  types: ['NPC'],
  label: 'NPC'
});
foundry.documents.collections.Items.registerSheet('discworld', DiscworldTraitsItem, {
  types: ['core', 'trait', 'quirk', 'niche', 'mannerism'],
  label: 'Trait'
});
foundry.documents.collections.Items.registerSheet('discworld', DiscworldPartyItem, {
  types: ['party'],
  label: 'Party'
});

// Item type hooks
Hooks.on('preCreateItem', (item, options, userId) => {
  // Update item images if the default Foundry icon is present
  if (!item.img || item.img === 'icons/svg/item-bag.svg') {
    switch (item.type) {
    case 'niche':
      item.updateSource({img: 'systems/discworld/assets/items/niches.webp'});
      break;
    case 'core':
      item.updateSource({img: 'systems/discworld/assets/items/core.webp'});
      break;
    case 'quirk':
      item.updateSource({img: 'systems/discworld/assets/items/quirks.webp'});
      break;
    case 'trait':
      item.updateSource({img: 'systems/discworld/assets/items/traits.webp'});
      break;
    case 'party':
      item.updateSource({img: 'systems/discworld/assets/items/party.png'});
      break;
    case 'mannerism':
      item.updateSource({img: 'systems/discworld/assets/items/mannerism.webp'});
      break;
    }
  }

  // Define the forbidden items for different actor types
  const actor = item.parent;
  if (!actor || actor.documentName !== 'Actor') return true;

  const actorType = actor.type;
  const forbiddenItemsForCharacter = ['trait', 'party', 'mannerism'];
  const forbiddenItemsForNPC = ['core', 'quirk', 'party'];

  if (actorType === 'character' && forbiddenItemsForCharacter.includes(item.type)) {
    ui.notifications.warn(game.i18n.format('application.actorcannothold', {
      actor: actor.name,
      item: item.type
    }));
    return false;
  }

  if (actorType === 'NPC' && forbiddenItemsForNPC.includes(item.type)) {
    ui.notifications.warn(game.i18n.format('application.actorcannothold', {
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
  game.settings.register('discworld', 'diceButtonPosition', {
    name: 'Screen position of the dice button',
    hint: 'Where on the screen should the dice button be?',
    scope: 'world',
    type: String,
    default: 'BottomRight',
    config: true,
    choices: {
      'BottomRight': 'Bottom Right',
      'TopLeft': 'Top Left',
    }
  });
});

// NPC actor creator script
Hooks.on('createActor', async (actor, options, userId) => {
  if (userId !== game.user?.id) return;
  if (actor?.type !== 'NPC') return;
  if (foundry.utils.getProperty(actor, 'flags.core.sourceId')) return;
  if (options?.fromCompendium || options?.pack) return;
  await NpcCreatorService.runOnce(actor);
});
