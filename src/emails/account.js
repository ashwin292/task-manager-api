const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeMail = (email, name) => {
    sgMail.send({
        to:email,
        from:'ashjsr60@gmail.com',
        subject: 'Thanks for Registering with us',
        text: `Welcome to the App, ${name}. Let me know how was your experience`
    })
}

const sendCancellationMail = (email, name) => {
    sgMail.send({
        to:email,
        from:'ashjsr60@gmail.com',
        subject: 'Cancellation Confirmation',
        text: `Hi ${name}. Sorry to see you go. Can you reply with the reason for cancellation`
    })
}

module.exports = {
    sendWelcomeMail,
    sendCancellationMail
}