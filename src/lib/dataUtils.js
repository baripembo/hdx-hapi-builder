import { fetchData, fetchRow } from "./HapiService";

/**
 * Fetch a subcategory of data with optional filtering based on availability.
 */
async function get_subcategory(category, subcategory, params, availability) {
  // Skip if the subcategory isn't in the availability table
  if (availability && !availability.some(item => item.subcategory === subcategory)) {
    return null;
  }

  const result = {};
  result.params = params;

  // Fetch the data
  result.data = await fetchData(category, subcategory, params);

  // Calculate metadata if data exists
  if (result.data.length > 0) {
    result.has_data = true;
    result.start_date = result.data.reduce((min, item) => (item.reference_period_start < min ? item.reference_period_start : min), result.data[0].reference_period_start);
    result.end_date = result.data.reduce((max, item) => (item.reference_period_end > max ? item.reference_period_end : max), result.data[0].reference_period_end);
    result.latest_date = result.end_date;
    result.sources = Array.from(new Set(result.data.map(item => item.dataset_hdx_provider_name)));
  } else {
    result.has_data = false;
  }

  return result;
}

/**
 * Extract sectors from operational presence and humanitarian needs datasets.
 */
function get_sectors(datasets) {
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

/**
 * Aggregate latest food price data by commodity code and admin2 code
 * Convert to geojson for mapping
 */
function aggregate_foodprices(data) {
  const result = {};

  data.forEach(item => {
    const key = `${item.commodity_code}_${item.admin2_code}`;
    const itemDate = new Date(item.reference_period_start);

    if (!result[key] || new Date(result[key].reference_period_start) < itemDate) {
      result[key] = {
        admin2_code: item.admin2_code,
        admin2_name: item.admin2_name,
        commodity_code: item.commodity_code,
        commodity_name: item.commodity_name,
        currency_code: item.currency_code,
        lat: item.lat,
        lon: item.lon,
        market_name: item.market_name,
        price: item.price,
        price_type: item.price_type,
        reference_period_start: item.reference_period_start,
        unit: item.unit
      };
    }
  });

  return result;
}

function aggregate_foodprices_by_market(data) {
  const markets = {};

  data.forEach((item) => {
    // Skip items with commodity_category equal to "non-food"
    if (item.commodity_category === "non-food") {
      return;
    }

    const marketCode = item.market_code;
    const commodityCode = item.commodity_code;

    if (!markets[marketCode]) {
      markets[marketCode] = {
        admin2_name: item.admin2_name,
        market_name: item.market_name,
        coordinates: [item.lon, item.lat],
        commodities: {}
      };
    }

    if (!markets[marketCode].commodities[commodityCode]) {
      markets[marketCode].commodities[commodityCode] = {
        code: commodityCode,
        name: item.commodity_name,
        prices: []
      };
    }

    markets[marketCode].commodities[commodityCode].prices.push({
      currency_code: item.currency_code,
      price: item.price,
      reference_period_start: item.reference_period_start,
      reference_period_end: item.reference_period_end,
      unit: item.unit
    });
  });

  // Convert commodities from object to array for consistency
  Object.keys(markets).forEach((marketCode) => {
    markets[marketCode].commodities = Object.values(markets[marketCode].commodities);
  });

  return markets;
}


function convert_to_geoJSON(markets) {
  return {
    type: "FeatureCollection",
    features: Object.entries(markets).map(([marketCode, market]) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: market.coordinates
      },
      properties: {
        market_code: marketCode,
        admin2_name: market.admin2_name,
        market_name: market.market_name,
        commodities: market.commodities
      }
    }))
  };

  return geojson;
}


export { get_subcategory, get_sectors, aggregate_foodprices, aggregate_foodprices_by_market, convert_to_geoJSON };
