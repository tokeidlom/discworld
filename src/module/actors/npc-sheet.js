const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class DiscworldNPCSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {

  static PARTS = {
    charactersheet: {
      template: "systems/discworld/templates/actors/npc.hbs"
    },
    limitedsheet: {
      template: "systems/discworld/templates/actors/limited-sheet.hbs"
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

  async _onAutoPopulate(event) {
    event?.preventDefault?.();

    const TABLES = {
      first:     { pack: "discworld.core-rolltables-en", name: "First Names" },
      last:      { pack: "discworld.core-rolltables-en", name: "Surnames" },
      nick:      { pack: "discworld.core-rolltables-en", name: "Sobriquets" },
      species:   { pack: "discworld.core-rolltables-en", name: "Species" },
      niche:     { pack: "discworld.core-rolltables-en", name: "Niche" },
      features:  { pack: "discworld.core-rolltables-en", name: "Notable Feature" },
      mannerism: { pack: "discworld.core-rolltables-en", name: "Example Mannerisms" }
    };

    const FIELD_PATHS = {
      species: "system.species"
    };

    const ITEM_TYPES = {
      niche:     "niche",
      trait:     "trait",
      mannerism: "mannerism"
    };

    const FEATURE_COUNT = 2;
    const safeSet = (obj, path, value) => {
      try { foundry.utils.setProperty(obj, path, value); return true; } catch { return false; }
    };

    const resolveItemType = (desired) => {
      if (desired === "mannerism") return "mannerism";
      const allowed = new Set(Object.keys(game.system?.model?.Item ?? {}));
      if (allowed.has(desired)) return desired;
      if (desired === "trait" && allowed.has("feature")) return "feature";
      return desired;
    };

    const getTableFromCompendium = async (packId, tableName) => {
      const pack = game.packs.get(packId);
      if (!pack) return null;
      const index = await pack.getIndex({ fields: ["name", "type", "documentName"] });
      let entry = index.find(e => e.name === tableName && (e.type === "RollTable" || e.documentName === "RollTable"));
      if (!entry) entry = index.find(e => e.name === tableName);
      if (!entry?._id) return null;
      return await pack.getDocument(entry._id);
    };

    const getTable = async (cfg) => {
      const world = game.tables.getName?.(cfg.name);
      if (world) return world;
      return await getTableFromCompendium(cfg.pack, cfg.name);
    };

    const ensureResultsLoaded = async (tableDoc) => {
      if (!tableDoc) return [];
      let results = tableDoc.results?.contents ?? [];
      if (results?.length) return results;
      if (typeof tableDoc.getResults === "function") results = await tableDoc.getResults();
      return results ?? [];
    };

    const resolveResultLabel = async (r) => {
      const nm = r?.name ?? null;
      const desc = (typeof r?.description === "string" && r.description.trim()) ? r.description.trim() : null;
      if (nm) return nm;
      if (desc) return desc;
      if (r?.documentUuid) { try { const doc = await fromUuid(r.documentUuid); if (doc?.name) return doc.name; } catch {} }
      if (r?.documentCollection && r?.documentId) {
        const coll = game.collections.get(r.documentCollection);
        const doc = coll?.get(r.documentId);
        if (doc?.name) return doc.name;
      }
      return r?.text ?? null;
    };

    const pickOneLabel = async (tableDoc) => {
      const results = await ensureResultsLoaded(tableDoc);
      if (!results.length) return null;
      const total = results.reduce((s, r) => s + (Number(r.weight) || 1), 0);
      let roll = Math.floor(Math.random() * total) + 1;
      let chosen = results[0];
      for (const r of results) { roll -= (Number(r.weight) || 1); if (roll <= 0) { chosen = r; break; } }
      return await resolveResultLabel(chosen);
    };

    const pickManyLabels = async (tableDoc, count) => {
      const results = await ensureResultsLoaded(tableDoc);
      if (!results.length || count <= 0) return [];
      const labels = new Set();
      const max = Math.min(count, results.length);
      while (labels.size < max) {
        const lbl = await pickOneLabel(tableDoc);
        if (lbl) labels.add(lbl);
        if (labels.size < max && labels.size >= results.length) break;
      }
      return Array.from(labels);
    };

    const html = `
      <section class="discworld-confirm">
        <p>${game.i18n.localize("application.npcconfirmline")}</p>
      </section>
    `;
    const proceed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("application.autogeneratenpc") },
      content: html,
      yes: { label: game.i18n.localize("application.yes") },
      no:  { label: game.i18n.localize("application.no") },
      defaultYes: false
    });
    if (!proceed) return;

    const nicheType     = resolveItemType(ITEM_TYPES.niche);
    const traitType     = resolveItemType(ITEM_TYPES.trait);
    const deletionIds = this.actor.items
      .filter(i =>
        i.type === "mannerism" ||
        (nicheType && i.type === nicheType) ||
        (traitType && i.type === traitType) ||
        ["niche","feature","mannerism"].includes(foundry.utils.getProperty(i, "flags.discworld.randomizer.kind"))
      )
      .map(i => i.id);
    if (deletionIds.length) await this.actor.deleteEmbeddedDocuments("Item", deletionIds);

    const [
      firstTable, lastTable, nickTable,
      speciesTable, nicheTable, featuresTable, mannerismTable
    ] = await Promise.all([
      getTable(TABLES.first),
      getTable(TABLES.last),
      getTable(TABLES.nick),
      getTable(TABLES.species),
      getTable(TABLES.niche),
      getTable(TABLES.features),
      getTable(TABLES.mannerism)
    ]);

    const [first, last, nick] = await Promise.all([
      pickOneLabel(firstTable),
      pickOneLabel(lastTable),
      pickOneLabel(nickTable)
    ]);
    const species      = await pickOneLabel(speciesTable);
    const niche        = await pickOneLabel(nicheTable);
    const mannerism    = await pickOneLabel(mannerismTable);
    const featureLabels = await pickManyLabels(featuresTable, FEATURE_COUNT);

    if (!first && !last && !nick && !species && !niche && !featureLabels.length && !mannerism) {
      ui.notifications?.warn?.("No values drawn—check your world tables/compendia names.");
      return;
    }

    const baseName = [first, last].filter(Boolean).join(" ").trim();
    const displayName = nick ? `${baseName} (${nick})` : (baseName || nick || this.actor.name || "Unnamed Person");

    const updates = {
      name: displayName,
      flags: {
        discworldRandomizer: {
          nameParts: { first, last, nick },
          species, niche, features: featureLabels, mannerism,
          sources: TABLES,
          timestamp: Date.now()
        }
      }
    };
    if (species) safeSet(updates, FIELD_PATHS.species, species);
    await this.actor.update(updates);

    const newItems = [];

    if (niche && nicheType) {
      newItems.push({
        name: niche,
        type: nicheType,
        system: {},
        flags: { "discworld.randomizer": { kind: "niche", sourceTable: TABLES.niche } }
      });
    }

    if (mannerism) {
      newItems.push({
        name: mannerism,
        type: "mannerism",
        system: {},
        flags: { "discworld.randomizer": { kind: "mannerism", sourceTable: TABLES.mannerism } }
      });
    }

    if (traitType && featureLabels.length) {
      for (const label of featureLabels) {
        newItems.push({
          name: label,
          type: traitType,
          system: {},
          flags: { "discworld.randomizer": { kind: "feature", sourceTable: TABLES.features } }
        });
      }
    }

    if (newItems.length) await this.actor.createEmbeddedDocuments("Item", newItems);

    ui.notifications?.info?.(`Auto-populated: ${displayName}`);
  }

  // Convert role field to niche item and mannerism field to mannerism item(depreciate later)
  async _convertFields(event) {
    const actor = this.actor;
    if (!actor || this._convertFieldsRunning) return;
    this._convertFieldsRunning = true;

    try {
      const root = this.element ?? document;
      const roleInput = root.querySelector('input[name="system.role"]');
      const roleName  = String(roleInput?.value ?? actor.system?.role ?? "").trim();
      const manInput  = root.querySelector('input[name="system.mannerism"]');
      const manRaw    = String(manInput?.value ?? actor.system?.mannerism ?? "").trim();

      if (roleInput) roleInput.value = "";
      if (manInput)  manInput.value  = "";

      const clearUpdate = {};
      if (roleName) clearUpdate["system.role"] = "";
      if (manRaw)   clearUpdate["system.mannerism"] = "";
      if (Object.keys(clearUpdate).length) await actor.update(clearUpdate);
      if (roleName) {
        const exists = actor.items.some(i =>
          i.type === "niche" &&
          i.name.localeCompare(roleName, undefined, { sensitivity: "accent", usage: "search" }) === 0
        );
        if (!exists) {
          await actor.createEmbeddedDocuments("Item", [{ name: roleName, type: "niche" }]);
        }
        console.log(`[Discworld] Converted role "${roleName}" into a Niche item for "${actor.name}".`);
      }

      if (manRaw) {
        const entries = manRaw.split(/\r?\n|;/g).map(s => s.trim()).filter(Boolean);

        const existing = new Set(
          actor.items
            .filter(i => i.type === "mannerism")
           .map(i => i.name.normalize("NFKD").toLocaleLowerCase())
        );

       const batchSeen = new Set();
        const toCreate = [];
        for (const name of entries) {
          const key = name.normalize("NFKD").toLocaleLowerCase();
          if (existing.has(key) || batchSeen.has(key)) continue;
          batchSeen.add(key);
          toCreate.push({ name, type: "mannerism" });
        }

        if (toCreate.length) {
          await actor.createEmbeddedDocuments("Item", toCreate);
          console.log(`[Discworld] Converted mannerism(s) into ${toCreate.length} Mannerism item(s) for "${actor.name}".`);
        }
      }
    } catch (err) {
      console.error(`[Discworld] Error converting fields for actor ${this.actor?.name}:`, err);
    } finally {
      this._convertFieldsRunning = false;
    }
  }

  _onRender(context, options) {
    if (this.document?.limited) return;

    this._convertFields();

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