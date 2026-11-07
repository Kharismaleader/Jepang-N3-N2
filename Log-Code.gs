// ============================================================
// Daily Japan — pencatat hasil belajar (Google Apps Script)
// Terikat ke Sheet "Log Quiz Daily Japan" (folder "AI-Jepang Indonesia").
// Menerima POST JSON dari app "Daily Japan" dan mencatat:
//   kind="quiz"    -> 1 baris di tab "Hasil Quiz" + 1 baris per soal
//                     di tab "Jawaban"
//   kind="progres" -> 1 baris snapshot progres baca di tab "Progres Materi"
// Keamanan: body WAJIB berisi key yang sama dengan Script Property
// SYNC_KEY (kode akses app yang sama dengan endpoint baca materi).
//
// PENYIAPAN (sekali saja, manual):
// 1. Buka Sheet "Log Quiz Daily Japan" > Extensions > Apps Script,
//    hapus isi editor, tempel SELURUH kode ini. Nama proyek:
//    "Daily Japan Log".
// 2. Project Settings > Script Properties: SYNC_KEY = (kode akses app).
// 3. Deploy > New deployment > Web app. Execute as: Me — Anyone.
// 4. Salin URL /exec ke konstanta LOG_URL di index.html app.
// ============================================================

function keyOk_(k) {
  var want = PropertiesService.getScriptProperties().getProperty('SYNC_KEY');
  return !!want && !!k && String(k) === String(want);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function now_() {
  return Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
}

function str_(v) { return String(v == null ? '' : v); }
function num_(v) { var n = Number(v); return isNaN(n) ? '' : n; }

function doGet(e) {
  return json_({ ok: true, service: 'daily-japan-log' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var body = {};
    try { body = JSON.parse(e.postData.contents || '{}'); } catch (err) { return json_({ ok: false, error: 'bad json' }); }
    if (!keyOk_(body.key)) return json_({ ok: false, error: 'unauthorized' });

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var waktu = now_();

    if (body.kind === 'quiz') {
      var hasil = ss.getSheetByName('Hasil Quiz');
      hasil.appendRow([waktu, str_(body.session), str_(body.user), str_(body.level),
        str_(body.date), str_(body.theme), num_(body.score), num_(body.total),
        num_(body.percent), num_(body.duration)]);
      var jawaban = ss.getSheetByName('Jawaban');
      var ans = body.answers || [];
      var rows = [];
      for (var i = 0; i < ans.length; i++) {
        var a = ans[i] || {};
        rows.push([waktu, str_(body.session), str_(body.user), str_(body.level),
          str_(body.date), num_(a.no), str_(a.type), str_(a.question).slice(0, 300),
          str_(a.picked), str_(a.correct), a.right ? 'Ya' : 'Tidak']);
      }
      if (rows.length) {
        jawaban.getRange(jawaban.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
      }
      return json_({ ok: true, saved: 'quiz', answers: rows.length });
    }

    if (body.kind === 'progres') {
      var prog = ss.getSheetByName('Progres Materi');
      prog.appendRow([waktu, str_(body.user), str_(body.level), str_(body.date),
        num_(body.gDone), num_(body.gTotal), num_(body.vDone), num_(body.vTotal),
        str_(body.status)]);
      return json_({ ok: true, saved: 'progres' });
    }

    return json_({ ok: false, error: 'unknown kind' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}
