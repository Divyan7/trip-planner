/**
 * A corpus of the ways LLMs actually mangle "return only JSON".
 * Every fixture is fed through extractJson → normalize in tests.
 */

export const VALID = JSON.stringify({
  title: 'Lisbon in 3 days',
  destination: 'Lisbon, Portugal',
  days: [
    {
      dayNumber: 1,
      label: 'Alfama',
      stops: [
        { name: 'São Jorge Castle', time: '09:00', durationMinutes: 90, category: 'culture' },
        { name: 'Fado dinner', time: '20:00', category: 'food' },
      ],
    },
    { dayNumber: 2, label: 'Belém', stops: [{ name: 'Jerónimos Monastery', time: '10:00' }] },
  ],
});

export const FENCED = '```json\n' + VALID + '\n```';

export const PROSE_WRAPPED = `Sure! Here's a wonderful itinerary for your trip:\n\n${VALID}\n\nEnjoy Lisbon — let me know if you'd like changes!`;

export const TRAILING_COMMAS = `{
  "title": "Kyoto weekend",
  "days": [
    { "dayNumber": 1, "stops": [ { "name": "Fushimi Inari", "time": "08:00", }, ], },
  ],
}`;

export const SMART_QUOTES = `{“title”: “Rome dash”, “days”: [{“dayNumber”: 1, “stops”: [{“name”: “Colosseum”}]}]}`;

export const TRUNCATED = `{"title": "Iceland road trip", "days": [{"dayNumber": 1, "stops": [{"name": "Blue Lagoon", "time": "10:00"}, {"name": "Reykjavik old town"}]}, {"dayNumber": 2, "stops": [{"name": "Golden Cir`;

export const WRONG_SHAPE_WRAPPED = JSON.stringify({
  trip: {
    name: 'Tokyo for foodies',
    itinerary: [
      {
        day: 'Day 1',
        activities: [
          { title: 'Tsukiji outer market', when: '07:30', type: 'Food', price: 3000 },
          { title: 'TeamLab Planets', duration: '2h' },
        ],
      },
    ],
  },
});

export const MISSING_NAMES = JSON.stringify({
  title: 'Paris',
  days: [
    {
      dayNumber: 1,
      stops: [{ name: 'Louvre' }, { description: 'lost stop, no name' }, { name: 'Seine walk' }],
    },
  ],
});

export const OVERSIZED = JSON.stringify({
  title: 'World tour',
  days: Array.from({ length: 20 }, (_, i) => ({
    dayNumber: i + 1,
    stops: Array.from({ length: 12 }, (_, j) => ({ name: `Stop ${j + 1}` })),
  })),
});

export const EMPTY_DAYS = JSON.stringify({ title: 'Hmm', days: [] });

export const REFUSAL = `I'm sorry, but I can't plan a trip based on that input. Could you tell me a destination?`;

export const EMPTY_STRING = '';

export const NOT_JSON = 'Day 1: go to the beach. Day 2: hike the volcano.';

export const NESTED_BRACES_IN_STRINGS = JSON.stringify({
  title: 'Berlin { with braces }',
  days: [{ dayNumber: 1, stops: [{ name: 'Museum {Island}', description: 'has } inside' }] }],
});
