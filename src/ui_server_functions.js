function getSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  return sheets.map(sheet => sheet.getName());
}

function compareSheets(sheet1Name, sheet2Name, outputSheetName) {
  compareSoldiers(sheet1Name, sheet2Name, outputSheetName);
}

function saveProperties(props) {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperties(props);
}

function loadProperties() {
  const userProperties = PropertiesService.getUserProperties();
  return userProperties.getProperties();
}
