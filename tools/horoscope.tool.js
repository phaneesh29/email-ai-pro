import { createHoroscopeAgent } from '../agents/horoscope.agent.js';

const horoscopeAgent = createHoroscopeAgent();

const horoscopeTool = horoscopeAgent.asTool({
	toolName: 'horoscope_reading',
	toolDescription: 'Vedic astrology readings: Kundali, Lagna, Rashi, Nakshatra, Dasha, Yogas, Navamsha, compatibility. Searches real ephemeris data before interpreting. Pass full user request with birth details.',
});

export { horoscopeTool };
