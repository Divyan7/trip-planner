import { ProviderError, type ChatMessage, type CompleteOptions, type Provider } from './types';

/**
 * Deterministic provider with fault injection and dynamic fixture generation.
 *  1. Works out of the box with no API key for ANY destination.
 *  2. Failure modes for testing: prompt starting with "fail:<mode>".
 *     Modes: fail:malformed | fail:shape | fail:empty | fail:slow |
 *            fail:refusal | fail:500 | fail:429 | fail:auth | fail:repair
 */
export function mockProvider(): Provider {
  return {
    name: 'mock',
    model: 'mock-fixtures',
    async complete(messages: ChatMessage[], { signal }: CompleteOptions): Promise<string> {
      const user = messages.find((m) => m.role === 'user')?.content ?? '';
      let mode = user.match(/fail:(\w+)/)?.[1];
      const isRepairAttempt = messages.some((m) => m.role === 'assistant');
      if (mode === 'repair') mode = isRepairAttempt ? undefined : 'shape';

      await delay(mode === 'slow' ? 45_000 : 700, signal);

      switch (mode) {
        case 'malformed':
          return 'Here is your itinerary!\n```json\n{"title": "Broken trip", "days": [{"dayNumber": 1, "stops": [{"name": "First stop", "time": "09:00"},';
        case 'shape':
          return JSON.stringify({ completely: 'wrong', shape: [1, 2, 3] });
        case 'empty':
          return '';
        case 'refusal':
          return "I'm sorry, I can't help with that request.";
        case '500':
          throw new ProviderError('PROVIDER', 'Mock provider returned HTTP 500.');
        case '429':
          throw new ProviderError('RATE_LIMIT', 'Mock rate limit hit.');
        case 'auth':
          throw new ProviderError('AUTH', 'Mock rejected the API key.');
        default:
          return JSON.stringify(getMockItinerary(user));
      }
    },
  };
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        reject(abortError());
      },
      { once: true },
    );
  });
}

function abortError(): Error {
  const e = new Error('Aborted');
  e.name = 'AbortError';
  return e;
}

function getMockItinerary(userText: string) {
  // Extract user text inside triple quotes if present, handling all line endings
  let rawPrompt = userText;
  const match = userText.match(/"""\s*([\s\S]*?)\s*"""/);
  if (match && match[1]) {
    rawPrompt = match[1];
  }
  rawPrompt = rawPrompt.trim();
  const lower = rawPrompt.toLowerCase();

  if (lower.includes('andhra') || lower.includes('vizag') || lower.includes('visakhapatnam') || lower.includes('tirupati') || lower.includes('vijayawada')) return ANDHRA_FIXTURE;
  if (lower.includes('goa')) return GOA_FIXTURE;
  if (lower.includes('mumbai') || lower.includes('bombay')) return MUMBAI_FIXTURE;
  if (lower.includes('delhi')) return DELHI_FIXTURE;
  if (lower.includes('kerala') || lower.includes('kochi') || lower.includes('munnar')) return KERALA_FIXTURE;
  if (lower.includes('hyderabad')) return HYDERABAD_FIXTURE;
  if (lower.includes('paris')) return PARIS_FIXTURE;
  if (lower.includes('tokyo')) return TOKYO_FIXTURE;
  if (lower.includes('new york') || lower.includes('nyc')) return NYC_FIXTURE;
  if (lower.includes('rome')) return ROME_FIXTURE;
  if (lower.includes('london')) return LONDON_FIXTURE;
  if (lower.includes('lisbon')) return LISBON_FIXTURE;

  return generateDynamicFixture(rawPrompt);
}

function generateDynamicFixture(rawPrompt: string) {
  const daysMatch = rawPrompt.match(/(\d+)\s*days?/i);
  let numDays = daysMatch ? parseInt(daysMatch[1], 10) : 3;
  if (numDays < 1) numDays = 1;
  if (numDays > 7) numDays = 7;

  let clean = rawPrompt
    .replace(/fail:\w+/gi, '')
    .replace(/\b(\d+)\s*days?\b/gi, '')
    .replace(/\b(in|for|trip|to|a|the|with|and|kids|family|food|focused|budget|relaxed|road|day|state|country)\b/gi, ' ')
    .replace(/[^\w\s]/g, ' ')
    .trim();

  const words = clean.split(/\s+/).filter((w) => w.length > 1);
  let destinationName = words
    .slice(0, 3)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  if (!destinationName || destinationName.length < 2) {
    destinationName = 'Your Destination';
  }

  const dayTemplates = [
    {
      label: `Capital City & ${destinationName} Grand Heritage`,
      stops: [
        { name: `${destinationName} Historic Fortress & Palace`, description: `Explore the premier ancient architectural centerpiece and royal heritage grounds of ${destinationName}.`, time: '09:00', durationMinutes: 120, category: 'culture', cost: 'standard entry', tip: 'Arrive at opening time for the clearest views of the central courtyard.' },
        { name: `Traditional ${destinationName} Bistro & Feast`, description: `Savor signature regional specialties, traditional thalis/dishes, and authentic local appetizers.`, time: '12:30', durationMinutes: 60, category: 'food', cost: 'moderate', tip: 'Pair your meal with the famous regional beverage or dessert.' },
        { name: `Panoramic ${destinationName} Summit Viewpoint`, description: `Enjoy sweeping 360-degree views over the landscapes and valleys of ${destinationName}.`, time: '15:30', durationMinutes: 90, category: 'nature', cost: 'free', tip: 'Sunset brings a fantastic golden hour glow across the scenery.' },
        { name: `${destinationName} Evening Promenade & Cultural Walk`, description: `Relaxing evening stroll through historic avenues lined with cafes and street music.`, time: '18:30', durationMinutes: 90, category: 'activity', cost: 'free', tip: 'Popular gathering spot for local musicians and night markets.' },
      ],
    },
    {
      label: `${destinationName} Culture, Arts & Local Bazaars`,
      stops: [
        { name: `National Museum & Art Gallery of ${destinationName}`, description: `Immerse yourself in centuries of regional history, royal jewels, and ancient artifacts.`, time: '10:00', durationMinutes: 120, category: 'culture', cost: 'ticket required', tip: 'Guided audio tours highlight the rarest exhibits.' },
        { name: `${destinationName} Central Spice & Handicraft Market`, description: `Browse lively street stalls filled with handcrafted souvenirs, spices, textiles, and local artwork.`, time: '13:00', durationMinutes: 90, category: 'shopping', cost: 'free entry', tip: 'Support local artisans by picking up handmade gifts.' },
        { name: `Artisan Tea & Dessert Lounge`, description: `Relax with local tea blends, artisanal coffee, and warm fresh pastries.`, time: '15:30', durationMinutes: 60, category: 'food', cost: 'inexpensive', tip: 'Try the house specialty dessert.' },
      ],
    },
    {
      label: `Scenic Nature Reserves & Coastal/Hill Vistas`,
      stops: [
        { name: `${destinationName} Botanical Gardens & Valley Trail`, description: `Walk along scenic shaded forest pathways, ancient trees, and colorful botanical gardens.`, time: '09:30', durationMinutes: 120, category: 'nature', cost: 'nominal fee', tip: 'Comfortable walking shoes are recommended.' },
        { name: `Lake & Waterfront Promenade`, description: `Relax by the pristine waterfront or take a scenic boat cruise across the lake.`, time: '13:00', durationMinutes: 90, category: 'activity', cost: 'moderate', tip: 'Boating options include pedal boats and motorized cruises.' },
        { name: `Traditional Sunset Restaurant`, description: `Conclude your day with authentic ${destinationName} recipes and candlelit outdoor dining.`, time: '19:30', durationMinutes: 120, category: 'food', cost: 'moderate', tip: 'Reserve a table by the water or terrace in advance.' },
      ],
    },
    {
      label: `${destinationName} Hidden Gems & Spiritual Sites`,
      stops: [
        { name: `Ancient Temple & Sacred Heritage Site`, description: `Visit one of ${destinationName}'s most sacred, tranquil, and architecturally stunning places of worship.`, time: '09:00', durationMinutes: 90, category: 'culture', cost: 'free', tip: 'Remember to dress respectfully when entering temple grounds.' },
        { name: `Old Town Cafe & Bakery`, description: `Charming spot for morning coffee, fresh fruit juices, and local delicacies.`, time: '11:00', durationMinutes: 60, category: 'food', cost: 'inexpensive', tip: 'Outdoor seating offers great people-watching.' },
      ],
    },
  ];

  const days = [];
  for (let i = 0; i < numDays; i++) {
    const template = dayTemplates[i % dayTemplates.length];
    days.push({
      dayNumber: i + 1,
      label: template.label,
      stops: template.stops,
    });
  }

  return {
    title: `${destinationName} in ${numDays} days`,
    destination: destinationName,
    summary: `Unforgettable heritage, local cuisine, scenic nature, and cultural highlights of ${destinationName}.`,
    days,
  };
}

const LISBON_FIXTURE = {
  title: 'Lisbon in 3 days',
  destination: 'Lisbon, Portugal',
  summary: 'Miradouros, pastéis de nata, and fado — a compact taste of the city on seven hills.',
  days: [
    {
      dayNumber: 1,
      label: 'Alfama & the castle',
      stops: [
        { name: 'São Jorge Castle', description: 'Moorish castle with the best panoramic view over the rooftops and the Tagus.', time: '09:00', durationMinutes: 90, category: 'culture', cost: '€15', tip: 'Arrive at opening to beat both the heat and the tour groups.' },
        { name: 'Alfama wandering', description: "Get purposely lost in Lisbon's oldest district — laundry lines, tiled facades, tiny squares.", time: '11:00', durationMinutes: 90, category: 'activity', cost: 'free', tip: 'Miradouro de Santa Luzia is the postcard viewpoint.' },
        { name: 'Lunch at Ti-Natércia', description: 'Tiny family-run tasca; grilled fish and stews.', time: '13:00', durationMinutes: 60, category: 'food', cost: '€12-18', tip: 'Cash only; go before 13:30 or queue.' },
        { name: 'Fado at Tasca do Chico', description: 'Standing-room fado bar in Bairro Alto — raw and local, not a tourist show.', time: '21:00', durationMinutes: 90, category: 'nightlife', cost: '€10 + drinks', tip: 'No reservations; slip in between sets.' },
      ],
    },
    {
      dayNumber: 2,
      label: 'Belém & the river',
      stops: [
        { name: 'Jerónimos Monastery', description: 'Manueline masterpiece and UNESCO site; the cloister is the highlight.', time: '09:30', durationMinutes: 90, category: 'culture', cost: '€18', tip: 'Book a timed slot online — the walk-up line is brutal.' },
        { name: 'Pastéis de Belém', description: 'The original 1837 custard tart bakery, still using the secret recipe.', time: '11:15', durationMinutes: 30, category: 'food', cost: '€1.50 each', tip: 'Skip the takeaway line; table service is faster.' },
        { name: 'MAAT Museum', description: 'Striking riverside art and technology museum you can walk over.', time: '12:30', durationMinutes: 75, category: 'culture', cost: '€11', tip: 'The rooftop walkway is free even without a ticket.' },
        { name: 'Sunset at Ponto Final', description: 'Cross the river to Cacilhas for dinner at the water’s edge facing the city.', time: '19:00', durationMinutes: 120, category: 'food', cost: '€20-30', tip: 'Take the ferry from Cais do Sodré; reserve an outdoor table.' },
      ],
    },
    {
      dayNumber: 3,
      label: 'Sintra day trip',
      stops: [
        { name: 'Pena Palace', description: 'Technicolor Romanticist palace in the Sintra hills.', time: '09:30', durationMinutes: 120, category: 'culture', cost: '€20', tip: 'Take the first train from Rossio (~40 min) and go straight to Pena before the crowds.' },
        { name: 'Quinta da Regaleira', description: 'Gothic estate with the famous initiation well and tunnel gardens.', time: '13:00', durationMinutes: 90, category: 'culture', cost: '€12', tip: 'Enter the well from the top and exit through the grotto.' },
        { name: 'Travesseiros at Piriquita', description: 'Sintra’s pillow-shaped almond pastries, warm from the oven.', time: '15:00', durationMinutes: 30, category: 'food', cost: '€2-4', tip: 'Piriquita II up the hill has the same pastries and no line.' },
      ],
    },
  ],
};

const PARIS_FIXTURE = {
  title: 'Paris in 3 days',
  destination: 'Paris, France',
  summary: 'Iconic landmarks, world-class art, charming cafes, and sunset along the Seine.',
  days: [
    {
      dayNumber: 1,
      label: 'Eiffel Tower & The Seine',
      stops: [
        { name: 'Eiffel Tower', description: 'The iconic symbol of Paris offering spectacular panoramic city views.', time: '09:00', durationMinutes: 120, category: 'culture', cost: '€28', tip: 'Book summit tickets online well in advance.' },
        { name: 'Champ de Mars Stroll', description: 'Picturesque park grounds leading away from the Eiffel Tower.', time: '11:15', durationMinutes: 45, category: 'nature', cost: 'free', tip: 'Great spot for classic photo angles.' },
        { name: 'Lunch at Cafe de Flore', description: 'Classic Parisian café in Saint-Germain-des-Prés.', time: '12:30', durationMinutes: 75, category: 'food', cost: '€25-40', tip: 'Try the hot chocolate and croque monsieur.' },
        { name: 'Seine River Cruise', description: 'Glide past Notre-Dame, Louvre, and historic bridges.', time: '18:00', durationMinutes: 60, category: 'activity', cost: '€16', tip: 'Sunset cruises offer the best lighting for photos.' },
      ],
    },
    {
      dayNumber: 2,
      label: 'Louvre & Le Marais',
      stops: [
        { name: 'Louvre Museum', description: 'Home to the Mona Lisa, Venus de Milo, and centuries of masterpieces.', time: '09:30', durationMinutes: 180, category: 'culture', cost: '€22', tip: 'Enter via the Porte des Lions entrance to bypass main pyramid lines.' },
        { name: 'Tuileries Garden Walk', description: 'Formal French gardens connecting the Louvre to Place de la Concorde.', time: '13:00', durationMinutes: 45, category: 'nature', cost: 'free', tip: 'Grab a chair by the central fountain to relax.' },
        { name: 'Le Marais Exploration', description: 'Trendy district with cobblestone alleys, boutiques, and falafel shops.', time: '14:30', durationMinutes: 120, category: 'shopping', cost: 'free', tip: 'L’As du Fallafel on Rue des Rosiers is a must.' },
      ],
    },
    {
      dayNumber: 3,
      label: 'Montmartre & Sacré-Cœur',
      stops: [
        { name: 'Sacré-Cœur Basilica', description: 'Stunning white basilica crowning the hill of Montmartre.', time: '09:30', durationMinutes: 90, category: 'culture', cost: 'free', tip: 'Climb the dome for one of the highest views in Paris.' },
        { name: 'Place du Tertre', description: 'Vibrant square filled with local painters and portrait artists.', time: '11:15', durationMinutes: 60, category: 'activity', cost: 'free', tip: 'Watch artists work before picking up souvenirs.' },
      ],
    },
  ],
};

const TOKYO_FIXTURE = {
  title: 'Tokyo in 3 days',
  destination: 'Tokyo, Japan',
  summary: 'Ancient temples, neon skyscrapers, futuristic tech, and incredible gastronomy.',
  days: [
    {
      dayNumber: 1,
      label: 'Asakusa & Ueno',
      stops: [
        { name: 'Senso-ji Temple', description: 'Tokyo’s oldest Buddhist temple entered through the iconic Kaminarimon Gate.', time: '08:30', durationMinutes: 90, category: 'culture', cost: 'free', tip: 'Visit Nakamise street for traditional snacks like melonpan.' },
        { name: 'Ueno Park & Ameyoko', description: 'Sprawling park and bustling open-air market street.', time: '11:00', durationMinutes: 120, category: 'shopping', cost: 'free', tip: 'Great place for affordable street food and souvenirs.' },
        { name: 'Ramen Street at Tokyo Station', description: 'Underground avenue lined with top-tier ramen shops.', time: '13:30', durationMinutes: 45, category: 'food', cost: '¥1100', tip: 'Buy your ramen ticket at the vending machine before queuing.' },
      ],
    },
    {
      dayNumber: 2,
      label: 'Shibuya, Harajuku & Shinjuku',
      stops: [
        { name: 'Meiji Jingu Shrine', description: 'Serene Shinto shrine enveloped in a massive forested park.', time: '09:00', durationMinutes: 90, category: 'culture', cost: 'free', tip: 'Write a wish on an ema wooden plaque.' },
        { name: 'Takeshita Street, Harajuku', description: 'Center of Japanese youth fashion, cosplay, and giant crepes.', time: '11:00', durationMinutes: 90, category: 'shopping', cost: 'free', tip: 'Try a Marion Crepe filled with fresh fruit and cream.' },
        { name: 'Shibuya Crossing & Sky', description: 'The famous scramble crossing and open-air rooftop observation deck.', time: '15:00', durationMinutes: 90, category: 'activity', cost: '¥2200', tip: 'Sunset at Shibuya Sky requires booking weeks ahead.' },
      ],
    },
    {
      dayNumber: 3,
      label: 'TeamLab & Ginza',
      stops: [
        { name: 'teamLab Planets', description: 'Immersive digital art museum where you walk through water.', time: '09:30', durationMinutes: 120, category: 'culture', cost: '¥3800', tip: 'Wear shorts or pants that easily roll up above the knee.' },
        { name: 'Ginza Shopping & Dining', description: 'High-end department stores and legendary sushi restaurants.', time: '13:00', durationMinutes: 120, category: 'shopping', cost: 'varies', tip: 'On weekends main Ginza avenue is pedestrian-only.' },
      ],
    },
  ],
};

const NYC_FIXTURE = {
  title: 'New York City in 3 days',
  destination: 'New York, USA',
  summary: 'Skyscrapers, Broadway lights, Central Park green space, and iconic bagels.',
  days: [
    {
      dayNumber: 1,
      label: 'Midtown Landmarks',
      stops: [
        { name: 'Empire State Building', description: 'Art Deco icon with panoramic 360-degree views of Manhattan.', time: '09:00', durationMinutes: 90, category: 'culture', cost: '$44', tip: 'Visit early morning to avoid the elevator queues.' },
        { name: 'Grand Central Terminal', description: 'Historic transportation hub with celestial ceiling art.', time: '11:00', durationMinutes: 45, category: 'culture', cost: 'free', tip: 'Try the Whispering Gallery outside the Oyster Bar.' },
        { name: 'Times Square & Broadway', description: 'The neon heart of New York City and theater district.', time: '19:00', durationMinutes: 120, category: 'nightlife', cost: 'varies', tip: 'Visit TKTS booth for discounted Broadway tickets.' },
      ],
    },
    {
      dayNumber: 2,
      label: 'Central Park & Museums',
      stops: [
        { name: 'Central Park Stroll', description: 'Bethesda Terrace, Bow Bridge, and Strawberry Fields.', time: '09:30', durationMinutes: 120, category: 'nature', cost: 'free', tip: 'Rent a bike or rowboat at the Loeb Boathouse.' },
        { name: 'The Metropolitan Museum of Art', description: 'One of the world’s largest and finest art museums.', time: '12:00', durationMinutes: 180, category: 'culture', cost: '$30', tip: 'Don’t miss the Cantor Roof Garden view over Central Park.' },
      ],
    },
    {
      dayNumber: 3,
      label: 'Lower Manhattan & Brooklyn Bridge',
      stops: [
        { name: 'Statue of Liberty & Ellis Island', description: 'Iconic monument to freedom in New York Harbor.', time: '09:00', durationMinutes: 180, category: 'culture', cost: '$24.50', tip: 'Book crown access months in advance if interested.' },
        { name: 'Brooklyn Bridge Walk', description: 'Walk across the historic suspension bridge into DUMBO.', time: '14:00', durationMinutes: 60, category: 'activity', cost: 'free', tip: 'Grab pizza at Juliana’s or Grimaldi’s in DUMBO afterwards.' },
      ],
    },
  ],
};

const ROME_FIXTURE = {
  title: 'Rome in 3 days',
  destination: 'Rome, Italy',
  summary: 'Ancient ruins, Renaissance grandeur, gelato, and timeless piazzas.',
  days: [
    {
      dayNumber: 1,
      label: 'Ancient Rome',
      stops: [
        { name: 'The Colosseum', description: 'The monumental amphitheater of ancient gladiator battles.', time: '08:30', durationMinutes: 120, category: 'culture', cost: '€18', tip: 'Combined ticket includes Palatine Hill and Roman Forum.' },
        { name: 'Roman Forum & Palatine Hill', description: 'The political and social center of the ancient Roman Empire.', time: '11:00', durationMinutes: 120, category: 'culture', cost: 'included', tip: 'Bring a refillable water bottle; public fountains line the grounds.' },
        { name: 'Gelato at Giolitti', description: 'Rome’s oldest and most famous gelateria near the Pantheon.', time: '15:00', durationMinutes: 30, category: 'food', cost: '€3.50', tip: 'Pay at the register first, then present your receipt at the counter.' },
      ],
    },
    {
      dayNumber: 2,
      label: 'Vatican City & Trastevere',
      stops: [
        { name: 'Vatican Museums & Sistine Chapel', description: 'Michelangelo’s legendary ceiling and vast papal collections.', time: '08:30', durationMinutes: 180, category: 'culture', cost: '€20', tip: 'Strict dress code: shoulders and knees must be covered.' },
        { name: 'St. Peter’s Basilica', description: 'The spiritual center of Catholicism with Bernini’s baldachin.', time: '12:00', durationMinutes: 60, category: 'culture', cost: 'free', tip: 'Climb the dome for a bird’s-eye view of St. Peter’s Square.' },
      ],
    },
    {
      dayNumber: 3,
      label: 'Piazzas & Fountains',
      stops: [
        { name: 'Trevi Fountain', description: 'Baroque masterpiece fountain where tossing a coin guarantees your return.', time: '09:00', durationMinutes: 45, category: 'culture', cost: 'free', tip: 'Toss a coin over your left shoulder with your right hand.' },
        { name: 'Pantheon', description: 'The best-preserved ancient Roman temple with its miraculous open dome.', time: '10:30', durationMinutes: 60, category: 'culture', cost: '€5', tip: 'Look up at the oculus — rainy days create a waterfall inside.' },
      ],
    },
  ],
};

const LONDON_FIXTURE = {
  title: 'London in 3 days',
  destination: 'London, UK',
  summary: 'Royal palaces, world-class free museums, West End shows, and Thames views.',
  days: [
    {
      dayNumber: 1,
      label: 'Westminster & Royals',
      stops: [
        { name: 'Big Ben & Houses of Parliament', description: 'Gothic revival clock tower and seat of UK government.', time: '09:00', durationMinutes: 60, category: 'culture', cost: 'free', tip: 'Best view is from Westminster Bridge.' },
        { name: 'Westminster Abbey', description: 'Coronation church of British monarchs since 1066.', time: '10:30', durationMinutes: 90, category: 'culture', cost: '£27', tip: 'Verger-guided tours are well worth the small extra fee.' },
        { name: 'Buckingham Palace Changing of the Guard', description: 'Traditional ceremony of royal guards in red tunics.', time: '11:00', durationMinutes: 45, category: 'activity', cost: 'free', tip: 'Arrive by 10:15 for a spot near the gates.' },
      ],
    },
    {
      dayNumber: 2,
      label: 'British Museum & West End',
      stops: [
        { name: 'The British Museum', description: 'Vast collection of global human history including the Rosetta Stone.', time: '10:00', durationMinutes: 180, category: 'culture', cost: 'free', tip: 'Book free timed entry ticket online in advance.' },
        { name: 'Covent Garden Market', description: 'Street performers, boutique shops, and outdoor cafes.', time: '14:00', durationMinutes: 90, category: 'shopping', cost: 'free', tip: 'Watch street performers in the lower courtyard.' },
      ],
    },
    {
      dayNumber: 3,
      label: 'Tower of London & Southbank',
      stops: [
        { name: 'Tower of London', description: 'Historic fortress housing the Crown Jewels and Yeoman Warders.', time: '09:00', durationMinutes: 150, category: 'culture', cost: '£33.60', tip: 'Join a Beefeater tour immediately upon entry.' },
        { name: 'Tower Bridge Walk', description: 'Iconic Victorian bridge with glass floor walkways.', time: '12:00', durationMinutes: 60, category: 'activity', cost: '£12.30', tip: 'Walk across the lower span for free.' },
      ],
    },
  ],
};

const ANDHRA_FIXTURE = {
  title: 'Highlights of Andhra Pradesh in 3 days',
  destination: 'Andhra Pradesh, India',
  summary: 'Sacred temples, coastal vistas, Araku hill station, and authentic spicy Andhra thalis.',
  days: [
    {
      dayNumber: 1,
      label: 'Visakhapatnam Coastal Charm',
      stops: [
        { name: 'RK Beach & Submarine Museum', description: 'Walk along Ramakrishna Beach and tour the INS Kursura, a real decommissioned submarine museum.', time: '09:00', durationMinutes: 120, category: 'culture', cost: '₹70', tip: 'Go inside the submarine early to avoid queue lines.' },
        { name: 'Kailasagiri Hilltop Park', description: 'Scenic ropeway ride up the hill for panoramic views of the Bay of Bengal.', time: '11:30', durationMinutes: 90, category: 'nature', cost: '₹100', tip: 'Take the ropeway up for the best coastal views.' },
        { name: 'Spicy Andhra Meals at Venkatadri Vantiollu', description: 'Authentic traditional Andhra thali served on a banana leaf with Gongura pachadi and ghee.', time: '13:15', durationMinutes: 60, category: 'food', cost: '₹200-350', tip: 'Don’t miss the spicy Gongura pickle and gun powder (podi).' },
        { name: 'Rushikonda Beach Water Sports', description: 'Golden sand beach ideal for swimming, surfing, and speedboat rides.', time: '16:00', durationMinutes: 120, category: 'activity', cost: '₹300', tip: 'Sunset at Rushikonda is spectacular.' },
      ],
    },
    {
      dayNumber: 2,
      label: 'Araku Valley & Borra Caves',
      stops: [
        { name: 'Vizag to Araku Vistadome Train', description: 'Breathtaking train journey through 84 tunnels and lush Eastern Ghats mountain ranges.', time: '07:00', durationMinutes: 180, category: 'transit', cost: '₹750', tip: 'Book Vistadome glass-roof seats 60 days in advance.' },
        { name: 'Borra Caves Exploration', description: 'One of India’s deepest million-year-old limestone caves illuminated with colorful lights.', time: '11:00', durationMinutes: 90, category: 'nature', cost: '₹110', tip: 'Wear non-slip footwear as cave paths can be damp.' },
        { name: 'Araku Coffee Plantation & Tribal Museum', description: 'Sample world-famous organic Araku Valley Arabica coffee and learn local tribal history.', time: '13:30', durationMinutes: 90, category: 'culture', cost: '₹50', tip: 'Buy freshly roasted Araku coffee beans to take home.' },
      ],
    },
    {
      dayNumber: 3,
      label: 'Vijayawada Heritage & Temples',
      stops: [
        { name: 'Kanaka Durga Temple', description: 'Sacred hill shrine situated on Indrakeeladri Hill overlooking the Krishna River.', time: '08:30', durationMinutes: 90, category: 'culture', cost: 'free', tip: 'Take the direct lift or ropeway for quick access.' },
        { name: 'Undavalli Rock-Cut Caves', description: 'Ancient 4th-century monolith caves featuring a massive reclining Lord Vishnu statue.', time: '11:00', durationMinutes: 75, category: 'culture', cost: '₹25', tip: 'The top level offers a great view over the surrounding paddy fields.' },
        { name: 'Prakasam Barrage & River Sunset', description: 'Iconic 1.2km bridge structure spanning the Krishna River, lit up beautifully at dusk.', time: '17:30', durationMinutes: 90, category: 'activity', cost: 'free', tip: 'Try local Andhra sweets like Pootharekulu near the river promenade.' },
      ],
    },
  ],
};

const GOA_FIXTURE = {
  title: 'Goa Beach & Heritage in 3 days',
  destination: 'Goa, India',
  summary: 'Golden beaches, Portuguese churches, spice plantations, and vibrant beach shacks.',
  days: [
    {
      dayNumber: 1,
      label: 'North Goa Beaches & Forts',
      stops: [
        { name: 'Fort Aguada & Lighthouse', description: '17th-century Portuguese fort standing on Sinquerim Beach overlooking the Arabian Sea.', time: '09:00', durationMinutes: 90, category: 'culture', cost: '₹50', tip: 'Visit early for cool sea breezes and clear photo opportunities.' },
        { name: 'Baga & Calangute Beach', description: 'Famous beach stretch known for water sports, beach shacks, and sunbeds.', time: '11:30', durationMinutes: 150, category: 'activity', cost: 'free', tip: 'Grab lunch at Britto’s for fresh Goan fish curry rice.' },
        { name: 'Anjuna Sunset & Beach Shack Dinner', description: 'Watch the sunset over the Arabian sea while listening to live acoustic tunes.', time: '18:00', durationMinutes: 120, category: 'nightlife', cost: '₹500-1000', tip: 'Curlies or Purple Martini offer sunset views.' },
      ],
    },
    {
      dayNumber: 2,
      label: 'Old Goa & Panjim Heritage',
      stops: [
        { name: 'Basilica of Bom Jesus', description: 'UNESCO World Heritage site holding the mortal remains of St. Francis Xavier.', time: '09:30', durationMinutes: 75, category: 'culture', cost: 'free', tip: 'Marvel at the intricate Baroque architecture and gilded altars.' },
        { name: 'Fontainhas Latin Quarter Walk', description: 'Colorful Portuguese-style villas, narrow streets, and quaint art galleries in Panjim.', time: '11:30', durationMinutes: 90, category: 'culture', cost: 'free', tip: 'Stop by Joseph Bar for local Goan feni cocktails.' },
      ],
    },
    {
      dayNumber: 3,
      label: 'Spice Plantation & Waterfalls',
      stops: [
        { name: 'Sahakari Spice Farm Tour', description: 'Walk through lush cardamom, vanilla, and pepper plantations with traditional Goan lunch.', time: '10:00', durationMinutes: 120, category: 'nature', cost: '₹500', tip: 'Includes an authentic buffet lunch served on banana leaves.' },
        { name: 'Mandovi River Sunset Cruise', description: 'Evening boat cruise featuring traditional Goan folk dances and music.', time: '18:00', durationMinutes: 60, category: 'activity', cost: '₹500', tip: 'Board at Panjim jetty by 17:30.' },
      ],
    },
  ],
};

const MUMBAI_FIXTURE = {
  title: 'Mumbai Highlights in 3 days',
  destination: 'Mumbai, India',
  summary: 'Colonial heritage, Marine Drive, Bollywood culture, and famous street food.',
  days: [
    {
      dayNumber: 1,
      label: 'South Mumbai Heritage',
      stops: [
        { name: 'Gateway of India', description: 'Monumental arch overlooking Mumbai Harbour built in 1911.', time: '09:00', durationMinutes: 60, category: 'culture', cost: 'free', tip: 'Early morning is best to beat crowds and photobombers.' },
        { name: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)', description: 'UNESCO Victorian Gothic railway station landmark.', time: '10:30', durationMinutes: 45, category: 'culture', cost: 'free', tip: 'View the grand façade from across the main intersection.' },
        { name: 'Vada Pav at Aram Soda Fountain', description: 'Sample Mumbai’s favorite iconic street snack.', time: '11:30', durationMinutes: 30, category: 'food', cost: '₹30', tip: 'Pair with hot garlic chutney and fried green chili.' },
        { name: 'Marine Drive Sunset (Queen’s Necklace)', description: 'Curved coastal boulevard along Back Bay.', time: '18:00', durationMinutes: 90, category: 'nature', cost: 'free', tip: 'Sit on the promenade wall as streetlights turn on.' },
      ],
    },
    {
      dayNumber: 2,
      label: 'Elephanta Caves & Colaba',
      stops: [
        { name: 'Elephanta Caves Ferry & Tour', description: 'Ancient rock-cut cave temples dedicated to Lord Shiva on Elephanta Island.', time: '09:00', durationMinutes: 240, category: 'culture', cost: '₹260 ferry + entry', tip: 'Ferries depart from Gateway of India pier.' },
        { name: 'Shopping at Colaba Causeway', description: 'Bustling street market for jewelry, clothes, antiques, and souvenirs.', time: '15:00', durationMinutes: 90, category: 'shopping', cost: 'varies', tip: 'Bargaining is expected at street stalls.' },
      ],
    },
    {
      dayNumber: 3,
      label: 'Bandra & Bollywood Vibe',
      stops: [
        { name: 'Bandra Bandstand & Fort', description: 'Coastal walkway past celebrity homes with views of the Bandra-Worli Sea Link.', time: '10:00', durationMinutes: 90, category: 'activity', cost: 'free', tip: 'Great view of the sea link bridge.' },
        { name: 'Cafe Mondegar or Leopold Cafe', description: 'Iconic heritage retro cafes with jukeboxes and cold beer.', time: '13:00', durationMinutes: 75, category: 'food', cost: '₹600-1000', tip: 'Try the chili cheese toast and iced tea.' },
      ],
    },
  ],
};

const DELHI_FIXTURE = {
  title: 'Delhi Heritage in 3 days',
  destination: 'Delhi, India',
  summary: 'Mughal monuments, vibrant bazaars, spicy street food, and historic gardens.',
  days: [
    {
      dayNumber: 1,
      label: 'Old Delhi & Mughal Grandeur',
      stops: [
        { name: 'Red Fort (Lal Qila)', description: 'Massive red sandstone Mughal fortress complex.', time: '09:00', durationMinutes: 120, category: 'culture', cost: '₹50', tip: 'Closed on Mondays.' },
        { name: 'Jama Masjid & Chandni Chowk Rikshaw Ride', description: 'India’s largest mosque and bustling market streets.', time: '11:30', durationMinutes: 90, category: 'culture', cost: '₹150 rickshaw', tip: 'Try Paranthe Wali Gali for stuffed parathas.' },
        { name: 'Jalebi Wala Old Delhi', description: 'Famous 1884 shop serving thick hot jalebis cooked in pure ghee.', time: '13:30', durationMinutes: 30, category: 'food', cost: '₹100', tip: 'Best enjoyed fresh and piping hot.' },
      ],
    },
    {
      dayNumber: 2,
      label: 'Humayun’s Tomb & Qutub Minar',
      stops: [
        { name: 'Humayun’s Tomb', description: 'UNESCO Persian-style garden tomb that inspired the Taj Mahal.', time: '09:30', durationMinutes: 90, category: 'culture', cost: '₹50', tip: 'Stroll around the surrounding Isa Khan tomb complex as well.' },
        { name: 'Qutub Minar Complex', description: '73-meter tall victory tower and 4th-century rust-resistant iron pillar.', time: '12:00', durationMinutes: 90, category: 'culture', cost: '₹50', tip: 'The intricate stone carvings on the tower base are astounding.' },
      ],
    },
    {
      dayNumber: 3,
      label: 'New Delhi & Lodhi Gardens',
      stops: [
        { name: 'India Gate & Kartavya Path', description: 'War memorial arch and lush lawns in the heart of New Delhi.', time: '09:30', durationMinutes: 60, category: 'culture', cost: 'free', tip: 'Ice cream vendors along the lawns are a evening staple.' },
        { name: 'Lodhi Garden Walk', description: 'Peaceful park containing 15th-century Sayyid and Lodi dynasty tombs.', time: '11:00', durationMinutes: 90, category: 'nature', cost: 'free', tip: 'Ideal spot for birdwatching and photography.' },
      ],
    },
  ],
};

const KERALA_FIXTURE = {
  title: 'Kerala Backwaters & Hills in 3 days',
  destination: 'Kerala, India',
  summary: 'Munnar tea gardens, Alleppey houseboat cruises, Fort Kochi heritage, and fresh seafood.',
  days: [
    {
      dayNumber: 1,
      label: 'Fort Kochi Heritage & Chinese Nets',
      stops: [
        { name: 'Chinese Fishing Nets at Fort Kochi', description: 'Iconic cantilevered fishing nets operating along the waterfront since the 14th century.', time: '09:00', durationMinutes: 60, category: 'culture', cost: 'free', tip: 'Watch fishermen lower the heavy wooden nets.' },
        { name: 'Mattancherry Palace & Jew Town', description: 'Portuguese palace with Hindu murals and historic spice trading market.', time: '10:30', durationMinutes: 120, category: 'culture', cost: '₹20', tip: 'Browse antique shops along Jew Town road.' },
      ],
    },
    {
      dayNumber: 2,
      label: 'Alleppey Backwater Houseboat',
      stops: [
        { name: 'Alleppey Backwaters Houseboat Cruise', description: 'Glide along coconut-lined canals and serene lagoons on a traditional Kettuvallam boat.', time: '11:30', durationMinutes: 300, category: 'activity', cost: '₹4000-8000', tip: 'Includes authentic Karimeen (pearl spot fish) lunch cooked onboard.' },
      ],
    },
    {
      dayNumber: 3,
      label: 'Munnar Tea Plantations',
      stops: [
        { name: 'Tata Tea Museum & Plantation Walk', description: 'Rolls of emerald green tea bushes stretching across mountain slopes.', time: '09:30', durationMinutes: 120, category: 'nature', cost: '₹120', tip: 'Sample fresh cardamom tea at the tasting counter.' },
        { name: 'Mattupetty Dam & Echo Point', description: 'Scenic lake surrounded by eucalyptus hills.', time: '12:30', durationMinutes: 90, category: 'nature', cost: '₹50', tip: 'Shout your name at Echo Point to hear clear echoes across the hills.' },
      ],
    },
  ],
};

const HYDERABAD_FIXTURE = {
  title: 'Hyderabad Royal Heritage & Biryani in 3 days',
  destination: 'Hyderabad, India',
  summary: 'Charminar, Nizam palaces, Golconda Fort, and world-famous Hyderabadi Biryani.',
  days: [
    {
      dayNumber: 1,
      label: 'Charminar & Nizam Palaces',
      stops: [
        { name: 'Charminar & Laad Bazaar', description: '16th-century iconic monument and famous bangles market.', time: '09:00', durationMinutes: 90, category: 'culture', cost: '₹25', tip: 'Climb the upper minarets for views over Old City.' },
        { name: 'Chowmahalla Palace', description: 'Opulent palace of the Nizams featuring grand chandeliers and vintage cars.', time: '11:00', durationMinutes: 90, category: 'culture', cost: '₹100', tip: 'Don’t miss the Durbar Hall (Khilwat).' },
        { name: 'Hyderabadi Biryani at Paradise or Shadab', description: 'Savor world-famous aromatic Dum Biryani with mirchi ka salan.', time: '13:00', durationMinutes: 60, category: 'food', cost: '₹300-500', tip: 'Pair with Irani Chai and Osmania biscuits.' },
      ],
    },
    {
      dayNumber: 2,
      label: 'Golconda Fort & Qutb Shahi Tombs',
      stops: [
        { name: 'Golconda Fort Exploration', description: 'Massive hilltop fortress famous for acoustic claps and diamond vaults.', time: '09:00', durationMinutes: 150, category: 'culture', cost: '₹25', tip: 'Clap at the entrance dome — the sound carries 1km up to the hilltop palace!' },
        { name: 'Qutb Shahi Tombs', description: 'Domed royal tombs set in landscaped gardens near Golconda.', time: '12:00', durationMinutes: 90, category: 'culture', cost: '₹20', tip: 'Intricate Islamic and Persian stone archways.' },
      ],
    },
    {
      dayNumber: 3,
      label: 'Hussain Sagar & Ramoji',
      stops: [
        { name: 'Hussain Sagar Lake & Buddha Statue', description: 'Boating to the world’s tallest monolithic Buddha statue in the middle of the lake.', time: '10:00', durationMinutes: 90, category: 'nature', cost: '₹100 boat', tip: 'Evening laser show at Lumbini Park nearby is lovely.' },
      ],
    },
  ],
};


