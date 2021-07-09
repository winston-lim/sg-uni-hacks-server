import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, html: string) {
	let testAccount = await nodemailer.createTestAccount();
	console.log("testAccount", testAccount);
	let transporter = nodemailer.createTransport({
		host: "smtp.ethereal.email",
		port: 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: "apwhqrvck7fvc2nf@ethereal.email", // generated ethereal user
			pass: "4zgUa5NGw46nwHjKnK", // generated ethereal password
		},
	});

	// send mail with defined transport object
	let info = await transporter.sendMail({
		from: '"Fred Foo 👻" <foo@example.com>', // sender address
		to, // list of receivers
		subject, // Subject line
		html,
	});

	console.log("Message sent: %s", info.messageId);
	console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}
