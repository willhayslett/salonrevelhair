
const express = require('express');

const router = new express.Router();

const nodemailer = require('nodemailer');
let transporter = nodemailer.createTransport('smtps://salonrevelhair%40gmail.com:0b7t5Vxh2Ryj@smtp.gmail.com');



router.post('/', (req, res, next) => {
  if (!req) {
    console.log('request doesn\'t contain any data!');
    res.status(500);
  }
  console.log('made it to make appointment')
  console.log(req.body);

  let preHtml = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <html xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"> <!-- utf-8 works for most cases -->
                <meta name="viewport" content="width=device-width"> <!-- Forcing initial-scale shouldn't be necessary -->
                <meta http-equiv="X-UA-Compatible" content="IE=edge"> <!-- Use the latest (edge) version of IE rendering engine -->
                <meta name="x-apple-disable-message-reformatting">  <!-- Disable auto-scale in iOS 10 Mail entirely -->
                <title>Salon Revel Hair</title> <!-- The title tag shows in email notifications --><!-- CSS Reset --> <style> /* 
                What it does: Stops email clients resizing small text. */ * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; } /* What it does: Centers 
                email on Android 4.4 */ div[style*="margin: 16px 0"] { margin:0 !important; } /* What it does: Stops Outlook from adding extra spacing to tables. */ 
                table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }  
                </style></head><body><table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable">
                <tr> <td align="center" valign="top"> <table border="0" cellpadding="20" cellspacing="0" width="600" id="emailContainer"> <tr> <td align="center" valign="top"> 
                <table border="0" cellpadding="20" cellspacing="0" width="100%" style="background-color:#8D6E63; font-size:40px; font-weight:bold" id="emailHeader"> <tr> <td align="center" valign="top"> Salon Revel 
                </td> </tr> </table> </td> </tr><tr> <td align="center" valign="top">`;
  let postHtml = '</td> </tr> </table> </td> </tr> </table></body></html>';
  let name = req.body.AppointmentFullName;
  let email = req.body.AppointmentEmail;
  let contactNumber = req.body.AppointmentContactNumber;
  let appointmentDate = req.body.AppointmentDate ? req.body.AppointmentDate : false;
  let appointmentMobileDate = req.body.AppointmentMobileDate ? req.body.AppointmentMobileDate : false;
  let appointmentTime = req.body.AppointmentTime;
  let message = req.body.AppointmentMessage;
  //set our mail object attributes
  let subject = 'New Inquiry/Appointment Request From SalonRevelHair.com';
  html = `<b>You've got a new inquiry from salonrevelhair.com. Details below: <b>
        </br></br>
        Name: ${name}</br>
        Email: ${email}</br>
        Contact Number: ${contactNumber}</br>
        Appointment Date: ` + getAppointmentDate() + `</br>
        Message: ${message}</br>`;
  text = `You've got a new inquiry from salonrevelhair.com. Details below: `;

  console.log(html);
  let mailOptions = {
    from: "Webmaster @ Salon Revel ✔ <webmaster@salonrevelhair.com>", // sender address
    to: "salonrevel615@gmail.com", // list of receivers
    bcc: "will.hayslett@gmail.com",
    subject: subject, // Subject line
    text: text, // plaintext body
    html: preHtml + html + postHtml// html body
  };
  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info){
    if(error){
        return console.log(error);
    }
    console.log('Message sent: ' + info.response);
    res.status(200);
  });

  function getAppointmentDate(){
    if(appointmentDate && appointmentTime){
      return appointmentDate + ' @' + appointmentTime; 
    } else if(appointmentMobileDate && appointmentTime){
      return appointmentMobileDate + ' @' + appointmentTime;
    } else if((appointmentDate || appointmentMobileDate) && !appointmentTime){
      return appointmentDate ? appointmentDate : appointmentMobileDate;
    } else {
      return 'No date or time provided.';
    }
  }

});

module.exports = router; //export our routes