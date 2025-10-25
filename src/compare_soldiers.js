function compareSoldiers(sheet1Name, sheet2Name, outputSheetName) {
  Logger.log(`Starting comparison between "${sheet1Name}" and "${sheet2Name}".`);
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheet1 = ss.getSheetByName(sheet1Name);
  const sheet2 = ss.getSheetByName(sheet2Name);

  if (!sheet1) {
    console.error('Sheet 1 not found: ' + sheet1Name);
    return;
  }
  if (!sheet2) {
    console.error('Sheet 2 not found: ' + sheet2Name);
    return;
  }

  const data1 = sheet1.getDataRange().getValues();
  const data2 = sheet2.getDataRange().getValues();

  // Assuming headers are in the first row and in the order: 
  // ['פלוגה', 'מחלקה', 'מספר אישי', 'שם משפחה', 'שם פרטי', 'סוג פריט', 'כמות', 'מזהה', 'סטטוס']
  const platoonCol = 0; // 0-indexed
  const squadCol = 1; // 0-indexed
  const personalIdCol = 2; // 0-indexed
  const lastNameCol = 3; // 0-indexed
  const firstNameCol = 4; // 0-indexed
  const itemTypeCol = 5; // 0-indexed
  const identifierCol = 7; // 0-indexed for 'מזהה'
  const statusCol = 8; // 0-indexed for 'סטטוס'

  const soldierData1 = {};
  for (let i = 1; i < data1.length; i++) {
    const row = data1[i];
    const personalId = row[personalIdCol] ? String(row[personalIdCol]).trim() : null;
    if (personalId) {
      if (!soldierData1[personalId]) {
        soldierData1[personalId] = {
          items: [],
          types: new Set(),
          itemMap: new Map(), // To store "type:identifier" -> status
          platoon: row[platoonCol],
          squad: row[squadCol],
          lastName: row[lastNameCol],
          firstName: row[firstNameCol]
        };
      }
      soldierData1[personalId].items.push(row);
      soldierData1[personalId].types.add(row[itemTypeCol]);
      soldierData1[personalId].itemMap.set(`${row[itemTypeCol]}:${row[identifierCol]}`, row[statusCol]);
    }
  }

  const soldierData2 = {};
  for (let i = 1; i < data2.length; i++) {
    const row = data2[i];
    const personalId = row[personalIdCol] ? String(row[personalIdCol]).trim() : null;
    if (personalId) {
      if (!soldierData2[personalId]) {
        soldierData2[personalId] = {
          items: [],
          types: new Set(),
          itemMap: new Map(), // To store "type:identifier" -> status
          platoon: row[platoonCol],
          squad: row[squadCol],
          lastName: row[lastNameCol],
          firstName: row[firstNameCol]
        };
      }
      soldierData2[personalId].items.push(row);
      soldierData2[personalId].types.add(row[itemTypeCol]);
      soldierData2[personalId].itemMap.set(`${row[itemTypeCol]}:${row[identifierCol]}`, row[statusCol]);
    }
  }

  Logger.log(`Found ${Object.keys(soldierData1).length} unique soldiers in "${sheet1Name}".`);
  Logger.log(`Found ${Object.keys(soldierData2).length} unique soldiers in "${sheet2Name}".`);

  const discrepancies = [
    ['פלוגה', 'מחלקה', 'מספר אישי', 'שם משפחה', 'שם פרטי', 'סוג אי התאמה', 'פרטי אי התאמה', 'גיליון פלוגה - סוגי פריטים', 'גיליון גדודי - סוגי פריטים', 'גיליון פלוגה - כמות פריטים', 'גיליון גדודי - כמות פריטים', 'גיליון פלוגה - פריטים חסרים', 'גיליון גדודי - פריטים חסרים']
  ];

  const allPersonalIds = new Set([...Object.keys(soldierData1), ...Object.keys(soldierData2)]);
  Logger.log(`Total unique soldiers to compare: ${allPersonalIds.size}.`);

  for (const personalId of allPersonalIds) {
    const soldier1 = soldierData1[personalId];
    const soldier2 = soldierData2[personalId];

    const platoon = (soldier1 && soldier1.platoon) || (soldier2 && soldier2.platoon) || '';
    const squad = (soldier1 && soldier1.squad) || (soldier2 && soldier2.squad) || '';
    const lastName = (soldier1 && soldier1.lastName) || (soldier2 && soldier2.lastName) || '';
    const firstName = (soldier1 && soldier1.firstName) || (soldier2 && soldier2.firstName) || '';

    // Case 1: Soldier in Sheet 1 but not in Sheet 2
    if (soldier1 && !soldier2) {
      discrepancies.push([
        platoon, squad, personalId, lastName, firstName, 'חייל קיים רק בגיליון פלוגה',
        `חייל עם מספר אישי ${personalId} קיים רק בגיליון פלוגה (${sheet1Name}).`,
        Array.from(soldier1.types).sort().join(', '), // Show all types from sheet 1
        'אין',
        soldier1.items.length,
        0,
        Array.from(soldier1.itemMap.keys()).sort().join(', '), // All items from sheet 1
        'אין'
      ]);
      continue;
    }

    // Case 2: Soldier in Sheet 2 but not in Sheet 1
    if (!soldier1 && soldier2) {
      discrepancies.push([
        platoon, squad, personalId, lastName, firstName, 'חייל קיים רק בגיליון גדודי',
        `חייל עם מספר אישי ${personalId} קיים רק בגיליון גדודי (${sheet2Name}).`,
        'אין',
        Array.from(soldier2.types).sort().join(', '), // Show all types from sheet 2
        0,
        soldier2.items.length,
        'אין',
        Array.from(soldier2.itemMap.keys()).sort().join(', ') // All items from sheet 2
      ]);
      continue;
    }

    // Case 3: Soldier in both sheets, compare item counts, types, and individual items
    if (soldier1 && soldier2) {
      const itemsCount1 = soldier1.items.length;
      const itemsCount2 = soldier2.items.length;

      const types1Set = soldier1.types;
      const types2Set = soldier2.types;

      const types1Only = Array.from(types1Set).filter(type => !types2Set.has(type)).sort().join(', ');
      const types2Only = Array.from(types2Set).filter(type => !types1Set.has(type)).sort().join(', ');

      const itemMap1 = soldier1.itemMap;
      const itemMap2 = soldier2.itemMap;

      const items1Only = Array.from(itemMap1.keys()).filter(item => !itemMap2.has(item)).sort().join(', ');
      const items2Only = Array.from(itemMap2.keys()).filter(item => !itemMap1.has(item)).sort().join(', ');

      let hasDiscrepancy = false;
      let discrepancyDetails = [];

      if (itemsCount1 !== itemsCount2) {
        discrepancyDetails.push(`מספר פריטים שונה: גיליון פלוגה (${itemsCount1}), גיליון גדודי (${itemsCount2})`);
        hasDiscrepancy = true;
      }

      if (types1Only || types2Only) { // If there are any differences in types
        discrepancyDetails.push(`סוגי פריטים שונים`);
        hasDiscrepancy = true;
      }

      // Rule 2: Compare platoon and squad
      if (soldier1.platoon !== soldier2.platoon) {
        discrepancyDetails.push(`פלוגה שונה: גיליון פלוגה (${soldier1.platoon}), גיליון גדודי (${soldier2.platoon})`);
        hasDiscrepancy = true;
      }
      if (soldier1.squad !== soldier2.squad) {
        discrepancyDetails.push(`מחלקה שונה: גיליון פלוגה (${soldier1.squad}), גיליון גדודי (${soldier2.squad})`);
        hasDiscrepancy = true;
      }

      // Rule 3: Compare individual items (type:identifier)
      if (items1Only || items2Only) {
        discrepancyDetails.push(`פריטים שונים`);
        hasDiscrepancy = true;
      }

      // New Rule: Compare status for matching items
      const statusMismatches = [];
      for (const [itemKey, status1] of itemMap1.entries()) {
        if (itemMap2.has(itemKey)) {
          const status2 = itemMap2.get(itemKey);
          if (status1 !== status2) {
            statusMismatches.push(`${itemKey}: גיליון פלוגה (${status1}), גיליון גדודי (${status2})`);
          }
        }
      }
      if (statusMismatches.length > 0) {
        discrepancyDetails.push(`אי התאמת סטטוס: ${statusMismatches.join(', ')}`);
        hasDiscrepancy = true;
      }

      if (hasDiscrepancy) {
        discrepancies.push([
          platoon, squad, personalId, lastName, firstName, 'אי התאמה בפריטים/סוגים/פרטי חייל',
          discrepancyDetails.join('; '),
          types1Only || '', // Show only differences, or ""
          types2Only || '', // Show only differences, or ""
          itemsCount1,
          itemsCount2,
          items1Only || '',
          items2Only || ''
        ]);
      }
    }
  }

  const outputSheetNameStr = outputSheetName || 'Soldier Comparison Report';
  let outputSheet = ss.getSheetByName(outputSheetNameStr);
  if (!outputSheet) {
    outputSheet = ss.insertSheet(outputSheetNameStr);
  }

  outputSheet.clear();
  if (discrepancies.length > 1) { // More than just headers
    outputSheet.getRange(1, 1, discrepancies.length, discrepancies[0].length).setValues(discrepancies);
  } else {
    outputSheet.getRange(1, 1, 1, discrepancies[0].length).setValues(discrepancies); // Write only headers if no discrepancies
  }
  Logger.log('Comparison complete. Check sheet: ' + outputSheetNameStr);
}
