import pg from 'pg';
const pool = new pg.Pool({host:'localhost',port:5432,database:'stockflow',user:'postgres',password:'Admin'});

(async()=>{
  try{
    console.log('--- USERS COLUMNS ---');
    const uc = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position");
    console.log(JSON.stringify(uc.rows,null,2));

    console.log('\n--- ROLES COLUMNS ---');
    const rc = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='roles' ORDER BY ordinal_position");
    console.log(JSON.stringify(rc.rows,null,2));

    console.log('\n--- ROLES DATA ---');
    const r = await pool.query('SELECT * FROM roles');
    console.log(JSON.stringify(r.rows,null,2));

    console.log('\n--- USERS DATA (first 10) ---');
    const u = await pool.query('SELECT id, email, role_id FROM users LIMIT 10');
    console.log(JSON.stringify(u.rows,null,2));

  }catch(e){
    console.error('ERROR:',e.message);
  }finally{
    await pool.end();
  }
})();
