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

async function fetchGoogleJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok || data.error) {
    const status = data.error?.status || data.status || response.status;
    const message = data.error?.message || data.error_message;
    throw new Error(getGoogleStatusMessage(status, message));
  }

  return data;
}

function parseLocation(location) {
  if (!location) return null;

  const [lat, lng] = location.split(',').map((part) => Number(part.trim()));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { latitude: lat, longitude: lng };
}

async function findPlaceId(apiKey, search, location) {
  const center = parseLocation(location);
  const body = {
    textQuery: search,
    languageCode: DEFAULT_LANGUAGE,
  };

  if (center) {
    body.locationBias = {
      circle: {
        center,
        radius: 5000,
      },
    };
  }

  const data = await fetchGoogleJson('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
    },
    body: JSON.stringify(body),
  });

  const place = data.places && data.places[0];

  if (!place || !place.id) {
    throw new Error('Google Places nao retornou place_id para a busca configurada.');
  }

  return place.id;
}

function mapReview(review) {
  return {
    author: review.authorAttribution?.displayName || 'Cliente',
    rating: review.rating || 5,
    text: review.text?.text || review.originalText?.text || '',
    time: review.relativePublishTimeDescription || '',
    photo: review.authorAttribution?.photoUri || '',
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

    const detailsUrl = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
    detailsUrl.searchParams.set('languageCode', DEFAULT_LANGUAGE);

    const place = await fetchGoogleJson(detailsUrl, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'id',
          'displayName',
          'rating',
          'userRatingCount',
          'reviews',
          'googleMapsUri',
        ].join(','),
      },
    });

    return sendJson(res, 200, {
      name: place.displayName?.text || 'Boss Barber',
      rating: place.rating || 5,
      totalReviews: place.userRatingCount || 0,
      googleUrl: place.googleMapsUri || '',
      placeId: place.id || placeId,
      reviews: (place.reviews || []).map(mapReview).filter((review) => review.text),
    });
  } catch (error) {
    return sendJson(res, 502, {
      error: error.message || 'Erro ao buscar avaliacoes no Google Places.',
    });
  }
};
