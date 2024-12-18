// src/lib/renderFunctions.js
import { fetchData, fetchRow } from "./HapiService";
import { get_subcategory, get_sectors, aggregate_foodprices_by_market } from "./dataUtils"; 


async function renderLocations(filter = "hrp") {
    console.log('rendering locations')
    const params = filter === "hrp" ? { has_hrp: true } : { in_gho: true };
    const locations = await fetchData("metadata", "location", params);
    return { locations, filter };
}


async function renderLocation(pcode) {
  const info = { stop_list: ["origin_location_ref", "asylum_location_ref", /* Add more stop list items */] };

  // Fetch core location info
  info.location = await fetchRow("metadata", "location", { code: pcode });
  info.admin_level = 0;
  info.geo = info.location;
  info.geo_type = "location";

  // Fetch related data
  info.admin1s = await fetchData("metadata", "admin1", { location_code: pcode });
  const availability = await fetchData("metadata", "data-availability", { location_code: info.location.code });

  // Fetch subcategories
  info.food_price = await get_subcategory("food", "food-price", { admin_level: 2, location_code: pcode }, availability);
  //info.conflict_event = await get_subcategory("food", "food-price", { admin_level: 2, location_code: pcode }, availability);
  if (info.food_price?.data) {
    info.food_price_by_market = aggregate_foodprices_by_market(info.food_price.data);
  }

  // info.population = await get_subcategory("population-social", "population", { admin_level: 0, location_code: pcode }, availability);
  // info.humanitarian_needs = await get_subcategory("affected-people", "humanitarian-needs", { admin_level: 0, location_code: pcode }, availability);
  // info.operational_presence = await get_subcategory("coordination-context", "operational-presence", { location_code: pcode }, availability);
  // info.funding = await get_subcategory("coordination-context", "funding", { location_code: pcode }, availability);
  // info.refugees = await get_subcategory("affected-people", "refugees", { asylum_location_code: pcode }, availability);
  // info.returnees = await get_subcategory("affected-people", "returnees", { asylum_location_code: pcode }, availability);
  // info.idps = await get_subcategory("affected-people", "idps", { admin_level: 0, location_code: pcode }, availability);
  // info.national_risk = await get_subcategory("coordination-context", "national-risk", { location_code: pcode }, availability);

  // Extract sectors
  //info.sectors = get_sectors([info.operational_presence, info.humanitarian_needs]);

  return info; // Return the prepared data for rendering
}


export { renderLocations, renderLocation };
