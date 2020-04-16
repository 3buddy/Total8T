const bcrypt = require('bcrypt');
const saltRounds = 10;
var jwt = require('jsonwebtoken');
const config = require('../config/config')
const sendMail = require('../mail')
const secretKey = "secret007";
const Promise = require('promise');
var waterfall = require('async-waterfall');

/**** twillio ****/

const accountSid = 'AC1279865f73a55948be6123d720d36bc5';
const authToken = '5acf8016328a142e0d1a30ff9fa4bca4';
const client = require('twilio')(accountSid, authToken);

function sendOTP(otp, to) {
  client.messages
      .create({body: `This is you OTP ${otp}`, from: '+1 202 952 1337', to: to})
      .then(message => console.log(message))
      .catch((error)=>{
        console.log(error)
      })
}


/**** twillio ****/

/**** Aws s3 bucket  ****/

var AWS = require('aws-sdk')
const fs = require('fs')

const BUCKET = 'total8tfiles'
const REGION = 'us-west-1'
const ACCESS_KEY = 'AKIAIULN33RQZ56J4DBA'
const SECRET_KEY = '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'

AWS.config.update({
  accessKeyId: ACCESS_KEY,
  secretAccessKey: SECRET_KEY,
  region: REGION
})

var s3 = new AWS.S3()

/**** Aws s3 bucket  ****/

/**** Common functions ****/

function hashingPassword(plainText) {
  return bcrypt.hashSync(plainText, saltRounds)
}

function checkPassword(plainText, hashText) {
return   bcrypt.compareSync(plainText, hashText)
}

function randomNumber() {
  return Math.floor(Math.random()*(99999 - 10000 + 1  )) + 9999
  }

/**** Common functions ****/

const DIR = './uploads';

exports.upload = upload
exports.signup = signup
exports.login  = login
exports.forgetPassword = forgetPassword
exports.resetPassword = resetPassword
exports.verfiyOTP   = verfiyOTP
exports.refreshToken     = refreshToken;
exports.userInfo   = userInfo
//exports.updateUserProfile = updateUserProfile


function upload(req, res, cb) {
  let response = {
    status: 0,
    data: {},
    message: ""
  }

  new Promise((resolve, reject)=>{
    waterfall([
        uploadtolocal,
        uploadtoAws
    ], (error, result)=>{
      error ? reject(error) : resolve(result)
    })
  })
  .then((resp)=>{

    res.json(resp)
  })
  .catch((error)=>{
    response.status = 400;
    response.message = error.message
    res.json(response)
  })


  function uploadtolocal(cb)
  {
    if (!req.files) {
 
      response.status = 400;
      response.message = "No file received";
     cb(response)
  
    } else {

      cb(null, req.files)
    }
  }

  function uploadtoAws(data, cb)
  {
   
    var ResponseData = []
    
     if(data.length > 0) {

      data.map((item)=>{
        const localImage = data[0].path
        const imageRemoteName = `catImage_${new Date().getTime()}.png`
       s3.putObject({
        Bucket: BUCKET,
        Body: fs.readFileSync(localImage),
        Key: imageRemoteName
      })
      .promise()
      .then((respo)=>{
      
        fs.unlink(`${DIR}/${data[0].originalname}`,(erro)=>{})
        let imgUrl = s3.getSignedUrl('getObject', { Bucket: BUCKET, Key: imageRemoteName })
       let image = { image: imgUrl}
       ResponseData.push(image)
       if(ResponseData.length == data.length)
       {
         response.status = 200;
         response.data = ResponseData
         cb(null, response)
       } 
       
    
      })
      .catch((error)=>{
        cb(error)
      })

      })

     } else {
     
       response.status = 400;
       response.data = []
       response.message = "File not recieved"
       cb(null,response)
     }


  }
}

function login(req, res,cb)
{
  const { email, phone, password } = req.body
  let response = {
    status: 0,
    data: {},
    message: ''
  }

 new Promise((resolve, reject)=>{
    waterfall([
      checkUser,
      userDetail
    ], (error, result)=>{
      error ? reject(error) : resolve(result)
    })
  })
  .then((resp)=>{
   
    res.json(resp)
  })
  .catch((erro)=>{
    
    res.json(erro)
  })

  function checkUser(cb)
  {
      
 con.query(`SELECT CONCAT(first_name,' ', last_name) as user_name, COALESCE(phone,'') as phone, COALESCE(email,'') as email, COALESCE(image, '') as image,
          user_verified, password, COALESCE(device_id, '') as device_id, COALESCE(device_type, '') as device_type from user WHERE email = ? OR phone = ? AND social_key is NULL  `,[email, phone],(error, getres)=>{
      error ? cb(error) : cb(null, getres)
    })
  }

 async function userDetail(data,cb) 
  {
      if(data.length == 0) {
          
        response.status = 204;
        response.message = `Wrong Email/Phone`

    } else {
           
            if (checkPassword(password, data[0].password)) {
           
              delete data[0].password
              // if(data[0].user_verified == 0){
              //   let OTP = randomNumber()
              //   if(phone ) {
              //     sendOTP(OTP, phone)
              //   } else {
              //     sendMail(email, OTP)
              //   }
           
                
              // await  con.query(`UPDATE user SET OTP = ? WHERE phone = ? OR email = ?`, [OTP, phone, email], (error, resp)=>{

              //   })

              //   response.status = 200;
              //   response.data = []
              //   response.message = "OTP has been sent to your mobile"

              // } else {

                let id;
                email ? id = email : id = phone

                const token = jwt.sign({id:id}, config.secret, { expiresIn: config.tokenLife});
                const refreshToken = jwt.sign({id:id}, config.refreshTokenSecret, { expiresIn: config.refreshTokenLife});
            
                response.status = 200;
                response.data = data[0]
                response.data.token = token
                response.data.refreshToken = refreshToken
                response.message = "User logged in successfully"

              //}
          } else {
              response.status = 204;
              response.message = "Wrong Password"
            }
    }

      cb(null, response)

  }
}

async function signup(req,res,cb)
{
    let { first_name, last_name, email, password, phone, unique_id, signup_type, device_id, device_type , social_media} = req.body

    let response = {
      status: 200,
      data: {},
      message: ""
    }

    new Promise((resolve, reject)=>{
      waterfall([
        checkUser,
        userDetails
      ], (error, result)=>{
        error ? reject(error) : resolve(result)
      })
    })
    .then((resp)=>{
      console.log(resp) 
      res.json(resp)
    })
    .catch((error)=>{
      console.log('Error',error);
      res.json(error)
    })


    function checkUser(cb)
    {
      if(signup_type == 0) {

        con.query(`SELECT CONCAT(first_name,' ', last_name) as user_name, COALESCE(phone, '') as phone, COALESCE(email, '') email, 
                  COALESCE(image, '') as image,social_key, COALESCE(device_id, '') as device_id, COALESCE(device_type, '') as device_type, 
                  social_media from user WHERE social_key = ? `,[unique_id], (erro, getRes)=>{

              if(erro) {
    
                cb(erro)
              } else {
               
                cb(null, getRes)
              }
        })

      } else {
             
      con.query(`SELECT CONCAT(first_name,' ', last_name) as user_name, COALESCE(phone, '') as phone, COALESCE(email, '') email, COALESCE(image, '') as image,
      COALESCE(device_id, '') as device_id, COALESCE(device_type, '') as device_type from user WHERE email = ? OR phone = ? `, [email, phone], (err, getuser)=>{
             err ? cb(err) : cb(null, getuser)
           })
      }
    }

    function userDetails(data, cb)
    {
      
      if(data.length == 0) {

      
       let OTP   = randomNumber()


        if(unique_id) {

          con.query(`SELECT signup_type, social_media, COALESCE(social_key, '') as social_key from user where   email = ? OR phone = ?`,[email, phone], (error, result)=>{
            if (error) cb(error)
             else {
              
               if(result.length > 0) {

                if(result[0].signup_type == 1) {

                  response.status = 403
                  response.message = "You already have account with this email/phone"

                } else {
                  response.status = 403
                  response.message = `You already have ${result[0].social_media} account with this email`
                 
                }

                cb(null, response)
               
              } else {

                
            let id = unique_id;
          
            con.query(`INSERT INTO user(first_name, last_name, email, phone ,  user_verified, social_key, otp, signup_type, device_id, device_type,social_media ) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,[first_name, last_name, email, phone,
                   1, unique_id, OTP, signup_type, device_id, device_type, social_media ], (error, insertedId)=>{

                  if(error) cb(error)
                  else {
                    
                       req.body.token = jwt.sign({id:id}, config.secret, { expiresIn: config.tokenLife});
                       req.body.refreshToken = jwt.sign({id:id}, config.refreshTokenSecret, { expiresIn: config.refreshTokenLife});
                      
                      delete req.body.password
                      delete req.body.unique_id
                      
                      response.status = 200;
                      response.data = req.body
                      response.message = "User registered successfully"
                     

                    cb(null, response)
                  }
                })
               }
              }
          })
         
        } else {
          let hashPassword =  hashingPassword(password)
          let OTP = randomNumber()

          con.query(`INSERT INTO user(first_name, last_name, email, phone , password,  otp) VALUES(?,?,?,?,?,?)`,[first_name, last_name, email, phone,
            hashPassword, OTP] ,(error, insertedId)=>{
            if(error) cb(error)
            else {

              if(phone) {

                sendOTP(OTP, phone)
             
              response.message = "OTP has been Sent to your number";
              

              } else {
                sendMail(email, OTP)
                response.message = "OTP has been Sent to your email";
              }
              res.json(response)
             
            }
          })
        }
}
      
      else if(data.length > 0 && unique_id) {

          delete req.body.unique_id

              con.query(`UPDATE user SET  ?  where social_key = ?`,[req.body, unique_id],(error, updateres)=>{
                if (error) cb(error)
                else {
                  
               req.body.token = jwt.sign({ id: data[0].social_key }, config.secret, { expiresIn: config.tokenLife});
               req.body.refreshToken = jwt.sign({id:data[0].social_key}, config.refreshTokenSecret, { expiresIn: config.refreshTokenLife});

              response.status = 200;
              response.data = req.body
              cb(null, response)

                }
              })  
      }
      
      else {
          response.status = 403;
          response.message = "User already exist";
          cb(null, response)
      }
      
    }


}

function forgetPassword(req, res,cb)
{
  const { phone, email } = req.body
    let response = {
      status: 0,
      data: {},
      message: ""
    }

        new Promise((resolve, reject)=>{

             con.query(`SELECT COUNT(*) as total from user WHERE email = ? OR phone = ?`, [email, phone], (error, result)=>{
                if(error){ console.log(error); reject(error)} 
                else {
                 
                  
                  if(result[0].total > 0) {
                
                    let OTP = randomNumber()
                      con.query(`UPDATE user SET otp = ? WHERE email = ? OR phone = ?`,[OTP, email, phone])
                    
                    response.status = 200;
                    
                    if(email) {
                      sendMail(email, OTP)
                      response.message = "OTP has been sent to your email"
                    } else {
                      sendOTP(OTP, phone)
                      response.message = "OTP has been sent to you phone"
                    }
                     
                  } else {
                        response.status = 403;
                        response.message = `Wrong Email/Phone`
                  }

                  resolve(response)

                }
              })
          
        })
        .then((resp)=>{
          res.json(resp)
        })
        .catch((error)=>{
          console.log('Error ==>', error)
          res.json(error)
        })
}

function verfiyOTP(req, res)
{
  const { phone, email, OTP } = req.body;
  let response = {
    status: 0,
    data: {},
    message: ""
  }

  new Promise((resolve, reject)=>{
   
    con.query(`SELECT otp from user WHERE phone = ? OR email = ?`, [phone, email], async (error, result)=>{
            if(error) reject(error)
            else {

              if(result.length > 0) {

                     
              if(result[0].otp == OTP) {

                let id;
                phone ? id = phone : id = email

              await  con.query(`UPDATE user SET user_verified = ? WHERE phone = ? OR email = ?`, [1, phone, email])
              const token = jwt.sign({id:id}, config.secret, { expiresIn: config.tokenLife});
              const refreshToken = jwt.sign({id:id}, config.refreshTokenSecret, { expiresIn: config.refreshTokenLife});
                response.status = 200;
               
                response.data.token = token
                response.data.refreshToken = refreshToken
                response.message = "User verfied"

              } else {
                response.status = 204;
                response.message = "You entered wrong OTP"
              }

              } else {
                response.status = 404;
                response.message = "Wrong Email/Number"
              }
               resolve(response)
            }
    })
    
  })
  .then((resp)=>{
    res.json(resp)
  })
  .catch((error)=>{
    res.json(error)
  })
}

function resetPassword(req,res)
{
    const { phone, email, password } = req.body;
    let response = {
        status: 200,
        data: {},
        message: ""
    }

    let bycrypt_password = hashingPassword(password)

    new Promise((resolve,reject)=>{

          con.query(`UPDATE user SET password= ? WHERE phone = ? OR email = ?`, [bycrypt_password, phone, email],(error, result)=>{
          if(error) reject(error)
          else {
            console.log(result)
            response.message = "Password updated"
            resolve(response)
          }
        })
 })
    .then((resp)=>{
      console.log(resp)
      res.json(resp)
    })
    .catch((error)=>{
      res.json(error.message)
    })

  }

function userInfo(req, res, cb)
{
  let token =  jwt.verify(req.headers['authorization'], config.secret);
 
  let response = {
        status: 200,
        data: {},
        message: ""
  }

  new Promise(( resolve, reject)=>{
    waterfall([
      checkUser,
      userDetails
    ], (error, result)=>{
      error ? reject(error) : resolve(result)
    })
  })
  .then((resp)=>{
    res.json(resp)
  })
  .catch((error)=>{
    response.status = 400
    response.message = error.message
    res.json(response)
  })

  function checkUser(cb)
  {
    con.query(`SELECT CONCAT(first_name,' ', last_name) as user_name, COALESCE(phone, '') as phone, COALESCE(email, '') email, COALESCE(image, '') as image,
    COALESCE(device_id, '') as device_id, COALESCE(device_type, '') as device_type, address from user WHERE email = ? OR phone = ? `, [token.id, token.id], (erro, user)=>{
      erro ? cb(erro) : cb(null, user)
    })

  }

  function userDetails(data, cb)
  {
      if(data.length > 0) {
      response.data = data[0]
} else {
        response.status = 403
        response.message = "User doesn't exist"
      }

      cb(null, response)

  }


}


async function refreshToken(req,res,cb) {

  let response = {
    status: 0,
    body: {},
    message: ""
  }

  const { refreshToken } = req.body


  try {

      let token = await  jwt.verify(refreshToken, config.refreshTokenSecret);
      
      con.query(`SELECT COUNT(*) as total from user where phone = ? or email = ?`,[token.id, token.id],(error,result)=>{

    if(result[0].total > 0) {
      const newtoken = jwt.sign({id: token.id}, config.secret, { expiresIn: config.tokenLife});
      const newrefreshToken = jwt.sign({id: token.id}, config.refreshTokenSecret, { expiresIn: config.refreshTokenLife});
  
      response.status = 200;
      response.token = newtoken;
      response.refreshToken = newrefreshToken
  
    } else {
          response.status = 400;
          response.message = "User not found"
    }
   
    res.json(response)
  })

   

  } catch(error) {
      
    response.status = 400
    response.message = error.message
    res.json(response)
  }



}

// function updateUserProfile(req, res,cb)
// {
//   let { first_name, last_name, email, phone, password, address, image, device_id, device_type	 } = req.body    
//   let response = {
//             status: 200,
//             data: {},
//             message: ""
//       }

//       let token = jwt.verify(req.headers['authorization'], config.secret);

//       new Promise((resolve, reject)=>{
//         waterfall([
//               checkUser,
//               updateUser
//         ], (error, result)=>{
//           error ? reject(error) : resolve(result)
//         })
//       })
//       .then((resp)=>{
//         res.json(resp)
//       })
//       .catch((erro)=>{
//         response.status = 400
//         response.message = erro.message
//         res.json(response)
//       })

//       function checkUser(cb)
//       {
//         con.query(`SELECT id, email, phone, COALESCE(password,'') as password from user WHERE phone = ? OR email = ? OR social_key =?`,[token.id, token.id, token.id],(error, getuser)=>{
//           error ? cb(error) : cb(null, getuser)
//         })
//       }

//       function updateUser(data, cb)
//       {
//         if(data.length >0) {

//             if(data[0].email == email || data[0].phone == phone) {
              
//               response.status = 403
//               response.message = "Email/phone is not available"

//             } else {

              
              
//                 if(password) {

//                   if(data[0].password !="" )
//             {

//             }
//              else if(data[0].password != password)
//             {
//                   response.status = 403
//                   response.message = "Password doesn't matched"
//             }
//             else if(data[0].password == password)
//             {


//               con.query(`UPDATE user SET ? where id = ?`,[req.body, data[0].id])
//             }

//                 } else {

//                   con.query(`UPDATE user SET ? where id = ?`,[req.body, data[0].id])

//                 }

            

//             }

//      } else {
//           response.status = 403
//           response.message = "No record found"
//         }

//         cb(null, response)

//       }


// }