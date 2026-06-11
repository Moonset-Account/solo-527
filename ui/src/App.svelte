<script>
  let report = $state(null);
  let loading = $state(false);
  let error = $state(null);
  let junitDir = $state("");
  let screenshotDir = $state("");
  let historyFile = $state("");

  async function loadReport() {
    loading = true;
    error = null;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke("generate_report", {
        junitDir,
        screenshotDir,
        historyFile: historyFile || null,
      });
      report = result;
    } catch (e) {
      error = String(e);
    } finally {
      loading = false;
    }
  }

  function formatTime(ts) {
    if (!ts) return "unknown";
    return ts;
  }

  function flakyClass(score) {
    if (score >= 0.7) return "flaky-high";
    if (score >= 0.4) return "flaky-medium";
    return "flaky-low";
  }
</script>

<main>
  <h1>Nightly Failure Summary</h1>

  <form on:submit|preventDefault={loadReport}>
    <div class="field">
      <label>JUnit XML Directory</label>
      <input type="text" bind:value={junitDir} placeholder="/path/to/junit-reports" />
    </div>
    <div class="field">
      <label>Screenshot Directory</label>
      <input type="text" bind:value={screenshotDir} placeholder="/path/to/screenshots" />
    </div>
    <div class="field">
      <label>History File (optional)</label>
      <input type="text" bind:value={historyFile} placeholder="/path/to/history.json" />
    </div>
    <button type="submit" disabled={loading || !junitDir || !screenshotDir}>
      {loading ? "Loading..." : "Generate Report"}
    </button>
  </form>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  {#if report}
    <div class="summary">
      <span>Total failures: {report.total_failures}</span>
      <span>Unique tests: {report.unique_tests}</span>
      <span>Generated: {formatTime(report.generated_at)}</span>
    </div>

    {#if report.warnings.length > 0}
      <div class="warnings">
        {#each report.warnings as w}
          <div class="warning">⚠ {w}</div>
        {/each}
      </div>
    {/if}

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Test</th>
          <th>File</th>
          <th>Reasons</th>
          <th>First Seen</th>
          <th>Occurrences</th>
          <th>Flaky Score</th>
          <th>Screenshots</th>
        </tr>
      </thead>
      <tbody>
        {#each report.failures as f, i}
          <tr>
            <td>{i + 1}</td>
            <td class="test-name">{f.test_name}<br /><small>{f.classname}</small></td>
            <td class="file-path">{f.test_file}</td>
            <td>
              <ul>
                {#each f.failure_reasons as r}
                  <li>{r}</li>
                {/each}
              </ul>
            </td>
            <td>{formatTime(f.first_seen)}</td>
            <td>{f.occurrence_count}</td>
            <td class={flakyClass(f.flaky_score)}>{f.flaky_score.toFixed(2)}</td>
            <td>{f.screenshot_paths.length} file(s)</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</main>

<style>
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    margin: 0;
    padding: 0;
    background: #0d1117;
    color: #c9d1d9;
  }

  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    color: #58a6ff;
    margin-bottom: 1.5rem;
  }

  .field {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.25rem;
    color: #8b949e;
    font-size: 0.875rem;
  }

  input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #30363d;
    border-radius: 6px;
    background: #161b22;
    color: #c9d1d9;
    font-size: 0.875rem;
    box-sizing: border-box;
  }

  button {
    padding: 0.5rem 1.5rem;
    border: 1px solid #30363d;
    border-radius: 6px;
    background: #238636;
    color: #fff;
    font-size: 0.875rem;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error {
    margin-top: 1rem;
    padding: 0.75rem;
    border-radius: 6px;
    background: #3d1f1f;
    border: 1px solid #f85149;
    color: #f85149;
  }

  .summary {
    margin-top: 1.5rem;
    display: flex;
    gap: 2rem;
    padding: 1rem;
    border-radius: 6px;
    background: #161b22;
    border: 1px solid #30363d;
  }

  .warnings {
    margin-top: 1rem;
  }

  .warning {
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    background: #2a1f00;
    border: 1px solid #d29922;
    color: #d29922;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  table {
    width: 100%;
    margin-top: 1.5rem;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  th {
    text-align: left;
    padding: 0.75rem 0.5rem;
    border-bottom: 2px solid #30363d;
    color: #8b949e;
  }

  td {
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid #21262d;
    vertical-align: top;
  }

  .test-name {
    font-weight: 600;
    color: #58a6ff;
  }

  .test-name small {
    font-weight: 400;
    color: #8b949e;
  }

  .file-path {
    font-family: monospace;
    font-size: 0.8rem;
    color: #8b949e;
  }

  ul {
    margin: 0;
    padding-left: 1.25rem;
  }

  li {
    margin-bottom: 0.25rem;
  }

  .flaky-high {
    color: #f85149;
    font-weight: 700;
  }

  .flaky-medium {
    color: #d29922;
    font-weight: 600;
  }

  .flaky-low {
    color: #3fb950;
  }
</style>
