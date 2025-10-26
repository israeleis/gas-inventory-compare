function transformDataPlugaB(outputSheetName) {
  const platoonName = 'פלוגה ב'; // <--- Set for this platoon
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inputSheet = ss.getSheetByName(platoonName);

  if (!inputSheet) {
    console.error('Input sheet not found: ' + platoonName);
    return;
  }

  const data = inputSheet.getDataRange().getValues();
  const headerRow = data[0];

  const headers = ['פלוגה', 'מחלקה', 'מספר אישי', 'שם משפחה', 'שם פרטי', 'סוג פריט', 'כמות', 'מזהה', 'סטטוס'];
  const newData = [headers];
  const platoonPersonalIds = new Set(); // Use a Set to store unique personal IDs

  // In this sheet, all item columns start from column H (index 7)
  const itemColumnStartIndex = 7;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    let squad = row[2]; // מחלקה is in Col C
    const personalId = row[3] ? String(row[3]).trim() : null; // מספר אישי is in Col D
    const lastName = row[4]; // שם משפחה is in Col E
    const firstName = row[5]; // שם פרטי is in Col F

    if (!personalId) {
      continue; // Skip rows without a personal ID
    }
    platoonPersonalIds.add(personalId); // Add personal ID to the set

    // Process all item columns from index 7 to the end
    for (let colIndex = itemColumnStartIndex; colIndex < headerRow.length; colIndex++) {
      let type = headerRow[colIndex];
      let value = String(row[colIndex]).trim();

      if (type && value) { // Only process if there is a type and a value
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
