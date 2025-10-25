function transformDataPlugaC(outputSheetName) {
  const platoonName = 'פלוגה ג'; // <--- CHANGE THIS FOR EACH PLATOON
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inputSheet = ss.getSheetByName(platoonName);

  if (!inputSheet) {
    console.error('Input sheet not found: ' + platoonName);
    return;
  }

  const mappings = getMappingsFromSheet(platoonName);
  if (!mappings) return; // Stop if mappings sheet is not found

  const { typeMapping, squadMapping, emptyIdentifierTypes, ignoreTypes } = mappings;

  const data = inputSheet.getDataRange().getValues();
  const headerRow = data[0];

  const headers = ['פלוגה', 'מחלקה', 'מספר אישי', 'שם משפחה', 'שם פרטי', 'סוג פריט', 'כמות', 'מזהה', 'סטטוס'];
  const newData = [headers];
  const platoonPersonalIds = new Set(); // Use a Set to store unique personal IDs

  const itemColumns = [[6, 7], [9, 10], [11, 12], [13, 14], [15, 16]]; // 0-indexed
  const singleItemColumns = [17, 18, 19, 20]; // 0-indexed for columns 18, 19, 20, 21

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    let platoon = row[1]; // מחלקה
    const personalId = row[2] ? String(row[2]).trim() : null; // מספר אישי
    const lastName = row[3]; // שם משפחה
    const firstName = row[4]; // שם פרטי

    if (!personalId) {
      continue; // Skip rows without a personal ID
    }
    platoonPersonalIds.add(personalId); // Add personal ID to the set

    // Apply squad mapping
    if (squadMapping[platoon]) {
      platoon = squadMapping[platoon];
    }

    // Process paired columns
    for (const pair of itemColumns) {
      let type = row[pair[0]];
      let value = String(row[pair[1]]).trim();

      // Apply type mapping first
      if (typeMapping[type]) {
        type = typeMapping[type];
      }

      if (ignoreTypes.includes(type)) {
        continue; // Skip this item
      }

      // Re-introduce the "V" logic for paired columns if type exists and value is empty
      if (type && !value) { // If type exists and value is empty after trimming
        value = "V";
      }

      if (type && value) { // This is where the item is added
        if (emptyIdentifierTypes.includes(type)) {
          value = ''; // Set value to empty if type is in the list
        }
        newData.push([platoonName, platoon, personalId, lastName, firstName, type, 1, value, 'מנופק']);
      }
    }

    // Process single columns
    for (const colIndex of singleItemColumns) {
      let type = headerRow[colIndex];
      let value = String(row[colIndex]).trim();

      // Apply type mapping first
      if (typeMapping[type]) {
        type = typeMapping[type];
      }

      if (ignoreTypes.includes(type)) {
        continue; // Skip this item
      }

      if (value) {
        if (emptyIdentifierTypes.includes(type)) {
          value = ''; // Set value to empty if type is in the list
        }
        newData.push([platoonName, platoon, personalId, lastName, firstName, type, 1, value, 'מנופק']);
      }
    }
  }

  updateAllSoldiersInPlatoonsSheet(Array.from(platoonPersonalIds)); // Update the master list of soldier IDs

  const outputSheetNameStr = outputSheetName || platoonName + '_normalized';
  let outputSheet = ss.getSheetByName(outputSheetNameStr);
  if (!outputSheet) {
    outputSheet = ss.insertSheet(outputSheetNameStr);
  }

  outputSheet.clear();
  outputSheet.getRange(1, 1, newData.length, newData[0].length).setValues(newData);
  aggregateData();
}
