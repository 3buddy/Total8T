var jwt = require('jsonwebtoken');
const config = require('../config/config.json')


exports.verifyUser = verifyUser

 function verifyUser(req, res, next)
{
  let bearerToken = req.headers['authorization']
  let obj = {
    status: 200,
    data: {},
    message: ""
  }

if(typeof bearerToken != 'undefined'){
     
      try {
          
        let token =  jwt.verify(bearerToken, config.secret);
      
        con.query(
          ` SELECT count(*) from user where phone = ? OR email = ?`,
          [token.id, token.id],
          (error, getres) => {
            if (error) {
             // console.log(error);
              obj.message = "Unable to verify";
              res.send(obj);
            } else {
             
              getres == 0 ? ((obj.message = "Bad token"), res.json(obj)) : next();
            }
          }
        );
      } catch (err) {
          console.log(err);
          obj.status = 400
        obj.message = err.message;
        res.json(obj);
      }

  } else {
    res.sendStatus(403)
  }

}