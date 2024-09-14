const v2 = require('firebase-functions/v2');
const admin = require('firebase-admin');
admin.initializeApp();

exports.scoretodb = v2.https.onRequest(
	{
		cors: ['https://pimmelbude.net', 'http://churchofmarble.org'],
		secrets: ['API_KEY'],
	},

	async (req, res) => {
		// Allow only POST requests
		if (req.method !== 'POST') {
			console.log('405 Method Not Allowed');
			// 405 Method Not Allowed
			return res.status(405).json({
				status: 405,
				message: 'Method Not Allowed',
				image: 'https://http.cat/405',
			});
		}

		// If the API key is missing or incorrect, return a 403 Forbidden response
		const API_KEY = process.env.API_KEY;
		const requestApiKey = req.headers['authorization'];
		if (!requestApiKey || requestApiKey !== API_KEY) {
			console.log('403 Forbidden - Invalid API Key');
			return res.status(403).json({
				status: 403,
				message: 'Forbidden - Invalid API Key',
				image: 'https://http.cat/403',
			});
		}

		// Extract the data from the request body
		const { uuid, username, high_score } = req.body;

		// Validate the incoming data
		if (!uuid || !username || !high_score) {
			// 400 Bad Request
			console.log('400 Bad Request - Missing required fields');
			return res.status(400).json({
				status: 400,
				message: 'Bad Request - Missing required fields',
				image: 'https://http.cat/400',
			});
		}

		function isValidUUID(uuid) {
			const uuidRegex =
				/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			return uuidRegex.test(uuid);
		}

		// Validate UUID format
		if (!isValidUUID(uuid)) {
			console.log('400 Bad Request - Invalid UUID format');
			return res.status(400).json({
				status: 400,
				message: 'Bad Request - Invalid UUID format',
				image: 'https://http.cat/400',
			});
		}

		function isValidHighScore(high_score) {
			const score = parseInt(high_score, 10);
			const MAX_SCORE = 125000000; // 125 million
			return Number.isInteger(score) && score >= 0 && score <= MAX_SCORE;
		}

		// Validate high_score is a non-negative integer
		if (!isValidHighScore(high_score)) {
			console.log('400 Bad Request - Invalid high_score');
			return res.status(400).json({
				status: 400,
				message: 'Bad Request - Invalid high_score',
				image: 'https://http.cat/400',
			});
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

		// Escape the input values to prevent HTML injection
		let escapedUsername = escapeHTML(username);
		const escapedHighScore = parseInt(
			escapeHTML(high_score.toString()),
			10
		);

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

		try {
			// Reference to the Realtime Database 'players' node
			const playerRef = admin
				.database()
				.ref(`/pimmelbude/players/${uuid}`);

			// Get the current data for this uuid
			const snapshot = await playerRef.once('value');
			const existingData = snapshot.val();

			// If the high_score already exists and is the same, don't update
			if (existingData && existingData.high_score === escapedHighScore) {
				console.log('200 OK - Score already exists, no update needed');
				return res.status(200).json({
					status: 200,
					message: 'Score already exists, no update needed',
					image: 'https://http.cat/200',
				});
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
			return res.status(200).json({
				status: 200,
				message: 'Success',
				image: 'https://http.cat/200',
			});
		} catch (error) {
			console.error('Error writing to the database:', error);
			// 500 Internal Server Error
			return res.status(500).json({
				status: 500,
				message: 'Internal Server Error',
				image: 'https://http.cat/500',
			});
		}
	}
);
