var win32ole = require('win32ole');
win32ole.print('access_mdb_sample\n');
console.log(win32ole.version());
var path = require('path');
var cwd = path.join(win32ole.MODULEDIRNAME, '..');

var fs = require('fs');
var tmpdir = path.join(cwd, 'test/tmp');
if(!fs.existsSync(tmpdir)) fs.mkdirSync(tmpdir);
var outfile = path.join(tmpdir, 'access_mdb_sample.mdb');

var display_and_edit_all = function(rs){
  var getRSvalue = function(rs, fieldname){
    return rs.get('Fields', [fieldname]).get('Value');
  }
  rs.call('MoveFirst');
  while(!rs.get('Eof').toBoolean()){
    win32ole.print('id: ');
    win32ole.print(getRSvalue(rs, 'id').toInt32());
    win32ole.print(', c1: ');
    win32ole.print(getRSvalue(rs, 'c1').toUtf8());
    win32ole.print(', c2: ');
    win32ole.print(getRSvalue(rs, 'c2').toInt32());
    win32ole.print(', c3: ');
    win32ole.print(getRSvalue(rs, 'c3').toUtf8());
    win32ole.print('\n');
    rs.call('Edit');
    rs.get('Fields', ['c2']).set('Value', 3);
    rs.call('Update'); // rs.call('CancelUpdate');
    rs.call('MoveNext');
  }
};

var adox_sample = function(filename){
  if(fs.existsSync(filename)) fs.unlinkSync(filename);
  console.log('creating mdb (by ADOX): "' + filename + '" ...');
  var dsn = 'Provider=Microsoft.Jet.OLEDB.4.0;Data Source=' + filename + ';';
  // dsn += ('Locale Identifier=' + CAT_LOCALE_(language));
  var db = win32ole.client.Dispatch('ADOX.Catalog', '.ACP'); // locale
  db.call('Create', [dsn]);
  var sql_create_table = 'create table testtbl (id autoincrement primary key,';
  sql_create_table += ' c1 varchar(255), c2 integer, c3 varchar(255));';
  var cn = db.get('ActiveConnection');
  cn.call('Execute', [sql_create_table]);
  /* this version can not create OLE instance at the same time
  var rs = win32ole.client.Dispatch('ADODB.Recordset', '.ACP'); // locale
  rs.set('ActiveConnection', cn);
  var sql_select = 'select * from testtbl;';
  rs.call('Open', [sql_select]); // default options
  display_and_edit_all(rs);
  rs.call('Close');
  rs = null;
  */
  cn.call('Close');
  cn = null;
  // db.call('Close'); // 'Close' 'Disconnect' 'Release' is wrong
  db = null;
  console.log('disconnected (ADOX)');
};

var ole_automation_sample = function(filename){
  console.log('open mdb (by OLE Automation): "' + filename + '" ...');
  var mdb = win32ole.client.Dispatch('Access.Application', '.ACP'); // locale
  mdb.set('Visible', true);
  // mdb.call('NewCurrentDatabase', [filename]); // to create new mdb
  mdb.call('OpenCurrentDatabase', [filename]); // to open exists mdb
  var cdb = mdb.call('CurrentDb');
  for(var i = 101; i < 109; ++i){
    var sql_insert = "insert into testtbl (c1, c2, c3) values";
    sql_insert += " ('p(', " + i + ", ')q');";
    cdb.call('Execute', [sql_insert]);
  }
  var sql_select = 'select * from testtbl;';
  var rs = cdb.call('OpenRecordset', [sql_select]);
  display_and_edit_all(rs);
  rs.call('Close');
  cdb.call('Close');
  mdb.call('CloseCurrentDatabase');
  cdb = null;
  mdb = null;
  console.log('disconnected (OLE Automation)');
};

win32ole.client = new win32ole.Client;
try{
  adox_sample(outfile);
}catch(e){
  console.log('*** exception cached ***\n' + e);
}
win32ole.client.Finalize(); // must be called (version 0.0.x)

win32ole.sleep(2000, true, true);

win32ole.client = new win32ole.Client;
try{
  ole_automation_sample(outfile);
}catch(e){
  console.log('*** exception cached ***\n' + e);
}
win32ole.client.Finalize(); // must be called (version 0.0.x)