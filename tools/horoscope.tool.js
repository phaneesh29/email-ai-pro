import { createHoroscopeAgent } from '../agents/horoscope.agent.js';

const horoscopeAgent = createHoroscopeAgent();

const horoscopeTool = horoscopeAgent.asTool({
	toolName: 'horoscope_reading',
	toolDescription: 'Use for Vedic astrology, Janma Kundali, Lagna, Rashi, Nakshatra, Vimshottari Dasha, Gotra estimate, Graha Sthiti, Yogas, Navamsha, Hora, and Kundali Milan requests. Pass the full user request, including name, date, time, and birthplace when available. The tool must ask for missing birth place/time and must not fabricate exact chart values without reliable calculation data.',
});

export { horoscopeTool };
