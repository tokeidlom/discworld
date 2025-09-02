const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class DiscworldTraitsItem extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {
  static PARTS = {
    itemsheet: {
      template: 'systems/discworld/templates/items/traits.hbs'
    },
  };

  static DEFAULT_OPTIONS = {
    actions: {},
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      height: 'auto',
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
      return `${this.item.name} - Feature`;
    case 'mannerism':
      return `${this.item.name} - Mannerism`;
    }
  }

  async _prepareContext(options) {
    const context = {
      item: this.item,
    };
    return context;
  }
}
