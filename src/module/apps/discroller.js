export class DiscRoller {

  // V13 and higher versions dice button hovers next to the scene menu
  static async DiceRollerButtonV13(event) {
    let diceForm = document.querySelector('.disc-roller-form');
    if (!diceForm) {
      diceForm = document.createElement('div');
      diceForm.classList.add('disc-roller-form');
      diceForm.innerHTML = `
        <form>
          <button type="button" class="roller-button" title="${game.i18n.localize('application.discworlddiceroller')}">
            <img src="/systems/discworld/assets/dice/fancy-dice.png" alt="${game.i18n.localize('application.discworlddiceroller')}">
          </button>
        </form>
      `;
      document.body.appendChild(diceForm);

      diceForm.querySelector('.roller-button').addEventListener('click', (ev) => {
        this.CreateDiceRoller(ev);
      });
    }
  }

  // V12 and lower versions dice append to scene controls menu
  static async Init(controls, html) {
    if (html.find('.scene-control.discworld-roller').length === 0) {
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
  }

  static async CreateDiceRoller(event) {
    const dialog = new Dialog({
      title: `${game.i18n.localize('application.discworlddiceroller')}`,
      content: `
        <form class="dice-roller-container">
          <button type="button" class="roller-button" data-dice="d4">
            <img src="/systems/discworld/assets/dice/d4.png" alt="d4" class="dice-icon">
            ${game.i18n.localize('application.roll')} d4
          </button>
          <button type="button" class="roller-button" data-dice="d6">
            <img src="/systems/discworld/assets/dice/d6.png" alt="d6" class="dice-icon">
            ${game.i18n.localize('application.roll')} d6
          </button>
          <button type="button" class="roller-button" data-dice="d8">
            <img src="/systems/discworld/assets/dice/d8.png" alt="d8" class="dice-icon">
            ${game.i18n.localize('application.roll')} d8
          </button>
          <button type="button" class="roller-button" data-dice="d10">
            <img src="/systems/discworld/assets/dice/d10.png" alt="d10" class="dice-icon">
            ${game.i18n.localize('application.roll')} d10
          </button>
          <button type="button" class="roller-button" data-dice="d12">
            <img src="/systems/discworld/assets/dice/d12.png" alt="d12" class="dice-icon">
            ${game.i18n.localize('application.roll')} d12
          </button>
          <button type="button" class="roller-button" data-dice="d20">
            <img src="/systems/discworld/assets/dice/d20.png" alt="d20" class="dice-icon">
            ${game.i18n.localize('application.roll')} d20
          </button>
          <button type="button" class="roller-button" data-dice="d100">
            <img src="/systems/discworld/assets/dice/d100.png" alt="d100" class="dice-icon">
            ${game.i18n.localize('application.roll')} d100
          </button>
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
    }, {
      width: 220
    });
    dialog.render(true);
  }
}

Hooks.on('getSceneControlButtons', controls => {
  if (isVersion13OrHigher()) {
    DiscRoller.DiceRollerButtonV13();
  } else {
    Hooks.on('renderSceneControls', (controls, html) => {
      DiscRoller.Init(controls, html);
    });
  }
});

function isVersion13OrHigher() {
  const version = game.version || game.data.version;
  return parseInt(version.split('.')[0]) >= 13;
}