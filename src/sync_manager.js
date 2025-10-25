/**
 * Manages synchronization logic based on sheet data hashes.
 */

/**
 * Gets or creates the sheet for storing sync hashes.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} The SyncHashes sheet.
 */
function getOrCreateSyncHashesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = 'SyncHashes';
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['Sheet Name', 'Last Hash']);
  }
  return sheet;
}

/**
 * Reads the last stored hashes from the SyncHashes sheet.
 * @returns {Object} An object containing the last hashes for 'gdud' and 'all_normalized'.
 */
function getStoredHashes() {
  const sheet = getOrCreateSyncHashesSheet();
  const data = sheet.getDataRange().getValues();
  const storedHashes = {};
  if (data.length > 1) { // Skip header row
    for (let i = 1; i < data.length; i++) {
      storedHashes[data[i][0]] = data[i][1];
    }
  }
  return storedHashes;
}

/**
 * Saves the new hashes to the SyncHashes sheet.
 * @param {string} sheetName The name of the sheet whose hash is being saved.
 * @param {string} newHash The new hash to save.
 */
function saveHash(sheetName, newHash) {
  const sheet = getOrCreateSyncHashesSheet();
  const data = sheet.getDataRange().getValues();
  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === sheetName) {
      sheet.getRange(i + 1, 2).setValue(newHash);
      found = true;
      break;
    }
  }
  if (!found) {
    sheet.appendRow([sheetName, newHash]);
  }
}

/**
 * Calculates a hash for the content of a given sheet.
 * @param {string} sheetName The name of the sheet to hash.
 * @returns {string|null} The hash of the sheet's data, or null if the sheet is not found.
 */
function calculateSheetHash(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log(`Sheet not found for hashing: ${sheetName}`);
    return null;
  }
  const data = sheet.getDataRange().getValues();
  // Convert the 2D array to a string for hashing
  const dataString = JSON.stringify(data);
  return Hasher.hash(dataString);
}

/**
 * Gets or creates the sheet for storing all unique soldier IDs from platoon sheets.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} The AllSoldiersInPlatoons sheet.
 */
function getOrCreateAllSoldiersInPlatoonsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = 'AllSoldiersInPlatoons';
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['Personal ID']);
  }
  return sheet;
}

/**
 * Updates the AllSoldiersInPlatoons sheet with new soldier IDs.
 * @param {string[]} personalIds An array of personal IDs from a platoon sheet.
 */
function updateAllSoldiersInPlatoonsSheet(personalIds) {
  const sheet = getOrCreateAllSoldiersInPlatoonsSheet();
  const existingIds = new Set();
  const data = sheet.getDataRange().getValues();

  // Collect existing IDs, skipping header
  if (data.length > 1) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        existingIds.add(String(data[i][0]).trim());
      }
    }
  }

  const newIdsToAdd = [];
  for (const id of personalIds) {
    const trimmedId = String(id).trim();
    if (trimmedId && !existingIds.has(trimmedId)) {
      newIdsToAdd.push([trimmedId]);
      existingIds.add(trimmedId); // Add to set to prevent duplicates within the current update
    }
  }

  if (newIdsToAdd.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newIdsToAdd.length, 1).setValues(newIdsToAdd);
  }
}

/**
 * Checks if a personal ID exists in the AllSoldiersInPlatoons sheet.
 * @param {string} personalId The personal ID to check.
 * @returns {boolean} True if the personal ID exists, false otherwise.
 */
function doesSoldierExistInAnyPlatoon(personalId) {
  const sheet = getOrCreateAllSoldiersInPlatoonsSheet();
  const data = sheet.getDataRange().getValues();
  // Assuming IDs are in the first column after header
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(personalId).trim()) {
      return true;
    }
  }
  return false;
}

/**
 * Performs a conditional sync based on sheet data changes.
 * If 'gdud' or 'all_normalized' sheets have changed, it runs the full sync.
 */
function conditionalSync() {
  Logger.log('Starting conditional sync check.');

  // Run transformation functions first
  runTransformPlugaA();
  runTransformPlugaB();
  runTransformPlugaC();
  runTransformPlugaMS();

  const gdudSheetName = 'gdud';
  const allNormalizedSheetName = 'all_normalized';

  const storedHashes = getStoredHashes();
  const lastGdudHash = storedHashes[gdudSheetName];
  const lastAllNormalizedHash = storedHashes[allNormalizedSheetName];

  const currentGdudHash = calculateSheetHash(gdudSheetName);
  const currentAllNormalizedHash = calculateSheetHash(allNormalizedSheetName);

  let changesDetected = false;

  if (currentGdudHash === null || currentAllNormalizedHash === null) {
    Logger.log('Could not calculate hash for one or both sheets. Running full sync to be safe.');
    changesDetected = true; // Force sync if hashes can't be calculated
  } else {
    if (currentGdudHash !== lastGdudHash) {
      Logger.log(`Changes detected in ${gdudSheetName}. Old hash: ${lastGdudHash}, New hash: ${currentGdudHash}`);
      changesDetected = true;
    }
    if (currentAllNormalizedHash !== lastAllNormalizedHash) {
      Logger.log(`Changes detected in ${allNormalizedSheetName}. Old hash: ${lastAllNormalizedHash}, New hash: ${currentAllNormalizedHash}`);
      changesDetected = true;
    }
  }

  if (changesDetected) {
    Logger.log('Changes detected. Running full sync.');
    runCompareIssues(); // Directly call runCompareIssues
    // Update stored hashes after successful sync
    if (currentGdudHash !== null) saveHash(gdudSheetName, currentGdudHash);
    if (currentAllNormalizedHash !== null) saveHash(allNormalizedSheetName, currentAllNormalizedHash);
    Logger.log('Sync complete and hashes updated.');
  } else {
    Logger.log('No changes detected in gdud or all_normalized sheets. Exiting conditional sync.');
  }
}