import {DiscworldCharacterSheet} from './character-sheet.js';

export class DiscworldNPCSheet extends (DiscworldCharacterSheet) {
  static PARTS = {
    charactersheet: {
      template: 'systems/discworld/templates/actors/npc.hbs'
    },
    limitedsheet: {
      template: 'systems/discworld/templates/actors/limited-sheet.hbs'
    },
  };

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
}
