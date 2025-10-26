function compareIssues(sheet1Name, sheet2Name, outputSheetName, mappings) {
  Logger.log(`Starting issue-based comparison between "${sheet1Name}" and "${sheet2Name}".`);
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

  let data1 = sheet1.getDataRange().getValues();
  let data2 = sheet2.getDataRange().getValues();

  const header1 = data1.shift(); // Remove header row
  const header2 = data2.shift(); // Remove header row

  // Function to apply mappings to a dataset
  const applyMappings = (data, header) => {
    const itemTypeCol = header.indexOf('סוג פריט');
    const squadCol = header.indexOf('מחלקה');

    if (!mappings) return data;

    const mappedData = data.map(row => {
      let itemType = row[itemTypeCol];
      let squad = row[squadCol];

      // Apply type mapping
      if (mappings.typeMapping && mappings.typeMapping[itemType]) {
        itemType = mappings.typeMapping[itemType];
      }

      // Apply squad mapping
      if (mappings.squadMapping && mappings.squadMapping[squad]) {
        squad = mappings.squadMapping[squad];
      }

      // Check if item type should be ignored
      if (mappings.ignoreTypes && mappings.ignoreTypes.includes(itemType)) {
        return null; // This row will be filtered out
      }

      const newRow = [...row];
      newRow[itemTypeCol] = itemType;
      newRow[squadCol] = squad;
      return newRow;
    });

    return mappedData.filter(row => row !== null);
  };

  data1 = applyMappings(data1, header1);
  data2 = applyMappings(data2, header2);


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
  for (let i = 0; i < data1.length; i++) {
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
  for (let i = 0; i < data2.length; i++) {
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
    ['פלוגה', 'מחלקה', 'מספר אישי', 'שם משפחה', 'שם פרטי', 'סוג אי התאמה', 'תיאור אי התאמה', 'ערך בגיליון פלוגה', 'ערך בגיליון גדודי']
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
        `סוגי פריטים: ${Array.from(soldier1.types).sort().join(', ')} | פריטים: ${Array.from(soldier1.itemMap.keys()).sort().join(', ')}`,
        'אין'
      ]);
      continue;
    }

    // Case 2: Soldier in Sheet 2 but not in Sheet 1
    if (!soldier1 && soldier2) {
      let discrepancyType = 'חייל קיים רק בגיליון גדודי';
      let discrepancyDetails = `חייל עם מספר אישי ${personalId} קיים רק בגיליון גדודי (${sheet2Name}).`;

      if (doesSoldierExistInAnyPlatoon(personalId)) {
        discrepancyType = 'חייל קיים בגיליון גדודי אך ללא פריטים בגיליון פלוגה';
        discrepancyDetails = `חייל עם מספר אישי ${personalId} קיים בגיליון גדודי אך ללא פריטים בגיליון פלוגה.`;
      }

      discrepancies.push([
        platoon, squad, personalId, lastName, firstName, discrepancyType,
        discrepancyDetails,
        'אין',
        `סוגי פריטים: ${Array.from(soldier2.types).sort().join(', ')} | פריטים: ${Array.from(soldier2.itemMap.keys()).sort().join(', ')}`
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

      // Item count difference
      if (itemsCount1 !== itemsCount2) {
        discrepancies.push([
          platoon, squad, personalId, lastName, firstName, 'מספר פריטים שונה',
          `מספר פריטים שונה עבור חייל ${personalId}`,
          itemsCount1,
          itemsCount2
        ]);
      }

      // Item types only in Sheet 1
      if (types1Only) {
        discrepancies.push([
          platoon, squad, personalId, lastName, firstName, 'סוגי פריטים קיימים רק בגיליון פלוגה',
          `סוגי פריטים ${types1Only} קיימים רק בגיליון פלוגה עבור חייל ${personalId}`,
          types1Only,
          'אין'
        ]);
      }

      // Handle items/types only in Sheet 2
      if (types2Only && items2Only) {
        let description;
        let valueColumn;
        if (types2Only === items2Only) {
          description = `פריטים וסוגי פריטים (${types2Only}) של חייל ${personalId} קיימים רק בגיליון גדודי`;
          valueColumn = types2Only;
        } else {
          description = `קיימים רק בגיליון גדודי עבור חייל ${personalId}: סוגי פריטים (${types2Only}), פריטים (${items2Only})`;
          valueColumn = `סוגי פריטים: ${types2Only} | פריטים: ${items2Only}`;
        }
        discrepancies.push([
          platoon, squad, personalId, lastName, firstName, 'פריטים וסוגי פריטים קיימים רק בגיליון גדודי',
          description,
          'אין', // Value in Sheet 1
          valueColumn // Value in Sheet 2
        ]);
      } else if (types2Only) {
        discrepancies.push([
          platoon, squad, personalId, lastName, firstName, 'סוגי פריטים קיימים רק בגיליון גדודי',
          `סוגי פריטים ${types2Only} קיימים רק בגיליון גדודי עבור חייל ${personalId}`,
          'אין',
          types2Only
        ]);
      } else if (items2Only) {
        discrepancies.push([
          platoon, squad, personalId, lastName, firstName, 'פריטים קיימים רק בגיליון גדודי',
          `פריטים ${items2Only} של חייל ${personalId} קיימים רק בגיליון גדודי`,
          'אין',
          items2Only
        ]);
      }

      // Items only in Sheet 1
      if (items1Only) {
        discrepancies.push([
          platoon, squad, personalId, lastName, firstName, 'פריטים קיימים רק בגיליון פלוגה',
          `פריטים ${items1Only} של חייל ${personalId} קיימים רק בגיליון פלוגה`,
          items1Only,
          'אין'
        ]);
      }

      // Status mismatches
      for (const [itemKey, status1] of itemMap1.entries()) {
        if (itemMap2.has(itemKey)) {
          const status2 = itemMap2.get(itemKey);
          if (status1 !== status2) {
            discrepancies.push([
              platoon, squad, personalId, lastName, firstName, 'אי התאמת סטטוס פריט',
              `סטטוס שונה עבור פריט "${itemKey}" של חייל ${personalId}`,
              status1,
              status2
            ]);
          }
        }
      }
    }
  }

  const outputSheetNameStr = outputSheetName || 'all_issues_diff';
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
  Logger.log('Issue comparison complete. Check sheet: ' + outputSheetNameStr);
}