function transformDataPlugaMS(outputSheetName) {
  const platoonName = 'מסייעת'; // <--- Set for this platoon
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

  // Column indices for 'מסייעת' platoon
  const squadCol = 0; // מחלקה is the 1st column (index 0)
  const personalIdCol = 1; // מספר אישי is the 2nd column (index 1)
  const lastNameCol = 3; // שם משפחה is the 4th column (index 3)
  const firstNameCol = 4; // שם פרטי is the 5th column (index 4)
  const itemColumnStartIndex = 6; // Item columns start from the 7th column (index 6)

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    let squad = row[squadCol];
    const personalId = row[personalIdCol] ? String(row[personalIdCol]).trim() : null;
    const lastName = row[lastNameCol];
    const firstName = row[firstNameCol];

    if (!personalId) {
      continue; // Skip rows without a personal ID
    }
    platoonPersonalIds.add(personalId); // Add personal ID to the set

    // Process all item columns from itemColumnStartIndex to the end
    for (let colIndex = itemColumnStartIndex; colIndex < headerRow.length; colIndex++) {
      let type = headerRow[colIndex];
      let value = String(row[colIndex]).trim(); // Trim value to handle empty cells correctly

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
