/**
 * @summary sendmail.js contains our sendmail functions. 
 * @description sendmail handles sending all emails from our application.
 * @version 1.0 
 * External Dependencies: nodemailer.js
 * Internal Dependencies: none
 */

/**
 * Nodemailer is a module for Node.js applications to allow easy as cake email sending. 
 * @external "nodemailer"
 * @see {@link https://github.com/nodemailer/nodemailer} for more information.
 */
const nodemailer = require('nodemailer');

/**
 * logger is an instance of our winston logger for use throughout the application 
 */
const logger = require('./logger.js'); 

let logMeta = {};
logMeta.sourceFile = 'sendmail.js';

let timer; //used to time our query executions


module.exports = {
  
  /**
   * sendmail function used for sending business emails to system users 
   */
  sendMail: function(mailOptions){
    logger.info('sendMail()', logMeta);
    // Create the transporter with the required configuration
    const transporter = nodemailer.createTransport({
      host: 'mail1.newcorp.com', //"glbsmtp.int.asurion.com", // new asurion global smtp host
      port: 25,
      ignoreTLS: true, //no authentication required
    });

    // verify connection configuration
    transporter.verify(function(error, success) {
      if (error) {
        logMeta.error = error;
        logger.error('error getting connection to smtp server', logMeta);
      } else {
        logger.info('connection to smtp server established', logMeta);
      }
    });

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
      if(error){
        logMeta.error = error;
        logger.error('error sending email message', logMeta);
      } else {
        logger.info('Message sent: ' + info.response, logMeta);
      }
    });

  },

  sendError: function(errorDetails, context){
    //log
    logger.info('sendMail()', logMeta);
    //check environment to get from field
    let from = '"FRM Odin ' + process.env.NODE_ENV.toUpperCase() + '" <FRM_ODIN_' + process.env.NODE_ENV.toUpperCase() + '@asurion.com>';
    //initialize remaining vars
    let toRecipients = '';
    let ccRecipients = '';
    let subject = '';
    let text = '';
    let html = '';
    let bodyAlign = (context == 'query') ? 'center' : 'left';
    let preHtml = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                  <html xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"> <!-- utf-8 works for most cases -->
                  <meta name="viewport" content="width=device-width"> <!-- Forcing initial-scale shouldn't be necessary -->
                  <meta http-equiv="X-UA-Compatible" content="IE=edge"> <!-- Use the latest (edge) version of IE rendering engine -->
                  <meta name="x-apple-disable-message-reformatting">  <!-- Disable auto-scale in iOS 10 Mail entirely -->
                  <title>Message From FRM Odin</title> <!-- The title tag shows in email notifications --><!-- CSS Reset --> <style> /* 
                  What it does: Stops email clients resizing small text. */ * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; } /* What it does: Centers 
                  email on Android 4.4 */ div[style*="margin: 16px 0"] { margin:0 !important; } /* What it does: Stops Outlook from adding extra spacing to tables. */ 
                  table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }  
                  </style></head><body><table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable">
                  <tr> <td align="center" valign="top"> <table border="0" cellpadding="20" cellspacing="0" width="600" id="emailContainer"> <tr> <td align="center" valign="top"> 
                  <table border="0" cellpadding="20" cellspacing="0" width="100%" style="background-color:#0097a7; font-size:40px; font-weight:bold" id="emailHeader"> <tr> <td align="center" valign="top"> FRM | Odin 
                  </td> </tr> </table> </td> </tr><tr> <td align="${bodyAlign}" valign="top">`;
    let postHtml = '</td> </tr> </table> </td> </tr> </table></body></html>';

    if(context == 'query'){
      //set our recipients
      toRecipients = errorDetails.userData.email;
      ccRecipients = 'will.hayslett@asurion.com';
      //set an index for our id row in the table
      let tableIndex = 0;
      //set our mail object attributes
      subject = 'FRM ODIN: Error Encountered While Executing Query';
      html = '<b>An error has occurred while executing your request in FRM Odin. Details below: <b>' +
            '</br></br>' + 
            '<table border="1" cellpadding="0" cellspacing="0" width="750px" style="border:1px solid #333">' +
            '<tr> <th style="padding:5px;">Number</th> <th width="500" style="padding:5px">Attempted SQL</th> <th width="250" style="padding:5px">Error</th> </tr>';
      text = 'An error has occurred while executing your request in FRM Odin. Details below: ';
      for(let i = 0; i < errorDetails.length; i ++ ){
        if(errorDetails[i].error){
          tableIndex ++;
          html += '<tr><td style="padding:5px;">' + tableIndex + '</td> <td width="500" style="padding:5px; word-break:break-all;">' + errorDetails[i].sql + '</td> <td width="250" style="padding:5px">' + errorDetails[i].error + '</td> </tr>';
          text += tableIndex + '. SQL: ' + errorDetails[i].sql + '</br> &emsp; Error: ' + errorDetails[i].error + '</br></br>'; 
        }
      }
    } else {
      //system error email, set our mail object attributes
      toRecipients = (process.env.NODE_ENV == 'local' ) ? 'will.hayslett@asurion.com' : 'HorizonCEP@asurion.com'; 
      ccRecipients = '';
      subject = 'FRM ODIN ' + process.env.NODE_ENV.toUpperCase() + ' WARNING';
      html = '<b>A system error has occurred in FRM Odin. Details below: <b/>' +
            '</br></br>' + 
            '<table border="1" cellpadding="0" cellspacing="0" width="750px" style="border:1px solid #333">';
      text = 'A system error has occurred in FRM Odin. Details below: &emsp;';

      //loop through our error object and map the key values to our html table
      if(typeof errorDetails === 'object'){
      //remove potential PII if encrypt flag is true
      process.env.ENCRYPT_FLAG === 'true' && errorDetails.sql ? delete errorDetails.sql : false; 
      for (let key in errorDetails) {
        //shouldn't have any prototypical properties, but just in case
        if (errorDetails.hasOwnProperty(key)) {
          //if the property is an object, loop through it so we can see the value
          if(typeof errorDetails[key] == 'object'){
            html += '<tr><td style="padding:5px;">' + key + '</td><td width="500" style="padding:5px; word-break:break-all;">';
            text += key + ': ';
            let nestedObj = JSON.stringify(errorDetails[key]);
            //for (subKey in nestedObj){
            //add the object value to our html
            html += nestedObj + '</td></tr>';
            text += nestedObj + '</br> &emsp;</br></br>';
            //}
          } else {
            html += '<tr><td style="padding:5px;">' + key + '</td> <td width="500" style="padding:5px; word-break:break-all;">' + errorDetails[key] + '</td></tr>';
            text += key + ': ' + errorDetails[key] + '</br> &emsp;</br></br>';
          }
        }
      }
      } else {
        html += '<tr><td style="padding:5px;">' + 'error' + '</td> <td width="500" style="padding:5px; word-break:break-all;">' + errorDetails + '</td></tr>';
        text += 'error: ' + errorDetails + '</br> &emsp;</br></br>';
      }
    }

    //setup out opts
    let mailOptions = {
      from: from, // sender address (who sends)
      to: toRecipients, // list of to receivers (who receives)
      cc: ccRecipients, // list of to receivers (who receives)
      subject: subject, // Subject line
      text: text, // plaintext body
      // html body
      html: preHtml + html + postHtml,
    }
    // Create the transporter with the required configuration
    const transporter = nodemailer.createTransport({
      host: 'mail1.newcorp.com', //"glbsmtp.int.asurion.com", // new asurion global smtp host
      port: 25,
      ignoreTLS: true, //no authentication required
    });

    // verify connection configuration
    transporter.verify(function(error, success) {
      if (error) {
        logMeta.error = error;
        logger.error('error getting connection to smtp server', logMeta);
      } else {
        logger.info('connection to smtp server established', logMeta);
      }
    });

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
      if(error){
        logMeta.error = error;
        logger.error('error sending email message', logMeta);
      } else {
        logger.info('Message sent: ' + info.response, logMeta);
      }
    });

  },
  //sendCancelMail for our cancelation service
  sendCancelMail: function(cancelationDetails){
    //log
    logger.info('sendCancelMail()', logMeta);
    let results = cancelationDetails.resultsList;
    //check environment to get from field
    let from = '"FRM Odin ' + process.env.NODE_ENV.toUpperCase() + '" <FRM_ODIN_' + process.env.NODE_ENV.toUpperCase() + '@asurion.com>';
    //initialize remaining vars
    let toRecipients = cancelationDetails.email;
    let ccRecipients = process.env.NODE_ENV === 'prod' ? cancelationDetails.managerEmails : ''; 
    let subject = 'FRM Odin ' + process.env.NODE_ENV.toUpperCase() + ' Bulk Cancelation Service Results';
    let text = '';
    let html = '';
    let bodyAlign = 'left';
    let preHtml = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                  <html xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"> <!-- utf-8 works for most cases -->
                  <meta name="viewport" content="width=device-width"> <!-- Forcing initial-scale shouldn't be necessary -->
                  <meta http-equiv="X-UA-Compatible" content="IE=edge"> <!-- Use the latest (edge) version of IE rendering engine -->
                  <meta name="x-apple-disable-message-reformatting">  <!-- Disable auto-scale in iOS 10 Mail entirely -->
                  <title>Message From FRM Odin</title> <!-- The title tag shows in email notifications --><!-- CSS Reset --> <style> /* 
                  What it does: Stops email clients resizing small text. */ * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; } /* What it does: Centers 
                  email on Android 4.4 */ div[style*="margin: 16px 0"] { margin:0 !important; } /* What it does: Stops Outlook from adding extra spacing to tables. */ 
                  table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }  
                  </style></head><body><table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable">
                  <tr> <td align="center" valign="top"> <table border="0" cellpadding="20" cellspacing="0" width="600" id="emailContainer"> <tr> <td align="center" valign="top"> 
                  <table border="0" cellpadding="20" cellspacing="0" width="100%" style="background-color:#0097a7; font-size:40px; font-weight:bold" id="emailHeader"> <tr> <td align="center" valign="top"> FRM | Odin 
                  </td> </tr> </table> </td> </tr><tr> <td align="${bodyAlign}" valign="top">`;
    let postHtml = '</td> </tr> </table> </td> </tr> </table></body></html>';

    //set an index for our id row in the table
    let tableIndex = 0;
    //set our mail object attributes
    html = '<b>The Bulk Cancelation Request initiated in Odin has completed. Details are below: <b>' +
          '</br></br>' + 
          '<b>Number of claim cancelations attempted: <b>' + cancelationDetails.fullCount + '</br>' +
          '<b>Number of claims successfully canceled: <b>' + cancelationDetails.successCount + '</br>' +
          '<b>Number of failed claim cancelations: <b>' + cancelationDetails.failureCount + '</br></br>' +
          '<b>CSV Upload Id: <b>' + results[0].correlationId + '</br></br>' 
          
    html += cancelationDetails.failureCount > 0 ?  
          '<b>Details of the failures are listed below: <b>' + 
          '</br></br>' + 
          '<table border="1" cellpadding="0" cellspacing="0" width="750px" style="border:1px solid #333">' +
          '<tr> <th style="padding:5px;">Number</th> <th width="500" style="padding:5px">Customer Case Number</th>' + 
          '<th width="500" style="padding:5px">Service Request Number (if retrieved)</th><th width="250" style="padding:5px">Error</th> </tr>'
          : '';
    text = 'The Bulk Cancelation Request initiated in Odin has completed. Details of the operation are below: ';
    
    if (cancelationDetails.failureCount > 0 ){
      let SRNumber;
      for(let i = 0; i < results.length; i ++ ){
        if((results[i].error || results[i].successfulResult == false)){
          SRNumber = results[i].serviceRequestNumber ? results[i].serviceRequestNumber : ''; 
          tableIndex ++;
          html += '<tr><td style="padding:5px;">' + tableIndex + 
                  '</td> <td width="500" style="padding:5px">' + results[i].CUSTOMERCASENUMBER +
                  '</td> <td width="500" style="padding:5px">' + SRNumber +                   
                  '</td> <td width="250" style="padding:5px">' + 
                    results[i].error.businessMessage + '</br> ' + 
                    results[i].sysError + '</br> ' + 
                    results[i].apiError + '</td> ' + 
                  '</tr>';
          text += tableIndex + '. Customer Case Number: ' + results[i].CUSTOMERCASENUMBER + '</br> &emsp; Error: ' + results[i].error.businessMessage + '</br></br>'; 
        }
      }
    }

    //setup out opts
    let mailOptions = {
      from: from, // sender address (who sends)
      to: toRecipients, // list of to receivers (who receives)
      cc: ccRecipients, // list of to receivers (who receives)
      subject: subject, // Subject line
      text: text, // plaintext body
      // html body
      html: preHtml + html + postHtml,
    }
    // Create the transporter with the required configuration
    const transporter = nodemailer.createTransport({
      host: 'mail1.newcorp.com', //"glbsmtp.int.asurion.com", // new asurion global smtp host
      port: 25,
      ignoreTLS: true, //no authentication required
    });

    // verify connection configuration
    transporter.verify(function(error, success) {
      if (error) {
        logMeta.error = error;
        logger.error('error getting connection to smtp server', logMeta);
      } else {
        logger.info('connection to smtp server established', logMeta);
      }
    });

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
      if(error){
        logMeta.error = error;
        logger.error('error sending email message', logMeta);
      } else {
        logger.info('Message sent: ' + info.response, logMeta);
      }
    });

  }

}
