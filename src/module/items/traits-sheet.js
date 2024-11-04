export class DiscworldTraitsItem extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["discworld", "sheet", "discworld-trait"],
      width: 550,
      height: 265,
      template: "systems/discworld/templates/items/traits.hbs",
    });
  }
}