// ============================================================
// Daily Japan — sumber data materi TETAP Hiragana & Katakana
// (Google Apps Script, READ-ONLY)
// Terikat ke Sheet "Materi Hira&Kata" (folder "AI-Jepang Indonesia").
// Materi ini FIX (bukan harian), dikelompokkan per Kode Bab:
//   Bab  : Kode | Judul | Subjudul | Ikon | Ringkasan | Tips
//   Kana : Kode | No | Kana | Romaji | Kelompok | Catatan
//   Kartu: Kode | No | Judul | IsiJP | IsiID
//   Vocab: Kode | No | Kata | Baca | Arti | ContohJP | ContohID
//   Quiz : Kode | No | Tipe | Soal | PilihanA | PilihanB |
//          PilihanC | PilihanD | Jawaban (A/B/C/D) | Penjelasan
//
// PENYIAPAN (sekali saja, manual):
// 1. Buka Sheet "Materi Hira&Kata" > Extensions > Apps Script,
//    hapus isi editor, tempel SELURUH kode ini. Nama proyek:
//    "Materi HiraKata Sync".
// 2. Project Settings > Script Properties: SYNC_KEY = (kode akses
//    app yang sama dengan endpoint materi lain).
// 3. Deploy > New deployment > Web app. Execute as: Me — Anyone.
// 4. Salin URL /exec ke konstanta SYNC_URL_KANA di index.html app.
//
// Cara pakai: GET <URL /exec>?key=<SYNC_KEY>
// Balasan: {ok:true, bab:[{kode, judul, subjudul, ikon, ringkasan,
//   tips, kana:[{no,kana,romaji,kelompok,catatan}],
//   kartu:[{no,judul,jp,id}],
//   vocab:[{no,word,reading,meaning,example_jp,example_id}],
//   quiz:[{no,type,question,options,answer,explanation}]}]}
// Urutan bab mengikuti urutan baris tab Bab. Read-only.
// ============================================================

function keyOk_(k) {
  var want = PropertiesService.getScriptProperties().getProperty('SYNC_KEY');
  return !!want && !!k && String(k) === String(want);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function str_(v) { return String(v == null ? '' : v).trim(); }
function int_(v) { var n = parseInt(v, 10); return isNaN(n) ? 0 : n; }

function readTab_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) return [];
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
}

function groupByKode_(rows) {
  var map = {};
  for (var i = 0; i < rows.length; i++) {
    var k = str_(rows[i][0]);
    if (!k) continue;
    if (!map[k]) map[k] = [];
    map[k].push(rows[i]);
  }
  return map;
}

function readAll_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var kanaBy = groupByKode_(readTab_(ss, 'Kana'));
  var kartuBy = groupByKode_(readTab_(ss, 'Kartu'));
  var vocabBy = groupByKode_(readTab_(ss, 'Vocab'));
  var quizBy = groupByKode_(readTab_(ss, 'Quiz'));

  var bab = [];
  var brows = readTab_(ss, 'Bab');
  for (var i = 0; i < brows.length; i++) {
    var r = brows[i];
    var kode = str_(r[0]);
    if (!kode) continue;

    var kana = [];
    var krows = kanaBy[kode] || [];
    for (var a = 0; a < krows.length; a++) {
      var kr = krows[a];
      kana.push({ no: int_(kr[1]), kana: str_(kr[2]), romaji: str_(kr[3]),
        kelompok: str_(kr[4]), catatan: str_(kr[5]) });
    }
    kana.sort(function (x, y) { return x.no - y.no; });

    var kartu = [];
    var trows = kartuBy[kode] || [];
    for (var b = 0; b < trows.length; b++) {
      var tr = trows[b];
      kartu.push({ no: int_(tr[1]), judul: str_(tr[2]), jp: str_(tr[3]), id: str_(tr[4]) });
    }
    kartu.sort(function (x, y) { return x.no - y.no; });

    var vocab = [];
    var vrows = vocabBy[kode] || [];
    for (var c = 0; c < vrows.length; c++) {
      var vr = vrows[c];
      vocab.push({ no: int_(vr[1]), word: str_(vr[2]), reading: str_(vr[3]),
        meaning: str_(vr[4]), example_jp: str_(vr[5]), example_id: str_(vr[6]) });
    }
    vocab.sort(function (x, y) { return x.no - y.no; });

    var quiz = [];
    var qrows = quizBy[kode] || [];
    for (var d = 0; d < qrows.length; d++) {
      var qr = qrows[d];
      var ans = 'ABCD'.indexOf(str_(qr[8]).toUpperCase());
      quiz.push({ no: int_(qr[1]), type: str_(qr[2]), question: str_(qr[3]),
        options: [str_(qr[4]), str_(qr[5]), str_(qr[6]), str_(qr[7])],
        answer: ans < 0 ? 0 : ans, explanation: str_(qr[9]) });
    }
    quiz.sort(function (x, y) { return x.no - y.no; });

    bab.push({ kode: kode, judul: str_(r[1]), subjudul: str_(r[2]), ikon: str_(r[3]),
      ringkasan: str_(r[4]), tips: str_(r[5]),
      kana: kana, kartu: kartu, vocab: vocab, quiz: quiz });
  }
  return bab;
}

function doGet(e) {
  if (!e || !e.parameter || !keyOk_(e.parameter.key)) return json_({ ok: false, error: 'unauthorized' });
  return json_({ ok: true, bab: readAll_() });
}
