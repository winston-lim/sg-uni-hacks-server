const sgMail = require("@sendgrid/mail");

export async function sendEmail(to: string, subject: string, html: string) {
	sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
	const msg = {
		from: "suh.help@gmail.com", // sender address
		to, // list of receivers
		subject, // Subject line
		html,
	};
	try {
		await sgMail.send(msg);
		console.log("EMAIL SENT");
	} catch (e) {
		console.log("ERROR SENDING MAIL: ", e.response.body);
	}
}
