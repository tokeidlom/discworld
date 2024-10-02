export class DiscworldNPCSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["discworld", "sheet", "npc"],
      template: "systems/discworld/templates/actors/npc.hbs",
      width: 800,
      height: 500,
    });
  }

  getData() {
    const data = super.getData();
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Create new items
    html.find('.control.create').click((ev) => {
      ev.preventDefault();
      const header = ev.currentTarget;
      const type = header.dataset.type;
      const data = Object.assign({}, header.dataset); // Convert dataset into a regular object
      const name = `New ${type.capitalize()}`;

      const itemData = {
        name: name,
        type: type,
        data: data,
      };
      delete itemData.data['type'];

      return this.actor.createEmbeddedDocuments('Item', [itemData]);
    });

    // Edit items
    html.find('.control .edit').click((ev) => {
      const li = $(ev.currentTarget).parents('.entry');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });

    // Delete items with confirmation dialog
    html.find('.control .delete').click((ev) => {
      const li = $(ev.currentTarget).parents('.entry');
      const itemId = li.data('itemId');

      new Dialog({
        title: `${game.i18n.localize('application.deleteitem')}`,
        content: `<p>${game.i18n.localize('application.deleteconfirm')}</p>`,
        buttons: {
          yes: {
            icon: '<i class="fas fa-check"></i>',
            label: `${game.i18n.localize('application.yes')}`,
            callback: () => this.actor.deleteEmbeddedDocuments('Item', [itemId])
          },
          no: {
            icon: '<i class="fas fa-times"></i>',
            label: `${game.i18n.localize('application.no')}`
          }
        },
        default: "no"
      }).render(true);
    });
  }
}
Hooks.once('init', async function() {
  console.log("Discworld | Registering custom NPC sheet");

  await loadTemplates([
    "systems/discworld/templates/actors/npc.hbs"
  ]);

  Actors.registerSheet("core", DiscworldNPCSheet, {
    types: ["NPC"],
    makeDefault: true
  });
});
