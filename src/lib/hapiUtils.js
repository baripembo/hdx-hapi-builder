// Consolidated HAPI Utility Module

// Constants for API configuration
const API_KEY = "aGFwaS1kYXNoYm9hcmQ6ZXJpa2Eud2VpQHVuLm9yZw==";
const HAPI_HOST = "https://hapi.humdata.org/api/v1";
const PAGE_SIZE = 10000;

// Helper function to fetch data with pagination
async function fetchData(category, subcategory, params) {
  const results = [];
  let offset = 0;
  let finished = false;

  params = { ...params, app_identifier: API_KEY, limit: PAGE_SIZE };

  while (!finished) {
    params.offset = offset;
    const url = `${HAPI_HOST}/${category}/${subcategory}?${new URLSearchParams(params)}`;
    const response = await fetch(url);
    const data = await response.json();

    results.push(...data.data);
    finished = data.data.length < PAGE_SIZE;
    offset += PAGE_SIZE;
  }

  return results;
}

// Fetch a single row of data
async function fetchRow(category, subcategory, params) {
  const data = await fetchData(category, subcategory, params);
  return data.length > 0 ? data[0] : null;
}

// Fetch a subcategory with optional availability filtering
async function getSubcategory(category, subcategory, params, availability) {
  if (availability && !availability.some(item => item.subcategory === subcategory)) {
    return null;
  }

  const result = {
    params,
    data: await fetchData(category, subcategory, params),
  };

  if (result.data.length > 0) {
    result.has_data = true;
    result.start_date = Math.min(...result.data.map(item => item.reference_period_start));
    result.end_date = Math.max(...result.data.map(item => item.reference_period_end));
    result.latest_date = result.end_date;
    result.sources = [...new Set(result.data.map(item => item.dataset_hdx_provider_name))];
  } else {
    result.has_data = false;
  }

  return result;
}

// Extract sectors from datasets
function getSectors(datasets) {
  const sectorMap = new Map();

  datasets.forEach(data => {
    if (data?.data) {
      data.data.forEach(row => {
        if (row.sector_code !== "Intersectoral") {
          sectorMap.set(row.sector_code, row.sector_name);
        }
      });
    }
  });

  return Array.from(sectorMap.entries()).map(([code, name]) => ({ code, name }));
}

// Aggregate and convert food price data
function aggregateFoodPricesByMarket(data) {
  const markets = {};

  data.forEach(item => {
    if (item.commodity_category === "non-food") return;

    const marketCode = item.market_code;
    const commodityCode = item.commodity_code;

    if (!markets[marketCode]) {
      markets[marketCode] = {
        admin2_name: item.admin2_name,
        market_name: item.market_name,
        coordinates: [item.lon, item.lat],
        commodities: {},
      };
    }

    if (!markets[marketCode].commodities[commodityCode]) {
      markets[marketCode].commodities[commodityCode] = {
        code: commodityCode,
        name: item.commodity_name,
        prices: [],
      };
    }

    markets[marketCode].commodities[commodityCode].prices.push({
      currency_code: item.currency_code,
      price: item.price,
      reference_period_start: item.reference_period_start,
      reference_period_end: item.reference_period_end,
      unit: item.unit,
    });
  });

  Object.keys(markets).forEach(marketCode => {
    markets[marketCode].commodities = Object.values(markets[marketCode].commodities);
  });

  return markets;
}

function convertToGeoJSON(markets) {
  return {
    type: "FeatureCollection",
    features: Object.entries(markets).map(([marketCode, market]) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: market.coordinates,
      },
      properties: {
        market_code: marketCode,
        admin2_name: market.admin2_name,
        market_name: market.market_name,
        commodities: market.commodities,
      },
    })),
  };
}

// Render functions for locations
async function renderLocations(filter = "hrp") {
  const params = filter === "hrp" ? { has_hrp: true } : { in_gho: true };
  const locations = await fetchData("metadata", "location", params);
  return { locations, filter };
}

async function renderLocation(pcode, startDate, endDate) {
  const info = {
    location: await fetchRow("metadata", "location", { code: pcode }),
  };

  info.admin1s = await fetchData("metadata", "admin1", { location_code: pcode });
  const availability = await fetchData("metadata", "data-availability", { location_code: pcode });
  //info.food_price = await getSubcategory("food-security-nutrition-poverty", "food-prices-market-monitor", { admin_level: 2, location_code: pcode, start_date: startDate, end_date: endDate }, availability);
  info.food_price = await getSubcategory("food", "food-price", { admin_level: 2, location_code: pcode, start_date: startDate, end_date: endDate }, availability);

  if (info.food_price?.data) {
    info.food_price_by_market = aggregateFoodPricesByMarket(info.food_price.data);
  }

  return info;
}

// Export consolidated functions
export {
  fetchData,
  fetchRow,
  getSubcategory,
  getSectors,
  aggregateFoodPricesByMarket,
  convertToGeoJSON,
  renderLocations,
  renderLocation,
};
