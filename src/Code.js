function run() {
  const inSheetName = "גיליון נשק";
  const outSheetName = "output2";

  normalizeTable(inSheetName, outSheetName);
}

function normalizeTable(inSheetName, outSheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let data = ss.getSheetByName(inSheetName).getDataRange().getValues();

  let res = [];

  for(let r = 0; r < data.length; r++) {
    const row = data[r];

    if(row[0] === "---") {
      break;
    }
    
    const id = row[3];
    const fname = row[4];
    const lname = row[5];

    if(r === 0) {
      const header = [
        id, fname, lname, "type", "uid"
      ]

      res.push(header);
      continue;
    }

    for(let c = 6; c < data[0].length; c++) {
      let tp = data[0][c];
      if(!tp) {
        continue;
      }

      let v = data[r][c];
      if(!v) {
        continue;
      }

      res.push([id, fname, lname, tp, v]);
    }
  }

  let outSheet = getOrCreateSheet(outSheetName);
  outSheet.clear();

  fillSheetWithData(outSheetName, res);
  
}

function getOrCreateSheet(sheetName) {
  // Get the active spreadsheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Try to get the sheet by name
  let sheet = ss.getSheetByName(sheetName);

  // If the sheet doesn't exist, create it
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  return sheet;
}

function fillSheetWithData(sheetName, data, startRow) {
  if (!data || data.length === 0) {
    Logger.log("The data array is empty. Nothing to write.");
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    Logger.log(`Sheet "${sheetName}" was not found.`);
    return;
  }

  const numRows = data.length;
  const numColumns = data[0].length;
  const startColumn = 1; // Always start at column A

  // Get the target range that matches the dimensions of your data array
  const range = sheet.getRange(startRow || 1, startColumn, numRows, numColumns);

  // Use setValues to write the entire 2D array at once
  range.setValues(data);
}

function runCompareIssues() {
  const sheet1Name = "all_normalized"; // User-specified first sheet name
  const sheet2Name = "gdud"; // User-specified second sheet name
  const outputSheetName = "all_issues_diff"; // Default output sheet name
  const mappings = getMappingsFromSheet(); // Get all mappings

  compareIssues(sheet1Name, sheet2Name, outputSheetName, mappings);
}

function runTransformPlugaA() {
  transformDataPlugaA();
}

function runTransformPlugaMS() {
  transformDataPlugaMS();
}
