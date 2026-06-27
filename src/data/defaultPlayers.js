export const IPL_SETS = [
  'Marquee Set',
  'Capped Batter',
  'Uncapped Batter',
  'Capped Bowler',
  'Uncapped Bowler',
  'Capped All-rounder',
  'Uncapped All-rounder',
  'Capped Wicketkeeper',
  'Uncapped Wicketkeeper',
];

export const SET_ORDER = [
  'Marquee Set',
  'Capped Batter',
  'Uncapped Batter',
  'Capped All-rounder',
  'Uncapped All-rounder',
  'Capped Bowler',
  'Uncapped Bowler',
  'Capped Wicketkeeper',
  'Uncapped Wicketkeeper',
];

/** Infer a set from a player's role/capped status when the set column is missing.
 *  Also maps legacy set names (e.g. "Batsman Set") to the new 9 sets.
 */
export function inferSet(player) {
  // If already assigned to one of the known new sets, keep it
  const knownNewSets = new Set(IPL_SETS);
  if (player.set && knownNewSets.has(player.set)) return player.set;

  const role = (player.role || '').toLowerCase();
  const cat = (player.category || '').toLowerCase();
  const isCapped = player.capped === true || player.capped === 'true' || player.capped === 'yes' || player.capped === 1;

  // Marquee always stays Marquee
  if (cat.includes('marquee') || player.set === 'Marquee Set') return 'Marquee Set';

  // WK / Wicketkeeper
  if (role.includes('wk') || role.includes('keeper') || role.includes('wicket')) {
    return isCapped ? 'Capped Wicketkeeper' : 'Uncapped Wicketkeeper';
  }

  // All-Rounder
  if (role.includes('all-rounder') || role.includes('allrounder')) {
    return isCapped ? 'Capped All-rounder' : 'Uncapped All-rounder';
  }

  // Bowler
  if (role.includes('bowler')) {
    return isCapped ? 'Capped Bowler' : 'Uncapped Bowler';
  }

  // Batter / Batsman
  if (role.includes('batter') || role.includes('batsman')) {
    return isCapped ? 'Capped Batter' : 'Uncapped Batter';
  }

  // Fallback: guess from old set names
  if (player.set) {
    const oldSet = player.set;
    if (oldSet === 'Batsman Set') return isCapped ? 'Capped Batter' : 'Uncapped Batter';
    if (oldSet === 'Bowler Set') return isCapped ? 'Capped Bowler' : 'Uncapped Bowler';
    if (oldSet === 'All-Rounder Set') return isCapped ? 'Capped All-rounder' : 'Uncapped All-rounder';
    if (oldSet === 'Wicketkeeper Set') return isCapped ? 'Capped Wicketkeeper' : 'Uncapped Wicketkeeper';
    if (oldSet === 'Emerging Player Set' || oldSet === 'Overseas Set') {
      // Try to infer from role
      if (role.includes('bowler')) return isCapped ? 'Capped Bowler' : 'Uncapped Bowler';
      if (role.includes('all-rounder') || role.includes('allrounder')) return isCapped ? 'Capped All-rounder' : 'Uncapped All-rounder';
      if (role.includes('wk') || role.includes('keeper') || role.includes('wicket')) return isCapped ? 'Capped Wicketkeeper' : 'Uncapped Wicketkeeper';
      return isCapped ? 'Capped Batter' : 'Uncapped Batter';
    }
    // Unknown custom set — preserve it
    return oldSet;
  }

  return isCapped ? 'Capped Batter' : 'Uncapped Batter';
}

export const DEFAULT_PLAYERS = [
  // ── MARQUEE SET ──────────────────────────────────────────────────────────────
  { id:'p001', name:'Virat Kohli',        set:'Marquee Set',       role:'Batter',      country:'India',        basePrice:'20Cr', capped:true,  category:'Marquee',       age:35, battingAvg:55.8, strikeRate:143.2, wickets:0,   economy:0,   score:98, imageUrl:'', stats:'15000+ T20 runs | 7 IPL tons | Captain material' },
  { id:'p002', name:'Rohit Sharma',       set:'Marquee Set',       role:'Batter',      country:'India',        basePrice:'20Cr', capped:true,  category:'Marquee',       age:36, battingAvg:48.6, strikeRate:138.5, wickets:0,   economy:0,   score:95, imageUrl:'', stats:'5 IPL titles as captain | 6000+ IPL runs | Franchise icon' },
  { id:'p017', name:'Jasprit Bumrah',     set:'Marquee Set',       role:'Bowler',      country:'India',        basePrice:'18Cr', capped:true,  category:'Marquee',       age:30, battingAvg:0,    strikeRate:0,     wickets:145, economy:7.4, score:97, imageUrl:'', stats:'Best pacer in IPL | Death over specialist | Yorker king' },
  { id:'p025', name:'MS Dhoni',           set:'Marquee Set',       role:'WK-Batter',   country:'India',        basePrice:'14Cr', capped:true,  category:'Marquee',       age:42, battingAvg:38.2, strikeRate:139.5, wickets:0,   economy:0,   score:88, imageUrl:'', stats:'CSK legend | 5 IPL titles | Finisher supreme' },

  // ── CAPPED BATTER ─────────────────────────────────────────────────────────────
  { id:'p004', name:'Shubman Gill',       set:'Capped Batter',     role:'Batter',      country:'India',        basePrice:'16Cr', capped:true,  category:'Elite',         age:24, battingAvg:50.4, strikeRate:132.8, wickets:0,   economy:0,   score:90, imageUrl:'', stats:'Future of Indian batting | Rising star | Technical genius' },
  { id:'p013', name:'Suryakumar Yadav',   set:'Capped Batter',     role:'Batter',      country:'India',        basePrice:'14Cr', capped:true,  category:'Elite',         age:33, battingAvg:46.8, strikeRate:175.2, wickets:0,   economy:0,   score:94, imageUrl:'', stats:'World #1 T20I batter | 360° player | Unstoppable' },
  { id:'p054', name:'Shreyas Iyer',       set:'Capped Batter',     role:'Batter',      country:'India',        basePrice:'12Cr', capped:true,  category:'Elite',         age:29, battingAvg:44.8, strikeRate:136.5, wickets:0,   economy:0,   score:85, imageUrl:'', stats:'KKR IPL winner captain | Middle order anchor | Franchise leader' },
  { id:'p050', name:'Ruturaj Gaikwad',    set:'Capped Batter',     role:'Batter',      country:'India',        basePrice:'6Cr',  capped:true,  category:'Elite',         age:27, battingAvg:42.8, strikeRate:138.5, wickets:0,   economy:0,   score:79, imageUrl:'', stats:'CSK captain | Orange cap winner | Consistent performer' },
  { id:'p056', name:'Mayank Agarwal',     set:'Capped Batter',     role:'Batter',      country:'India',        basePrice:'2Cr',  capped:true,  category:'Elite',         age:33, battingAvg:36.8, strikeRate:145.2, wickets:0,   economy:0,   score:70, imageUrl:'', stats:'Experienced opener | Test specialist | Value pick' },
  { id:'p005', name:'Faf du Plessis',     set:'Capped Batter',     role:'Batter',      country:'South Africa', basePrice:'10Cr', capped:true,  category:'Overseas Elite',age:39, battingAvg:45.2, strikeRate:141.5, wickets:0,   economy:0,   score:85, imageUrl:'', stats:'IPL title winner | Natural leader | Explosive opener' },
  { id:'p006', name:'David Warner',       set:'Capped Batter',     role:'Batter',      country:'Australia',    basePrice:'12Cr', capped:true,  category:'Overseas Elite',age:37, battingAvg:48.3, strikeRate:145.8, wickets:0,   economy:0,   score:88, imageUrl:'', stats:'SRH legend | 6000+ IPL runs | Big match player' },
  { id:'p008', name:'Travis Head',        set:'Capped Batter',     role:'Batter',      country:'Australia',    basePrice:'10Cr', capped:true,  category:'Overseas Elite',age:30, battingAvg:53.6, strikeRate:158.2, wickets:0,   economy:0,   score:89, imageUrl:'', stats:'World Cup match-winner | Explosive starts | Must-watch' },

  // ── UNCAPPED BATTER ───────────────────────────────────────────────────────────
  { id:'p029', name:'Yashasvi Jaiswal',   set:'Uncapped Batter',   role:'Batter',      country:'India',        basePrice:'4Cr',  capped:false, category:'Uncapped Star', age:22, battingAvg:55.5, strikeRate:165.2, wickets:0,   economy:0,   score:88, imageUrl:'', stats:'Future megastar | Most runs Test debut | IPL impact' },
  { id:'p030', name:'Abhishek Sharma',    set:'Uncapped Batter',   role:'Batter',      country:'India',        basePrice:'3Cr',  capped:false, category:'Uncapped',      age:23, battingAvg:42.6, strikeRate:176.8, wickets:0,   economy:0,   score:78, imageUrl:'', stats:'Explosive opener | Part-time off-spin | Big hitter' },
  { id:'p031', name:'Tilak Varma',        set:'Uncapped Batter',   role:'Batter',      country:'India',        basePrice:'2Cr',  capped:false, category:'Uncapped',      age:21, battingAvg:39.2, strikeRate:148.5, wickets:0,   economy:0,   score:76, imageUrl:'', stats:'Future star | Brilliant middle order | MI backbone' },
  { id:'p032', name:'Rinku Singh',        set:'Uncapped Batter',   role:'Batter',      country:'India',        basePrice:'2Cr',  capped:false, category:'Uncapped',      age:26, battingAvg:32.5, strikeRate:156.8, wickets:0,   economy:0,   score:75, imageUrl:'', stats:'5 sixes last over legend | Finisher | Crowd favourite' },
  { id:'p051', name:'Prithvi Shaw',       set:'Uncapped Batter',   role:'Batter',      country:'India',        basePrice:'2Cr',  capped:false, category:'Uncapped Star', age:24, battingAvg:35.2, strikeRate:158.5, wickets:0,   economy:0,   score:72, imageUrl:'', stats:'Explosive opener | Comeback trail | Big ceiling' },
  { id:'p055', name:'Devdutt Padikkal',   set:'Uncapped Batter',   role:'Batter',      country:'India',        basePrice:'3Cr',  capped:false, category:'Uncapped Star', age:24, battingAvg:42.5, strikeRate:135.8, wickets:0,   economy:0,   score:74, imageUrl:'', stats:'Stylish left-hander | Big scores potential | RR favourite' },

  // ── CAPPED BOWLER ─────────────────────────────────────────────────────────────
  { id:'p018', name:'Rashid Khan',        set:'Capped Bowler',     role:'Bowler',      country:'Afghanistan',  basePrice:'16Cr', capped:true,  category:'Overseas Elite',age:25, battingAvg:0,    strikeRate:0,     wickets:142, economy:6.8, score:96, imageUrl:'', stats:'Most valuable spinner | Franchise cornerstone | T20 legend' },
  { id:'p020', name:'Mohammed Shami',     set:'Capped Bowler',     role:'Bowler',      country:'India',        basePrice:'10Cr', capped:true,  category:'Elite',         age:33, battingAvg:0,    strikeRate:0,     wickets:95,  economy:8.8, score:85, imageUrl:'', stats:'World Cup highest wicket-taker | Swing specialist' },
  { id:'p023', name:'Arshdeep Singh',     set:'Capped Bowler',     role:'Bowler',      country:'India',        basePrice:'8Cr',  capped:true,  category:'Elite',         age:25, battingAvg:0,    strikeRate:0,     wickets:75,  economy:8.4, score:83, imageUrl:'', stats:'Death over ace | Left-arm swing | Excellent yorkers' },
  { id:'p024', name:'Yuzvendra Chahal',   set:'Capped Bowler',     role:'Bowler',      country:'India',        basePrice:'6Cr',  capped:true,  category:'Elite',         age:33, battingAvg:0,    strikeRate:0,     wickets:187, economy:7.8, score:86, imageUrl:'', stats:'Most IPL wickets | Wrist spinner | Match-winner' },
  { id:'p052', name:'Deepak Chahar',      set:'Capped Bowler',     role:'Bowler',      country:'India',        basePrice:'5Cr',  capped:true,  category:'Elite',         age:31, battingAvg:0,    strikeRate:0,     wickets:90,  economy:8.2, score:78, imageUrl:'', stats:'Best powerplay bowler | Swing magic | Utility bat' },
  { id:'p058', name:'Avesh Khan',         set:'Capped Bowler',     role:'Bowler',      country:'India',        basePrice:'3Cr',  capped:true,  category:'Elite',         age:27, battingAvg:0,    strikeRate:0,     wickets:65,  economy:9.1, score:71, imageUrl:'', stats:'Promising pacer | Right-arm quick | Learning platform' },
  { id:'p036', name:'Mohit Sharma',       set:'Capped Bowler',     role:'Bowler',      country:'India',        basePrice:'2Cr',  capped:true,  category:'Elite',         age:34, battingAvg:0,    strikeRate:0,     wickets:120, economy:8.1, score:77, imageUrl:'', stats:'Death overs expert | Consistent | Underrated wicket-taker' },
  { id:'p053', name:'Mukesh Kumar',       set:'Capped Bowler',     role:'Bowler',      country:'India',        basePrice:'2Cr',  capped:true,  category:'Elite',         age:30, battingAvg:0,    strikeRate:0,     wickets:45,  economy:8.8, score:70, imageUrl:'', stats:'Test debut performer | Swing bowler | Learning curve' },
  { id:'p057', name:'T Natarajan',        set:'Capped Bowler',     role:'Bowler',      country:'India',        basePrice:'2Cr',  capped:true,  category:'Elite',         age:32, battingAvg:0,    strikeRate:0,     wickets:75,  economy:8.8, score:72, imageUrl:'', stats:'Yorker specialist | Left-arm pace | Death over weapon' },
  { id:'p019', name:'Pat Cummins',        set:'Capped Bowler',     role:'Bowler',      country:'Australia',    basePrice:'20Cr', capped:true,  category:'Overseas Elite',age:31, battingAvg:0,    strikeRate:0,     wickets:102, economy:8.5, score:88, imageUrl:'', stats:'KKR captain | World Cup winning captain | Big impact' },
  { id:'p021', name:'Trent Boult',        set:'Capped Bowler',     role:'Bowler',      country:'New Zealand',  basePrice:'8Cr',  capped:true,  category:'Overseas',      age:34, battingAvg:0,    strikeRate:0,     wickets:110, economy:8.6, score:84, imageUrl:'', stats:'Powerplay specialist | Left-arm swing | Dangerous' },
  { id:'p022', name:'Mark Wood',          set:'Capped Bowler',     role:'Bowler',      country:'England',      basePrice:'7Cr',  capped:true,  category:'Overseas',      age:34, battingAvg:0,    strikeRate:0,     wickets:60,  economy:8.3, score:82, imageUrl:'', stats:'Express pace | 150+ kmph | Devastating in phases' },

  // ── UNCAPPED BOWLER ───────────────────────────────────────────────────────────
  { id:'p035', name:'Varun Chakaravarthy',set:'Uncapped Bowler',   role:'Bowler',      country:'India',        basePrice:'4Cr',  capped:false, category:'Uncapped Star', age:32, battingAvg:0,    strikeRate:0,     wickets:88,  economy:7.2, score:82, imageUrl:'', stats:'Mystery spinner | KKR fan favourite | Lethal variations' },
  { id:'p060', name:'Sandeep Sharma',     set:'Uncapped Bowler',   role:'Bowler',      country:'India',        basePrice:'1Cr',  capped:false, category:'Uncapped',      age:30, battingAvg:0,    strikeRate:0,     wickets:82,  economy:8.6, score:66, imageUrl:'', stats:'Veteran swing bowler | Consistent economical | Experience' },
  { id:'p037', name:'Noor Ahmad',         set:'Uncapped Bowler',   role:'Bowler',      country:'Afghanistan',  basePrice:'3Cr',  capped:false, category:'Overseas Uncapped',age:20,battingAvg:0, strikeRate:0,     wickets:35,  economy:7.3, score:74, imageUrl:'', stats:'Promising left-arm spinner | Young talent | Big future' },

  // ── CAPPED ALL-ROUNDER ────────────────────────────────────────────────────────
  { id:'p009', name:'Hardik Pandya',      set:'Capped All-rounder',role:'All-Rounder', country:'India',        basePrice:'15Cr', capped:true,  category:'Elite',         age:30, battingAvg:33.2, strikeRate:149.5, wickets:65,  economy:8.4, score:93, imageUrl:'', stats:'150+ IPL wickets | Big hitter | Death bowling specialist' },
  { id:'p016', name:'Ravindra Jadeja',    set:'Capped All-rounder',role:'All-Rounder', country:'India',        basePrice:'14Cr', capped:true,  category:'Elite',         age:35, battingAvg:28.5, strikeRate:132.8, wickets:145, economy:7.6, score:89, imageUrl:'', stats:'Best fielder in IPL | Left-arm spin | Crucial lower order' },
  { id:'p041', name:'Axar Patel',         set:'Capped All-rounder',role:'All-Rounder', country:'India',        basePrice:'9Cr',  capped:true,  category:'Elite',         age:30, battingAvg:25.8, strikeRate:152.5, wickets:125, economy:7.1, score:84, imageUrl:'', stats:'Left-arm finger spin | Tough to score off | DC backbone' },
  { id:'p042', name:'Ravichandran Ashwin',set:'Capped All-rounder',role:'All-Rounder', country:'India',        basePrice:'2Cr',  capped:true,  category:'Elite',         age:37, battingAvg:24.5, strikeRate:148.2, wickets:172, economy:6.9, score:82, imageUrl:'', stats:'Most IPL wickets among spinners | Brilliant tactician' },
  { id:'p039', name:'Shivam Dube',        set:'Capped All-rounder',role:'All-Rounder', country:'India',        basePrice:'4Cr',  capped:true,  category:'Elite',         age:30, battingAvg:30.5, strikeRate:158.2, wickets:28,  economy:9.1, score:78, imageUrl:'', stats:'World Cup member | Left-arm medium | Big six hitter' },
  { id:'p040', name:'Washington Sundar',  set:'Capped All-rounder',role:'All-Rounder', country:'India',        basePrice:'3Cr',  capped:true,  category:'Elite',         age:24, battingAvg:22.5, strikeRate:135.8, wickets:65,  economy:7.4, score:76, imageUrl:'', stats:'Off-spin option | Lower order bat | Reliable' },
  { id:'p010', name:'Ben Stokes',         set:'Capped All-rounder',role:'All-Rounder', country:'England',      basePrice:'16Cr', capped:true,  category:'Overseas Elite',age:32, battingAvg:36.8, strikeRate:143.2, wickets:48,  economy:9.1, score:90, imageUrl:'', stats:'World Cup winner | Brilliant all-rounder | Match-winner' },
  { id:'p011', name:'Cameron Green',      set:'Capped All-rounder',role:'All-Rounder', country:'Australia',    basePrice:'17Cr', capped:true,  category:'Overseas Elite',age:25, battingAvg:41.5, strikeRate:154.8, wickets:32,  economy:8.6, score:88, imageUrl:'', stats:'MI auction record | Power hitter | Pace bowler' },
  { id:'p012', name:'Liam Livingstone',   set:'Capped All-rounder',role:'All-Rounder', country:'England',      basePrice:'8Cr',  capped:true,  category:'Overseas',      age:30, battingAvg:32.5, strikeRate:162.4, wickets:28,  economy:7.8, score:83, imageUrl:'', stats:'Massive six hitter | Leg-spin option | Game changer' },
  { id:'p014', name:'Glenn Maxwell',      set:'Capped All-rounder',role:'All-Rounder', country:'Australia',    basePrice:'11Cr', capped:true,  category:'Overseas Elite',age:35, battingAvg:34.2, strikeRate:155.8, wickets:42,  economy:7.4, score:87, imageUrl:'', stats:'Magical knock specialist | Off-spin option | Legend' },
  { id:'p015', name:'Andre Russell',      set:'Capped All-rounder',role:'All-Rounder', country:'West Indies',  basePrice:'12Cr', capped:true,  category:'Overseas Elite',age:35, battingAvg:30.5, strikeRate:172.5, wickets:88,  economy:9.2, score:91, imageUrl:'', stats:'Most explosive all-rounder | Death specialist | Destroyer' },
  { id:'p038', name:'Sunil Narine',       set:'Capped All-rounder',role:'All-Rounder', country:'West Indies',  basePrice:'12Cr', capped:true,  category:'Overseas Elite',age:35, battingAvg:28.5, strikeRate:168.5, wickets:165, economy:6.7, score:92, imageUrl:'', stats:'KKR legend | Opens batting now | Mystery spinner' },
  { id:'p045', name:'Rachin Ravindra',    set:'Capped All-rounder',role:'All-Rounder', country:'New Zealand',  basePrice:'4Cr',  capped:true,  category:'Overseas',      age:24, battingAvg:45.6, strikeRate:138.5, wickets:18,  economy:7.8, score:78, imageUrl:'', stats:'WC breakout star | Left-hand bat | Slow left-arm' },
  { id:'p046', name:'Daryl Mitchell',     set:'Capped All-rounder',role:'All-Rounder', country:'New Zealand',  basePrice:'4Cr',  capped:true,  category:'Overseas',      age:32, battingAvg:40.2, strikeRate:145.5, wickets:15,  economy:8.5, score:76, imageUrl:'', stats:'WC hero | Solid middle order | Part-time medium pace' },
  { id:'p048', name:'Sam Curran',         set:'Capped All-rounder',role:'All-Rounder', country:'England',      basePrice:'18Cr', capped:true,  category:'Overseas Elite',age:26, battingAvg:28.5, strikeRate:142.5, wickets:65,  economy:9.2, score:83, imageUrl:'', stats:'WC Player of Tournament | Costly but impactful | All phases' },

  // ── UNCAPPED ALL-ROUNDER ──────────────────────────────────────────────────────
  { id:'p059', name:'Shahbaz Ahmed',      set:'Uncapped All-rounder',role:'All-Rounder',country:'India',       basePrice:'1Cr',  capped:false, category:'Uncapped',      age:28, battingAvg:28.5, strikeRate:138.5, wickets:42,  economy:8.5, score:68, imageUrl:'', stats:'Left-arm spin | Useful lower-order bat | Value pick' },

  // ── CAPPED WICKETKEEPER ───────────────────────────────────────────────────────
  { id:'p026', name:'Rishabh Pant',       set:'Capped Wicketkeeper',role:'WK-Batter',  country:'India',        basePrice:'16Cr', capped:true,  category:'Elite',         age:26, battingAvg:46.5, strikeRate:152.8, wickets:0,   economy:0,   score:91, imageUrl:'', stats:'Maverick game-changer | Unorthodox genius | Big impact' },
  { id:'p003', name:'KL Rahul',           set:'Capped Wicketkeeper',role:'WK-Batter',  country:'India',        basePrice:'18Cr', capped:true,  category:'Elite',         age:31, battingAvg:52.3, strikeRate:136.2, wickets:0,   economy:0,   score:92, imageUrl:'', stats:'WK option available | Consistent run scorer | T20I opener' },
  { id:'p049', name:'Ishan Kishan',       set:'Capped Wicketkeeper',role:'WK-Batter',  country:'India',        basePrice:'8Cr',  capped:true,  category:'Elite',         age:25, battingAvg:39.5, strikeRate:148.2, wickets:0,   economy:0,   score:81, imageUrl:'', stats:'Power opener | WK-batter | Double century holder' },
  { id:'p007', name:'Quinton de Kock',    set:'Capped Wicketkeeper',role:'WK-Batter',  country:'South Africa', basePrice:'8Cr',  capped:true,  category:'Overseas',      age:31, battingAvg:44.2, strikeRate:133.5, wickets:0,   economy:0,   score:82, imageUrl:'', stats:'WK-Batter | Franchise player | Consistent performer' },
  { id:'p027', name:'Heinrich Klaasen',   set:'Capped Wicketkeeper',role:'WK-Batter',  country:'South Africa', basePrice:'9Cr',  capped:true,  category:'Overseas Elite',age:32, battingAvg:48.2, strikeRate:162.5, wickets:0,   economy:0,   score:87, imageUrl:'', stats:'World Cup destroyer | Finisher expert | Overseas gem' },
  { id:'p028', name:'Phil Salt',          set:'Capped Wicketkeeper',role:'WK-Batter',  country:'England',      basePrice:'7Cr',  capped:true,  category:'Overseas',      age:27, battingAvg:38.5, strikeRate:158.2, wickets:0,   economy:0,   score:82, imageUrl:'', stats:'Explosive opener | WK-bat | SRH impact player' },
  { id:'p043', name:'Nicholas Pooran',    set:'Capped Wicketkeeper',role:'WK-Batter',  country:'West Indies',  basePrice:'8Cr',  capped:true,  category:'Overseas',      age:28, battingAvg:35.8, strikeRate:168.5, wickets:0,   economy:0,   score:83, imageUrl:'', stats:'Six machine | WK option | Franchise player | Big stage' },
  { id:'p044', name:'Jonny Bairstow',     set:'Capped Wicketkeeper',role:'WK-Batter',  country:'England',      basePrice:'7Cr',  capped:true,  category:'Overseas',      age:34, battingAvg:42.5, strikeRate:142.8, wickets:0,   economy:0,   score:80, imageUrl:'', stats:'Aggressive opener | WK available | Big match performer' },
  { id:'p047', name:'Jos Buttler',        set:'Capped Wicketkeeper',role:'WK-Batter',  country:'England',      basePrice:'14Cr', capped:true,  category:'Overseas Elite',age:33, battingAvg:51.2, strikeRate:152.3, wickets:0,   economy:0,   score:91, imageUrl:'', stats:'RR legend | WC winning captain | Explosive genius' },

  // ── UNCAPPED WICKETKEEPER ─────────────────────────────────────────────────────
  { id:'p033', name:'Kumar Kushagra',     set:'Uncapped Wicketkeeper',role:'WK-Batter',country:'India',        basePrice:'20L',  capped:false, category:'Uncapped',      age:20, battingAvg:35.2, strikeRate:142.8, wickets:0,   economy:0,   score:65, imageUrl:'', stats:'Promising WK | Young talent | Franchise investment' },
  { id:'p034', name:'Prabhsimran Singh',  set:'Uncapped Wicketkeeper',role:'WK-Batter',country:'India',        basePrice:'50L',  capped:false, category:'Uncapped',      age:23, battingAvg:38.5, strikeRate:155.2, wickets:0,   economy:0,   score:70, imageUrl:'', stats:'Opening WK-Batter | Punjab native | Massive potential' },
];
