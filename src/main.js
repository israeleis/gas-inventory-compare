/**
 * @OnlyCurrentDoc
 */
function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('Custom Scripts')
      .addItem('Transform Data (פלוגה ג)', 'runTransformPlugaC')
      .addItem('Transform Data (פלוגה ב)', 'runTransformPlugaB')
      .addItem('Transform Data (פלוגה א)', 'runTransformPlugaA')
      .addItem('Transform Data (מסייעת)', 'runTransformPlugaMS')
      .addSeparator() // Add a separator for better organization
      .addItem('Compare All to Gdud', 'runCompareAll')
      .addItem('Compare Issues', 'runCompareIssues')
      .addItem('Aggregate All Platoons', 'aggregateData')
      .addSeparator()
      .addItem('Create Mappings Sheet', 'createMappingsSheet')
      .addSeparator()
      .addItem('Create Sync Trigger', 'createSyncTrigger')
      .addItem('Run Sync', 'conditionalSync')
      .addToUi();
}

function runTransformPlugaC() {
  transformDataPlugaC();
}

function runTransformPlugaB() {
  transformDataPlugaB();
}

function runCompareAll() {
  compareIssues('all_normalized', 'gdud', 'all_diff');
}


function createSyncTrigger() {
  // Deletes all existing triggers to avoid duplicates
  const allTriggers = ScriptApp.getProjectTriggers();
  for (const trigger of allTriggers) {
    ScriptApp.deleteTrigger(trigger);
  }

  // Creates a new trigger
  ScriptApp.newTrigger('conditionalSync')
      .timeBased()
      .everyMinutes(1)
      .create();
  
  SpreadsheetApp.getUi().alert('Sync trigger created successfully. The script will run every 5 minutes.');
}

function createMappingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('mappings')) {
    const sheet = ss.insertSheet('mappings');
    sheet.getRange('A1:D1').setValues([['פלוגה', 'סוג מיפוי', 'ערך מקור', 'ערך יעד']]);
    sheet.getRange('A2:D2').setValues([['', 'מחלקה', 'מפל״ג', 'מפלג']]); // Global mapping
    sheet.getRange('A3:D3').setValues([['', 'סוג פריט', 'טריג\'', 'טריג\'יקון']]); // Global mapping
    sheet.getRange('A4:C4').setValues([['', 'מזהה ריק', 'M5']]); // Global mapping
    sheet.getRange('A5:C5').setValues([['', 'מזהה ריק', 'טריג\'יקון']]); // Global mapping
    sheet.getRange('A6:D6').setValues([['פלוגה ג', 'סוג פריט', 'קסדה', 'קסדה טקטית']]); // Platoon-specific mapping
    sheet.getRange('A7:C7').setValues([['', 'התעלם', 'פקל']]); // Ignore mapping
  }
}