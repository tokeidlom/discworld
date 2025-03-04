const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class DiscworldTraitsItem extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {
  static PARTS = {
    itemsheet: {
      template: "systems/discworld/templates/items/traitsV2.hbs"
    },
  };

  static DEFAULT_OPTIONS = {
    actions: {},
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      height: "auto",
      width: 550,
    },
  };

  get title() {
    switch (this.item.type) {
      case 'core':
        return `${this.item.name} - Core`;
      case 'niche':
        return `${this.item.name} - Niche`;
      case 'quirk':
        return `${this.item.name} - Quirk`;
      case 'trait':
        return `${this.item.name} - Trait`;
    }
  }

  async _prepareContext(options) {
    const context = {
      item: this.item,
      enrichedNotes: await TextEditor.enrichHTML(this.item.system.description),
    };
    return context;
  }
}