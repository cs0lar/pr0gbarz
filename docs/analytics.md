# Analytics calculations

pr0gbarz treats analytics as decision support, not certainty. All calculations use active tasks only, a caller-injected UTC clock, and explicit `insufficient_data` states when the available measurements do not justify a result.

## Recent window and bounds

Project analytics reads the latest 1,000 progress events in the 28 UTC calendar days ending today. Daily points are the sum of `newProgress - previousProgress` for that date, so reversals remain visible rather than being silently discarded. Task history is separately bounded to the newest 100 events. The API returns no more than 28 daily samples and 20 stalled tasks.

These limits keep runtime and response size dependent on recent activity, not the lifetime size of the append-only history. If a project can exceed 1,000 updates in 28 days, the current response describes the bounded sample and should not be interpreted as a complete period aggregate. A future migration may add persisted daily rollups without changing the response contract.

## Completion and velocity

Project completion remains the unweighted arithmetic mean of current active-task progress. Completed and remaining summaries count task status; an empty project has no measured completion.

Recent velocity is available only when the window has:

- at least two progress events;
- at least seven elapsed days between its earliest and latest event; and
- at least one active task.

The formula is:

```text
net progress = sum(new progress - previous progress)
points per week = (net progress / active task count / observed days) * 7
```

The result is rounded to two decimal places. Negative changes reduce velocity. This deliberately simple measure normalizes the project’s recent task-point movement against its current active task count; it is not hours worked or a confidence interval.

## Projection

A projected completion date is shown only when velocity is available and positive, completion is measured and below 100%, and the resulting horizon is no more than five years:

```text
days remaining = ceil(((100 - completion) / points per week) * 7)
```

The result is a UTC date-only value. Zero or negative velocity, empty/completed projects, inadequate observations, and implausibly distant results return `insufficient_data`. Schedule health remains the separate date-based signal documented in the [API reference](api.md); neither calculation claims statistical certainty.

## Stalled work

An incomplete active task is stalled after 14 full days without a progress event. If it has never recorded progress, its creation time is the baseline. Completed and archived tasks are excluded. Results are ordered by longest stall first and then stable task ID.

All thresholds and formulas have fixed-clock unit tests. UI copy must preserve the insufficient-data explanation and every chart must retain a visible textual equivalent.
