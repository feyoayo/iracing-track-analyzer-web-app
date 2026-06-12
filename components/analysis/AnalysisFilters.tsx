type Props = {
  classes: string[];
  selectedClass: string;
  seriesNames: string[];
  selectedSeries: string[];
  trackQuery: string;
  onClassChange: (value: string) => void;
  onSeriesToggle: (value: string) => void;
  onTrackQueryChange: (value: string) => void;
};

export function AnalysisFilters(props: Props) {
  return (
    <section className="filter-stack">
      <label className="field">
        <span>Class</span>
        <select
          value={props.selectedClass}
          onChange={(event) => props.onClassChange(event.target.value)}
        >
          {props.classes.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="series-fieldset">
        <legend>Series</legend>
        {props.seriesNames.map((name) => (
          <label key={name} className="checkbox-row">
            <input
              type="checkbox"
              checked={props.selectedSeries.includes(name)}
              onChange={() => props.onSeriesToggle(name)}
            />
            <span>{name}</span>
          </label>
        ))}
      </fieldset>

      <label className="field">
        <span>Track</span>
        <input
          value={props.trackQuery}
          onChange={(event) => props.onTrackQueryChange(event.target.value)}
          placeholder="Search track"
        />
      </label>
    </section>
  );
}
