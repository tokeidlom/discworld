export class DiscRoller {
  static async Init(controls, html) {
    // Create the main dice roll button
    const diceRollbtn = $(`
      <li class="scene-control discworld-roller" data-control="DiscRoller" title="${game.i18n.localize('application.discworlddiceroller')}">
          <i class="fa-regular fa-hand-holding-magic"></i>
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
        <form>
          <div class="form-group split-row">
            <div class="dice-roll-container">
              <div class="dice-roll-buttons">
                <button type="button" class="roll-button" data-dice="d4">${game.i18n.localize('application.roll')} d4</button>
                <button type="button" class="roll-button" data-dice="d6">${game.i18n.localize('application.roll')} d6</button>
                <button type="button" class="roll-button" data-dice="d8">${game.i18n.localize('application.roll')} d8</button>
                <button type="button" class="roll-button" data-dice="d10">${game.i18n.localize('application.roll')} d10</button>
                <button type="button" class="roll-button" data-dice="d12">${game.i18n.localize('application.roll')} d12</button>
                <button type="button" class="roll-button" data-dice="d20">${game.i18n.localize('application.roll')} d20</button>
                <button type="button" class="roll-button" data-dice="d100">${game.i18n.localize('application.roll')} d100</button>
              </div>
            </div>
          </div>
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
        html.find('.roll-button').click(async (ev) => {
          const button = ev.currentTarget;
          const diceType = button.dataset.dice;
          const formula = `1${diceType}`;
          const roll = new Roll(formula);

          await roll.evaluate({ async: true });

          roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: game.user.character }),
            flavor: `${game.i18n.localize('application.rolling')} ${formula}`
          });
        });
      },
      default: "close"
    });
    dialog.render(true);
  }
}

Hooks.on('renderSceneControls', (controls, html) => {
  console.log('DiscRoller here', html);
  DiscRoller.Init(controls, html);
});
