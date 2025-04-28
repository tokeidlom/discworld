const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class DiscworldCharacterSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {

  static PARTS = {
    charactersheet: {
      template: "systems/discworld/templates/actors/characterV2.hbs"
    },
    limitedsheet: {
      template: "systems/discworld/templates/actors/limited-sheetV2.hbs"
    },
  };

  static DEFAULT_OPTIONS = {
    actions: {
      onItemCreate: DiscworldCharacterSheet._onItemCreate,
      onItemEdit: DiscworldCharacterSheet._onItemEdit,
      onItemDelete: DiscworldCharacterSheet._onItemDelete,
      onIncreaseLuck: this.prototype._onIncreaseLuck,
      onDecreaseLuck: this.prototype._onDecreaseLuck,
      onRollDice: this.prototype._onRollDice,
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      height: "auto",
      width: 800
    },
    dragDrop: [{ dragSelector: "[data-drag]", dropSelector: null }],
  };

  get title() {
    return `${this.actor.name}`;
  }

  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    if (this.document.limited) {
      options.parts = ['limitedsheet'];
    } else {
      options.parts = ['charactersheet'];
    }
  }

  async _prepareContext(options) {
    const context = {
      actor: this.actor,
      items: this.actor.items?.contents || [],
	  maxLuck: game.settings.get('discworld', 'maxNumberOfLuck'),
    };

    return context;
  }

  async _onIncreaseLuck(event) {
    const maxLuck = game.settings.get('discworld', 'maxNumberOfLuck');
    let oldLuck = parseInt(this.actor.system.luck) || 0;
    let newLuck = Math.max(0, Math.min(oldLuck + 1, maxLuck));

    if (newLuck > oldLuck) {
      await this.actor.update({ "system.luck": newLuck });
      this._onLuckChange(1);
    }
  }

  async _onDecreaseLuck(event) {
    const maxLuck = game.settings.get('discworld', 'maxNumberOfLuck');
    let oldLuck = parseInt(this.actor.system.luck) || 0;
    let newLuck = Math.max(0, Math.min(oldLuck - 1, maxLuck));

    if (newLuck < oldLuck) {
      await this.actor.update({ "system.luck": newLuck });
      this._onLuckChange(-1);
    }
  }

  async _onLuckEntry(event) {
    let oldLuck = parseInt(this.actor.system.luck);
    let newLuck = parseInt(event.target.value);
    const maxLuck = game.settings.get('discworld', 'maxNumberOfLuck');

    if (newLuck > maxLuck) {
      event.target.value = maxLuck;
      ui.notifications.warn(game.i18n.format("application.exceededmaxluck", { maxLuck }));
      newLuck = maxLuck;
    }

    if (newLuck < 0) {
      event.target.value = 0;
      ui.notifications.warn(game.i18n.format("application.exceededminluck"));
      newLuck = 0;
    }

    let delta = newLuck - oldLuck;
    await this.actor.update({ "system.luck": newLuck });
    this._onLuckChange(delta);
  }

  async _onLuckChange(delta) {
    this.luckDelta += delta;

    clearTimeout(this.luckTimeout);
    this.luckTimeout = setTimeout(() => {
      if (this.luckDelta !== 0) {
        let messageContent = this.luckDelta > 0
          ? game.i18n.format("application.luckadded", { actorName: this.actor.name, luckAmount: this.luckDelta })
          : game.i18n.format("application.luckspent", { actorName: this.actor.name, luckAmount: Math.abs(this.luckDelta) });

        if (game.settings.get('discworld', 'sendLuckToChat')) {
          ChatMessage.create({ content: messageContent });
        }

        this.luckDelta = 0;
      }
    }, 1000);
  }

  async _onRollDice(event) {
    event.preventDefault();
    const button = event.target.closest("button");
    const diceType = button.dataset.dice;
    const formula = `1${diceType}`;
    const roll = new Roll(formula);

    await roll.evaluate();

    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `${game.i18n.localize('application.rolling')} ${formula}`
    });
  }

  async _onItemNameChange(event) {
    const input = event.currentTarget;
    const itemId = input.dataset.itemId;
    const newName = input.value.trim();
    const item = this.actor.items.get(itemId);
    await item.update({
      name: newName
    });
  }

  static async _onItemCreate(event, target) {
    const docCls = getDocumentClass(target.dataset.documentClass || "Item");
    const type = target.dataset.type || "item";
    const docData = {
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type: type,
      parent: this.actor,
    };
    for (const [dataKey, value] of Object.entries(target.dataset)) {
      if (["action", "documentClass"].includes(dataKey)) continue;
      foundry.utils.setProperty(docData, dataKey, value);
    }
    await docCls.create(docData, {
      parent: this.actor
    });
  }

  static async _onItemEdit(event) {
    const entry = event.target.closest('.entry');
    const itemId = entry.dataset.itemId;
    const item = this.actor.items.get(itemId);
    item.sheet.render(true);
  }

  static async _onItemDelete(event) {
    const entry = event.target.closest('.entry');
    const itemId = entry.dataset.itemId;
    new api.DialogV2({
      window: {
        title: game.i18n.localize('application.deleteitem')
      },
      content: `<p>${game.i18n.localize('application.deleteconfirm')}</p>`,
      position: {
        height: "auto",
        width: 350
      },
      buttons: [{
        action: "yes",
        default: false,
		icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize('application.yes'),
        callback: async () => {
          await this.actor.deleteEmbeddedDocuments('Item', [itemId]);
        },
      },
      {
        action: "no",
        default: true,
		icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize('application.no'),
        callback: (event, button, htmlElement) => {
          const form = htmlElement.querySelector("form");
          return form ? new FormData(form) : null;
        },
      },],
      close: () => null,
    }).render(true);
  }

  _onItemTooltipShow(event) {
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
          const {
            clientX: mouseX,
            clientY: mouseY
          } = event;
          tooltip.style.left = `${mouseX + 10}px`;
          tooltip.style.top = `${mouseY + 10}px`;
          const tooltipRect = tooltip.getBoundingClientRect();
          if (tooltipRect.bottom > window.innerHeight) {
            tooltip.style.top = `${window.innerHeight - tooltipRect.height - 20}px`;
          }
          input._tooltip = tooltip;
        }, 1000);
      }
    }
  }

  _onItemTooltipHide(event) {
    const input = event.currentTarget;
    if (input._tooltipTimeout) {
      clearTimeout(input._tooltipTimeout);
      delete input._tooltipTimeout;
    }
    if (input._tooltip) {
      input._tooltip.remove();
      delete input._tooltip;
    }
  }

  _onRender(context, options) {
    if (this.document.limited) return;

    document.querySelectorAll('.luck-input').forEach(input => {
      input.addEventListener('change', this._onLuckEntry.bind(this));
    });

    document.querySelectorAll('.item-name').forEach(input => {
      input.addEventListener('change', this._onItemNameChange.bind(this));
    });

    document.querySelectorAll('.item-name').forEach(input => {
      input.addEventListener('mouseover', this._onItemTooltipShow.bind(this));
    });

    document.querySelectorAll('.item-name').forEach(input => {
      input.addEventListener('mouseout', this._onItemTooltipHide.bind(this));
    });

    this.#dragDrop.forEach(d => d.bind(this.element));
  }

  #dragDrop;

  constructor(...args) {
    super(...args);
    this.#dragDrop = this.#createDragDropHandlers();
    this.luckTimeout = null;
    this.luckDelta = 0;
  }

  get dragDrop() {
    return this.#dragDrop;
  }

  _canDragStart(selector) {
    return this.isEditable;
  }

  _canDragDrop(selector) {
    return this.isEditable;
  }

  _onDragStart(event) {
    const docRow = event.currentTarget.closest('li');
    if ('link' in event.target.dataset) return;
    let dragData = this._getEmbeddedDocument(docRow)?.toDragData();
    if (!dragData) return;
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }

  _onDragOver(event) {}

  async _onDropItem(event, data) {
    if (!this.actor.isOwner) return false;
    const item = await Item.implementation.fromDropData(data);
    return await this._onDropItemCreate(item, event);
  }

  async _onDropItemCreate(itemData, event) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    return this.actor.createEmbeddedDocuments('Item', itemData);
  }

  #createDragDropHandlers() {
    return this.options.dragDrop.map(d => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      };
      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      };
      return new foundry.applications.ux.DragDrop(d);
    });
  }
}