// ============================================================
// Jepang N3-N2 — sumber data app (Google Apps Script, READ-ONLY)
// Terikat ke Sheet "Materi" (folder Drive "AI-Jepang Indonesia").
// 5 tab yang dibaca:
//   Materi : Tanggal | Tema | Konteks | Target | Tips | LinkPDF
//   Grammar: Tanggal | No | Level | Pola | Romaji | Arti | CaraBentuk |
//            Nuansa | Contoh1JP | Contoh1ID | Contoh2JP | Contoh2ID |
//            Contoh3JP | Contoh3ID
//   Vocab  : Tanggal | No | Kata | Baca | Arti | ContohJP | ContohID
//   Dialog : Tanggal | No | Pembicara | JP | ID
//   Quiz   : Tanggal | No | Tipe | Soal | PilihanA | PilihanB |
//            PilihanC | PilihanD | Jawaban (A/B/C/D) | Penjelasan
//
// PENYIAPAN (sekali saja, dikerjakan manual — JANGAN deploy dari sini):
// 1. Buka Sheet "Materi" > Extensions > Apps Script, hapus isi editor,
//    lalu tempel SELURUH kode ini.
// 2. Project Settings (ikon gerigi) > Script Properties > Add property:
//    Name: SYNC_KEY   Value: (kode sinkron yang sama dengan yang
//    dimasukkan sekali per perangkat di app)
// 3. Deploy > New deployment > type: Web app
//    Execute as: Me — Who has access: Anyone
// 4. Salin URL Web app (berakhiran /exec) ke SYNC_URL di index.html
//    app "Jepang N3-N2".
// 5. Setiap kali kode ini diubah, buat deployment BARU (New deployment)
//    agar URL /exec memakai versi terbaru.
//
// Cara pakai: GET <URL /exec>?key=<SYNC_KEY>
// Balasan JSON persis struktur seed.json:
// {ok:true, materi:[{date, theme, context, target, tips, pdf,
//   grammar:[{no, level, pattern, romaji, meaning, formation, nuance,
//             examples:[{jp, id}]}],
//   vocab:[{no, word, reading, meaning, example_jp, example_id}],
//   dialog:[{no, speaker, jp, id}],
//   quiz:[{no, type, question, options:[A,B,C,D], answer (0-3),
//          explanation}]}]}
// Materi terurut tanggal MENURUN (terbaru dulu). Read-only:
// tidak ada doPost dan tidak ada penulisan ke Sheet.
// ============================================================

function keyOk_(k) {
  var want = PropertiesService.getScriptProperties().getProperty('SYNC_KEY');
  return !!want && !!k && String(k) === String(want);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Samakan tanggal ke "yyyy-MM-dd", baik dari nilai tanggal asli
// (objek Date di sel) maupun dari teks ("2026-11-07", "7/11/2026", dst).
function normDate_(v, tz) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  }
  var s = String(v || '').trim(), m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
  if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/))) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return '';
}

function str_(v) { return String(v == null ? '' : v).trim(); }
function int_(v) { var n = parseInt(v, 10); return isNaN(n) ? 0 : n; }

// Baca satu tab menjadi array baris data (tanpa header); [] bila tab kosong.
function readTab_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) return [];
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
}

// Kelompokkan baris-baris tab anak berdasarkan Tanggal (kolom A).
function groupByDate_(rows, tz) {
  var map = {};
  for (var i = 0; i < rows.length; i++) {
    var d = normDate_(rows[i][0], tz);
    if (!d) continue;
    if (!map[d]) map[d] = [];
    map[d].push(rows[i]);
  }
  return map;
}

function readAll_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tz = ss.getSpreadsheetTimeZone();

  var grammarBy = groupByDate_(readTab_(ss, 'Grammar'), tz);
  var vocabBy = groupByDate_(readTab_(ss, 'Vocab'), tz);
  var dialogBy = groupByDate_(readTab_(ss, 'Dialog'), tz);
  var quizBy = groupByDate_(readTab_(ss, 'Quiz'), tz);

  var materi = [];
  var mrows = readTab_(ss, 'Materi');
  for (var i = 0; i < mrows.length; i++) {
    var r = mrows[i];
    var date = normDate_(r[0], tz);
    if (!date) continue;

    var grammar = [];
    var grows = grammarBy[date] || [];
    for (var g = 0; g < grows.length; g++) {
      var gr = grows[g];
      var examples = [];
      for (var e = 0; e < 3; e++) {
        var jp = str_(gr[8 + e * 2]), idn = str_(gr[9 + e * 2]);
        if (jp) examples.push({ jp: jp, id: idn });
      }
      grammar.push({
        no: int_(gr[1]), level: str_(gr[2]), pattern: str_(gr[3]),
        romaji: str_(gr[4]), meaning: str_(gr[5]), formation: str_(gr[6]),
        nuance: str_(gr[7]), examples: examples
      });
    }
    grammar.sort(function (a, b) { return a.no - b.no; });

    var vocab = [];
    var vrows = vocabBy[date] || [];
    for (var v = 0; v < vrows.length; v++) {
      var vr = vrows[v];
      vocab.push({
        no: int_(vr[1]), word: str_(vr[2]), reading: str_(vr[3]),
        meaning: str_(vr[4]), example_jp: str_(vr[5]), example_id: str_(vr[6])
      });
    }
    vocab.sort(function (a, b) { return a.no - b.no; });

    var dialog = [];
    var drows = dialogBy[date] || [];
    for (var d = 0; d < drows.length; d++) {
      var dr = drows[d];
      dialog.push({ no: int_(dr[1]), speaker: str_(dr[2]), jp: str_(dr[3]), id: str_(dr[4]) });
    }
    dialog.sort(function (a, b) { return a.no - b.no; });

    var quiz = [];
    var qrows = quizBy[date] || [];
    for (var q = 0; q < qrows.length; q++) {
      var qr = qrows[q];
      var ans = 'ABCD'.indexOf(str_(qr[8]).toUpperCase());
      quiz.push({
        no: int_(qr[1]), type: str_(qr[2]), question: str_(qr[3]),
        options: [str_(qr[4]), str_(qr[5]), str_(qr[6]), str_(qr[7])],
        answer: ans < 0 ? 0 : ans, explanation: str_(qr[9])
      });
    }
    quiz.sort(function (a, b) { return a.no - b.no; });

    materi.push({
      date: date, theme: str_(r[1]), context: str_(r[2]), target: str_(r[3]),
      tips: str_(r[4]), pdf: str_(r[5]),
      grammar: grammar, vocab: vocab, dialog: dialog, quiz: quiz
    });
  }

  // Terbaru dulu, sama seperti seed.json.
  materi.sort(function (a, b) { return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0); });
  return materi;
}

function doGet(e) {
  if (!e || !e.parameter || !keyOk_(e.parameter.key)) return json_({ ok: false, error: 'unauthorized' });
  return json_({ ok: true, materi: readAll_() });
}
