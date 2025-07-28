export class DiscworldPartyItem extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 700,
      height: "auto",
      template: "systems/discworld/templates/items/partyV1.hbs",
    });
  }
}