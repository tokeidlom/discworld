export class DiscworldTraitsItem extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["discworld", "sheet", "core", "niche", "quirk", "trait"],
      width: 550,
      height: 80,
      template: "systems/discworld/templates/items/traits.hbs",
    });
  }
}

Hooks.once('init', async function() {
  console.log("Discworld | Registering custom Core-Item sheet");

  Items.registerSheet("discworld", DiscworldTraitsItem, {
    types: ["core", "trait", "quirk", "niche"],
    makeDefault: true
  });
});