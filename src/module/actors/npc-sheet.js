const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class DiscworldNPCSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
  static PARTS = {
    charactersheet: {
      template: 'systems/discworld/templates/actors/npc.hbs'
    },
    limitedsheet: {
      template: 'systems/discworld/templates/actors/limited-sheet.hbs'
    },
  };

  static DEFAULT_OPTIONS = {
    actions: {
      onItemCreate: DiscworldNPCSheet._onItemCreate,
      onItemEdit: DiscworldNPCSheet._onItemEdit,
      onItemDelete: DiscworldNPCSheet._onItemDelete,
      onAutoPopulate: this.prototype._onAutoPopulate,
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      height: 'auto',
      width: 800
    },
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
    const items = this.actor.items?.contents || [];
    const itemsSorted = [...items].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
    const context = {
      actor: this.actor,
      items: itemsSorted,
    };

    return context;
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
    const docCls = getDocumentClass(target.dataset.documentClass || 'Item');
    const type = target.dataset.type || 'item';
    const docData = {
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type: type,
      parent: this.actor,
    };
    for (const [dataKey, value] of Object.entries(target.dataset)) {
      if (['action', 'documentClass'].includes(dataKey)) continue;
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
        height: 'auto',
        width: 350
      },
      buttons: [{
        action: 'yes',
        default: false,
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize('application.yes'),
        callback: async () => {
          await this.actor.deleteEmbeddedDocuments('Item', [itemId]);
        },
      },
      {
        action: 'no',
        default: true,
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize('application.no'),
        callback: (event, button, htmlElement) => {
          const form = htmlElement.querySelector('form');
          return form ? new FormData(form) : null;
        },
      },],
      close: () => null,
    }).render(true);
  }

  // Convert role field to niche item and mannerism field to mannerism item(depreciate later)
  async _convertFields(event) {
    const actor = this.actor;
    if (!actor || this._convertFieldsRunning) return;
    this._convertFieldsRunning = true;

    try {
      const root = this.element ?? document;
      const roleInput = root.querySelector('input[name="system.role"]');
      const roleName = String(roleInput?.value ?? actor.system?.role ?? '').trim();
      const manInput = root.querySelector('input[name="system.mannerism"]');
      const manRaw = String(manInput?.value ?? actor.system?.mannerism ?? '').trim();

      if (roleInput) roleInput.value = '';
      if (manInput) manInput.value = '';

      const clearUpdate = {};
      if (roleName) clearUpdate['system.role'] = '';
      if (manRaw) clearUpdate['system.mannerism'] = '';
      if (Object.keys(clearUpdate).length) await actor.update(clearUpdate);
      if (roleName) {
        const exists = actor.items.some((i) =>
          i.type === 'niche' &&
          i.name.localeCompare(roleName, undefined, {sensitivity: 'accent', usage: 'search'}) === 0
        );
        if (!exists) {
          await actor.createEmbeddedDocuments('Item', [{name: roleName, type: 'niche'}]);
        }
        console.log(`[Discworld] Converted role "${roleName}" into a Niche item for "${actor.name}".`);
      }

      if (manRaw) {
        const entries = manRaw.split(/\r?\n|;/g).map((s) => s.trim()).filter(Boolean);

        const existing = new Set(
          actor.items
            .filter((i) => i.type === 'mannerism')
            .map((i) => i.name.normalize('NFKD').toLocaleLowerCase())
        );

        const batchSeen = new Set();
        const toCreate = [];
        for (const name of entries) {
          const key = name.normalize('NFKD').toLocaleLowerCase();
          if (existing.has(key) || batchSeen.has(key)) continue;
          batchSeen.add(key);
          toCreate.push({name, type: 'mannerism'});
        }

        if (toCreate.length) {
          await actor.createEmbeddedDocuments('Item', toCreate);
          console.log(`[Discworld] Converted mannerism(s) into ${toCreate.length} Mannerism item(s) for "${actor.name}".`);
        }
      }
    } catch (err) {
      console.error(`[Discworld] Error converting fields for actor ${this.actor?.name}:`, err);
    } finally {
      this._convertFieldsRunning = false;
    }
  }

  // Limit to view only for observers
  async _setObserver() {
    const selectors = [
      '.discworld-actor'
    ];

    for (const el of this.element.querySelectorAll(selectors)) {
      el.classList.add('observer');
      el.querySelectorAll('button, input, select, textarea, a, [tabindex]').forEach((ctrl) => {
        if (ctrl.tagName === 'TEXTAREA') ctrl.readOnly = true;
        else if ('disabled' in ctrl) ctrl.disabled = true;
        ctrl.tabIndex = -1;
      });
    }
  }

  async _onRender(context, options) {
    if (this.document?.limited) return;

    if (!this.document.isOwner) this._setObserver();

    if (this.document.isOwner) this._convertFields();

    document.querySelectorAll('.item-name').forEach((input) => {
      input.addEventListener('change', this._onItemNameChange.bind(this));
    });

    const els = Array.from(document.querySelectorAll('.item-name[data-item-id]'));
    for (const el of els) {
      const item = this.actor.items.get(el.dataset.itemId);
      const raw = (item?.system?.description ?? '').trim();
      if (!raw) continue;

      const enriched = await foundry.applications.ux.TextEditor.enrichHTML(raw, {
        async: true,
        documents: true,
        rolls: true,
        secrets: false
      });

      el.setAttribute('data-tooltip', enriched);
      el.setAttribute('data-tooltip-direction', 'UP');
    }

    if (!Array.isArray(this._dragDrophandler) || !this._dragDrophandler.length) {
      this._dragDrophandler = this._createDragDropHandlers();
    }
    this._dragDrophandler.forEach((d) => d.bind(this.element));

    this.element.querySelectorAll('a.edit[data-action="onItemEdit"], a.delete[data-action="onItemDelete"]')?.forEach((li) => {
      li.setAttribute('draggable', 'true');
    });
  }

  _canDragStart(selector) {
    return this.isEditable;
  }
  _canDragDrop(selector) {
    return this.isEditable;
  }

  _onDragStart(event) {
    const docRow = event.currentTarget.closest('li[data-item-id]');
    if (!docRow) return;
    if ('link' in event.target.dataset) return;

    const item = this.actor?.items?.get?.(docRow.dataset.itemId) ?? this._getEmbeddedDocument?.(docRow);
    if (!item) return;

    const dragData = item.toDragData?.() ?? {type: 'Item', uuid: item.uuid};
    event.dataTransfer.effectAllowed = 'copyMove';
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }

  _onDragOver(event) {
    event.preventDefault();
    const li = event.target.closest('li[data-item-id]');
    if (!li) return;
    const r = li.getBoundingClientRect();
    li.dataset.dropPosition = (event.clientY - r.top) < r.height / 2 ? 'before' : 'after';
  }

  async _onDrop(event) {
    const data = foundry.applications.ux.TextEditor.getDragEventData(event);
    const allowed = Hooks.call('dropActorSheetData', this.actor, this, data);
    if (allowed === false) return;

    if (data.type === 'Item') return this._onDropItem(event, data);
  }

  async _onDropItem(event, data) {
    if (!this.actor?.isOwner) return false;

    const item = await Item.implementation.fromDropData(data);
    if (!item) return false;

    if (item.parent?.uuid === this.actor.uuid) {
      return this._onSortItem(event, item);
    }

    const move = event.altKey === true;
    const created = await this._onDropItemCreate(item);

    if (move && item.parent?.isOwner) {
      await item.delete();
    }

    return created;
  }

  async _onDropItemCreate(itemOrData) {
    const arr = Array.isArray(itemOrData) ? itemOrData : [itemOrData];
    const payload = arr.map((d) => {
      const obj = d instanceof Item ? d.toObject() : d;
      delete obj._id;
      return obj;
    });
    return this.actor.createEmbeddedDocuments('Item', payload);
  }

  async _onSortItem(event, item) {
    const container =
      event.target?.closest?.('ul.items') ||
      event.currentTarget?.closest?.('ul.items') ||
      this.element;

    const nodeList = container.querySelectorAll('li[data-item-id]');
    const siblings = Array.from(nodeList)
      .map((el) => this.actor.items.get(el.dataset.itemId))
      .filter(Boolean);

    if (!siblings.length) return false;

    const li = event.target.closest('li[data-item-id]');
    let target = null;
    let before = false;

    if (li) {
      target = this.actor.items.get(li.dataset.itemId) || null;
      before = (li.dataset.dropPosition === 'before');
      if (target?.id === item.id) return false;
    } else {
      target = siblings[siblings.length - 1] || null;
      before = false;
    }

    const sortUpdates = foundry.utils.performIntegerSort(item, {
      target,
      siblings,
      sortKey: 'sort',
      sortBefore: before
    });

    const updates = sortUpdates.map((u) => ({
      _id: u.target.id ?? u.target._id,
      sort: u.update.sort
    })).filter((u) => u._id != null);

    if (!updates.length) return false;

    return this.actor.updateEmbeddedDocuments('Item', updates);
  }

  get dragDrop() {
    return this._dragDrophandler || [];
  }

  _createDragDropHandlers() {
    const cfgs = Array.isArray(this.options?.dragDrop) && this.options.dragDrop.length ?
      this.options.dragDrop :
      [{
        dragSelector: 'a.edit[data-action="onItemEdit"], a.delete[data-action="onItemDelete"]',
        dropSelector: '.window-content, .sheet-body, .tab, ul.items, .drop-zone'
      }];

    return cfgs.map((d) => new foundry.applications.ux.DragDrop({
      ...d,
      permissions: {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      },
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      }
    }));
  }
}
