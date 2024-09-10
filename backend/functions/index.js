const v2 = require('firebase-functions/v2');
const admin = require('firebase-admin');
admin.initializeApp();

exports.scoretodb = v2.https.onRequest({ cors: true }, async (req, res) => {
	// Allow only POST requests
	if (req.method !== 'POST') {
		// 405 Method Not Allowed
		return res.status(405).send(`
            <h1>405 - Method Not Allowed</h1>
            <img src="https://http.cat/405" alt="405 - Method Not Allowed">
        `);
	}

	// Extract the data from the request body
	const { username, high_score } = req.body;

	// Validate the incoming data
	if (!username || !high_score || isNaN(high_score)) {
		// 400 Bad Request
		return res.status(400).send(`
            <h1>400 - Bad Request</h1>
            <img src="https://http.cat/400" alt="400 - Bad Request">
        `);
	}
	try {
		// Reference to the Realtime Database 'players' node
		const playerRef = admin
			.database()
			.ref(`/pimmelbude/players/${username}`);

		// Write the high score to the database (update or insert)
		await playerRef.set({
			username: username,
			high_score: parseInt(high_score), // Ensure high_score is stored as an integer
			timestamp: admin.database.ServerValue.TIMESTAMP, // Add a server-side timestamp
		});

		// Send a success response with a cat for 200 OK
		return res.status(200).send(`
            <h1>200 - Success</h1>
            <img src="https://http.cat/200" alt="200 - Success">
        `);
	} catch (error) {
		console.error('Error writing to the database:', error);
		// 500 Internal Server Error
		return res.status(500).send(`
            <h1>500 - Internal Server Error</h1>
            <img src="https://http.cat/500" alt="500 - Internal Server Error">
        `);
	}
});
