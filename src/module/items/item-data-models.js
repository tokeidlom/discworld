export class TraitData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      description: new fields.StringField({ initial: "" })
    };
  }
}

export class QuirkData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      description: new fields.StringField({ initial: "" })
    };
  }
}

export class CoreData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      description: new fields.StringField({ initial: "" })
    };
  }
}

export class NicheData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      description: new fields.StringField({ initial: "" })
    };
  }
}

export class PartyData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      organisation: new fields.StringField({ initial: "" }),
      goal: new fields.StringField({ initial: "" }),
      partypast: new fields.StringField({ initial: "" }),
      partypresent: new fields.StringField({ initial: "" })
    };
  }
}

export class MannerismData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      description: new fields.StringField({ initial: "" })
    };
  }
}