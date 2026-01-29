export class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      pronouns: new fields.StringField({initial: ''}),
      luck: new fields.NumberField({required: true, integer: true, initial: 4}),
      organisation: new fields.StringField({initial: ''}),
      child: new fields.StringField({initial: ''}),
      background: new fields.StringField({initial: ''}),
      consequences: new fields.StringField({initial: ''}),
      notes: new fields.StringField({initial: ''})
    };
  }
}

export class NPCData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      fullname: new fields.StringField({initial: ''}),
      pronouns: new fields.StringField({initial: ''}),
      species: new fields.StringField({initial: ''}),
      mannerism: new fields.StringField({initial: ''}),
      storyprompt: new fields.StringField({initial: ''}),
      notes: new fields.StringField({initial: ''})
    };
  }
}
