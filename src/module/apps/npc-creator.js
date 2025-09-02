function waitForSheetRender(actor, timeoutMs = 30) {
  if (actor.sheet?.rendered) return Promise.resolve();
  return new Promise((resolve) => {
    const to = setTimeout(() => {
      Hooks.off('renderActorSheet', onRender);
      resolve();
    }, timeoutMs);
    function onRender(sheet) {
      if (sheet.actor?.id !== actor.id) return;
      clearTimeout(to);
      Hooks.off('renderActorSheet', onRender);
      resolve();
    }
    Hooks.on('renderActorSheet', onRender);
  });
}

async function promptKeepOrReroll() {
  const res = await foundry.applications.api.DialogV2.prompt({
    window: {title: game.i18n.localize('application.autogeneratenpc'), modal: true, zIndex: 999999},
    content: `<div><p>${game.i18n.localize('application.reviewgeneratednpc')}</p></div>`,
    yes: {action: 'keep', icon: 'fas fa-check'},
    buttons: [
      {action: 'reroll', label: game.i18n.localize('application.reroll'), icon: 'fas fa-dice'},
      {action: 'blank', label: game.i18n.localize('application.blank'), icon: 'fas fa-user'}
    ],
    defaultYes: true
  });
  return (res === true || res === 'yes' || res === 'confirm') ? 'keep' : res;
}

async function restoreSnapshot(actor, snapshot) {
  try {
    const currentIds = actor.items.map((i) => i.id);
    if (currentIds.length) await actor.deleteEmbeddedDocuments('Item', currentIds);
    const snapItems = snapshot.items ?? [];
    if (snapItems.length) await actor.createEmbeddedDocuments('Item', snapItems);

    await actor.update({
      name: snapshot.name,
      img: snapshot.img,
      system: snapshot.system ?? {},
      flags: snapshot.flags ?? {}
    });
  } catch (e) {
    console.error('Restore snapshot failed:', e);
  }
}

export class NpcCreatorService {
  static async runOnce(actor) {
    if (!actor?.isOwner) return;

    if (actor.items?.size > 0) return;

    await waitForSheetRender(actor);

    const first = await foundry.applications.api.DialogV2.confirm({
      window: {title: game.i18n.localize('application.autogeneratenpc'), modal: true, zIndex: 999999},
      content: `<div><p>${game.i18n.localize('application.npcconfirmline')}</p></div>`,
      yes: {label: game.i18n.localize('application.wizard'), icon: 'fas fa-magic'},
      no: {label: game.i18n.localize('application.blank'), icon: 'fas fa-user'},
      defaultYes: false
    });
    if (first === null) return;
    if (first === false) return; 

    const snapshot = actor.toObject();
    let lastGeneratedName = actor.name;

    while (true) {
      lastGeneratedName = (await this.autoPopulate(actor)) ?? actor.name;

      const choice = await promptKeepOrReroll();

      if (choice === null || choice === 'keep') {
        const finalName = lastGeneratedName || actor.name || 'Unnamed Person';
        const msg = game.i18n.has?.('application.creatednpc') ?
          game.i18n.format('application.creatednpc', {name: finalName}) :
          `Created NPC: ${finalName}`;
        ui.notifications?.info?.(msg);
        break;
      }

      if (choice === 'reroll') {
        continue;
      }

      if (choice === 'blank') {
        await restoreSnapshot(actor, snapshot);
        break;
      }

      const finalName = lastGeneratedName || actor.name || 'Unnamed Person';
      ui.notifications?.info?.(
        game.i18n.has?.('application.creatednpc') ?
          game.i18n.format('application.creatednpc', {name: finalName}) :
          `Created NPC: ${finalName}`
      );
      break;
    }
  }

  static async autoPopulate(actor, evt) {
    evt?.preventDefault?.();

    const TABLES = {
      first: {pack: 'discworld.core-rolltables-en', name: 'First Names'},
      last: {pack: 'discworld.core-rolltables-en', name: 'Surnames'},
      nick: {pack: 'discworld.core-rolltables-en', name: 'Sobriquets'},
      species: {pack: 'discworld.core-rolltables-en', name: 'Species'},
      niche: {pack: 'discworld.core-rolltables-en', name: 'Niche'},
      features: {pack: 'discworld.core-rolltables-en', name: 'Notable Feature'},
      mannerism: {pack: 'discworld.core-rolltables-en', name: 'Example Mannerisms'}
    };

    const FIELD_PATHS = {species: 'system.species'};

    const ITEM_TYPES = {
      niche: 'niche',
      trait: 'trait',
      mannerism: 'mannerism'
    };

    const FEATURE_COUNT = 2;

    const safeSet = (obj, path, value) => {
      try {
        foundry.utils.setProperty(obj, path, value); return true;
      } catch {
        return false;
      }
    };

    const resolveItemType = (desired) => {
      if (desired === 'mannerism') return 'mannerism';
      const allowed = new Set(Object.keys(game.system?.model?.Item ?? {}));
      if (allowed.has(desired)) return desired;
      if (desired === 'trait' && allowed.has('feature')) return 'feature';
      return desired;
    };

    const getTableFromCompendium = async (packId, tableName) => {
      const pack = game.packs.get(packId);
      if (!pack) return null;
      const index = await pack.getIndex({fields: ['name', 'type', 'documentName']});
      let entry = index.find((e) => e.name === tableName && (e.type === 'RollTable' || e.documentName === 'RollTable'));
      if (!entry) entry = index.find((e) => e.name === tableName);
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
      if (typeof tableDoc.getResults === 'function') results = await tableDoc.getResults();
      return results ?? [];
    };

    const resolveResultLabel = async (r) => {
      const nm = r?.name ?? null;
      const desc = (typeof r?.description === 'string' && r.description.trim()) ? r.description.trim() : null;
      if (nm) return nm;
      if (desc) return desc;
      if (r?.documentUuid) {
        try {
          const doc = await fromUuid(r.documentUuid); if (doc?.name) return doc.name;
        } catch {}
      }
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
      for (const r of results) {
        roll -= (Number(r.weight) || 1); if (roll <= 0) {
          chosen = r; break;
        }
      }
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

    const nicheType = resolveItemType(ITEM_TYPES.niche);
    const traitType = resolveItemType(ITEM_TYPES.trait);

    const deletionIds = actor.items
      .filter((i) =>
        i.type === 'mannerism' ||
        (nicheType && i.type === nicheType) ||
        (traitType && i.type === traitType) ||
        ['niche', 'feature', 'mannerism'].includes(foundry.utils.getProperty(i, 'flags.discworld.randomizer.kind'))
      )
      .map((i) => i.id);
    if (deletionIds.length) await actor.deleteEmbeddedDocuments('Item', deletionIds);

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
    const species = await pickOneLabel(speciesTable);
    const niche = await pickOneLabel(nicheTable);
    const mannerism = await pickOneLabel(mannerismTable);
    const featureLabels = await pickManyLabels(featuresTable, FEATURE_COUNT);

    if (!first && !last && !nick && !species && !niche && !featureLabels.length && !mannerism) {
      ui.notifications?.warn?.('No values drawn—check your world tables/compendia names.');
      return null;
    }

    const baseName = [first, last].filter(Boolean).join(' ').trim();
    const displayName = nick ? `${baseName} (${nick})` : (baseName || nick || actor.name || 'Unnamed Person');

    const updates = {
      name: displayName,
      flags: {
        discworldRandomizer: {
          nameParts: {first, last, nick},
          species, niche, features: featureLabels, mannerism,
          sources: TABLES,
          timestamp: Date.now()
        }
      }
    };
    if (species) safeSet(updates, FIELD_PATHS.species, species);
    await actor.update(updates);

    const newItems = [];
    if (niche && nicheType) {
      newItems.push({
        name: niche,
        type: nicheType,
        system: {},
        flags: {'discworld.randomizer': {kind: 'niche', sourceTable: TABLES.niche}}
      });
    }
    if (mannerism) {
      newItems.push({
        name: mannerism,
        type: 'mannerism',
        system: {},
        flags: {'discworld.randomizer': {kind: 'mannerism', sourceTable: TABLES.mannerism}}
      });
    }
    if (traitType && featureLabels.length) {
      for (const label of featureLabels) {
        newItems.push({
          name: label,
          type: traitType,
          system: {},
          flags: {'discworld.randomizer': {kind: 'feature', sourceTable: TABLES.features}}
        });
      }
    }

    if (newItems.length) await actor.createEmbeddedDocuments('Item', newItems);

    return displayName;
  }
}
