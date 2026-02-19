
const api = foundry.applications.api;

export class DiscRoller extends api.HandlebarsApplicationMixin(api.ApplicationV2) {
  static PARTS = {
    tracker: {
      template: 'systems/discworld/templates/apps/discroller.hbs'
    },
  };

  static DEFAULT_OPTIONS = {
    classes: ['dice-roller'],
    actions: {

    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    window: {
      frame: false,
      positioned: false
    },
  };

  constructor(options = {}) {
    super(options);
  }

  static async RollerPosition(event) {
    let rollerForm = document.querySelector('.dice-roller');
    if (!rollerForm) {
      rollerForm = document.createElement('div');
      document.body.appendChild(rollerForm);
    }
    this.startPositionUpdater(rollerForm);
  }

  static positionDiceRoller(rollerForm) {
    const position = game.settings.get('discworld', 'diceButtonPosition');
    rollerForm.style.position = 'absolute';
    const clickable = document.querySelector('.dice-roller');

    let targetButton;
    let buttonRect;

    switch (position) {
    case 'TopLeft':
      targetButton = document.querySelector('#scene-navigation-active');
      buttonRect = targetButton?.getBoundingClientRect();
      trackerForm.style.top = `${buttonRect.top - 18}px`;
      trackerForm.style.left = `${buttonRect.right + 35}px`;
      clickable.style.paddingLeft = '0px';
      break;

    case 'TopRight':
      targetButton = document.querySelector('#sidebar button.fa-comments');
      buttonRect = targetButton?.getBoundingClientRect();
      trackerForm.style.top = `${buttonRect.top - 18}px`;
      trackerForm.style.left = `${buttonRect.left - 165}px`;
      clickable.style.paddingLeft = '130px';
      break;

    case 'BottomLeft':
      targetButton = document.querySelector('#players');
      buttonRect = targetButton?.getBoundingClientRect();
      trackerForm.style.top = `${buttonRect.top - 130}px`;
      trackerForm.style.left = `${buttonRect.left}px`;
      clickable.style.paddingLeft = '0px';
      break;

    case 'BottomRight':
    default:
      targetButton = document.querySelector('#sidebar button.collapse');
      buttonRect = targetButton?.getBoundingClientRect();
      trackerForm.style.top = `${buttonRect.bottom + 4}px`;
      trackerForm.style.left = `${buttonRect.left - 110}px`;
      clickable.style.paddingLeft = '119px';
      break;
    }
  }



  static _onMinimise() {
    document.getElementById('tracker-clickable-minus').classList.add('hide');
    document.getElementById('tracker-clickable-plus').classList.remove('hide');
    document.querySelectorAll('.tracker-container').forEach((el) => el.classList.add('hide'));
  }

  static _onMaximise() {
    document.getElementById('tracker-clickable-plus').classList.add('hide');
    document.getElementById('tracker-clickable-minus').classList.remove('hide');
    document.querySelectorAll('.tracker-container').forEach((el) => el.classList.remove('hide'));
  }


  _onRender(context, options) {

    
  }
}

  Hooks.once('renderSidebar', async function() {
    if (game.DiscRoller) return;
    const roller = new DiscRoller();
    game.DiscRoller = roller;
    await roller.render(true);
  });