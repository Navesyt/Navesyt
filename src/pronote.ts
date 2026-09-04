import type { AcademicItem } from './domain';

export interface PronoteClient {
  fetchSchedule(from: string, to: string): Promise<AcademicItem[]>;
  fetchAssignments(from: string, to: string): Promise<AcademicItem[]>;
}

/** MVP adapter. Replace only this module when a local Pronote client is added. */
export const mockPronote: PronoteClient = {
  async fetchSchedule(from) {
    const day = from.slice(0, 10);
    return [
      {
        id: `p-${day}-maths`, origin: 'pronote', kind: 'course',
        title: 'Maths — Analyse', subjectId: 'maths',
        startsAt: `${day}T08:00:00`, endsAt: `${day}T10:00:00`, completed: false,
        externalId: `schedule-${day}-maths`,
      },
      {
        id: `p-${day}-physics`, origin: 'pronote', kind: 'course',
        title: 'Physique — Mécanique', subjectId: 'physics',
        startsAt: `${day}T10:15:00`, endsAt: `${day}T12:15:00`, completed: false,
        externalId: `schedule-${day}-physics`,
      },
    ];
  },

  async fetchAssignments(from) {
    const day = from.slice(0, 10);
    return [{
      id: `p-${day}-ds`, origin: 'pronote', kind: 'DS',
      title: 'DS de maths', subjectId: 'maths',
      startsAt: `${day}T14:00:00`, endsAt: `${day}T16:00:00`, completed: false,
      notes: 'Réviser intégrales et équations différentielles.',
      externalId: `assignment-${day}-ds`,
    }];
  },
};
