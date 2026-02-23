export class DiscRoller {
  static async DiceRoller(event) {
    // Create the dice roller element
    const diceForm = document.createElement('div');
    diceForm.className = 'dice-roller';
    diceForm.innerHTML = `
      <div class="row">
        <button type="button" class="roller-button d8" data-dice="d8">d8</button>
      </div>
      <div class="row">
        <button type="button" class="roller-button d4" data-dice="d4">d4</button>
        <button type="button" class="roller-button d6" data-dice="d6">d6</button>
      </div>
      <div class="row">
        <button type="button" class="roller-button d10" data-dice="d10">d10</button>
        <button type="button" class="roller-button d12" data-dice="d12">d12</button>
      </div>
      <div class="row">
        <button type="button" class="roller-button d20" data-dice="d20">d20</button>
        <button type="button" class="roller-button d100" data-dice="d100">d100</button>
      </div>
    `;

    document.body.appendChild(diceForm);

    this.positionDiceRoller(diceForm);
    
    const updatePosition = () => {
      this.positionDiceRoller(diceForm);
      requestAnimationFrame(updatePosition);
    };
    requestAnimationFrame(updatePosition);

    diceForm.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', (event) => {
        const diceType = button.dataset.dice;
        if (diceType) {
          const formula = `1${diceType}`;
          const roll = new Roll(formula);
          roll.evaluate().then(async () => {
            const messageData = {
              content: `
                <div class="chat-card">
                  <div class="rolled">
                    <div class="formula">${game.i18n.localize('application.rolling')} ${diceType}</div>
                    <div class="result">${roll.total}</div>
                  </div>
                </div>
              `,
              flags: {
                'core.canPopout': true
              }
            };
            await roll.toMessage(messageData);
          });
        }
      });
    });
  }

  static positionDiceRoller(diceForm) {
    const position = game.settings.get('discworld', 'diceButtonPosition');
    diceForm.style.position = 'absolute';

    let targetButton;
    let buttonRect;

    switch (position) {
      case 'TopLeft': {
        targetButton = document.querySelector('#scene-navigation-active');
        buttonRect = targetButton?.getBoundingClientRect();
        diceForm.style.top = `${buttonRect.top}px`;
        diceForm.style.left = `${buttonRect.right + 36}px`;
        break;
      }
      case 'TopRight':
        targetButton = document.querySelector('#sidebar button.fa-comments');
        buttonRect = targetButton?.getBoundingClientRect();
        diceForm.style.top = `${buttonRect.top - 16}px`;
        diceForm.style.left = `${buttonRect.left - 165}px`;
        break;
      case 'BottomLeft':
        targetButton = document.querySelector('#players');
        buttonRect = targetButton?.getBoundingClientRect();
        diceForm.style.top = `${buttonRect.top - 180}px`;
        diceForm.style.left = `${buttonRect.left}px`;
        break;
      case 'BottomRight':
      default: {
        targetButton = document.querySelector('#sidebar button.collapse');
        buttonRect = targetButton?.getBoundingClientRect();
        diceForm.style.top = `${buttonRect.bottom + 8}px`;
        diceForm.style.left = `${buttonRect.left - 120}px`;
        break;
      }
    }
  }
}

Hooks.on('renderSidebar', (controls) => {
  DiscRoller.DiceRoller();
});
