export class DiscRoller {
  static async Init(controls, html) {
    // Create the main dice roll button
    const diceRollbtn = $(`
      <li class="scene-control discworld-roller" data-control="DiscRoller" title="${game.i18n.localize('application.discworlddiceroller')}">
        <img src="/systems/discworld/assets/dice/fancy-dice.png" alt="${game.i18n.localize('application.discworlddiceroller')}" class="custom-icon">
        <ol class="nested-buttons sub-controls control-tools"></ol>
      </li>
    `);

    html.find('.main-controls').append(diceRollbtn);

    diceRollbtn.on('click', (ev) => {
      this.CreateDiceRoller(ev);
    });
  }

  static async CreateDiceRoller(event) {
    const dialog = new Dialog({
      title: `${game.i18n.localize('application.discworlddiceroller')}`,
      content: `
        <form class="dice-roll-container">
          <button type="button" class="roller-button" data-dice="d4">
            <img src="/systems/discworld/assets/dice/dice.png" alt="d4" class="dice-icon">
            ${game.i18n.localize('application.roll')} d4
          </button>
          <button type="button" class="roller-button" data-dice="d6">
            <img src="/systems/discworld/assets/dice/dice.png" alt="d6" class="dice-icon">
            ${game.i18n.localize('application.roll')} d6
          </button>
          <button type="button" class="roller-button" data-dice="d8">
            <img src="/systems/discworld/assets/dice/fancy-dice.png" alt="d8" class="dice-icon">
            ${game.i18n.localize('application.roll')} d8
          </button>
          <button type="button" class="roller-button" data-dice="d10">
            <img src="/systems/discworld/assets/dice/dice.png" alt="d10" class="dice-icon">
            ${game.i18n.localize('application.roll')} d10
          </button>
          <button type="button" class="roller-button" data-dice="d12">
            <img src="/systems/discworld/assets/dice/dice.png" alt="d12" class="dice-icon">
            ${game.i18n.localize('application.roll')} d12
          </button>
          <button type="button" class="roller-button" data-dice="d20">
            <img src="/systems/discworld/assets/dice/dice.png" alt="d20" class="dice-icon">
            ${game.i18n.localize('application.roll')} d20
          </button>
          <button type="button" class="roller-button" data-dice="d100">
            <img src="/systems/discworld/assets/dice/dice.png" alt="d100" class="dice-icon">
            ${game.i18n.localize('application.roll')} d100
          </button>
          <br>
        </form>
      `,
      buttons: {
        close: {
          label: `${game.i18n.localize('application.close')}`,
          callback: () => {}
        }
      },
      render: html => {
        html.find('.roller-button').click(async (ev) => {
          const button = ev.currentTarget;
          const diceType = button.dataset.dice;
          const formula = `1${diceType}`;
          const roll = new Roll(formula);

          await roll.evaluate();

          roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: game.user.character }),
            flavor: `${game.i18n.localize('application.rolling')} ${formula}`
          });
        });
      },
      default: "close"
	},
	{
	width: 220
    });
    dialog.render(true);
  }
}

Hooks.on('renderSceneControls', (controls, html) => {
  console.log('DiscRoller here', html);
  DiscRoller.Init(controls, html);
});
