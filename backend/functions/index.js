const v2 = require('firebase-functions/v2');
const admin = require('firebase-admin');
admin.initializeApp();

exports.scoretodb = v2.https.onRequest(
	{ cors: true, secrets: ['API_KEY'] },

	async (req, res) => {
		const API_KEY = process.env.API_KEY;

		// Allow only POST requests
		if (req.method !== 'POST') {
			console.log('405 Method Not Allowed');
			// 405 Method Not Allowed
			return res.status(405).send(`
            <h1>405 - Method Not Allowed</h1>
            <img src="https://http.cat/405" alt="405 - Method Not Allowed">
        `);
		}

		const requestApiKey = req.headers['Authorization'];
		if (!requestApiKey || requestApiKey !== API_KEY) {
			// If the API key is missing or incorrect, return a 403 Forbidden response
			console.log('403 Forbidden - Invalid API Key');
			return res.status(403).send(`
				<h1>403 - Forbidden</h1>
				<img src="https://http.cat/403" alt="403 - Forbidden">
			`);
		}

		// Extract the data from the request body
		const { uuid, username, high_score } = req.body;

		// Validate the incoming data
		if (!uuid || !username || !high_score || isNaN(high_score)) {
			// 400 Bad Request
			console.log('400 Bad Request');
			return res.status(400).send(`
            <h1>400 - Bad Request</h1>
            <img src="https://http.cat/400" alt="400 - Bad Request">
        `);
		}
		// Escape the input values to prevent HTML injection
		const escapedUsername = escapeHTML(username);
		const escapedHighScore = escapeHTML(high_score.toString());

		try {
			// Reference to the Realtime Database 'players' node
			const playerRef = admin
				.database()
				.ref(`/pimmelbude/players/${uuid}`);

			// Initialize association as undefined (so it won't be set if no pattern matches)
			let association;

			// Check for specific strings in the username and remove them
			if (escapedUsername.includes('#PML')) {
				escapedUsername = escapedUsername.replace('#PML', '').trim(); // Remove #PML and trim whitespace
				association = 'PML'; // Set association to PML
			} else if (escapedUsername.includes('#COM')) {
				escapedUsername = escapedUsername.replace('#COM', '').trim(); // Remove #COM and trim whitespace
				association = 'COM'; // Set association to COM
			}

			// Prepare the data object for update
			const updateData = {
				uuid: uuid,
				username: escapedUsername,
				high_score: parseInt(escapedHighScore), // Ensure high_score is stored as an integer
				timestamp: admin.database.ServerValue.TIMESTAMP, // Add a server-side timestamp
			};
			// Only add the association field if it was set (i.e., if #PML or #COM was found)
			if (association) {
				updateData.association = association;
			}

			// Write the data to the database (update or insert)
			await playerRef.update(updateData);

			console.log('200 OK');
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

		// Helper function to escape HTML characters
		function escapeHTML(str) {
			return str.replace(/[&<>"']/g, function (match) {
				const escapeMap = {
					'&': '&amp;',
					'<': '&lt;',
					'>': '&gt;',
					'"': '&quot;',
					"'": '&#39;',
				};
				return escapeMap[match];
			});
		}
	}
);
