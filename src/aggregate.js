/**
 * Aggregates data from all platoon-specific _normalized sheets into all_normalized.
 */
function aggregateData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('settings');
  const allNormalizedSheet = ss.getSheetByName('all_normalized');

  if (!settingsSheet) {
    SpreadsheetApp.getUi().alert('Settings sheet not found. Please create a sheet named "settings" with platoon names in the first column.');
    return;
  }

  if (!allNormalizedSheet) {
    ss.insertSheet('all_normalized');
  }

  const platoonNames = settingsSheet.getRange('A1:A').getValues().filter(String);
  const allData = [];
  const headers = ['פלוגה', 'מחלקה', 'מספר אישי', 'שם משפחה', 'שם פרטי', 'סוג פריט', 'כמות', 'מזהה', 'סטטוס'];
  allData.push(headers);

  for (const [platoonName] of platoonNames) {
    const normalizedSheet = ss.getSheetByName(`${platoonName}_normalized`);
    if (normalizedSheet) {
      const data = normalizedSheet.getDataRange().getValues();
      // Start from row 1 to skip headers of individual sheets
      for (let i = 1; i < data.length; i++) {
        allData.push(data[i]);
      }
    }
  }

  allNormalizedSheet.clear();
  allNormalizedSheet.getRange(1, 1, allData.length, headers.length).setValues(allData);
}
