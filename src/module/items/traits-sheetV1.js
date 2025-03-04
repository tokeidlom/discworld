export class DiscworldTraitsItem extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 550,
      height: 265,
      template: "systems/discworld/templates/items/traitsV1.hbs",
    });
  }
}