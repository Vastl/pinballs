const v2 = require('firebase-functions/v2');

exports.scoretodb = v2.https.onRequest({ cors: true }, (req, res) => {
	try {
		console.log(`received request: ${req.body}`);
		return res.status(200).json({
			message: 'This is Answer',
		});
	} catch (error) {
		console.log(`Error: ${error}`);
		return res.status(401).json({ error: 'Something went wröng' });
	}
});
