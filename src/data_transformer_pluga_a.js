function transformDataPlugaA(outputSheetName) {
  const platoonName = 'פלוגה א'; // <--- Set for this platoon
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

  // In this sheet, item columns start from column H (index 7)
  const itemColumnStartIndex = 7;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    let squad = row[1]; // מחלקה is in Col B (index 1)
    const personalId = row[2] ? String(row[2]).trim() : null; // מספר אישי (מא) is in Col C (index 2)
    const lastName = row[3]; // שם משפחה is in Col D (index 3)
    const firstName = row[4]; // שם פרטי is in Col E (index 4)

    if (!personalId) {
      continue; // Skip rows without a personal ID
    }
    platoonPersonalIds.add(personalId); // Add personal ID to the set

    // Apply squad mapping
    if (squadMapping[squad]) {
      squad = squadMapping[squad];
    }

    // Process all item columns from index 7 to the end
    for (let colIndex = itemColumnStartIndex; colIndex < headerRow.length; colIndex++) {
      let type = headerRow[colIndex];
      let value = String(row[colIndex]).trim();

      if (type && value) { // Only process if there is a type and a value
        // Apply type mapping first
        if (typeMapping[type]) {
          type = typeMapping[type];
        }

        if (ignoreTypes.includes(type)) {
          continue; // Skip this item
        }

        if (emptyIdentifierTypes.includes(type)) {
          value = ''; // Set value to empty if type is in the list
        }
        
        // For this sheet, the quantity is always 1 for each item found.
        // The cell value is the identifier.
        const quantity = 1;

        newData.push([platoonName, squad, personalId, lastName, firstName, type, quantity, value, 'מנופק']);
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
