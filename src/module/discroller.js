export class DiscRoller {
  static async Init(controls, html) {
    // Create the main dice roll button
    const diceRollbtn = $(`
      <li class="scene-control discworld-roller" data-control="DiscRoller" title="Discworld Dice Roller">
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
      title: "Discworld Dice Roller",
      content: `
        <form>
          <div class="form-group split-row">
            <div class="dice-roll-container">
              <div class="dice-roll-buttons">
                <button type="button" class="roll-button" data-dice="d4">Roll d4</button>
                <button type="button" class="roll-button" data-dice="d6">Roll d6</button>
                <button type="button" class="roll-button" data-dice="d8">Roll d8</button>
                <button type="button" class="roll-button" data-dice="d10">Roll d10</button>
                <button type="button" class="roll-button" data-dice="d12">Roll d12</button>
                <button type="button" class="roll-button" data-dice="d20">Roll d20</button>
                <button type="button" class="roll-button" data-dice="d100">Roll d100</button>
              </div>
            </div>
          </div>
		  <br>
        </form>
      `,
      buttons: {
        close: {
          label: "Close",
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
            flavor: `Rolling ${formula}`
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
