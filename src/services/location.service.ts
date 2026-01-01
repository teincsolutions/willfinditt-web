import api from './api';

export interface Country {
  id: string;
  name: string;
  code: string;
  phoneCode?: string;
  currency?: string;
  currencySymbol?: string;
}

export interface State {
  id: string;
  name: string;
  countryId: string;
}

export interface City {
  id: string;
  name: string;
  stateId: string;
}

export const getCountries = async (): Promise<Country[]> => {
  const response = await api.get<Country[]>('/location/countries');
  return response.data;
};

export const getStates = async (countryId: string): Promise<State[]> => {
  const response = await api.get<State[]>(`/location/countries/${countryId}/states`);
  return response.data;
};

export const getCities = async (stateId: string): Promise<City[]> => {
  const response = await api.get<City[]>(`/location/states/${stateId}/cities`);
  return response.data;
};

export const searchLocations = async (query: string) => {
  const response = await api.get('/location/search', {
    params: { query },
  });
  return response.data;
};
