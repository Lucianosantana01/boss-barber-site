const DEFAULT_SEARCH = 'Barbearia e Estetica Boss Barber Louveira';
const DEFAULT_LANGUAGE = 'pt-BR';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.end(JSON.stringify(payload));
}

function getGoogleStatusMessage(status, message) {
  if (message) return message;

  const messages = {
    REQUEST_DENIED: 'Google bloqueou a requisicao. Verifique chave, billing, API Places e restricoes.',
    ZERO_RESULTS: 'Nenhum local foi encontrado com os dados configurados.',
    OVER_QUERY_LIMIT: 'Limite de consultas do Google Places atingido.',
    INVALID_REQUEST: 'Requisicao invalida para o Google Places.',
    UNKNOWN_ERROR: 'Erro temporario no Google Places.',
  };

  return messages[status] || `Google Places retornou status ${status || 'desconhecido'}.`;
}

async function fetchGoogleJson(url) {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || (data.status && data.status !== 'OK')) {
    const status = data.status || response.status;
    throw new Error(getGoogleStatusMessage(status, data.error_message));
  }

  return data;
}

async function findPlaceId(apiKey, search, location) {
  const params = new URLSearchParams({
    input: search,
    inputtype: 'textquery',
    fields: 'place_id,name,formatted_address',
    language: DEFAULT_LANGUAGE,
    key: apiKey,
  });

  if (location) {
    params.set('locationbias', `point:${location}`);
  }

  const data = await fetchGoogleJson(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?${params}`);
  const place = data.candidates && data.candidates[0];

  if (!place || !place.place_id) {
    throw new Error('Google Places nao retornou place_id para a busca configurada.');
  }

  return place.place_id;
}

function mapReview(review) {
  return {
    author: review.author_name || 'Cliente',
    rating: review.rating || 5,
    text: review.text || '',
    time: review.relative_time_description || '',
    photo: review.profile_photo_url || '',
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Metodo nao permitido.' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return sendJson(res, 500, {
      error: 'GOOGLE_PLACES_API_KEY nao configurada na Vercel.',
    });
  }

  try {
    const placeId = process.env.GOOGLE_PLACE_ID
      || await findPlaceId(
        apiKey,
        process.env.GOOGLE_PLACE_SEARCH || DEFAULT_SEARCH,
        process.env.GOOGLE_PLACE_LOCATION || ''
      );

    const params = new URLSearchParams({
      place_id: placeId,
      fields: 'name,rating,user_ratings_total,reviews,url,place_id',
      reviews_sort: 'newest',
      language: DEFAULT_LANGUAGE,
      key: apiKey,
    });

    const data = await fetchGoogleJson(`https://maps.googleapis.com/maps/api/place/details/json?${params}`);
    const place = data.result || {};

    return sendJson(res, 200, {
      name: place.name || 'Boss Barber',
      rating: place.rating || 5,
      totalReviews: place.user_ratings_total || 0,
      googleUrl: place.url || '',
      placeId: place.place_id || placeId,
      reviews: (place.reviews || []).map(mapReview).filter((review) => review.text),
    });
  } catch (error) {
    return sendJson(res, 502, {
      error: error.message || 'Erro ao buscar avaliacoes no Google Places.',
    });
  }
};
