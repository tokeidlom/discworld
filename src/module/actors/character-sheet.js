export class DiscworldCharacterSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["discworld", "sheet", "discworld-actor"],
      width: 800,
      height: 890,
    });
  }

  // If the player is not a GM and has limited permissions - send them to the limited sheet, otherwise, continue as usual.
  get template() {
    if (!game.user.isGM && this.actor.limited) {
      return 'systems/discworld/templates/actors/limited-sheet.hbs';
    }
    return `systems/discworld/templates/actors/character.hbs`;
  }

  getData() {
    const data = super.getData();
    data.maxLuck = game.settings.get('discworld', 'maxNumberOfLuck');
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Listen for changes in the item name input field
    html.find('.item-name').on('change', event => {
      const input = event.currentTarget;
      const itemId = input.dataset.itemId;
      const item = this.actor.items.get(itemId);
      const newName = input.value.trim();

      if (item && newName) {
        item.update({ name: newName });
      }
    });

    // Create new items
    html.find('.control.create').click(async (ev) => {
      ev.preventDefault();
      const header = ev.currentTarget;
      const type = header.dataset.type;
      const data = Object.assign({}, header.dataset);
      const name = `New ${type.capitalize()}`;

      const itemData = {
        name: name,
        type: type,
        data: data,
      };
      delete itemData.data['type'];

      const newItem = await this.actor.createEmbeddedDocuments('Item', [itemData]);
    });

    // Edit items
    html.find('.control .edit').click((ev) => {
      const li = $(ev.currentTarget).parents('.entry');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });

    // Delete items with confirmation dialog
    html.find('.control .delete').click((ev) => {
      const li = $(ev.currentTarget).parents('.entry');
      const itemId = li.data('itemId');

      new Dialog({
        title: `${game.i18n.localize('application.deleteitem')}`,
        content: `<p>${game.i18n.localize('application.deleteconfirm')}</p>`,
        buttons: {
          yes: {
            icon: '<i class="fas fa-check"></i>',
            label: `${game.i18n.localize('application.yes')}`,
            callback: () => this.actor.deleteEmbeddedDocuments('Item', [itemId])
          },
          no: {
            icon: '<i class="fas fa-times"></i>',
            label: `${game.i18n.localize('application.no')}`
          }
        },
        default: "no"
      }).render(true);
    });

    // Luck update functions
    let luckTimeout;
    let oldLuck = parseInt(this.actor.system.luck);

    function updateLuck(input, newLuck, maxLuck) {
      newLuck = Math.max(0, Math.min(newLuck, maxLuck));
      input.value = newLuck;
      input.dispatchEvent(new Event('change'));
    }

    function handleLuckChange(delta) {
      const input = html.find('input[name="system.luck"]')[0];
      let currentLuck = parseInt(input.value) || 0;
      const maxLuck = game.settings.get('discworld', 'maxNumberOfLuck');
      updateLuck(input, currentLuck + delta, maxLuck);
    }

    html.find('.luck-increase').click(() => handleLuckChange(1));
    html.find('.luck-decrease').click(() => handleLuckChange(-1));

    html.find('input[name="system.luck"]').change((ev) => {
      let newLuck = parseInt(ev.target.value);
      const maxLuck = game.settings.get('discworld', 'maxNumberOfLuck');

      if (newLuck > maxLuck) {
        ev.target.value = maxLuck;
        ui.notifications.warn(game.i18n.format("application.exceededmaxluck", { maxLuck: maxLuck }));
        newLuck = maxLuck;
      }

      if (newLuck < 0) {
        ev.target.value = 0;
        ui.notifications.warn(game.i18n.format("application.exceededminluck"));
        newLuck = 0;
      }

      clearTimeout(luckTimeout);

      luckTimeout = setTimeout(() => {
        if (newLuck !== oldLuck) {
          let messageContent = newLuck > oldLuck 
            ? game.i18n.format("application.luckadded", { actorName: this.actor.name, luckAmount: newLuck - oldLuck }) 
            : game.i18n.format("application.luckspent", { actorName: this.actor.name, luckAmount: oldLuck - newLuck });

          oldLuck = newLuck;

          ChatMessage.create({
            content: messageContent,
          });
        }
      }, 1000);
    });

    // Roll dice
    html.find('.roll-button').click(async (ev) => {
      const button = ev.currentTarget;
      const diceType = button.dataset.dice;
      const formula = `1${diceType}`;
      const roll = new Roll(formula);

      await roll.evaluate();

      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `${game.i18n.localize('application.rolling')} ${formula}`
      });
    });
  }
}