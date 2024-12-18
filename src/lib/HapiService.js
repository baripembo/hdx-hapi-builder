const API_KEY = "aGFwaS1kYXNoYm9hcmQ6ZXJpa2Eud2VpQHVuLm9yZw==";
const HAPI_HOST = "https://hapi.humdata.org/api/v1";
const PAGE_SIZE = 10000;

async function fetchData(category, subcategory, params) {
  const results = [];
  let offset = 0;
  let finished = false;

  // Clone and extend parameters
  params = { ...params, app_identifier: API_KEY, limit: PAGE_SIZE };

  while (!finished) {
    params.offset = offset;
    const url = `${HAPI_HOST}/${category}/${subcategory}?${new URLSearchParams(params)}`;
    const response = await fetch(url);
    const data = await response.json();

    results.push(...data.data);

    if (data.data.length < PAGE_SIZE) {
      finished = true;
    } else {
      offset += PAGE_SIZE;
    }
  }

  return results;
}

async function fetchRow(category, subcategory, params) {
  const data = await fetchData(category, subcategory, params);
  return data.length > 0 ? data[0] : null;
}

export { fetchData, fetchRow };
