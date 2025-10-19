import { tool } from "ai";
import { z } from "zod";

async function geocodeCity(city: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return null;
    }
    
    const result = data.results[0];
    return {
      latitude: result.latitude,
      longitude: result.longitude,
    };
  } catch {
    return null;
  }
}

export const getWeather = tool({
  description: "Get the current weather at a location. You can provide either coordinates (latitude and longitude) or a city name.",
  inputSchema: z.object({
    latitude: z.number().optional().describe("Latitude coordinate"),
    longitude: z.number().optional().describe("Longitude coordinate"),
    city: z.string().optional().describe("City name (e.g., 'San Francisco', 'New York', 'London')"),
  }).refine(
    (data) => (data.latitude !== undefined && data.longitude !== undefined) || data.city !== undefined,
    { message: "Must provide either (latitude and longitude) or city" }
  ),
  async *execute(input) {
    let latitude: number;
    let longitude: number;
    let cityName: string | undefined;

    if (input.city) {
      // Stream status update
      yield {
        status: 'loading' as const,
        message: `Looking up coordinates for ${input.city}...`,
      };

      const coords = await geocodeCity(input.city);
      if (!coords) {
        return {
          status: 'error' as const,
          error: `Could not find coordinates for "${input.city}". Please check the city name.`,
        };
      }
      latitude = coords.latitude;
      longitude = coords.longitude;
      cityName = input.city;
    } else if (input.latitude !== undefined && input.longitude !== undefined) {
      latitude = input.latitude;
      longitude = input.longitude;
    } else {
      return {
        status: 'error' as const,
        error: 'Must provide either city or both latitude and longitude',
      };
    }

    // Stream status update
    yield {
      status: 'loading' as const,
      message: `Fetching weather data for coordinates (${latitude.toFixed(2)}, ${longitude.toFixed(2)})...`,
    };

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`
    );

    const weatherData = await response.json();
    
    if (cityName) {
      weatherData.cityName = cityName;
    }
    
    // Stream final result
    yield {
      status: 'success' as const,
      message: `Weather data retrieved successfully${cityName ? ` for ${cityName}` : ''}`,
      data: weatherData,
    };
  },
});
