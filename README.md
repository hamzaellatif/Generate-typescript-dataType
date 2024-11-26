# Generate-typescript-dataType from JSON objects

Place example json api responses in this folder (/src/types/datatypes). For example "response.json".

Run `npm run generate-data-types` to generate "Response.ts" based on "Response.json".

## Update definitions

⚠️ do not manually edit the .ts files in this folder because they will be overritten next time the command is run.

If type definitions in this folder are wrong it might be because the samples are stale or incomplete. To update the type definitions, add/replace the sample json files for the incorrect type and run `npm run generate-data-types` again.

## Optional fields from Multiple samples

Api responses might have optional fields. Use multiple json samples to generate type definitions with optional fields when all of the samples does not contain all the same fields.

Use the same name for multiple samples from the same endpoint. For example "Response.json", "Response.json" etc., to generate "Response.ts" using all "Response[n?].json" files as input.
