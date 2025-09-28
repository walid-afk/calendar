export type Employee = {
  id: string;
  label: string;      // ex: "Lucie"
  avatarUrl?: string; // optionnel
  pronoun?: string;   // ex: "ELLE", "IL"
};

export type SlotOption = {
  start: string;      // ISO
  end: string;        // ISO
  display: string;    // "HH:mm"
  employeeId?: string; // renseigné pour "Sans préférence"
};
