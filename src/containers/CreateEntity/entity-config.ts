export type EntityKind = "team" | "league" | "organization";

export type EntityField = {
  name: string;
  label: string;
  required?: boolean;
  multiline?: boolean;
  hint?: string;
  type?: "country";
};

export const ENTITY_CONFIG: Record<
  EntityKind,
  {
    title: string;
    intro: string;
    submit: string;
    logo: boolean;
    fields: EntityField[];
  }
> = {
  team: {
    title: "Create a team",
    intro:
      "You become the team admin. You can add other admins and your roster later.",
    submit: "Create team",
    logo: true,
    fields: [
      { name: "name", label: "Team name", required: true },
      { name: "homeCity", label: "Home city" },
      { name: "country", label: "Country", type: "country" },
    ],
  },
  league: {
    title: "Create a league",
    intro:
      "You become the league admin. Your league starts unverified. Athletes only become verified through a league ZediStats has approved.",
    submit: "Create league",
    logo: false,
    fields: [
      { name: "name", label: "League name", required: true },
      { name: "region", label: "Region" },
      { name: "country", label: "Country", type: "country" },
    ],
  },
  organization: {
    title: "Create an organisation",
    intro:
      "You become the organisation admin. It starts unverified until ZediStats approves it.",
    submit: "Create organisation",
    logo: true,
    fields: [
      { name: "name", label: "Organisation name", required: true },
      { name: "country", label: "Country", type: "country" },
      {
        name: "description",
        label: "Description",
        multiline: true,
        hint: "Max 500 characters.",
      },
    ],
  },
};
