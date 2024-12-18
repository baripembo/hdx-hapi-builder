<script>
  import * as d3 from 'd3';

  export let data = []; // Ensure a default value

  let tableData = [];
  let displayedData = [];
  let sortColumn = '';
  let sortDirection = 'asc';
  let currency_code;
  let numFormat = d3.format(',');

  // Pagination variables
  let currentPage = 1;
  let rowsPerPage = 15;

  // Reactive block to process data whenever it changes
  $: if (data.length > 0) {
    const aggregatedData = {};
    data.forEach(item => {
      const year = new Date(item.reference_period_start).getFullYear();
      const key = `${item.admin2_name}-${item.market_name}-${item.commodity_name}-${year}`;

      if (!aggregatedData[key]) {
        aggregatedData[key] = {
          admin2_name: item.admin2_name,
          market_name: item.market_name,
          commodity_name: item.commodity_name,
          currency_code: item.currency_code,
          unit: item.unit,
          year,
          total_price: 0,
          count: 0
        };
      }

      aggregatedData[key].total_price += item.price;
      aggregatedData[key].count += 1;
      currency_code = item.currency_code;
    });

    tableData = Object.values(aggregatedData).map(item => ({
      ...item,
      avg_price: (item.total_price / item.count).toFixed(2)
    }));

    // Reset pagination when data changes
    currentPage = 1;
    updateDisplayedData();
  }

  function updateDisplayedData() {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    displayedData = tableData.slice(start, end);
  }

  function sortTable(column) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }

    tableData = [...tableData].sort((a, b) => {
      if (a[column] < b[column]) return sortDirection === 'asc' ? -1 : 1;
      if (a[column] > b[column]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    updateDisplayedData();
  }

  function goToPage(page) {
    currentPage = page;
    updateDisplayedData();
  }

  function nextPage() {
    const totalPages = Math.ceil(tableData.length / rowsPerPage);
    if (currentPage < totalPages) {
      currentPage += 1;
      updateDisplayedData();
    }
  }

  function prevPage() {
    if (currentPage > 1) {
      currentPage -= 1;
      updateDisplayedData();
    }
  }

  function visiblePages() {
    const totalPages = Math.ceil(tableData.length / rowsPerPage);
    const maxVisibleButtons = 5;
    const half = Math.floor(maxVisibleButtons / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, currentPage + half);

    if (start === 1) {
      end = Math.min(maxVisibleButtons, totalPages);
    } else if (end === totalPages) {
      start = Math.max(1, totalPages - maxVisibleButtons + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
</script>


<table>
  <thead>
    <tr>
      <th on:click={() => sortTable('admin2_name')}>Admin2 Name <i class="icon-sort"></i></th>
      <th on:click={() => sortTable('market_name')}>Market Name <i class="icon-sort"></i></th>
      <th on:click={() => sortTable('commodity_name')}>Commodity Name <i class="icon-sort"></i></th>
      <th on:click={() => sortTable('year')}>Year <i class="icon-sort"></i></th>
      <th on:click={() => sortTable('avg_price')}>Average Price ({currency_code}) <i class="icon-sort"></i></th>
    </tr>
  </thead>
  <tbody>
    {#each displayedData as item}
      <tr>
        <td>{item.admin2_name}</td>
        <td>{item.market_name}</td>
        <td>{item.commodity_name}</td>
        <td>{item.year}</td>
        <td>{numFormat(item.avg_price)} per {item.unit}</td>
      </tr>
    {/each}
  </tbody>
</table>

<div class="pagination">
  <button on:click={() => goToPage(1)} disabled={currentPage === 1}>First</button>
  <button on:click={prevPage} disabled={currentPage === 1}>Previous</button>
  {#each visiblePages() as page}
    <button 
      on:click={() => goToPage(page)} 
      class:active={currentPage === page}>
      {page}
    </button>
  {/each}
  <button on:click={nextPage} disabled={currentPage === Math.ceil(tableData.length / rowsPerPage)}>Next</button>
  <button on:click={() => goToPage(Math.ceil(tableData.length / rowsPerPage))} disabled={currentPage === Math.ceil(tableData.length / rowsPerPage)}>Last</button>
</div>

<style>
  table {
    table-layout: fixed;
    width: 100%;
  }

  th {
    cursor: pointer;
  }

  .pagination {
    margin-top: 10px;
    display: flex;
    gap: 5px;
    justify-content: center;
  }

  .pagination button {
    padding: 5px 10px;
    cursor: pointer;
  }

  .pagination button.active {
    font-weight: bold;
    background-color: #ddd;
  }

  .pagination button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
</style>
