const smtpDetails = require('./cofig-smtp.json')
var nodemailer = require('nodemailer')

module.exports =  async function sendMail(to, OTP ) {
    let transporter = await nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "total08spotify@gmail.com",
        pass: "2020Total8T!"
      },
          logger: true,
          debug: true
    })
    
    
    let info = await transporter.sendMail({
      from: "info@total8t.com", // sender address
      to: to, // list of receivers
      subject: "OTP VERIFICATION", // Subject line
      html: `<b>This is you OTP: ${OTP} </b>` // html body
    });
  
    console.log("mail sent!")
    
  }


  
  
  