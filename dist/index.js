// Import Firebase libraries
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js';
import {
	getDatabase,
	ref,
	onValue,
} from 'https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.1.0/firebase-analytics.js';

// Your Firebase configuration
const firebaseConfig = {
	apiKey: 'AIzaSyBaEhQNS8CDHSNWn7ld_zWkyoM_p3SCV4',
	authDomain: 'pml-pinballs.firebaseapp.com',
	databaseURL:
		'https://pml-pinballs-default-rtdb.europe-west1.firebasedatabase.app',
	projectId: 'pml-pinballs',
	storageBucket: 'pml-pinballs.appspot.com',
	messagingSenderId: '817920452729',
	appId: '1:817920452729:web:ca42ddb3bd9779f8b10ca8',
	measurementId: 'G-T8P6NQ9BGX',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Database
const database = getDatabase(app);

// Function to fetch and display player data in real-time
function fetchAndDisplayPlayerData() {
	// Get the reference to the 'players' node
	const playersRef = ref(database, 'pimmelbude/players');

	// Listen for changes to the data in real-time
	onValue(playersRef, (snapshot) => {
		const players = snapshot.val();

		// Get the table container
		const tableContainer = document.getElementById('table');
		const searchInput = document.querySelector('#search input');

		// Function to filter and display the players
		function displayFilteredPlayers(filterText = '') {
			// Create table element
			let table =
				'<table><tr><th>Rank</th><th>Player Name</th><th>Score</th><th>Timestamp</th></tr>';

			// Sort the players by high score and filter by player name
			let rank = 1;
			const sortedPlayers = Object.values(players)
				.sort((a, b) => b.high_score - a.high_score)
				.filter((player) =>
					player.username
						.toLowerCase()
						.includes(filterText.toLowerCase())
				);

			// Loop through the filtered data
			sortedPlayers.forEach((player) => {
				const timestamp = player.timestamp
					? new Date(player.timestamp).toLocaleString()
					: 'N/A';
				const formattedHighScore = player.high_score.toLocaleString();

				table += `<tr>
                            <td>${rank}</td>
                            <td>${player.username}</td>
                            <td>${formattedHighScore}</td>
                            <td>${timestamp}</td>
                          </tr>`;
				rank++;
			});

			table += '</table>';

			// Insert the table into the table container
			tableContainer.innerHTML = table;
		}

		// Initial display of all players
		displayFilteredPlayers();

		// Listen for input changes on the search field
		searchInput.addEventListener('input', (event) => {
			const searchText = event.target.value;
			displayFilteredPlayers(searchText); // Call the filtering function with the current input
		});
	});
}

// Call the function when the page loads
window.onload = fetchAndDisplayPlayerData;
