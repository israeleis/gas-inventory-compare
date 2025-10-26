# GEMINI.md: Google Apps Script for Army Data Comparison

## Project Overview

This is a [Google Apps Script](https://developers.google.com/apps-script) project designed to operate within a Google Sheet. Its primary purpose is to automate the process of collecting, transforming, and comparing data from various sources, likely related to military unit logistics and personnel equipment tracking.

The script adds a custom menu to the Google Sheet UI, allowing users to trigger data processing workflows. The core functionalities include:

*   **Data Transformation:** Normalizing data from individual unit sheets (e.g., "פלוגה א", "פלוגה ב") into a standardized format.
*   **Data Aggregation:** Combining the normalized data from all units into a single master sheet (`all_normalized`).
*   **Data Comparison:** Performing a "diff" between the aggregated unit data and a master battalion-level (`gdud`) data sheet to identify discrepancies in personnel and equipment records.
*   **Automated Syncing:** A time-based trigger periodically checks for changes in the source data and automatically runs the comparison process if updates are detected.
*   **Configuration:** A `mappings` sheet allows users to define rules for data transformation, such as renaming fields or ignoring certain records, without modifying the script's code.

The project is written in JavaScript and leverages the Google Apps Script API to interact with Google Sheets. The code is organized into modules based on functionality (e.g., `data_transformer_*.js`, `compare_soldiers.js`, `sync_manager.js`).

## Building and Running

This is a server-side JavaScript project that runs on Google's infrastructure. There is no local build process required.

### Running the Script

1.  **Open the Google Sheet:** The script is bound to a specific Google Sheet. Open this sheet in your browser.
2.  **Use the Custom Menu:** Upon opening the sheet, an `onOpen` trigger automatically creates a custom menu named "Custom Scripts".
3.  **Execute Actions:** Use the items in the "Custom Scripts" menu to perform actions like transforming data for a specific unit, aggregating all data, or running a comparison.

### Development

*   **Google Apps Script Editor:** The code can be edited directly in the browser-based Google Apps Script editor associated with the Google Sheet.
*   **Local Development with `clasp`:** The project structure, with separate `.js` files in a `src` directory, strongly suggests that it is managed using [`clasp`](https://github.com/google/clasp), the command-line interface for Google Apps Script.

To work on this project locally, you would typically use `clasp` to pull the code from the Google Apps Script project, edit the files locally, and then push the changes back.

**Common `clasp` commands:**

```bash
# Log in to your Google account
clasp login

# Clone an existing project
clasp clone <scriptId>

# Pull the latest code from the server
clasp pull

# Push local changes to the server
clasp push
```

## Development Conventions

*   **Modularity:** The code is organized into separate files based on functionality. For example, `compare_soldiers.js` handles the logic for comparing soldier data, while `sync_manager.js` handles the automated synchronization.
*   **Configuration in Sheets:** The script avoids hardcoding values by using a `mappings` sheet for configuration. This allows for easier updates to data transformation rules.
*   **Clear Naming:** Functions and variables are named descriptively (e.g., `transformDataPlugaA`, `compareSoldiers`).
*   **Logging:** The script uses `Logger.log()` for debugging purposes. The logs can be viewed in the Google Apps Script editor.
*   **Language:** The code itself is in English, but strings, comments, and sheet names are in Hebrew, reflecting the project's domain.
