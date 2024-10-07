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
Hooks.on("preCreateItem", (item, options, userId) => {
  if ((!item.img || item.img === "icons/svg/item-bag.svg") && (item.type === "niche")) {
    item.updateSource({
      img: "systems/discworld/assets/items/niches.webp"
    });
  } else if ((!item.img || item.img === "icons/svg/item-bag.svg") && (item.type === "core")) {
    item.updateSource({
      img: "systems/discworld/assets/items/core.webp"
    });
  } else if ((!item.img || item.img === "icons/svg/item-bag.svg") && (item.type === "quirk")) {
    item.updateSource({
      img: "systems/discworld/assets/items/quirks.webp"
    });
  } else if ((!item.img || item.img === "icons/svg/item-bag.svg") && (item.type === "trait")) {
    item.updateSource({
      img: "systems/discworld/assets/items/traits.webp"
    });
  }
});
