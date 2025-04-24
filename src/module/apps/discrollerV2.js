const api = foundry.applications.api;

export class DiscRoller {

  static async DiceRollerButtonV13(event) {
    let diceForm = document.querySelector('.disc-roller-form');
    if (!diceForm) {
      diceForm = document.createElement('div');
      diceForm.classList.add('disc-roller-form');
      diceForm.innerHTML = `
        <form>
          <button type="button" class="roller-button" title="${game.i18n.localize('application.discworlddiceroller')}">
            <img src="systems/discworld/assets/dice/fancy-dice.png" alt="${game.i18n.localize('application.discworlddiceroller')}">
            </button>
        </form>
      `;
      document.body.appendChild(diceForm);

      diceForm.querySelector('.roller-button').addEventListener('click', (ev) => {
        this.CreateDiceRoller(ev);
      });
    }
    this.startPositionUpdater(diceForm);
  }

  static positionDiceRoller(diceForm) {
    const targetButton = document.querySelector(
      'button.collapse.ui-control.plain.icon[class*="fa-caret-"]'
    );
    const buttonRect = targetButton.getBoundingClientRect();
    diceForm.style.position = 'absolute';
    diceForm.style.top = `${buttonRect.bottom + 8}px`;
    diceForm.style.left = `${buttonRect.left}px`;
  }

  static startPositionUpdater(diceForm) {
    const updatePosition = () => {
      this.positionDiceRoller(diceForm);
      requestAnimationFrame(updatePosition);
    };
    requestAnimationFrame(updatePosition);
}

  static async CreateDiceRoller(event) {
    const DiceRollerApp = class extends api.HandlebarsApplicationMixin(api.ApplicationV2) {
      static PARTS = {
        tracker: {
          template: "systems/discworld/templates/apps/discrollerV2.hbs"
        },
      };

      static DEFAULT_OPTIONS = {
        actions: {
          onRollDice: this.prototype._onRollDice,
        },
        form: {
          submitOnChange: true,
          closeOnSubmit: false,
        },
      };

      get title() {
        return `DiscRoller`;
      }

      async _onRollDice(event) {
        event.preventDefault();
        const button = event.target.closest("button");
        const diceType = button.dataset.dice;
        const formula = `1${diceType}`;
        const roll = new Roll(formula);

        await roll.evaluate();

        roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: `${game.i18n.localize('application.rolling')} ${formula}`
        });
      }
    };
    new DiceRollerApp().render(true);
  }
}

Hooks.on('renderSidebar', (controls) => {
    DiscRoller.DiceRollerButtonV13();
});