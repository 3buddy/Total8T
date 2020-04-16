var mysql = require('mysql');


global.con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "spotify"
});

let connection = async ()=> {

  try {
    await con.connect();
    console.log("Connected to database")
  } catch(e) {
    console.log("Error in creating database connection");
    return e;
  }

}

module.exports = connection