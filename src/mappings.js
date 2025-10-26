/**
 * Reads mappings from a sheet named 'mappings'.
 * The sheet should have 4 columns: פלוגה, סוג מיפוי, ערך מקור, ערך יעד.
 * @param {string} [platoonName] - Optional. The name of the platoon to filter mappings for. If not provided, all mappings are returned.
 * @returns {object} An object containing the mappings.
 */
function getMappingsFromSheet(platoonName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mappingSheet = ss.getSheetByName('mappings');
  
  if (!mappingSheet) {
    console.error('Mapping sheet not found. Please create a sheet named "mappings".');
    return null;
  }
  
  const data = mappingSheet.getDataRange().getValues();
  const mappings = {
    typeMapping: {},
    squadMapping: {},
    emptyIdentifierTypes: [],
    ignoreTypes: []
  };

  const HEBREW_TO_MAPPING_TYPE = {
    'סוג פריט': 'typeMapping',
    'מחלקה': 'squadMapping',
    'מזהה ריק': 'emptyIdentifierTypes',
    'התעלם': 'ignoreTypes'
  };

  // Start from row 1 to skip header
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const mappingPlatoon = row[0];
    const hebrewMappingType = row[1];
    const fromValue = row[2];
    const toValue = row[3];

    const mappingType = HEBREW_TO_MAPPING_TYPE[hebrewMappingType];

    // Apply mapping if it's global (no platoon specified) or matches the platoonName, or if no platoonName is provided.
    if (!platoonName || !mappingPlatoon || mappingPlatoon === platoonName) {
      if (mappingType === 'typeMapping' && fromValue && toValue) {
        mappings.typeMapping[fromValue] = toValue;
      } else if (mappingType === 'squadMapping' && fromValue && toValue) {
        mappings.squadMapping[fromValue] = toValue;
      } else if (mappingType === 'emptyIdentifierTypes' && fromValue) {
        mappings.emptyIdentifierTypes.push(fromValue);
      } else if (mappingType === 'ignoreTypes' && fromValue) {
        mappings.ignoreTypes.push(fromValue);
      }
    }
  }
  
  return mappings;
}
