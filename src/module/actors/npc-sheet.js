export class DiscworldNPCSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["discworld", "sheet", "discworld-actor"],
      width: 800,
      height: 490,
    });
  }

  // If the player is not a GM and has limited permissions - send them to the limited sheet, otherwise, continue as usual.
  get template() {
    if (!game.user.isGM && this.actor.limited) {
      return 'systems/discworld/templates/actors/limited-sheet.hbs';
    }
    return `systems/discworld/templates/actors/npc.hbs`;
  }

  render(force = false, options = {}) {
    if (!game.user.isGM && this.actor.limited) {
      options = foundry.utils.mergeObject(options, { width: 800, height: 370 });
    }
    return super.render(force, options);
  }

  getData() {
    const data = super.getData();
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

    // Item popout tooltip of description
    html.find('.item-name').on('mouseover', event => {
      const input = event.currentTarget;
      const itemId = input.dataset.itemId;
      const item = this.actor.items.get(itemId);

      if (item) {
        const description = item.system.description?.trim().replace(/\n/g, '<br>');

        if (description) {
          input._tooltipTimeout = setTimeout(() => {
            let tooltip = document.querySelector('.item-tooltip');
            if (!tooltip) {
              tooltip = document.createElement('div');
              tooltip.classList.add('item-tooltip');
              document.body.appendChild(tooltip);
            }

            tooltip.innerHTML = `${description}`;

            const { clientX: mouseX, clientY: mouseY } = event;
            tooltip.style.left = `${mouseX + 10}px`;
            tooltip.style.top = `${mouseY + 10}px`;

            document.body.appendChild(tooltip);
            const tooltipRect = tooltip.getBoundingClientRect();

            if (tooltipRect.bottom > window.innerHeight) {
              tooltip.style.top = `${window.innerHeight - tooltipRect.height - 20}px`;
            }

            input._tooltip = tooltip;
          }, 1000);
        }
      }
    });

    html.find('.item-name').on('mouseout', event => {
      const input = event.currentTarget;

      if (input._tooltipTimeout) {
        clearTimeout(input._tooltipTimeout);
        delete input._tooltipTimeout;
      }

      if (input._tooltip) {
        document.body.removeChild(input._tooltip);
        delete input._tooltip;
      }
    });
  }
}