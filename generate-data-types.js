/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// Directory containing JSON files
const jsonDir = path.resolve(__dirname, "./types/dataTypes");

// Function to group files by their base name
const groupFilesByBaseName = (files) => {
  return files.reduce((acc, file) => {
    const match = file.match(/^(.*?)(\d*)\.json$/);
    if (match) {
      const [, baseName] = match;
      if (!acc[baseName]) {
        acc[baseName] = [];
      }
      acc[baseName].push(file);
    }

    return acc;
  }, {});
};

// Function to generate TypeScript definitions using quicktype
const generateTypes = (baseName, files) => {
  return new Promise((resolve, reject) => {
    const srcArgs = files.flatMap((file) => [
      "--src",
      path.join(jsonDir, file),
    ]);
    const outFile = path.join(jsonDir, `${baseName}.ts`);
    const args = [
      "--just-types",
      "--no-runtime-typecheck",
      "--prefer-types",
      "--readonly",
      ...srcArgs,
      "--src-lang",
      "json",
      "--lang",
      "ts",
      "--out",
      outFile,
    ];

    console.info(`Generating TypeScript definitions for ${baseName}...`);

    const quicktype = spawn("npx", ["quicktype", ...args], { shell: false });

    quicktype.stdout.on("data", (data) => {
      console.info(`stdout: ${data}`);
    });

    quicktype.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    quicktype.on("close", (code) => {
      if (code !== 0) {
        reject(`quicktype process exited with code ${code}`);
      } else {
        resolve(`Successfully generated types for ${baseName}`);
      }
    });
  });
};

function processSourceFiles() {
  return new Promise((resolve, reject) => {
    // Read the JSON directory and process the files
    fs.readdir(jsonDir, (err, files) => {
      if (err) {
        reject("Error reading JSON directory:", err);

        return;
      }

      // Filter out non-JSON files
      const jsonFiles = files.filter((file) => file.endsWith(".json"));

      // Group files by their base name
      const groupedFiles = groupFilesByBaseName(jsonFiles);

      const pending = [];

      // Generate TypeScript definitions for each group
      for (const baseName in groupedFiles) {
        pending.push(generateTypes(baseName, groupedFiles[baseName]));
      }

      Promise.all(pending).then(resolve, reject);
    });
  });
}

function processTypeFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (readError, content) => {
      if (readError) {
        reject("Error reading file " + file, readError);

        return;
      }

      content =
        "// ⚠️ this file may be automatically modified and should not be changed manually. see dataTypes/README.md.\n\n" +
        String(content);

      // quicktype will infer iso date string as Date object type, which is not expected
      content = String(content).replace(
        /:\s*\bDate\b;/g,
        ": string; // quicktype output modified Date → string"
      );

      fs.writeFile(file, content, (writeError) => {
        if (writeError) {
          reject(writeError);
        } else {
          resolve();
        }
      });
    });
  });
}

function processOutput() {
  return new Promise((resolve, reject) => {
    fs.readdir(jsonDir, (err, files) => {
      if (err) {
        reject("Error reading JSON directory:", err);

        return;
      }

      Promise.all(
        files
          .filter((file) => file.endsWith(".ts"))
          .map((file) => processTypeFile(path.join(jsonDir, file)))
      ).then(resolve, reject);
    });
  });
}

processSourceFiles().then(processOutput).catch(console.error);
