# pr0gbarz v2 API

The JSON product API is rooted at `/api/v1`. Dates use `YYYY-MM-DD`; timestamps use UTC ISO 8601 strings. Unknown properties are rejected from request objects.

## System endpoints

| Method | Path      | Purpose                                       |
| ------ | --------- | --------------------------------------------- |
| GET    | `/health` | Process liveness; does not query dependencies |
| GET    | `/ready`  | Database readiness and integrity              |

`/ready` returns HTTP 503 when the database cannot serve requests.

## Product endpoints

| Method | Path                                    | Purpose                        |
| ------ | --------------------------------------- | ------------------------------ |
| GET    | `/api/v1/dashboard`                     | Dashboard totals and summaries |
| GET    | `/api/v1/projects`                      | Search and list projects       |
| POST   | `/api/v1/projects`                      | Create a project               |
| GET    | `/api/v1/projects/:id`                  | Get a project with task totals |
| PATCH  | `/api/v1/projects/:id`                  | Update or restore a project    |
| DELETE | `/api/v1/projects/:id`                  | Archive a project              |
| GET    | `/api/v1/projects/:projectId/tasks`     | Search and list project tasks  |
| POST   | `/api/v1/projects/:projectId/tasks`     | Create a task                  |
| GET    | `/api/v1/tasks/:id`                     | Get a task and its tags        |
| PATCH  | `/api/v1/tasks/:id`                     | Update, transition, or restore |
| DELETE | `/api/v1/tasks/:id`                     | Archive a task                 |
| GET    | `/api/v1/tasks/:taskId/progress-events` | List progress history          |
| PUT    | `/api/v1/tasks/:taskId/tags/:tagId`     | Assign a tag idempotently      |
| DELETE | `/api/v1/tasks/:taskId/tags/:tagId`     | Remove a tag                   |
| GET    | `/api/v1/tags`                          | List tags                      |
| POST   | `/api/v1/tags`                          | Create a tag                   |

## Listing and sorting

Project and task lists accept `offset` and `limit`. Project limits are capped at 100 and task limits at 200. Both support case-insensitive `search` and an `archived` selector. Task lists additionally filter by `status`, `priority`, and `tagId`.

Project sorting is bounded to `manual`, `name`, or `updated`. Task sorting is bounded to `manual`, `name`, `priority`, `progress`, `dueDate`, or `updated`. Supply `direction=asc` or `direction=desc`; unsupported values are rejected before a query runs.

List responses contain `items`, `offset`, `limit`, and `total`.

## Lifecycle rules

Deletion is recoverable: DELETE endpoints archive records rather than removing them. Send `{"archived": false}` to the corresponding PATCH endpoint to restore a record.

Task progress is between 0 and 100. Moving a task to `completed` sets progress to 100 and records its completion time. Reopening it clears that time. Progress changes and their optional notes are recorded atomically in progress history; a note without a progress change is rejected.

Names are trimmed, tag names are normalized for uniqueness, and invalid start/due date ranges are rejected. Duplicate project or tag names return a conflict response.

## Errors

Errors have a stable envelope:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "The request did not pass validation.",
  "fieldErrors": {
    "name": ["must be string"]
  }
}
```

`fieldErrors` is included for request-validation failures. Expected domain errors use HTTP 404 or 409 with stable codes. Unexpected failures return a sanitized HTTP 500 response and are logged server-side.
