// All text of the app lives in this file, so it can be checked and translated in one place.
// Rule: simple English for B1 readers. Short sentences. One word means one thing.

export const strings = {
  app: {
    notMedical: 'This is a personal diary, not a diagnosis. If your cat looks unwell, call a vet.',
  },

  common: {
    save: 'Save',
    delete: 'Delete',
    deleteConfirm: 'Tap again to delete',
    close: 'Close',
    today: 'Today',
    showMore: 'Show more',
    all: 'All',
    days: (n: number) => (n === 1 ? '1 day' : `${n} days`),
  },

  // The export uses "Stool" (vet word). The screens use "Poop" (owner word).
  types: {
    stool: { emoji: '💩', label: 'Poop', exportLabel: 'Stool' },
    water: { emoji: '🚰', label: 'Water', exportLabel: 'Water' },
    sleep: { emoji: '🌙', label: 'Sleep', exportLabel: 'Sleep' },
    stress: { emoji: '😿', label: 'Stress', exportLabel: 'Stress' },
  },

  tabs: {
    calendar: { emoji: '📅', label: 'Calendar' },
    log: { emoji: '📋', label: 'Log' },
    periods: { emoji: '🗓️', label: 'Periods' },
    analysis: { emoji: '📊', label: 'Analysis' },
  },

  quickBar: { label: 'Add an entry' },

  // One scale for mucus, blood and smell. The index is the code (0 to 3).
  scale: ['None', 'Mild', 'Medium', 'Strong'],

  textures: [
    { code: 1, emoji: '🪨', label: 'Hard', hint: 'Dry, hard pellets' },
    { code: 2, emoji: '✅', label: 'Normal', hint: 'Firm, keeps its shape' },
    { code: 3, emoji: '🍌', label: 'Soft', hint: 'Moist, still keeps its shape' },
    { code: 4, emoji: '🍦', label: 'Very soft', hint: 'No shape, like paste' },
    { code: 5, emoji: '💦', label: 'Watery', hint: 'Liquid, no shape' },
  ],

  features: {
    mucus: { emoji: '🐌', label: 'Mucus', hint: 'Slimy or jelly-like coating' },
    blood: { emoji: '🩸', label: 'Blood', hint: 'Red streaks or drops, or very dark stool' },
    smell: { emoji: '👃', label: 'Bad smell', hint: 'Smells much worse than usual' },
  },

  waterLevels: [
    { code: 1, emoji: '🏜️', label: 'Little' },
    { code: 2, emoji: '👌', label: 'Enough' },
    { code: 3, emoji: '🌊', label: 'A lot' },
  ],
  waterHint: 'Compared with usual',

  sleepTags: [
    { text: 'Awake at night', emoji: '👀' },
    { text: 'Meowing at night', emoji: '📢' },
    { text: 'Sleeps too much', emoji: '😴' },
    { text: 'Restless sleep', emoji: '😣' },
  ],

  stressSeverity: [
    { code: 1, emoji: '😟', label: 'Mild' },
    { code: 2, emoji: '😿', label: 'Medium' },
    { code: 3, emoji: '🙀', label: 'Strong' },
  ],

  stressTags: [
    { text: 'Visitors', emoji: '👥' },
    { text: 'Loud noise', emoji: '🔊' },
    { text: 'Home repairs', emoji: '🔨' },
    { text: 'Vet visit', emoji: '🏥' },
    { text: 'Moving or new place', emoji: '📦' },
    { text: 'Other pet', emoji: '🐕' },
    { text: 'New food', emoji: '🍽️' },
    { text: 'New medicine', emoji: '💊' },
    { text: 'Hot weather', emoji: '🥵' },
  ],

  periodKinds: {
    med: { emoji: '💊', label: 'Medicine' },
    food: { emoji: '🍽️', label: 'Food' },
    supp: { emoji: '🧴', label: 'Supplement' },
    other: { emoji: '📌', label: 'Other' },
  },
  periodNameHints: ['New food', 'Antibiotics', 'Probiotic'],

  colors: {
    teal: 'Teal',
    orange: 'Orange',
    purple: 'Purple',
    blue: 'Blue',
    pink: 'Pink',
    olive: 'Olive',
    red: 'Red',
    brown: 'Brown',
    gray: 'Gray',
    gold: 'Gold',
  },

  onboarding: {
    title: 'Welcome to catlog',
    intro:
      'Write down what your cat eats, drinks and does. Look at it later or show it to your vet.',
    privacy: 'Your data stays on this phone. There is no account and no server.',
    nameLabel: 'Your cat’s name',
    start: 'Start',
    haveBackup: 'I already have a backup',
  },

  header: {
    settings: 'Settings',
    cat: 'Cat',
  },

  banners: {
    timeZoneChanged: (tz: string) =>
      `Time zone changed to ${tz}. New entries use ${tz}. Old entries keep their original time.`,
    backupDue: 'Back up your data. You added new entries since your last backup.',
    firstRun:
      'Your data is saved in this browser. Do not clear the site data. Back up often. Tap “Where is my data?” in Settings to learn more.',
    dismiss: 'Dismiss',
  },

  form: {
    dateTime: 'Date and time',
    note: 'Note',
    notePlaceholder: 'Write a note (optional)',
    textureOptional: 'Texture (optional)',
    extras: 'Other signs (optional)',
    waterQuestion: 'How much did your cat drink?',
    sleepQuestion: 'What happened?',
    stressStrength: 'How strong? (optional)',
    stressCause: 'Cause',
    addOwn: 'Add your own…',
    addOwnButton: 'Add tag',
    errWater: 'Choose how much water.',
    errDate: 'Enter a valid date and time.',
    errSave: 'Could not save. Try again.',
  },

  day: {
    noEntries: 'No entries on this day.',
    activePeriods: 'Active periods',
    addEntry: 'Add entry',
    addPeriod: 'Add period',
  },

  calendar: {
    previous: 'Previous month',
    next: 'Next month',
    periodsThisMonth: 'Periods this month',
    noPeriods: 'No periods this month.',
    hiddenPeriods: (n: number) =>
      n === 1 ? '1 more period is not shown.' : `${n} more periods are not shown.`,
    poopCount: (n: number) => `${n} poop`,
    flags: {
      blood: 'Blood',
      mucus: 'Mucus',
      smell: 'Bad smell',
      watery: 'Watery or very soft stool',
      hard: 'Hard stool',
      sleep: 'Sleep problem',
      stress: 'Stress',
    },
    waterLabel: (label: string) => `Water: ${label}`,
  },

  log: {
    empty: 'No entries yet. Tap a button above to add one.',
    filter: 'Show',
  },

  periods: {
    newPeriod: 'New period',
    editPeriod: 'Edit period',
    ongoing: 'Ongoing',
    finished: 'Finished',
    emptyOngoing: 'No ongoing periods.',
    empty: 'No periods yet. Add one for a new food or a medicine.',
    title: 'Name',
    kind: 'Type',
    start: 'Start date',
    end: 'End date',
    endHint: 'Leave empty if it is still going.',
    note: 'Note',
    color: 'Color',
    endToday: 'End today',
    since: (date: string) => `Since ${date}`,
    range: (from: string, to: string) => `${from} to ${to}`,
    errTitle: 'Enter a name.',
    errDates: 'Enter valid dates. The end date cannot be before the start date.',
    errSave: 'Could not save. Try again.',
  },

  analysis: {
    range: 'Time range',
    ranges: { '7': '7 days', '14': '14 days', '30': '30 days', '90': '90 days', all: 'All' },
    summary: 'Summary',
    daysWithEntries: 'Days with entries',
    stoolTotal: 'Poop in total',
    stoolPerDay: 'Poop per day',
    wateryShare: 'Watery or very soft',
    hardShare: 'Hard',
    noTexture: 'No texture entered',
    anyDays: 'Days with any level',
    strongDays: 'Days medium or strong',
    waterDays: 'Water (last entry of each day)',
    sleepDays: 'Days with sleep problems',
    stressDays: 'Days with stress',
    causes: 'Common causes of stress',
    sleepTags: 'Common sleep problems',
    none: 'No data in this range.',
    table: 'Day by day',
    colDay: 'Day',
    colPoop: 'Poop',
    colExtras: 'Extras',
    colWater: 'Water',
    colSleepStress: 'Sleep and stress',
    colPeriods: 'Periods',
    copyVet: 'Copy summary for vet',
    copied: 'Copied.',
    copyFailed: 'Could not copy. Select the text and copy it by hand.',
    vetTitle: 'Summary for vet',
  },

  // Text of the summary for the vet (plain text that the owner can paste into a message).
  vet: {
    title: 'Summary from the cat diary',
    cat: 'Cat',
    period: 'Period',
    daysWithEntries: 'Days with entries',
    poop: 'Poop',
    total: 'Total',
    perDay: 'per day',
    wateryShare: 'Watery or very soft (share of poop with a texture)',
    hardShare: 'Hard (share of poop with a texture)',
    mucusDays: 'Days with mucus',
    bloodDays: 'Days with blood',
    smellDays: 'Days with bad smell',
    strongOnly: 'medium or strong',
    episodes: 'Poop with blood or mucus',
    water: 'Water, number of days by the last entry of each day',
    waterNote: 'compared with usual',
    sleep: 'Sleep problems',
    stress: 'Stress',
    days: 'days',
    periods: 'Periods',
    ongoing: 'ongoing',
  },

  settings: {
    title: 'Settings',
    cats: 'Cats',
    addCat: 'Add a cat',
    catName: 'Name',
    rename: 'Rename',
    archive: 'Archive',
    unarchive: 'Restore',
    timeZone: 'Time zone',
    followDevice: 'Same as my phone (default)',
    fixed: 'Fixed time zone',
    fixedHint: 'Use this if you travel and want to count days by your home time.',
    currentZone: (tz: string) => `Now in use: ${tz}`,
    weekStart: 'Week starts on',
    monday: 'Monday',
    sunday: 'Sunday',
    data: 'Your data',
    backupNow: 'Back up now',
    importBackup: 'Import backup',
    lastBackup: (date: string) => `Last backup: ${date}`,
    neverBackedUp: 'No backup yet.',
    export: 'Export',
    exportXlsx: 'Excel file (.xlsx)',
    exportCsv: 'CSV files',
    exportCsvSemicolon: 'CSV for Excel with semicolons',
    exportRange: 'Export range',
    storage: 'Storage',
    storageProtected: 'Protected. The browser keeps your data unless you delete it.',
    storageNotProtected:
      'Not protected. The browser may delete your data when space is low. Back up often.',
    storageUnknown: 'Unknown. This browser does not tell.',
    whereIsData: 'Where is my data?',
    about: 'About',
    deleteAll: 'Delete all data',
    deleteAllConfirm: 'Tap again to delete everything on this phone',
    deleteAllHint: 'This cannot be undone. Make a backup first.',
  },

  backup: {
    savedToDownloads:
      'Saved to Downloads. To send it to Telegram: open Telegram, then Saved Messages, tap the attach button, choose File, then Downloads.',
    shared: 'Backup shared.',
    cancelled: 'Backup cancelled.',
    failed: 'Backup failed. Try again.',
    importTitle: 'Import backup',
    importChoose: 'Choose a backup file (.json).',
    importPreview: (added: number, updated: number, same: number) =>
      `${added} to add, ${updated} to update, ${same} already the same.`,
    importConfirm: 'Import',
    importDone: 'Import finished.',
    errFile: 'This file is not a catlog backup.',
    errTooBig: 'This file is too big.',
    errNewer: 'This backup comes from a newer version of catlog. Update the app first.',
    errRead: 'Could not read the file.',
    counts: (cats: number, events: number, periods: number) =>
      `${cats} cats, ${events} entries, ${periods} periods`,
  },

  export: {
    done: 'Export ready.',
    failed: 'Export failed. Try again.',
  },

  dataInfo: {
    title: 'Where is my data?',
    paragraphs: [
      'Your entries are saved in this browser, on this phone. They never go to a server.',
      'If you clear “cookies and site data” or “storage” for this app, all entries are deleted.',
      'Clearing only “cached images and files” is safe. The data stays.',
      'In Firefox, the setting “Delete browsing data on quit” can delete your data every time you close the browser. Turn it off for “Cookies and site data”.',
      'Make a backup often. A backup is a file that you can import later.',
    ],
  },

  aboutInfo: {
    title: 'About catlog',
    paragraphs: [
      'catlog is a free and open source diary for cat owners.',
      'It has no account, no ads and no tracking. After it loads, it does not use the network.',
      'It is not a medical app. If your cat looks unwell, call a vet.',
    ],
    version: (v: string) => `Version ${v}`,
  },

  errors: {
    loadFailed:
      'Could not open the storage of this browser. Close other tabs of this app and reload.',
    noStorage: 'This browser cannot save data here. Try another browser or turn off private mode.',
  },
};
