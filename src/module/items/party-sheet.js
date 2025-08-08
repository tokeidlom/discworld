const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class DiscworldPartyItem extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {
  static PARTS = {
    itemsheet: {
      template: "systems/discworld/templates/items/party.hbs"
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
      width: 700,
    },
  };

  get title() {
    return 'Party';
  }

  async _prepareContext(options) {
    const context = {
      item: this.item,
    };
    return context;
  }
}